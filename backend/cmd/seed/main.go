package main

import (
	"context"
	"flag"
	"fmt"
	"math/rand/v2"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mank1/olpai-backend/db"
)

const passwordHash = "$2a$10$6y1QM9ZlnTcbwV3uM8CWzeshpECuI.ZJ3Plh2VIx5uOdkWnLihM1K" // "password"

var vnFullNames = []string{
	"Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường", "Phạm Minh Đức", "Vũ Thị Hoa",
	"Đặng Huy Hoàng", "Bùi Thị Hương", "Đỗ Minh Khang", "Ngô Thanh Lâm", "Hồ Hoàng Nam",
	"Dương Hồng Ngọc", "Lý Thanh Phong", "Phan Văn Quân", "Võ Thị Quỳnh", "Trịnh Tiến Sơn",
	"Mai Thu Thảo", "Đào Huy Tuấn", "Hoàng Kim Oanh", "Phùng Hải Đăng", "Tạ Minh Trí",
	"Đỗ Hoàng Long", "Trần Quang Hải", "Phạm Đức Thắng", "Lê Tuấn Tú", "Nguyễn Minh Triết",
	"Đặng Bảo Châu", "Vũ Khánh Linh", "Bùi Hoàng Anh", "Nguyễn Tuấn Kiệt", "Trần Gia Bảo",
	"Nguyễn Hữu Phước", "Lê Minh Nhật", "Phạm Ngọc Duy", "Nguyễn Thùy Chi", "Vũ Quốc Trung",
	"Trần Văn Hùng", "Nguyễn Thị Mai", "Lê Xuân Trường", "Phạm Thu Trang", "Nguyễn Tiến Đạt",
}

type SeedTask struct {
	Title          string
	Slug           string
	Description    string
	ScoreLabel     string
	HigherIsBetter bool
}

type SeedContest struct {
	Title       string
	Slug        string
	Description string
	Status      db.ContestStatus
	Tasks       []SeedTask
}

func main() {
	var (
		reset                = flag.Bool("reset", true, "truncate tables before seeding")
		usersN               = flag.Int("users", 30, "number of contestant users")
		submissionsPerEntry  = flag.Int("submissions-per-entry", 3, "submissions per entry")
	)
	flag.Parse()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DB_URL")
	}
	if dsn == "" {
		_, _ = os.Stderr.WriteString("missing DATABASE_URL (or DB_URL)\n")
		os.Exit(2)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		_, _ = os.Stderr.WriteString("db connect: " + err.Error() + "\n")
		os.Exit(1)
	}
	defer pool.Close()

	tx, err := pool.Begin(ctx)
	if err != nil {
		_, _ = os.Stderr.WriteString("db begin: " + err.Error() + "\n")
		os.Exit(1)
	}
	defer tx.Rollback(context.Background())

	if *reset {
		if err := truncateAll(ctx, tx); err != nil {
			_, _ = os.Stderr.WriteString("truncate: " + err.Error() + "\n")
			os.Exit(1)
		}
	}

	q := db.New(tx)
	now := time.Now().UTC()

	// 1. Create Admins (Only Admin and Contestant are seeded now as per simplification request)
	admin, err := q.CreateUser(ctx, db.CreateUserParams{
		Email:        "admin@local.com",
		PasswordHash: passwordHash,
		FullName:     "Trưởng Ban Tổ Chức",
		Role:         db.UserRoleAdmin,
		StudentID:    ptrString("ADMIN-01"),
		AvatarUrl:    ptrString("https://api.dicebear.com/7.x/adventurer/svg?seed=admin"),
	})
	if err != nil {
		_, _ = os.Stderr.WriteString("create admin: " + err.Error() + "\n")
		os.Exit(1)
	}

	// 2. Create Contestants
	limitUsers := *usersN
	if limitUsers > len(vnFullNames) {
		limitUsers = len(vnFullNames)
	}
	contestants := make([]db.User, 0, limitUsers)
	for i := 0; i < limitUsers; i++ {
		fullName := vnFullNames[i]
		email := fmt.Sprintf("sv%03d@bkdn.edu.vn", i+1)
		u, err := q.CreateUser(ctx, db.CreateUserParams{
			Email:        email,
			PasswordHash: passwordHash,
			FullName:     fullName,
			Role:         db.UserRoleContestant,
			StudentID:    ptrString(fmt.Sprintf("10222%03d", 100+i)),
			AvatarUrl:    ptrString(fmt.Sprintf("https://api.dicebear.com/7.x/adventurer/svg?seed=%s", urlSafeSeed(fullName))),
		})
		if err != nil {
			_, _ = os.Stderr.WriteString("create user: " + err.Error() + "\n")
			os.Exit(1)
		}
		contestants = append(contestants, u)
	}

	// 3. Define Professional AI Contests
	contestsData := []SeedContest{
		{
			Title:       "Olympic Tin Học Sinh Viên 2026 - AI Siêu Cúp",
			Slug:        "olp-ai-sieu-cup-2026",
			Description: "Bảng đấu trí tuệ nhân tạo chuyên sâu dành cho các sinh viên xuất sắc nhất toàn quốc tại Olympic Tin học Sinh viên Việt Nam 2026.",
			Status:      db.ContestStatusRunning,
			Tasks: []SeedTask{
				{
					Title:          "Phát hiện biển báo giao thông Việt Nam (Traffic Sign Detection)",
					Slug:           "traffic-sign-detection",
					Description:    "Xây dựng mô hình học sâu để phát hiện và phân loại chính xác 36 loại biển báo giao thông đường bộ Việt Nam từ ảnh thực tế đường phố.",
					ScoreLabel:     "Mean Average Precision (mAP)",
					HigherIsBetter: true,
				},
				{
					Title:          "Dự đoán nồng độ bụi mịn PM2.5 (Air Quality PM2.5 Prediction)",
					Slug:           "pm25-air-quality",
					Description:    "Dự báo nồng độ bụi mịn PM2.5 tại Hà Nội trong 24 giờ tiếp theo dựa trên dữ liệu khí tượng và lịch sử ô nhiễm không khí.",
					ScoreLabel:     "Root Mean Squared Error (RMSE)",
					HigherIsBetter: false,
				},
			},
		},
		{
			Title:       "AI Driving Agent Challenge 2026",
			Slug:        "ai-driving-agent-2026",
			Description: "Thử thách phát triển mô hình tự hành thông minh (End-to-End Deep Learning) điều khiển xe chạy an toàn trong sa bàn giả lập.",
			Status:      db.ContestStatusRunning,
			Tasks: []SeedTask{
				{
					Title:          "Dự đoán góc lái tối ưu (Steering Angle Estimation)",
					Slug:           "steering-angle",
					Description:    "Dự đoán góc đánh lái trực tiếp từ ảnh camera hành trình gắn phía trước đầu xe tự hành.",
					ScoreLabel:     "Mean Absolute Error (MAE)",
					HigherIsBetter: false,
				},
				{
					Title:          "Tránh chướng ngại vật chủ động (Obstacle Avoidance)",
					Slug:           "obstacle-avoidance",
					Description:    "Phát hiện khoảng cách an toàn và tự động phanh/tránh các vật cản tĩnh và động trên làn đường.",
					ScoreLabel:     "Success Rate (%)",
					HigherIsBetter: true,
				},
			},
		},
		{
			Title:       "Adversarial Attack & Defense Championship",
			Slug:        "adversarial-championship-2026",
			Description: "Giải đấu an ninh học sâu: Thiết kế các cuộc tấn công gây nhiễu ảnh và các giải pháp phòng thủ mô hình AI hiệu quả.",
			Status:      db.ContestStatusRegistrationOpen,
			Tasks: []SeedTask{
				{
					Title:          "Tấn công mô hình phân loại (Adversarial Image Attack)",
					Slug:           "image-attack",
					Description:    "Tạo nhiễu adversarial siêu nhỏ để làm sai lệch kết quả phân loại ảnh của mô hình ResNet50 mục tiêu mà mắt thường không phát hiện được.",
					ScoreLabel:     "Attack Success Rate (ASR)",
					HigherIsBetter: true,
				},
				{
					Title:          "Phòng thủ mô hình chống nhiễu (Robust Model Defense)",
					Slug:           "model-defense",
					Description:    "Huấn luyện mô hình phân loại có khả năng chống chịu cao trước các đòn tấn công nhiễu FGSM, PGD và CW.",
					ScoreLabel:     "Robust Accuracy (%)",
					HigherIsBetter: true,
				},
			},
		},
		{
			Title:       "Vietnamese Sentiment Analysis Cup 2026",
			Slug:        "vietnamese-sentiment-2026",
			Description: "Cuộc thi xử lý ngôn ngữ tự nhiên (NLP) phân loại bình luận khách hàng trên các nền tảng thương mại điện tử lớn của Việt Nam.",
			Status:      db.ContestStatusEnded,
			Tasks: []SeedTask{
				{
					Title:          "Phân loại sắc thái bình luận (Sentiment Classification)",
					Slug:           "sentiment-class",
					Description:    "Phân loại văn bản đánh giá sản phẩm thành 3 lớp: Tích cực (Positive), Tiêu cực (Negative), và Trung lập (Neutral).",
					ScoreLabel:     "Accuracy Score",
					HigherIsBetter: true,
				},
			},
		},
	}

	allTasks := make([]db.Task, 0)
	allTaskPhases := make(map[uuid.UUID]map[db.ContestPhaseKey]db.Phase)

	// 4. Seed Contests & Tasks
	for _, cData := range contestsData {
		start := now.Add(-7 * 24 * time.Hour)
		end := start.Add(14 * 24 * time.Hour)
		if cData.Status == db.ContestStatusEnded {
			start = now.Add(-21 * 24 * time.Hour)
			end = now.Add(-7 * 24 * time.Hour)
		} else if cData.Status == db.ContestStatusRegistrationOpen {
			start = now.Add(2 * 24 * time.Hour)
			end = now.Add(16 * 24 * time.Hour)
		}

		c, err := q.CreateContest(ctx, db.CreateContestParams{
			Slug:              cData.Slug,
			Title:             cData.Title,
			Description:       ptrString(cData.Description),
			BannerUrl:         nil,
			EntryPolicy:       db.ContestEntryPolicyBoth,
			RegistrationStart: pgtype.Timestamptz{Time: start.Add(-48 * time.Hour), Valid: true},
			RegistrationEnd:   pgtype.Timestamptz{Time: start.Add(48 * time.Hour), Valid: true},
			StartTime:         pgtype.Timestamptz{Time: start, Valid: true},
			EndTime:           pgtype.Timestamptz{Time: end, Valid: true},
			Visibility:        db.ContestVisibilityPublic,
			Column11:          "{}",
			CreatedBy:         pgtype.UUID{Bytes: admin.ID, Valid: true},
			MaxTeamSize:       3,
			RequireApproval:   false,
			ScaleScores:       true,
		})
		if err != nil {
			_, _ = os.Stderr.WriteString("create contest: " + err.Error() + "\n")
			os.Exit(1)
		}

		_, err = q.UpdateContestStatus(ctx, db.UpdateContestStatusParams{ID: c.ID, Status: cData.Status})
		if err != nil {
			_, _ = os.Stderr.WriteString("update contest status: " + err.Error() + "\n")
			os.Exit(1)
		}

		// Create phase definitions for this contest
		defs := make(map[db.ContestPhaseKey]db.ContestPhaseDef, 4)
		for _, def := range []struct {
			Key       db.ContestPhaseKey
			Title     string
			SortOrder int32
		}{
			{db.ContestPhaseKeyPublicTest, "Chạy thử (Public)", 1},
			{db.ContestPhaseKeyPrivateTest, "Chạy thật (Private)", 2},
			{db.ContestPhaseKeyFinalPublic, "Chung kết thử (Final Public)", 3},
			{db.ContestPhaseKeyFinalPrivate, "Chung kết thật (Final Private)", 4},
		} {
			pd, err := q.CreatePhaseDef(ctx, db.CreatePhaseDefParams{
				ContestID: c.ID,
				Key:       def.Key,
				Title:     def.Title,
				SortOrder: def.SortOrder,
			})
			if err != nil {
				_, _ = os.Stderr.WriteString("create phase def: " + err.Error() + "\n")
				os.Exit(1)
			}
			defs[def.Key] = pd
		}

		// Seed Tasks for this contest
		for ti, tData := range cData.Tasks {
			task, err := q.CreateTask(ctx, db.CreateTaskParams{
				ContestID:           c.ID,
				Slug:                tData.Slug,
				Title:               tData.Title,
				Description:         ptrString(tData.Description),
				ProblemStatementUrl: nil,
				Column6:             "{}",
				ScoreLabel:          tData.ScoreLabel,
				HigherIsBetter:      tData.HigherIsBetter,
				SortOrder:           int32(ti + 1),
				DatasetUrl:          ptrString("https://drive.google.com/drive/folders/sample-dataset-url-for-" + tData.Slug),
			})
			if err != nil {
				_, _ = os.Stderr.WriteString("create task: " + err.Error() + "\n")
				os.Exit(1)
			}
			allTasks = append(allTasks, task)

			// Create evaluation sets
			pubSet, err := q.CreateEvaluationSet(ctx, db.CreateEvaluationSetParams{
				TaskID:      task.ID,
				Key:         db.EvaluationSetKeyPublic,
				Title:       "Public Test Set",
				Description: nil,
			})
			if err != nil {
				_, _ = os.Stderr.WriteString("create eval set public: " + err.Error() + "\n")
				os.Exit(1)
			}
			privSet, err := q.CreateEvaluationSet(ctx, db.CreateEvaluationSetParams{
				TaskID:      task.ID,
				Key:         db.EvaluationSetKeyPrivate,
				Title:       "Private Test Set",
				Description: nil,
			})
			if err != nil {
				_, _ = os.Stderr.WriteString("create eval set private: " + err.Error() + "\n")
				os.Exit(1)
			}

			// Add assets to evaluation sets
			for _, set := range []db.TaskEvaluationSet{pubSet, privSet} {
				_, err := q.UpsertEvaluationSetAsset(ctx, db.UpsertEvaluationSetAssetParams{
					EvaluationSetID:  set.ID,
					AssetKey:         "judge.py",
					OriginalFilename: "judge.py",
					StoragePath:      fmt.Sprintf("seed/%s/%s/%s", c.Slug, task.Slug, set.Key),
					FileSize:         1024,
					ContentType:      ptrString("text/x-python"),
					HashSha256:       ptrString("seed"),
				})
				if err != nil {
					_, _ = os.Stderr.WriteString("upsert asset judge: " + err.Error() + "\n")
					os.Exit(1)
				}
				_, err = q.UpsertEvaluationSetAsset(ctx, db.UpsertEvaluationSetAssetParams{
					EvaluationSetID:  set.ID,
					AssetKey:         "ground_truth.csv",
					OriginalFilename: "ground_truth.csv",
					StoragePath:      fmt.Sprintf("seed/%s/%s/%s", c.Slug, task.Slug, set.Key),
					FileSize:         2048,
					ContentType:      ptrString("text/csv"),
					HashSha256:       ptrString("seed"),
				})
				if err != nil {
					_, _ = os.Stderr.WriteString("upsert asset gt: " + err.Error() + "\n")
					os.Exit(1)
				}
			}

			// Create Phases
			phases := make(map[db.ContestPhaseKey]db.Phase, 4)
			for _, defKey := range []db.ContestPhaseKey{db.ContestPhaseKeyPublicTest, db.ContestPhaseKeyPrivateTest, db.ContestPhaseKeyFinalPublic, db.ContestPhaseKeyFinalPrivate} {
				pd := defs[defKey]
				evalSetID := pubSet.ID
				isFinal := false
				if defKey == db.ContestPhaseKeyPrivateTest || defKey == db.ContestPhaseKeyFinalPrivate {
					evalSetID = privSet.ID
				}
				if defKey == db.ContestPhaseKeyFinalPublic || defKey == db.ContestPhaseKeyFinalPrivate {
					isFinal = true
				}

				ph, err := q.CreatePhase(ctx, db.CreatePhaseParams{
					TaskID:              task.ID,
					ContestPhaseDefID:   pd.ID,
					EvaluationSetID:     evalSetID,
					Slug:                string(defKey),
					Title:               pd.Title,
					Description:         nil,
					OpenTime:            pgtype.Timestamptz{Time: start, Valid: true},
					CloseTime:           pgtype.Timestamptz{Time: end, Valid: true},
					JudgeKey:            "default",
					SubmissionLimit:     nil,
					LeaderboardMode:     db.LeaderboardModeBest,
					AllowOfficialSubmit: true,
					AllowVirtualSubmit:  true,
					AllowPracticeSubmit: true,
					DisplayScores:       true,
					IsFrozen:            false,
					IsFinal:             isFinal,
					SortOrder:           int32(pd.SortOrder),
				})
				if err != nil {
					_, _ = os.Stderr.WriteString("create phase: " + err.Error() + "\n")
					os.Exit(1)
				}
				phases[defKey] = ph
			}
			allTaskPhases[task.ID] = phases
		}

		// Seed Contest Announcements
		_, err = q.CreateAnnouncement(ctx, db.CreateAnnouncementParams{
			ContestID: pgtype.UUID{Bytes: c.ID, Valid: true},
			TaskID:    pgtype.UUID{Valid: false},
			Title:     "Chào mừng các đội thi đến với giải đấu!",
			Content:   fmt.Sprintf("Cổng đăng ký cho %s hiện đã chính thức hoạt động. Chúc các bạn làm bài thi tốt và đạt kết quả cao!", c.Title),
			IsPinned:  true,
			IsPublic:  true,
			CreatedBy: admin.ID,
		})
		if err != nil {
			_, _ = os.Stderr.WriteString("create announcement: " + err.Error() + "\n")
			os.Exit(1)
		}

		_, err = q.CreateAnnouncement(ctx, db.CreateAnnouncementParams{
			ContestID: pgtype.UUID{Bytes: c.ID, Valid: true},
			TaskID:    pgtype.UUID{Valid: false},
			Title:     "Yêu cầu về mã nguồn nộp bài thi",
			Content:   "Mã nguồn file infer.py của các bạn phải đảm bảo không chứa các kết nối mạng bên ngoài và thời gian chạy tối đa là 10 giây cho mỗi lượt kiểm thử.",
			IsPinned:  false,
			IsPublic:  true,
			CreatedBy: admin.ID,
		})
		if err != nil {
			_, _ = os.Stderr.WriteString("create announcement: " + err.Error() + "\n")
			os.Exit(1)
		}

		// Register contestants into this contest
		for _, u := range contestants {
			// Seed contestants conditionally (some register, some do not)
			if rand.IntN(4) == 0 {
				continue
			}

			entry, err := q.CreateContestEntry(ctx, db.CreateContestEntryParams{
				ContestID:    c.ID,
				EntryType:    db.EntryTypeIndividual,
				EntryMode:    db.EntryModeOfficial,
				UserID:       pgtype.UUID{Bytes: u.ID, Valid: true},
				TeamID:       pgtype.UUID{Valid: false},
				DisplayName:  u.FullName,
				Status:       db.EntryStatusApproved,
				RegisteredBy: u.ID,
				StartAt:      pgtype.Timestamptz{Time: now, Valid: true},
				EndAt:        pgtype.Timestamptz{Valid: false},
			})
			if err != nil {
				_, _ = os.Stderr.WriteString("create entry: " + err.Error() + "\n")
				os.Exit(1)
			}

			err = q.AddEntryMember(ctx, db.AddEntryMemberParams{
				ContestEntryID: entry.ID,
				UserID:         u.ID,
				Role:           db.EntryMemberRoleMember,
			})
			if err != nil {
				_, _ = os.Stderr.WriteString("add entry member: " + err.Error() + "\n")
				os.Exit(1)
			}

			// Get tasks of this contest
			cTasks := make([]db.Task, 0)
			for _, t := range allTasks {
				if t.ContestID == c.ID {
					cTasks = append(cTasks, t)
				}
			}

			// Generate submissions for these contestants
			if cData.Status != db.ContestStatusRegistrationOpen {
				for si := 0; si < *submissionsPerEntry; si++ {
					t := cTasks[rand.IntN(len(cTasks))]
					phases := allTaskPhases[t.ID]
					ph := phases[db.ContestPhaseKeyPublicTest]
					if si == *submissionsPerEntry-1 {
						ph = phases[db.ContestPhaseKeyPrivateTest]
					}

					sub, err := q.CreateSubmission(ctx, db.CreateSubmissionParams{
						ContestID:      c.ID,
						ContestEntryID: entry.ID,
						TaskID:         t.ID,
						PhaseID:        ph.ID,
						SubmittedBy:    u.ID,
						FileCount:      1,
						TotalSizeBytes: 1540,
						ManifestHash:   nil,
						ClientIp:       nil,
						UserAgent:      nil,
					})
					if err != nil {
						_, _ = os.Stderr.WriteString("create submission: " + err.Error() + "\n")
						os.Exit(1)
					}

					_, err = q.CreateSubmissionFile(ctx, db.CreateSubmissionFileParams{
						SubmissionID:     sub.ID,
						OriginalFilename: "predictions.csv",
						StoragePath:      fmt.Sprintf("seed/submissions/%s.csv", sub.ID.String()),
						FileSize:         1540,
						ContentType:      ptrString("text/csv"),
						HashSha256:       ptrString("seed-hash"),
					})
					if err != nil {
						_, _ = os.Stderr.WriteString("create submission file: " + err.Error() + "\n")
						os.Exit(1)
					}

					// Update status to done and generate realistic scores
					score := 0.0
					if t.HigherIsBetter {
						// e.g. Accuracy or mAP [0.0, 1.0] or [0.0, 100.0]
						if strings.Contains(t.ScoreLabel, "%") || strings.Contains(t.ScoreLabel, "Rate") {
							score = 40.0 + rand.Float64()*55.0 // 40% - 95%
						} else {
							score = 0.5 + rand.Float64()*0.48 // 0.5 - 0.98
						}
					} else {
						// e.g. RMSE or MAE (lower is better, e.g. 0.01 - 5.0)
						score = 0.05 + rand.Float64()*2.5
					}

					status := "done"
					if rand.IntN(20) == 0 {
						status = "failed"
						score = 0.0
					}

					_, err = tx.Exec(ctx, "UPDATE submissions SET status=$2, raw_score=$3, display_score=$3, evaluated_at=now(), updated_at=now() WHERE id=$1", sub.ID, status, score)
					if err != nil {
						_, _ = os.Stderr.WriteString("update submission score: " + err.Error() + "\n")
						os.Exit(1)
					}
				}
			}
		}
	}

	// 5. Seed System-wide Announcements (Global)
	_, err = q.CreateAnnouncement(ctx, db.CreateAnnouncementParams{
		ContestID: pgtype.UUID{Valid: false},
		TaskID:    pgtype.UUID{Valid: false},
		Title:     "Bảo trì nâng cấp hạ tầng máy chấm GPU OLP AI 2026",
		Content:   "Hệ thống máy chấm OLP AI sẽ tạm dừng nhận bài thi vào lúc 23:00 tối nay để nâng cấp hệ thống CUDA driver và bổ sung thêm 2 card đồ họa NVIDIA RTX 4090 nhằm phục vụ tốt hơn cho vòng thi sắp tới. Dự kiến thời gian bảo trì kéo dài 2 tiếng.",
		IsPinned:  true,
		IsPublic:  true,
		CreatedBy: admin.ID,
	})
	if err != nil {
		_, _ = os.Stderr.WriteString("create system announcement: " + err.Error() + "\n")
		os.Exit(1)
	}

	_, err = q.CreateAnnouncement(ctx, db.CreateAnnouncementParams{
		ContestID: pgtype.UUID{Valid: false},
		TaskID:    pgtype.UUID{Valid: false},
		Title:     "Cập nhật quy định về chống gian lận thi cử",
		Content:   "Ban tổ chức quy định nghiêm cấm các hành vi hardcode nhãn dữ liệu kiểm thử, kết nối internet trong file code nộp bài hoặc sao chép lời giải. Mọi bài làm vi phạm sẽ bị hệ thống tự động gắn cờ cảnh báo và hủy tư cách dự thi ngay lập tức.",
		IsPinned:  false,
		IsPublic:  true,
		CreatedBy: admin.ID,
	})
	if err != nil {
		_, _ = os.Stderr.WriteString("create system announcement 2: " + err.Error() + "\n")
		os.Exit(1)
	}

	// 6. Recompute Standings/Leaderboards for all seeded phases
	_, _ = os.Stdout.WriteString("recomputing leaderboards for all phases...\n")
	rows, err := tx.Query(ctx, "SELECT p.id, p.leaderboard_mode, t.higher_is_better, p.contest_phase_def_id, t.contest_id FROM phases p JOIN tasks t ON t.id = p.task_id")
	if err != nil {
		_, _ = os.Stderr.WriteString("query phases: " + err.Error() + "\n")
		os.Exit(1)
	}
	defer rows.Close()

	type phaseInfo struct {
		ID                uuid.UUID
		LeaderboardMode   string
		HigherIsBetter    bool
		ContestPhaseDefID uuid.UUID
		ContestID         uuid.UUID
	}
	var phases []phaseInfo
	for rows.Next() {
		var pi phaseInfo
		err := rows.Scan(&pi.ID, &pi.LeaderboardMode, &pi.HigherIsBetter, &pi.ContestPhaseDefID, &pi.ContestID)
		if err != nil {
			_, _ = os.Stderr.WriteString("scan phase: " + err.Error() + "\n")
			os.Exit(1)
		}
		phases = append(phases, pi)
	}

	for _, pi := range phases {
		err = q.RecomputeTaskPhaseLeaderboard(ctx, db.RecomputeTaskPhaseLeaderboardParams{
			PhaseID:         pi.ID,
			LeaderboardMode: db.LeaderboardMode(pi.LeaderboardMode),
			HigherIsBetter:  pi.HigherIsBetter,
		})
		if err != nil {
			_, _ = os.Stderr.WriteString("recompute task phase: " + err.Error() + "\n")
			os.Exit(1)
		}

		err = q.RecomputeContestPhaseLeaderboard(ctx, db.RecomputeContestPhaseLeaderboardParams{
			ContestPhaseDefID: pi.ContestPhaseDefID,
			ContestID:         pi.ContestID,
		})
		if err != nil {
			_, _ = os.Stderr.WriteString("recompute contest phase: " + err.Error() + "\n")
			os.Exit(1)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		_, _ = os.Stderr.WriteString("commit: " + err.Error() + "\n")
		os.Exit(1)
	}

	_, _ = os.Stdout.WriteString("seed complete\n")
}

func urlSafeSeed(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, " ", "-")
	if s == "" {
		return "user"
	}
	return s
}

func ptrString(s string) *string { return &s }

func truncateAll(ctx context.Context, tx db.DBTX) error {
	_, err := tx.Exec(ctx, `TRUNCATE TABLE
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
	CASCADE`)
	return err
}
