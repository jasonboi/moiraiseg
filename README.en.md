# MoiraiSeg

[中文](README.md) | [English](README.en.md)

MoiraiSeg is a local-first, open-source workbench for segmenting 2D image sequences. It combines manual drawing, bidirectional SAM2.1 propagation, frame-level review, and dataset export in one workflow.

> MoiraiSeg is early-stage software. When used with medical images, it is intended only for research and annotation, not for clinical diagnosis, treatment decisions, or medical-device use.

## Scope

MoiraiSeg currently supports:

- Ordered 2D frames or slices stored as PNG files
- Ultrasound, endoscopy, microscopy, remote-sensing, and industrial-inspection images after conversion to PNG frames
- Up to five independent Mask categories for objects, defects, anatomical boundaries, or other research targets
- Manual keyframes followed by reviewable forward and backward propagation
- Local processing that keeps source images read-only
- Binary PNG Masks plus CSV and JSONL manifests
- Continuing a review project after copying it to another computer

The current release does not directly import DICOM, NIfTI, video, or device-specific formats. It does not natively handle 3D volumes, 4D images, multispectral data, concurrent multi-user editing, model training, clinical inference, or automatic dataset splitting.

## Features

- Lasso, brush, and eraser editing
- SAM2.1 Hiera Tiny propagation
- Single-frame saves, propagation-batch selection, and enlarged editing
- Zero to five custom Mask categories with archive recovery
- Automatic CUDA or CPU selection
- Chinese and English interfaces
- Tk launcher, browser interface, and CLI
- Content-hash verification for project moves
- A loopback-only service bound to `127.0.0.1`

## Annotation workflow

1. Put each acquisition clip's PNG images in a `frames/` directory.
2. Select the source directory and a separate output directory.
3. Create Mask categories and draw a keyframe in the browser.
4. Propagate with SAM2.1, reject inaccurate frames, and refine the accepted Masks.
5. Save reviewed frames, then clean and split the exported dataset by independent data source before training.

Start a new propagation batch when the scene changes sharply, the view switches, the target deforms substantially, or the target leaves the image.

## Quick start

```bash
git clone https://github.com/jasonboi/moiraiseg.git
cd moiraiseg
```

Create the recommended Python 3.11 Conda environment:

```bash
conda env create -f environment.yml
conda activate moiraiseg
python -m pip install -r requirements.txt
```

Or use `venv`:

```bash
python -m venv .venv
```

Windows:

```bat
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Linux or macOS:

```bash
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

The desktop launcher requires Tcl/Tk. Install PyTorch and TorchVision using the [official PyTorch instructions](https://pytorch.org/get-started/locally/) when the machine needs a specific CUDA build.

Download the model and check the environment:

```bash
python scripts/download_model.py
python moiraiseg.py doctor
```

The downloader verifies the checkpoint's SHA-256 digest and stores it under `sam2/checkpoints/`. The roughly 160 MB checkpoint is not tracked by Git.

Start the desktop launcher:

```bash
python moiraiseg_gui.py
```

Windows users can launch `MoiraiSeg启动器.cmd`.

CLI workflow:

```bash
python moiraiseg.py configure
python moiraiseg.py start
python moiraiseg.py status
python moiraiseg.py stop
```

Additional commands:

```bash
python moiraiseg.py prepare
python moiraiseg.py start --no-open
python moiraiseg.py stop --force
```

## Current image-loading behavior

The selected source may be one clip or a batch of clips.

```text
20260720/
├─ carotid-long-axis/
│  ├─ frames/
│  │  ├─ frame_000000.png
│  │  └─ frame_000001.png
│  ├─ metadata.csv       # Optional
│  └─ preview.mp4        # Kept but not read
└─ femoral-vein/
   └─ frames/
```

The loader applies these rules:

1. A selected directory that directly contains `frames/` is one clip.
2. Otherwise, only its immediate child directories are checked for `frames/`. Discovery is not recursive.
3. Only files matched by `frames/*.png` are indexed. Extension case handling follows the operating system and may differ between Windows and Linux. JPEG, TIFF, DICOM, NIfTI, and video files are excluded.
4. Frame order first uses the `frame` value in `metadata.csv`. Without that value, the first numeric segment in the filename becomes the frame index. The sorted file position is the final fallback.
5. An optional `metadata.csv` must contain a unique `file` value for each row.
6. Every PNG in a clip must have the same width and height. Frame indices must also be unique.
7. The loader fingerprints filenames, file sizes, contents, and the optional CSV. Source structure or content changes are rejected after review starts.
8. The browser reads indexed source paths on demand. Source files remain read-only. Reviewed images and Masks go to the separate output directory.

The output directory must differ from the source directory and cannot be inside it.

## Output layout

```text
reviewed-data/
├─ images/
│  └─ <clip-name>/
├─ masks/
│  └─ <category-folder>/
│     └─ <clip-name>/
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

Each reviewed frame has one binary PNG per active category. Manifests add a `<folder-name>_mask` field for every active category. Archived categories are omitted.

Copy the complete source and output directories to continue on another computer. Keep the hidden `.moiraiseg/` directory. Paths and modification times may change, but file contents, filenames, and clip structure must remain the same.

## Mask categories and controls

Each category has a display name, stable folder name, and overlay color. Folder names must match `[a-z][a-z0-9_-]{0,31}` and cannot change after creation. Removing a category first moves it to a recoverable project archive.

| Action | Shortcut |
| --- | --- |
| Select category 1 through 5 | `1`–`5` |
| Lasso, brush, eraser | `Q`, `W`, `E` |
| Previous or next frame | `←`, `→` |
| Save current frame | `S` |
| Save and jump to next pending frame | `Enter` |
| Show or hide Masks | `M` |
| Propagate from current keyframe | `P` |
| Clear current frame Masks | `X` |

The default range is 4 preceding frames and 16 following frames. The preceding range is limited to 0 through 32. The following range accepts any non-negative value and stops at the end of the clip.

## Expansion path

The next loader design should separate clip discovery, frame ordering, pixel decoding, and dataset fingerprints behind an `ImageSource` interface. Manifest-based import and common still-image formats should come first. Video and DICOM adapters need explicit policies for grayscale conversion, bit depth, orientation, windowing, and size changes.

Other useful steps include a headless package and container entry point, cross-platform tests with small synthetic fixtures, export adapters for COCO, CVAT, and nnU-Net, and a separate GPU workflow for model inference. The regular CI workflow stays lightweight and does not download model weights.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Issues, tests, and screenshots involving clinical data must be fully de-identified. Do not commit source images, patient information, model checkpoints, credentials, or local configuration.

## SAM2 source and licenses

The repository vendors the runtime subset of [facebookresearch/sam2](https://github.com/facebookresearch/sam2) at commit `2b90b9f5ceec907a1c18123530e92e794ad901a4b`. Upstream licenses are stored in `sam2/LICENSE` and `sam2/LICENSE_cctorch`. See `sam2/VENDORED.md` for details.

MoiraiSeg-owned code uses the [Apache License 2.0](LICENSE). Vendored SAM2 and cctorch files remain under their upstream licenses.
