# Vendored SAM2 runtime

This directory contains the runtime subset of
[facebookresearch/sam2](https://github.com/facebookresearch/sam2) used by
DataSeg.

- Upstream commit: `2b90b9f5ceec907a1c18123530e92e794ad901a4b`
- Retained code: the `sam2` Python package and model configuration files
- Removed content: demos, notebooks, training code, datasets, Docker files,
  repository metadata, and development-only tooling
- Model checkpoint: downloaded separately with
  `python scripts/download_model.py`

The upstream licenses remain in `LICENSE` and `LICENSE_cctorch`.
