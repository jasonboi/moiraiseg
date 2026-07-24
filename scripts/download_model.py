from __future__ import annotations

import argparse
import hashlib
import os
import sys
import urllib.request
from pathlib import Path


TOOL_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIRECTORY = TOOL_ROOT / "sam2" / "checkpoints"
MODEL_PATH = MODEL_DIRECTORY / "sam2.1_hiera_tiny.pt"
MODEL_URL = (
    "https://dl.fbaipublicfiles.com/segment_anything_2/092824/"
    "sam2.1_hiera_tiny.pt"
)
MODEL_SHA256 = "7402e0d864fa82708a20fbd15bc84245c2f26dff0eb43a4b5b93452deb34be69"
CHUNK_SIZE = 1024 * 1024


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(CHUNK_SIZE), b""):
            digest.update(chunk)
    return digest.hexdigest()


def progress(downloaded: int, total: int) -> None:
    if total > 0:
        percent = min(100, downloaded * 100 // total)
        message = (
            f"\rDownloading SAM2 model: {percent:3d}% "
            f"({downloaded / 1024 / 1024:.1f}/{total / 1024 / 1024:.1f} MiB)"
        )
    else:
        message = (
            f"\rDownloading SAM2 model: {downloaded / 1024 / 1024:.1f} MiB"
        )
    print(message, end="", file=sys.stderr, flush=True)


def download(*, force: bool = False) -> Path:
    MODEL_DIRECTORY.mkdir(parents=True, exist_ok=True)
    if MODEL_PATH.is_file() and not force:
        if sha256(MODEL_PATH) == MODEL_SHA256:
            print(f"SAM2 model is ready: {MODEL_PATH}")
            return MODEL_PATH
        raise RuntimeError(
            "The existing SAM2 model failed SHA-256 verification. "
            "Run this command again with --force to replace it."
        )

    temporary = MODEL_PATH.with_suffix(MODEL_PATH.suffix + ".part")
    temporary.unlink(missing_ok=True)
    request = urllib.request.Request(
        MODEL_URL,
        headers={"User-Agent": "DataSeg model downloader"},
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            total = int(response.headers.get("Content-Length", "0"))
            downloaded = 0
            with temporary.open("wb") as stream:
                while True:
                    chunk = response.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    stream.write(chunk)
                    downloaded += len(chunk)
                    progress(downloaded, total)
        print(file=sys.stderr)
        actual_hash = sha256(temporary)
        if actual_hash != MODEL_SHA256:
            raise RuntimeError(
                "The downloaded SAM2 model failed SHA-256 verification. "
                f"Expected {MODEL_SHA256}, got {actual_hash}."
            )
        os.replace(temporary, MODEL_PATH)
    finally:
        temporary.unlink(missing_ok=True)

    print(f"SAM2 model downloaded and verified: {MODEL_PATH}")
    return MODEL_PATH


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download the SAM2.1 Hiera Tiny checkpoint used by DataSeg."
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="replace an existing checkpoint",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    download(force=args.force)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nDownload cancelled.", file=sys.stderr)
        raise SystemExit(130)
    except Exception as error:
        print(f"Model download failed: {error}", file=sys.stderr)
        raise SystemExit(1)
