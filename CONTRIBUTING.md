# Contributing to MoiraiSeg

MoiraiSeg welcomes focused fixes, tests, documentation, image-source adapters, export adapters, and annotation workflow improvements.

## Before opening a change

- Search existing issues and keep one change focused on one problem.
- Explain the image workflow or failure case that motivates the change.
- Never attach identifiable clinical images, patient metadata, credentials, local configuration, or model weights.
- Use synthetic or fully de-identified fixtures in tests and screenshots.
- Keep project metadata changes synchronized across preparation, server, and export code.

## Local checks

Use Python 3.11. Install the lightweight test dependency and run:

```bash
python -m pip install Pillow
python -m unittest discover -s tests -v
python -m compileall -q moiraiseg.py moiraiseg_gui.py app scripts tests
python moiraiseg.py --help
```

Changes to SAM2 inference should also run `python moiraiseg.py doctor` in the supported environment. Include the device, PyTorch version, and whether the check ran on CPU or CUDA in the pull request.

## Pull requests

Describe the user-visible result, the compatibility impact, and the checks you ran. Update both `README.md` and `README.en.md` when behavior or setup changes. Keep generated data, local runtime files, and downloaded checkpoints out of Git.

By contributing, you agree that your contribution is licensed under the repository's Apache License 2.0. Vendored SAM2 and cctorch code remain under their upstream licenses.
