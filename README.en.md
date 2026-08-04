# DataSeg

[中文](README.md) | [English](README.en.md)

DataSeg is a local annotation tool for ultrasound frame sequences. It creates and reviews custom Masks through a Python Tk launcher and a browser interface. SAM2.1 propagates a manually annotated keyframe to preceding and following frames.

Chinese is the default language. Click `English` or `中文` in the upper-right corner of the Tk launcher or web interface to switch languages. The web interface remembers the selected language in the current browser.

## Features

- Lasso, brush, and eraser tools for custom Masks
- Single-frame saving, SAM2 propagation review, and enlarged editing
- Bidirectional SAM2.1 keyframe propagation
- Manage zero to five Mask categories at any time in the browser
- Automatic CUDA or CPU selection
- Project identity, review progress, and write access isolated by output folder
- Cross-device review continuation verified by file-content hashes
- Tk desktop launcher, Windows double-click launcher, and CLI
- Chinese and English interfaces

DataSeg listens only on `127.0.0.1`. Source images remain read-only. DataSeg writes only to the output directory when you save frames or confirm category management actions. Adding a category immediately creates empty Masks for frames that have already been reviewed.

## Requirements

- Windows, Linux, or macOS
- Conda through Miniforge, Miniconda, or Anaconda, recommended
- Python `venv` or a compatible virtual environment, optional
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

### 2. Create the Conda environment (recommended)

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

You can also use the `venv` module included with Python 3.11. On Windows:

```bat
py -3.11 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

On Linux or macOS:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

A `venv` uses the Tcl/Tk runtime supplied by the Python installation that created it. On Windows and macOS, use a Python 3.11 installer that includes Tcl/Tk. On Debian or Ubuntu, install the matching `python3-tk` system package first. Run `python -m tkinter` to check Tk before downloading the model and checking the environment.

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
4. Select the runtime device. Manage Mask categories in the browser annotation page.
5. Click “Save and start”.
6. The annotation page opens in your browser.

Use `English` and `中文` in the upper-right corner to switch languages. The Tk launcher starts in Chinese each time.

DataSeg always uses the Python interpreter that started `dataseg_gui.py` for environment checks, dataset preparation, and the local service. The rightmost read-only **Current environment** field shows `Conda · name`, `venv · directory`, or the full interpreter path. With `.venv`, activate it and run the same launcher command:

```bash
python dataseg_gui.py
```

### Windows double-click launcher

After completing the Conda setup (recommended) or a compatible virtual-environment setup and downloading the model, double-click:

```text
DataSeg启动器.cmd
```

After settings have been saved, the shortcut first uses the Python interpreter recorded in `config.json`. If that interpreter is unavailable, it tries the configured or default `usdia-seg` Conda environment, a project-local `.venv`, and finally Python on `PATH`.

The first time you use a custom Conda environment, `.venv`, or another compatible virtual environment, activate it, run `python dataseg_gui.py`, and save the settings. Future double-click launches keep using that interpreter. Existing `conda_env` configuration remains supported as a fallback.

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
  --device auto ^
  --port 8767
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
  "sam2_device": "auto",
  "python_executable": "",
  "port": 8767
}
```

Saving from the desktop launcher writes the absolute path of the current interpreter to `python_executable`. The example stays empty so a machine-specific path is not committed. The legacy `conda_env` field is read only as a compatibility fallback by the Windows double-click launcher.

Mask category metadata is stored in `.dataseg/project.json` inside the output project, not in the local `config.json`. Current project metadata uses `schema_version=3`. DataSeg migrates an older `schema_version=2` project in place the first time it is opened. A project with `vessel_only=true` becomes one active `vessel` category. Other legacy projects become active `vessel` and `lesion` categories. Existing folders, Mask files, and review progress remain in place without being moved or rewritten.

The web service binds only to the loopback address. Logs go to `logs/`, and service state goes to `runtime/`. Git ignores both directories.

## Mask category management

Mask categories are managed only in the left rail of the browser annotation interface. A new project starts with zero active categories and offers an **Add first category** action when it is first opened. With no active categories, you can still browse images and open Archive recovery, but drawing, saving, and SAM2 propagation are unavailable.

Adding a category requires these values:

- Display name: the custom name shown in the interface. It accepts Unicode. Active display names must be unique when compared without case. Custom names are shown unchanged in both the Chinese and English interfaces.
- Folder name: the stable name used in output data. It must match `[a-z][a-z0-9_-]{0,31}`. Active folder names must be unique and cannot be changed after creation.
- Overlay color: a `#RRGGBB` color selected with the color picker. Active colors must be unique. Overlay opacity is fixed at 44 percent so that the ultrasound image remains visible underneath.

The active list contains at most five categories and scrolls independently in the left rail. Category order maps to number keys `1`–`5`. Clicking a category selects it and makes it visible. The visibility control on each row changes only the overlay and never changes Mask data. Hiding the active category pauses drawing. Selecting it again shows it and allows editing to continue.

You can add a category midway through review. Previously reviewed frames remain reviewed. DataSeg creates an empty binary PNG for the new category on each of those frames without inferring or copying annotations. Editing a category can change only its display name and color. Its folder name always remains unchanged. Adding and editing remain available when the current frame has unsaved changes.

Deleting a category requires confirmation. DataSeg moves its metadata and Masks into a recoverable archive inside the current project, and the last active category can also be deleted. Use **Archive recovery** at the bottom of the left rail to restore the original category and Masks. If a new category reuses a folder name found in the archive, you must explicitly restore the archived data or keep the archive and start an empty category with the current input. Save or discard changes to the current frame before deleting or restoring a category. Category management is temporarily disabled during frame saves, SAM2 propagation review, propagation editing, and other category operations.

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
│  └─ <folder-name>/       # One directory per active Mask category
│     └─ clip-name/
│        └─ frame_*.png
├─ annotation_manifest.csv
├─ annotation_manifest.jsonl
└─ .dataseg/
   ├─ project.json
   ├─ reviewer_state.json
   ├─ annotation_index.json
   ├─ mask_archive/        # Present when categories are archived
   │  └─ <archive-id>/
   │     └─ clip-name/
   │        └─ frame_*.png
   ├─ prepared/
   └─ candidate_labels/
```

DataSeg creates a Mask directory only when you add that category. It never pre-creates five category directories. With zero active categories, `masks/` has no active category subdirectories. Every category Mask for a reviewed frame is a binary PNG.

`annotation_manifest.csv` and `annotation_manifest.jsonl` derive their fields from the active categories. In addition to image and review information, each active category adds a `<folder-name>_mask` field whose value is the Mask path relative to the output project. Archived categories are omitted from active manifests.

`.dataseg/project.json` is the sole source of active and archived category metadata. `.dataseg/reviewer_state.json` stores review progress. Archived Masks are stored under `.dataseg/mask_archive/<archive-id>`. Project metadata, review progress, and archived data travel with the complete output directory. Selecting a new empty directory creates an independent project. Copying an existing output directory preserves its project ID, review progress, and Mask categories.

DataSeg does not create train, validation, or test splits. Split by subject before splitting by complete acquisition clip. Do not randomly split consecutive frames or place one subject in multiple sets.

## Continue reviewing on another device

Copy both of these items to the other computer:

1. The complete source directory, including each clip's `frames/` directory and any existing `metadata.csv`.
2. The complete output directory, including the hidden `.dataseg/` directory, `images/`, and `masks/`.

Select the copied source and output directories in the launcher, then click “Save and start.” DataSeg verifies the PNG contents, file names, and `metadata.csv` in each clip with SHA-256. Absolute paths and file modification times are excluded, so a different drive letter, user name, or parent directory does not prevent recognition.

Older projects do not yet contain content hashes. During their first migration, DataSeg checks the clip and frame index and compares every reviewed source image with its saved output copy. After verification, it records the content hashes and the new device path while preserving the project ID, review state, and Masks. The first migration reads every source file and may take longer than a normal start.

Do not edit `project.json`, `reviewer_state.json`, or the project ID by hand. DataSeg stops the migration when source contents, file names, clip structure, or reviewed outputs differ, preventing progress from being attached to the wrong dataset.

## Annotation controls

Use the selectors under **Current image** to jump directly to a clip or frame. Selecting a clip opens its first pending frame, while selecting a frame opens that image directly. **Jump to next pending frame** searches forward from the current position and wraps to the beginning after the last frame. DataSeg still asks for confirmation before leaving unsaved Mask changes.

| Action | Shortcut |
| --- | --- |
| Select Mask category 1 through 5 | `1`–`5` |
| Lasso | `Q` |
| Brush | `W` |
| Eraser | `E` |
| Previous or next frame | `←`, `→` |
| Save the current frame | `S` |
| Save and jump to the earliest pending frame | `Enter` |
| Show or hide Masks | `M` |
| Propagate from the current SAM2 keyframe | `P` |
| Clear the current frame's Masks | `X` |

SAM2 propagates the selected Mask category while every other category keeps its existing content on each frame. The enlarged editor for a propagation batch shows every active category, and number keys `1`–`5` switch categories in the same order. Reviewed frames before the current keyframe always stay protected and cannot be overwritten. To replace reviewed results after the keyframe, enable **Allow overwriting following reviewed frames** in the propagation preview and manually select the frames to overwrite. The confirmation shows how many reviewed frames will be replaced. Unselected reviewed results remain unchanged. After accepting a batch, the review page stays on the last frame saved in that batch.

In the propagation preview, Shift-click a checkbox to select or clear a frame range, or hold the pointer and drag across checkboxes to update several frames. In the enlarged editor, press `X` to clear every Mask on the current frame and `Ctrl+Z` to undo.

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

In a Conda environment, reinstall Tk:

```bash
conda install -n usdia-seg -c conda-forge --force-reinstall tk
```

With `.venv`, Tk comes from the base Python installation and cannot be added with `pip install tkinter`. On Windows or macOS, repair or reinstall Python 3.11 with Tcl/Tk and recreate `.venv`. On Debian or Ubuntu, install the matching `python3-tk` system package and recreate `.venv`.

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
