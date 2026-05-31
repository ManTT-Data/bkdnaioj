from __future__ import annotations

import argparse
import json
import os
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_inputs_zip(assets_dir: Path) -> tuple[dict, dict[str, Image.Image]]:
    inputs_path = assets_dir / "inputs"
    with zipfile.ZipFile(inputs_path) as zf:
        metadata = json.loads(zf.read("metadata.json").decode("utf-8"))
        images = {}
        for case in metadata["cases"]:
            with zf.open(f"images/{case['id']}.png") as fh:
                images[case["id"]] = Image.open(fh).convert("RGB").copy()
    return metadata, images


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--submission-dir", required=True)
    parser.add_argument("--assets-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--context", required=True)
    args = parser.parse_args()

    submission_dir = Path(args.submission_dir)
    output_dir = Path(args.output_dir)
    checkpoint = load_json(submission_dir / "checkpoint.json")
    config = load_json(submission_dir / "config.json")
    metadata, images = load_inputs_zip(Path(args.assets_dir))

    out_images = output_dir / config.get("output_dir_name", "adversarial_images")
    out_images.mkdir(parents=True, exist_ok=True)
    patch_box = tuple(checkpoint["patch_box_xyxy"])
    label_to_rgb = {k: tuple(v) for k, v in checkpoint["label_to_patch_rgb"].items()}

    generated = []
    for case in metadata["cases"]:
        image = images[case["id"]]
        target_label = case["target_label"]
        ImageDraw.Draw(image).rectangle(patch_box, fill=label_to_rgb[target_label])
        image.save(out_images / f"{case['id']}.png")
        generated.append({"id": case["id"], "target_label": target_label})

    (output_dir / "manifest.json").write_text(
        json.dumps(
            {
                "submission_type": "generated_adversarial_images",
                "dataset": metadata["dataset"],
                "generated": generated,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
