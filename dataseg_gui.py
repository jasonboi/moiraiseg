from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import webbrowser
from dataclasses import dataclass
from pathlib import Path
from typing import Callable
from urllib.parse import urlencode

import tkinter as tk
from tkinter import filedialog, messagebox, ttk


TOOL_ROOT = Path(__file__).resolve().parent
CONFIG_PATH = TOOL_ROOT / "config.json"
CLI_PATH = TOOL_ROOT / "dataseg.py"
DEFAULT_ENVIRONMENT = "usdia-seg"
DEFAULT_CONFIG = {
    "schema_version": 1,
    "raw_data_dir": "",
    "output_dir": "",
    "sam2_before_frames": 4,
    "sam2_after_frames": 16,
    "vessel_only": True,
    "sam2_device": "auto",
    "conda_env": DEFAULT_ENVIRONMENT,
    "port": 8767,
}
MODE_TO_VALUE = {
    "仅血管": "vessel",
    "血管与肿瘤": "both",
}
ENGLISH_MODE_TO_VALUE = {
    "Vessel only": "vessel",
    "Vessel and lesion": "both",
}
VALUE_TO_MODE = {value: label for label, value in MODE_TO_VALUE.items()}
GUI_ENGLISH = {
    "English": "中文",
    "DataSeg 启动器": "DataSeg Launcher",
    "血管与肿瘤数据标定启动器": "Vessel and Lesion Annotation Launcher",
    "在这里配置项目并管理本地服务，标定操作仍在浏览器中完成。": (
        "Configure the project and local service here. Annotation opens "
        "in your browser."
    ),
    "检查中": "Checking",
    "项目配置": "Project settings",
    "待处理原始数据": "Source data",
    "处理后数据目录": "Output directory",
    "SAM2 向前": "SAM2 before",
    "SAM2 向后": "SAM2 after",
    "标注模式": "Annotation mode",
    "运行设备": "Device",
    "本地端口": "Local port",
    "Conda 环境": "Conda environment",
    "检查环境": "Check environment",
    "保存配置": "Save settings",
    "保存并启动": "Save and start",
    "打开标定页面": "Open annotation page",
    "关闭服务": "Stop service",
    "运行信息": "Runtime information",
    "启动器已就绪。先选择输入和输出目录，再点击“保存并启动”。": (
        "The launcher is ready. Select the source and output folders, "
        "then click “Save and start”."
    ),
    "选择文件夹": "Choose folder",
    "选择待处理原始数据文件夹": "Choose the source data folder",
    "选择处理后数据文件夹": "Choose the output folder",
    "处理中": "Working",
    "当前已有任务正在执行。": "Another task is already running.",
    "操作完成": "Operation completed",
    "操作失败": "Operation failed",
    "DataSeg 操作失败": "DataSeg operation failed",
    "配置无效": "Invalid settings",
    "准备数据并启动": "Prepare data and start",
    "端口无效": "Invalid port",
    "请填写正确的本地端口。": "Enter a valid local port.",
    "服务尚未启动。": "The service is not running.",
    "运行中 · 其他输出": "Running · different output",
    "已停止": "Stopped",
    "请等待当前操作完成。": "Wait for the current operation to finish.",
    "退出 DataSeg 启动器": "Exit DataSeg Launcher",
    "DataSeg 服务仍在运行。\n\n选择“是”关闭服务并退出。\n选择“否”保留服务并退出。": (
        "The DataSeg service is still running.\n\n"
        "Choose Yes to stop the service and exit.\n"
        "Choose No to leave the service running and exit."
    ),
    "请检查传播帧数、标注模式和端口": (
        "Check the propagation frame counts, annotation mode, and port."
    ),
    "处理后目录不能与原始目录相同，也不能放在其内部": (
        "The output directory must be separate from the source directory."
    ),
    "SAM2 向前传播帧数必须在 0 到 32 之间": (
        "The SAM2 previous-frame range must be between 0 and 32."
    ),
    "SAM2 向后传播帧数必须在 0 到 32 之间": (
        "The SAM2 following-frame range must be between 0 and 32."
    ),
    "标注模式无效": "The annotation mode is invalid.",
    "SAM2 设备无效": "The SAM2 device is invalid.",
    "端口必须在 1024 到 65535 之间": (
        "The port must be between 1024 and 65535."
    ),
    "Conda 环境名不能为空，也不能包含空格": (
        "The Conda environment name cannot be empty or contain spaces."
    ),
}
UI_FONT_FAMILY = "Microsoft YaHei UI"
LOG_FONT_SIZE = 11
UI_COLORS = {
    "canvas": "#0b1019",
    "surface": "#121a27",
    "surface_soft": "#161f2d",
    "surface_muted": "#1b2636",
    "ink": "#f5f7fb",
    "ink_secondary": "#d8deea",
    "muted": "#a8b3c4",
    "faint": "#78869c",
    "hairline": "#243145",
    "hairline_strong": "#35445c",
    "primary": "#4d9cf6",
    "primary_active": "#2f7fdc",
    "primary_soft": "#142d4a",
    "vessel": "#35c8d7",
    "success": "#61d17a",
    "success_soft": "#173522",
    "warning": "#f0aa4f",
    "warning_soft": "#3a2d18",
    "danger": "#ff7c82",
    "danger_soft": "#3a2027",
    "danger_hover": "#4a2730",
    "danger_active": "#572c35",
    "canvas_dark": "#070a10",
    "canvas_dark_soft": "#0d121b",
}


def translate_gui_text(value: str) -> str:
    if value in GUI_ENGLISH:
        return GUI_ENGLISH[value]
    if value.startswith("原始数据文件夹不存在："):
        return "The source data folder does not exist: " + value.split(
            "：",
            1,
        )[1]
    if value.startswith("命令返回 "):
        return "Command returned " + value.removeprefix("命令返回 ")
    if value.startswith("运行中 · ") and value != "运行中 · 其他输出":
        return "Running · " + value.removeprefix("运行中 · ")
    return value


def enable_windows_dpi_awareness() -> None:
    if os.name != "nt":
        return
    try:
        import ctypes

        if ctypes.windll.user32.SetProcessDpiAwarenessContext(
            ctypes.c_void_p(-4)
        ):
            return
    except (AttributeError, OSError):
        pass
    try:
        import ctypes

        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except (AttributeError, OSError):
        try:
            ctypes.windll.user32.SetProcessDPIAware()
        except (AttributeError, OSError):
            pass


def command_environment() -> dict[str, str]:
    environment = os.environ.copy()
    environment["PYTHONIOENCODING"] = "utf-8"
    environment["PYTHONUTF8"] = "1"
    return environment


def run_cli_command(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=TOOL_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=command_environment(),
        creationflags=(
            subprocess.CREATE_NO_WINDOW
            if os.name == "nt"
            else 0
        ),
    )


@dataclass(frozen=True)
class LauncherSettings:
    raw_data_dir: str
    output_dir: str
    sam2_before_frames: int
    sam2_after_frames: int
    mode: str
    device: str
    port: int
    conda_env: str


def read_config() -> dict:
    if not CONFIG_PATH.is_file():
        return DEFAULT_CONFIG.copy()
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8-sig"))


def settings_from_config(config: dict) -> LauncherSettings:
    active_environment = os.environ.get("CONDA_DEFAULT_ENV", "").strip()
    configured_environment = str(config.get("conda_env", "")).strip()
    return LauncherSettings(
        raw_data_dir=str(config.get("raw_data_dir", "")),
        output_dir=str(config.get("output_dir", "")),
        sam2_before_frames=int(config.get("sam2_before_frames", 4)),
        sam2_after_frames=int(config.get("sam2_after_frames", 16)),
        mode="vessel" if config.get("vessel_only") else "both",
        device=str(config.get("sam2_device", "auto")),
        port=int(config.get("port", 8767)),
        conda_env=(
            configured_environment
            or active_environment
            or DEFAULT_ENVIRONMENT
        ),
    )


def validate_settings(settings: LauncherSettings) -> None:
    raw_root = Path(settings.raw_data_dir).expanduser().resolve()
    output_root = Path(settings.output_dir).expanduser().resolve()
    if not raw_root.is_dir():
        raise ValueError(f"原始数据文件夹不存在：{raw_root}")
    if output_root == raw_root or output_root.is_relative_to(raw_root):
        raise ValueError("处理后目录不能与原始目录相同，也不能放在其内部")
    if not 0 <= settings.sam2_before_frames <= 32:
        raise ValueError("SAM2 向前传播帧数必须在 0 到 32 之间")
    if not 0 <= settings.sam2_after_frames <= 32:
        raise ValueError("SAM2 向后传播帧数必须在 0 到 32 之间")
    if settings.mode not in {"vessel", "both"}:
        raise ValueError("标注模式无效")
    if settings.device not in {"auto", "cuda", "cpu"}:
        raise ValueError("SAM2 设备无效")
    if not 1024 <= settings.port <= 65535:
        raise ValueError("端口必须在 1024 到 65535 之间")
    if (
        not settings.conda_env
        or any(character.isspace() for character in settings.conda_env)
    ):
        raise ValueError("Conda 环境名不能为空，也不能包含空格")


def configure_command(settings: LauncherSettings) -> list[str]:
    validate_settings(settings)
    return [
        sys.executable,
        str(CLI_PATH),
        "configure",
        "--raw",
        str(Path(settings.raw_data_dir).expanduser().resolve()),
        "--output",
        str(Path(settings.output_dir).expanduser().resolve()),
        "--before",
        str(settings.sam2_before_frames),
        "--after",
        str(settings.sam2_after_frames),
        "--mode",
        settings.mode,
        "--device",
        settings.device,
        "--port",
        str(settings.port),
        "--conda-env",
        settings.conda_env,
    ]


def health(port: int, timeout: float = 0.5) -> dict | None:
    try:
        with urllib.request.urlopen(
            f"http://127.0.0.1:{port}/api/health",
            timeout=timeout,
        ) as response:
            payload = json.loads(response.read().decode("utf-8"))
            return payload if payload.get("tool") == "dataseg" else None
    except (OSError, ValueError, urllib.error.URLError):
        return None


def browser_url(port: int, response: dict) -> str:
    query = urlencode(
        {
            "project": str(response.get("project_id", "")),
            "instance": str(response.get("instance_id", "")),
            "opened": str(time.time_ns()),
        }
    )
    return f"http://127.0.0.1:{port}/?{query}"


def same_path(left: str, right: str) -> bool:
    try:
        return os.path.normcase(
            str(Path(left).expanduser().resolve())
        ) == os.path.normcase(
            str(Path(right).expanduser().resolve())
        )
    except (OSError, ValueError):
        return False


class DataSegGui:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.language = "zh-CN"
        self.busy = False
        self.running = False
        self.close_after_stop = False
        self.status_after_id: str | None = None

        settings = settings_from_config(read_config())
        self.raw_var = tk.StringVar(value=settings.raw_data_dir)
        self.output_var = tk.StringVar(value=settings.output_dir)
        self.before_var = tk.StringVar(value=str(settings.sam2_before_frames))
        self.after_var = tk.StringVar(value=str(settings.sam2_after_frames))
        self.mode_var = tk.StringVar(
            value=VALUE_TO_MODE.get(settings.mode, "血管与肿瘤")
        )
        self.device_var = tk.StringVar(value=settings.device)
        self.port_var = tk.StringVar(value=str(settings.port))
        self.conda_var = tk.StringVar(value=settings.conda_env)

        self._configure_window()
        self._build_ui()
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        self._schedule_status_refresh(250)

    def _configure_window(self) -> None:
        self.root.title(self.tr("DataSeg 启动器"))
        self.root.geometry("980x780")
        self.root.minsize(860, 700)
        self.root.configure(background=UI_COLORS["canvas"])

        style = ttk.Style(self.root)
        if "clam" in style.theme_names():
            style.theme_use("clam")
        self.root.option_add(
            "*TCombobox*Listbox.background",
            UI_COLORS["surface"],
        )
        self.root.option_add(
            "*TCombobox*Listbox.foreground",
            UI_COLORS["ink_secondary"],
        )
        self.root.option_add(
            "*TCombobox*Listbox.selectBackground",
            UI_COLORS["primary_soft"],
        )
        self.root.option_add(
            "*TCombobox*Listbox.selectForeground",
            UI_COLORS["ink"],
        )
        style.configure(
            "TFrame",
            background=UI_COLORS["canvas"],
        )
        style.configure(
            "Card.TFrame",
            background=UI_COLORS["surface"],
            borderwidth=1,
            relief="solid",
            bordercolor=UI_COLORS["hairline"],
            lightcolor=UI_COLORS["hairline"],
            darkcolor=UI_COLORS["hairline"],
        )
        style.configure(
            "CardBody.TFrame",
            background=UI_COLORS["surface"],
        )
        style.configure(
            "TLabel",
            background=UI_COLORS["canvas"],
            foreground=UI_COLORS["ink_secondary"],
            font=(UI_FONT_FAMILY, 10),
        )
        style.configure(
            "Card.TLabel",
            background=UI_COLORS["surface"],
            foreground=UI_COLORS["ink_secondary"],
            font=(UI_FONT_FAMILY, 10),
        )
        style.configure(
            "Section.TLabel",
            background=UI_COLORS["surface"],
            foreground=UI_COLORS["ink"],
            font=(UI_FONT_FAMILY, 12, "bold"),
        )
        style.configure(
            "TButton",
            background=UI_COLORS["surface_soft"],
            foreground=UI_COLORS["ink_secondary"],
            bordercolor=UI_COLORS["hairline_strong"],
            lightcolor=UI_COLORS["surface_soft"],
            darkcolor=UI_COLORS["surface_soft"],
            focuscolor=UI_COLORS["primary"],
            font=(UI_FONT_FAMILY, 10),
            padding=(13, 9),
        )
        style.map(
            "TButton",
            background=[
                ("disabled", UI_COLORS["surface"]),
                ("pressed", UI_COLORS["primary_soft"]),
                ("active", UI_COLORS["surface_muted"]),
            ],
            foreground=[
                ("disabled", UI_COLORS["faint"]),
                ("active", UI_COLORS["ink"]),
            ],
            bordercolor=[
                ("focus", UI_COLORS["primary"]),
                ("active", UI_COLORS["hairline_strong"]),
            ],
        )
        style.configure(
            "Primary.TButton",
            background=UI_COLORS["primary"],
            foreground=UI_COLORS["canvas_dark"],
            bordercolor=UI_COLORS["primary"],
            lightcolor=UI_COLORS["primary"],
            darkcolor=UI_COLORS["primary"],
            focuscolor=UI_COLORS["ink"],
            font=(UI_FONT_FAMILY, 10, "bold"),
            padding=(16, 9),
        )
        style.map(
            "Primary.TButton",
            background=[
                ("disabled", UI_COLORS["surface_muted"]),
                ("pressed", UI_COLORS["primary_active"]),
                ("active", UI_COLORS["primary_active"]),
            ],
            foreground=[
                ("disabled", UI_COLORS["faint"]),
                ("active", UI_COLORS["ink"]),
            ],
            bordercolor=[
                ("disabled", UI_COLORS["hairline"]),
                ("focus", UI_COLORS["ink"]),
                ("active", UI_COLORS["primary_active"]),
            ],
        )
        style.configure(
            "Secondary.TButton",
            background=UI_COLORS["surface_soft"],
            foreground=UI_COLORS["ink_secondary"],
            bordercolor=UI_COLORS["hairline_strong"],
            lightcolor=UI_COLORS["surface_soft"],
            darkcolor=UI_COLORS["surface_soft"],
            focuscolor=UI_COLORS["primary"],
            font=(UI_FONT_FAMILY, 10),
            padding=(13, 9),
        )
        style.map(
            "Secondary.TButton",
            background=[
                ("disabled", UI_COLORS["surface"]),
                ("pressed", UI_COLORS["primary_soft"]),
                ("active", UI_COLORS["surface_muted"]),
            ],
            foreground=[
                ("disabled", UI_COLORS["faint"]),
                ("active", UI_COLORS["ink"]),
            ],
            bordercolor=[
                ("focus", UI_COLORS["primary"]),
                ("active", UI_COLORS["hairline_strong"]),
            ],
        )
        style.configure(
            "Danger.TButton",
            background=UI_COLORS["danger_soft"],
            foreground=UI_COLORS["danger"],
            bordercolor=UI_COLORS["danger_soft"],
            lightcolor=UI_COLORS["danger_soft"],
            darkcolor=UI_COLORS["danger_soft"],
            focuscolor=UI_COLORS["danger"],
            font=(UI_FONT_FAMILY, 10),
            padding=(13, 9),
        )
        style.map(
            "Danger.TButton",
            background=[
                ("disabled", UI_COLORS["surface"]),
                ("pressed", UI_COLORS["danger_active"]),
                ("active", UI_COLORS["danger_hover"]),
            ],
            foreground=[
                ("disabled", UI_COLORS["faint"]),
                ("active", UI_COLORS["ink"]),
            ],
            bordercolor=[
                ("disabled", UI_COLORS["hairline"]),
                ("focus", UI_COLORS["danger"]),
            ],
        )
        for field_style in ("TEntry", "TSpinbox"):
            style.configure(
                field_style,
                background=UI_COLORS["canvas_dark_soft"],
                fieldbackground=UI_COLORS["canvas_dark_soft"],
                foreground=UI_COLORS["ink"],
                insertcolor=UI_COLORS["ink"],
                bordercolor=UI_COLORS["hairline_strong"],
                lightcolor=UI_COLORS["canvas_dark_soft"],
                darkcolor=UI_COLORS["canvas_dark_soft"],
                arrowcolor=UI_COLORS["muted"],
                font=(UI_FONT_FAMILY, 10),
                padding=(9, 7),
            )
            style.map(
                field_style,
                fieldbackground=[
                    ("disabled", UI_COLORS["surface_muted"]),
                ],
                foreground=[
                    ("disabled", UI_COLORS["faint"]),
                ],
                bordercolor=[
                    ("focus", UI_COLORS["primary"]),
                ],
            )
        style.configure(
            "TCombobox",
            background=UI_COLORS["surface_muted"],
            fieldbackground=UI_COLORS["canvas_dark_soft"],
            foreground=UI_COLORS["ink"],
            selectbackground=UI_COLORS["canvas_dark_soft"],
            selectforeground=UI_COLORS["ink"],
            bordercolor=UI_COLORS["hairline_strong"],
            lightcolor=UI_COLORS["canvas_dark_soft"],
            darkcolor=UI_COLORS["canvas_dark_soft"],
            arrowcolor=UI_COLORS["muted"],
            font=(UI_FONT_FAMILY, 10),
            padding=(9, 7),
        )
        style.map(
            "TCombobox",
            fieldbackground=[
                ("readonly", UI_COLORS["canvas_dark_soft"]),
                ("disabled", UI_COLORS["surface_muted"]),
            ],
            foreground=[
                ("readonly", UI_COLORS["ink"]),
                ("disabled", UI_COLORS["faint"]),
            ],
            selectbackground=[
                ("readonly", UI_COLORS["canvas_dark_soft"]),
            ],
            selectforeground=[
                ("readonly", UI_COLORS["ink"]),
            ],
            bordercolor=[
                ("focus", UI_COLORS["primary"]),
            ],
            arrowcolor=[
                ("disabled", UI_COLORS["faint"]),
                ("active", UI_COLORS["ink"]),
            ],
        )
        style.configure(
            "Vertical.TScrollbar",
            background=UI_COLORS["surface_muted"],
            troughcolor=UI_COLORS["canvas_dark"],
            bordercolor=UI_COLORS["hairline"],
            lightcolor=UI_COLORS["surface_muted"],
            darkcolor=UI_COLORS["surface_muted"],
            arrowcolor=UI_COLORS["muted"],
        )
        style.map(
            "Vertical.TScrollbar",
            background=[
                ("pressed", UI_COLORS["primary_active"]),
                ("active", UI_COLORS["hairline_strong"]),
            ],
            arrowcolor=[
                ("active", UI_COLORS["ink"]),
            ],
        )
        style.configure(
            "TProgressbar",
            background=UI_COLORS["primary"],
            troughcolor=UI_COLORS["surface_muted"],
            bordercolor=UI_COLORS["hairline"],
            lightcolor=UI_COLORS["primary"],
            darkcolor=UI_COLORS["primary"],
        )

    def _build_ui(self) -> None:
        header = tk.Frame(
            self.root,
            background=UI_COLORS["canvas"],
            height=126,
        )
        header.pack(fill="x")
        header.pack_propagate(False)

        tk.Label(
            header,
            text="DataSeg",
            background=UI_COLORS["canvas"],
            foreground=UI_COLORS["vessel"],
            font=(UI_FONT_FAMILY, 12, "bold"),
        ).pack(anchor="w", padx=28, pady=(18, 0))
        tk.Label(
            header,
            text="血管与肿瘤数据标定启动器",
            background=UI_COLORS["canvas"],
            foreground=UI_COLORS["ink"],
            font=(UI_FONT_FAMILY, 19, "bold"),
        ).pack(anchor="w", padx=28, pady=(2, 0))
        tk.Label(
            header,
            text="在这里配置项目并管理本地服务，标定操作仍在浏览器中完成。",
            background=UI_COLORS["canvas"],
            foreground=UI_COLORS["muted"],
            font=(UI_FONT_FAMILY, 9),
        ).pack(anchor="w", padx=28, pady=(4, 0))

        header_actions = tk.Frame(
            header,
            background=UI_COLORS["canvas"],
        )
        header_actions.place(
            relx=1.0,
            x=-28,
            y=24,
            anchor="ne",
        )

        self.language_button = tk.Button(
            header_actions,
            text="English",
            command=self.toggle_language,
            background=UI_COLORS["surface_soft"],
            foreground=UI_COLORS["ink_secondary"],
            activebackground=UI_COLORS["surface_muted"],
            activeforeground=UI_COLORS["ink"],
            borderwidth=1,
            relief="flat",
            highlightthickness=1,
            highlightbackground=UI_COLORS["hairline_strong"],
            highlightcolor=UI_COLORS["primary"],
            cursor="hand2",
            font=(UI_FONT_FAMILY, 9, "bold"),
            padx=12,
            pady=5,
        )
        self.language_button.pack(side="left", padx=(0, 32))

        self.status_label = tk.Label(
            header_actions,
            text="检查中",
            background=UI_COLORS["surface_muted"],
            foreground=UI_COLORS["ink_secondary"],
            font=(UI_FONT_FAMILY, 9, "bold"),
            padx=14,
            pady=6,
        )
        self.status_label.pack(side="left")
        tk.Frame(
            header,
            background=UI_COLORS["hairline"],
            height=1,
        ).place(relx=0, rely=1, relwidth=1, anchor="sw")

        body = ttk.Frame(self.root, padding=(22, 20, 22, 20))
        body.pack(fill="both", expand=True)
        body.columnconfigure(0, weight=1)
        body.rowconfigure(2, weight=1)

        config_card = ttk.Frame(body, style="Card.TFrame", padding=20)
        config_card.grid(row=0, column=0, sticky="ew")
        config_card.columnconfigure(1, weight=1)
        ttk.Label(
            config_card,
            text="项目配置",
            style="Section.TLabel",
        ).grid(row=0, column=0, columnspan=3, sticky="w", pady=(0, 14))

        self._folder_row(
            config_card,
            row=1,
            label="待处理原始数据",
            variable=self.raw_var,
            command=self.choose_raw_folder,
        )
        self._folder_row(
            config_card,
            row=2,
            label="处理后数据目录",
            variable=self.output_var,
            command=self.choose_output_folder,
        )

        options = ttk.Frame(config_card, style="CardBody.TFrame")
        options.grid(
            row=3,
            column=0,
            columnspan=3,
            sticky="ew",
            pady=(12, 0),
        )
        for column in range(6):
            options.columnconfigure(column, weight=1)

        self._small_field(options, 0, "SAM2 向前", self.before_var, "spin")
        self._small_field(options, 1, "SAM2 向后", self.after_var, "spin")
        self.mode_combo = self._small_field(
            options,
            2,
            "标注模式",
            self.mode_var,
            "combo",
            tuple(MODE_TO_VALUE),
        )
        self._small_field(
            options,
            3,
            "运行设备",
            self.device_var,
            "combo",
            ("auto", "cuda", "cpu"),
        )
        self._small_field(options, 4, "本地端口", self.port_var, "entry")
        self._small_field(
            options,
            5,
            "Conda 环境",
            self.conda_var,
            "entry",
        )

        toolbar = ttk.Frame(body)
        toolbar.grid(row=1, column=0, sticky="ew", pady=(14, 12))
        self.doctor_button = ttk.Button(
            toolbar,
            text="检查环境",
            style="Secondary.TButton",
            command=self.check_environment,
        )
        self.doctor_button.pack(side="left")
        self.save_button = ttk.Button(
            toolbar,
            text="保存配置",
            style="Secondary.TButton",
            command=self.save_config,
        )
        self.save_button.pack(side="left", padx=(8, 0))
        self.start_button = ttk.Button(
            toolbar,
            text="保存并启动",
            style="Primary.TButton",
            command=self.start_service,
        )
        self.start_button.pack(side="left", padx=(8, 0))
        self.open_button = ttk.Button(
            toolbar,
            text="打开标定页面",
            style="Secondary.TButton",
            command=self.open_browser,
        )
        self.open_button.pack(side="left", padx=(8, 0))
        self.stop_button = ttk.Button(
            toolbar,
            text="关闭服务",
            style="Danger.TButton",
            command=self.stop_service,
        )
        self.stop_button.pack(side="right")

        log_card = ttk.Frame(body, style="Card.TFrame", padding=16)
        log_card.grid(row=2, column=0, sticky="nsew")
        log_card.columnconfigure(0, weight=1)
        log_card.rowconfigure(1, weight=1)
        ttk.Label(
            log_card,
            text="运行信息",
            style="Section.TLabel",
        ).grid(row=0, column=0, sticky="w", pady=(0, 8))

        log_frame = ttk.Frame(log_card, style="CardBody.TFrame")
        log_frame.grid(row=1, column=0, sticky="nsew")
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        self.log_text = tk.Text(
            log_frame,
            wrap="word",
            height=12,
            borderwidth=0,
            relief="flat",
            highlightthickness=1,
            highlightbackground=UI_COLORS["hairline"],
            highlightcolor=UI_COLORS["primary"],
            background=UI_COLORS["canvas_dark"],
            foreground=UI_COLORS["ink_secondary"],
            insertbackground=UI_COLORS["ink"],
            selectbackground=UI_COLORS["primary_soft"],
            selectforeground=UI_COLORS["ink"],
            font=(UI_FONT_FAMILY, LOG_FONT_SIZE),
            padx=12,
            pady=10,
            spacing1=2,
            spacing3=4,
            state="disabled",
        )
        self.log_text.grid(row=0, column=0, sticky="nsew")
        scrollbar = ttk.Scrollbar(
            log_frame,
            orient="vertical",
            command=self.log_text.yview,
        )
        scrollbar.grid(row=0, column=1, sticky="ns")
        self.log_text.configure(yscrollcommand=scrollbar.set)
        self.log_text.tag_configure(
            "section",
            foreground=UI_COLORS["vessel"],
            font=(UI_FONT_FAMILY, LOG_FONT_SIZE, "bold"),
            spacing1=10,
            spacing3=5,
        )
        self.log_text.tag_configure(
            "success",
            foreground=UI_COLORS["success"],
            font=(UI_FONT_FAMILY, LOG_FONT_SIZE, "bold"),
        )
        self.log_text.tag_configure(
            "error",
            foreground=UI_COLORS["danger"],
            font=(UI_FONT_FAMILY, LOG_FONT_SIZE, "bold"),
        )
        self.log_text.tag_configure(
            "muted",
            foreground=UI_COLORS["muted"],
        )

        self.progress = ttk.Progressbar(
            body,
            mode="indeterminate",
        )
        self.progress.grid(row=3, column=0, sticky="ew", pady=(10, 0))
        self.append_log(
            "启动器已就绪。先选择输入和输出目录，再点击“保存并启动”。",
            tag="muted",
        )

    def _folder_row(
        self,
        parent: ttk.Frame,
        row: int,
        label: str,
        variable: tk.StringVar,
        command: Callable[[], None],
    ) -> None:
        ttk.Label(
            parent,
            text=label,
            style="Card.TLabel",
        ).grid(row=row, column=0, sticky="w", padx=(0, 12), pady=6)
        ttk.Entry(
            parent,
            textvariable=variable,
            font=(UI_FONT_FAMILY, 10),
        ).grid(row=row, column=1, sticky="ew", pady=6)
        ttk.Button(
            parent,
            text="选择文件夹",
            command=command,
        ).grid(row=row, column=2, padx=(10, 0), pady=6)

    def _small_field(
        self,
        parent: ttk.Frame,
        column: int,
        label: str,
        variable: tk.StringVar,
        kind: str,
        values: tuple[str, ...] = (),
    ) -> ttk.Widget:
        field = ttk.Frame(parent, style="CardBody.TFrame")
        field.grid(
            row=0,
            column=column,
            sticky="ew",
            padx=(0 if column == 0 else 5, 5 if column < 5 else 0),
        )
        ttk.Label(
            field,
            text=label,
            style="Card.TLabel",
        ).pack(anchor="w", pady=(0, 4))
        if kind == "spin":
            widget = ttk.Spinbox(
                field,
                from_=0,
                to=32,
                textvariable=variable,
                width=8,
            )
        elif kind == "combo":
            widget = ttk.Combobox(
                field,
                textvariable=variable,
                values=values,
                state="readonly",
                width=12,
            )
        else:
            widget = ttk.Entry(
                field,
                textvariable=variable,
                width=13,
            )
        widget.pack(fill="x")
        return widget

    def tr(self, value: str) -> str:
        if self.language == "en":
            return translate_gui_text(value)
        return value

    def _mode_mapping(self) -> dict[str, str]:
        if self.language == "en":
            return ENGLISH_MODE_TO_VALUE
        return MODE_TO_VALUE

    def _apply_widget_language(self) -> None:
        def visit(widget: tk.Misc) -> None:
            try:
                if "text" in widget.keys():
                    original = getattr(
                        widget,
                        "_dataseg_zh_text",
                        str(widget.cget("text")),
                    )
                    setattr(widget, "_dataseg_zh_text", original)
                    widget.configure(text=self.tr(original))
            except tk.TclError:
                pass
            for child in widget.winfo_children():
                visit(child)

        self.root.title(self.tr("DataSeg 启动器"))
        visit(self.root)

    def toggle_language(self) -> None:
        current_mode = self._mode_mapping().get(
            self.mode_var.get(),
            "both",
        )
        self.language = "en" if self.language == "zh-CN" else "zh-CN"
        mode_mapping = self._mode_mapping()
        value_to_mode = {
            value: label for label, value in mode_mapping.items()
        }
        self.mode_var.set(value_to_mode[current_mode])
        self.mode_combo.configure(values=tuple(mode_mapping))
        self._apply_widget_language()
        self.refresh_status()

    def choose_raw_folder(self) -> None:
        selected = filedialog.askdirectory(
            title=self.tr("选择待处理原始数据文件夹"),
            initialdir=self._initial_folder(self.raw_var.get()),
            mustexist=True,
        )
        if selected:
            self.raw_var.set(selected)

    def choose_output_folder(self) -> None:
        selected = filedialog.askdirectory(
            title=self.tr("选择处理后数据文件夹"),
            initialdir=self._initial_folder(self.output_var.get()),
            mustexist=False,
        )
        if selected:
            self.output_var.set(selected)

    @staticmethod
    def _initial_folder(value: str) -> str:
        candidate = Path(value).expanduser() if value.strip() else TOOL_ROOT
        if candidate.is_dir():
            return str(candidate)
        if candidate.parent.is_dir():
            return str(candidate.parent)
        return str(TOOL_ROOT)

    def collect_settings(self) -> LauncherSettings:
        try:
            settings = LauncherSettings(
                raw_data_dir=self.raw_var.get().strip(),
                output_dir=self.output_var.get().strip(),
                sam2_before_frames=int(self.before_var.get()),
                sam2_after_frames=int(self.after_var.get()),
                mode=self._mode_mapping()[self.mode_var.get()],
                device=self.device_var.get(),
                port=int(self.port_var.get()),
                conda_env=self.conda_var.get().strip(),
            )
        except (KeyError, ValueError) as error:
            raise ValueError("请检查传播帧数、标注模式和端口") from error
        validate_settings(settings)
        return settings

    def append_log(self, text: str, tag: str | None = None) -> None:
        if not text:
            return
        self.log_text.configure(state="normal")
        self.log_text.insert("end", text.rstrip() + "\n", tag or ())
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

    def _set_busy(self, busy: bool, label: str = "") -> None:
        self.busy = busy
        state = "disabled" if busy else "normal"
        for button in (
            self.doctor_button,
            self.save_button,
            self.start_button,
        ):
            button.configure(state=state)
        if busy:
            self.stop_button.configure(state="disabled")
            self.progress.start(12)
            self.status_label.configure(
                text=self.tr(label or "处理中"),
                background=UI_COLORS["warning_soft"],
                foreground=UI_COLORS["warning"],
            )
        else:
            self.progress.stop()
            self.refresh_status()

    def _cancel_status_refresh(self) -> None:
        if self.status_after_id is None:
            return
        try:
            self.root.after_cancel(self.status_after_id)
        except tk.TclError:
            pass
        self.status_after_id = None

    def _schedule_status_refresh(self, delay_ms: int = 2000) -> None:
        self._cancel_status_refresh()
        try:
            if self.root.winfo_exists():
                self.status_after_id = self.root.after(
                    delay_ms,
                    self.refresh_status,
                )
        except tk.TclError:
            self.status_after_id = None

    def _run_commands(
        self,
        title: str,
        commands: list[list[str]],
        on_success: Callable[[], None] | None = None,
    ) -> None:
        if self.busy:
            messagebox.showinfo(
                "DataSeg",
                self.tr("当前已有任务正在执行。"),
            )
            return
        self._set_busy(True, title)
        self.append_log(f"\n{self.tr(title)}", tag="section")

        def worker() -> None:
            outputs: list[str] = []
            error_message = ""
            success = True
            for command in commands:
                result = run_cli_command(command)
                output = "\n".join(
                    part.strip()
                    for part in (result.stdout, result.stderr)
                    if part and part.strip()
                )
                if output:
                    outputs.append(output)
                if result.returncode != 0:
                    success = False
                    error_message = output or self.tr(
                        f"命令返回 {result.returncode}"
                    )
                    break
            self.root.after(
                0,
                lambda: self._finish_commands(
                    success,
                    outputs,
                    error_message,
                    on_success,
                ),
            )

        threading.Thread(target=worker, daemon=True).start()

    def _finish_commands(
        self,
        success: bool,
        outputs: list[str],
        error_message: str,
        on_success: Callable[[], None] | None,
    ) -> None:
        for output in outputs:
            self.append_log(output)
        self._set_busy(False)
        if success:
            self.append_log(self.tr("操作完成"), tag="success")
            if on_success:
                on_success()
            return
        self.append_log(self.tr("操作失败"), tag="error")
        messagebox.showerror(
            self.tr("DataSeg 操作失败"),
            self.tr(error_message),
        )

    def check_environment(self) -> None:
        self._run_commands(
            "检查环境",
            [[sys.executable, str(CLI_PATH), "doctor"]],
        )

    def save_config(self) -> None:
        try:
            settings = self.collect_settings()
        except ValueError as error:
            messagebox.showerror(
                self.tr("配置无效"),
                self.tr(str(error)),
            )
            return
        self._run_commands(
            "保存配置",
            [configure_command(settings)],
        )

    def start_service(self) -> None:
        try:
            settings = self.collect_settings()
        except ValueError as error:
            messagebox.showerror(
                self.tr("配置无效"),
                self.tr(str(error)),
            )
            return
        self._run_commands(
            "准备数据并启动",
            [
                configure_command(settings),
                [
                    sys.executable,
                    str(CLI_PATH),
                    "start",
                    "--no-open",
                ],
            ],
            on_success=lambda: self.open_browser(silent=True),
        )

    def stop_service(self, close_after: bool = False) -> None:
        self.close_after_stop = close_after
        self._run_commands(
            "关闭服务",
            [[sys.executable, str(CLI_PATH), "stop"]],
            on_success=self._after_stop,
        )

    def _after_stop(self) -> None:
        if self.close_after_stop:
            self._cancel_status_refresh()
            self.root.destroy()

    def open_browser(self, silent: bool = False) -> None:
        try:
            port = int(self.port_var.get())
        except ValueError:
            if not silent:
                messagebox.showerror(
                    self.tr("端口无效"),
                    self.tr("请填写正确的本地端口。"),
                )
            return
        response = health(port)
        if not response:
            if not silent:
                messagebox.showinfo(
                    "DataSeg",
                    self.tr("服务尚未启动。"),
                )
            return
        webbrowser.open(browser_url(port, response))

    def refresh_status(self) -> None:
        self._cancel_status_refresh()
        try:
            port = int(self.port_var.get())
            response = health(port)
        except ValueError:
            response = None
        self.running = bool(response)
        if not self.busy:
            if self.running:
                selected_output = self.output_var.get().strip()
                bound_output = str(response.get("output_dir", ""))
                matches_output = bool(selected_output) and same_path(
                    selected_output,
                    bound_output,
                )
                self.status_label.configure(
                    text=(
                        self.tr(f"运行中 · {self.port_var.get()}")
                        if matches_output
                        else self.tr("运行中 · 其他输出")
                    ),
                    background=(
                        UI_COLORS["success_soft"]
                        if matches_output
                        else UI_COLORS["warning_soft"]
                    ),
                    foreground=(
                        UI_COLORS["success"]
                        if matches_output
                        else UI_COLORS["warning"]
                    ),
                )
            else:
                self.status_label.configure(
                    text=self.tr("已停止"),
                    background=UI_COLORS["surface_muted"],
                    foreground=UI_COLORS["ink_secondary"],
                )
            self.open_button.configure(
                state="normal" if self.running else "disabled"
            )
            self.stop_button.configure(
                state="normal" if self.running else "disabled"
            )
        self._schedule_status_refresh()

    def on_close(self) -> None:
        if self.busy:
            messagebox.showinfo(
                "DataSeg",
                self.tr("请等待当前操作完成。"),
            )
            return
        self.refresh_status()
        if not self.running:
            self._cancel_status_refresh()
            self.root.destroy()
            return
        choice = messagebox.askyesnocancel(
            self.tr("退出 DataSeg 启动器"),
            self.tr(
                "DataSeg 服务仍在运行。\n\n"
                "选择“是”关闭服务并退出。\n"
                "选择“否”保留服务并退出。"
            ),
        )
        if choice is None:
            return
        if choice:
            self.stop_service(close_after=True)
        else:
            self._cancel_status_refresh()
            self.root.destroy()


def show_startup_error(message: str) -> None:
    if os.name == "nt":
        try:
            import ctypes

            ctypes.windll.user32.MessageBoxW(
                0,
                message,
                "DataSeg 启动失败",
                0x10,
            )
            return
        except Exception:
            pass
    print(message, file=sys.stderr)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="DataSeg 桌面启动器")
    parser.add_argument(
        "--smoke-test",
        action="store_true",
        help="创建并检查窗口后立即退出",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    enable_windows_dpi_awareness()
    root: tk.Tk | None = None
    try:
        root = tk.Tk()
        app = DataSegGui(root)
    except Exception as error:
        if root is not None:
            try:
                root.destroy()
            except tk.TclError:
                pass
        startup_message = (
            "无法启动 Python 图形界面。\n\n"
            f"{error}\n\n"
            "请在当前 Conda 环境安装 Tcl/Tk：\n"
            "conda install -c conda-forge --force-reinstall tk"
        )
        if args.smoke_test:
            print(startup_message, file=sys.stderr)
        else:
            show_startup_error(startup_message)
        return 1
    if args.smoke_test:
        root.withdraw()
        root.update_idletasks()
        required = (
            app.raw_var,
            app.output_var,
            app.before_var,
            app.after_var,
            app.mode_var,
            app.device_var,
            app.port_var,
            app.conda_var,
        )
        if any(variable is None for variable in required):
            raise RuntimeError("GUI fields are incomplete")
        log_font = app.log_text.cget("font")
        log_font_family = str(
            root.tk.call("font", "actual", log_font, "-family")
        )
        log_font_size = int(
            root.tk.call("font", "actual", log_font, "-size")
        )
        if os.name == "nt" and log_font_family != UI_FONT_FAMILY:
            raise RuntimeError(
                f"Expected {UI_FONT_FAMILY}, got {log_font_family}"
            )
        if log_font_size < LOG_FONT_SIZE:
            raise RuntimeError(
                f"Log font is too small: {log_font_size}"
            )
        root.destroy()
        print("DataSeg GUI smoke test passed")
        return 0
    root.mainloop()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
