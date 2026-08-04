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
import time
import uuid
import webbrowser
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import TypedDict
from urllib.parse import parse_qs, urlparse

from PIL import Image

if __package__:
    from .mask_categories import MaskCategoryCatalog
    from .sam2_propagation import (
        PropagationFrame,
        PropagationWindow,
        Sam2PropagationService,
    )
else:
    from mask_categories import MaskCategoryCatalog
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
REVIEWER_STATE_SCHEMA_VERSION = 2
SAM2_REVIEW_LEASE_SECONDS = 120


class DatasetFramePaths(TypedDict):
    image_path: Path
    masks: dict[str, Path]


class MaskCategoryConflictError(ValueError):
    """A category operation needs an explicit choice from the client."""

    def __init__(
        self,
        message: str,
        *,
        code: str,
        archives: list[dict[str, str]] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.archives = archives or []


class MaskCategoryBusyError(RuntimeError):
    """Category metadata cannot change during an incompatible operation."""


@dataclass(frozen=True)
class Sam2ReviewLease:
    category_folders: tuple[str, ...]
    expires_at: float | None


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
        sam2_before_frames: int = 4,
        sam2_after_frames: int = 16,
    ) -> None:
        self.dataset_root = dataset_root.resolve()
        self.prepared_root = prepared_root.resolve()
        self.candidate_root = candidate_root.resolve()
        self.internal_root = self.dataset_root / ".dataseg"
        self.mask_archive_root = self.internal_root / "mask_archive"
        self.project_path = self.internal_root / "project.json"
        self.project = self._load_project()
        self.mask_categories = MaskCategoryCatalog.from_project(self.project)
        self.project_id = str(self.project["project_id"])
        self.raw_data_dir = str(
            Path(self.project["raw_data_dir"]).resolve()
        )
        if not 0 <= sam2_before_frames <= 32:
            raise ValueError("sam2_before_frames must be between 0 and 32")
        if not 0 <= sam2_after_frames <= 32:
            raise ValueError("sam2_after_frames must be between 0 and 32")
        self.sam2_before_frames = sam2_before_frames
        self.sam2_after_frames = sam2_after_frames
        self.state_path = self.internal_root / "reviewer_state.json"
        self.lock = threading.RLock()
        self._operation_state_lock = threading.Lock()
        self._save_operations = 0
        self._category_mutation_active = False
        self._sam2_reviews: dict[str, Sam2ReviewLease] = {}
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

    @property
    def category_folders(self) -> tuple[str, ...]:
        """Return the active category identities from the project catalog."""
        return self.mask_categories.folder_names

    @contextmanager
    def _category_mutation(self) -> Iterator[None]:
        with self._operation_state_lock:
            self._purge_expired_sam2_reviews()
            if self._save_operations:
                raise MaskCategoryBusyError(
                    "Mask category management is unavailable during a save"
                )
            if self._sam2_reviews:
                raise MaskCategoryBusyError(
                    "Mask category management is unavailable during an open SAM2 review"
                )
            if self._category_mutation_active:
                raise MaskCategoryBusyError(
                    "Another Mask category operation is already in progress"
                )
            self._category_mutation_active = True
        try:
            with self.lock:
                yield
        finally:
            with self._operation_state_lock:
                self._category_mutation_active = False

    @contextmanager
    def _save_operation(self) -> Iterator[None]:
        with self._operation_state_lock:
            if self._category_mutation_active:
                raise MaskCategoryBusyError(
                    "Saving is unavailable during a Mask category operation"
                )
            self._save_operations += 1
        try:
            yield
        finally:
            with self._operation_state_lock:
                self._save_operations -= 1

    def _open_sam2_review(self) -> str:
        with self._operation_state_lock:
            self._purge_expired_sam2_reviews()
            if self._save_operations:
                raise MaskCategoryBusyError(
                    "SAM2 propagation is unavailable during a save"
                )
            if self._category_mutation_active:
                raise MaskCategoryBusyError(
                    "SAM2 propagation is unavailable during a Mask category operation"
                )
            review_token = uuid.uuid4().hex
            self._sam2_reviews[review_token] = Sam2ReviewLease(
                category_folders=self.category_folders,
                expires_at=None,
            )
            return review_token

    def _activate_sam2_review(self, review_token: str) -> None:
        with self._operation_state_lock:
            lease = self._sam2_reviews.get(review_token)
            if lease is None:
                raise ValueError("SAM2 review token is invalid or closed")
            self._sam2_reviews[review_token] = Sam2ReviewLease(
                category_folders=lease.category_folders,
                expires_at=time.monotonic() + SAM2_REVIEW_LEASE_SECONDS,
            )

    def _purge_expired_sam2_reviews(self) -> None:
        now = time.monotonic()
        expired_tokens = [
            review_token
            for review_token, lease in self._sam2_reviews.items()
            if lease.expires_at is not None and lease.expires_at <= now
        ]
        for review_token in expired_tokens:
            self._sam2_reviews.pop(review_token, None)

    def _validate_sam2_review(self, review_token: str) -> None:
        if not isinstance(review_token, str) or not review_token:
            raise ValueError("SAM2 review token is required")
        with self._operation_state_lock:
            self._purge_expired_sam2_reviews()
            lease = self._sam2_reviews.get(review_token)
            if lease is None:
                raise ValueError("SAM2 review token is invalid or closed")
            if lease.category_folders != self.category_folders:
                raise ValueError("Mask categories changed during the SAM2 review")

    def renew_sam2_review(self, review_token: str) -> dict[str, bool]:
        if not isinstance(review_token, str) or not review_token:
            raise ValueError("SAM2 review token is required")
        with self._operation_state_lock:
            self._purge_expired_sam2_reviews()
            lease = self._sam2_reviews.get(review_token)
            if lease is None or lease.expires_at is None:
                raise ValueError("SAM2 review token is invalid or not ready")
            self._sam2_reviews[review_token] = Sam2ReviewLease(
                category_folders=lease.category_folders,
                expires_at=time.monotonic() + SAM2_REVIEW_LEASE_SECONDS,
            )
        return {"active": True}

    def close_sam2_review(self, review_token: str) -> dict[str, bool]:
        if not isinstance(review_token, str) or not review_token:
            raise ValueError("SAM2 review token is required")
        with self._operation_state_lock:
            self._purge_expired_sam2_reviews()
            closed = self._sam2_reviews.pop(review_token, None) is not None
        return {"closed": closed}

    def _load_project(self) -> dict:
        if not self.project_path.is_file():
            raise RuntimeError(
                f"DataSeg project metadata is missing: {self.project_path}"
            )
        project = json.loads(self.project_path.read_text(encoding="utf-8"))
        categories = MaskCategoryCatalog.from_project(project)
        if project.get("tool") != "dataseg":
            raise RuntimeError("The output folder is not a DataSeg project")
        if not str(project.get("project_id", "")).strip():
            raise RuntimeError("DataSeg project metadata is missing project_id")
        if not str(project.get("raw_data_dir", "")).strip():
            raise RuntimeError("DataSeg project metadata is missing raw_data_dir")
        upgraded = categories.write_to(project)
        if upgraded != project:
            atomic_write_json(self.project_path, upgraded)
        return upgraded

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
            if state.get("schema_version") != REVIEWER_STATE_SCHEMA_VERSION:
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
            "schema_version": REVIEWER_STATE_SCHEMA_VERSION,
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
            if paths["image_path"].is_file() and all(
                mask_path.is_file() for mask_path in paths["masks"].values()
            ):
                valid[item_id] = entry
        if valid != reviewed:
            self.state["reviewed"] = valid
            atomic_write_json(self.state_path, self.state)

    def _dataset_paths(self, item: dict) -> DatasetFramePaths:
        return {
            "image_path": (
                self.dataset_root
                / "images"
                / item["clip"]
                / item["source_name"]
            ),
            "masks": {
                folder_name: (
                    self.dataset_root
                    / "masks"
                    / folder_name
                    / item["clip"]
                    / item["source_name"]
                )
                for folder_name in self.category_folders
            },
        }

    def _write_manifests(self) -> None:
        reviewed = self.state["reviewed"]
        rows = []
        for item in self.all_items:
            if item["id"] not in reviewed:
                continue
            paths = self._dataset_paths(item)
            row = {
                "id": item["id"],
                "clip": item["clip"],
                "frame_index": item["frame_index"],
                "image": paths["image_path"]
                .relative_to(self.dataset_root)
                .as_posix(),
            }
            row.update(
                {
                    f"{folder_name}_mask": paths["masks"][folder_name]
                    .relative_to(self.dataset_root)
                    .as_posix()
                    for folder_name in self.category_folders
                }
            )
            row["saved_at"] = reviewed[item["id"]]["saved_at"]
            rows.append(row)

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
            *(f"{folder_name}_mask" for folder_name in self.category_folders),
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
                "mask_categories": [
                    category.to_dict() for category in self.mask_categories.active
                ],
                "archived_mask_categories": [
                    category.to_public_dict()
                    for category in self.mask_categories.archived
                ],
                "sam2_before_frames": self.sam2_before_frames,
                "sam2_after_frames": self.sam2_after_frames,
                "items": items,
            }

    def add_mask_category(self, payload: dict) -> dict[str, object]:
        """Validate, persist, and activate one project-owned Mask category."""
        if not isinstance(payload, dict):
            raise ValueError("Mask category payload must be an object")
        with self._category_mutation():
            archive_action = payload.get("archive_action")
            if archive_action not in {None, "start_empty"}:
                raise ValueError(
                    "Mask category archive_action must be start_empty when provided"
                )
            try:
                updated_catalog = self.mask_categories.add(payload)
            except RuntimeError as error:
                raise ValueError(str(error)) from error

            category = updated_catalog.active[-1]
            archived_matches = self.mask_categories.archives_for_folder(
                category.folder_name
            )
            if archived_matches and archive_action != "start_empty":
                raise MaskCategoryConflictError(
                    "archived_folder_conflict: this folder belongs to an archived "
                    "Mask category. Restore it or explicitly start empty.",
                    code="archived_folder_conflict",
                    archives=[
                        archived.to_public_dict() for archived in archived_matches
                    ],
                )
            if archive_action == "start_empty" and not archived_matches:
                raise ValueError(
                    "archive_action start_empty requires an archived category "
                    "with the same folder name"
                )
            masks_root = self.dataset_root / "masks"
            category_root = self.dataset_root / "masks" / category.folder_name
            if category_root.exists() and not category_root.is_dir():
                raise ValueError(
                    f"Mask category folder is not a directory: {category.folder_name}"
                )
            if category_root.exists():
                raise ValueError(
                    "Mask category folder already exists. Restore the archived "
                    "category or choose another folder name."
                )

            updated_project = updated_catalog.write_to(self.project)
            masks_root_preexisting = masks_root.exists()
            masks_root.mkdir(parents=True, exist_ok=True)
            staging_root = Path(
                tempfile.mkdtemp(
                    dir=masks_root,
                    prefix=f".{category.folder_name}.staging-",
                )
            )
            category_activated = False
            previous_project = self.project
            previous_catalog = self.mask_categories
            snapshots = self._file_snapshots(self._catalog_transaction_files())
            reviewed_items = [
                item
                for item in self.all_items
                if item["id"] in self.state["reviewed"]
            ]
            try:
                for item in reviewed_items:
                    with Image.open(Path(item["source_path"])) as source:
                        empty_mask = Image.new("L", source.size, color=0)
                    atomic_save_png(
                        staging_root / item["clip"] / item["source_name"],
                        empty_mask,
                    )
                os.replace(staging_root, category_root)
                category_activated = True
                atomic_write_json(self.project_path, updated_project)
                self.project = updated_project
                self.mask_categories = updated_catalog
                self._write_manifests()
            except Exception:
                self.project = previous_project
                self.mask_categories = previous_catalog
                if category_activated:
                    shutil.rmtree(category_root, ignore_errors=True)
                shutil.rmtree(staging_root, ignore_errors=True)
                self._restore_file_snapshots(snapshots)
                if not masks_root_preexisting:
                    try:
                        masks_root.rmdir()
                    except OSError:
                        pass
                raise

            category_value = category.to_dict()
            return {
                **category_value,
                "category": category_value,
                "backfilled_count": len(reviewed_items),
            }

    def _archive_storage_path(self, archive_path: str) -> Path:
        """Resolve a validated project archive path without allowing escape."""
        parts = archive_path.split("/")
        if len(parts) != 3 or parts[:2] != [".dataseg", "mask_archive"]:
            raise ValueError("Mask category archive metadata is invalid")
        archive_root = self.mask_archive_root.resolve()
        candidate = (self.dataset_root / Path(*parts)).resolve()
        try:
            relative = candidate.relative_to(archive_root)
        except ValueError as error:
            raise ValueError(
                "Mask category archive metadata is outside the project archive"
            ) from error
        if len(relative.parts) != 1:
            raise ValueError("Mask category archive metadata is invalid")
        return candidate

    @staticmethod
    def _file_snapshots(paths: tuple[Path, ...]) -> dict[Path, bytes | None]:
        return {
            path: path.read_bytes() if path.is_file() else None
            for path in paths
        }

    @staticmethod
    def _restore_file_snapshots(snapshots: dict[Path, bytes | None]) -> None:
        """Restore transaction files without depending on patched write helpers."""
        for path, payload in snapshots.items():
            if payload is None:
                path.unlink(missing_ok=True)
                continue
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)

    def _catalog_transaction_files(self) -> tuple[Path, ...]:
        return (
            self.project_path,
            self.dataset_root / "annotation_manifest.jsonl",
            self.dataset_root / "annotation_manifest.csv",
        )

    def archive_mask_category(self, folder_name: str) -> dict[str, str]:
        """Archive one active category and move all of its Mask data atomically."""
        with self._category_mutation():
            archive_id = uuid.uuid4().hex
            try:
                updated_catalog, archived = self.mask_categories.archive(
                    folder_name,
                    archive_id,
                    utc_now(),
                )
            except RuntimeError as error:
                raise ValueError(str(error)) from error

            source_root = self.dataset_root / "masks" / archived.folder_name
            if not source_root.is_dir():
                raise ValueError(
                    f"Mask category data folder is missing: {archived.folder_name}"
                )
            archive_root_preexisting = self.mask_archive_root.exists()
            self.mask_archive_root.mkdir(parents=True, exist_ok=True)
            destination_root = self._archive_storage_path(archived.archive_path)
            if destination_root.exists():
                raise ValueError("Mask category archive identifier already exists")

            previous_project = self.project
            previous_catalog = self.mask_categories
            updated_project = updated_catalog.write_to(self.project)
            snapshots = self._file_snapshots(self._catalog_transaction_files())
            moved = False
            try:
                os.replace(source_root, destination_root)
                moved = True
                atomic_write_json(self.project_path, updated_project)
                self.project = updated_project
                self.mask_categories = updated_catalog
                self._write_manifests()
            except Exception:
                self.project = previous_project
                self.mask_categories = previous_catalog
                if moved and destination_root.exists() and not source_root.exists():
                    source_root.parent.mkdir(parents=True, exist_ok=True)
                    os.replace(destination_root, source_root)
                self._restore_file_snapshots(snapshots)
                if not archive_root_preexisting:
                    try:
                        self.mask_archive_root.rmdir()
                    except OSError:
                        pass
                raise

            return archived.to_public_dict()

    def restore_mask_category(self, archive_id: str) -> dict[str, str]:
        """Restore one archived category with its original metadata and Masks."""
        with self._category_mutation():
            try:
                updated_catalog, archived = self.mask_categories.restore(archive_id)
            except RuntimeError as error:
                raise ValueError(str(error)) from error

            source_root = self._archive_storage_path(archived.archive_path)
            if not source_root.is_dir():
                raise ValueError("Mask category archive data is missing")
            destination_root = (
                self.dataset_root / "masks" / archived.folder_name
            )
            if destination_root.exists():
                raise MaskCategoryConflictError(
                    "active_folder_conflict: the active Mask folder already exists",
                    code="active_folder_conflict",
                )

            previous_project = self.project
            previous_catalog = self.mask_categories
            updated_project = updated_catalog.write_to(self.project)
            snapshots = self._file_snapshots(self._catalog_transaction_files())
            moved = False
            try:
                destination_root.parent.mkdir(parents=True, exist_ok=True)
                os.replace(source_root, destination_root)
                moved = True
                atomic_write_json(self.project_path, updated_project)
                self.project = updated_project
                self.mask_categories = updated_catalog
                self._write_manifests()
            except Exception:
                self.project = previous_project
                self.mask_categories = previous_catalog
                if moved and destination_root.exists() and not source_root.exists():
                    source_root.parent.mkdir(parents=True, exist_ok=True)
                    os.replace(destination_root, source_root)
                self._restore_file_snapshots(snapshots)
                raise

            try:
                self.mask_archive_root.rmdir()
            except OSError:
                pass
            category = next(
                category
                for category in updated_catalog.active
                if category.folder_name == archived.folder_name
            )
            return category.to_dict()

    def update_mask_category(
        self,
        folder_name: str,
        payload: dict,
    ) -> dict[str, str]:
        """Persist mutable metadata for one active Mask category."""
        if not isinstance(payload, dict):
            raise ValueError("Mask category update payload must be an object")
        with self._category_mutation():
            try:
                updated_catalog = self.mask_categories.update(
                    folder_name,
                    payload,
                )
            except RuntimeError as error:
                raise ValueError(str(error)) from error

            updated_project = updated_catalog.write_to(self.project)
            atomic_write_json(self.project_path, updated_project)
            self.project = updated_project
            self.mask_categories = updated_catalog
            category = next(
                category
                for category in updated_catalog.active
                if category.folder_name == folder_name.strip()
            )
            return category.to_dict()

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
        folder_name = payload.get("label")
        if folder_name not in self.category_folders:
            raise ValueError("SAM2 propagation category is not active")
        review_token = self._open_sam2_review()
        try:
            result = self._sam2_preview(index, payload, service)
        except Exception:
            self.close_sam2_review(review_token)
            raise
        self._activate_sam2_review(review_token)
        result["review_token"] = review_token
        return result

    def _sam2_preview(
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
        if label not in self.category_folders:
            raise ValueError("SAM2 propagation category is not active")
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
        if label not in self.category_folders:
            raise ValueError(label)
        item = self.item(index)
        reviewed_path = self._dataset_paths(item)["masks"][label]
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
        if not isinstance(data_url, str):
            raise ValueError("Mask must be a PNG data URL")
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

    def _mask_payloads(self, payload: dict, context: str) -> dict:
        if not isinstance(payload, dict):
            raise ValueError(f"{context} must be an object")
        nested = payload.get("masks")
        if isinstance(nested, dict):
            return nested
        return payload

    def save(self, index: int, payload: dict) -> dict:
        with self._save_operation():
            return self._save(index, payload)

    def _save(self, index: int, payload: dict) -> dict:
        if not self.category_folders:
            raise ValueError("Add a Mask category before saving")
        item = self.item(index)
        with Image.open(self.image_path(index)) as source:
            expected_size = source.size
        mask_payloads = self._mask_payloads(payload, "Save payload")
        try:
            masks = {
                folder_name: self._decode_mask(
                    mask_payloads[folder_name], expected_size
                )
                for folder_name in self.category_folders
            }
        except KeyError as error:
            raise ValueError(f"Save payload is missing mask {error.args[0]}") from error

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

    def save_batch(
        self,
        entries: list[dict],
        overwrite_reviewed: bool = False,
        keyframe_index: int | None = None,
        review_token: str | None = None,
    ) -> dict:
        if review_token is not None:
            self._validate_sam2_review(review_token)
        with self._save_operation():
            result = self._save_batch(
                entries,
                overwrite_reviewed=overwrite_reviewed,
                keyframe_index=keyframe_index,
            )
        if review_token is not None:
            self.close_sam2_review(review_token)
        return result

    def _save_batch(
        self,
        entries: list[dict],
        overwrite_reviewed: bool = False,
        keyframe_index: int | None = None,
    ) -> dict:
        if not self.category_folders:
            raise ValueError("Add a Mask category before saving")
        if not isinstance(entries, list) or not 1 <= len(entries) <= 64:
            raise ValueError("Select between 1 and 64 frames")
        if not isinstance(overwrite_reviewed, bool):
            raise ValueError("overwrite_reviewed must be a boolean")
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
        if overwrite_reviewed:
            if (
                not isinstance(keyframe_index, int)
                or isinstance(keyframe_index, bool)
            ):
                raise ValueError(
                    "keyframe_index is required when overwriting reviewed frames"
                )
            keyframe = self.item(keyframe_index)
            if keyframe["clip"] != items[0]["clip"]:
                raise ValueError(
                    "Batch review and keyframe must stay within one capture clip"
                )

        prepared: list[tuple[int, dict, dict[str, Image.Image]]] = []
        for index, item in zip(selected_indices, items):
            with Image.open(self.image_path(index)) as source:
                expected_size = source.size
            entry = entries_by_index[index]
            mask_payloads = self._mask_payloads(entry, f"Batch entry {index}")
            try:
                masks = {
                    folder_name: self._decode_mask(
                        mask_payloads[folder_name], expected_size
                    )
                    for folder_name in self.category_folders
                }
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
            if already_reviewed and not overwrite_reviewed:
                raise ValueError(
                    f"Batch frame is already reviewed: {already_reviewed[0]}"
                )
            protected_reviewed = [
                item["id"]
                for index, item in zip(selected_indices, items)
                if item["id"] in reviewed
                and index <= keyframe_index
            ]
            if protected_reviewed:
                raise ValueError(
                    "Reviewed frames at or before the keyframe cannot be "
                    f"overwritten: {protected_reviewed[0]}"
                )

            saved_at = utc_now()
            overwritten_indices: list[int] = []
            for index, item, masks in prepared:
                was_reviewed = item["id"] in reviewed
                self._write_item_files(index, item, masks)
                self._mark_reviewed(
                    item,
                    saved_at,
                    "batch_overwrite" if was_reviewed else "batch_review",
                )
                if was_reviewed:
                    overwritten_indices.append(index)
            self._commit_review_state()

            processed = len(self.state["reviewed"])
            next_index = self._next_unreviewed(selected_indices[0] - 1)
            return {
                "saved": True,
                "saved_indices": selected_indices,
                "saved_count": len(selected_indices),
                "overwritten_indices": overwritten_indices,
                "overwritten_count": len(overwritten_indices),
                "processed": processed,
                "total": len(self.items),
                "next_index": next_index,
                "last_saved_index": selected_indices[-1],
                "clip": items[0]["clip"],
            }

    def _write_item_files(
        self,
        index: int,
        item: dict,
        masks: dict[str, Image.Image],
    ) -> None:
        paths = self._dataset_paths(item)
        image_path = paths["image_path"]
        image_path.parent.mkdir(parents=True, exist_ok=True)
        if not image_path.exists():
            handle = tempfile.NamedTemporaryFile(
                dir=image_path.parent,
                prefix=f".{image_path.name}.",
                suffix=".tmp",
                delete=False,
            )
            temp_path = Path(handle.name)
            handle.close()
            try:
                shutil.copy2(self.image_path(index), temp_path)
                os.replace(temp_path, image_path)
            finally:
                temp_path.unlink(missing_ok=True)

        for folder_name in self.category_folders:
            atomic_save_png(paths["masks"][folder_name], masks[folder_name])

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

    def _send_category_conflict(self, error: MaskCategoryConflictError) -> None:
        self._send_json(
            {
                "error": str(error),
                "code": error.code,
                "archives": error.archives,
            },
            HTTPStatus.CONFLICT,
        )

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
                        "mask_categories": [
                            category.to_dict()
                            for category in self.store.mask_categories.active
                        ],
                        "archived_mask_categories": [
                            category.to_public_dict()
                            for category in self.store.mask_categories.archived
                        ],
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
            if (
                len(parts) == 5
                and parts[:3] == ["api", "sam2", "reviews"]
                and parts[4] == "heartbeat"
            ):
                self._send_json(self.store.renew_sam2_review(parts[3]))
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
            if parsed.path == "/api/mask-categories":
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 10_000:
                    raise ValueError("Invalid request size")
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                self._send_json(
                    self.store.add_mask_category(payload),
                    HTTPStatus.CREATED,
                )
                return
            if (
                len(parts) == 4
                and parts[:2] == ["api", "mask-archives"]
                and parts[3] == "restore"
            ):
                length = int(self.headers.get("Content-Length", "0"))
                if length < 0 or length > 10_000:
                    raise ValueError("Invalid request size")
                if length:
                    json.loads(self.rfile.read(length).decode("utf-8"))
                self._send_json(
                    self.store.restore_mask_category(parts[2]),
                )
                return
            if parsed.path == "/api/batch/save":
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 20_000_000:
                    raise ValueError("Invalid request size")
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                review_token = payload.get("review_token")
                if not isinstance(review_token, str) or not review_token:
                    raise ValueError("SAM2 review token is required")
                self._send_json(
                    self.store.save_batch(
                        payload["items"],
                        overwrite_reviewed=payload.get(
                            "overwrite_reviewed",
                            False,
                        ),
                        keyframe_index=payload.get("keyframe_index"),
                        review_token=review_token,
                    )
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
        except MaskCategoryConflictError as error:
            self._send_category_conflict(error)
        except MaskCategoryBusyError as error:
            self._send_json(
                {"error": str(error), "code": "category_management_busy"},
                HTTPStatus.CONFLICT,
            )
        except (
            IndexError,
            ValueError,
            RuntimeError,
            KeyError,
            json.JSONDecodeError,
        ) as error:
            self._send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
        except Exception as error:
            self._send_json({"error": str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        parts = [part for part in parsed.path.split("/") if part]
        try:
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
            if len(parts) == 4 and parts[:3] == ["api", "sam2", "reviews"]:
                self._send_json(self.store.close_sam2_review(parts[3]))
                return
            if len(parts) != 3 or parts[:2] != ["api", "mask-categories"]:
                self._send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
                return
            self._send_json(self.store.archive_mask_category(parts[2]))
        except MaskCategoryConflictError as error:
            self._send_category_conflict(error)
        except MaskCategoryBusyError as error:
            self._send_json(
                {"error": str(error), "code": "category_management_busy"},
                HTTPStatus.CONFLICT,
            )
        except (ValueError, RuntimeError, KeyError) as error:
            self._send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
        except Exception as error:
            self._send_json({"error": str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_PATCH(self) -> None:
        parsed = urlparse(self.path)
        parts = [part for part in parsed.path.split("/") if part]
        try:
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
            if len(parts) != 3 or parts[:2] != ["api", "mask-categories"]:
                self._send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)
                return
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 10_000:
                raise ValueError("Invalid request size")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            self._send_json(
                self.store.update_mask_category(parts[2], payload),
            )
        except MaskCategoryBusyError as error:
            self._send_json(
                {"error": str(error), "code": "category_management_busy"},
                HTTPStatus.CONFLICT,
            )
        except (
            ValueError,
            RuntimeError,
            KeyError,
            json.JSONDecodeError,
        ) as error:
            self._send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
        except Exception as error:
            self._send_json({"error": str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Local Mask category reviewer")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--dataset-root", type=Path, default=DEFAULT_DATASET_ROOT)
    parser.add_argument("--prepared-root", type=Path, default=PREPARED_ROOT)
    parser.add_argument("--candidate-root", type=Path, default=CANDIDATE_ROOT)
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
