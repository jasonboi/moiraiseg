from __future__ import annotations

import csv
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image

from scripts.prepare_dataset import (
    discover_clips,
    frame_index,
    load_metadata,
    prepare_clip,
)


class DiscoverClipsTests(unittest.TestCase):
    def test_direct_frames_directory_is_one_clip(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "clip"
            (root / "frames").mkdir(parents=True)

            self.assertEqual(discover_clips(root), [root])

    def test_only_immediate_clip_directories_are_discovered(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            later = root / "z-clip"
            earlier = root / "A-clip"
            nested = root / "group" / "nested-clip"
            for clip in (later, earlier, nested):
                (clip / "frames").mkdir(parents=True)

            self.assertEqual(discover_clips(root), [earlier, later])


class FrameIndexTests(unittest.TestCase):
    def test_metadata_frame_takes_priority(self) -> None:
        path = Path("frame_000004.png")
        metadata = {path.name: {"file": path.name, "frame": "17"}}

        self.assertEqual(frame_index(path, 2, metadata), 17)

    def test_filename_number_precedes_position_fallback(self) -> None:
        self.assertEqual(frame_index(Path("scan-0032-left.png"), 7, {}), 32)
        self.assertEqual(frame_index(Path("scan-left.png"), 7, {}), 7)


class MetadataTests(unittest.TestCase):
    def test_optional_metadata_can_be_absent(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            self.assertEqual(load_metadata(Path(directory) / "metadata.csv"), {})

    def test_duplicate_file_values_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "metadata.csv"
            with path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=["file", "frame"])
                writer.writeheader()
                writer.writerow({"file": "frame.png", "frame": 1})
                writer.writerow({"file": "frame.png", "frame": 2})

            with self.assertRaisesRegex(RuntimeError, "duplicate file values"):
                load_metadata(path)


class PrepareClipTests(unittest.TestCase):
    def test_mixed_frame_sizes_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            clip = root / "clip"
            frames = clip / "frames"
            frames.mkdir(parents=True)
            Image.new("L", (16, 16)).save(frames / "frame_000001.png")
            Image.new("L", (20, 16)).save(frames / "frame_000002.png")

            with self.assertRaisesRegex(RuntimeError, "must have one size"):
                prepare_clip(
                    clip,
                    root / "prepared",
                    root / "candidates",
                    "content-signature",
                    (),
                )


class PrepareDatasetIntegrationTests(unittest.TestCase):
    def test_preparation_writes_moiraiseg_project_identity(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source" / "clip" / "frames"
            output = root / "output"
            source.mkdir(parents=True)
            Image.new("L", (16, 16)).save(source / "frame_000001.png")
            config = root / "config.json"
            config.write_text(
                json.dumps(
                    {
                        "schema_version": 1,
                        "raw_data_dir": str(root / "source"),
                        "output_dir": str(output),
                        "sam2_before_frames": 4,
                        "sam2_after_frames": 16,
                        "sam2_device": "auto",
                        "python_executable": sys.executable,
                        "port": 8767,
                    }
                ),
                encoding="utf-8",
            )

            subprocess.run(
                [
                    sys.executable,
                    str(Path(__file__).parents[1] / "scripts" / "prepare_dataset.py"),
                    "--config",
                    str(config),
                ],
                check=True,
                capture_output=True,
                text=True,
            )

            project_path = output / ".moiraiseg" / "project.json"
            self.assertTrue(project_path.is_file())
            project = json.loads(project_path.read_text(encoding="utf-8"))
            self.assertEqual(project["tool"], "moiraiseg")


if __name__ == "__main__":
    unittest.main()
