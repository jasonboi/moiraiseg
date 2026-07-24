# DataSeg

[中文](README.md) | [English](README.en.md)

DataSeg 是一个面向超声连续帧的本地数据标定工具，用于制作和审核血管、肿瘤 Mask。它提供 Python Tk 桌面启动器和浏览器标定界面，并使用 SAM2.1 从人工关键帧向前、向后传播 Mask。

项目默认使用中文。Tk 启动器和网页右上角都可以点击 `English` 切换英文，网页会在当前浏览器中记住语言选择。

## 功能

- 套索、画笔和橡皮擦编辑血管与肿瘤 Mask
- 单帧保存、连续帧批量审核和放大微调
- SAM2.1 关键帧双向传播
- 仅血管、血管与肿瘤两种标注模式
- 自动选择 CUDA 或 CPU
- 按输出目录隔离项目、审核进度与写入权限
- Tk 桌面启动器、Windows 双击入口和命令行入口
- 中文与英文界面

DataSeg 只监听 `127.0.0.1`。原始图像保持只读，只有确认保存的图像和 Mask 会写入输出目录。

## 系统要求

- Windows、Linux 或 macOS
- Conda、Miniforge、Miniconda 或 Anaconda
- Python 3.11
- Tcl/Tk，仅桌面启动器需要
- 支持 CUDA 的 NVIDIA GPU，可选
- 约 160 MB 磁盘空间用于 SAM2.1 Hiera Tiny 权重

CPU 可以运行 SAM2，传播速度会明显慢于 CUDA。

## 安装

### 1. 克隆仓库

```bash
git clone https://github.com/jasonboi/DataSeg.git
cd DataSeg
```

仓库包含 DataSeg 和运行所需的精简版 SAM2 源码。模型权重不放进 Git，安装时由官方地址下载。

### 2. 创建 Conda 环境

```bash
conda env create -f environment.yml
conda activate usdia-seg
python -m pip install -r requirements.txt
```

`environment.yml` 默认创建 `usdia-seg`。已有同名环境时，可以直接激活后安装依赖。

如果需要指定其他环境名：

```bash
conda env create -f environment.yml -n my-dataseg
conda activate my-dataseg
python -m pip install -r requirements.txt
```

需要 NVIDIA GPU 加速时，先根据目标电脑的 CUDA 情况按照 [PyTorch 官方安装说明](https://pytorch.org/get-started/locally/)安装 PyTorch 和 TorchVision，再安装其余依赖。

### 3. 下载 SAM2 模型

```bash
python scripts/download_model.py
```

脚本从 Meta 官方地址下载 `sam2.1_hiera_tiny.pt`，校验 SHA-256，然后保存到：

```text
sam2/checkpoints/sam2.1_hiera_tiny.pt
```

文件已经存在且校验通过时，脚本不会重复下载。需要替换损坏文件时运行：

```bash
python scripts/download_model.py --force
```

### 4. 检查环境

```bash
python dataseg.py doctor
```

检查内容包括 Python、Pillow、NumPy、PyTorch、TorchVision、Tcl/Tk、SAM2 源码和模型权重。

## 启动方式

### Python 桌面启动器

```bash
conda activate usdia-seg
python dataseg_gui.py
```

在启动器中：

1. 选择待处理原始数据目录。
2. 选择处理后数据目录。
3. 设置 SAM2 向前和向后传播帧数。
4. 选择标注模式和运行设备。
5. 点击“保存并启动”。
6. 浏览器会打开标定页面。

右上角的 `English` 和 `中文` 按钮用于切换界面语言。Tk 启动器每次打开时默认使用中文。

### Windows 双击启动

创建 `usdia-seg` 环境并下载模型后，双击：

```text
DataSeg启动器.cmd
```

快捷入口会读取本地 `config.json` 中的 Conda 环境名。首次运行还没有配置文件时，它使用默认环境 `usdia-seg`。

如果使用自定义环境名，第一次先在已激活的环境中运行 `python dataseg_gui.py` 并保存配置。之后双击入口会使用保存的环境名。

### 命令行

```bash
python dataseg.py configure
python dataseg.py start
python dataseg.py status
python dataseg.py stop
```

其他命令：

```bash
python dataseg.py doctor
python dataseg.py prepare
python dataseg.py start --no-open
python dataseg.py stop --force
```

- `doctor` 检查运行环境。
- `prepare` 只扫描数据并建立索引。
- `start --no-open` 启动服务但不自动打开浏览器。
- `stop --force` 只用于服务无响应且启动记录仍存在的情况。

### 非交互配置

Windows CMD 示例：

```bat
python dataseg.py configure ^
  --raw "D:\ultrasound\20260720" ^
  --output "D:\ultrasound-reviewed" ^
  --before 4 ^
  --after 16 ^
  --mode vessel ^
  --device auto ^
  --port 8767 ^
  --conda-env usdia-seg
```

PowerShell、Git Bash、Linux 和 macOS 可以写成一行，或改用对应终端的续行符。

## 本地配置

第一次保存设置后会生成 `config.json`。它包含本机数据路径，因此已经加入 `.gitignore`，不会提交到 GitHub。

安全示例位于 `config.example.json`：

```json
{
  "schema_version": 1,
  "raw_data_dir": "",
  "output_dir": "",
  "sam2_before_frames": 4,
  "sam2_after_frames": 16,
  "vessel_only": true,
  "sam2_device": "auto",
  "conda_env": "usdia-seg",
  "port": 8767
}
```

网页服务只绑定本机回环地址。日志写入 `logs/`，运行状态写入 `runtime/`，两者都不会提交。

## 输入数据格式

可以选择包含多个采集片段的批次目录：

```text
20260720/
├─ 20260720_155631_颈动脉/
│  ├─ frames/
│  │  ├─ frame_000000_....png
│  │  └─ frame_000001_....png
│  ├─ metadata.csv
│  └─ preview.mp4
└─ 20260720_161611_股静脉/
   └─ frames/
```

也可以直接选择自身含有 `frames/` 的单个采集片段。DataSeg 读取 `frames/` 中的 PNG。`metadata.csv` 和 `preview.mp4` 可以保留，`metadata.csv` 不是必需文件。

处理后目录不能与原始目录相同，也不能放在原始目录内部。

## 输出结构

```text
处理后数据/
├─ images/
│  └─ 采集片段名/
│     └─ frame_*.png
├─ masks/
│  ├─ vessel/
│  │  └─ 采集片段名/
│  │     └─ frame_*.png
│  └─ lesion/
│     └─ 采集片段名/
│        └─ frame_*.png
├─ annotation_manifest.csv
├─ annotation_manifest.jsonl
└─ .dataseg/
   ├─ project.json
   ├─ reviewer_state.json
   ├─ annotation_index.json
   ├─ prepared/
   └─ candidate_labels/
```

`.dataseg/reviewer_state.json` 保存审核进度。项目 ID 与输出目录绑定，更换输出目录会创建独立项目。

DataSeg 不划分 train、validation 和 test。训练前应按受试者划分，其次按完整采集片段划分。不要随机拆分连续帧，也不要让同一受试者的数据出现在多个集合中。

## 标定操作

右侧“当前图像”区域可以直接选择片段和帧。选择片段时会跳到该片段首张待审核帧，选择帧时会直接跳到对应图像。当前 Mask 有未保存修改时，离开前仍会要求确认。

| 操作 | 快捷键 |
| --- | --- |
| 选择血管 Mask | `1` |
| 选择肿瘤 Mask | `2` |
| 套索 | `Q` |
| 画笔 | `W` |
| 橡皮擦 | `E` |
| 上一帧、下一帧 | `←`、`→` |
| 仅保存当前帧 | `S` |
| 保存并跳到最早未审核帧 | `Enter` |
| 显示或隐藏 Mask | `M` |
| 打开连续帧批量审核 | `B` |
| 从当前关键帧进行 SAM2 传播 | `P` |
| 清空当前帧 Mask | `X` |

SAM2 会传播当前选中的 Mask 类别。另一类 Mask 保留每帧原有内容，已经审核的帧只用于对照，不会被覆盖。

默认向前 4 帧、向后 16 帧，允许范围是 0 到 32。探头移动、目标形态突变、横纵切换或目标离开画面时，应取消边界不准的帧，重新选择关键帧传播。

## 常见问题

### 缺少 SAM2 模型

运行：

```bash
python scripts/download_model.py
```

下载中断或校验失败时：

```bash
python scripts/download_model.py --force
```

### `init.tcl` 或 Tcl/Tk 错误

在当前环境重新安装 Tk：

```bash
conda install -n usdia-seg -c conda-forge --force-reinstall tk
```

如果只使用命令行和浏览器服务，Tk 启动器不是必需的。

### CUDA 不可用

`auto` 会在 CUDA 可用时使用 GPU，否则回退 CPU。运行 `python dataseg.py doctor` 查看 PyTorch、CUDA 和 GPU 状态。

### 端口被占用

在启动器中更换端口，或运行：

```bash
python dataseg.py status
python dataseg.py stop
```

### 浏览器页面属于旧项目

关闭旧页面，从 Tk 启动器重新点击“打开标定页面”。DataSeg 会校验项目 ID 和服务实例，旧页面不能向新项目写入 Mask。

## 仓库结构

```text
DataSeg/
├─ app/                    # 本地 HTTP 服务和网页标定界面
├─ sam2/sam2/              # 运行所需的精简版 SAM2 源码
├─ scripts/                # 下载模型、准备数据和启动脚本
├─ config.example.json     # 安全配置示例
├─ dataseg.py              # 命令行入口
├─ dataseg_gui.py          # Tk 桌面启动器
├─ DataSeg启动器.cmd       # Windows 双击入口
├─ environment.yml
├─ LICENSE
├─ requirements.txt
├─ README.md
└─ README.en.md
```

## SAM2 来源

本项目保留了 [facebookresearch/sam2](https://github.com/facebookresearch/sam2) 在提交 `2b90b9f5ceec907a1c18123530e92e794ad901a4b` 的运行子集。示例、notebook、训练、数据集和 Docker 内容已经删除。上游许可证保存在 `sam2/LICENSE` 和 `sam2/LICENSE_cctorch`，精简说明见 `sam2/VENDORED.md`。

## 许可证

DataSeg 自有代码使用 [Apache License 2.0](LICENSE)。仓库中保留的 SAM2 和 cctorch 代码分别遵循 `sam2/LICENSE` 与 `sam2/LICENSE_cctorch`。
