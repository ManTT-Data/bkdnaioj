# Hướng dẫn Kiểm thử Toàn trình (End-to-End Testing Guide)

Hướng dẫn này giúp bạn kiểm thử chức năng **Cài đặt cuộc thi của BTC**, **Nộp bài của Thí sinh (Submissions)** và **Bảng xếp hạng (Scoreboard/Leaderboard)** sử dụng các dữ liệu mẫu đã tạo trong thư mục `draft/`.

---

## 👥 Danh sách Tài khoản Kiểm thử (Mật khẩu mặc định: `password`)

| Vai trò | Email đăng nhập | Tên hiển thị | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Admin (BTC)** | `admin@local.com` | Administrator | Quản lý cuộc thi, đề bài, evaluation sets |
| **Jury (Giám khảo)** | `jury@local.com` | Jury Member | Đóng băng/mở băng bảng xếp hạng, chấm bài |
| **Thí sinh 1** | `dev@local.com` | Alice (Developer) | Đã đăng ký đội "Code Masters" |
| **Thí sinh 2** | `bob@local.com` | Bob | Đã đăng ký đội "Code Masters" |
| **Thí sinh 3** | `charlie@local.com` | Charlie | Đăng ký cá nhân |
| **Thí sinh 4** | `david@local.com` | David | Đăng ký cá nhân |

---

## 🛠️ Bước 1: BTC Cấu hình Đề bài & Bộ Chấm (Evaluation Set)
1. Đăng nhập vào trang web bằng tài khoản Admin: `admin@local.com` / `password`.
2. Trên màn hình chính, nhấn vào cuộc thi **BKDN AI Challenge 2026** (hoặc tạo mới một cuộc thi nháp).
3. Nhấn vào nút **Admin Setup Panel** ở góc trên cùng bên phải.
4. Chọn tab **Manage Tasks** để xem danh sách bài toán (hoặc tạo mới một Task).
5. Click **Configure Evaluation Set** (hoặc Edit Task -> Evaluation Sets):
   * Tải lên file Python chấm điểm: Chọn `draft/btc_upload/judge.py` làm **Judge Script**.
   * Tải lên file đáp án đúng: Chọn `draft/btc_upload/ground_truth.csv` làm **Ground Truth**.
   * Tải lên file dữ liệu đầu vào: Chọn `draft/btc_upload/inputs.csv` làm **Public/Private Inputs**.
6. Lưu lại cấu hình bộ chấm.

---

## 🚀 Bước 2: Thí sinh Nộp bài (Public Phase Submission)
Để kiểm tra tính cập nhật của Bảng xếp hạng (Scoreboard), hãy đăng nhập bằng các tài khoản thí sinh khác nhau và nộp các file dự báo khác nhau:

### 1. Thí sinh 1 (`dev@local.com` / `password`): Nộp bài Hoàn hảo (100% Correct)
1. Đăng nhập tài khoản `dev@local.com`.
2. Truy cập cuộc thi **BKDN AI Challenge 2026** -> **Enter Phase** của phân đoạn mong muốn (ví dụ: `Public Test`).
3. Chọn tab **Tasks & Submit**.
4. Kéo hoặc chọn file: `draft/contestant_submissions/perfect_predictions.csv`.
5. Nhấn **Submit**.
6. Sang tab **Submissions** chờ trạng thái chuyển từ `queued`/`running` sang `done`.
7. Đánh dấu run vừa hoàn thành làm bài nộp chính thức bằng cách click **Set as Final**. (Điểm hiển thị: `1.00000`).

### 2. Thí sinh 3 (`charlie@local.com` / `password`): Nộp bài Tốt (83.33% Correct)
1. Thực hiện các bước tương tự như trên.
2. Nộp file: `draft/contestant_submissions/good_predictions.csv`.
3. Đặt làm bài nộp chính thức (Final). (Điểm hiển thị: `0.83333`).

### 3. Thí sinh 4 (`david@local.com` / `password`): Nộp bài Trung bình (50% Correct)
1. Thực hiện các bước tương tự.
2. Nộp file: `draft/contestant_submissions/average_predictions.csv`.
3. Đặt làm bài nộp chính thức (Final). (Điểm hiển thị: `0.50000`).

---

## 📊 Bước 3: Kiểm tra Bảng xếp hạng (Scoreboard)
1. Chuyển sang tab **Standings** trên trang chi tiết phân đoạn.
2. Đảm bảo Bảng xếp hạng (Leaderboard) được hiển thị đúng thứ tự:
   * **Hạng 1**: `dev@local.com` (Đội Code Masters) - Điểm: `1.00000`
   * **Hạng 2**: `charlie@local.com` - Điểm: `0.83333`
   * **Hạng 3**: `david@local.com` - Điểm: `0.50000`
3. Nếu bảng xếp hạng chưa cập nhật lập tức, bạn có thể đăng nhập bằng tài khoản Admin/Jury, vào tab **Standings** và click nút **Recompute Task Board** để buộc hệ thống tính toán lại bảng xếp hạng.

---

## 📦 Bước 4: Kiểm thử Nộp Code/Script (Final Phase)
Đối với các phân đoạn chạy code trực tiếp trên hệ thống (nộp file ZIP):
1. Đăng nhập tài khoản thí sinh bất kỳ.
2. Tải lên file `draft/contestant_submissions/submission_perfect.zip`.
3. Hệ thống sẽ tự động tải bộ dữ liệu đầu vào (file `inputs.csv` mà BTC đã upload ở Bước 1) vào một thư mục tạm thời trên hệ thống chấm (gọi là `inputs_dir`), sau đó giải nén file ZIP của thí sinh và chạy câu lệnh:
   ```bash
   python infer.py --input <inputs_dir> --output <output_dir> --model <path_to_model.txt>
   ```
   File `infer.py` của thí sinh sẽ đọc file `inputs.csv` từ `<inputs_dir>`, thực hiện dự báo rồi lưu kết quả dự báo ra file `predictions.csv` ở `<output_dir>`. Sau đó hệ thống sẽ dùng `judge.py` để so khớp file dự báo đó với `ground_truth.csv` của BTC để chấm điểm.
4. Chờ trạng thái hoàn tất và đối chiếu điểm số trên bảng xếp hạng (bài perfect sẽ đạt điểm `1.00000`, bài poor đạt điểm thấp hơn).
