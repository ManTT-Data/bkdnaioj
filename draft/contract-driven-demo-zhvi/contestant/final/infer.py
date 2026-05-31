from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


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

    memory = json.loads((submission_dir / "translation_memory.json").read_text(encoding="utf-8"))
    translations = memory.get("translations", {})
    fallback = memory.get("fallback", "")
    zh_lines = (assets_dir / "inputs").read_text(encoding="utf-8").splitlines()

    with (output_dir / "submission.csv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["tieng_trung", "tieng_viet"])
        writer.writeheader()
        for zh in zh_lines:
            writer.writerow({"tieng_trung": zh, "tieng_viet": translations.get(zh, fallback)})


if __name__ == "__main__":
    main()
