from __future__ import annotations

import argparse
import json
import os
import runpy
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run MoiraiSeg from config.json")
    parser.add_argument("--config", type=Path, required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config_path = args.config.resolve()
    tool_root = config_path.parent
    config = json.loads(config_path.read_text(encoding="utf-8-sig"))
    raw_data_dir = Path(config["raw_data_dir"]).resolve()
    output_dir = Path(config["output_dir"]).resolve()
    internal_root = output_dir / ".moiraiseg"
    sam2_repo = tool_root / "sam2"
    checkpoint = sam2_repo / "checkpoints" / "sam2.1_hiera_tiny.pt"
    server_path = tool_root / "app" / "server.py"

    # A new zero-category project intentionally has no candidate Mask directory.
    required = [
        raw_data_dir,
        internal_root / "prepared",
        internal_root / "annotation_index.json",
        internal_root / "project.json",
        checkpoint,
        server_path,
        sam2_repo / "sam2" / "__init__.py",
    ]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise FileNotFoundError(f"MoiraiSeg is missing required paths: {missing}")

    sys.path.insert(0, str(server_path.parent))
    sys.path.insert(0, str(sam2_repo))
    sys.argv = [
        str(server_path),
        "--host",
        "127.0.0.1",
        "--port",
        str(int(config.get("port", 8767))),
        "--dataset-root",
        str(output_dir),
        "--prepared-root",
        str(internal_root / "prepared"),
        "--candidate-root",
        str(internal_root / "candidate_labels"),
        "--sam2-checkpoint",
        str(checkpoint),
        "--sam2-model-config",
        "configs/sam2.1/sam2.1_hiera_t.yaml",
        "--sam2-device",
        str(config.get("sam2_device", "auto")),
        "--sam2-before",
        str(int(config.get("sam2_before_frames", 4))),
        "--sam2-after",
        str(int(config.get("sam2_after_frames", 16))),
        "--instance-id",
        os.environ.get("MOIRAISEG_INSTANCE_ID", ""),
        "--shutdown-token",
        os.environ.get("MOIRAISEG_SHUTDOWN_TOKEN", ""),
    ]
    runpy.run_path(str(server_path), run_name="__main__")


if __name__ == "__main__":
    main()
