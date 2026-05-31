from __future__ import annotations

import argparse
import csv
import json
import math
import os
import zipfile
from collections import Counter
from pathlib import Path


def read_references(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").splitlines()


def find_submission_csv(submission_dir: Path) -> Path | None:
    for name in ("submission.csv", "public_submission.csv", "predictions.csv"):
        direct = submission_dir / name
        if direct.exists():
            return direct

    csv_files = sorted(submission_dir.glob("*.csv"))
    if csv_files:
        return csv_files[0]

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
        for extracted_name in ("submission.csv", "public_submission.csv", "predictions.csv"):
            extracted = extract_dir / extracted_name
            if extracted.exists():
                return extracted
        csv_files = sorted(extract_dir.glob("*.csv"))
        if csv_files:
            return csv_files[0]
    return None


def read_hypotheses(path: Path) -> tuple[list[str], list[str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        if "tieng_viet" not in (reader.fieldnames or []):
            raise RuntimeError("submission CSV must contain column tieng_viet")
        zh = []
        vi = []
        for row in reader:
            zh.append(row.get("tieng_trung", ""))
            vi.append(row.get("tieng_viet", ""))
        return zh, vi


def corpus_bleu_fallback(hypotheses: list[str], references: list[str]) -> float:
    max_order = 4
    matches_by_order = [0] * max_order
    possible_matches_by_order = [0] * max_order
    hyp_len = 0
    ref_len = 0

    for hyp, ref in zip(hypotheses, references):
        hyp_tokens = hyp.split()
        ref_tokens = ref.split()
        hyp_len += len(hyp_tokens)
        ref_len += len(ref_tokens)
        for order in range(1, max_order + 1):
            hyp_ngrams = Counter(tuple(hyp_tokens[i : i + order]) for i in range(len(hyp_tokens) - order + 1))
            ref_ngrams = Counter(tuple(ref_tokens[i : i + order]) for i in range(len(ref_tokens) - order + 1))
            overlap = hyp_ngrams & ref_ngrams
            matches_by_order[order - 1] += sum(overlap.values())
            possible_matches_by_order[order - 1] += max(len(hyp_tokens) - order + 1, 0)

    if hyp_len == 0:
        return 0.0

    precisions = []
    smooth = 1.0
    for i in range(max_order):
        if possible_matches_by_order[i] == 0:
            precisions.append(0.0)
        elif matches_by_order[i] > 0:
            precisions.append(matches_by_order[i] / possible_matches_by_order[i])
        else:
            smooth *= 2
            precisions.append(1.0 / (smooth * possible_matches_by_order[i]))

    geo_mean = math.exp(sum(math.log(p) for p in precisions) / max_order) if min(precisions) > 0 else 0.0
    bp = 1.0 if hyp_len > ref_len else math.exp(1 - ref_len / hyp_len)
    return 100.0 * geo_mean * bp


def score_bleu(hypotheses: list[str], references: list[str]) -> tuple[float, str]:
    try:
        import sacrebleu

        bleu = sacrebleu.corpus_bleu(hypotheses, [references], tokenize="none")
        return float(bleu.score), "sacrebleu.corpus_bleu(tokenize=none)"
    except Exception:
        return corpus_bleu_fallback(hypotheses, references), "fallback_whitespace_corpus_bleu"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--submission-dir", required=True)
    parser.add_argument("--assets-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--context", required=True)
    args = parser.parse_args()

    submission_path = find_submission_csv(Path(args.submission_dir))
    if submission_path is None:
        print(json.dumps({"status": "failed", "message": "missing submission CSV"}))
        return

    references = read_references(Path(args.assets_dir) / "ground_truth")
    source_lines = (Path(args.assets_dir) / "inputs").read_text(encoding="utf-8").splitlines()
    submitted_source, hypotheses = read_hypotheses(submission_path)

    if len(hypotheses) != len(references):
        print(json.dumps({"status": "failed", "message": f"line count mismatch: got {len(hypotheses)} translations, expected {len(references)}"}, ensure_ascii=False))
        return

    source_mismatches = [
        i
        for i, (expected, submitted) in enumerate(zip(source_lines, submitted_source), start=1)
        if submitted and submitted != expected
    ]
    bleu, scorer = score_bleu(hypotheses, references)
    print(
        json.dumps(
            {
                "status": "success",
                "raw_score": bleu,
                "display_score": round(bleu, 4),
                "payload": {
                    "metric": "sacrebleu",
                    "scorer": scorer,
                    "num_sentences": len(references),
                    "source_mismatch_count": len(source_mismatches),
                    "first_source_mismatch_lines": source_mismatches[:10],
                },
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
