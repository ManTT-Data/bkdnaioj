from __future__ import annotations

import csv
import json
import shutil
import zipfile
from pathlib import Path


SOURCE_ZIP = Path("/Users/quangsang/Downloads/NLP/dataset.zip")
ROOT = Path(__file__).resolve().parent
ORGANIZER = ROOT / "organizer"
CONTESTANT = ROOT / "contestant"


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def read_zip_text(zf: zipfile.ZipFile, name: str) -> list[str]:
    return zf.read(name).decode("utf-8").splitlines()


def write_lines(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_submission_csv(path: Path, zh_lines: list[str], vi_lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["tieng_trung", "tieng_viet"])
        writer.writeheader()
        for zh, vi in zip(zh_lines, vi_lines):
            writer.writerow({"tieng_trung": zh, "tieng_viet": vi})


def zip_dir(source_dir: Path, output_zip: Path) -> None:
    if output_zip.exists():
        output_zip.unlink()
    with zipfile.ZipFile(output_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(source_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(source_dir).as_posix())


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build() -> None:
    if not SOURCE_ZIP.exists():
        raise RuntimeError(f"missing source dataset: {SOURCE_ZIP}")

    reset_dir(CONTESTANT)
    ORGANIZER.mkdir(parents=True, exist_ok=True)
    for child in ("training", "public", "private", "official_unlabeled"):
        reset_dir(ORGANIZER / child)

    with zipfile.ZipFile(SOURCE_ZIP) as zf:
        train_zh = read_zip_text(zf, "dataset/train/train.zh")
        train_vi = read_zip_text(zf, "dataset/train/train.vi")
        official_public_zh = read_zip_text(zf, "dataset/public_test/public_test.zh")
        official_private_zh = read_zip_text(zf, "dataset/private_test/private_test.zh")

    if len(train_zh) != len(train_vi):
        raise RuntimeError(f"train.zh/train.vi line count mismatch: {len(train_zh)} != {len(train_vi)}")

    # Use real parallel sentences from train as a runnable public/private demo,
    # because the downloaded dataset does not include public/private references.
    train_cut = max(0, len(train_zh) - 240)
    train_sample_zh = train_zh[:train_cut]
    train_sample_vi = train_vi[:train_cut]
    public_zh = train_zh[train_cut : train_cut + 120]
    public_vi = train_vi[train_cut : train_cut + 120]
    private_zh = train_zh[train_cut + 120 : train_cut + 240]
    private_vi = train_vi[train_cut + 120 : train_cut + 240]

    write_lines(ORGANIZER / "training" / "train.zh", train_sample_zh)
    write_lines(ORGANIZER / "training" / "train.vi", train_sample_vi)
    zip_dir(ORGANIZER / "training", ORGANIZER / "training.zip")

    write_lines(ORGANIZER / "public" / "inputs.zh", public_zh)
    write_lines(ORGANIZER / "public" / "ground_truth.vi", public_vi)
    write_lines(ORGANIZER / "private" / "inputs.zh", private_zh)
    write_lines(ORGANIZER / "private" / "ground_truth.vi", private_vi)

    write_lines(ORGANIZER / "official_unlabeled" / "public_test.zh", official_public_zh)
    write_lines(ORGANIZER / "official_unlabeled" / "private_test.zh", official_private_zh)

    write_submission_csv(CONTESTANT / "non_final_public" / "submission.csv", public_zh, public_vi)
    write_submission_csv(CONTESTANT / "non_final_private" / "submission.csv", private_zh, private_vi)

    memory = {zh: vi for zh, vi in zip(public_zh + private_zh, public_vi + private_vi)}
    final_dir = CONTESTANT / "final"
    final_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / "templates" / "infer.py", final_dir / "infer.py")
    write_json(
        final_dir / "translation_memory.json",
        {
            "model_type": "exact_match_translation_memory",
            "source": "real train.zh/train.vi heldout pairs from dataset.zip",
            "translations": memory,
            "fallback": "",
        },
    )
    zip_dir(final_dir, CONTESTANT / "final_submission.zip")

    write_json(
        ROOT / "dataset_summary.json",
        {
            "source_zip": str(SOURCE_ZIP),
            "train_pairs_total": len(train_zh),
            "train_pairs_in_training_asset": len(train_sample_zh),
            "public_eval_pairs": len(public_zh),
            "private_eval_pairs": len(private_zh),
            "official_public_unlabeled_lines": len(official_public_zh),
            "official_private_unlabeled_lines": len(official_private_zh),
            "note": "Downloaded dataset.zip does not include public/private reference translations, so runnable ground_truth assets are created from heldout real train pairs.",
        },
    )


if __name__ == "__main__":
    build()
