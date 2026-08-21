# MoiraiSeg

[中文](README.md) | [English](README.en.md)

MoiraiSeg 是一个面向二维影像帧序列的本地优先、持续开源分割工作台。它把人工勾画、SAM2.1 双向传播、逐帧审核和数据集导出放在同一条流程中，帮助团队制作可追溯的二值 Mask 数据集。

> 项目处于早期开发阶段。处理医学影像时，它仅用于研究和数据标注，不用于临床诊断、治疗决策或医疗器械用途。

## 适用范围

MoiraiSeg 适合这些工作：

- 标注由二维图像组成的连续帧或有序切片序列
- 处理超声、内镜、显微、遥感和工业检测等已经转换为 PNG 帧的影像
- 为目标物、缺陷、器官边界或其他研究对象建立最多 5 个独立 Mask 类别
- 用少量人工关键帧带动前后帧标注，再逐帧确认或修正
- 在本机处理敏感影像，原始图像始终只读
- 导出训练前可继续整理的图像、二值 PNG Mask 和清单文件
- 把完整输出项目复制到另一台电脑后继续审核

当前版本没有覆盖这些场景：

- DICOM、NIfTI、MP4、AVI 或设备私有格式的直接导入
- 原生三维体数据、四维影像、多光谱数据或多平面同步标注
- 多人同时编辑、远程协作和权限管理
- 模型训练、自动评估或临床推理
- 自动生成 train、validation 和 test 划分

## 当前能力

- 套索、画笔和橡皮擦编辑
- SAM2.1 Hiera Tiny 关键帧双向传播
- 单帧保存、传播批次筛选和放大微调
- 0 到 5 个自定义 Mask 类别，支持归档和恢复
- CUDA 与 CPU 自动选择
- 中文和英文界面
- Tk 桌面启动器、浏览器界面和命令行入口
- 基于内容哈希的跨设备项目识别
- 本机回环服务，只监听 `127.0.0.1`

## 标注流程

1. 把每个采集片段整理为 `frames/` 目录下的一组 PNG。
2. 选择原始数据目录和单独的输出目录。
3. 在浏览器中创建 Mask 类别并勾画关键帧。
4. 用 SAM2.1 向前、向后传播，取消边界不准的帧并微调。
5. 保存审核结果，使用导出的清单进入训练前清洗，并按独立数据来源划分数据集。

画面内容突变、视角切换、目标明显变形或目标离开画面时，应停止当前传播批次，重新选择关键帧。

## 快速开始

### 1. 获取代码

```bash
git clone https://github.com/jasonboi/moiraiseg.git
cd moiraiseg
```

### 2. 创建环境

推荐 Python 3.11 和 Conda：

```bash
conda env create -f environment.yml
conda activate moiraiseg
python -m pip install -r requirements.txt
```

也可以使用 `venv`：

```bash
python -m venv .venv
```

Windows：

```bat
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Linux 或 macOS：

```bash
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

桌面启动器需要 Tcl/Tk。只使用命令行和浏览器服务时不需要 Tk 界面。

需要 NVIDIA GPU 加速时，请按 [PyTorch 官方说明](https://pytorch.org/get-started/locally/)安装与本机 CUDA 匹配的 PyTorch 和 TorchVision。

### 3. 下载模型并检查环境

```bash
python scripts/download_model.py
python moiraiseg.py doctor
```

模型脚本从 Meta 官方地址下载 `sam2.1_hiera_tiny.pt`，校验 SHA-256 后保存到 `sam2/checkpoints/`。模型文件约占 160 MB，不提交到 Git。

### 4. 启动

桌面启动器：

```bash
python moiraiseg_gui.py
```

Windows 完成首次配置后也可以双击 `MoiraiSeg启动器.cmd`。

命令行：

```bash
python moiraiseg.py configure
python moiraiseg.py start
python moiraiseg.py status
python moiraiseg.py stop
```

其他命令：

```bash
python moiraiseg.py prepare
python moiraiseg.py start --no-open
python moiraiseg.py stop --force
```

## 当前影像加载逻辑

输入可以是单个采集片段，也可以是包含多个片段的批次。

单个片段：

```text
carotid-long-axis/
├─ frames/
│  ├─ frame_000000.png
│  └─ frame_000001.png
├─ metadata.csv       # 可选
└─ preview.mp4        # 保留，但不会读取
```

批次：

```text
20260720/
├─ carotid-long-axis/
│  └─ frames/
└─ femoral-vein/
   └─ frames/
```

加载器按以下规则工作：

1. 如果所选目录直接包含 `frames/`，它会被视为一个片段。
2. 否则只扫描所选目录的下一层子目录，并选出含有 `frames/` 的目录。加载器不会递归查找更深层级。
3. 只使用 `frames/*.png` 模式读取文件。扩展名大小写匹配会跟随操作系统，Windows 与 Linux 可能不同。JPEG、TIFF、DICOM、NIfTI 和视频不会进入索引。
4. 帧顺序优先使用 `metadata.csv` 中的 `frame` 字段。没有该值时，从文件名里的第一段数字取帧号。仍取不到数字时，使用按文件名排序后的位置。
5. `metadata.csv` 必须包含 `file` 列，且 `file` 值不能重复。CSV 可以完全省略。
6. 同一片段中的所有 PNG 必须具有相同宽高，帧号也必须唯一。
7. 加载器为文件名、文件大小、内容和可选 CSV 计算签名。审核开始后，帧结构或内容变化会阻止项目继续写入。
8. 浏览器按索引中的绝对源路径按需读取图像。原始目录保持只读，已审核图像和 Mask 写入单独的输出目录。

输出目录不能等于原始目录，也不能位于原始目录内部。

## 输出结构

```text
reviewed-data/
├─ images/
│  └─ <片段名>/
├─ masks/
│  └─ <类别文件夹名>/
│     └─ <片段名>/
├─ annotation_manifest.csv
├─ annotation_manifest.jsonl
└─ .moiraiseg/
   ├─ project.json
   ├─ reviewer_state.json
   ├─ annotation_index.json
   ├─ mask_archive/
   ├─ prepared/
   └─ candidate_labels/
```

每个已审核帧会为每个活动类别生成一张二值 PNG。清单会为每个活动类别增加 `<folder-name>_mask` 字段。归档类别不会出现在活动清单中。

完整复制原始目录和输出目录即可在另一台电脑继续审核。必须保留隐藏的 `.moiraiseg/` 目录。路径和文件修改时间可以变化，文件内容、文件名和片段结构必须保持一致。

## Mask 类别与快捷键

每个类别包含显示名称、稳定的文件夹名称和覆盖颜色。文件夹名称必须匹配 `[a-z][a-z0-9_-]{0,31}`，创建后不能修改。删除类别会先移入项目内归档，永久删除归档需要再次确认。

| 操作 | 快捷键 |
| --- | --- |
| 选择第 1 至 5 个类别 | `1`–`5` |
| 套索、画笔、橡皮擦 | `Q`、`W`、`E` |
| 上一帧、下一帧 | `←`、`→` |
| 保存当前帧 | `S` |
| 保存并跳到下一张未审核帧 | `Enter` |
| 显示或隐藏 Mask | `M` |
| 从当前关键帧传播 | `P` |
| 清空当前帧 Mask | `X` |

默认向前传播 4 帧，向后传播 16 帧。向前范围为 0 到 32，向后接受任意非负数，并在片段末尾停止。更大的范围会增加显存占用和等待时间。

## 面向更多使用者的改造顺序

下面这些改造会把当前的固定目录加载器变成可扩展的数据入口：

1. 定义统一的 `ImageSource` 接口，把片段发现、帧排序、像素读取和数据指纹分开。
2. 先增加清单驱动导入和常见静态图像格式，再添加视频解码与 DICOM 适配器。
3. 给灰度转换、位深、方向、窗宽窗位和尺寸变化建立显式策略，禁止静默转换医学影像。
4. 把桌面启动器设为可选依赖，补充无界面安装包和容器入口。
5. 扩展自动化测试，覆盖 Windows、Linux、macOS、路径迁移和真实小型样例数据。
6. 在导出层增加 COCO、CVAT 和 nnU-Net 等适配器，内部项目格式继续保持稳定。

当前仓库先加入跨平台的轻量 CI，检查 Python 语法、命令行入口和加载器规则。模型推理测试需要单独的带 GPU 工作流，普通贡献者提交代码时不会下载模型权重。

## 参与贡献

项目欢迎影像格式适配、交互改进、测试、文档和数据导出方面的贡献。开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。涉及临床数据的 issue、测试和截图必须先去标识化，不要提交原始影像、患者信息、模型权重或本机配置。

## SAM2 来源与许可证

仓库保留了 [facebookresearch/sam2](https://github.com/facebookresearch/sam2) 提交 `2b90b9f5ceec907a1c18123530e92e794ad901a4b` 的运行子集。上游许可证位于 `sam2/LICENSE` 和 `sam2/LICENSE_cctorch`，精简说明见 `sam2/VENDORED.md`。

MoiraiSeg 自有代码使用 [Apache License 2.0](LICENSE)。仓库内的 SAM2 和 cctorch 代码遵循各自许可证。
