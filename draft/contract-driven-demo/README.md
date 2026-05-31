# Contract-Driven Judging Demo

Demo này dùng để test luồng nộp/chấm không hardcode `predictions.csv`.

Bài toán mẫu là targeted adversarial patch trên ảnh PNG 64x64. BTC cung cấp ảnh input thật trong `inputs.zip`, nhãn mục tiêu trong `ground_truth.json`, và một `judge.py` dùng chung cho public/private, normal/final. Submission của thí sinh cũng là ZIP chứa PNG thật hoặc code/checkpoint sinh PNG.

## 1. Tạo task

Khi BTC tạo task, copy nội dung trong:

```text
organizer/task_submission_schema.json
```

vào field `submission_schema`.

Hoặc dùng payload đầy đủ:

```text
organizer/create_task_payload.json
```

Schema này mô tả:

- Non-final phases nhận output artifact đã sinh sẵn.
- Final phases nhận checkpoint/code inference.
- Task cần BTC upload asset key `judge.py` một lần.
- Mỗi evaluation set public/private cần BTC upload asset key `ground_truth` và `inputs`.

## 2. Upload assets của BTC

Ở cấp task, upload:

```text
organizer/judge.py                 asset_key: judge.py
```

Với public evaluation set, upload:

```text
organizer/public/ground_truth.json asset_key: ground_truth
organizer/public/inputs.zip        asset_key: inputs
```

Với private evaluation set, upload:

```text
organizer/private/ground_truth.json asset_key: ground_truth
organizer/private/inputs.zip        asset_key: inputs
```

`inputs.zip` chứa:

```text
images/<case_id>.png
metadata.json
```

`ground_truth.json` chứa target label và patch RGB kỳ vọng cho từng case. Asset key trên hệ thống vẫn là `inputs` và `ground_truth`; worker sẽ alias file upload về đúng key này trong `work/assets/`.

`inputs` là data input để final inference chạy. `ground_truth` là đáp án/nhãn ẩn để `judge.py` chấm. `judge.py` đọc artifact từ `--submission-dir`, đọc ground truth từ `--assets-dir`, và trả JSON score ra stdout.

## 3. Thí sinh nộp non-final

Upload file:

```text
contestant/non_final_submission.zip
```

Cho private test, upload file tương ứng:

```text
contestant/non_final_private_submission.zip
```

File này chứa output đã sinh sẵn:

```text
adversarial_images/
  pub_001.png
  pub_002.png
  pub_003.png
  pub_004.png
manifest.json
```

Ở non-final, thí sinh đã tự chạy model/inference bên ngoài hệ thống để tạo output artifact này.

Worker sẽ không cần biết đây là ảnh hay CSV. Judge tự mở ZIP và chấm.

## 4. Thí sinh nộp final

Upload file:

```text
contestant/final_submission.zip
```

File này chứa checkpoint/code inference:

```text
infer.py
checkpoint.json
config.json
```

Worker extract ZIP, chạy `infer.py` với `--assets-dir` chứa asset `inputs`, sinh output trong `generated/`, rồi gọi `judge.py` để chấm output đó bằng asset `ground_truth`.

## 5. Kết quả kỳ vọng

Với public set:

- non-final sample đạt `display_score = 100`
- final sample đạt `display_score = 100`

Với private set:

- `non_final_private_submission.zip` đạt `display_score = 100`
- `final_submission.zip` cũng đạt `display_score = 100` vì `infer.py` đọc `inputs` của evaluation set hiện tại.

## 6. Tạo lại data

Nếu cần regenerate toàn bộ ảnh, ground truth và ZIP submission:

```bash
python draft/contract-driven-demo/generate_demo_data.py
```
