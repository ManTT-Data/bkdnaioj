-- name: CountTasks :one
SELECT count(*) FROM tasks;

-- name: GetTaskSubmissionStats :many
SELECT
  task_id,
  count(*)::bigint AS total_submissions,
  count(*) FILTER (WHERE status = 'done')::bigint AS done_submissions,
  count(DISTINCT contest_entry_id) FILTER (WHERE status = 'done')::bigint AS solved_entries
FROM submissions
GROUP BY task_id;
