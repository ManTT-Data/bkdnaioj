# OLPAI — AI Contest Platform

Online Judge for AI competitions, virtual replays, and post-contest practice.

---

## Repository Structure

```
├── backend/            # Go API server (Echo + sqlc + pgx)
│   ├── cmd/api/        # HTTP entrypoint
│   ├── internal/       # config, http, security, repo, queue
│   ├── db/             # sqlc generated code
│   ├── migrations/     # goose SQL (17 tables)
│   ├── queries/        # sqlc input
│   ├── Makefile        # build/run/test/migrate
│   ├── Dockerfile
│   └── docker-compose.yml
├── supabase/           # Supabase config + migrations
├── plans/              # Implementation plans & reports
├── ai-contest-database-design-specification.md
├── idea.md
└── README.md           # (this file)
```

---

## Quick Start

```bash
cd backend
cp .env.example .env    # edit DATABASE_URL
make tools              # install goose, sqlc, air
make migrate-up         # apply 17-table schema
make sqlc               # generate type-safe DB code
make run                # http://localhost:8080/healthz
```

---

## Stack

| Layer | Tech |
|---|---|
| API | Go 1.22 + Echo v4 |
| DB | PostgreSQL 17 (Supabase) |
| DB access | sqlc + pgx/v5 |
| Auth | JWT (HS256) |
| Workers | Python 3.11 (planned) |
| Queue | Redis Streams (planned) |
| Storage | MinIO / S3 (planned) |

---

## Documentation

- **Spec:** `ai-contest-database-design-specification.md`
- **Plans:** `plans/260415-1507-olpai-backend-design/`
- **Reports:** `plans/reports/`

---

## License

TBD.
