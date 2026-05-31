# Contract-Driven Chinese-Vietnamese Translation Demo

Demo này được tạo từ dataset thật trong:

```text
/Users/quangsang/Downloads/NLP/dataset.zip
```

Task: dịch tiếng Trung giản thể sang tiếng Việt, score bằng SacreBLEU.

## 1. Phân Tích Dataset Gốc

`dataset.zip` có:

```text
dataset/train/train.zh
dataset/train/train.vi
dataset/public_test/public_test.zh
dataset/private_test/private_test.zh
```

Tập download hiện tại không có reference `.vi` cho `public_test` và `private_test`, nên không thể tạo `ground_truth` thật cho hai test set chính thức đó từ dữ liệu đang có. Để có bộ chạy end-to-end trong hệ thống, generator lấy các cặp câu thật từ cuối `train.zh/train.vi` làm public/private evaluation demo.

Generator cũng giữ lại test official không nhãn trong:

```text
organizer/official_unlabeled/public_test.zh
organizer/official_unlabeled/private_test.zh
```

Các file này chỉ để tham khảo, chưa dùng làm `ground_truth` vì thiếu bản dịch tham chiếu.

## 2. Tạo Task

Copy nội dung:

```text
organizer/task_submission_schema.json
```

vào field `submission_schema`, hoặc dùng payload đầy đủ:

```text
organizer/create_task_payload.json
```

## 3. Upload Assets Của BTC

Task-level asset:

```text
organizer/judge.py                  asset_key: judge.py
```

Training data cho thí sinh tải về:

```text
organizer/training.zip
```

Public evaluation set:

```text
organizer/public/inputs.zh          asset_key: inputs
organizer/public/ground_truth.vi    asset_key: ground_truth
```

Private evaluation set:

```text
organizer/private/inputs.zh         asset_key: inputs
organizer/private/ground_truth.vi   asset_key: ground_truth
```

## 4. Thí Sinh Nộp Non-Final

Public:

```text
contestant/non_final_public/submission.csv
```

Private:

```text
contestant/non_final_private/submission.csv
```

CSV bắt buộc có header:

```csv
tieng_trung,tieng_viet
我 会 给 您 拿 一些 。,Tôi sẽ mang cho bạn một ít .
```

## 5. Thí Sinh Nộp Final

Upload:

```text
contestant/final_submission.zip
```

ZIP chứa:

```text
infer.py
translation_memory.json
```

Worker chạy `infer.py` với `--assets-dir` chứa `inputs`, sinh `submission.csv` trong `generated/`, rồi gọi `judge.py`.

## 6. Kết Quả Kỳ Vọng

Sample submissions dùng exact translation memory từ các cặp heldout thật, nên dùng để test pipeline:

```text
public non-final  -> SacreBLEU ~100
public final      -> SacreBLEU ~100
private non-final -> SacreBLEU ~100
private final     -> SacreBLEU ~100
```

Trong contest thật, `final_submission.zip` sẽ chứa code/checkpoint/tokenizer thí sinh tự huấn luyện, không phải translation memory của organizer.

## 7. Tạo Lại Data

```bash
python draft/contract-driven-demo-zhvi/generate_demo_data.py
```
