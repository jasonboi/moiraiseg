from __future__ import annotations

import argparse
import base64
import csv
import hmac
import io
import json
import os
import shutil
import tempfile
import threading
import webbrowser
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from PIL import Image

from sam2_propagation import (
    PropagationFrame,
    PropagationWindow,
    Sam2PropagationService,
)


PROTOTYPE_ROOT = Path(__file__).resolve().parent
STATIC_ROOT = PROTOTYPE_ROOT / "static"
REVIEWER_ROOT = PROTOTYPE_ROOT.parent
DEFAULT_BATCH_ROOT = REVIEWER_ROOT / "batches" / "20260719"
PREPARED_ROOT = DEFAULT_BATCH_ROOT / "prepared"
CANDIDATE_ROOT = DEFAULT_BATCH_ROOT / "candidate_labels"
DEFAULT_DATASET_ROOT = REVIEWER_ROOT / "reviewed_dataset"
LABELS = ("vessel", "lesion")
PROJECT_SCHEMA_VERSION = 2


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def atomic_write_bytes(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        dir=path.parent, prefix=f".{path.name}.", suffix=".tmp", delete=False
    )
    temp_path = Path(handle.name)
    try:
        with handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_path, path)
    finally:
        temp_path.unlink(missing_ok=True)


def atomic_write_json(path: Path, value: object) -> None:
    payload = json.dumps(value, ensure_ascii=False, indent=2).encode("utf-8")
    atomic_write_bytes(path, payload)


def atomic_save_png(path: Path, image: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        dir=path.parent, prefix=f".{path.stem}.", suffix=".png", delete=False
    )
    temp_path = Path(handle.name)
    handle.close()
    try:
        image.save(temp_path, format="PNG", optimize=False)
        os.replace(temp_path, path)
    finally:
        temp_path.unlink(missing_ok=True)


def png_data_url(image: Image.Image) -> str:
    output = io.BytesIO()
    image.save(output, format="PNG")
    return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode(
        "ascii"
    )


class ReviewerStore:
    def __init__(
        self,
        dataset_root: Path,
        prepared_root: Path = PREPARED_ROOT,
        candidate_root: Path = CANDIDATE_ROOT,
        included_clips: set[str] | None = None,
        vessel_only: bool = False,
        sam2_before_frames: int = 4,
        sam2_after_frames: int = 16,
    ) -> None:
        self.dataset_root = dataset_root.resolve()
        self.prepared_root = prepared_root.resolve()
        self.candidate_root = candidate_root.resolve()
        self.internal_root = self.dataset_root / ".dataseg"
        self.project_path = self.internal_root / "project.json"
        self.project = self._load_project()
        self.project_id = str(self.project["project_id"])
        self.raw_data_dir = str(
            Path(self.project["raw_data_dir"]).resolve()
        )
        self.vessel_only = vessel_only
        if not 0 <= sam2_before_frames <= 32:
            raise ValueError("sam2_before_frames must be between 0 and 32")
        if not 0 <= sam2_after_frames <= 32:
            raise ValueError("sam2_after_frames must be between 0 and 32")
        self.sam2_before_frames = sam2_before_frames
        self.sam2_after_frames = sam2_after_frames
        self.state_path = self.internal_root / "reviewer_state.json"
        self.lock = threading.RLock()
        self.all_items = self._load_items()
        if included_clips:
            known_clips = {item["clip"] for item in self.all_items}
            unknown_clips = included_clips - known_clips
            if unknown_clips:
                raise ValueError(f"Unknown clips: {sorted(unknown_clips)}")
            selected = [
                item for item in self.all_items if item["clip"] in included_clips
            ]
            self.items = [dict(item, index=index) for index, item in enumerate(selected)]
        else:
            self.items = self.all_items
        self.state = self._load_state()
        self._reconcile_state()
        self._write_manifests()

    def _load_project(self) -> dict:
        if not self.project_path.is_file():
            raise RuntimeError(
                f"DataSeg project metadata is missing: {self.project_path}"
            )
        project = json.loads(self.project_path.read_text(encoding="utf-8"))
        if project.get("schema_version") != PROJECT_SCHEMA_VERSION:
            raise RuntimeError(
                "Unsupported DataSeg output layout. Choose an empty output folder."
            )
        if project.get("tool") != "dataseg":
            raise RuntimeError("The output folder is not a DataSeg project")
        if not str(project.get("project_id", "")).strip():
            raise RuntimeError("DataSeg project metadata is missing project_id")
        if not str(project.get("raw_data_dir", "")).strip():
            raise RuntimeError("DataSeg project metadata is missing raw_data_dir")
        return project

    def _load_items(self) -> list[dict]:
        items: list[dict] = []
        for clip_dir in sorted(self.prepared_root.iterdir(), key=lambda path: path.name):
            if not clip_dir.is_dir():
                continue
            frame_map_path = clip_dir / "frame_map.json"
            if not frame_map_path.exists():
                continue
            frame_map = json.loads(frame_map_path.read_text(encoding="utf-8"))
            for frame_info in frame_map:
                source_path = Path(frame_info["source_path"]).resolve()
                if not source_path.exists():
                    raise FileNotFoundError(source_path)
                source_name = frame_info["source_file"]
                item_id = f"{clip_dir.name}/{source_name}"
                items.append(
                    {
                        "index": len(items),
                        "id": item_id,
                        "clip": clip_dir.name,
                        "frame_index": int(frame_info["frame_index"]),
                        "source_name": source_name,
                        "source_path": str(source_path),
                    }
                )
        if not items:
            raise RuntimeError(f"No prepared frames found under {self.prepared_root}")
        return items

    def _load_state(self) -> dict:
        if self.state_path.exists():
            state = json.loads(self.state_path.read_text(encoding="utf-8"))
            if state.get("schema_version") != PROJECT_SCHEMA_VERSION:
                raise RuntimeError(
                    "Unsupported reviewer state version. Choose an empty "
                    "output folder."
                )
            if state.get("project_id") != self.project_id:
                raise RuntimeError(
                    "Reviewer state belongs to a different DataSeg project"
                )
            state.setdefault("reviewed", {})
            return state
        return {
            "schema_version": PROJECT_SCHEMA_VERSION,
            "project_id": self.project_id,
            "created_at": utc_now(),
            "reviewed": {},
        }

    def _reconcile_state(self) -> None:
        known_items = {item["id"]: item for item in self.all_items}
        reviewed = self.state.get("reviewed", {})
        if not isinstance(reviewed, dict):
            raise RuntimeError("Reviewer state field 'reviewed' must be an object")
        valid: dict[str, dict] = {}
        for item_id, entry in reviewed.items():
            item = known_items.get(item_id)
            if item is None or not isinstance(entry, dict):
                continue
            paths = self._dataset_paths(item)
            if all(paths[name].is_file() for name in ("image", *LABELS)):
                valid[item_id] = entry
        if valid != reviewed:
            self.state["reviewed"] = valid
            atomic_write_json(self.state_path, self.state)

    def _dataset_paths(self, item: dict) -> dict[str, Path]:
        return {
            "image": (
                self.dataset_root
                / "images"
                / item["clip"]
                / item["source_name"]
            ),
            "vessel": (
                self.dataset_root
                / "masks"
                / "vessel"
                / item["clip"]
                / item["source_name"]
            ),
            "lesion": (
                self.dataset_root
                / "masks"
                / "lesion"
                / item["clip"]
                / item["source_name"]
            ),
        }

    def _write_manifests(self) -> None:
        reviewed = self.state["reviewed"]
        rows = []
        for item in self.all_items:
            if item["id"] not in reviewed:
                continue
            paths = self._dataset_paths(item)
            rows.append(
                {
                    "id": item["id"],
                    "clip": item["clip"],
                    "frame_index": item["frame_index"],
                    "image": paths["image"].relative_to(self.dataset_root).as_posix(),
                    "vessel_mask": paths["vessel"]
                    .relative_to(self.dataset_root)
                    .as_posix(),
                    "lesion_mask": paths["lesion"]
                    .relative_to(self.dataset_root)
                    .as_posix(),
                    "saved_at": reviewed[item["id"]]["saved_at"],
                }
            )

        jsonl = "".join(
            json.dumps(row, ensure_ascii=False) + "\n" for row in rows
        ).encode("utf-8")
        atomic_write_bytes(
            self.dataset_root / "annotation_manifest.jsonl",
            jsonl,
        )

        output = io.StringIO(newline="")
        fieldnames = [
            "id",
            "clip",
            "frame_index",
            "image",
            "vessel_mask",
            "lesion_mask",
            "saved_at",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        atomic_write_bytes(
            self.dataset_root / "annotation_manifest.csv",
            output.getvalue().encode("utf-8-sig"),
        )

    def manifest(self) -> dict:
        with self.lock:
            reviewed = self.state["reviewed"]
            items = [
                {
                    "index": item["index"],
                    "id": item["id"],
                    "clip": item["clip"],
                    "frame_index": item["frame_index"],
                    "source_name": item["source_name"],
                    "reviewed": item["id"] in reviewed,
                }
                for item in self.items
            ]
            return {
                "total": len(items),
                "processed": sum(item["reviewed"] for item in items),
                "project_id": self.project_id,
                "raw_data_dir": self.raw_data_dir,
                "output_dir": str(self.dataset_root),
                "dataset_root": str(self.dataset_root),
                "vessel_only": self.vessel_only,
                "sam2_before_frames": self.sam2_before_frames,
                "sam2_after_frames": self.sam2_after_frames,
                "items": items,
            }

    def item(self, index: int) -> dict:
        if index < 0 or index >= len(self.items):
            raise IndexError(index)
        return self.items[index]

    def propagation_window(
        self,
        index: int,
        before: int,
        after: int,
    ) -> PropagationWindow:
        if not 0 <= before <= 32 or not 0 <= after <= 32:
            raise ValueError("SAM2 propagation range must be between 0 and 32")
        keyframe = self.item(index)
        clip = keyframe["clip"]
        start = index
        while start > 0 and index - start < before:
            if self.items[start - 1]["clip"] != clip:
                break
            start -= 1
        end = index
        while end + 1 < len(self.items) and end - index < after:
            if self.items[end + 1]["clip"] != clip:
                break
            end += 1
        reviewed = self.state["reviewed"]
        frames = [
            PropagationFrame(
                index=position,
                source_path=Path(self.items[position]["source_path"]),
                reviewed=self.items[position]["id"] in reviewed,
            )
            for position in range(start, end + 1)
        ]
        return PropagationWindow(
            clip=clip,
            keyframe_position=index - start,
            frames=frames,
        )

    def sam2_preview(
        self,
        index: int,
        payload: dict,
        service: Sam2PropagationService,
    ) -> dict:
        before = payload.get("before", self.sam2_before_frames)
        after = payload.get("after", self.sam2_after_frames)
        if any(
            not isinstance(value, int) or isinstance(value, bool)
            for value in (before, after)
        ):
            raise ValueError("SAM2 propagation ranges must be integers")
        label = payload.get("label")
        if label not in LABELS:
            raise ValueError("SAM2 propagation label must be vessel or lesion")
        if self.vessel_only and label == "lesion":
            raise ValueError("This project only supports vessel masks")
        with Image.open(self.image_path(index)) as source:
            expected_size = source.size
        try:
            keyframe_mask = self._decode_mask(payload["mask"], expected_size)
        except KeyError as error:
            raise ValueError(
                f"SAM2 propagation requires a {label} mask"
            ) from error

        window = self.propagation_window(index, before=before, after=after)
        results = service.propagate(
            frames=window.frames,
            keyframe_position=window.keyframe_position,
            keyframe_mask=keyframe_mask,
        )
        items = []
        for result in results:
            item = self.item(result.index)
            items.append(
                {
                    "index": result.index,
                    "clip": item["clip"],
                    "frame_index": item["frame_index"],
                    "source_name": item["source_name"],
                    "reviewed": result.reviewed,
                    "is_keyframe": result.index == index,
                    "label": label,
                    "mask": png_data_url(result.mask),
                }
            )
        return {
            "clip": window.clip,
            "keyframe_index": index,
            "keyframe_position": window.keyframe_position,
            "label": label,
            "before": before,
            "after": after,
            "items": items,
        }

    def image_path(self, index: int) -> Path:
        return Path(self.item(index)["source_path"])

    def mask_image(self, index: int, label: str, candidate_only: bool) -> Image.Image:
        if label not in LABELS:
            raise ValueError(label)
        if self.vessel_only and label == "lesion":
            with Image.open(self.image_path(index)) as source:
                return Image.new("L", source.size, color=0)
        item = self.item(index)
        reviewed_path = self._dataset_paths(item)[label]
        candidate_path = (
            self.candidate_root / item["clip"] / "masks" / label / item["source_name"]
        )
        if not candidate_only and reviewed_path.exists():
            return Image.open(reviewed_path).convert("L")
        if candidate_path.exists():
            return Image.open(candidate_path).convert("L")
        with Image.open(self.image_path(index)) as source:
            return Image.new("L", source.size, color=0)

    @staticmethod
    def _decode_mask(data_url: str, expected_size: tuple[int, int]) -> Image.Image:
        prefix = "data:image/png;base64,"
        if not data_url.startswith(prefix):
            raise ValueError("Mask must be a PNG data URL")
        payload = base64.b64decode(data_url[len(prefix) :], validate=True)
        with Image.open(io.BytesIO(payload)) as image:
            mask = image.convert("L")
            if mask.size != expected_size:
                raise ValueError(
                    f"Mask size {mask.size} does not match source {expected_size}"
                )
            return mask.point(lambda value: 255 if value >= 128 else 0, mode="L")

    def _apply_mask_policy(
        self,
        masks: dict[str, Image.Image],
        expected_size: tuple[int, int],
    ) -> dict[str, Image.Image]:
        if self.vessel_only:
            masks["lesion"] = Image.new("L", expected_size, color=0)
        return masks

    def save(self, index: int, payload: dict) -> dict:
        item = self.item(index)
        with Image.open(self.image_path(index)) as source:
            expected_size = source.size
        masks = self._apply_mask_policy(
            {
                label: self._decode_mask(payload[label], expected_size)
                for label in LABELS
            },
            expected_size,
        )

        with self.lock:
            self._write_item_files(index, item, masks)
            self._mark_reviewed(item, utc_now(), "manual")
            self._commit_review_state()

            processed = len(self.state["reviewed"])
            next_index = self._next_unreviewed(index)
            return {
                "saved": True,
                "index": index,
                "processed": processed,
                "total": len(self.items),
                "next_index": next_index,
            }

    def accept_candidates(self, indices: list[int]) -> dict:
        if not isinstance(indices, list) or not 1 <= len(indices) <= 64:
            raise ValueError("Select between 1 and 64 candidate frames")
        if any(
            not isinstance(index, int) or isinstance(index, bool) for index in indices
        ):
            raise ValueError("Candidate indices must be integers")
        if len(set(indices)) != len(indices):
            raise ValueError("Candidate indices must be unique")

        selected_indices = sorted(indices)
        items = [self.item(index) for index in selected_indices]
        clips = {item["clip"] for item in items}
        if len(clips) != 1:
            raise ValueError("Batch review must stay within one capture clip")

        prepared: list[tuple[int, dict, dict[str, Image.Image]]] = []
        for index, item in zip(selected_indices, items):
            with Image.open(self.image_path(index)) as source:
                expected_size = source.size
            masks: dict[str, Image.Image] = {}
            for label in LABELS:
                mask = self.mask_image(index, label, candidate_only=True)
                if mask.size != expected_size:
                    raise ValueError(
                        f"Candidate mask size {mask.size} does not match source "
                        f"{expected_size} for {item['id']}"
                    )
                masks[label] = mask.point(
                    lambda value: 255 if value >= 128 else 0,
                    mode="L",
                )
            masks = self._apply_mask_policy(masks, expected_size)
            prepared.append((index, item, masks))

        with self.lock:
            reviewed = self.state["reviewed"]
            already_reviewed = [
                item["id"] for item in items if item["id"] in reviewed
            ]
            if already_reviewed:
                raise ValueError(
                    f"Candidate frame is already reviewed: {already_reviewed[0]}"
                )

            saved_at = utc_now()
            for index, item, masks in prepared:
                self._write_item_files(index, item, masks)
                self._mark_reviewed(item, saved_at, "candidate_batch")
            self._commit_review_state()

            processed = len(self.state["reviewed"])
            next_index = self._next_unreviewed(selected_indices[0] - 1)
            return {
                "accepted": True,
                "accepted_indices": selected_indices,
                "accepted_count": len(selected_indices),
                "processed": processed,
                "total": len(self.items),
                "next_index": next_index,
                "clip": items[0]["clip"],
            }

    def save_batch(self, entries: list[dict]) -> dict:
        if not isinstance(entries, list) or not 1 <= len(entries) <= 64:
            raise ValueError("Select between 1 and 64 frames")
        if any(not isinstance(entry, dict) for entry in entries):
            raise ValueError("Batch entries must be objects")
        try:
            indices = [entry["index"] for entry in entries]
        except KeyError as error:
            raise ValueError("Batch entry is missing index") from error
        if any(
            not isinstance(index, int) or isinstance(index, bool) for index in indices
        ):
            raise ValueError("Batch indices must be integers")
        if len(set(indices)) != len(indices):
            raise ValueError("Batch indices must be unique")

        entries_by_index = {entry["index"]: entry for entry in entries}
        selected_indices = sorted(indices)
        items = [self.item(index) for index in selected_indices]
        if len({item["clip"] for item in items}) != 1:
            raise ValueError("Batch review must stay within one capture clip")

        prepared: list[tuple[int, dict, dict[str, Image.Image]]] = []
        for index, item in zip(selected_indices, items):
            with Image.open(self.image_path(index)) as source:
                expected_size = source.size
            entry = entries_by_index[index]
            try:
                masks = self._apply_mask_policy(
                    {
                        label: self._decode_mask(entry[label], expected_size)
                        for label in LABELS
                    },
                    expected_size,
                )
            except KeyError as error:
                raise ValueError(
                    f"Batch entry {index} is missing mask {error.args[0]}"
                ) from error
            prepared.append((index, item, masks))

        with self.lock:
            reviewed = self.state["reviewed"]
            already_reviewed = [
                item["id"] for item in items if item["id"] in reviewed
            ]
            if already_reviewed:
                raise ValueError(
                    f"Batch frame is already reviewed: {already_reviewed[0]}"
                )

            saved_at = utc_now()
            for index, item, masks in prepared:
                self._write_item_files(index, item, masks)
                self._mark_reviewed(item, saved_at, "batch_review")
            self._commit_review_state()

            processed = len(self.state["reviewed"])
            next_index = self._next_unreviewed(selected_indices[0] - 1)
            return {
                "saved": True,
                "saved_indices": selected_indices,
                "saved_count": len(selected_indices),
                "processed": processed,
                "total": len(self.items),
                "next_index": next_index,
                "clip": items[0]["clip"],
            }

    def _write_item_files(
        self,
        index: int,
        item: dict,
        masks: dict[str, Image.Image],
    ) -> None:
        paths = self._dataset_paths(item)
        paths["image"].parent.mkdir(parents=True, exist_ok=True)
        if not paths["image"].exists():
            handle = tempfile.NamedTemporaryFile(
                dir=paths["image"].parent,
                prefix=f".{paths['image'].name}.",
                suffix=".tmp",
                delete=False,
            )
            temp_path = Path(handle.name)
            handle.close()
            try:
                shutil.copy2(self.image_path(index), temp_path)
                os.replace(temp_path, paths["image"])
            finally:
                temp_path.unlink(missing_ok=True)

        for label in LABELS:
            atomic_save_png(paths[label], masks[label])

    def _mark_reviewed(self, item: dict, saved_at: str, source: str) -> None:
        review_entry = {
            "saved_at": saved_at,
            "source": source,
        }
        self.state["reviewed"][item["id"]] = review_entry

    def _commit_review_state(self) -> None:
        atomic_write_json(self.state_path, self.state)
        self._write_manifests()

    def _next_unreviewed(self, current_index: int) -> int:
        reviewed = self.state["reviewed"]
        total = len(self.items)
        for offset in range(1, total + 1):
            candidate = (current_index + offset) % total
            if self.items[candidate]["id"] not in reviewed:
                return candidate
        return (current_index + 1) % total


class ReviewerHandler(SimpleHTTPRequestHandler):
    store: ReviewerStore
    sam2_service: Sam2PropagationService | None = None
    instance_id = ""
    shutdown_token = ""

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, directory=str(STATIC_ROOT), **kwargs)

    def log_message(self, format: str, *args) -> None:
        print(f"[reviewer] {self.address_string()} {format % args}")

    def _send_json(self, value: object, status: int = HTTPStatus.OK) -> None:
        payload = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def _send_png(self, image: Image.Image) -> None:
        output = io.BytesIO()
        image.save(output, format="PNG")
        payload = output.getvalue()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def _send_file(self, path: Path, content_type: str) -> None:
        payload = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        parts = [part for part in parsed.path.split("/") if part]
        try:
            if parsed.path == "/api/health":
                self._send_json(
                    {
                        "ok": True,
                        "tool": "dataseg",
                        "instance_id": self.instance_id,
                        "project_id": self.store.project_id,
                        "raw_data_dir": self.store.raw_data_dir,
                        "output_dir": str(self.store.dataset_root),
                        "vessel_only": self.store.vessel_only,
                        "sam2_before_frames": self.store.sam2_before_frames,
                        "sam2_after_frames": self.store.sam2_after_frames,
                    }
                )
                return
            if parsed.path == "/api/manifest":
                self._send_json(self.store.manifest())
                return
            if len(parts) == 4 and parts[:2] == ["api", "item"]:
                index = int(parts[2])
                if parts[3] == "image":
                    self._send_file(self.store.image_path(index), "image/png")
                    return
            if len(parts) == 5 and parts[:2] == ["api", "item"]:
                index = int(parts[2])
                if parts[3] == "mask":
                    candidate_only = parse_qs(parsed.query).get("source") == [
                        "candidate"
                    ]
                    self._send_png(
                        self.store.mask_image(index, parts[4], candidate_only)
                    )
                    return
            if parsed.path == "/":
                self.path = "/index.html"
            super().do_GET()
        except (IndexError, ValueError, FileNotFoundError) as error:
            self._send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
        except Exception as error:
            self._send_json({"error": str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        parts = [part for part in parsed.path.split("/") if part]
        try:
            if parsed.path == "/api/shutdown":
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 10_000:
                    raise ValueError("Invalid request size")
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                received_token = payload.get("token", "")
                if (
                    not isinstance(received_token, str)
                    or not self.shutdown_token
                    or not hmac.compare_digest(
                        received_token,
                        self.shutdown_token,
                    )
                ):
                    self._send_json(
                        {"error": "Invalid shutdown token"},
                        HTTPStatus.FORBIDDEN,
                    )
                    return
                self._send_json({"ok": True})
                threading.Thread(
                    target=self.server.shutdown,
                    daemon=True,
                ).start()
                return
            received_project = self.headers.get("X-DataSeg-Project", "")
            if (
                not received_project
                or not hmac.compare_digest(
                    received_project,
                    self.store.project_id,
                )
            ):
                self._send_json(
                    {
                        "error": (
                            "浏览器页面属于另一个标定项目，"
                            "请从 DataSeg 启动器重新打开。"
                        )
                    },
                    HTTPStatus.CONFLICT,
                )
                return
            if parsed.path == "/api/sam2/propagate":
                if self.sam2_service is None:
                    self._send_json(
                        {"error": "SAM2 propagation is not configured"},
                        HTTPStatus.SERVICE_UNAVAILABLE,
                    )
                    return
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 10_000_000:
                    raise ValueError("Invalid request size")
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                index = payload.get("index")
                if not isinstance(index, int) or isinstance(index, bool):
                    raise ValueError("SAM2 keyframe index must be an integer")
                self._send_json(
                    self.store.sam2_preview(
                        index,
                        payload,
                        self.sam2_service,
                    )
                )
                return
            if parsed.path == "/api/batch/accept":
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 100_000:
                    raise ValueError("Invalid request size")
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                self._send_json(
                    self.store.accept_candidates(payload["indices"])
                )
                return
            if parsed.path == "/api/batch/save":
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 20_000_000:
                    raise ValueError("Invalid request size")
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                self._send_json(
                    self.store.save_batch(payload["items"])
                )
                return
            if len(parts) == 4 and parts[:2] == ["api", "item"]:
                index = int(parts[2])
                if parts[3] == "save":
                    length = int(self.headers.get("Content-Length", "0"))
                    if length <= 0 or length > 10_000_000:
                        raise ValueError("Invalid request size")
                    payload = json.loads(self.rfile.read(length).decode("utf-8"))
                    self._send_json(self.store.save(index, payload))
                    return
            self._send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
        except (IndexError, ValueError, KeyError, json.JSONDecodeError) as error:
            self._send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
        except Exception as error:
            self._send_json({"error": str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Local vessel and lesion mask reviewer")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--dataset-root", type=Path, default=DEFAULT_DATASET_ROOT)
    parser.add_argument("--prepared-root", type=Path, default=PREPARED_ROOT)
    parser.add_argument("--candidate-root", type=Path, default=CANDIDATE_ROOT)
    parser.add_argument(
        "--vessel-only",
        action="store_true",
        help="Force lesion masks to remain empty on every read and save.",
    )
    parser.add_argument("--sam2-checkpoint", type=Path)
    parser.add_argument(
        "--sam2-model-config",
        default="configs/sam2.1/sam2.1_hiera_t.yaml",
    )
    parser.add_argument(
        "--sam2-device",
        choices=("auto", "cuda", "cpu"),
        default="auto",
    )
    parser.add_argument("--sam2-before", type=int, default=4)
    parser.add_argument("--sam2-after", type=int, default=16)
    parser.add_argument("--instance-id", default="")
    parser.add_argument("--shutdown-token", default="")
    parser.add_argument(
        "--include-clip",
        action="append",
        dest="included_clips",
        help="Limit the review queue to a clip. Repeat for multiple clips.",
    )
    parser.add_argument("--open", action="store_true", dest="open_browser")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.host not in {"127.0.0.1", "localhost"}:
        raise ValueError("The reviewer is local-only and must bind to 127.0.0.1")
    store = ReviewerStore(
        args.dataset_root,
        prepared_root=args.prepared_root,
        candidate_root=args.candidate_root,
        included_clips=set(args.included_clips or []),
        vessel_only=args.vessel_only,
        sam2_before_frames=args.sam2_before,
        sam2_after_frames=args.sam2_after,
    )
    ReviewerHandler.store = store
    ReviewerHandler.instance_id = args.instance_id
    ReviewerHandler.shutdown_token = args.shutdown_token
    ReviewerHandler.sam2_service = (
        Sam2PropagationService(
            checkpoint=args.sam2_checkpoint,
            model_config=args.sam2_model_config,
            device=args.sam2_device,
        )
        if args.sam2_checkpoint
        else None
    )
    server = ThreadingHTTPServer((args.host, args.port), ReviewerHandler)
    url = (
        f"http://{args.host}:{args.port}/"
        f"?project={store.project_id}&instance={args.instance_id}"
    )
    print(f"Mask reviewer: {url}")
    print(f"Dataset output: {store.dataset_root}")
    print("Press Ctrl+C to stop.")
    if args.open_browser:
        threading.Timer(0.7, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
