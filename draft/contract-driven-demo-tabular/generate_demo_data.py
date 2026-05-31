from __future__ import annotations

import csv
import json
import shutil
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ORGANIZER = ROOT / "organizer"
CONTESTANT = ROOT / "contestant"


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def target(x1: float, x2: float) -> float:
    return 3.0 + 1.5 * x1 - 2.0 * x2


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def zip_dir(source_dir: Path, output_zip: Path) -> None:
    if output_zip.exists():
        output_zip.unlink()
    with zipfile.ZipFile(output_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(source_dir.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(source_dir).as_posix())


def build_split(split: str, rows: list[dict[str, float]]) -> None:
    split_dir = ORGANIZER / split
    reset_dir(split_dir)
    inputs = []
    ground_truth = []
    predictions = []
    for row in rows:
        y = target(row["x1"], row["x2"])
        inputs.append({"id": row["id"], "x1": row["x1"], "x2": row["x2"]})
        ground_truth.append({"id": row["id"], "target": round(y, 6)})
        predictions.append({"id": row["id"], "prediction": round(y, 6)})

    write_csv(split_dir / "inputs.csv", inputs, ["id", "x1", "x2"])
    write_csv(split_dir / "ground_truth.csv", ground_truth, ["id", "target"])

    sub_dir = CONTESTANT / ("non_final" if split == "public" else "non_final_private")
    reset_dir(sub_dir)
    write_csv(sub_dir / "predictions.csv", predictions, ["id", "prediction"])


def build_final_submission() -> None:
    final_dir = CONTESTANT / "final"
    reset_dir(final_dir)
    shutil.copyfile(ROOT / "templates" / "infer.py", final_dir / "infer.py")
    write_json(
        final_dir / "model.json",
        {
            "model_type": "linear_regression",
            "intercept": 3.0,
            "coefficients": {
                "x1": 1.5,
                "x2": -2.0,
            },
        },
    )
    zip_dir(final_dir, CONTESTANT / "final_submission.zip")


def main() -> None:
    reset_dir(CONTESTANT)
    ORGANIZER.mkdir(parents=True, exist_ok=True)
    (ROOT / "templates").mkdir(parents=True, exist_ok=True)
    public_rows = [
        {"id": "pub_001", "x1": 1.0, "x2": 0.5},
        {"id": "pub_002", "x1": -2.0, "x2": 1.25},
        {"id": "pub_003", "x1": 0.0, "x2": -3.0},
        {"id": "pub_004", "x1": 4.5, "x2": 2.0},
    ]
    private_rows = [
        {"id": "priv_101", "x1": 2.0, "x2": -1.0},
        {"id": "priv_102", "x1": -1.5, "x2": -2.5},
        {"id": "priv_103", "x1": 3.25, "x2": 0.75},
        {"id": "priv_104", "x1": 5.0, "x2": 1.5},
    ]
    build_split("public", public_rows)
    build_split("private", private_rows)
    build_final_submission()


if __name__ == "__main__":
    main()
