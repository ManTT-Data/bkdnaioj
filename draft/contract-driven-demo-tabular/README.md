# Contract-Driven Tabular Regression Demo

Demo này là task thứ hai để test contract-driven judging với format khác ảnh. Bài toán dùng dữ liệu bảng CSV và metric RMSE.

## 1. Tạo Task

Copy nội dung:

```text
organizer/task_submission_schema.json
```

vào field `submission_schema`, hoặc dùng payload đầy đủ:

```text
organizer/create_task_payload.json
```

Task này có `higher_is_better = false` vì score là RMSE.

## 2. Upload Assets Của BTC

Task-level asset:

```text
organizer/judge.py                  asset_key: judge.py
```

Public evaluation set:

```text
organizer/public/inputs.csv         asset_key: inputs
organizer/public/ground_truth.csv   asset_key: ground_truth
```

Private evaluation set:

```text
organizer/private/inputs.csv        asset_key: inputs
organizer/private/ground_truth.csv  asset_key: ground_truth
```

## 3. Thí Sinh Nộp Non-Final

Public:

```text
contestant/non_final/predictions.csv
```

Private:

```text
contestant/non_final_private/predictions.csv
```

File có schema:

```csv
id,prediction
pub_001,3.5
```

## 4. Thí Sinh Nộp Final

Upload:

```text
contestant/final_submission.zip
```

ZIP chứa:

```text
infer.py
model.json
```

Worker chạy `infer.py` với `--assets-dir` chứa `inputs`, sinh `predictions.csv` trong `generated/`, rồi gọi `judge.py`.

## 5. Kết Quả Kỳ Vọng

Các sample đều dùng đúng model tuyến tính:

```text
y = 3.0 + 1.5 * x1 - 2.0 * x2
```

Vì vậy:

```text
public non-final  -> RMSE 0.0
public final      -> RMSE 0.0
private non-final -> RMSE 0.0
private final     -> RMSE 0.0
```

## 6. Tạo Lại Data

```bash
python draft/contract-driven-demo-tabular/generate_demo_data.py
```
