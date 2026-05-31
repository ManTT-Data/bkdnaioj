from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


def read_inputs(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--submission-dir", required=True)
    parser.add_argument("--assets-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--context", required=True)
    args = parser.parse_args()

    submission_dir = Path(args.submission_dir)
    assets_dir = Path(args.assets_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    model = json.loads((submission_dir / "model.json").read_text(encoding="utf-8"))
    rows = read_inputs(assets_dir / "inputs")
    coefficients = model["coefficients"]

    with (output_dir / "predictions.csv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["id", "prediction"])
        writer.writeheader()
        for row in rows:
            prediction = model["intercept"]
            prediction += coefficients["x1"] * float(row["x1"])
            prediction += coefficients["x2"] * float(row["x2"])
            writer.writerow({"id": row["id"], "prediction": round(prediction, 6)})


if __name__ == "__main__":
    main()
