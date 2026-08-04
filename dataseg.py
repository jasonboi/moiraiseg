from __future__ import annotations

import argparse
import importlib
import json
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
import webbrowser
from pathlib import Path
from typing import Any
from urllib.parse import urlencode


TOOL_ROOT = Path(__file__).resolve().parent
CONFIG_PATH = TOOL_ROOT / "config.json"
RUNTIME_ROOT = TOOL_ROOT / "runtime"
STATE_PATH = RUNTIME_ROOT / "server.json"
LOG_ROOT = TOOL_ROOT / "logs"
PREPARE_PATH = TOOL_ROOT / "scripts" / "prepare_dataset.py"
RUNNER_PATH = TOOL_ROOT / "scripts" / "run_server.py"
SAM2_ROOT = TOOL_ROOT / "sam2"
CHECKPOINT_PATH = SAM2_ROOT / "checkpoints" / "sam2.1_hiera_tiny.pt"
DEFAULT_CONFIG = {
    "schema_version": 1,
    "raw_data_dir": "",
    "output_dir": "",
    "sam2_before_frames": 4,
    "sam2_after_frames": 16,
    "sam2_device": "auto",
    "python_executable": str(Path(sys.executable).resolve()),
    "port": 8767,
}
REQUIRED_IMPORTS = (
    ("PIL", "Pillow"),
    ("numpy", "NumPy"),
    ("torch", "PyTorch"),
    ("torchvision", "TorchVision"),
    ("hydra", "Hydra"),
    ("omegaconf", "OmegaConf"),
    ("iopath", "iopath"),
    ("tqdm", "tqdm"),
)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def atomic_write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    try:
        temporary.write_text(
            json.dumps(value, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def load_config() -> dict[str, Any]:
    if not CONFIG_PATH.is_file():
        return DEFAULT_CONFIG.copy()
    config = read_json(CONFIG_PATH)
    if config.get("schema_version") != 1:
        raise ValueError("不支持的 config.json 版本")
    return config


def health(port: int, timeout: float = 1.0) -> dict[str, Any] | None:
    try:
        with urllib.request.urlopen(
            f"http://127.0.0.1:{port}/api/health",
            timeout=timeout,
        ) as response:
            if response.status != 200:
                return None
            payload = json.loads(response.read().decode("utf-8"))
            return payload if isinstance(payload, dict) else None
    except (OSError, ValueError, urllib.error.URLError):
        return None


def normalized_path(value: str | Path) -> str:
    return os.path.normcase(str(Path(value).expanduser().resolve()))


def service_matches_config(
    response: dict[str, Any],
    config: dict[str, Any],
) -> bool:
    if response.get("tool") != "dataseg":
        return False
    try:
        if normalized_path(response["raw_data_dir"]) != normalized_path(
            config["raw_data_dir"]
        ):
            return False
        if normalized_path(response["output_dir"]) != normalized_path(
            config["output_dir"]
        ):
            return False
        if int(response.get("sam2_before_frames", -1)) != int(
            config.get("sam2_before_frames", 4)
        ):
            return False
        if int(response.get("sam2_after_frames", -1)) != int(
            config.get("sam2_after_frames", 16)
        ):
            return False
    except (KeyError, TypeError, ValueError):
        return False

    project_path = (
        Path(config["output_dir"]).expanduser().resolve()
        / ".dataseg"
        / "project.json"
    )
    if project_path.is_file():
        try:
            project_id = str(read_json(project_path)["project_id"])
        except (KeyError, OSError, ValueError):
            return False
        if response.get("project_id") != project_id:
            return False
    return True


def browser_url(port: int, response: dict[str, Any]) -> str:
    query = urlencode(
        {
            "project": str(response.get("project_id", "")),
            "instance": str(response.get("instance_id", "")),
            "opened": str(time.time_ns()),
        }
    )
    return f"http://127.0.0.1:{port}/?{query}"


def request_shutdown(port: int, token: str) -> None:
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/api/shutdown",
        data=json.dumps({"token": token}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=3) as response:
        payload = json.loads(response.read().decode("utf-8"))
        if response.status != 200 or not payload.get("ok"):
            raise RuntimeError("服务拒绝关闭请求")


def port_is_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.5):
            return True
    except OSError:
        return False


def module_version(module: Any) -> str:
    return str(getattr(module, "__version__", "已安装"))


def doctor(*, quiet: bool = False) -> bool:
    errors: list[str] = []
    notices: list[str] = []
    versions: list[tuple[str, str]] = []
    if sys.version_info < (3, 10):
        errors.append("需要 Python 3.10 或更高版本，推荐 Python 3.11")

    for module_name, display_name in REQUIRED_IMPORTS:
        try:
            module = importlib.import_module(module_name)
            versions.append((display_name, module_version(module)))
        except Exception as error:
            errors.append(f"{display_name} 导入失败：{error}")

    try:
        import tkinter

        tcl = tkinter.Tcl()
        versions.append(("Tcl/Tk", str(tcl.eval("info patchlevel"))))
    except Exception as error:
        notices.append(
            "Tcl/Tk 运行库不可用："
            f"{error}。请为当前 Python 环境安装 Tcl/Tk"
        )

    required_paths = (
        TOOL_ROOT / "app" / "server.py",
        TOOL_ROOT / "app" / "static" / "index.html",
        PREPARE_PATH,
        RUNNER_PATH,
        SAM2_ROOT / "sam2" / "__init__.py",
    )
    for path in required_paths:
        if not path.exists():
            errors.append(f"缺少文件：{path}")
    if not CHECKPOINT_PATH.is_file():
        errors.append(
            "缺少 SAM2 模型权重。请运行："
            "python scripts/download_model.py"
        )

    try:
        sam2_path = str(SAM2_ROOT)
        if sam2_path not in sys.path:
            sys.path.insert(0, sam2_path)
        sam2 = importlib.import_module("sam2")
        imported_path = Path(sam2.__file__).resolve()
        if not imported_path.is_relative_to(SAM2_ROOT.resolve()):
            errors.append(f"SAM2 加载自外部路径：{imported_path}")
        else:
            versions.append(("SAM2", str(imported_path)))
    except Exception as error:
        errors.append(f"包内 SAM2 导入失败：{error}")

    if not quiet:
        print(f"Python: {sys.executable}")
        print(f"版本: {sys.version.split()[0]}")
        for name, version in versions:
            print(f"{name}: {version}")
        try:
            import torch

            print(f"CUDA 可用: {torch.cuda.is_available()}")
            if torch.cuda.is_available():
                print(f"GPU: {torch.cuda.get_device_name(0)}")
        except Exception:
            pass

    if errors:
        print("\n环境检查失败：", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        for notice in notices:
            print(f"- 警告：{notice}", file=sys.stderr)
        print(
            "\n请激活要运行 DataSeg 的 Python 环境，然后在项目目录中运行："
            "\n  python -m pip install -r requirements.txt",
            file=sys.stderr,
        )
        return False
    if not quiet:
        for notice in notices:
            print(f"\n环境警告：{notice}", file=sys.stderr)
        print("\nDataSeg 环境检查通过。")
    return True


def prompt_text(label: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{label}{suffix}: ").strip()
    return value or default


def prompt_integer(label: str, default: int, minimum: int, maximum: int) -> int:
    while True:
        value = prompt_text(label, str(default))
        try:
            parsed = int(value)
        except ValueError:
            print("请输入整数。")
            continue
        if minimum <= parsed <= maximum:
            return parsed
        print(f"请输入 {minimum} 到 {maximum} 之间的整数。")


def resolve_path(value: str, field: str) -> Path:
    if not value.strip():
        raise ValueError(f"{field} 不能为空")
    return Path(value.strip().strip('"')).expanduser().resolve()


def configure(args: argparse.Namespace) -> None:
    config = load_config()
    raw_value = args.raw or prompt_text(
        "原始数据文件夹",
        str(config.get("raw_data_dir", "")),
    )
    output_value = args.output or prompt_text(
        "处理后数据文件夹",
        str(config.get("output_dir", "")),
    )
    raw_root = resolve_path(raw_value, "原始数据文件夹")
    output_root = resolve_path(output_value, "处理后数据文件夹")
    if not raw_root.is_dir():
        raise FileNotFoundError(f"原始数据文件夹不存在：{raw_root}")
    if output_root == raw_root or output_root.is_relative_to(raw_root):
        raise ValueError("处理后目录不能与原始目录相同，也不能放在其内部")
    output_root.mkdir(parents=True, exist_ok=True)

    before = (
        args.before
        if args.before is not None
        else prompt_integer(
            "SAM2 向前传播帧数",
            int(config.get("sam2_before_frames", 4)),
            0,
            32,
        )
    )
    after = (
        args.after
        if args.after is not None
        else prompt_integer(
            "SAM2 向后传播帧数",
            int(config.get("sam2_after_frames", 16)),
            0,
            32,
        )
    )
    if not 0 <= before <= 32 or not 0 <= after <= 32:
        raise ValueError("SAM2 传播帧数必须在 0 到 32 之间")

    device = args.device or prompt_text(
        "SAM2 设备（auto/cuda/cpu）",
        str(config.get("sam2_device", "auto")),
    ).lower()
    if device not in {"auto", "cuda", "cpu"}:
        raise ValueError("SAM2 设备必须是 auto、cuda 或 cpu")
    port = (
        args.port
        if args.port is not None
        else prompt_integer("本地端口", int(config.get("port", 8767)), 1024, 65535)
    )
    if not 1024 <= port <= 65535:
        raise ValueError("端口必须在 1024 到 65535 之间")

    python_value = str(
        getattr(args, "python_executable", None) or sys.executable
    ).strip()
    python_executable = Path(python_value).expanduser().resolve()
    if not python_executable.is_file():
        raise ValueError(f"Python 解释器不存在：{python_executable}")

    updated = {
        "schema_version": 1,
        "raw_data_dir": str(raw_root),
        "output_dir": str(output_root),
        "sam2_before_frames": before,
        "sam2_after_frames": after,
        "sam2_device": device,
        "python_executable": str(python_executable),
        "port": port,
    }
    atomic_write_json(CONFIG_PATH, updated)
    print("\n配置已保存。")
    print(f"原始数据: {raw_root}")
    print(f"处理后数据: {output_root}")
    print(f"SAM2: 前 {before} 帧，后 {after} 帧")
    print(f"Python 解释器: {python_executable}")


def require_configured(config: dict[str, Any]) -> None:
    if not str(config.get("raw_data_dir", "")).strip():
        raise ValueError("尚未设置原始数据目录，请先运行 configure")
    if not str(config.get("output_dir", "")).strip():
        raise ValueError("尚未设置处理后数据目录，请先运行 configure")


def prepare(config: dict[str, Any]) -> None:
    require_configured(config)
    print("正在检查原始数据并建立标定索引……")
    subprocess.run(
        [sys.executable, str(PREPARE_PATH), "--config", str(CONFIG_PATH)],
        cwd=TOOL_ROOT,
        check=True,
    )


def start(args: argparse.Namespace) -> None:
    if not doctor(quiet=True):
        raise RuntimeError("环境检查未通过")
    config = load_config()
    require_configured(config)
    port = int(config.get("port", 8767))
    current = health(port)
    if current and current.get("tool") == "dataseg":
        if service_matches_config(current, config):
            url = browser_url(port, current)
            if not args.no_open:
                webbrowser.open(url)
            print(f"DataSeg 已经在运行：{url}")
            return
        if not STATE_PATH.is_file():
            raise RuntimeError(
                "端口上的 DataSeg 服务绑定了另一个输入或输出项目，"
                "但缺少可验证的启动记录。请先关闭旧服务。"
            )
        print("检测到另一个 DataSeg 项目，正在关闭旧服务并切换……")
        stop(argparse.Namespace(force=False))
        if port_is_open(port):
            raise RuntimeError(f"旧服务未释放端口 {port}")
    if port_is_open(port):
        raise RuntimeError(f"端口 {port} 已被其他程序占用")

    prepare(config)
    RUNTIME_ROOT.mkdir(parents=True, exist_ok=True)
    LOG_ROOT.mkdir(parents=True, exist_ok=True)
    stdout_path = LOG_ROOT / "server.log"
    stderr_path = LOG_ROOT / "server-error.log"
    instance_id = uuid.uuid4().hex
    shutdown_token = uuid.uuid4().hex
    environment = os.environ.copy()
    environment["DATASEG_INSTANCE_ID"] = instance_id
    environment["DATASEG_SHUTDOWN_TOKEN"] = shutdown_token
    popen_kwargs: dict[str, Any] = {
        "cwd": TOOL_ROOT,
        "env": environment,
    }
    if os.name == "nt":
        popen_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    else:
        popen_kwargs["start_new_session"] = True

    with stdout_path.open("ab") as stdout, stderr_path.open("ab") as stderr:
        process = subprocess.Popen(
            [
                sys.executable,
                "-u",
                str(RUNNER_PATH),
                "--config",
                str(CONFIG_PATH),
            ],
            stdout=stdout,
            stderr=stderr,
            **popen_kwargs,
        )

    ready_response: dict[str, Any] | None = None
    for _ in range(60):
        if process.poll() is not None:
            break
        response = health(port)
        if (
            response
            and response.get("tool") == "dataseg"
            and response.get("instance_id") == instance_id
        ):
            ready_response = response
            break
        time.sleep(0.5)
    if ready_response is None:
        if process.poll() is None:
            process.terminate()
        details = (
            stderr_path.read_text(encoding="utf-8", errors="replace")
            if stderr_path.exists()
            else ""
        )
        raise RuntimeError(f"DataSeg 启动失败。\n{details[-4000:]}")

    atomic_write_json(
        STATE_PATH,
        {
            "schema_version": 1,
            "process_id": process.pid,
            "python_executable": sys.executable,
            "port": port,
            "instance_id": instance_id,
            "shutdown_token": shutdown_token,
            "project_id": ready_response.get("project_id"),
            "raw_data_dir": ready_response.get("raw_data_dir"),
            "output_dir": ready_response.get("output_dir"),
            "started_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "config_path": str(CONFIG_PATH),
        },
    )
    url = browser_url(port, ready_response)
    if not args.no_open:
        webbrowser.open(url)
    print(f"DataSeg 已启动：{url}")
    print("关闭时运行：python dataseg.py stop")


def process_exists(pid: int) -> bool:
    if os.name == "nt":
        import ctypes

        process_query_limited_information = 0x1000
        handle = ctypes.windll.kernel32.OpenProcess(
            process_query_limited_information,
            False,
            pid,
        )
        if not handle:
            return False
        ctypes.windll.kernel32.CloseHandle(handle)
        return True
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def stop(args: argparse.Namespace) -> None:
    if not STATE_PATH.is_file():
        print("DataSeg 当前没有 Python CLI 启动记录。")
        return
    state = read_json(STATE_PATH)
    pid = int(state["process_id"])
    port = int(state["port"])
    expected_instance = str(state.get("instance_id", ""))
    shutdown_token = str(state.get("shutdown_token", ""))
    response = health(port)
    if not response:
        if not process_exists(pid):
            STATE_PATH.unlink(missing_ok=True)
            print("DataSeg 进程已经结束，运行记录已清理。")
            return
        if not args.force:
            raise RuntimeError(
                "服务没有响应，但记录中的进程仍存在。"
                "确认后可运行 python dataseg.py stop --force"
            )
    elif (
        response.get("tool") != "dataseg"
        or response.get("instance_id") != expected_instance
    ):
        raise RuntimeError("端口上的服务与启动记录不匹配，拒绝关闭")

    if response:
        if not shutdown_token:
            raise RuntimeError("启动记录缺少关闭令牌，请使用 stop --force")
        request_shutdown(port, shutdown_token)
    elif args.force:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                check=True,
                capture_output=True,
            )
        else:
            os.kill(pid, signal.SIGTERM)
    for _ in range(50):
        if not process_exists(pid) or not health(port, timeout=0.2):
            break
        time.sleep(0.1)
    STATE_PATH.unlink(missing_ok=True)
    print("DataSeg 已关闭。")


def status() -> None:
    config = load_config()
    port = int(config.get("port", 8767))
    response = health(port)
    if response and response.get("tool") == "dataseg":
        print(f"DataSeg 正在运行：http://127.0.0.1:{port}/")
        print(f"项目输出：{response.get('output_dir', '未知')}")
        print(
            "SAM2 传播范围："
            f"前 {response.get('sam2_before_frames')} 帧，"
            f"后 {response.get('sam2_after_frames')} 帧"
        )
    else:
        print("DataSeg 当前没有运行。")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="DataSeg 多类别 Mask 数据标定工具",
    )
    subparsers = parser.add_subparsers(dest="command")
    subparsers.add_parser("doctor", help="检查 Python、依赖、SAM2 和模型")

    configure_parser = subparsers.add_parser("configure", help="配置数据和传播范围")
    configure_parser.add_argument("--raw", help="原始数据文件夹")
    configure_parser.add_argument("--output", help="处理后数据文件夹")
    configure_parser.add_argument("--before", type=int, help="向前传播帧数")
    configure_parser.add_argument("--after", type=int, help="向后传播帧数")
    configure_parser.add_argument(
        "--device",
        choices=("auto", "cuda", "cpu"),
        help="SAM2 运行设备",
    )
    configure_parser.add_argument("--port", type=int, help="本地服务端口")
    configure_parser.add_argument(
        "--conda-env",
        help=argparse.SUPPRESS,
    )
    configure_parser.add_argument(
        "--python-executable",
        help="Windows 快捷入口使用的 Python 解释器",
    )

    start_parser = subparsers.add_parser("start", help="准备数据并启动审核界面")
    start_parser.add_argument("--no-open", action="store_true", help="不自动打开浏览器")
    stop_parser = subparsers.add_parser("stop", help="关闭审核界面")
    stop_parser.add_argument(
        "--force",
        action="store_true",
        help="服务无响应时强制结束记录中的进程",
    )
    subparsers.add_parser("status", help="查看运行状态")
    subparsers.add_parser("prepare", help="只建立数据索引，不启动界面")
    return parser


def interactive_menu(parser: argparse.ArgumentParser) -> argparse.Namespace:
    print("DataSeg 多类别 Mask 数据标定工具")
    print("1. 启动")
    print("2. 配置")
    print("3. 检查环境")
    print("4. 查看状态")
    print("5. 关闭")
    print("0. 退出")
    choices = {
        "1": ["start"],
        "2": ["configure"],
        "3": ["doctor"],
        "4": ["status"],
        "5": ["stop"],
    }
    choice = input("请选择: ").strip()
    if choice == "0":
        raise SystemExit(0)
    if choice not in choices:
        raise ValueError("无效选择")
    return parser.parse_args(choices[choice])


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.command is None:
        args = interactive_menu(parser)
    if args.command == "doctor":
        return 0 if doctor() else 1
    if args.command == "configure":
        configure(args)
    elif args.command == "start":
        start(args)
    elif args.command == "stop":
        stop(args)
    elif args.command == "status":
        status()
    elif args.command == "prepare":
        config = load_config()
        prepare(config)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\n已取消。", file=sys.stderr)
        raise SystemExit(130)
    except Exception as error:
        print(f"DataSeg 错误：{error}", file=sys.stderr)
        raise SystemExit(1)
