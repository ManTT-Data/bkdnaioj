# Phase 1: Database Schema với SQL Migrations

**Status:** ⏳ In Progress
**File:** `phase-01-database-schema.md`

---

## 1. Database Design Overview

### 1.1 Technology Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| Database | PostgreSQL 15+ | ACID compliance, JSONB for flexible metadata |
| Migration Tool | Alembic | Industry standard, version control for DB |
| Connection Pool | SQLAlchemy 2.0 + asyncpg | Async native, connection pooling |

### 1.2 Schema Design Principles

1. **Normalization**: BCNF for core entities
2. **JSONB**: Flexible fields for extensible metadata (rules, config, scores breakdown)
3. **Soft Deletes**: `deleted_at` for audit trail
4. **UUID Primary Keys**: `gen_random_uuid()` for security & distributed systems
5. **Audit Fields**: `created_at`, `updated_at` on all tables

---

## 2. Entity-Relationship Diagram

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│  USERS   │──────<│  TEAMS   │>──────│TEAM_MBR │
└──────────┘ 1:N   └────┬─────┘ 1:N   └──────────┘
                        │
                        │ N:N (via registrations)
                        │
┌──────────┐       ┌─────┴─────┐       ┌──────────┐
│CONTESTS  │──1:N──│   TASKS   │──1:N──│  PHASES  │
└──────────┘       └────┬─────┘       └────┬─────┘
                        │                    │
                        │ 1:N                 │ 1:N
                        ▼                    ▼
┌──────────────┐  ┌────────────┐  ┌──────────────────┐
│ SUBMISSIONS  │──│SUBM_FILES  │  │ EVALUATION_JOBS  │
└──────┬───────┘  └────────────┘  └────────┬─────────┘
       │                                     │
       │ 1:1                          ┌──────▼──────┐
       ▼                                │   SCORES   │
┌──────────────────┐                   └────────────┘
│LEADERBOARD_ENTRY │
└──────────────────┘

┌──────────────┐  ┌────────────────┐  ┌──────────┐
│ANNOUNCEMENTS │  │CLARIFICATIONS │  │ TICKETS  │
└──────────────┘  └────────────────┘  └──────────┘
                        │
┌───────────────────────┴───────────────────────┐
│                 AUDIT_LOGS                     │
└───────────────────────────────────────────────┘
```

---

## 3. SQL Migration Files (Alembic)

### 3.1 Directory Structure

```
backend/
├── alembic/
│   ├── versions/
│   │   ├── 001_initial_schema.py
│   │   ├── 002_add_submission_files.py
│   │   ├── 003_add_evaluation_jobs.py
│   │   └── ...
│   ├── env.py
│   └── script.py.mako
```

### 3.2 Migration 001: Initial Schema

```python
# alembic/versions/001_initial_schema.py
"""Initial schema - users, teams, contests, tasks, phases

Revision ID: 001
Revises:
Create Date: 2026-04-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # === USERS ===
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='contestant'),
        sa.Column('student_id', sa.String(50)),
        sa.Column('avatar_url', sa.String(500)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('deleted_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role', 'users', ['role'])

    # === CONTESTS ===
    op.create_table(
        'contests',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('slug', sa.String(255), unique=True, nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('banner_url', sa.String(500)),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('registration_start', sa.DateTime()),
        sa.Column('registration_end', sa.DateTime()),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('rules', JSONB),
        sa.Column('max_team_size', sa.Integer(), default=1),
        sa.Column('require_approval', sa.Boolean(), default=False),
        sa.Column('visibility', sa.String(20), server_default='public'),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('deleted_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_contests_slug', 'contests', ['slug'])
    op.create_index('idx_contests_status', 'contests', ['status'])
    op.create_index('idx_contests_time', 'contests', ['start_time', 'end_time'])

    # === TASKS ===
    op.create_table(
        'tasks',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('contest_id', UUID(as_uuid=True), sa.ForeignKey('contests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('problem_statement_url', sa.String(500)),
        sa.Column('submission_schema', JSONB),
        sa.Column('evaluator_type', sa.String(100), server_default='output'),
        sa.Column('metric_names', JSONB, server_default='["accuracy"]'),
        sa.Column('aggregation_rule', sa.String(100), server_default='mean'),
        sa.Column('dataset_ref', sa.String(255)),
        sa.Column('max_submissions', sa.Integer(), default=100),
        sa.Column('max_upload_size_mb', sa.Integer(), default=100),
        sa.Column('allowed_file_types', JSONB),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.Column('deleted_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('contest_id', 'slug'),
    )
    op.create_index('idx_tasks_contest', 'tasks', ['contest_id'])

    # === PHASES ===
    op.create_table(
        'phases',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('task_id', UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('phase_type', sa.String(100)),
        sa.Column('description', sa.Text()),
        sa.Column('open_time', sa.DateTime(), nullable=False),
        sa.Column('close_time', sa.DateTime(), nullable=False),
        sa.Column('judging_mode', sa.String(50), server_default='output'),
        sa.Column('submission_limit', sa.Integer()),
        sa.Column('leaderboard_mode', sa.String(50), server_default='best'),
        sa.Column('is_frozen', sa.Boolean(), default=False),
        sa.Column('display_scores', sa.Boolean(), default=True),
        sa.Column('weight', sa.Numeric(5, 2), default=1.0),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.Column('deleted_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('task_id', 'slug'),
    )
    op.create_index('idx_phases_task', 'phases', ['task_id'])
    op.create_index('idx_phases_time', 'phases', ['open_time', 'close_time'])

    # === TEAMS ===
    op.create_table(
        'teams',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), unique=True),
        sa.Column('contest_id', UUID(as_uuid=True), sa.ForeignKey('contests.id')),
        sa.Column('leader_id', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('status', sa.String(50), server_default='active'),
        sa.Column('approved_by', UUID(as_uuid=True)),
        sa.Column('approved_at', sa.DateTime()),
        sa.Column('invite_code', sa.String(64)),
        sa.Column('deleted_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_teams_contest', 'teams', ['contest_id'])
    op.create_index('idx_teams_invite_code', 'teams', ['invite_code'])

    # === TEAM MEMBERS ===
    op.create_table(
        'team_members',
        sa.Column('team_id', UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('role', sa.String(50), server_default='member'),
        sa.Column('joined_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_team_members_user', 'team_members', ['user_id'])

    # === CONTEST REGISTRATIONS ===
    op.create_table(
        'contest_registrations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('contest_id', UUID(as_uuid=True), sa.ForeignKey('contests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team_id', UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(50), server_default='pending'),
        sa.Column('registered_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('approved_by', UUID(as_uuid=True)),
        sa.Column('approved_at', sa.DateTime()),
        sa.UniqueConstraint('contest_id', 'team_id'),
    )
    op.create_index('idx_reg_contest', 'contest_registrations', ['contest_id'])
    op.create_index('idx_reg_team', 'contest_registrations', ['team_id'])

def downgrade():
    op.drop_table('contest_registrations')
    op.drop_table('team_members')
    op.drop_table('teams')
    op.drop_table('phases')
    op.drop_table('tasks')
    op.drop_table('contests')
    op.drop_table('users')
```

---

## 4. SQL Migration 002: Submissions & Files

```python
# alembic/versions/002_add_submissions.py
"""Add submissions, submission_files tables

Revision ID: 002
Revises: 001
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

def upgrade():
    # === SUBMISSIONS ===
    op.create_table(
        'submissions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('team_id', UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_id', UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('phase_id', UUID(as_uuid=True), sa.ForeignKey('phases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('submitted_at', sa.DateTime()),
        sa.Column('file_count', sa.Integer(), default=0),
        sa.Column('total_size_bytes', sa.BigInteger(), default=0),
        sa.Column('manifest_hash', sa.String(64)),
        sa.Column('validation_result', JSONB),
        sa.Column('execution_time_ms', sa.Integer()),
        sa.Column('error_message', sa.Text()),
        sa.Column('is_final', sa.Boolean(), default=False),
        sa.Column('rejudge_count', sa.Integer(), default=0),
        sa.Column('client_ip', sa.String(45)),
        sa.Column('user_agent', sa.String(500)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_submissions_team_task', 'submissions', ['team_id', 'task_id', 'phase_id'])
    op.create_index('idx_submissions_status', 'submissions', ['status'])
    op.create_index('idx_submissions_submitted_at', 'submissions', ['submitted_at'])

    # === SUBMISSION FILES ===
    op.create_table(
        'submission_files',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('submission_id', UUID(as_uuid=True), sa.ForeignKey('submissions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('original_filename', sa.String(255)),
        sa.Column('file_path', sa.String(1000), nullable=False),
        sa.Column('file_size', sa.BigInteger()),
        sa.Column('content_type', sa.String(100)),
        sa.Column('hash_sha256', sa.String(64)),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_submission_files_submission', 'submission_files', ['submission_id'])

def downgrade():
    op.drop_table('submission_files')
    op.drop_table('submissions')
```

---

## 5. SQL Migration 003: Evaluation Jobs & Scores

```python
# alembic/versions/003_add_evaluation.py
"""Add evaluation_jobs, scores, leaderboard_entries

Revision ID: 003
Revises: 002
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

def upgrade():
    # === EVALUATION JOBS ===
    op.create_table(
        'evaluation_jobs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('submission_id', UUID(as_uuid=True), sa.ForeignKey('submissions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('phase_id', UUID(as_uuid=True), sa.ForeignKey('phases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('job_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('priority', sa.Integer(), server_default=5),
        sa.Column('worker_id', sa.String(100)),
        sa.Column('attempt_count', sa.Integer(), default=0),
        sa.Column('max_attempts', sa.Integer(), default=3),
        sa.Column('input_data', JSONB),
        sa.Column('output_data', JSONB),
        sa.Column('started_at', sa.DateTime()),
        sa.Column('completed_at', sa.DateTime()),
        sa.Column('execution_time_ms', sa.Integer()),
        sa.Column('error_log', sa.Text()),
        sa.Column('celery_task_id', sa.String(255)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_eval_jobs_status', 'evaluation_jobs', ['status', 'created_at'])
    op.create_index('idx_eval_jobs_submission', 'evaluation_jobs', ['submission_id'])
    op.create_index('idx_eval_jobs_celery', 'evaluation_jobs', ['celery_task_id'])

    # === SCORES ===
    op.create_table(
        'scores',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('submission_id', UUID(as_uuid=True), sa.ForeignKey('submissions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('metric_name', sa.String(100), nullable=False),
        sa.Column('raw_score', sa.Numeric(20, 10)),
        sa.Column('display_score', sa.Numeric(20, 5)),
        sa.Column('breakdown', JSONB),
        sa.Column('rank', sa.Integer()),
        sa.Column('computed_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('submission_id', 'metric_name'),
    )
    op.create_index('idx_scores_submission', 'scores', ['submission_id'])
    op.create_index('idx_scores_metric', 'scores', ['metric_name'])

    # === LEADERBOARD ENTRIES ===
    op.create_table(
        'leaderboard_entries',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('contest_id', UUID(as_uuid=True), sa.ForeignKey('contests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_id', UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('phase_id', UUID(as_uuid=True), sa.ForeignKey('phases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team_id', UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rank', sa.Integer()),
        sa.Column('raw_total', sa.Numeric(20, 5)),
        sa.Column('display_total', sa.Numeric(20, 5)),
        sa.Column('normalized_total', sa.Numeric(20, 5)),
        sa.Column('chosen_submission_id', UUID(as_uuid=True)),
        sa.Column('best_submission_id', UUID(as_uuid=True)),
        sa.Column('is_frozen', sa.Boolean(), default=False),
        sa.Column('is_disqualified', sa.Boolean(), default=False),
        sa.Column('dq_reason', sa.Text()),
        sa.Column('snapshot_time', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('contest_id', 'task_id', 'phase_id', 'team_id'),
    )
    op.create_index('idx_lb_contest_task', 'leaderboard_entries', ['contest_id', 'task_id', 'phase_id'])
    op.create_index('idx_lb_rank', 'leaderboard_entries', ['contest_id', 'task_id', 'phase_id', 'rank'])
    op.create_index('idx_lb_team', 'leaderboard_entries', ['team_id'])

def downgrade():
    op.drop_table('leaderboard_entries')
    op.drop_table('scores')
    op.drop_table('evaluation_jobs')
```

---

## 6. SQL Migration 004: Communications & Audit

```python
# alembic/versions/004_add_comms_audit.py
"""Add announcements, clarifications, tickets, audit_logs

Revision ID: 004
Revises: 003
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

def upgrade():
    # === ANNOUNCEMENTS ===
    op.create_table(
        'announcements',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('contest_id', UUID(as_uuid=True), sa.ForeignKey('contests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_id', UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='SET NULL')),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_pinned', sa.Boolean(), default=False),
        sa.Column('is_public', sa.Boolean(), default=True),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_announcements_contest', 'announcements', ['contest_id'])

    # === CLARIFICATIONS ===
    op.create_table(
        'clarifications',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('contest_id', UUID(as_uuid=True), sa.ForeignKey('contests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_id', UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='SET NULL')),
        sa.Column('phase_id', UUID(as_uuid=True), sa.ForeignKey('phases.id', ondelete='SET NULL')),
        sa.Column('team_id', UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text()),
        sa.Column('is_public', sa.Boolean(), default=False),
        sa.Column('status', sa.String(50), server_default='pending'),
        sa.Column('asked_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('answered_by', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('answered_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_clarifications_contest', 'clarifications', ['contest_id'])
    op.create_index('idx_clarifications_team', 'clarifications', ['team_id'])
    op.create_index('idx_clarifications_status', 'clarifications', ['status'])

    # === TICKETS ===
    op.create_table(
        'tickets',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('submission_id', UUID(as_uuid=True), sa.ForeignKey('submissions.id', ondelete='SET NULL')),
        sa.Column('team_id', UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category', sa.String(100)),
        sa.Column('subject', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(50), server_default='open'),
        sa.Column('priority', sa.String(20), server_default='normal'),
        sa.Column('assigned_to', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('resolved_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_tickets_team', 'tickets', ['team_id'])
    op.create_index('idx_tickets_status', 'tickets', ['status'])
    op.create_index('idx_tickets_submission', 'tickets', ['submission_id'])

    # === AUDIT LOGS ===
    op.create_table(
        'audit_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.func.gen_random_uuid()),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(100)),
        sa.Column('resource_id', UUID(as_uuid=True)),
        sa.Column('old_value', JSONB),
        sa.Column('new_value', JSONB),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.String(500)),
        sa.Column('metadata', JSONB),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('idx_audit_user_time', 'audit_logs', ['user_id', 'created_at'])
    op.create_index('idx_audit_resource', 'audit_logs', ['resource_type', 'resource_id'])
    op.create_index('idx_audit_action', 'audit_logs', ['action', 'created_at'])

def downgrade():
    op.drop_table('audit_logs')
    op.drop_table('tickets')
    op.drop_table('clarifications')
    op.drop_table('announcements')
```

---

## 7. SQLAlchemy Models (SQLModel/ORM)

```python
# backend/app/models/database.py
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from sqlmodel import SQLModel, Field, Relationship, JSON
from sqlalchemy import Column, DateTime, Boolean, BigInteger
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[UUID] = Field(default=None, primary_key=True, sa_column=Column(PGUUID(as_uuid=True), default=...))
    email: str = Field(unique=True, index=True)
    password_hash: str
    full_name: str
    role: str = Field(default="contestant")
    student_id: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = Field(default=True)
    deleted_at: Optional[datetime] = None

    # Relationships
    created_contests: List["Contest"] = Relationship(back_populates="creator")
    teams_as_leader: List["Team"] = Relationship(back_populates="leader")
    team_memberships: List["TeamMember"] = Relationship(back_populates="user")

class Team(SQLModel, table=True):
    __tablename__ = "teams"

    id: Optional[UUID] = Field(default=None, primary_key=True)
    name: str
    slug: Optional[str] = Field(unique=True)
    contest_id: Optional[UUID] = Field(default=None, foreign_key="contests.id")
    leader_id: Optional[UUID] = Field(default=None, foreign_key="users.id")
    status: str = Field(default="active")
    invite_code: Optional[str] = None

    leader: Optional["User"] = Relationship(back_populates="teams_as_leader")
    members: List["TeamMember"] = Relationship(back_populates="team")

class Contest(SQLModel, table=True):
    __tablename__ = "contests"

    id: Optional[UUID] = Field(default=None, primary_key=True)
    slug: str = Field(unique=True, index=True)
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: str = Field(default="draft")
    rules: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
    max_team_size: int = Field(default=1)
    created_by: Optional[UUID] = Field(default=None, foreign_key="users.id")

    tasks: List["Task"] = Relationship(back_populates="contest")
    creator: Optional["User"] = Relationship(back_populates="created_contests")

class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: Optional[UUID] = Field(default=None, primary_key=True)
    contest_id: UUID = Field(foreign_key="contests.id")
    slug: str
    title: str
    evaluator_type: str = Field(default="output")
    metric_names: List[str] = Field(default=["accuracy"], sa_column=Column(JSONB))
    submission_schema: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
    max_submissions: int = Field(default=100)

    contest: Optional["Contest"] = Relationship(back_populates="tasks")
    phases: List["Phase"] = Relationship(back_populates="task")

class Phase(SQLModel, table=True):
    __tablename__ = "phases"

    id: Optional[UUID] = Field(default=None, primary_key=True)
    task_id: UUID = Field(foreign_key="tasks.id")
    slug: str
    title: str
    phase_type: Optional[str] = None
    open_time: datetime
    close_time: datetime
    judging_mode: str = Field(default="output")
    submission_limit: Optional[int] = None
    leaderboard_mode: str = Field(default="best")
    is_frozen: bool = Field(default=False)
    display_scores: bool = Field(default=True)
    weight: float = Field(default=1.0)

    task: Optional["Task"] = Relationship(back_populates="phases")

class Submission(SQLModel, table=True):
    __tablename__ = "submissions"

    id: Optional[UUID] = Field(default=None, primary_key=True)
    team_id: UUID = Field(foreign_key="teams.id")
    task_id: UUID = Field(foreign_key="tasks.id")
    phase_id: UUID = Field(foreign_key="phases.id")
    status: str = Field(default="draft")
    submitted_at: Optional[datetime] = None
    file_count: int = Field(default=0)
    total_size_bytes: int = Field(default=0)
    manifest_hash: Optional[str] = None
    validation_result: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
    execution_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    is_final: bool = Field(default=False)
    rejudge_count: int = Field(default=0)

    files: List["SubmissionFile"] = Relationship(back_populates="submission")
    scores: List["Score"] = Relationship(back_populates="submission")

class EvaluationJob(SQLModel, table=True):
    __tablename__ = "evaluation_jobs"

    id: Optional[UUID] = Field(default=None, primary_key=True)
    submission_id: UUID = Field(foreign_key="submissions.id")
    phase_id: UUID = Field(foreign_key="phases.id")
    job_type: str  # validate, execute, score
    status: str = Field(default="pending")
    priority: int = Field(default=5)
    worker_id: Optional[str] = None
    attempt_count: int = Field(default=0)
    input_data: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
    output_data: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_log: Optional[str] = None
    celery_task_id: Optional[str] = None

# ... additional models for Score, LeaderboardEntry, Clarification, etc.
```

---

## 8. Database Configuration

```python
# backend/app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

DATABASE_URL = "postgresql+asyncpg://user:pass@localhost:5432/olpai"

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session():
    async with async_session() as session:
        yield session
```

---

## 9. Seed Data Patterns

```python
# backend/app/seed_data.py
SEED_METRICS = [
    {"name": "accuracy", "display_name": "Accuracy", "category": "classification"},
    {"name": "f1_score", "display_name": "F1 Score", "category": "classification"},
    {"name": "bleu", "display_name": "BLEU Score", "category": "nlp"},
    {"name": "cosine_similarity", "display_name": "Cosine Similarity", "category": "similarity"},
    {"name": "psnr", "display_name": "PSNR", "category": "image"},
    {"name": "mae", "display_name": "MAE", "category": "regression"},
]

SEED_ROLES = ["contestant", "jury", "admin"]
```

---

## 10. Todo List

- [x] ERD Design
- [x] Migration 001: Core tables (users, contests, tasks, phases, teams)
- [x] Migration 002: Submissions & Files
- [x] Migration 003: Evaluation Jobs & Scores
- [x] Migration 004: Communications & Audit
- [x] SQLAlchemy Models
- [ ] Indexing review & optimization
- [ ] Connection pooling config
- [ ] Migration testing script

---

## 11. Success Criteria

1. **All tables created with correct constraints**
2. **Foreign keys properly enforced**
3. **Indexes support query patterns**
4. **Alembic can upgrade/downgrade cleanly**
5. **Models sync with schema**

---

## 12. Next Steps

→ Phase 2: API Specification (Request/Response Models)