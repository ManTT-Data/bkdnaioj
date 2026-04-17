# Phase 2: API Specification với Request/Response Models

**Status:** ⏳ In Progress
**File:** `phase-02-api-specification.md`

---

## 1. API Design Overview

### 1.1 Technology Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| Framework | FastAPI 0.100+ | Auto-docs, async, Pydantic v2 |
| API Style | REST + WebSocket | Standard, real-time support |
| Validation | Pydantic v2 | Type safety, JSON Schema |
| Docs | OpenAPI auto-gen | Interactive API docs |

### 1.2 API Versioning Strategy

```
/api/v1/...
     ^
     └── Version prefix for backward compatibility
```

### 1.3 Error Response Standard

```python
# backend/app/schemas/common.py
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from enum import Enum

class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    FORBIDDEN = "FORBIDDEN"
    UNAUTHORIZED = "UNAUTHORIZED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    CONFLICT = "CONFLICT"
    RATE_LIMITED = "RATE_LIMITED"

class ErrorResponse(BaseModel):
    error: ErrorCode
    message: str
    details: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool
```

---

## 2. Authentication Module

### 2.1 Schemas

```python
# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    student_id: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 3600 * 24 * 7  # 7 days

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    student_id: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
```

### 2.2 Endpoints

```python
# backend/app/apps/auth/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.schemas.auth import *
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest):
    """Register new user account"""
    # TODO: Implement registration logic
    pass

@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest):
    """Login and receive JWT tokens"""
    # TODO: Implement login logic
    pass

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(req: TokenRefreshRequest):
    """Refresh access token"""
    pass

@router.post("/logout")
async def logout(token: str = Depends(OAuth2PasswordBearer(...))):
    """Logout (invalidate token)"""
    pass

@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str = Depends(OAuth2PasswordBearer(...))):
    """Get current authenticated user"""
    pass
```

---

## 3. Users Module

### 3.1 Schemas

```python
# backend/app/schemas/user.py
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class UserListItem(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

class UserDetail(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    student_id: Optional[str]
    avatar_url: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class UserAdminUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
```

### 3.2 Endpoints

```python
# Users endpoints
GET    /api/v1/users/me                          # Current user profile
PATCH  /api/v1/users/me                          # Update profile
GET    /api/v1/users/{user_id}                   # Get user detail (admin/jury)
GET    /api/v1/users                             # List users (admin only)
PATCH  /api/v1/users/{user_id}                   # Update user (admin only)
```

---

## 4. Teams Module

### 4.1 Schemas

```python
# backend/app/schemas/team.py
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class TeamMemberResponse(BaseModel):
    user_id: UUID
    full_name: str
    email: str
    role: str  # leader | member
    joined_at: datetime

class TeamCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    contest_id: UUID

class TeamUpdateRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

class TeamResponse(BaseModel):
    id: UUID
    name: str
    slug: Optional[str]
    contest_id: Optional[UUID]
    leader_id: UUID
    status: str
    members: List[TeamMemberResponse]
    created_at: datetime

class TeamInviteRequest(BaseModel):
    emails: List[EmailStr]

class TeamJoinRequest(BaseModel):
    invite_code: str
```

### 4.2 Endpoints

```python
# Teams endpoints
POST   /api/v1/teams                             # Create team
GET    /api/v1/teams/{team_id}                   # Get team detail
PATCH  /api/v1/teams/{team_id}                   # Update team
DELETE /api/v1/teams/{team_id}                   # Delete team (leader)

POST   /api/v1/teams/{team_id}/invite            # Invite members
POST   /api/v1/teams/{team_id}/join              # Join via invite code
DELETE /api/v1/teams/{team_id}/members/{user_id} # Remove member

GET    /api/v1/teams/{team_id}/members           # List members
GET    /api/v1/teams/{team_id}/submissions       # Team submissions

GET    /api/v1/teams/my                          # My teams
```

---

## 5. Contests Module

### 5.1 Schemas

```python
# backend/app/schemas/contest.py
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ContestStatus(str, Enum):
    DRAFT = "draft"
    REGISTRATION = "registration"
    RUNNING = "running"
    FINISHED = "finished"
    ARCHIVED = "archived"

class ContestListItem(BaseModel):
    id: UUID
    slug: str
    title: str
    status: str
    start_time: datetime
    end_time: datetime
    participant_count: int = 0
    task_count: int = 0

class ContestCreateRequest(BaseModel):
    title: str = Field(min_length=5, max_length=500)
    description: Optional[str] = None
    slug: str = Field(min_length=3, max_length=100, pattern=r"^[a-z0-9-]+$")
    start_time: datetime
    end_time: datetime
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    max_team_size: int = Field(default=1, ge=1, le=10)
    rules: Optional[dict] = None

class ContestUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    rules: Optional[dict] = None

class ContestDetail(BaseModel):
    id: UUID
    slug: str
    title: str
    description: Optional[str]
    status: str
    start_time: datetime
    end_time: datetime
    registration_start: Optional[datetime]
    registration_end: Optional[datetime]
    max_team_size: int
    rules: Optional[dict]
    tasks: List["TaskBrief"]
    created_by: UUID
    created_at: datetime
    updated_at: datetime

class ContestRegistrationRequest(BaseModel):
    team_id: UUID

class ContestRegistrationResponse(BaseModel):
    id: UUID
    contest_id: UUID
    team_id: UUID
    status: str
    registered_at: datetime
    approved_at: Optional[datetime]
```

### 5.2 Endpoints

```python
# Contests endpoints
GET    /api/v1/contests                           # List public contests
POST   /api/v1/contests                          # Create contest (admin/jury)
GET    /api/v1/contests/{slug}                   # Get contest detail
PATCH  /api/v1/contests/{slug}                   # Update contest (admin/jury)
DELETE /api/v1/contests/{slug}                   # Delete contest (admin)

GET    /api/v1/contests/{slug}/tasks            # List tasks
POST   /api/v1/contests/{slug}/tasks             # Create task (admin/jury)
GET    /api/v1/contests/{slug}/registrations     # List registrations (admin)
POST   /api/v1/contests/{slug}/register          # Register team
GET    /api/v1/contests/{slug}/announcements     # List announcements
```

---

## 6. Tasks Module

### 6.1 Schemas

```python
# backend/app/schemas/task.py
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class TaskCreateRequest(BaseModel):
    slug: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = None
    problem_statement_url: Optional[str] = None
    evaluator_type: str = Field(default="output")  # output | code | hybrid
    metric_names: List[str] = ["accuracy"]
    aggregation_rule: str = "mean"  # mean | sum | max | custom
    dataset_ref: Optional[str] = None
    max_submissions: int = Field(default=100, ge=1)
    max_upload_size_mb: int = Field(default=100, ge=1)
    allowed_file_types: Optional[List[str]] = None
    submission_schema: Optional[dict] = None

class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    problem_statement_url: Optional[str] = None
    metric_names: Optional[List[str]] = None
    max_submissions: Optional[int] = None

class TaskBrief(BaseModel):
    id: UUID
    slug: str
    title: str
    evaluator_type: str
    phase_count: int

class TaskDetail(BaseModel):
    id: UUID
    contest_id: UUID
    slug: str
    title: str
    description: Optional[str]
    problem_statement_url: Optional[str]
    evaluator_type: str
    metric_names: List[str]
    aggregation_rule: str
    dataset_ref: Optional[str]
    max_submissions: int
    submission_schema: Optional[dict]
    phases: List["PhaseBrief"]
    created_at: datetime

class PhaseCreateRequest(BaseModel):
    slug: str
    title: str
    phase_type: Optional[str] = None  # public_test | final_public | private_test | final_private
    open_time: datetime
    close_time: datetime
    judging_mode: str = "output"
    submission_limit: Optional[int] = None
    leaderboard_mode: str = "best"
    display_scores: bool = True
    weight: float = 1.0

class PhaseBrief(BaseModel):
    id: UUID
    slug: str
    title: str
    phase_type: str
    open_time: datetime
    close_time: datetime
    is_active: bool

class PhaseDetail(BaseModel):
    id: UUID
    task_id: UUID
    slug: str
    title: str
    phase_type: str
    open_time: datetime
    close_time: datetime
    judging_mode: str
    submission_limit: Optional[int]
    leaderboard_mode: str
    is_frozen: bool
    display_scores: bool
    weight: float
```

### 6.2 Endpoints

```python
# Tasks endpoints
GET    /api/v1/tasks/{task_id}                   # Get task detail
PATCH  /api/v1/tasks/{task_id}                   # Update task (jury/admin)
DELETE /api/v1/tasks/{task_id}                   # Delete task (admin)

GET    /api/v1/tasks/{task_id}/phases            # List phases
POST   /api/v1/tasks/{task_id}/phases            # Create phase (jury/admin)
GET    /api/v1/tasks/{task_id}/phases/{phase_id} # Get phase detail
PATCH  /api/v1/tasks/{task_id}/phases/{phase_id} # Update phase (jury/admin)
DELETE /api/v1/tasks/{task_id}/phases/{phase_id} # Delete phase

POST   /api/v1/tasks/{task_id}/phases/{phase_id}/freeze   # Freeze phase
POST   /api/v1/tasks/{task_id}/phases/{phase_id}/unfreeze # Unfreeze phase

GET    /api/v1/tasks/{task_id}/leaderboard       # Get task leaderboard
GET    /api/v1/tasks/{task_id}/submissions       # List task submissions
```

---

## 7. Submissions Module

### 7.1 Schemas

```python
# backend/app/schemas/submission.py
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class SubmissionStatus(str, Enum):
    DRAFT = "draft"
    UPLOADED = "uploaded"
    VALIDATING = "validating"
    VALIDATION_FAILED = "validation_failed"
    QUEUED = "queued"
    RUNNING = "running"
    SCORING = "scoring"
    FINISHED = "finished"
    FAILED = "failed"
    REJUDGING = "rejudging"
    ARCHIVED = "archived"

class SubmissionCreateRequest(BaseModel):
    task_id: UUID
    phase_id: UUID
    team_id: UUID

class SubmissionFileUpload(BaseModel):
    filename: str
    content_type: str
    file_size: int
    checksum: str  # SHA256

class SubmissionResponse(BaseModel):
    id: UUID
    team_id: UUID
    task_id: UUID
    phase_id: UUID
    status: str
    submitted_at: Optional[datetime]
    file_count: int
    total_size_bytes: int
    manifest_hash: Optional[str]
    validation_result: Optional[dict]
    execution_time_ms: Optional[int]
    error_message: Optional[str]
    is_final: bool
    rejudge_count: int
    created_at: datetime

class SubmissionDetail(SubmissionResponse):
    files: List["SubmissionFileResponse"]
    scores: List["ScoreResponse"]

class SubmissionFileResponse(BaseModel):
    id: UUID
    filename: str
    file_size: int
    content_type: str
    hash_sha256: str

class ScoreResponse(BaseModel):
    metric_name: str
    raw_score: float
    display_score: float
    breakdown: Optional[dict]
    computed_at: datetime

class ScoreBreakdownResponse(BaseModel):
    submission_id: UUID
    task_id: UUID
    phase_id: UUID
    metrics: List[ScoreResponse]
    total_raw_score: float
    total_display_score: float
```

### 7.2 Endpoints

```python
# Submissions endpoints
POST   /api/v1/submissions                             # Create submission
GET    /api/v1/submissions/{submission_id}             # Get submission detail
GET    /api/v1/submissions/{submission_id}/files       # List files
GET    /api/v1/submissions/{submission_id}/score       # Get score breakdown
GET    /api/v1/submissions/{submission_id}/status      # Get status (polling)

POST   /api/v1/submissions/{submission_id}/files       # Upload file(s) [multipart]
DELETE /api/v1/submissions/{submission_id}/files/{file_id} # Delete file

GET    /api/v1/teams/{team_id}/submissions             # Team submissions
GET    /api/v1/tasks/{task_id}/submissions             # Task submissions (jury/admin)

# Real-time via WebSocket
WS     /ws/submissions/{submission_id}/status         # Live status updates
```

### 7.3 File Upload Details

```python
# File upload endpoint
@router.post(
    "/api/v1/submissions/{submission_id}/files",
    response_model=List[SubmissionFileResponse],
    open_extra_docs=True
)
async def upload_files(
    submission_id: UUID,
    files: List[UploadFile] = File(...)
):
    """
    Upload submission files.

    - Max file size: 100MB
    - Allowed types: .zip, .csv, .txt, .json, .png, .jpg, .pt, .pth, .h5
    - Max files per submission: 10
    """
    # TODO: Implement file upload to MinIO
    pass
```

---

## 8. Leaderboard Module

### 8.1 Schemas

```python
# backend/app/schemas/leaderboard.py
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class LeaderboardEntryResponse(BaseModel):
    rank: int
    team_id: UUID
    team_name: str
    raw_total: float
    display_total: float
    chosen_submission_id: Optional[UUID]
    is_frozen: bool
    is_disqualified: bool
    updated_at: datetime

class LeaderboardResponse(BaseModel):
    task_id: UUID
    phase_id: UUID
    entries: List[LeaderboardEntryResponse]
    total_teams: int
    last_updated: datetime
    is_frozen: bool

class ContestLeaderboardResponse(BaseModel):
    contest_id: UUID
    task_leaderboards: dict[UUID, LeaderboardResponse]  # task_id -> leaderboard
    overall_ranking: List[OverallRankResponse]

class OverallRankResponse(BaseModel):
    rank: int
    team_id: UUID
    team_name: str
    total_normalized_score: float
    task_scores: dict[UUID, float]  # task_id -> score
    updated_at: datetime

class LeaderboardSnapshotResponse(BaseModel):
    id: UUID
    contest_id: UUID
    task_id: Optional[UUID]
    snapshot_time: datetime
    entries: List[LeaderboardEntryResponse]
```

### 8.2 Endpoints

```python
# Leaderboard endpoints
GET    /api/v1/contests/{slug}/leaderboard           # Contest leaderboard
GET    /api/v1/contests/{slug}/leaderboard/tasks/{task_id} # Task leaderboard
GET    /api/v1/contests/{slug}/leaderboard/overall  # Overall rankings

GET    /api/v1/tasks/{task_id}/leaderboard           # Task leaderboard (alias)
GET    /api/v1/tasks/{task_id}/leaderboard/teams/{team_id} # Team position

# Admin/Jury endpoints
POST   /api/v1/contests/{slug}/leaderboard/freeze    # Freeze leaderboard
POST   /api/v1/contests/{slug}/leaderboard/unfreeze  # Unfreeze leaderboard
GET    /api/v1/contests/{slug}/leaderboard/snapshots # List snapshots
POST   /api/v1/contests/{slug}/leaderboard/snapshots # Create snapshot
GET    /api/v1/contests/{slug}/leaderboard/export    # Export leaderboard (CSV/JSON)
```

---

## 9. Clarifications & Announcements

### 9.1 Schemas

```python
# backend/app/schemas/communication.py

# === Clarifications ===
class ClarificationCreateRequest(BaseModel):
    task_id: Optional[UUID] = None
    phase_id: Optional[UUID] = None
    question: str = Field(min_length=10, max_length=2000)

class ClarificationAnswerRequest(BaseModel):
    answer: str = Field(min_length=1, max_length=2000)
    is_public: bool = False

class ClarificationResponse(BaseModel):
    id: UUID
    contest_id: UUID
    task_id: Optional[UUID]
    phase_id: Optional[UUID]
    team_id: UUID
    question: str
    answer: Optional[str]
    is_public: bool
    status: str
    asked_by: UUID
    answered_by: Optional[UUID]
    answered_at: Optional[datetime]
    created_at: datetime

# === Announcements ===
class AnnouncementCreateRequest(BaseModel):
    task_id: Optional[UUID] = None
    title: str = Field(min_length=1, max_length=500)
    content: str = Field(min_length=1)
    is_pinned: bool = False
    is_public: bool = True

class AnnouncementResponse(BaseModel):
    id: UUID
    contest_id: UUID
    task_id: Optional[UUID]
    title: str
    content: str
    is_pinned: bool
    is_public: bool
    created_by: UUID
    created_at: datetime

# === Tickets ===
class TicketCreateRequest(BaseModel):
    submission_id: Optional[UUID] = None
    category: str  # upload_error | scoring_error | queue_issue | other
    subject: str
    description: str

class TicketUpdateRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[UUID] = None
    answer: Optional[str] = None

class TicketResponse(BaseModel):
    id: UUID
    submission_id: Optional[UUID]
    team_id: UUID
    category: str
    subject: str
    description: str
    status: str
    priority: str
    assigned_to: Optional[UUID]
    created_by: UUID
    created_at: datetime
    resolved_at: Optional[datetime]
```

### 9.2 Endpoints

```python
# Clarifications
GET    /api/v1/contests/{slug}/clarifications              # List clarifications
POST   /api/v1/contests/{slug}/clarifications              # Create clarification
GET    /api/v1/clarifications/{id}                         # Get clarification
PATCH  /api/v1/clarifications/{id}                         # Answer clarification (jury)
POST   /api/v1/clarifications/{id}/make-public              # Make public (jury)

# Announcements
GET    /api/v1/contests/{slug}/announcements               # List announcements
POST   /api/v1/contests/{slug}/announcements              # Create announcement (jury/admin)
PATCH  /api/v1/announcements/{id}                          # Update announcement (jury/admin)
DELETE /api/v1/announcements/{id}                         # Delete announcement (admin)

# Tickets
GET    /api/v1/tickets                                    # My tickets
POST   /api/v1/tickets                                    # Create ticket
GET    /api/v1/tickets/{id}                               # Get ticket
PATCH  /api/v1/tickets/{id}                               # Update ticket (jury/admin)
```

---

## 10. Admin & Jury Endpoints

### 10.1 Schemas

```python
# backend/app/schemas/admin.py

class RejudgeRequest(BaseModel):
    submission_ids: Optional[List[UUID]] = None
    task_id: Optional[UUID] = None
    phase_id: Optional[UUID] = None
    reason: str

class RejudgeResponse(BaseModel):
    job_ids: List[UUID]
    total_submissions: int
    queued_at: datetime

class QueueStatsResponse(BaseModel):
    pending: int
    running: int
    completed_today: int
    failed_today: int
    avg_processing_time_ms: float

class SystemStatsResponse(BaseModel):
    total_users: int
    total_contests: int
    total_submissions: int
    active_contests: int
    submissions_today: int

class AuditLogResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    action: str
    resource_type: str
    resource_id: Optional[UUID]
    old_value: Optional[dict]
    new_value: Optional[dict]
    ip_address: Optional[str]
    created_at: datetime
```

### 10.2 Endpoints

```python
# Admin endpoints
GET    /api/v1/admin/stats                                # System statistics
GET    /api/v1/admin/queue                                # Queue status
GET    /api/v1/admin/queue/stats                           # Queue statistics
GET    /api/v1/admin/workers                             # Worker status

POST   /api/v1/admin/rejudge                              # Trigger rejudge
GET    /api/v1/admin/rejudge/jobs                         # Rejudge jobs

GET    /api/v1/admin/audit-logs                          # Audit logs
GET    /api/v1/admin/audit-logs/export                    # Export logs

# Jury endpoints
GET    /api/v1/admin/submissions/pending                  # Pending submissions
GET    /api/v1/admin/submissions/failed                   # Failed submissions
GET    /api/v1/admin/submissions/{id}/logs               # Submission evaluation logs

POST   /api/v1/admin/submissions/{id}/force-status        # Force status update
POST   /api/v1/admin/tasks/{task_id}/final-verify        # Final verification
```

---

## 11. WebSocket Events

### 11.1 Event Schemas

```python
# backend/app/schemas/websocket.py
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from enum import Enum

class WSEventType(str, Enum):
    # Submission events
    SUBMISSION_STATUS_CHANGED = "submission_status_changed"
    SUBMISSION_SCORED = "submission_scored"
    SUBMISSION_ERROR = "submission_error"

    # Leaderboard events
    LEADERBOARD_UPDATED = "leaderboard_updated"
    LEADERBOARD_FROZEN = "leaderboard_frozen"

    # Communication events
    NEW_ANNOUNCEMENT = "new_announcement"
    NEW_CLARIFICATION = "new_clarification"
    CLARIFICATION_ANSWERED = "clarification_answered"

    # Queue events
    QUEUE_STATUS_CHANGED = "queue_status_changed"

class WSMessage(BaseModel):
    event: WSEventType
    data: dict
    timestamp: datetime
    request_id: Optional[str] = None
```

### 11.2 WebSocket Endpoints

```python
# WebSocket endpoints
WS     /ws/contests/{slug}                              # Contest updates
WS     /ws/submissions/{submission_id}/status            # Submission status
WS     /ws/contests/{slug}/leaderboard                   # Leaderboard updates
WS     /ws/contests/{slug}/clarifications               # Clarification updates
```

---

## 12. Request/Response Examples

### 12.1 Create Submission

**Request:**
```http
POST /api/v1/submissions
Content-Type: application/json

{
  "task_id": "550e8400-e29b-41d4-a716-446655440001",
  "phase_id": "550e8400-e29b-41d4-a716-446655440002",
  "team_id": "550e8400-e29b-41d4-a716-446655440003"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "team_id": "550e8400-e29b-41d4-a716-446655440003",
  "task_id": "550e8400-e29b-41d4-a716-446655440001",
  "phase_id": "550e8400-e29b-41d4-a716-446655440002",
  "status": "draft",
  "file_count": 0,
  "total_size_bytes": 0,
  "rejudge_count": 0,
  "created_at": "2026-04-15T15:00:00Z"
}
```

### 12.2 Get Score Breakdown

**Request:**
```http
GET /api/v1/submissions/550e8400-e29b-41d4-a716-446655440000/score
```

**Response:**
```json
{
  "submission_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_id": "550e8400-e29b-41d4-a716-446655440001",
  "phase_id": "550e8400-e29b-41d4-a716-446655440002",
  "metrics": [
    {
      "metric_name": "accuracy",
      "raw_score": 0.9234567890,
      "display_score": 92.35,
      "breakdown": {
        "correct": 9234,
        "total": 10000
      },
      "computed_at": "2026-04-15T15:01:30Z"
    },
    {
      "metric_name": "f1_score",
      "raw_score": 0.9123456789,
      "display_score": 91.23,
      "breakdown": {
        "precision": 0.91,
        "recall": 0.92
      },
      "computed_at": "2026-04-15T15:01:30Z"
    }
  ],
  "total_raw_score": 0.9179012339,
  "total_display_score": 91.79
}
```

---

## 13. API Documentation Summary

| Module | Endpoints | Auth Required |
|--------|----------|--------------|
| Auth | 5 | No |
| Users | 6 | Yes |
| Teams | 10 | Yes |
| Contests | 8 | Partial |
| Tasks | 8 | Partial |
| Submissions | 9 | Yes |
| Leaderboard | 9 | Partial |
| Clarifications | 6 | Yes |
| Announcements | 4 | Partial |
| Tickets | 5 | Yes |
| Admin | 12 | Admin only |
| WebSocket | 4 | Yes |

**Total: ~86 endpoints**

---

## 14. Todo List

- [x] Common schemas (Error, Paginated)
- [x] Auth schemas & endpoints
- [x] Users schemas & endpoints
- [x] Teams schemas & endpoints
- [x] Contests schemas & endpoints
- [x] Tasks schemas & endpoints
- [x] Submissions schemas & endpoints
- [x] Leaderboard schemas & endpoints
- [x] Communication schemas & endpoints
- [x] Admin schemas & endpoints
- [x] WebSocket event schemas
- [ ] OpenAPI spec generation
- [ ] API documentation page
- [ ] Postman/Insomnia collection export

---

## 15. Success Criteria

1. **All endpoints defined with request/response models**
2. **Pydantic validation rules implemented**
3. **Error handling standardized**
4. **WebSocket events documented**
5. **API docs auto-generated via OpenAPI**

---

## 16. Next Steps

→ Phase 3: Worker Architecture (Judging Pipeline)