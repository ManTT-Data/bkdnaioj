# OLPAI Backend Design Plan

**Date:** 260415-1507
**Project:** Olympic AI Platform - Backend, DB & System Design
**Goal:** Comprehensive implementation plan for Database, API, and Worker Architecture

---

## Overview

This plan covers 3 major deliverables for the OLPAI graduation thesis backend:

| # | Deliverable | Status | Priority |
|---|-------------|--------|----------|
| 1 | Database Schema + SQL Migrations | ✅ Complete | P0 |
| 2 | API Spec (Request/Response Models) | ✅ Complete | P0 |
| 3 | Worker Architecture (Judging Pipeline) | ✅ Complete | P1 |

---

## Deliverables Summary

### Phase 1: Database Schema ✅
📄 `phase-01-database-schema.md`

**Contents:**
- Full ERD design với relationships
- 4 Alembic migrations:
  - `001_initial_schema.py` - Users, Teams, Contests, Tasks, Phases
  - `002_add_submissions.py` - Submissions, SubmissionFiles
  - `003_add_evaluation.py` - EvaluationJobs, Scores, LeaderboardEntries
  - `004_add_comms_audit.py` - Announcements, Clarifications, Tickets, AuditLogs
- SQLAlchemy/SQLModel ORM definitions
- Indexing strategy
- Database config với async support

### Phase 2: API Specification ✅
📄 `phase-02-api-specification.md`

**Contents:**
- FastAPI REST endpoints (~86 endpoints)
- Pydantic v2 request/response models
- WebSocket events schema
- Module breakdown:
  - Auth (JWT), Users, Teams
  - Contests, Tasks, Phases
  - Submissions, Leaderboard
  - Clarifications, Announcements, Tickets
  - Admin & Jury endpoints
- Error response standard
- Request/Response examples

### Phase 3: Worker Architecture ✅
📄 `phase-03-worker-architecture.md`

**Contents:**
- Celery configuration với priority queues
- Metric plugin system (6 built-in metrics)
  - Accuracy, F1-Score
  - BLEU, Cosine Similarity
  - PSNR, MAE
- Validator tasks
- Executor tasks (Docker sandbox)
- Scorer tasks
- Rejudge system
- Pipeline orchestration
- Worker startup commands
- Monitoring (Flower + health check)

---

## Quick Reference

### Database Tables (13 core tables)
```
users → teams → team_members
contests → tasks → phases
submissions → submission_files
evaluation_jobs ↔ scores
leaderboard_entries
announcements, clarifications, tickets
audit_logs
```

### API Modules
| Module | Endpoints |
|--------|-----------|
| Auth | 5 |
| Users | 6 |
| Teams | 10 |
| Contests | 8 |
| Tasks | 8 |
| Submissions | 9 |
| Leaderboard | 9 |
| Admin | 12 |

### Worker Queues
| Queue | Priority | Workers |
|-------|----------|---------|
| celery.validate | P0 | 1-2 |
| celery.execute | P0 | 1-N |
| celery.score | P0 | 1-2 |
| celery.rejudge | P1 | 1 |
| celery.batch | P2 | 1 |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI 0.100+ |
| Database | PostgreSQL 15 |
| Cache/Queue | Redis 7 |
| Task Queue | Celery 5.3 |
| Object Storage | MinIO |
| Container | Docker |

---

## Next Steps

1. **Setup Project Structure**: Tạo folder structure theo thiết kế
2. **Implement Backend**: Bắt đầu code theo plan
3. **Database Migrations**: Chạy Alembic migrations
4. **Implement từng module**: Auth → Contests → Submissions → Workers
5. **Testing**: Viết tests cho từng component
6. **Deployment**: Docker Compose setup