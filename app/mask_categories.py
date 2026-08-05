from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import PurePosixPath
from typing import Any, Mapping


PROJECT_SCHEMA_VERSION = 3
LEGACY_PROJECT_SCHEMA_VERSION = 2
MAX_ACTIVE_CATEGORIES = 5
FOLDER_NAME_PATTERN = re.compile(r"[a-z][a-z0-9_-]{0,31}\Z")
COLOR_PATTERN = re.compile(r"#[0-9A-Fa-f]{6}\Z")
ARCHIVE_ID_PATTERN = re.compile(r"[A-Za-z0-9][A-Za-z0-9_-]{0,127}\Z")
WINDOWS_RESERVED_NAMES = frozenset(
    {
        "con",
        "prn",
        "aux",
        "nul",
        *(f"com{number}" for number in range(1, 10)),
        *(f"lpt{number}" for number in range(1, 10)),
    }
)
ARCHIVE_ROOT_PARTS = (".dataseg", "mask_archive")


def _required_string(value: object, field_name: str) -> str:
    if not isinstance(value, str):
        raise RuntimeError(f"Mask category {field_name} must be a string")
    normalized = value.strip()
    if not normalized:
        raise RuntimeError(f"Mask category {field_name} must not be empty")
    return normalized


def _validated_folder_name(value: object) -> str:
    folder_name = _required_string(value, "folder_name")
    if not FOLDER_NAME_PATTERN.fullmatch(folder_name):
        raise RuntimeError(
            "Mask category folder_name must match [a-z][a-z0-9_-]{0,31}"
        )
    if folder_name.casefold() in WINDOWS_RESERVED_NAMES:
        raise RuntimeError(
            "Mask category folder_name must not use a Windows reserved name"
        )
    return folder_name


def _validated_color(value: object) -> str:
    color = _required_string(value, "color").upper()
    if not COLOR_PATTERN.fullmatch(color):
        raise RuntimeError("Mask category color must use #RRGGBB")
    return color


def _validated_archive_id(value: object) -> str:
    archive_id = _required_string(value, "archive_id")
    if not ARCHIVE_ID_PATTERN.fullmatch(archive_id):
        raise RuntimeError(
            "Archived Mask category archive_id must contain only letters, "
            "numbers, underscores, and hyphens"
        )
    if archive_id.casefold() in WINDOWS_RESERVED_NAMES:
        raise RuntimeError(
            "Archived Mask category archive_id must not use a Windows reserved name"
        )
    return archive_id


def _validated_archive_path(value: object, archive_id: str) -> str:
    archive_path = _required_string(value, "archive_path")
    if "\\" in archive_path:
        raise RuntimeError(
            "Archived Mask category archive_path must use a project-relative "
            "POSIX path"
        )
    raw_parts = archive_path.split("/")
    if any(part in {"", ".", ".."} for part in raw_parts):
        raise RuntimeError(
            "Archived Mask category archive_path must stay inside the project"
        )
    path = PurePosixPath(archive_path)
    if path.is_absolute() or len(path.parts) != 3:
        raise RuntimeError(
            "Archived Mask category archive_path must identify one project archive"
        )
    if path.parts[:2] != ARCHIVE_ROOT_PARTS or path.parts[2] != archive_id:
        raise RuntimeError(
            "Archived Mask category archive_path must be "
            ".dataseg/mask_archive/<archive_id>"
        )
    return path.as_posix()


@dataclass(frozen=True)
class MaskCategory:
    display_name: str
    folder_name: str
    color: str

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "display_name",
            _required_string(self.display_name, "display_name"),
        )
        object.__setattr__(
            self,
            "folder_name",
            _validated_folder_name(self.folder_name),
        )
        object.__setattr__(self, "color", _validated_color(self.color))

    @classmethod
    def from_value(cls, value: object) -> "MaskCategory":
        if not isinstance(value, Mapping):
            raise RuntimeError("Mask category definitions must be objects")
        return cls(
            value.get("display_name"),  # type: ignore[arg-type]
            value.get("folder_name"),  # type: ignore[arg-type]
            value.get("color"),  # type: ignore[arg-type]
        )

    def to_dict(self) -> dict[str, str]:
        return {
            "display_name": self.display_name,
            "folder_name": self.folder_name,
            "color": self.color,
        }


@dataclass(frozen=True)
class ArchivedMaskCategory:
    archive_id: str
    display_name: str
    folder_name: str
    color: str
    archived_at: str
    archive_path: str

    def __post_init__(self) -> None:
        category = MaskCategory(
            self.display_name,
            self.folder_name,
            self.color,
        )
        archive_id = _validated_archive_id(self.archive_id)
        object.__setattr__(self, "archive_id", archive_id)
        object.__setattr__(self, "display_name", category.display_name)
        object.__setattr__(self, "folder_name", category.folder_name)
        object.__setattr__(self, "color", category.color)
        object.__setattr__(
            self,
            "archived_at",
            _required_string(self.archived_at, "archived_at"),
        )
        object.__setattr__(
            self,
            "archive_path",
            _validated_archive_path(self.archive_path, archive_id),
        )

    @classmethod
    def from_value(cls, value: object) -> "ArchivedMaskCategory":
        if not isinstance(value, Mapping):
            raise RuntimeError("Archived Mask category definitions must be objects")
        category = MaskCategory.from_value(value)
        return cls(
            archive_id=value.get("archive_id"),  # type: ignore[arg-type]
            display_name=category.display_name,
            folder_name=category.folder_name,
            color=category.color,
            archived_at=value.get("archived_at"),  # type: ignore[arg-type]
            archive_path=value.get("archive_path"),  # type: ignore[arg-type]
        )

    def to_dict(self) -> dict[str, str]:
        return {
            "archive_id": self.archive_id,
            "display_name": self.display_name,
            "folder_name": self.folder_name,
            "color": self.color,
            "archived_at": self.archived_at,
            "archive_path": self.archive_path,
        }

    def to_public_dict(self) -> dict[str, str]:
        """Return archive metadata safe to expose through the local API."""
        return {
            "archive_id": self.archive_id,
            "display_name": self.display_name,
            "folder_name": self.folder_name,
            "color": self.color,
            "archived_at": self.archived_at,
        }


@dataclass(frozen=True)
class MaskCategoryCatalog:
    active: tuple[MaskCategory, ...]
    archived: tuple[ArchivedMaskCategory, ...]

    def __post_init__(self) -> None:
        self._validate()

    @classmethod
    def from_project(
        cls,
        project: Mapping[str, Any] | None,
    ) -> "MaskCategoryCatalog":
        if project is None:
            return cls(active=(), archived=())
        if not isinstance(project, Mapping):
            raise RuntimeError("DataSeg project metadata must be an object")

        schema_version = project.get("schema_version")
        if schema_version == LEGACY_PROJECT_SCHEMA_VERSION:
            vessel_only = project.get("vessel_only", False)
            if not isinstance(vessel_only, bool):
                raise RuntimeError(
                    "Legacy DataSeg project vessel_only must be a boolean"
                )
            active = [
                MaskCategory("Vessel", "vessel", "#35C8D7"),
            ]
            if not vessel_only:
                active.append(MaskCategory("Lesion", "lesion", "#F071B8"))
            return cls(active=tuple(active), archived=())
        if schema_version != PROJECT_SCHEMA_VERSION:
            raise RuntimeError(
                "The selected output folder uses an unsupported DataSeg "
                "project version. Choose an empty output folder."
            )

        active_value = project.get("mask_categories")
        archived_value = project.get("archived_mask_categories")
        if not isinstance(active_value, list):
            raise RuntimeError("DataSeg project mask_categories must be a list")
        if not isinstance(archived_value, list):
            raise RuntimeError(
                "DataSeg project archived_mask_categories must be a list"
            )
        active = tuple(MaskCategory.from_value(value) for value in active_value)
        archived = tuple(
            ArchivedMaskCategory.from_value(value) for value in archived_value
        )
        return cls(active=active, archived=archived)

    def _validate(self) -> None:
        if not isinstance(self.active, tuple):
            raise RuntimeError("Active Mask categories must be a tuple")
        if not isinstance(self.archived, tuple):
            raise RuntimeError("Archived Mask categories must be a tuple")
        if any(not isinstance(category, MaskCategory) for category in self.active):
            raise RuntimeError("Active Mask categories contain an invalid value")
        if any(
            not isinstance(category, ArchivedMaskCategory)
            for category in self.archived
        ):
            raise RuntimeError("Archived Mask categories contain an invalid value")
        for category in self.active:
            validated = MaskCategory(
                category.display_name,
                category.folder_name,
                category.color,
            )
            if validated != category:
                raise RuntimeError("Active Mask category values must be normalized")
        for category in self.archived:
            validated = ArchivedMaskCategory(
                archive_id=category.archive_id,
                display_name=category.display_name,
                folder_name=category.folder_name,
                color=category.color,
                archived_at=category.archived_at,
                archive_path=category.archive_path,
            )
            if validated != category:
                raise RuntimeError("Archived Mask category values must be normalized")
        self._validate_active(self.active)
        self._validate_archive(self.archived)

    @staticmethod
    def _validate_active(categories: tuple[MaskCategory, ...]) -> None:
        if len(categories) > MAX_ACTIVE_CATEGORIES:
            raise RuntimeError(
                f"DataSeg projects support at most {MAX_ACTIVE_CATEGORIES} "
                "active Mask categories"
            )
        fields = {
            "display name": [
                category.display_name.casefold() for category in categories
            ],
            "folder name": [category.folder_name.casefold() for category in categories],
            "color": [category.color.casefold() for category in categories],
        }
        for label, values in fields.items():
            if len(values) != len(set(values)):
                raise RuntimeError(f"Active Mask category {label}s must be unique")

    @staticmethod
    def _validate_archive(
        categories: tuple[ArchivedMaskCategory, ...],
    ) -> None:
        archive_ids = [category.archive_id.casefold() for category in categories]
        if len(archive_ids) != len(set(archive_ids)):
            raise RuntimeError(
                "Archived Mask category archive_id values must be unique"
            )
        archive_paths = [category.archive_path.casefold() for category in categories]
        if len(archive_paths) != len(set(archive_paths)):
            raise RuntimeError(
                "Archived Mask category archive_path values must be unique"
            )

    @property
    def folder_names(self) -> tuple[str, ...]:
        return tuple(category.folder_name for category in self.active)

    def add(self, value: object) -> "MaskCategoryCatalog":
        """Return a validated catalog with one new active category."""
        category = MaskCategory.from_value(value)
        return MaskCategoryCatalog(
            active=(*self.active, category),
            archived=self.archived,
        )

    def update(
        self,
        folder_name: str,
        value: object,
    ) -> "MaskCategoryCatalog":
        """Return a catalog with an active category's mutable fields changed."""
        if not isinstance(value, Mapping):
            raise RuntimeError("Mask category update payload must be an object")
        fields = set(value)
        if "folder_name" in fields:
            raise RuntimeError("Mask category folder_name cannot be changed")
        unsupported = fields - {"display_name", "color"}
        if unsupported:
            raise RuntimeError("Only display_name and color can be changed")
        if not fields:
            raise RuntimeError(
                "Mask category update must include at least one mutable field"
            )

        normalized_folder_name = _validated_folder_name(folder_name)
        category_index = next(
            (
                index
                for index, category in enumerate(self.active)
                if category.folder_name == normalized_folder_name
            ),
            None,
        )
        if category_index is None:
            raise RuntimeError(
                f"Mask category is not active: {normalized_folder_name}"
            )

        current = self.active[category_index]
        updated = MaskCategory(
            display_name=value.get("display_name", current.display_name),
            folder_name=current.folder_name,
            color=value.get("color", current.color),
        )
        active = list(self.active)
        active[category_index] = updated
        return MaskCategoryCatalog(
            active=tuple(active),
            archived=self.archived,
        )

    def archive(
        self,
        folder_name: str,
        archive_id: str,
        archived_at: str,
    ) -> tuple["MaskCategoryCatalog", ArchivedMaskCategory]:
        """Move one active category into the recoverable archive catalog."""
        normalized_folder_name = _validated_folder_name(folder_name)
        category = next(
            (
                active_category
                for active_category in self.active
                if active_category.folder_name == normalized_folder_name
            ),
            None,
        )
        if category is None:
            raise RuntimeError(
                f"Mask category is not active: {normalized_folder_name}"
            )
        normalized_archive_id = _validated_archive_id(archive_id)
        archived = ArchivedMaskCategory(
            archive_id=normalized_archive_id,
            display_name=category.display_name,
            folder_name=category.folder_name,
            color=category.color,
            archived_at=archived_at,
            archive_path=(
                f"{ARCHIVE_ROOT_PARTS[0]}/{ARCHIVE_ROOT_PARTS[1]}/"
                f"{normalized_archive_id}"
            ),
        )
        active = tuple(
            active_category
            for active_category in self.active
            if active_category.folder_name != normalized_folder_name
        )
        return (
            MaskCategoryCatalog(
                active=active,
                archived=(*self.archived, archived),
            ),
            archived,
        )

    def restore(
        self,
        archive_id: str,
    ) -> tuple["MaskCategoryCatalog", ArchivedMaskCategory]:
        """Move one archived category back into the active catalog."""
        normalized_archive_id = _validated_archive_id(archive_id)
        archived = next(
            (
                archived_category
                for archived_category in self.archived
                if archived_category.archive_id == normalized_archive_id
            ),
            None,
        )
        if archived is None:
            raise RuntimeError(
                f"Mask category archive does not exist: {normalized_archive_id}"
            )
        active_category = MaskCategory(
            display_name=archived.display_name,
            folder_name=archived.folder_name,
            color=archived.color,
        )
        remaining_archives = tuple(
            archived_category
            for archived_category in self.archived
            if archived_category.archive_id != normalized_archive_id
        )
        return (
            MaskCategoryCatalog(
                active=(*self.active, active_category),
                archived=remaining_archives,
            ),
            archived,
        )

    def permanently_delete_archive(
        self,
        archive_id: str,
    ) -> tuple["MaskCategoryCatalog", ArchivedMaskCategory]:
        """Remove one archived category from the project catalog."""
        normalized_archive_id = _validated_archive_id(archive_id)
        archived = next(
            (
                archived_category
                for archived_category in self.archived
                if archived_category.archive_id == normalized_archive_id
            ),
            None,
        )
        if archived is None:
            raise RuntimeError(
                f"Mask category archive does not exist: {normalized_archive_id}"
            )
        remaining_archives = tuple(
            archived_category
            for archived_category in self.archived
            if archived_category.archive_id != normalized_archive_id
        )
        return (
            MaskCategoryCatalog(
                active=self.active,
                archived=remaining_archives,
            ),
            archived,
        )

    def archives_for_folder(
        self,
        folder_name: str,
    ) -> tuple[ArchivedMaskCategory, ...]:
        normalized_folder_name = _validated_folder_name(folder_name)
        return tuple(
            archived
            for archived in self.archived
            if archived.folder_name == normalized_folder_name
        )

    def write_to(self, project: Mapping[str, Any]) -> dict[str, Any]:
        if not isinstance(project, Mapping):
            raise RuntimeError("DataSeg project metadata must be an object")
        self._validate()
        upgraded = dict(project)
        upgraded["schema_version"] = PROJECT_SCHEMA_VERSION
        upgraded["mask_categories"] = [
            category.to_dict() for category in self.active
        ]
        upgraded["archived_mask_categories"] = [
            category.to_dict() for category in self.archived
        ]
        upgraded.pop("vessel_only", None)
        return upgraded
