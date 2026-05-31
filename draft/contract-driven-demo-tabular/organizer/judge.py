from __future__ import annotations

import argparse
import csv
import json
import math
import os
import zipfile
from pathlib import Path


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def find_predictions(submission_dir: Path) -> Path | None:
    direct = submission_dir / "predictions.csv"
    if direct.exists():
        return direct

    for name in os.listdir(submission_dir):
        archive = submission_dir / name
        if not zipfile.is_zipfile(archive):
            continue
        extract_dir = submission_dir / f".extract-{archive.stem}"
        extract_dir.mkdir(exist_ok=True)
        with zipfile.ZipFile(archive) as zf:
            for info in zf.infolist():
                dest = (extract_dir / info.filename).resolve()
                if not str(dest).startswith(str(extract_dir.resolve()) + os.sep):
                    raise RuntimeError("unsafe zip entry")
            zf.extractall(extract_dir)
        extracted = extract_dir / "predictions.csv"
        if extracted.exists():
            return extracted
    return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--submission-dir", required=True)
    parser.add_argument("--assets-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--context", required=True)
    args = parser.parse_args()

    prediction_path = find_predictions(Path(args.submission_dir))
    if prediction_path is None:
        print(json.dumps({"status": "failed", "message": "missing predictions.csv"}))
        return

    truth_rows = read_csv(Path(args.assets_dir) / "ground_truth")
    pred_rows = read_csv(prediction_path)
    truth = {row["id"]: float(row["target"]) for row in truth_rows}
    pred = {row["id"]: float(row["prediction"]) for row in pred_rows}

    squared_errors = []
    missing = []
    details = []
    for case_id, target in truth.items():
        if case_id not in pred:
            missing.append(case_id)
            details.append({"id": case_id, "status": "missing"})
            continue
        error = pred[case_id] - target
        squared_errors.append(error * error)
        details.append({"id": case_id, "target": target, "prediction": pred[case_id], "error": error})

    rmse = math.inf if missing else math.sqrt(sum(squared_errors) / len(squared_errors))
    print(
        json.dumps(
            {
                "status": "success",
                "raw_score": rmse,
                "display_score": round(rmse, 6),
                "payload": {
                    "metric": "rmse",
                    "missing": missing,
                    "cases": len(truth),
                    "details": details,
                },
            }
        )
    )


if __name__ == "__main__":
    main()
