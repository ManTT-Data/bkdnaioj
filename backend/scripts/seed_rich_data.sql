-- Rich dev seed: full user base, multiple contests, tasks, entries, submissions, leaderboards, announcements, clarifications, and tickets.
-- Assumes migrations already applied.

TRUNCATE TABLE
  contest_phase_leaderboard_entries,
  task_phase_leaderboard_entries,
  clarifications,
  tickets,
  announcements,
  evaluation_jobs,
  submission_files,
  submissions,
  contest_entry_members,
  contest_entries,
  phases,
  evaluation_set_assets,
  task_evaluation_sets,
  tasks,
  contest_phase_defs,
  contests,
  team_members,
  teams,
  users
CASCADE;

-- 1. USERS
-- Standard password hash for "password" is: $2a$10$6y1QM9ZlnTcbwV3uM8CWzeshpECuI.ZJ3Plh2VIx5uOdkWnLihM1K
INSERT INTO users (id, email, password_hash, full_name, role, student_id, avatar_url)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@local.com', '$2a$10$6y1QM9ZlnTcbwV3uM8CWzeshpECuI.ZJ3Plh2VIx5uOdkWnLihM1K', 'Dev Admin', 'admin', 'AD-001', 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'jury@local.com', '$2a$10$6y1QM9ZlnTcbwV3uM8CWzeshpECuI.ZJ3Plh2VIx5uOdkWnLihM1K', 'Dev Jury', 'jury', 'JR-002', 'https://api.dicebear.com/7.x/adventurer/svg?seed=jury'),
  ('11111111-1111-1111-1111-111111111111', 'dev@local.com', '$2a$10$6y1QM9ZlnTcbwV3uM8CWzeshpECuI.ZJ3Plh2VIx5uOdkWnLihM1K', 'Alice (Contestant)', 'contestant', 'SV-101', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alice'),
  ('22222222-2222-2222-2222-222222222222', 'bob@local.com', '$2a$10$6y1QM9ZlnTcbwV3uM8CWzeshpECuI.ZJ3Plh2VIx5uOdkWnLihM1K', 'Bob (Contestant)', 'contestant', 'SV-102', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bob'),
  ('33333333-3333-3333-3333-333333333333', 'charlie@local.com', '$2a$10$6y1QM9ZlnTcbwV3uM8CWzeshpECuI.ZJ3Plh2VIx5uOdkWnLihM1K', 'Charlie (Contestant)', 'contestant', 'SV-103', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Charlie'),
  ('44444444-4444-4444-4444-444444444444', 'david@local.com', '$2a$10$6y1QM9ZlnTcbwV3uM8CWzeshpECuI.ZJ3Plh2VIx5uOdkWnLihM1K', 'David (Contestant)', 'contestant', 'SV-104', 'https://api.dicebear.com/7.x/adventurer/svg?seed=David'),
  ('55555555-5555-5555-5555-555555555555', 'eva@local.com', '$2a$10$6y1QM9ZlnTcbwV3uM8CWzeshpECuI.ZJ3Plh2VIx5uOdkWnLihM1K', 'Eva (Contestant)', 'contestant', 'SV-105', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Eva');

-- 2. TEAMS
INSERT INTO teams (id, slug, name, owner_id)
VALUES
  ('20000000-2000-2000-2000-200000000000', 'code-masters', 'Code Masters', '11111111-1111-1111-1111-111111111111'),
  ('30000000-3000-3000-3000-300000000000', 'ai-innovators', 'AI Innovators', '33333333-3333-3333-3333-333333333333');

-- Team memberships
INSERT INTO team_members (team_id, user_id, role)
VALUES
  ('20000000-2000-2000-2000-200000000000', '11111111-1111-1111-1111-111111111111', 'manager'),
  ('20000000-2000-2000-2000-200000000000', '22222222-2222-2222-2222-222222222222', 'member'),
  ('30000000-3000-3000-3000-300000000000', '33333333-3333-3333-3333-333333333333', 'manager'),
  ('30000000-3000-3000-3000-300000000000', '44444444-4444-4444-4444-444444444444', 'member');

-- 3. CONTESTS
INSERT INTO contests (id, slug, title, description, banner_url, status, entry_policy, registration_start, registration_end, start_time, end_time, visibility, rules_json, created_by, max_team_size, require_approval)
VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    'bkdn-ai-challenge-2026',
    'BKDN AI Challenge 2026',
    'Chào mừng bạn đến với BKDN AI Challenge 2026 - Cuộc thi phát triển giải pháp trí tuệ nhân tạo lớn nhất khu vực miền Trung. Hãy thể hiện tài năng lập trình và xây dựng các mô hình Machine Learning đột phá để giải quyết các bài toán thực tế.',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=800',
    'running',
    'both',
    now() - interval '5 days',
    now() + interval '5 days',
    now() - interval '2 days',
    now() + interval '10 days',
    'public',
    '{}'::jsonb,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    3,
    false
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'summer-hackathon-2026',
    'Summer Hackathon 2026',
    'Cuộc thi Hackathon kéo dài 48h liên tục dành cho các đội nhóm xây dựng các sản phẩm AI thực tiễn ứng dụng trong giáo dục và y tế.',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
    'registration_open',
    'team',
    now() - interval '1 day',
    now() + interval '3 days',
    now() + interval '4 days',
    now() + interval '6 days',
    'public',
    '{}'::jsonb,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    4,
    true
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'intro-ml-2026',
    'Introduction to Machine Learning 2026',
    'Cuộc thi kiểm tra kiến thức cơ bản về Machine Learning, hồi quy tuyến tính, phân loại và các thuật toán clustering cơ bản.',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
    'ended',
    'individual',
    now() - interval '10 days',
    now() - interval '8 days',
    now() - interval '7 days',
    now() - interval '5 days',
    'public',
    '{}'::jsonb,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    1,
    false
  );

-- 4. CONTEST PHASE DEFS
INSERT INTO contest_phase_defs (id, contest_id, key, title, sort_order)
VALUES
  ('c1de0001-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'public_test', 'Sơ loại - Public Test', 1),
  ('c1de0002-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'private_test', 'Sơ loại - Private Test', 2),
  ('c1de0003-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'final_public', 'Chung kết - Public Test', 3),
  ('c1de0004-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'final_private', 'Chung kết - Private Test', 4),

  ('c2de0001-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'public_test', 'Sơ loại - Public Test', 1),
  ('c2de0002-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'private_test', 'Sơ loại - Private Test', 2),
  ('c2de0003-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'final_public', 'Chung kết - Public Test', 3),
  ('c2de0004-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 'final_private', 'Chung kết - Private Test', 4),

  ('c3de0001-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'public_test', 'Sơ loại - Public Test', 1),
  ('c3de0002-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'private_test', 'Sơ loại - Private Test', 2),
  ('c3de0003-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'final_public', 'Chung kết - Public Test', 3),
  ('c3de0004-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 'final_private', 'Chung kết - Private Test', 4);

-- 5. TASKS (For Contest 1: BKDN AI Challenge 2026)
INSERT INTO tasks (id, contest_id, slug, title, description, submission_schema, score_label, higher_is_better, sort_order)
VALUES
  (
    'da5b0001-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'house-price-prediction',
    'House Price Prediction',
    'Bài toán dự đoán giá nhà dựa trên các thông tin như diện tích, số phòng ngủ, vị trí địa lý,... Bạn hãy xây dựng mô hình Regression tối ưu để dự đoán giá nhà chính xác nhất.',
    '{"required":["predictions.csv"]}'::jsonb,
    'RMSE',
    false,
    1
  ),
  (
    'da5b0002-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111',
    'digit-classification-mnist',
    'Digit Classification (MNIST)',
    'Bài toán phân loại ảnh chữ số viết tay từ bộ dữ liệu MNIST nổi tiếng. Hãy xây dựng mô hình Convolutional Neural Network (CNN) hoặc mô hình khác để đạt độ chính xác cao nhất.',
    '{"required":["submission.json"]}'::jsonb,
    'Accuracy',
    true,
    2
  );

-- 6. TASK EVALUATION SETS
INSERT INTO task_evaluation_sets (id, task_id, key, title, description)
VALUES
  ('e1a00001-1111-1111-1111-111111111111', 'da5b0001-1111-1111-1111-111111111111', 'public', 'Public Evaluation Set', 'Dữ liệu chấm thử công khai'),
  ('e1a00001-2222-2222-2222-222222222222', 'da5b0001-1111-1111-1111-111111111111', 'private', 'Private Evaluation Set', 'Dữ liệu chấm điểm chính thức ẩn'),
  ('e1a00002-1111-1111-1111-111111111111', 'da5b0002-2222-2222-2222-222222222222', 'public', 'Public Evaluation Set', 'Dữ liệu chấm thử công khai'),
  ('e1a00002-2222-2222-2222-222222222222', 'da5b0002-2222-2222-2222-222222222222', 'private', 'Private Evaluation Set', 'Dữ liệu chấm điểm chính thức ẩn');

-- 7. CONCRETE PHASES
-- Task 1: House Price
INSERT INTO phases (id, task_id, contest_phase_def_id, evaluation_set_id, slug, title, description, open_time, close_time, judge_key, submission_limit, leaderboard_mode, allow_official_submit, allow_virtual_submit, allow_practice_submit, display_scores, is_frozen, is_final, sort_order)
VALUES
  (
    'f0a5e001-1111-1111-1111-111111111111',
    'da5b0001-1111-1111-1111-111111111111',
    'c1de0001-1111-1111-1111-111111111111',
    'e1a00001-1111-1111-1111-111111111111',
    'public-test',
    'Sơ loại - Public Test',
    'Vòng sơ loại chấm điểm công khai dựa trên tập dữ liệu public.',
    now() - interval '2 days',
    now() + interval '3 days',
    'house_price_evaluator',
    50,
    'best',
    true,
    true,
    true,
    true,
    false,
    false,
    1
  ),
  (
    'f0a5e001-2222-2222-2222-222222222222',
    'da5b0001-1111-1111-1111-111111111111',
    'c1de0002-2222-2222-2222-222222222222',
    'e1a00001-2222-2222-2222-222222222222',
    'private-test',
    'Sơ loại - Private Test',
    'Vòng sơ loại chấm điểm ẩn dựa trên tập dữ liệu private.',
    now() - interval '2 days',
    now() + interval '3 days',
    'house_price_evaluator',
    10,
    'best',
    true,
    true,
    true,
    true,
    false,
    false,
    2
  ),
  (
    'f0a5e001-3333-3333-3333-333333333333',
    'da5b0001-1111-1111-1111-111111111111',
    'c1de0003-3333-3333-3333-333333333333',
    'e1a00001-1111-1111-1111-111111111111',
    'final-public',
    'Chung kết - Public Test',
    'Vòng chung kết chấm điểm công khai.',
    now() + interval '3 days',
    now() + interval '10 days',
    'house_price_evaluator',
    20,
    'best',
    true,
    true,
    true,
    true,
    false,
    true,
    3
  ),
  (
    'f0a5e001-4444-4444-4444-444444444444',
    'da5b0001-1111-1111-1111-111111111111',
    'c1de0004-4444-4444-4444-444444444444',
    'e1a00001-2222-2222-2222-222222222222',
    'final-private',
    'Chung kết - Private Test',
    'Vòng chung kết chấm điểm ẩn.',
    now() + interval '3 days',
    now() + interval '10 days',
    'house_price_evaluator',
    5,
    'best',
    true,
    true,
    true,
    true,
    false,
    true,
    4
  );

-- Task 2: MNIST
INSERT INTO phases (id, task_id, contest_phase_def_id, evaluation_set_id, slug, title, description, open_time, close_time, judge_key, submission_limit, leaderboard_mode, allow_official_submit, allow_virtual_submit, allow_practice_submit, display_scores, is_frozen, is_final, sort_order)
VALUES
  (
    'f0a5e002-1111-1111-1111-111111111111',
    'da5b0002-2222-2222-2222-222222222222',
    'c1de0001-1111-1111-1111-111111111111',
    'e1a00002-1111-1111-1111-111111111111',
    'public-test',
    'Sơ loại - Public Test',
    'Vòng sơ loại chấm điểm công khai dựa trên tập dữ liệu public.',
    now() - interval '2 days',
    now() + interval '3 days',
    'mnist_evaluator',
    50,
    'best',
    true,
    true,
    true,
    true,
    false,
    false,
    1
  ),
  (
    'f0a5e002-2222-2222-2222-222222222222',
    'da5b0002-2222-2222-2222-222222222222',
    'c1de0002-2222-2222-2222-222222222222',
    'e1a00002-2222-2222-2222-222222222222',
    'private-test',
    'Sơ loại - Private Test',
    'Vòng sơ loại chấm điểm ẩn dựa trên tập dữ liệu private.',
    now() - interval '2 days',
    now() + interval '3 days',
    'mnist_evaluator',
    10,
    'best',
    true,
    true,
    true,
    true,
    false,
    false,
    2
  ),
  (
    'f0a5e002-3333-3333-3333-333333333333',
    'da5b0002-2222-2222-2222-222222222222',
    'c1de0003-3333-3333-3333-333333333333',
    'e1a00002-1111-1111-1111-111111111111',
    'final-public',
    'Chung kết - Public Test',
    'Vòng chung kết chấm điểm công khai.',
    now() + interval '3 days',
    now() + interval '10 days',
    'mnist_evaluator',
    20,
    'best',
    true,
    true,
    true,
    true,
    false,
    true,
    3
  ),
  (
    'f0a5e002-4444-4444-4444-444444444444',
    'da5b0002-2222-2222-2222-222222222222',
    'c1de0004-4444-4444-4444-444444444444',
    'e1a00002-2222-2222-2222-222222222222',
    'final-private',
    'Chung kết - Private Test',
    'Vòng chung kết chấm điểm ẩn.',
    now() + interval '3 days',
    now() + interval '10 days',
    'mnist_evaluator',
    5,
    'best',
    true,
    true,
    true,
    true,
    false,
    true,
    4
  );

-- 8. CONTEST ENTRIES (REGISTRATIONS)
-- Contest 1: BKDN AI Challenge
INSERT INTO contest_entries (id, contest_id, entry_type, entry_mode, user_id, team_id, display_name, status, registered_by)
VALUES
  ('e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'team', 'official', NULL, '20000000-2000-2000-2000-200000000000', 'Code Masters', 'active', '11111111-1111-1111-1111-111111111111'),
  ('e2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'team', 'official', NULL, '30000000-3000-3000-3000-300000000000', 'AI Innovators', 'active', '33333333-3333-3333-3333-333333333333'),
  ('e3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'individual', 'official', '55555555-5555-5555-5555-555555555555', NULL, 'Eva', 'active', '55555555-5555-5555-5555-555555555555');

-- Members for Contest 1 Entries
INSERT INTO contest_entry_members (contest_entry_id, user_id, role)
VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'leader'),
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'member'),
  ('e2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'leader'),
  ('e2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'member'),
  ('e3333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'leader');

-- Contest 2: Summer Hackathon 2026 (Pending and Approved Teams)
INSERT INTO contest_entries (id, contest_id, entry_type, entry_mode, user_id, team_id, display_name, status, registered_by)
VALUES
  ('e2111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'team', 'official', NULL, '20000000-2000-2000-2000-200000000000', 'Code Masters', 'pending', '11111111-1111-1111-1111-111111111111'),
  ('e2222222-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'team', 'official', NULL, '30000000-3000-3000-3000-300000000000', 'AI Innovators', 'approved', '33333333-3333-3333-3333-333333333333');

INSERT INTO contest_entry_members (contest_entry_id, user_id, role)
VALUES
  ('e2111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'leader'),
  ('e2111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'member'),
  ('e2222222-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'leader'),
  ('e2222222-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'member');

-- Contest 3: Introduction to Machine Learning (Ended)
INSERT INTO contest_entries (id, contest_id, entry_type, entry_mode, user_id, team_id, display_name, status, registered_by)
VALUES
  ('e3111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'individual', 'official', '11111111-1111-1111-1111-111111111111', NULL, 'Alice', 'finished', '11111111-1111-1111-1111-111111111111'),
  ('e3222222-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'individual', 'official', '22222222-2222-2222-2222-222222222222', NULL, 'Bob', 'finished', '22222222-2222-2222-2222-222222222222');

INSERT INTO contest_entry_members (contest_entry_id, user_id, role)
VALUES
  ('e3111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'leader'),
  ('e3222222-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'leader');

-- 9. SUBMISSIONS & RUN HISTORY
-- Contest 1, Task 1 (House Price Prediction, Public Phase)
INSERT INTO submissions (id, contest_id, contest_entry_id, task_id, phase_id, submitted_by, status, file_count, total_size_bytes, raw_score, display_score, is_final, evaluated_at)
VALUES
  -- Code Masters (Alice): initial bad submission
  ('50b00001-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'da5b0001-1111-1111-1111-111111111111', 'f0a5e001-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'done', 1, 1024, 125000.5000000000, 125000.50000, false, now() - interval '1 day'),
  -- Code Masters (Bob): optimized model, selected as final
  ('50b00001-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'da5b0001-1111-1111-1111-111111111111', 'f0a5e001-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'done', 1, 2048, 98500.1200000000, 98500.12000, true, now() - interval '18 hours'),
  -- AI Innovators (Charlie)
  ('50b00001-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'da5b0001-1111-1111-1111-111111111111', 'f0a5e001-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'done', 1, 1024, 102300.4000000000, 102300.40000, true, now() - interval '20 hours'),
  -- Eva (Individual)
  ('50b00001-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 'da5b0001-1111-1111-1111-111111111111', 'f0a5e001-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'done', 1, 1024, 115200.8000000000, 115200.80000, true, now() - interval '5 hours');

-- Contest 1, Task 2 (MNIST Digit Classification, Public Phase)
INSERT INTO submissions (id, contest_id, contest_entry_id, task_id, phase_id, submitted_by, status, file_count, total_size_bytes, raw_score, display_score, is_final, evaluated_at, error_message)
VALUES
  -- Code Masters (Alice): initial accuracy
  ('50b00002-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'da5b0002-2222-2222-2222-222222222222', 'f0a5e002-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'done', 1, 512, 0.9420000000, 0.94200, false, now() - interval '22 hours', NULL),
  -- Code Masters (Bob): CNN model
  ('50b00002-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'da5b0002-2222-2222-2222-222222222222', 'f0a5e002-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'done', 1, 512, 0.9850000000, 0.98500, true, now() - interval '12 hours', NULL),
  -- AI Innovators (David)
  ('50b00002-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'da5b0002-2222-2222-2222-222222222222', 'f0a5e002-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'done', 1, 512, 0.9780000000, 0.97800, true, now() - interval '15 hours', NULL),
  -- Eva (Failed submission)
  ('50b00002-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 'da5b0002-2222-2222-2222-222222222222', 'f0a5e002-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'failed', 1, 512, NULL, NULL, false, now() - interval '6 hours', 'Traceback (most recent call last):\n  File "evaluate.py", line 14, in <module>\n    KeyError: ''predictions''');

-- Contest 1, Task 1 (Private Phase - Bob)
INSERT INTO submissions (id, contest_id, contest_entry_id, task_id, phase_id, submitted_by, status, file_count, total_size_bytes, raw_score, display_score, is_final, evaluated_at)
VALUES
  ('50b00001-f111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'da5b0001-1111-1111-1111-111111111111', 'f0a5e001-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'done', 1, 2048, 99200.4500000000, 99200.45000, true, now() - interval '2 hours');

-- submission files details
INSERT INTO submission_files (id, submission_id, original_filename, storage_path, file_size, content_type)
VALUES
  (gen_random_uuid(), '50b00001-1111-1111-1111-111111111111', 'predictions.csv', 's3://submissions/50b00001-1111/predictions.csv', 1024, 'text/csv'),
  (gen_random_uuid(), '50b00001-2222-2222-2222-222222222222', 'predictions.csv', 's3://submissions/50b00001-2222/predictions.csv', 2048, 'text/csv'),
  (gen_random_uuid(), '50b00001-3333-3333-3333-333333333333', 'predictions.csv', 's3://submissions/50b00001-3333/predictions.csv', 1024, 'text/csv'),
  (gen_random_uuid(), '50b00001-4444-4444-4444-444444444444', 'predictions.csv', 's3://submissions/50b00001-4444/predictions.csv', 1024, 'text/csv'),
  (gen_random_uuid(), '50b00002-1111-1111-1111-111111111111', 'submission.json', 's3://submissions/50b00002-1111/submission.json', 512, 'application/json'),
  (gen_random_uuid(), '50b00002-2222-2222-2222-222222222222', 'submission.json', 's3://submissions/50b00002-2222/submission.json', 512, 'application/json'),
  (gen_random_uuid(), '50b00002-3333-3333-3333-333333333333', 'submission.json', 's3://submissions/50b00002-3333/submission.json', 512, 'application/json'),
  (gen_random_uuid(), '50b00002-4444-4444-4444-444444444444', 'submission.json', 's3://submissions/50b00002-4444/submission.json', 512, 'application/json'),
  (gen_random_uuid(), '50b00001-f111-1111-1111-111111111111', 'predictions.csv', 's3://submissions/50b00001-f111/predictions.csv', 2048, 'text/csv');

-- evaluation jobs history
INSERT INTO evaluation_jobs (id, submission_id, job_type, status, priority, worker_id, attempt_count, max_attempts, started_at, completed_at, execution_time_ms)
VALUES
  (gen_random_uuid(), '50b00001-1111-1111-1111-111111111111', 'judge', 'done', 5, 'worker-1', 1, 3, now() - interval '23 hours 59 minutes', now() - interval '23 hours 58 minutes', 1450),
  (gen_random_uuid(), '50b00001-2222-2222-2222-222222222222', 'judge', 'done', 5, 'worker-2', 1, 3, now() - interval '17 hours 59 minutes', now() - interval '17 hours 58 minutes', 1230),
  (gen_random_uuid(), '50b00001-3333-3333-3333-333333333333', 'judge', 'done', 5, 'worker-1', 1, 3, now() - interval '19 hours 59 minutes', now() - interval '19 hours 58 minutes', 1110),
  (gen_random_uuid(), '50b00001-4444-4444-4444-444444444444', 'judge', 'done', 5, 'worker-3', 1, 3, now() - interval '4 hours 59 minutes', now() - interval '4 hours 58 minutes', 1320),
  (gen_random_uuid(), '50b00002-1111-1111-1111-111111111111', 'judge', 'done', 5, 'worker-1', 1, 3, now() - interval '21 hours 59 minutes', now() - interval '21 hours 58 minutes', 900),
  (gen_random_uuid(), '50b00002-2222-2222-2222-222222222222', 'judge', 'done', 5, 'worker-2', 1, 3, now() - interval '11 hours 59 minutes', now() - interval '11 hours 58 minutes', 1010),
  (gen_random_uuid(), '50b00002-3333-3333-3333-333333333333', 'judge', 'done', 5, 'worker-3', 1, 3, now() - interval '14 hours 59 minutes', now() - interval '14 hours 58 minutes', 980),
  (gen_random_uuid(), '50b00002-4444-4444-4444-444444444444', 'judge', 'failed', 5, 'worker-1', 1, 3, now() - interval '5 hours 59 minutes', now() - interval '5 hours 58 minutes', 560),
  (gen_random_uuid(), '50b00001-f111-1111-1111-111111111111', 'judge', 'done', 5, 'worker-2', 1, 3, now() - interval '1 hour 59 minutes', now() - interval '1 hour 58 minutes', 1510);

-- 10. LEADERBOARDS
-- Task-Phase Leaderboard (Task 1, Public Phase)
-- Score is RMSE (lower is better, higher_is_better = false)
INSERT INTO task_phase_leaderboard_entries (contest_id, task_id, phase_id, contest_entry_id, rank, score, chosen_submission_id, entries_count)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'da5b0001-1111-1111-1111-111111111111', 'f0a5e001-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 1, 98500.12000, '50b00001-2222-2222-2222-222222222222', 2),
  ('c1111111-1111-1111-1111-111111111111', 'da5b0001-1111-1111-1111-111111111111', 'f0a5e001-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 2, 102300.40000, '50b00001-3333-3333-3333-333333333333', 1),
  ('c1111111-1111-1111-1111-111111111111', 'da5b0001-1111-1111-1111-111111111111', 'f0a5e001-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 3, 115200.80000, '50b00001-4444-4444-4444-444444444444', 1);

-- Task-Phase Leaderboard (Task 2, Public Phase)
-- Score is Accuracy (higher is better, higher_is_better = true)
INSERT INTO task_phase_leaderboard_entries (contest_id, task_id, phase_id, contest_entry_id, rank, score, chosen_submission_id, entries_count)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'da5b0002-2222-2222-2222-222222222222', 'f0a5e002-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 1, 0.98500, '50b00002-2222-2222-2222-222222222222', 2),
  ('c1111111-1111-1111-1111-111111111111', 'da5b0002-2222-2222-2222-222222222222', 'f0a5e002-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 2, 0.97800, '50b00002-3333-3333-3333-333333333333', 1),
  ('c1111111-1111-1111-1111-111111111111', 'da5b0002-2222-2222-2222-222222222222', 'f0a5e002-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 3, 0.00000, NULL, 1);

-- Task-Phase Leaderboard (Task 1, Private Phase)
INSERT INTO task_phase_leaderboard_entries (contest_id, task_id, phase_id, contest_entry_id, rank, score, chosen_submission_id, entries_count)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'da5b0001-1111-1111-1111-111111111111', 'f0a5e001-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 1, 99200.45000, '50b00001-f111-1111-1111-111111111111', 1);

-- Contest-wide Phase Leaderboard (Public Test definition)
-- Aggregates/Rankings for the Public Test phase definition
INSERT INTO contest_phase_leaderboard_entries (contest_id, contest_phase_def_id, contest_entry_id, rank, score, entries_count)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'c1de0001-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 1, 100.00000, 2),
  ('c1111111-1111-1111-1111-111111111111', 'c1de0001-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 2, 95.00000, 1),
  ('c1111111-1111-1111-1111-111111111111', 'c1de0001-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 3, 50.00000, 1);

-- Contest-wide Phase Leaderboard (Private Test definition)
INSERT INTO contest_phase_leaderboard_entries (contest_id, contest_phase_def_id, contest_entry_id, rank, score, entries_count)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'c1de0002-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 1, 99.20045, 1);

-- 11. ANNOUNCEMENTS
INSERT INTO announcements (id, contest_id, task_id, title, content, is_pinned, is_public, created_by)
VALUES
  (
    'ad000001-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    NULL,
    'Chào mừng bạn đến với BKDN AI Challenge 2026!',
    'Ban tổ chức chào mừng tất cả các đội thi và cá nhân tham gia cuộc thi năm nay. Mọi thông tin cập nhật sẽ được thông báo trực tiếp tại bảng tin này. Hãy đọc kỹ quy chế và chuẩn bị tốt cho các vòng thi.',
    true,
    true,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  ),
  (
    'ad000001-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111',
    'da5b0001-1111-1111-1111-111111111111',
    'Cập nhật dữ liệu bài toán dự đoán giá nhà',
    'Bộ dữ liệu public test đã được làm sạch và loại bỏ các dòng bị khuyết thiếu cột diện tích. Vui lòng tải lại file dữ liệu mới nhất từ tab Đề bài.',
    false,
    true,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  );

-- 12. CLARIFICATIONS
INSERT INTO clarifications (id, contest_id, task_id, phase_id, contest_entry_id, question, answer, is_public, status, asked_by, answered_by, answered_at)
VALUES
  (
    'c1a00001-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'da5b0001-1111-1111-1111-111111111111',
    'f0a5e001-1111-1111-1111-111111111111',
    'e1111111-1111-1111-1111-111111111111',
    'Chúng tôi có thể sử dụng các mô hình pre-trained bên ngoài không?',
    'Được phép sử dụng các mô hình pre-trained miễn là chúng được công bố công khai và không vi phạm bản quyền.',
    true,
    'answered',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    now() - interval '12 hours'
  ),
  (
    'c1a00001-2222-2222-2222-222222222222',
    'c1111111-1111-1111-1111-111111111111',
    'da5b0002-2222-2222-2222-222222222222',
    'f0a5e002-1111-1111-1111-111111111111',
    'e2222222-2222-2222-2222-222222222222',
    'Bao giờ thì Ban tổ chức mở cổng chấm chung kết của bài MNIST?',
    NULL,
    false,
    'pending',
    '33333333-3333-3333-3333-333333333333',
    NULL,
    NULL
  );

-- 13. TICKETS
INSERT INTO tickets (id, submission_id, contest_entry_id, category, subject, description, status, priority, assigned_to, created_by, resolved_at)
VALUES
  (
    'd1c00001-1111-1111-1111-111111111111',
    '50b00002-4444-4444-4444-444444444444',
    'e3333333-3333-3333-3333-333333333333',
    'judge',
    'Submission của tôi báo lỗi python traceback',
    'Tôi đã upload file predictions.csv đúng định dạng nhưng server báo lỗi KeyError. Nhờ BTC kiểm tra giúp.',
    'resolved',
    'high',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '55555555-5555-5555-5555-555555555555',
    now() - interval '2 hours'
  ),
  (
    'd1c00001-2222-2222-2222-222222222222',
    NULL,
    'e2222222-2222-2222-2222-222222222222',
    'system',
    'Không thể mời thêm thành viên thứ 3 vào đội',
    'Khi tôi nhập email của thành viên thứ 3, hệ thống báo lỗi không tìm thấy người dùng dù người đó đã đăng ký tài khoản.',
    'open',
    'normal',
    NULL,
    '33333333-3333-3333-3333-333333333333',
    NULL
  );
