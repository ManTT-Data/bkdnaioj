# OLPAI — Nghiệp vụ hệ thống & yêu cầu UI/UX (Spec)

Tài liệu này mô tả **nghiệp vụ hệ thống** và **yêu cầu UI/UX** cho OLPAI Online Judge theo mô hình: **Contest → 4 phases (sub-contests) → Tasks → Submissions → Judging → Standings + Clarifications**, với các workflow **Admin / Jury / Contestant**.

> Mục tiêu: UI **đơn giản, rõ ràng, OJ-like**, hỗ trợ **end-to-end** từ admin setup contest cho tới contestant submit và xem kết quả.

---

## 1) Vai trò (Roles)

### 1.1 Contestant
- Duyệt contest.
- Tạo entry (official/virtual/practice) theo policy.
- Vào một phase, chọn task để submit.
- Theo dõi submissions và kết quả chấm.
- Xem standings theo phase.
- Tạo clarifications và xem câu trả lời/public clarifications.

### 1.2 Jury
- Trả lời clarifications.
- Moderate clarifications (publish/close).
- (Tuỳ hệ thống) có thể freeze/unfreeze phase, rejudge, approve/disqualify entry nếu được phân quyền.

### 1.3 Admin
- Tạo/sửa contest.
- Tạo tasks trong contest.
- Thiết lập evaluation sets (public/private) và upload assets bắt buộc.
- Đảm bảo mỗi task có đúng **4 phases** mapped vào 4 phase chuẩn.
- Publish contest khi đã đủ điều kiện (gated).
- Quản trị entry (approve/disqualify) nếu contest require approval.

---

## 2) Thực thể (Domain model)

### 2.1 Contest
Thuộc tính chính:
- `slug`, `title`, `description`, `banner_url`
- `status`: `draft | registration_open | running | ended | archived`
- `visibility`: `public | private`
- `entry_policy`: `individual | team | both`
- thời gian: `registration_start/end`, `start_time/end_time`
- `require_approval`, `max_team_size`

### 2.2 Contest Phase Definitions (Phase defs) — **ẩn khỏi UX**
- Hệ thống có 4 keys chuẩn (invariant):
  - `public_test`
  - `private_test`
  - `final_public`
  - `final_private`
- Phase defs là “dictionary” cấp contest để:
  - UI route theo `phaseKey`.
  - Map phases của từng task vào đúng phase.

**Yêu cầu UX:** Không có bước “Initialize / Missing phase defs”. Phase defs phải luôn tồn tại (auto-seed ở backend).

### 2.3 Task
- Thuộc contest.
- Có `title`, `slug`, `description`, `problem_statement_url`.
- Có cấu hình `score_label`, `higher_is_better`.

### 2.4 Evaluation set
- Mỗi task có đúng 2 evaluation sets:
  - `public` và `private`
- Mỗi evaluation set có assets upload qua presigned flow.

### 2.5 Evaluation set assets
- Asset bắt buộc để contest có thể judge được:
  - `judge.py`
  - `ground_truth.csv`

### 2.6 Phase (per Task)
- Mỗi task có đúng 4 phases (records thật), mỗi phase:
  - trỏ tới `contest_phase_def_id`
  - trỏ tới `evaluation_set_id`
  - có `open_time`, `close_time`
  - flags: `is_final`, `is_frozen`, `display_scores`
  - `leaderboard_mode`: `best | latest`

**Quy ước mapping:**
- `public_test` → eval set `public`, `is_final=false`
- `private_test` → eval set `private`, `is_final=false`
- `final_public` → eval set `public`, `is_final=true`
- `final_private` → eval set `private`, `is_final=true`

### 2.7 Entry
- Đại diện cho “đơn vị tham gia” của user/team trong contest.
- `entry_mode`: `official | virtual | practice`
- `status`: `pending | approved | disqualified`

### 2.8 Submission
- Thuộc về `(contest_entry, task, phase)`.
- Upload theo presigned flow:
  - initiate → PUT S3 → complete.
- `status`: `uploaded | validating | queued | running | done | failed`
- `display_score/raw_score`, `error_message`.

### 2.9 Judging pipeline (worker)
- Worker lấy job từ queue.
- Download submission artifact + evaluation assets.
- Chạy judge, ghi kết quả vào DB, cập nhật leaderboard.

**Artifact requirements theo phase:**
- Non-final: `predictions.csv`
- Final: `.zip` chứa `infer.py` + `model.txt` (script tạo predictions), sau đó judge chấm.

### 2.10 Standings/Leaderboards
- Contest-phase leaderboard (theo phase def):
  - bảng xếp hạng cho toàn contest trong 1 phase.

### 2.11 Clarifications
- Contestant hỏi theo contest (có thể gắn task/phase).
- Jury/Admin trả lời.
- Có `is_public`, `status`.

---

## 3) Contract API (tóm tắt cho frontend)

### 3.1 Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### 3.2 Contest (public)
- `GET /api/v1/contests`
- `GET /api/v1/contests/:id`
- `GET /api/v1/contests/:id/tasks`
- `GET /api/v1/contests/:id/phase-defs` (always returns 4)

### 3.3 Contest admin
- `POST /api/v1/contests` (admin)
- `PATCH /api/v1/contests/:id` (admin)
- `DELETE /api/v1/contests/:id` (admin)
- `POST /api/v1/contests/:id/publish` (admin)
- `POST /api/v1/contests/:id/archive` (admin)

### 3.4 Entries
- `GET /api/v1/contests/:id/entries` (auth)
- `POST /api/v1/contests/:id/entries` (auth)

### 3.5 Phases
- `GET /api/v1/tasks/:taskId/phases`

### 3.6 Submissions (presigned)
- `POST /api/v1/entries/:entry_id/submissions:initiate`
- `PUT put_url`
- `POST /api/v1/submissions/:id/complete`
- `GET /api/v1/entries/:id/submissions?task_id&phase_id`

### 3.7 Leaderboards
- `GET /api/v1/contests/:contest_id/phase-defs/:def_id/leaderboard`

### 3.8 Clarifications
- `GET /api/v1/contests/:id/clarifications`
- `POST /api/v1/contests/:id/clarifications?entry_id=...`
- `POST /api/v1/clarifications/:id/answer` (jury/admin)
- `PATCH /api/v1/clarifications/:id` (jury/admin)

---

## 4) Information Architecture (IA) & Routes

### 4.1 Public/Contestant
- `/` Home (landing + contest preview)
- `/contests` contest list
- `/contests/:contestId` phase chooser (4 cards)
- `/contests/:contestId/phases/:phaseKey` phase hub (tabs)
  - Overview
  - Problems (tasks table)
  - Submit (task → submit)
  - Submissions
  - Standings
  - Clarifications
- `/contests/:contestId/phases/:phaseKey/tasks/:taskId/submit`

### 4.2 Admin
- `/admin/contests` list + create
- `/admin/contests/new` create form
- `/admin/contests/:contestId` edit form
- (next) `/admin/contests/:contestId/setup` tasks + eval assets + publish gating

**UX rule:** Từ bất kỳ trang nào, admin phải có đường đi đến “Manage contest”.
- Trên `/contests`: mỗi row có `Enter` + `Manage` (admin-only)
- Trên `/contests/:id/...`: header có button `Edit` (admin-only)

---

## 5) UI/UX Principles

### 5.1 Tinh thần OJ
- Table-first, border-first, ít hiệu ứng.
- Thông tin ưu tiên theo thứ tự: **phase → task → action (submit) → result (score/status)**.
- Điều hướng rõ ràng, không “ẩn” hành động quan trọng.

### 5.2 Visual
- Light theme default.
- Typography rõ (h1/h2 rõ ràng), spacing nhất quán.
- Tránh layout “marketing” rườm rà; giữ mọi thứ như dashboard OJ.

### 5.3 Copywriting
- Không dùng câu mơ hồ: “Ready / Missing” nếu user không hiểu.
- Hiển thị “đúng điều user cần làm tiếp theo”, ví dụ:
  - Publish gating: nêu rõ task nào thiếu asset nào.
  - Submission requirements: nêu rõ file cần nộp theo phase.

### 5.4 Guard/Permissions
- Admin/jury routes phải guard rõ.
- Nếu không đủ quyền: redirect hoặc show 403.

---

## 6) Admin UX Requirements (chi tiết)

### 6.1 Contest CRUD
- Create contest: slug create-only, validate dễ hiểu.
- Edit contest: update title/description/times/visibility/policy.
- Publish: chỉ enabled khi “judgeable” (được mô tả ở 6.3).

### 6.2 Task setup
- Khi admin add task:
  1) auto create 2 eval sets (public/private)
  2) auto create 4 phases mapped vào phase defs

**Không có** nút rời rạc “create eval sets” và “create phases”.

### 6.3 Publish gating (must)
Chỉ cho publish khi:
- Mỗi task có đủ 2 eval sets.
- Mỗi eval set có đủ assets bắt buộc:
  - `judge.py`
  - `ground_truth.csv`

UI cần:
- Một bảng checklist theo task:
  - Public eval set: judge ✓/✗, ground_truth ✓/✗
  - Private eval set: judge ✓/✗, ground_truth ✓/✗
- Action “Upload” ngay tại chỗ thiếu.

---

## 7) Contestant UX Requirements (chi tiết)

### 7.1 Phase-first navigation
- Contestant chọn contest → chọn phase → thấy tasks.
- Submit luôn “phase-locked”: phaseKey nằm trong URL.

### 7.2 Submissions
- Hiển thị list submissions cho entry/task/phase.
- Polling cho tới terminal state.
- Status mapping rõ ràng (queued/running/done/failed).

### 7.3 Standings
- Standings theo phase, hiển thị rank/score/name.
- Nếu frozen: hiển thị frozen indicator.

### 7.4 Clarifications
- List clarifications (public + own private).
- Create clarification: require entry.
- Hiển thị answer + trạng thái.

---

## 8) Deliverables (UI checklist)

Minimum để gọi là “đủ dùng end-to-end”:
- Home + contest list + phase hub.
- Entry create + submit presigned flow.
- Submissions list + polling.
- Admin contest CRUD.
- Admin contest setup: tasks + eval assets upload + publish gating.
- Standings + clarifications.

---

## 9) Notes kỹ thuật (Tailwind v4)
- Phải dùng `@config "../tailwind.config.js";` trong `src/index.css` để custom tokens như `bg-background`, `border-border` hoạt động.
