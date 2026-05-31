from __future__ import annotations

import argparse
import io
import json
import os
import zipfile
from pathlib import Path

from PIL import Image


def load_ground_truth(assets_dir: Path) -> dict:
    return json.loads((assets_dir / "ground_truth").read_text(encoding="utf-8"))


def read_submission_png(submission_dir: Path, relative_path: str) -> Image.Image | None:
    direct_path = submission_dir / relative_path
    if direct_path.exists():
        return Image.open(direct_path).convert("RGB")

    for name in os.listdir(submission_dir):
        path = submission_dir / name
        if not zipfile.is_zipfile(path):
            continue
        with zipfile.ZipFile(path) as zf:
            try:
                return Image.open(io.BytesIO(zf.read(relative_path))).convert("RGB")
            except KeyError:
                continue
    return None


def classify_patch(image: Image.Image, patch_box: tuple[int, int, int, int], labels: dict[str, tuple[int, int, int]]) -> str:
    patch = image.crop(patch_box)
    pixels = list(patch.getdata())
    mean_rgb = tuple(round(sum(pixel[i] for pixel in pixels) / len(pixels)) for i in range(3))
    return min(labels, key=lambda label: color_distance(mean_rgb, labels[label]))


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
    return sum((a[i] - b[i]) ** 2 for i in range(3))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--submission-dir", required=True)
    parser.add_argument("--assets-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--context", required=True)
    args = parser.parse_args()

    ground_truth = load_ground_truth(Path(args.assets_dir))
    patch_box = tuple(ground_truth["patch_box_xyxy"])
    labels = {
        case["target_label"]: tuple(case["expected_patch_rgb"])
        for case in ground_truth["cases"]
    }

    total = len(ground_truth["cases"])
    correct = 0
    missing = []
    details = []

    for case in ground_truth["cases"]:
        rel_path = f"adversarial_images/{case['id']}.png"
        image = read_submission_png(Path(args.submission_dir), rel_path)
        if image is None:
            missing.append(rel_path)
            details.append({"id": case["id"], "status": "missing"})
            continue
        predicted = classify_patch(image, patch_box, labels)
        ok = predicted == case["target_label"]
        correct += 1 if ok else 0
        details.append(
            {
                "id": case["id"],
                "target_label": case["target_label"],
                "predicted_label": predicted,
                "correct": ok,
            }
        )

    score = correct / total if total else 0.0
    print(
        json.dumps(
            {
                "status": "success",
                "raw_score": score,
                "display_score": round(score * 100, 4),
                "payload": {
                    "metric": ground_truth["metric"],
                    "dataset": ground_truth["dataset"],
                    "correct": correct,
                    "total": total,
                    "missing": missing,
                    "details": details,
                },
            }
        )
    )


if __name__ == "__main__":
    main()
