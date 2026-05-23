package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/mank1/olpai-backend/db"
	mw "github.com/mank1/olpai-backend/internal/http/middleware"
)

type StatsHandler struct {
	q db.Querier
}

func NewStatsHandler(q db.Querier) *StatsHandler {
	return &StatsHandler{q: q}
}

// GET /api/v1/stats/summary
func (h *StatsHandler) Summary(c echo.Context) error {
	ctx := c.Request().Context()
	users, err := h.q.CountUsers(ctx)
	if err != nil {
		return mw.ErrInternal("count users failed")
	}
	contests, err := h.q.CountContests(ctx)
	if err != nil {
		return mw.ErrInternal("count contests failed")
	}
	tasks, err := h.q.CountTasks(ctx)
	if err != nil {
		return mw.ErrInternal("count tasks failed")
	}
	subs, err := h.q.CountSubmissions(ctx)
	if err != nil {
		return mw.ErrInternal("count submissions failed")
	}

	return c.JSON(http.StatusOK, map[string]int64{
		"users":       users,
		"contests":    contests,
		"tasks":       tasks,
		"submissions": subs,
	})
}

type TaskStatsRow struct {
	TaskID           string  `json:"task_id"`
	SolvedEntries    int64   `json:"solved_entries"`
	TotalSubmissions int64   `json:"total_submissions"`
	DoneSubmissions  int64   `json:"done_submissions"`
	SuccessRate      float64 `json:"success_rate"`
}

// GET /api/v1/stats/tasks
func (h *StatsHandler) TaskStats(c echo.Context) error {
	ctx := c.Request().Context()
	rows, err := h.q.GetTaskSubmissionStats(ctx)
	if err != nil {
		return mw.ErrInternal("task stats failed")
	}

	out := make([]TaskStatsRow, 0, len(rows))
	for _, r := range rows {
		rate := 0.0
		if r.TotalSubmissions > 0 {
			rate = (float64(r.DoneSubmissions) / float64(r.TotalSubmissions)) * 100
		}
		out = append(out, TaskStatsRow{
			TaskID:           r.TaskID.String(),
			SolvedEntries:    r.SolvedEntries,
			TotalSubmissions: r.TotalSubmissions,
			DoneSubmissions:  r.DoneSubmissions,
			SuccessRate:      rate,
		})
	}

	return c.JSON(http.StatusOK, out)
}
