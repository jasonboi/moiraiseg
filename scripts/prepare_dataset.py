from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import re
import shutil
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image


FRAME_PATTERN = re.compile(r"(?:^|[_-])(\d+)(?:[_-]|\.)")
INTERNAL_DIR_NAME = ".dataseg"
PROJECT_SCHEMA_VERSION = 2


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare raw ultrasound frame folders for DataSeg."
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "config.json",
    )
    return parser.parse_args()


def atomic_write_bytes(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    )
    temporary = Path(handle.name)
    try:
        with handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def atomic_write_json(path: Path, value: Any) -> None:
    atomic_write_bytes(
        path,
        json.dumps(value, ensure_ascii=False, indent=2).encode("utf-8"),
    )


def atomic_write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    output = io.StringIO(newline="")
    if rows:
        writer = csv.DictWriter(output, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    atomic_write_bytes(path, output.getvalue().encode("utf-8-sig"))


def atomic_save_png(path: Path, image: Image.Image) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        dir=path.parent,
        prefix=f".{path.stem}.",
        suffix=".png",
        delete=False,
    )
    temporary = Path(handle.name)
    handle.close()
    try:
        image.save(temporary, format="PNG", optimize=False)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def resolve_config_path(config_path: Path, value: str, field: str) -> Path:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} is empty. Run 配置标定工具.cmd first.")
    path = Path(value.strip()).expanduser()
    if not path.is_absolute():
        path = config_path.parent / path
    return path.resolve()


def discover_clips(raw_root: Path) -> list[Path]:
    if (raw_root / "frames").is_dir():
        return [raw_root]
    clips = sorted(
        (
            entry
            for entry in raw_root.iterdir()
            if entry.is_dir() and (entry / "frames").is_dir()
        ),
        key=lambda path: path.name.casefold(),
    )
    if not clips:
        raise RuntimeError(
            f"No clip folders containing a frames directory were found under {raw_root}"
        )
    folded = [clip.name.casefold() for clip in clips]
    if len(folded) != len(set(folded)):
        raise RuntimeError("Clip folder names must be unique ignoring letter case")
    return clips


def frame_index(path: Path, fallback: int, metadata: dict[str, dict[str, str]]) -> int:
    row = metadata.get(path.name)
    if row and row.get("frame", "").strip():
        return int(row["frame"])
    match = FRAME_PATTERN.search(path.name)
    return int(match.group(1)) if match else fallback


def load_metadata(path: Path) -> dict[str, dict[str, str]]:
    if not path.is_file():
        return {}
    with path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if rows and "file" not in rows[0]:
        raise RuntimeError(f"{path} is missing the file column")
    result = {row["file"]: row for row in rows}
    if len(result) != len(rows):
        raise RuntimeError(f"{path} contains duplicate file values")
    return result


def clip_signature(frames: list[Path]) -> str:
    digest = hashlib.sha256()
    for frame in frames:
        stat = frame.stat()
        digest.update(frame.name.encode("utf-8"))
        digest.update(str(stat.st_size).encode("ascii"))
        digest.update(str(stat.st_mtime_ns).encode("ascii"))
    return digest.hexdigest().upper()


def reviewed_count(output_root: Path) -> int:
    state_path = output_root / INTERNAL_DIR_NAME / "reviewer_state.json"
    if not state_path.exists():
        return 0
    state = read_json(state_path)
    reviewed = state.get("reviewed", {})
    return len(reviewed) if isinstance(reviewed, dict) else 0


def ensure_project_compatible(
    project_path: Path,
    raw_root: Path,
    vessel_only: bool,
    clip_summaries: dict[str, dict[str, Any]],
    output_root: Path,
) -> dict[str, Any] | None:
    if not project_path.exists():
        legacy_paths = (
            output_root / "train",
            output_root / "reviewer_state.json",
            project_path.parent / "split_map.json",
        )
        if any(path.exists() for path in legacy_paths):
            raise RuntimeError(
                "The selected output folder uses the obsolete split-based layout. "
                "Choose an empty output folder."
            )
        return None
    previous = read_json(project_path)
    if previous.get("schema_version") != PROJECT_SCHEMA_VERSION:
        raise RuntimeError(
            "The selected output folder uses an unsupported DataSeg project "
            "version. Choose an empty output folder."
        )
    if not str(previous.get("project_id", "")).strip():
        raise RuntimeError("The DataSeg project is missing project_id")
    if Path(previous["raw_data_dir"]).resolve() != raw_root:
        raise RuntimeError(
            "The selected output folder already belongs to a different raw dataset"
        )
    count = reviewed_count(output_root)
    if count and bool(previous.get("vessel_only")) != vessel_only:
        raise RuntimeError(
            "Label mode cannot change after review has started in this output folder"
        )
    previous_clips = previous.get("clips", {})
    changed = {
        name
        for name in set(previous_clips) | set(clip_summaries)
        if previous_clips.get(name, {}).get("signature")
        != clip_summaries.get(name, {}).get("signature")
    }
    if count and changed:
        raise RuntimeError(
            "Raw frames changed after review started. Use a new output folder. "
            f"Changed clips: {sorted(changed)}"
        )
    return previous


def prepare_clip(
    clip_root: Path,
    prepared_root: Path,
    candidate_root: Path,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    metadata = load_metadata(clip_root / "metadata.csv")
    frames = sorted((clip_root / "frames").glob("*.png"), key=lambda path: path.name)
    if not frames:
        raise RuntimeError(f"No PNG frames found under {clip_root / 'frames'}")
    indexed_frames = sorted(
        (
            (frame_index(path, position, metadata), path)
            for position, path in enumerate(frames)
        ),
        key=lambda pair: (pair[0], pair[1].name),
    )
    indices = [index for index, _ in indexed_frames]
    if len(indices) != len(set(indices)):
        raise RuntimeError(f"{clip_root.name} contains duplicate frame indices")

    frame_map: list[dict[str, Any]] = []
    expected_size: tuple[int, int] | None = None
    for index, frame_path in indexed_frames:
        with Image.open(frame_path) as source:
            size = source.size
        if expected_size is None:
            expected_size = size
        elif size != expected_size:
            raise RuntimeError(
                f"All frames in {clip_root.name} must have one size. "
                f"Expected {expected_size}, found {size} in {frame_path.name}"
            )
        empty = Image.new("L", size, color=0)
        for label in ("vessel", "lesion"):
            atomic_save_png(
                candidate_root
                / clip_root.name
                / "masks"
                / label
                / frame_path.name,
                empty,
            )
        frame_map.append(
            {
                "frame_index": index,
                "source_file": frame_path.name,
                "source_path": str(frame_path.resolve()),
                "source_clip": clip_root.name,
                "target": "unassigned",
                "plane": "unassigned",
            }
        )

    atomic_write_json(
        prepared_root / clip_root.name / "frame_map.json",
        frame_map,
    )
    summary = {
        "frame_count": len(frame_map),
        "width": expected_size[0] if expected_size else 0,
        "height": expected_size[1] if expected_size else 0,
        "signature": clip_signature(
            sorted(
                (path for _, path in indexed_frames),
                key=lambda path: path.name,
            )
        ),
    }
    return frame_map, summary


def remove_stale_internal_clips(
    root: Path,
    expected_names: set[str],
    allow_removal: bool,
) -> None:
    if not root.exists():
        return
    stale = [
        entry
        for entry in root.iterdir()
        if entry.is_dir() and entry.name not in expected_names
    ]
    if stale and not allow_removal:
        raise RuntimeError(
            "Prepared clip set changed after review started. Use a new output folder."
        )
    for entry in stale:
        shutil.rmtree(entry)


def main() -> None:
    args = parse_args()
    config_path = args.config.resolve()
    config = read_json(config_path)
    if config.get("schema_version") != 1:
        raise ValueError("Unsupported config schema_version")
    raw_root = resolve_config_path(
        config_path,
        config.get("raw_data_dir", ""),
        "raw_data_dir",
    )
    output_root = resolve_config_path(
        config_path,
        config.get("output_dir", ""),
        "output_dir",
    )
    if not raw_root.is_dir():
        raise FileNotFoundError(raw_root)
    if output_root == raw_root or output_root.is_relative_to(raw_root):
        raise ValueError("output_dir must not be the raw folder or a child of it")
    output_root.mkdir(parents=True, exist_ok=True)

    vessel_only = bool(config.get("vessel_only", False))
    clips = discover_clips(raw_root)
    internal_root = output_root / INTERNAL_DIR_NAME
    prepared_root = internal_root / "prepared"
    candidate_root = internal_root / "candidate_labels"
    project_path = internal_root / "project.json"

    preliminary: dict[str, dict[str, Any]] = {}
    for clip in clips:
        metadata = load_metadata(clip / "metadata.csv")
        frames = sorted((clip / "frames").glob("*.png"), key=lambda path: path.name)
        if not frames:
            raise RuntimeError(f"No PNG frames found under {clip / 'frames'}")
        preliminary[clip.name] = {
            "frame_count": len(frames),
            "signature": clip_signature(frames),
            "metadata_rows": len(metadata),
        }
    previous_project = ensure_project_compatible(
        project_path,
        raw_root,
        vessel_only,
        preliminary,
        output_root,
    )
    project_id = (
        str(previous_project["project_id"])
        if previous_project
        else uuid.uuid4().hex
    )

    count = reviewed_count(output_root)
    clip_names = {clip.name for clip in clips}
    remove_stale_internal_clips(prepared_root, clip_names, count == 0)
    remove_stale_internal_clips(candidate_root, clip_names, count == 0)

    annotation_index: dict[str, Any] = {
        "schema_version": PROJECT_SCHEMA_VERSION,
        "project_id": project_id,
        "batch_name": raw_root.name,
        "strategy": "annotation_export_only",
        "source_root": str(raw_root),
        "sampling": "every PNG frame",
        "clips": {},
    }
    manifest_rows: list[dict[str, Any]] = []
    project_clips: dict[str, dict[str, Any]] = {}
    total = 0
    for clip in clips:
        frame_map, summary = prepare_clip(
            clip,
            prepared_root,
            candidate_root,
        )
        project_clips[clip.name] = summary
        annotation_index["clips"][clip.name] = {
            "source_clip": clip.name,
            "target": "unassigned",
            "plane": "unassigned",
            "source_frames": len(frame_map),
            "selected_frames": len(frame_map),
            "enabled_candidate_labels": (
                ["vessel"] if vessel_only else ["vessel", "lesion"]
            ),
            "forced_empty_labels": ["lesion"] if vessel_only else [],
            "image_size": {
                "width": summary["width"],
                "height": summary["height"],
            },
        }
        for item in frame_map:
            manifest_rows.append(
                {
                    "clip": clip.name,
                    "frame_index": item["frame_index"],
                    "source_file": item["source_file"],
                    "source_path": item["source_path"],
                }
            )
        total += len(frame_map)

    annotation_index["total_selected_frames"] = total
    atomic_write_json(
        internal_root / "annotation_index.json",
        annotation_index,
    )
    atomic_write_csv(internal_root / "selection_manifest.csv", manifest_rows)
    atomic_write_json(
        project_path,
        {
            "schema_version": PROJECT_SCHEMA_VERSION,
            "tool": "dataseg",
            "project_id": project_id,
            "raw_data_dir": str(raw_root),
            "output_dir": str(output_root),
            "vessel_only": vessel_only,
            "prepared_at": utc_now(),
            "total_frames": total,
            "clips": project_clips,
        },
    )
    print(
        json.dumps(
            {
                "raw_data_dir": str(raw_root),
                "output_dir": str(output_root),
                "clips": len(clips),
                "frames": total,
                "reviewed": count,
                "vessel_only": vessel_only,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
