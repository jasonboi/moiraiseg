# DataSeg

[中文](README.md) | [English](README.en.md)

DataSeg is a local annotation tool for ultrasound frame sequences. It creates and reviews vessel and lesion Masks through a Python Tk launcher and a browser interface. SAM2.1 propagates a manually annotated keyframe to preceding and following frames.

Chinese is the default language. Click `English` or `中文` in the upper-right corner of the Tk launcher or web interface to switch languages. The web interface remembers the selected language in the current browser.

## Features

- Lasso, brush, and eraser tools for vessel and lesion Masks
- Single-frame saving, consecutive-frame batch review, and enlarged editing
- Bidirectional SAM2.1 keyframe propagation
- Vessel-only and vessel-plus-lesion annotation modes
- Automatic CUDA or CPU selection
- Project identity, review progress, and write access isolated by output folder
- Tk desktop launcher, Windows double-click launcher, and CLI
- Chinese and English interfaces

DataSeg listens only on `127.0.0.1`. Source images remain read-only. It writes images and Masks to the output directory only after you confirm a save.

## Requirements

- Windows, Linux, or macOS
- Conda through Miniforge, Miniconda, or Anaconda
- Python 3.11
- Tcl/Tk for the desktop launcher
- An NVIDIA GPU with CUDA support, optional
- About 160 MB of disk space for the SAM2.1 Hiera Tiny checkpoint

SAM2 works on a CPU, but propagation is substantially slower than CUDA.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/jasonboi/DataSeg.git
cd DataSeg
```

The repository includes DataSeg and the trimmed SAM2 runtime source. The model checkpoint is downloaded from the official host during setup.

### 2. Create the Conda environment

```bash
conda env create -f environment.yml
conda activate usdia-seg
python -m pip install -r requirements.txt
```

`environment.yml` creates an environment named `usdia-seg`. If it already exists, activate it and install the requirements.

To use a different name:

```bash
conda env create -f environment.yml -n my-dataseg
conda activate my-dataseg
python -m pip install -r requirements.txt
```

For NVIDIA GPU acceleration, install PyTorch and TorchVision for the target computer by following the [official PyTorch instructions](https://pytorch.org/get-started/locally/), then install the remaining requirements.

### 3. Download the SAM2 model

```bash
python scripts/download_model.py
```

The script downloads `sam2.1_hiera_tiny.pt` from Meta's official host, verifies its SHA-256 digest, and saves it to:

```text
sam2/checkpoints/sam2.1_hiera_tiny.pt
```

It skips an existing file when the digest is correct. To replace a damaged file:

```bash
python scripts/download_model.py --force
```

### 4. Check the environment

```bash
python dataseg.py doctor
```

The check covers Python, Pillow, NumPy, PyTorch, TorchVision, Tcl/Tk, the SAM2 source, and the model checkpoint.

## Starting DataSeg

### Python desktop launcher

```bash
conda activate usdia-seg
python dataseg_gui.py
```

In the launcher:

1. Select the source data directory.
2. Select the output directory.
3. Set the number of preceding and following SAM2 propagation frames.
4. Select the annotation mode and device.
5. Click “Save and start”.
6. The annotation page opens in your browser.

Use `English` and `中文` in the upper-right corner to switch languages. The Tk launcher starts in Chinese each time.

### Windows double-click launcher

After creating `usdia-seg` and downloading the model, double-click:

```text
DataSeg启动器.cmd
```

The launcher reads the Conda environment name from the local `config.json`. Before the first configuration is saved, it uses `usdia-seg`.

If you use a custom environment name, first activate that environment, run `python dataseg_gui.py`, and save the configuration. Future double-click launches will use the saved name.

### Command line

```bash
python dataseg.py configure
python dataseg.py start
python dataseg.py status
python dataseg.py stop
```

Additional commands:

```bash
python dataseg.py doctor
python dataseg.py prepare
python dataseg.py start --no-open
python dataseg.py stop --force
```

- `doctor` checks the runtime.
- `prepare` scans the data and builds the index without starting the service.
- `start --no-open` starts the service without opening a browser.
- `stop --force` is for an unresponsive service whose launch record still exists.

### Non-interactive configuration

Windows CMD example:

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

On PowerShell, Git Bash, Linux, or macOS, place the arguments on one line or use the shell's continuation character.

## Local configuration

Saving settings creates `config.json`. It contains paths from the local computer, so `.gitignore` excludes it from GitHub.

The safe template is `config.example.json`:

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

The web service binds only to the loopback address. Logs go to `logs/`, and service state goes to `runtime/`. Git ignores both directories.

## Input data

You can select a batch directory containing multiple acquisition clips:

```text
20260720/
├─ 20260720_155631_carotid/
│  ├─ frames/
│  │  ├─ frame_000000_....png
│  │  └─ frame_000001_....png
│  ├─ metadata.csv
│  └─ preview.mp4
└─ 20260720_161611_femoral-vein/
   └─ frames/
```

You can also select one clip that directly contains `frames/`. DataSeg reads PNG files from `frames/`. `metadata.csv` and `preview.mp4` may remain in place. `metadata.csv` is optional.

The output directory must differ from the source directory and cannot be inside it.

## Output

```text
reviewed-data/
├─ images/
│  └─ clip-name/
│     └─ frame_*.png
├─ masks/
│  ├─ vessel/
│  │  └─ clip-name/
│  │     └─ frame_*.png
│  └─ lesion/
│     └─ clip-name/
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

`.dataseg/reviewer_state.json` stores review progress. A project ID is bound to the output directory, so changing the output directory creates an independent project.

DataSeg does not create train, validation, or test splits. Split by subject before splitting by complete acquisition clip. Do not randomly split consecutive frames or place one subject in multiple sets.

## Annotation controls

Use the selectors under **Current image** to jump directly to a clip or frame. Selecting a clip opens its first pending frame, while selecting a frame opens that image directly. DataSeg still asks for confirmation before leaving unsaved Mask changes.

| Action | Shortcut |
| --- | --- |
| Select vessel Mask | `1` |
| Select lesion Mask | `2` |
| Lasso | `Q` |
| Brush | `W` |
| Eraser | `E` |
| Previous or next frame | `←`, `→` |
| Save the current frame | `S` |
| Save and jump to the earliest pending frame | `Enter` |
| Show or hide Masks | `M` |
| Open consecutive-frame batch review | `B` |
| Propagate from the current SAM2 keyframe | `P` |
| Clear the current frame's Masks | `X` |

SAM2 propagates the selected Mask label. The other label keeps its existing content on each frame. Reviewed frames are shown as references and are never overwritten.

The default range is 4 previous frames and 16 following frames. Each value may be between 0 and 32. Unselect inaccurate frames and choose a new keyframe when the probe moves, the target shape changes, the view changes, or the target leaves the image.

## Troubleshooting

### Missing SAM2 model

Run:

```bash
python scripts/download_model.py
```

After an interrupted download or digest failure:

```bash
python scripts/download_model.py --force
```

### `init.tcl` or Tcl/Tk errors

Reinstall Tk in the active environment:

```bash
conda install -n usdia-seg -c conda-forge --force-reinstall tk
```

Tk is optional when you use only the CLI and browser service.

### CUDA is unavailable

`auto` uses CUDA when available and otherwise falls back to the CPU. Run `python dataseg.py doctor` to inspect PyTorch, CUDA, and GPU status.

### The port is already in use

Choose another port in the launcher, or run:

```bash
python dataseg.py status
python dataseg.py stop
```

### The browser page belongs to an old project

Close the old page and click “Open annotation page” in the Tk launcher. DataSeg checks the project ID and service instance, so an old page cannot write Masks to a new project.

## Repository layout

```text
DataSeg/
├─ app/                    # Local HTTP service and web annotation interface
├─ sam2/sam2/              # Trimmed SAM2 runtime source
├─ scripts/                # Model download, data preparation, and launch scripts
├─ config.example.json     # Safe configuration template
├─ dataseg.py              # CLI entry point
├─ dataseg_gui.py          # Tk desktop launcher
├─ DataSeg启动器.cmd       # Windows double-click launcher
├─ environment.yml
├─ LICENSE
├─ requirements.txt
├─ README.md
└─ README.en.md
```

## SAM2 source

This repository retains the runtime subset of [facebookresearch/sam2](https://github.com/facebookresearch/sam2) at commit `2b90b9f5ceec907a1c18123530e92e794ad901a4b`. Demos, notebooks, training code, datasets, and Docker files were removed. The upstream licenses remain at `sam2/LICENSE` and `sam2/LICENSE_cctorch`. See `sam2/VENDORED.md` for the trimming record.

## License

DataSeg's original code is licensed under the [Apache License 2.0](LICENSE). The vendored SAM2 and cctorch code remain governed by `sam2/LICENSE` and `sam2/LICENSE_cctorch`.
