from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

from PIL import Image

try:
    import numpy as np
    import torch
except ModuleNotFoundError as error:
    raise unittest.SkipTest("SAM2 tests require NumPy and PyTorch") from error

from app.sam2_propagation import PropagationFrame, Sam2PropagationService
from app.server import MaskCategoryBusyError, ReviewerStore, png_data_url


SIZE = (8, 6)


def seed_mask(x: int, y: int, value: int = 255) -> Image.Image:
    image = Image.new("L", SIZE)
    image.putpixel((x, y), value)
    return image


class FakePredictor:
    def __init__(self) -> None:
        self.init_calls = 0
        self.add_calls = []
        self.directions = []
        self.reset_calls = []
        self.missing_frame = None
        self.bad_objects = None
        self.bad_position = False
        self.bad_shape = False
        self.fail_on_add = False
        self.fail_on_propagation = False

    def init_state(self, video_path, **kwargs):
        self.init_calls += 1
        self.video_path = Path(video_path)
        return {"count": len(list(self.video_path.glob("*.jpg"))), "seeds": {}}

    def add_new_mask(self, inference_state, frame_idx, obj_id, mask):
        self.add_calls.append((inference_state, frame_idx, obj_id, mask.copy()))
        if self.fail_on_add:
            raise RuntimeError("Fake seed failure")
        inference_state["seeds"][obj_id] = mask.copy()

    def propagate_in_video(self, state, start_frame_idx, reverse):
        self.directions.append(reverse)
        if self.fail_on_propagation:
            raise RuntimeError("Fake propagation failure")
        positions = (
            range(start_frame_idx, -1, -1)
            if reverse
            else range(start_frame_idx, state["count"])
        )
        for position in positions:
            if position == self.missing_frame:
                continue
            object_ids = list(state["seeds"])
            if reverse or position % 2:
                object_ids.reverse()
            if self.bad_objects is not None:
                object_ids = self.bad_objects
            masks = [
                np.roll(
                    state["seeds"].get(object_id, state["seeds"][1]),
                    position - start_frame_idx + 1,
                    axis=1,
                )
                for object_id in object_ids
            ]
            logits = torch.tensor(np.where(np.stack(masks), 2.0, -2.0))[:, None]
            if self.bad_shape:
                logits = logits[:, :, :-1]
            yield state["count"] if self.bad_position else position, object_ids, logits

    def reset_state(self, state):
        self.reset_calls.append(state)


class Sam2PropagationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.checkpoint = self.root / "model.pt"
        self.checkpoint.write_bytes(b"fake checkpoint")
        self.frames = []
        for position in range(3):
            path = self.root / f"frame_{position}.png"
            Image.new("RGB", SIZE).save(path)
            self.frames.append(PropagationFrame(position + 10, path, position == 0))
        self.predictor = FakePredictor()
        self.service = Sam2PropagationService(
            self.checkpoint,
            "fake config",
            device="cpu",
            predictor_factory=lambda *_: self.predictor,
        )
        self.seeds = {"fat": seed_mask(1, 2), "muscle": seed_mask(5, 3)}

    def propagate(self, **kwargs):
        return self.service.propagate(
            self.frames, 1, keyframe_masks=self.seeds, **kwargs
        )

    def test_all_categories_share_one_state_and_follow_returned_object_ids(self):
        self.seeds["empty"] = Image.new("L", SIZE)
        results = self.propagate()

        self.assertEqual(self.predictor.init_calls, 1)
        self.assertEqual(self.predictor.directions, [False, True])
        self.assertEqual([call[2] for call in self.predictor.add_calls], [1, 2])
        self.assertIs(self.predictor.add_calls[0][0], self.predictor.add_calls[1][0])
        self.assertEqual([result.index for result in results], [10, 11, 12])
        self.assertEqual([result.reviewed for result in results], [True, False, False])
        for position, result in enumerate(results):
            self.assertEqual(set(result.masks), {"fat", "muscle"})
            for folder_name, seed in list(self.seeds.items())[:2]:
                expected = np.asarray(seed)
                if position != 1:
                    expected = np.roll(expected, position, axis=1)
                np.testing.assert_array_equal(result.masks[folder_name], expected)
            self.assertNotEqual(
                result.masks["fat"].tobytes(), result.masks["muscle"].tobytes()
            )
        self.assertEqual(len(self.predictor.reset_calls), 1)
        self.assertFalse(self.predictor.video_path.exists())

    def test_overlapping_keyframe_masks_remain_independent_and_exact(self):
        self.seeds = {"fat": seed_mask(2, 2, 128), "muscle": seed_mask(2, 2)}
        results = self.propagate()

        for folder_name in self.seeds:
            self.assertEqual(results[1].masks[folder_name].getpixel((2, 2)), 255)
        build = Mock(return_value=self.predictor)
        with patch.dict(
            sys.modules,
            {"sam2.build_sam": SimpleNamespace(build_sam2_video_predictor=build)},
        ):
            service = Sam2PropagationService(self.checkpoint, "fake", device="cpu")
            self.assertIs(service._get_predictor(), self.predictor)
        self.assertIn(
            "++model.non_overlap_masks=false",
            build.call_args.kwargs["hydra_overrides_extra"],
        )

    def test_legacy_single_mask_call_and_result_remain_available(self):
        results = self.service.propagate(self.frames, 0, self.seeds["fat"])

        self.assertEqual(self.predictor.directions, [False])
        self.assertEqual(results[0].mask.tobytes(), self.seeds["fat"].tobytes())
        self.assertEqual(set(results[0].masks), {"mask"})

    def test_all_empty_masks_fail_without_initializing_predictor(self):
        with self.assertRaisesRegex(ValueError, "masks are empty"):
            self.service.propagate(
                self.frames, 1, keyframe_masks={"fat": Image.new("L", SIZE)}
            )
        self.assertEqual(self.predictor.init_calls, 0)

    def test_empty_category_with_wrong_dimensions_is_rejected(self):
        self.seeds["empty"] = Image.new("L", (2, 2))
        with self.assertRaisesRegex(ValueError, "does not match"):
            self.propagate()
        self.assertEqual(self.predictor.init_calls, 0)

    def test_missing_frame_fails_and_resets_predictor(self):
        self.predictor.missing_frame = 2
        with self.assertRaisesRegex(RuntimeError, "returned 2 frames, expected 3"):
            self.propagate()
        self.assertEqual(len(self.predictor.reset_calls), 1)

    def test_invalid_object_predictions_fail_and_reset_predictor(self):
        for object_ids in ([1], [1, 1], [1, 3]):
            with self.subTest(object_ids=object_ids):
                self.predictor.bad_objects = object_ids
                with self.assertRaisesRegex(RuntimeError, "object predictions"):
                    self.propagate()
        self.assertEqual(len(self.predictor.reset_calls), 3)

    def test_invalid_frame_and_shape_fail_and_reset_predictor(self):
        for attribute, error in (
            ("bad_position", "invalid frame index"),
            ("bad_shape", "mask shape"),
        ):
            with self.subTest(attribute=attribute):
                setattr(self.predictor, attribute, True)
                with self.assertRaisesRegex(RuntimeError, error):
                    self.propagate()
                setattr(self.predictor, attribute, False)
        self.assertEqual(len(self.predictor.reset_calls), 2)

    def test_predictor_errors_during_seeding_and_tracking_reset_state(self):
        for attribute in ("fail_on_add", "fail_on_propagation"):
            with self.subTest(attribute=attribute):
                setattr(self.predictor, attribute, True)
                with self.assertRaisesRegex(RuntimeError, "Fake"):
                    self.propagate()
                setattr(self.predictor, attribute, False)
        self.assertEqual(len(self.predictor.reset_calls), 2)

    def test_invalid_requests_fail_before_predictor_initialization(self):
        for kwargs, error in (
            ({"keyframe_masks": {}}, "requires keyframe masks"),
            ({}, "requires keyframe masks"),
            (
                {"keyframe_mask": self.seeds["fat"], "keyframe_masks": self.seeds},
                "either keyframe_mask or keyframe_masks",
            ),
        ):
            with self.subTest(kwargs=kwargs), self.assertRaisesRegex(ValueError, error):
                self.service.propagate(self.frames, 1, **kwargs)
        with self.assertRaisesRegex(ValueError, "outside"):
            self.service.propagate(self.frames, 3, keyframe_masks=self.seeds)
        self.assertEqual(self.predictor.init_calls, 0)


class Sam2PreviewStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.dataset = self.root / "dataset"
        metadata_root = self.dataset / ".moiraiseg"
        metadata_root.mkdir(parents=True)
        (metadata_root / "project.json").write_text(
            json.dumps(
                {
                    "schema_version": 3,
                    "tool": "moiraiseg",
                    "project_id": "synthetic-test",
                    "raw_data_dir": str(self.root / "raw"),
                    "mask_categories": [
                        {
                            "display_name": "Fat",
                            "folder_name": "fat",
                            "color": "#FF0000",
                        },
                        {
                            "display_name": "Muscle",
                            "folder_name": "muscle",
                            "color": "#00FF00",
                        },
                    ],
                    "archived_mask_categories": [],
                }
            ),
            encoding="utf-8",
        )
        prepared = self.root / "prepared" / "clip"
        prepared.mkdir(parents=True)
        frame_map = []
        for index in range(3):
            source = self.root / f"frame_{index}.png"
            Image.new("RGB", SIZE).save(source)
            frame_map.append(
                {
                    "source_path": str(source),
                    "source_file": source.name,
                    "frame_index": index,
                }
            )
        (prepared / "frame_map.json").write_text(json.dumps(frame_map), encoding="utf-8")
        self.store = ReviewerStore(
            self.dataset,
            prepared_root=prepared.parent,
            candidate_root=self.root / "candidates",
        )
        checkpoint = self.root / "model.pt"
        checkpoint.write_bytes(b"fake checkpoint")
        self.predictor = FakePredictor()
        self.service = Sam2PropagationService(
            checkpoint, "fake", device="cpu", predictor_factory=lambda *_: self.predictor
        )
        self.masks = {
            "fat": png_data_url(seed_mask(1, 2)),
            "muscle": png_data_url(seed_mask(5, 3)),
        }

    def preview(self, **kwargs):
        payload = {"masks": self.masks, "before": 1, "after": 1, **kwargs}
        return self.store.sam2_preview(1, payload, self.service)

    def test_nested_masks_return_all_categories_and_hold_review_lease(self):
        result = self.preview()

        self.assertEqual(result["labels"], ["fat", "muscle"])
        self.assertEqual([item["index"] for item in result["items"]], [0, 1, 2])
        self.assertEqual(
            [item["is_keyframe"] for item in result["items"]], [False, True, False]
        )
        self.assertEqual(result["items"][1]["masks"], self.masks)
        self.assertNotIn("label", result)
        with self.assertRaises(MaskCategoryBusyError):
            self.store.update_mask_category("fat", {"display_name": "Other"})
        self.assertEqual(
            self.store.renew_sam2_review(result["review_token"]), {"active": True}
        )
        self.store.close_sam2_review(result["review_token"])
        self.store.update_mask_category("fat", {"display_name": "Other"})

    def test_empty_category_is_absent_from_predictions_and_existing_files_survive(self):
        candidate = (
            self.store.candidate_root / "clip" / "masks" / "muscle" / "frame_2.png"
        )
        candidate.parent.mkdir(parents=True)
        existing = seed_mask(7, 4)
        existing.save(candidate)
        self.masks["muscle"] = png_data_url(Image.new("L", SIZE))
        result = self.preview()

        self.assertEqual(result["labels"], ["fat"])
        self.assertTrue(all(set(item["masks"]) == {"fat"} for item in result["items"]))
        self.assertEqual(
            self.store.mask_image(2, "muscle", False).tobytes(), existing.tobytes()
        )

    def test_legacy_request_keeps_label_and_mask_fields(self):
        result = self.store.sam2_preview(
            1,
            {"label": "muscle", "mask": self.masks["muscle"], "before": 1, "after": 1},
            self.service,
        )

        self.assertEqual(result["label"], "muscle")
        self.assertEqual(result["labels"], ["muscle"])
        for item in result["items"]:
            self.assertEqual(item["label"], "muscle")
            self.assertEqual(item["mask"], item["masks"]["muscle"])

    def test_invalid_payloads_release_lease_and_do_not_initialize_model(self):
        empty_masks = {
            key: png_data_url(Image.new("L", SIZE)) for key in self.masks
        }
        wrong_size_masks = {
            **self.masks, "muscle": png_data_url(Image.new("L", (2, 2)))
        }
        for payload, error in (
            ([], "payload must be an object"),
            ({"masks": []}, "masks must be an object"),
            ({"masks": {"fat": self.masks["fat"]}}, "missing masks for muscle"),
            ({"masks": {**self.masks, "unknown": self.masks["fat"]}}, "not active"),
            ({"label": "unknown", "mask": self.masks["fat"]}, "not active"),
            ({"label": "fat"}, "requires a fat mask"),
            ({"masks": self.masks, "before": True}, "must be integers"),
            ({"masks": {"fat": None, "muscle": self.masks["muscle"]}}, "PNG data URL"),
            ({"masks": empty_masks}, "masks are empty"),
            ({"masks": wrong_size_masks}, "does not match"),
        ):
            with self.subTest(payload=payload), self.assertRaisesRegex(ValueError, error):
                self.store.sam2_preview(1, payload, self.service)
            self.assertEqual(self.store._sam2_reviews, {})
        self.assertEqual(self.predictor.init_calls, 0)

    def test_predictor_error_closes_review_lease(self):
        self.predictor.fail_on_propagation = True
        with self.assertRaisesRegex(RuntimeError, "Fake propagation failure"):
            self.preview()
        self.assertEqual(self.store._sam2_reviews, {})

    def test_batch_save_requires_all_masks_and_protects_reviewed_frames(self):
        self.store.save(0, {"masks": self.masks})
        result = self.preview()
        self.assertTrue(result["items"][0]["reviewed"])
        token = result["review_token"]

        with self.assertRaisesRegex(ValueError, "already reviewed"):
            self.store.save_batch([result["items"][0]], review_token=token)
        with self.assertRaisesRegex(ValueError, "at or before the keyframe"):
            self.store.save_batch(
                [result["items"][0]],
                overwrite_reviewed=True,
                keyframe_index=1,
                review_token=token,
            )
        with self.assertRaisesRegex(ValueError, "missing mask muscle"):
            self.store.save_batch(
                [{"index": 2, "masks": {"fat": self.masks["fat"]}}],
                review_token=token,
            )
        self.assertEqual(len(self.store.state["reviewed"]), 1)
        saved = self.store.save_batch(result["items"][1:], review_token=token)
        self.assertEqual(saved["saved_indices"], [1, 2])
        for index in (1, 2):
            for folder_name in self.masks:
                mask_path = self.store._dataset_paths(self.store.item(index))[
                    "masks"
                ][folder_name]
                with Image.open(mask_path) as mask:
                    expected = self.store._decode_mask(
                        result["items"][index]["masks"][folder_name], SIZE
                    )
                    self.assertEqual(mask.tobytes(), expected.tobytes())
        self.assertEqual(list(self.dataset.rglob("*.tmp")), [])


if __name__ == "__main__":
    unittest.main()
