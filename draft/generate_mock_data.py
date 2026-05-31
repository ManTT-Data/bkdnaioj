import os
import zipfile
import shutil

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created: {path}")

def main():
    # 1. BTC Upload Files
    btc_dir = "draft/btc_upload"
    
    judge_py_content = """import argparse
import csv
import json

def read_map(path: str, key: str, value: str) -> dict[str, str]:
    out: dict[str, str] = {}
    with open(path, newline="") as f:
        r = csv.DictReader(f)
        for row in r:
            out[row[key]] = row[value]
    return out

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pred", required=True)
    ap.add_argument("--gt", required=True)
    args = ap.parse_args()

    gt = read_map(args.gt, "id", "y_true")
    pred = read_map(args.pred, "id", "y_pred")

    ids = sorted(gt.keys(), key=lambda s: int(s))
    correct = 0
    total = 0
    for i in ids:
        if i not in pred:
            continue
        total += 1
        if int(pred[i]) == int(gt[i]):
            correct += 1

    acc = correct / total if total else 0.0

    print(
        json.dumps(
            {
                "status": "success",
                "raw_score": acc,
                "display_score": round(acc, 5),
                "payload": {"correct": correct, "total": total},
                "message": "ok",
            }
        )
    )

if __name__ == "__main__":
    main()
"""
    
    ground_truth_csv_content = """id,y_true
1,0
2,1
3,0
4,1
5,1
6,0
"""
    
    inputs_csv_content = """id,x
1,0.1
2,0.9
3,0.2
4,0.8
5,0.55
6,0.45
"""
    
    create_file(os.path.join(btc_dir, "judge.py"), judge_py_content)
    create_file(os.path.join(btc_dir, "ground_truth.csv"), ground_truth_csv_content)
    create_file(os.path.join(btc_dir, "inputs.csv"), inputs_csv_content)
    
    # 2. Contestant Prediction Files (Public Phase)
    contestant_dir = "draft/contestant_submissions"
    
    # Perfect: 100% correct (6/6)
    perfect_csv = """id,y_pred
1,0
2,1
3,0
4,1
5,1
6,0
"""
    
    # Good: 83.33% correct (5/6)
    good_csv = """id,y_pred
1,0
2,1
3,0
4,1
5,1
6,1
"""
    
    # Average: 50% correct (3/6)
    average_csv = """id,y_pred
1,0
2,1
3,0
4,0
5,0
6,1
"""
    
    # Poor: 0% correct (0/6)
    poor_csv = """id,y_pred
1,1
2,0
3,1
4,0
5,0
6,1
"""
    
    create_file(os.path.join(contestant_dir, "perfect_predictions.csv"), perfect_csv)
    create_file(os.path.join(contestant_dir, "good_predictions.csv"), good_csv)
    create_file(os.path.join(contestant_dir, "average_predictions.csv"), average_csv)
    create_file(os.path.join(contestant_dir, "poor_predictions.csv"), poor_csv)
    
    # 3. Contestant Code Submission Files (Final Phase ZIPs)
    infer_py_content = """import argparse
import csv
import os

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True)
    ap.add_argument('--output', required=True)
    ap.add_argument('--model', required=True)
    args = ap.parse_args()

    os.makedirs(args.output, exist_ok=True)

    with open(args.model, 'r', encoding='utf-8') as f:
        threshold = float(f.read().strip())

    in_path = os.path.join(args.input, 'inputs.csv')
    out_path = os.path.join(args.output, 'predictions.csv')

    with open(in_path, newline='') as fin, open(out_path, 'w', newline='') as fout:
        r = csv.DictReader(fin)
        w = csv.DictWriter(fout, fieldnames=['id', 'y_pred'])
        w.writeheader()
        for row in r:
            x = float(row['x'])
            y_pred = 1 if x >= threshold else 0
            w.writerow({'id': row['id'], 'y_pred': y_pred})

if __name__ == '__main__':
    main()
"""
    
    # Perfect zip (threshold = 0.5)
    perfect_src_dir = os.path.join(contestant_dir, "perfect_src")
    create_file(os.path.join(perfect_src_dir, "infer.py"), infer_py_content)
    create_file(os.path.join(perfect_src_dir, "model.txt"), "0.5")
    
    perfect_zip_path = os.path.join(contestant_dir, "submission_perfect.zip")
    with zipfile.ZipFile(perfect_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(os.path.join(perfect_src_dir, "infer.py"), "infer.py")
        zipf.write(os.path.join(perfect_src_dir, "model.txt"), "model.txt")
    print(f"Created zip: {perfect_zip_path}")
    shutil.rmtree(perfect_src_dir)
    
    # Poor zip (threshold = 0.95 -> only classifies x=0.9 as 1, rest as 0)
    poor_src_dir = os.path.join(contestant_dir, "poor_src")
    create_file(os.path.join(poor_src_dir, "infer.py"), infer_py_content)
    create_file(os.path.join(poor_src_dir, "model.txt"), "0.95")
    
    poor_zip_path = os.path.join(contestant_dir, "submission_poor.zip")
    with zipfile.ZipFile(poor_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(os.path.join(poor_src_dir, "infer.py"), "infer.py")
        zipf.write(os.path.join(poor_src_dir, "model.txt"), "model.txt")
    print(f"Created zip: {poor_zip_path}")
    shutil.rmtree(poor_src_dir)
    
    print("\\nAll E2E test files generated successfully under draft/!")

if __name__ == "__main__":
    main()
