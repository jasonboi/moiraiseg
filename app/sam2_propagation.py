from __future__ import annotations

import tempfile
import threading
from contextlib import nullcontext
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import numpy as np
import torch
from PIL import Image


PredictorFactory = Callable[[str, str, str], object]


@dataclass(frozen=True)
class PropagationFrame:
    index: int
    source_path: Path
    reviewed: bool


@dataclass(frozen=True)
class PropagationResult:
    index: int
    reviewed: bool
    masks: dict[str, Image.Image]

    @property
    def mask(self) -> Image.Image:
        if len(self.masks) != 1:
            raise ValueError("A single mask is only available for one category")
        return next(iter(self.masks.values()))


@dataclass(frozen=True)
class PropagationWindow:
    clip: str
    keyframe_position: int
    frames: list[PropagationFrame]


class Sam2PropagationService:
    def __init__(
        self,
        checkpoint: Path,
        model_config: str,
        device: str = "auto",
        predictor_factory: PredictorFactory | None = None,
    ) -> None:
        self.checkpoint = checkpoint.resolve()
        if not self.checkpoint.is_file():
            raise FileNotFoundError(self.checkpoint)
        self.model_config = model_config
        self.device = (
            "cuda" if device == "auto" and torch.cuda.is_available() else device
        )
        if self.device == "auto":
            self.device = "cpu"
        self.predictor_factory = predictor_factory
        self.predictor = None
        self.lock = threading.Lock()

    def _get_predictor(self):
        if self.predictor is not None:
            return self.predictor
        if self.predictor_factory is not None:
            self.predictor = self.predictor_factory(
                self.model_config,
                str(self.checkpoint),
                self.device,
            )
        else:
            from sam2.build_sam import build_sam2_video_predictor

            if self.device == "cuda":
                torch.backends.cuda.matmul.allow_tf32 = True
                torch.backends.cudnn.allow_tf32 = True
            self.predictor = build_sam2_video_predictor(
                self.model_config,
                str(self.checkpoint),
                device=self.device,
                hydra_overrides_extra=[
                    "++model.non_overlap_masks=false",
                    "++model.add_all_frames_to_correct_as_cond=true",
                ],
            )
        return self.predictor

    @staticmethod
    def _prepare_video(frames: list[PropagationFrame], output: Path) -> tuple[int, int]:
        expected_size: tuple[int, int] | None = None
        output.mkdir(parents=True, exist_ok=True)
        for position, frame in enumerate(frames):
            with Image.open(frame.source_path) as image:
                if expected_size is None:
                    expected_size = image.size
                elif image.size != expected_size:
                    raise ValueError("All propagation frames must have the same size")
                image.convert("RGB").save(
                    output / f"{position:05d}.jpg",
                    format="JPEG",
                    quality=95,
                )
        if expected_size is None:
            raise ValueError("Propagation requires at least one frame")
        return expected_size

    def propagate(
        self,
        frames: list[PropagationFrame],
        keyframe_position: int,
        keyframe_mask: Image.Image | None = None,
        *,
        keyframe_masks: dict[str, Image.Image] | None = None,
    ) -> list[PropagationResult]:
        if not 0 <= keyframe_position < len(frames):
            raise ValueError("Keyframe position is outside the propagation window")
        if keyframe_mask is not None:
            if keyframe_masks is not None:
                raise ValueError("Provide either keyframe_mask or keyframe_masks")
            keyframe_masks = {"mask": keyframe_mask}
        if not isinstance(keyframe_masks, dict) or not keyframe_masks:
            raise ValueError("SAM2 propagation requires keyframe masks")
        binary_keyframes = {
            folder_name: mask.convert("L").point(
                lambda value: 255 if value >= 128 else 0,
                mode="L",
            )
            for folder_name, mask in keyframe_masks.items()
        }
        seeded_masks = {
            folder_name: mask
            for folder_name, mask in binary_keyframes.items()
            if mask.getbbox() is not None
        }
        if not seeded_masks:
            raise ValueError("SAM2 keyframe masks are empty")
        object_categories = {
            object_id: folder_name
            for object_id, folder_name in enumerate(seeded_masks, start=1)
        }

        with self.lock, tempfile.TemporaryDirectory(prefix="reviewer_sam2_") as temporary:
            video_root = Path(temporary) / "frames"
            expected_size = self._prepare_video(frames, video_root)
            for folder_name, mask in binary_keyframes.items():
                if mask.size != expected_size:
                    raise ValueError(
                        f"Keyframe mask {folder_name} size {mask.size} does not match "
                        f"source {expected_size}"
                    )

            predictor = self._get_predictor()
            inference_context = torch.inference_mode()
            autocast_context = (
                torch.autocast("cuda", dtype=torch.bfloat16)
                if self.device == "cuda"
                else nullcontext()
            )
            state = None
            predictions: dict[int, dict[str, Image.Image]] = {}
            try:
                with inference_context, autocast_context:
                    state = predictor.init_state(
                        str(video_root),
                        offload_video_to_cpu=True,
                        offload_state_to_cpu=False,
                    )
                    for object_id, folder_name in object_categories.items():
                        predictor.add_new_mask(
                            inference_state=state,
                            frame_idx=keyframe_position,
                            obj_id=object_id,
                            mask=np.asarray(
                                seeded_masks[folder_name], dtype=np.uint8
                            ) > 0,
                        )
                    directions = (False, True) if keyframe_position > 0 else (False,)
                    for reverse in directions:
                        for position, object_ids, logits in predictor.propagate_in_video(
                            state,
                            start_frame_idx=keyframe_position,
                            reverse=reverse,
                        ):
                            if (
                                not isinstance(position, (int, np.integer))
                                or not 0 <= position < len(frames)
                            ):
                                raise RuntimeError(
                                    "SAM2 returned an invalid frame index"
                                )
                            if (
                                len(object_ids) != len(object_categories)
                                or set(object_ids) != set(object_categories)
                            ):
                                raise RuntimeError(
                                    "SAM2 returned incomplete object predictions "
                                    f"for frame {position}"
                                )
                            masks = logits.detach().float().cpu().numpy()
                            expected_shape = (
                                len(object_ids),
                                1,
                                expected_size[1],
                                expected_size[0],
                            )
                            if masks.shape != expected_shape:
                                raise RuntimeError(
                                    f"SAM2 returned mask shape {masks.shape}, "
                                    f"expected {expected_shape}"
                                )
                            predictions[int(position)] = {
                                object_categories[object_id]: Image.fromarray(
                                    (masks[offset, 0] > 0.0).astype(np.uint8) * 255,
                                    mode="L",
                                )
                                for offset, object_id in enumerate(object_ids)
                            }
            finally:
                if state is not None and hasattr(predictor, "reset_state"):
                    predictor.reset_state(state)
            predictions[keyframe_position] = {
                folder_name: mask.copy()
                for folder_name, mask in seeded_masks.items()
            }

        if len(predictions) != len(frames):
            raise RuntimeError(
                f"SAM2 returned {len(predictions)} frames, expected {len(frames)}"
            )
        return [
            PropagationResult(
                index=frame.index,
                reviewed=frame.reviewed,
                masks=predictions[position],
            )
            for position, frame in enumerate(frames)
        ]
