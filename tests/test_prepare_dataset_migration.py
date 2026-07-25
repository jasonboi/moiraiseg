from __future__ import annotations

import json
import os
import shutil
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from scripts.prepare_dataset import (
    clip_content_signature,
    clip_signature,
    ensure_project_compatible,
    main,
)


class PrepareDatasetMigrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.old_raw = self.root / "old-device" / "dataset"
        self.new_raw = self.root / "new-device" / "dataset"
        self.output = self.root / "output"
        self.clip_name = "clip-a"
        self.frame_name = "frame_000001.png"
        self.old_frame = self._write_frame(self.old_raw, color=90)
        shutil.copytree(self.old_raw, self.new_raw)
        self.new_frame = (
            self.new_raw / self.clip_name / "frames" / self.frame_name
        )
        os.utime(
            self.new_frame,
            ns=(
                self.old_frame.stat().st_atime_ns + 1_000_000_000,
                self.old_frame.stat().st_mtime_ns + 1_000_000_000,
            ),
        )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def _write_frame(self, raw_root: Path, color: int) -> Path:
        frames = raw_root / self.clip_name / "frames"
        frames.mkdir(parents=True)
        frame = frames / self.frame_name
        Image.new("L", (8, 6), color=color).save(frame)
        return frame

    def _write_existing_project(self, include_content_signature: bool) -> Path:
        internal = self.output / ".dataseg"
        prepared = internal / "prepared" / self.clip_name
        prepared.mkdir(parents=True)
        (prepared / "frame_map.json").write_text(
            json.dumps(
                [
                    {
                        "frame_index": 1,
                        "source_file": self.frame_name,
                        "source_path": str(self.old_frame),
                        "source_clip": self.clip_name,
                    }
                ]
            ),
            encoding="utf-8",
        )
        project_clip = {
            "frame_count": 1,
            "width": 8,
            "height": 6,
            "signature": clip_signature([self.old_frame]),
        }
        if include_content_signature:
            project_clip["content_signature"] = clip_content_signature(
                self.old_raw / self.clip_name,
                [self.old_frame],
            )
        project_path = internal / "project.json"
        project_path.write_text(
            json.dumps(
                {
                    "schema_version": 2,
                    **(
                        {"content_signature_version": 1}
                        if include_content_signature
                        else {}
                    ),
                    "tool": "dataseg",
                    "project_id": "shared-project",
                    "raw_data_dir": str(self.old_raw),
                    "output_dir": str(self.output),
                    "vessel_only": False,
                    "clips": {self.clip_name: project_clip},
                }
            ),
            encoding="utf-8",
        )
        (internal / "reviewer_state.json").write_text(
            json.dumps(
                {
                    "schema_version": 2,
                    "project_id": "shared-project",
                    "reviewed": {
                        f"{self.clip_name}/{self.frame_name}": {
                            "saved_at": "2026-07-25T00:00:00+00:00",
                            "source": "manual",
                        }
                    },
                }
            ),
            encoding="utf-8",
        )
        saved_image = (
            self.output / "images" / self.clip_name / self.frame_name
        )
        saved_image.parent.mkdir(parents=True)
        shutil.copy2(self.old_frame, saved_image)
        for label in ("vessel", "lesion"):
            mask = (
                self.output
                / "masks"
                / label
                / self.clip_name
                / self.frame_name
            )
            mask.parent.mkdir(parents=True)
            Image.new("L", (8, 6), color=0).save(mask)
        return project_path

    def _current_summary(self) -> dict[str, dict[str, object]]:
        clip_root = self.new_raw / self.clip_name
        return {
            self.clip_name: {
                "frame_count": 1,
                "signature": clip_signature([self.new_frame]),
                "content_signature": clip_content_signature(
                    clip_root,
                    [self.new_frame],
                ),
            }
        }

    def test_rebinds_portable_project_when_content_matches(self) -> None:
        project_path = self._write_existing_project(
            include_content_signature=True
        )

        previous = ensure_project_compatible(
            project_path,
            self.new_raw.resolve(),
            False,
            self._current_summary(),
            self.output,
        )

        self.assertEqual(previous["project_id"], "shared-project")

    def test_rejects_portable_rebind_when_content_differs(self) -> None:
        project_path = self._write_existing_project(
            include_content_signature=True
        )
        Image.new("L", (8, 6), color=180).save(self.new_frame)

        with self.assertRaisesRegex(
            RuntimeError,
            "Raw frame contents changed",
        ):
            ensure_project_compatible(
                project_path,
                self.new_raw.resolve(),
                False,
                self._current_summary(),
                self.output,
            )

    def test_migrates_legacy_project_using_reviewed_source_images(self) -> None:
        project_path = self._write_existing_project(
            include_content_signature=False
        )

        previous = ensure_project_compatible(
            project_path,
            self.new_raw.resolve(),
            False,
            self._current_summary(),
            self.output,
        )

        self.assertEqual(previous["project_id"], "shared-project")

    def test_rejects_legacy_rebind_when_reviewed_image_differs(self) -> None:
        project_path = self._write_existing_project(
            include_content_signature=False
        )
        Image.new("L", (8, 6), color=180).save(self.new_frame)

        with self.assertRaisesRegex(
            RuntimeError,
            "reviewed source images do not match",
        ):
            ensure_project_compatible(
                project_path,
                self.new_raw.resolve(),
                False,
                self._current_summary(),
                self.output,
            )

    def test_prepare_migrates_path_and_preserves_review_state(self) -> None:
        self._write_existing_project(include_content_signature=False)
        config_path = self.root / "config.json"
        config_path.write_text(
            json.dumps(
                {
                    "schema_version": 1,
                    "raw_data_dir": str(self.new_raw),
                    "output_dir": str(self.output),
                    "vessel_only": False,
                }
            ),
            encoding="utf-8",
        )

        stdout = StringIO()
        with (
            patch(
                "sys.argv",
                ["prepare_dataset.py", "--config", str(config_path)],
            ),
            redirect_stdout(stdout),
        ):
            main()

        project = json.loads(
            (self.output / ".dataseg" / "project.json").read_text(
                encoding="utf-8"
            )
        )
        state = json.loads(
            (self.output / ".dataseg" / "reviewer_state.json").read_text(
                encoding="utf-8"
            )
        )
        frame_map = json.loads(
            (
                self.output
                / ".dataseg"
                / "prepared"
                / self.clip_name
                / "frame_map.json"
            ).read_text(encoding="utf-8")
        )

        self.assertEqual(project["project_id"], "shared-project")
        self.assertEqual(
            Path(project["raw_data_dir"]),
            self.new_raw.resolve(),
        )
        self.assertEqual(project["content_signature_version"], 1)
        self.assertTrue(project["clips"][self.clip_name]["content_signature"])
        self.assertEqual(len(state["reviewed"]), 1)
        self.assertEqual(
            Path(frame_map[0]["source_path"]),
            self.new_frame.resolve(),
        )
        self.assertTrue(json.loads(stdout.getvalue())["raw_path_migrated"])


if __name__ == "__main__":
    unittest.main()
