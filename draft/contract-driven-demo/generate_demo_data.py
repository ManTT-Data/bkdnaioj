from __future__ import annotations

import csv
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
ORGANIZER = ROOT / "organizer"
CONTESTANT = ROOT / "contestant"
LABELS = {
    "red": (220, 38, 38),
    "green": (22, 163, 74),
    "blue": (37, 99, 235),
    "yellow": (234, 179, 8),
}
PATCH_BOX = (48, 48, 64, 64)


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def make_clean_image(path: Path, base_rgb: tuple[int, int, int], label: str) -> None:
    img = Image.new("RGB", (64, 64), (245, 245, 245))
    draw = ImageDraw.Draw(img)
    draw.rectangle((6, 6, 58, 58), fill=base_rgb)
    draw.rectangle((12, 12, 52, 52), outline=(255, 255, 255), width=3)
    draw.text((18, 24), label[:1].upper(), fill=(255, 255, 255))
    img.save(path)


def make_adversarial_image(clean_path: Path, out_path: Path, target_label: str) -> None:
    img = Image.open(clean_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw.rectangle(PATCH_BOX, fill=LABELS[target_label])
    img.save(out_path)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def zip_dir(source_dir: Path, output_zip: Path) -> None:
    if output_zip.exists():
        output_zip.unlink()
    with zipfile.ZipFile(output_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(source_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(source_dir).as_posix())


def build_split(split: str, cases: list[dict[str, str]]) -> None:
    split_dir = ORGANIZER / split
    reset_dir(split_dir)
    clean_dir = split_dir / "inputs_src" / "images"
    clean_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    gt_cases = []
    non_final_dir = CONTESTANT / ("non_final" if split == "public" else "non_final_private")
    reset_dir(non_final_dir)
    adv_dir = non_final_dir / "adversarial_images"
    adv_dir.mkdir(parents=True, exist_ok=True)

    for case in cases:
        clean_path = clean_dir / f"{case['id']}.png"
        adv_path = adv_dir / f"{case['id']}.png"
        make_clean_image(clean_path, LABELS[case["source_label"]], case["source_label"])
        make_adversarial_image(clean_path, adv_path, case["target_label"])
        rows.append(case)
        gt_cases.append(
            {
                "id": case["id"],
                "target_label": case["target_label"],
                "expected_patch_rgb": LABELS[case["target_label"]],
                "expected_sha256": sha256(adv_path),
            }
        )

    metadata = {
        "dataset": split,
        "image_size": [64, 64],
        "patch_box_xyxy": list(PATCH_BOX),
        "cases": rows,
    }
    write_json(split_dir / "inputs_src" / "metadata.json", metadata)
    zip_dir(split_dir / "inputs_src", split_dir / "inputs.zip")
    shutil.rmtree(split_dir / "inputs_src")

    write_json(
        split_dir / "ground_truth.json",
        {
            "dataset": split,
            "metric": "targeted_attack_success_rate",
            "labels": sorted(LABELS),
            "patch_box_xyxy": list(PATCH_BOX),
            "cases": gt_cases,
        },
    )

    write_json(
        non_final_dir / "manifest.json",
        {
            "submission_type": "precomputed_adversarial_images",
            "dataset": split,
            "image_format": "png",
            "cases": [case["id"] for case in cases],
        },
    )
    zip_name = "non_final_submission.zip" if split == "public" else "non_final_private_submission.zip"
    zip_dir(non_final_dir, CONTESTANT / zip_name)

    with (split_dir / "cases.csv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["id", "source_label", "target_label"])
        writer.writeheader()
        writer.writerows(rows)


def build_final_submission() -> None:
    final_dir = CONTESTANT / "final"
    reset_dir(final_dir)
    shutil.copyfile(ROOT / "templates" / "infer.py", final_dir / "infer.py")
    write_json(
        final_dir / "checkpoint.json",
        {
            "model_name": "patch-color-targeter-v1",
            "label_to_patch_rgb": LABELS,
            "patch_box_xyxy": list(PATCH_BOX),
        },
    )
    write_json(
        final_dir / "config.json",
        {
            "input_asset_key": "inputs",
            "output_dir_name": "adversarial_images",
        },
    )
    zip_dir(final_dir, CONTESTANT / "final_submission.zip")


def main() -> None:
    public_cases = [
        {"id": "pub_001", "source_label": "red", "target_label": "blue"},
        {"id": "pub_002", "source_label": "green", "target_label": "yellow"},
        {"id": "pub_003", "source_label": "blue", "target_label": "red"},
        {"id": "pub_004", "source_label": "yellow", "target_label": "green"},
    ]
    private_cases = [
        {"id": "priv_101", "source_label": "red", "target_label": "green"},
        {"id": "priv_102", "source_label": "green", "target_label": "blue"},
        {"id": "priv_103", "source_label": "blue", "target_label": "yellow"},
        {"id": "priv_104", "source_label": "yellow", "target_label": "red"},
    ]

    build_split("public", public_cases)
    build_split("private", private_cases)
    build_final_submission()


if __name__ == "__main__":
    main()
