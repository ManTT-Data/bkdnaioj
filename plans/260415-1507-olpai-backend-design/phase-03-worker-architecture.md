# Phase 3: Worker Architecture cho Judging Pipeline

**Status:** ⏳ In Progress
**File:** `phase-03-worker-architecture.md`

---

## 1. Worker Architecture Overview

### 1.1 High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND API                                   │
│                    (FastAPI + Celery as producer)                       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │      REDIS            │
                    │  ┌─────────────────┐ │
                    │  │ Priority Queues │ │
                    │  ├─────────────────┤ │
                    │  │ P0: judging     │ │
                    │  │ P1: rejudge     │ │
                    │  │ P2: batch       │ │
                    │  └─────────────────┘ │
                    │  ┌─────────────────┐ │
                    │  │ Result Backend   │ │
                    │  │ (persistent)    │ │
                    │  └─────────────────┘ │
                    └───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   VALIDATOR   │      │   EXECUTOR    │      │    SCORER     │
│   WORKER      │      │   WORKER      │      │   WORKER      │
│               │      │               │      │               │
│ CPU-only      │      │ CPU/GPU       │      │ CPU-only      │
│ - File check  │──────│ - Docker      │──────│ - Metrics     │
│ - Schema      │      │   sandbox     │      │ - Aggregation │
│ - Hash gen    │      │ - Inference   │      │ - Ranking     │
└───────────────┘      └───────────────┘      └───────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │       MINIO           │
                    │  (Object Storage)     │
                    │                       │
                    │  submissions/         │
                    │  datasets/            │
                    │  outputs/             │
                    │  logs/                │
                    └───────────────────────┘
```

### 1.2 Queue Design

| Queue Name | Priority | Workers | Purpose |
|------------|----------|---------|---------|
| `celery.validate` | P0 | 1-2 | File validation |
| `celery.execute` | P0 | 1-N (CPU/GPU) | Code execution |
| `celery.score` | P0 | 1-2 | Metric calculation |
| `celery.rejudge` | P1 | 1 | Rejudge requests |
| `celery.batch` | P2 | 1 | Batch operations |

---

## 2. Celery Configuration

### 2.1 Celery App Setup

```python
# backend/app/workers/celery_app.py
from celery import Celery
from celery.schedules import crontab

# Broker & Result Backend
CELERY_BROKER_URL = "redis://localhost:6379/0"
CELERY_RESULT_BACKEND = "redis://localhost:6379/1"

# Create Celery app
celery_app = Celery(
    "olpai",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=[
        "app.workers.tasks.validate",
        "app.workers.tasks.execute",
        "app.workers.tasks.score",
        "app.workers.tasks.rejudge",
    ]
)

# Queue routing
celery_app.conf.task_routes = {
    "validate_*": {"queue": "celery.validate"},
    "execute_*": {"queue": "celery.execute"},
    "score_*": {"queue": "celery.score"},
    "rejudge_*": {"queue": "celery.rejudge"},
    "batch_*": {"queue": "celery.batch"},
}

# Task priorities
celery_app.conf.task_default_priority = 5
celery_app.conf.task_acks_late = True  # Ack after completion
celery_app.conf.task_reject_on_worker_lost = True

# Result expiration (24 hours)
celery_app.conf.result_expires = 86400

# Worker concurrency
celery_app.conf.worker_prefetch_multiplier = 1  # Fair distribution
celery_app.conf.worker_max_tasks_per_child = 100  # Restart after N tasks

# Beat schedule (for periodic tasks)
celery_app.conf.beat_schedule = {
    "cleanup-old-jobs": {
        "task": "cleanup_stale_jobs",
        "schedule": crontab(minute="*/30"),
    },
    "sync-leaderboard": {
        "task": "sync_leaderboard",
        "schedule": crontab(second=0),
    },
}
```

### 2.2 Worker Startup Commands

```bash
# Validator worker (CPU)
celery -A app.workers.celery_app worker \
    --queues=celery.validate \
    --concurrency=2 \
    --hostname=validator@%h

# Executor worker (CPU)
celery -A app.workers.celery_app worker \
    --queues=celery.execute \
    --concurrency=2 \
    --hostname=executor-cpu@%h

# Executor worker (GPU)
celery -A app.workers.celery_app worker \
    --queues=celery.execute \
    --concurrency=1 \
    --hostname=executor-gpu@%h \
    --env=GPU_ENABLED=1

# Scorer worker (CPU)
celery -A app.workers.celery_app worker \
    --queues=celery.score \
    --concurrency=4 \
    --hostname=scorer@%h

# Rejudge worker
celery -A app.workers.celery_app worker \
    --queues=celery.rejudge \
    --concurrency=1 \
    --hostname=rejudge@%h
```

---

## 3. Metric Plugin System

### 3.1 Plugin Interface

```python
# backend/app/workers/plugins/base_metric.py
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, List, Dict
import numpy as np

@dataclass
class MetricInput:
    """Input data for metric calculation"""
    predictions: Any          # Model outputs / submitted files
    ground_truth: Any         # Reference answers
    metadata: Dict[str, Any]   # Additional context

@dataclass
class MetricResult:
    """Result from metric calculation"""
    name: str
    raw_score: float
    display_score: float
    breakdown: Dict[str, Any]
    individual_scores: List[float]  # Per-sample scores

class BaseMetric(ABC):
    """Abstract base class for all metric plugins"""

    name: str = "base_metric"
    display_name: str = "Base Metric"
    category: str = "general"
    lower_is_better: bool = False

    @abstractmethod
    def compute(
        self,
        predictions: Any,
        ground_truth: Any,
        **kwargs
    ) -> MetricResult:
        """
        Compute the metric score.

        Args:
            predictions: Model outputs or submitted files
            ground_truth: Reference ground truth data

        Returns:
            MetricResult with score and breakdown
        """
        pass

    def validate_input(self, predictions: Any, ground_truth: Any) -> bool:
        """Validate input data before computation"""
        return predictions is not None and ground_truth is not None

    def aggregate(self, scores: List[float]) -> float:
        """Aggregate individual scores to single score"""
        return float(np.mean(scores))
```

### 3.2 Accuracy Metric

```python
# backend/app/workers/plugins/classification_metrics.py
import numpy as np
from typing import Any, List, Dict
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from .base_metric import BaseMetric, MetricInput, MetricResult

class AccuracyMetric(BaseMetric):
    """Accuracy metric for classification tasks"""

    name = "accuracy"
    display_name = "Accuracy"
    category = "classification"

    def compute(
        self,
        predictions: Any,
        ground_truth: Any,
        **kwargs
    ) -> MetricResult:
        # Convert to numpy arrays
        y_pred = np.array(predictions).flatten()
        y_true = np.array(ground_truth).flatten()

        # Calculate accuracy
        raw_acc = accuracy_score(y_true, y_pred)

        # Per-sample accuracy
        individual = (y_pred == y_true).astype(float).tolist()

        # Breakdown by class
        breakdown = {
            "correct": int((y_pred == y_true).sum()),
            "total": len(y_true),
            "per_class_accuracy": self._per_class_accuracy(y_true, y_pred)
        }

        return MetricResult(
            name=self.name,
            raw_score=raw_acc,
            display_score=round(raw_acc * 100, 4),
            breakdown=breakdown,
            individual_scores=individual
        )

    def _per_class_accuracy(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[int, float]:
        """Calculate accuracy per class"""
        classes = np.unique(y_true)
        return {
            int(c): float(np.mean((y_true == c) & (y_pred == c)) /
                        max(1, np.sum(y_true == c)))
            for c in classes
        }


class F1ScoreMetric(BaseMetric):
    """F1-Score metric (macro, micro, weighted)"""

    name = "f1_score"
    display_name = "F1 Score"
    category = "classification"

    def __init__(self, average: str = "macro"):
        super().__init__()
        self.average = average  # 'macro', 'micro', 'weighted'

    def compute(
        self,
        predictions: Any,
        ground_truth: Any,
        **kwargs
    ) -> MetricResult:
        y_pred = np.array(predictions).flatten()
        y_true = np.array(ground_truth).flatten()

        f1 = f1_score(y_true, y_pred, average=self.average, zero_division=0)
        precision = precision_score(y_true, y_pred, average=self.average, zero_division=0)
        recall = recall_score(y_true, y_pred, average=self.average, zero_division=0)

        breakdown = {
            "f1": f1,
            "precision": precision,
            "recall": recall,
            "average": self.average
        }

        return MetricResult(
            name=self.name,
            raw_score=f1,
            display_score=round(f1 * 100, 4),
            breakdown=breakdown,
            individual_scores=[f1]  # F1 is per-dataset, not per-sample
        )
```

### 3.3 NLP Metrics (BLEU, Cosine Similarity)

```python
# backend/app/workers/plugins/nlp_metrics.py
import numpy as np
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .base_metric import BaseMetric, MetricResult

class BLEUMetric(BaseMetric):
    """BLEU Score for text generation tasks"""

    name = "bleu"
    display_name = "BLEU Score"
    category = "nlp"

    def __init__(self, max_n: int = 4, smooth: bool = True):
        super().__init__()
        self.max_n = max_n
        self.smooth = smooth

    def compute(
        self,
        predictions: List[str],
        ground_truth: List[str],
        **kwargs
    ) -> MetricResult:
        try:
            from sacrebleu import sentence_bleu
        except ImportError:
            raise ImportError("Please install sacrebleu: pip install sacrebleu")

        individual_scores = []
        breakdowns = []

        for pred, ref in zip(predictions, ground_truth):
            result = sentence_bleu(pred, [ref], smooth=self.smooth)
            individual_scores.append(result.score / 100.0)
            breakdowns.append({
                "score": result.score,
                "bp": result.bp,  # brevity penalty
                "counts": result.counts,
                "totals": result.totals
            })

        raw_score = self.aggregate(individual_scores)

        return MetricResult(
            name=self.name,
            raw_score=raw_score,
            display_score=round(raw_score * 100, 4),
            breakdown={"individual_count": len(individual_scores)},
            individual_scores=individual_scores
        )


class CosineSimilarityMetric(BaseMetric):
    """Cosine Similarity for embedding-based tasks"""

    name = "cosine_similarity"
    display_name = "Cosine Similarity"
    category = "similarity"

    def compute(
        self,
        predictions: List[np.ndarray],
        ground_truth: List[np.ndarray],
        **kwargs
    ) -> MetricResult:
        individual_scores = []

        for pred_emb, gt_emb in zip(predictions, ground_truth):
            # Ensure 2D arrays
            pred_emb = np.array(pred_emb).reshape(1, -1)
            gt_emb = np.array(gt_emb).reshape(1, -1)

            sim = cosine_similarity(pred_emb, gt_emb)[0, 0]
            individual_scores.append(float(sim))

        raw_score = self.aggregate(individual_scores)

        return MetricResult(
            name=self.name,
            raw_score=raw_score,
            display_score=round(raw_score, 6),
            breakdown={
                "min": min(individual_scores),
                "max": max(individual_scores),
                "std": float(np.std(individual_scores))
            },
            individual_scores=individual_scores
        )
```

### 3.4 Image Metrics (PSNR, MSE)

```python
# backend/app/workers/plugins/image_metrics.py
import numpy as np
from typing import List, Dict
from .base_metric import BaseMetric, MetricResult

class PSNRMetric(BaseMetric):
    """Peak Signal-to-Noise Ratio for image quality"""

    name = "psnr"
    display_name = "PSNR"
    category = "image"
    lower_is_better = False

    def compute(
        self,
        predictions: List[np.ndarray],
        ground_truth: List[np.ndarray],
        **kwargs
    ) -> MetricResult:
        individual_scores = []

        for pred_img, gt_img in zip(predictions, ground_truth):
            pred_img = np.array(pred_img).astype(np.float64)
            gt_img = np.array(gt_img).astype(np.float64)

            # MSE calculation
            mse = np.mean((pred_img - gt_img) ** 2)

            # PSNR calculation (handle edge case)
            if mse == 0:
                psnr = 100.0  # Identical images
            else:
                max_pixel = 255.0 if pred_img.max() > 1 else 1.0
                psnr = 20 * np.log10(max_pixel / np.sqrt(mse))

            individual_scores.append(psnr)

        raw_score = self.aggregate(individual_scores)

        return MetricResult(
            name=self.name,
            raw_score=raw_score,
            display_score=round(raw_score, 4),
            breakdown={"mse_avg": float(np.mean([s**2 / 255**2 * 10**((100 - s) / 20) ** 2 for s in individual_scores]))},
            individual_scores=individual_scores
        )


class MAEMetric(BaseMetric):
    """Mean Absolute Error for regression tasks"""

    name = "mae"
    display_name = "MAE"
    category = "regression"
    lower_is_better = True

    def compute(
        self,
        predictions: List[np.ndarray],
        ground_truth: List[np.ndarray],
        **kwargs
    ) -> MetricResult:
        individual_scores = []

        for pred, gt in zip(predictions, ground_truth):
            pred = np.array(pred).flatten()
            gt = np.array(gt).flatten()
            mae = np.mean(np.abs(pred - gt))
            individual_scores.append(float(mae))

        raw_score = self.aggregate(individual_scores)

        return MetricResult(
            name=self.name,
            raw_score=raw_score,
            display_score=round(raw_score, 6),
            breakdown={
                "min": min(individual_scores),
                "max": max(individual_scores)
            },
            individual_scores=individual_scores
        )
```

### 3.5 Plugin Registry

```python
# backend/app/workers/plugins/registry.py
from typing import Dict, Type
from .base_metric import BaseMetric
from .classification_metrics import AccuracyMetric, F1ScoreMetric
from .nlp_metrics import BLEUMetric, CosineSimilarityMetric
from .image_metrics import PSNRMetric, MAEMetric

METRIC_REGISTRY: Dict[str, Type[BaseMetric]] = {
    "accuracy": AccuracyMetric,
    "f1_score": F1ScoreMetric,
    "bleu": BLEUMetric,
    "cosine_similarity": CosineSimilarityMetric,
    "psnr": PSNRMetric,
    "mae": MAEMetric,
}

def get_metric(metric_name: str, **kwargs) -> BaseMetric:
    """Get metric instance by name"""
    if metric_name not in METRIC_REGISTRY:
        raise ValueError(f"Unknown metric: {metric_name}")
    return METRIC_REGISTRY[metric_name](**kwargs)

def list_available_metrics() -> Dict[str, str]:
    """List all available metrics"""
    return {name: metric.display_name for name, metric in METRIC_REGISTRY.items()}
```

---

## 4. Validator Tasks

### 4.1 Validation Pipeline

```python
# backend/app/workers/tasks/validate.py
import hashlib
import zipfile
from pathlib import Path
from typing import List, Dict, Any, Optional
from uuid import UUID
from celery import Task
from pydantic import BaseModel

# Celery shared task
from app.workers.celery_app import celery_app

class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []
    manifest_hash: Optional[str] = None
    file_count: int = 0
    total_size_bytes: int = 0


@celery_app.task(bind=True, name="validate_submission", max_retries=3)
def validate_submission(self, submission_id: str, schema_config: Dict[str, Any]):
    """
    Validate submission files against task schema.

    Steps:
    1. Download files from MinIO
    2. Check file types
    3. Check required files exist
    4. Validate file formats (CSV, JSON, etc.)
    5. Generate manifest hash
    """
    try:
        # 1. Get submission files from MinIO
        files = download_submission_files(submission_id)

        # 2. Get task schema
        schema = schema_config

        # 3. Validation checks
        errors = []
        file_data = []

        for file_info in files:
            filename = file_info["filename"]
            file_path = file_info["path"]

            # Check file type
            allowed_types = schema.get("allowed_file_types", [])
            if allowed_types and not any(filename.endswith(ext) for ext in allowed_types):
                errors.append(f"File type not allowed: {filename}")

            # Check file size
            max_size = schema.get("max_file_size_mb", 100) * 1024 * 1024
            if file_info["size"] > max_size:
                errors.append(f"File too large: {filename} ({file_info['size']} bytes)")

            # Validate specific formats
            if filename.endswith(".csv"):
                validation_error = validate_csv_format(file_path, schema.get("csv_schema"))
                if validation_error:
                    errors.append(f"CSV validation error for {filename}: {validation_error}")

            elif filename.endswith(".json"):
                validation_error = validate_json_format(file_path)
                if validation_error:
                    errors.append(f"JSON validation error for {filename}: {validation_error}")

            file_data.append({
                "filename": filename,
                "size": file_info["size"],
                "hash": file_info["hash"]
            })

        # 4. Check required files
        required_files = schema.get("required_files", [])
        uploaded_filenames = [f["filename"] for f in file_data]
        for required in required_files:
            if required not in uploaded_filenames:
                errors.append(f"Missing required file: {required}")

        # 5. Generate manifest hash
        manifest_data = {
            "submission_id": submission_id,
            "files": sorted(file_data, key=lambda x: x["filename"])
        }
        manifest_hash = hashlib.sha256(
            str(manifest_data).encode()
        ).hexdigest()

        result = ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            manifest_hash=manifest_hash,
            file_count=len(files),
            total_size_bytes=sum(f["size"] for f in file_data)
        )

        # Update submission in DB
        update_submission_validation(submission_id, result)

        return result.model_dump()

    except Exception as e:
        self.retry(exc=e, countdown=60)


def validate_csv_format(file_path: str, csv_schema: Optional[Dict]) -> Optional[str]:
    """Validate CSV file format"""
    import csv

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

            if csv_schema:
                # Check required columns
                if "columns" in csv_schema:
                    required_cols = set(csv_schema["columns"])
                    actual_cols = set(rows[0].keys()) if rows else set()
                    missing = required_cols - actual_cols
                    if missing:
                        return f"Missing columns: {missing}"

                # Check row count
                if "min_rows" in csv_schema and len(rows) < csv_schema["min_rows"]:
                    return f"Too few rows: {len(rows)} < {csv_schema['min_rows']}"

        return None
    except Exception as e:
        return str(e)


def validate_json_format(file_path: str) -> Optional[str]:
    """Validate JSON file format"""
    import json

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            json.load(f)
        return None
    except json.JSONDecodeError as e:
        return f"Invalid JSON: {e}"
```

---

## 5. Executor Tasks (Docker Sandbox)

### 5.1 Docker Sandbox Architecture

```python
# backend/app/workers/tasks/execute.py
import docker
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
from celery import Task

celery_app = Task("execute_submission")

# Docker client
docker_client = docker.from_env()


class DockerSandbox:
    """Docker sandbox for code execution"""

    def __init__(
        self,
        image: str = "python:3.10-slim",
        timeout: int = 300,
        memory: str = "4g",
        cpu_period: int = 100000,
        cpu_quota: int = 200000  # 2 cores
    ):
        self.image = image
        self.timeout = timeout
        self.memory = memory
        self.cpu_period = cpu_period
        self.cpu_quota = cpu_quota

    def run(
        self,
        command: str,
        input_data_path: str,
        output_path: str,
        working_dir: str = "/workspace"
    ) -> Dict[str, Any]:
        """Execute code in Docker container"""

        volumes = {
            input_data_path: {"bind": "/input", "mode": "ro"},
            output_path: {"bind": "/output", "mode": "rw"}
        }

        try:
            container = docker_client.containers.run(
                self.image,
                command=f"sh -c '{command}'",
                volumes=volumes,
                working_dir=working_dir,
                mem_limit=self.memory,
                cpu_period=self.cpu_period,
                cpu_quota=self.cpu_quota,
                network_mode="none",  # No network access
                read_only=True,  # Read-only filesystem
                tmpfs={"/tmp": "size=1g"},  # Writable /tmp
                detach=True,
                remove=False
            )

            # Wait for completion with timeout
            result = container.wait(timeout=self.timeout)

            logs = container.logs().decode('utf-8')

            return {
                "success": result["StatusCode"] == 0,
                "exit_code": result["StatusCode"],
                "logs": logs,
                "container_id": container.short_id
            }

        except docker.errors.Timeout:
            container.kill()
            return {
                "success": False,
                "error": "Execution timeout",
                "exit_code": -1
            }

        finally:
            try:
                container.remove(force=True)
            except:
                pass


@celery_app.task(bind=True, name="execute_submission", max_retries=2)
def execute_submission(
    self,
    submission_id: str,
    task_config: Dict[str, Any],
    test_data_path: str
):
    """
    Execute code submission in Docker sandbox.

    Steps:
    1. Download submission code from MinIO
    2. Extract to temp directory
    3. Mount test data (read-only)
    4. Run inference script in Docker
    5. Collect output files
    6. Upload outputs to MinIO
    """
    sandbox = DockerSandbox(
        image=task_config.get("execution_image", "python:3.10-slim"),
        timeout=task_config.get("timeout_seconds", 300)
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        submission_path = Path(tmpdir) / "submission"
        output_path = Path(tmpdir) / "output"
        output_path.mkdir()

        # 1. Download and extract submission
        download_submission_code(submission_id, submission_path)

        # 2. Get inference command from task config
        inference_cmd = task_config.get("inference_command", "python run.py")

        # 3. Execute in sandbox
        result = sandbox.run(
            command=inference_cmd,
            input_data_path=str(test_data_path),
            output_path=str(output_path)
        )

        if result["success"]:
            # 4. Upload outputs to MinIO
            output_files = list(output_path.glob("*"))
            upload_submission_outputs(submission_id, output_files)

            return {
                "success": True,
                "output_files": [f.name for f in output_files],
                "logs": result["logs"]
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Execution failed"),
                "logs": result["logs"]
            }
```

---

## 6. Scorer Tasks

### 6.1 Scoring Pipeline

```python
# backend/app/workers/tasks/score.py
from typing import Dict, Any, List
from celery import Task
from app.workers.celery_app import celery_app
from app.workers.plugins.registry import get_metric

@celery_app.task(bind=True, name="score_submission", max_retries=3)
def score_submission(
    self,
    submission_id: str,
    task_metrics: List[str],
    ground_truth_path: str,
    predictions_path: str,
    aggregation_rule: str = "mean"
):
    """
    Score submission using configured metrics.

    Steps:
    1. Load ground truth from path
    2. Load predictions from submission
    3. For each metric:
        a. Load metric plugin
        b. Compute score
        c. Save to database
    4. Aggregate scores
    5. Update leaderboard
    6. Notify via WebSocket
    """
    results = []

    for metric_name in task_metrics:
        try:
            # Get metric instance
            metric = get_metric(metric_name)

            # Load data
            predictions = load_predictions(predictions_path, metric.name)
            ground_truth = load_ground_truth(ground_truth_path, metric.name)

            # Compute metric
            result = metric.compute(predictions, ground_truth)

            # Save score to database
            save_metric_score(submission_id, result)

            results.append(result)

        except Exception as e:
            # Log error but continue with other metrics
            log_metric_error(submission_id, metric_name, str(e))

    # Aggregate scores
    if results:
        raw_total = aggregate_scores(results, aggregation_rule)
        display_total = compute_display_score(raw_total, task_metrics[0])

        # Save final score
        save_final_score(submission_id, raw_total, display_total)

        # Update leaderboard
        update_leaderboard_entry(submission_id)

        # Notify via WebSocket
        notify_submission_scored(submission_id, raw_total, display_total)

        return {
            "submission_id": submission_id,
            "metrics": [r.name for r in results],
            "raw_total": raw_total,
            "display_total": display_total
        }

    return {"submission_id": submission_id, "error": "No metrics computed"}


def aggregate_scores(results: List, rule: str) -> float:
    """Aggregate multiple metric scores"""
    import numpy as np

    raw_scores = [r.raw_score for r in results]

    if rule == "mean":
        return float(np.mean(raw_scores))
    elif rule == "sum":
        return float(np.sum(raw_scores))
    elif rule == "max":
        return float(np.max(raw_scores))
    elif rule == "min":
        return float(np.min(raw_scores))
    elif rule.startswith("weighted:"):
        # Parse weighted rule: "weighted:0.5,0.3,0.2"
        weights = [float(w) for w in rule.split(":")[1].split(",")]
        return float(np.average(raw_scores, weights=weights))
    else:
        return float(np.mean(raw_scores))
```

---

## 7. Rejudge System

### 7.1 Rejudge Task

```python
# backend/app/workers/tasks/rejudge.py
from typing import List, Dict, Any, Optional
from celery import Task, group
from app.workers.celery_app import celery_app

@celery_app.task(bind=True, name="rejudge_submissions")
def rejudge_submissions(
    self,
    submission_ids: Optional[List[str]] = None,
    task_id: Optional[str] = None,
    phase_id: Optional[str] = None,
    reason: str = "Manual rejudge"
) -> Dict[str, Any]:
    """
    Rejudge submissions with new metric or code.

    Options:
    - submission_ids: Specific submissions to rejudge
    - task_id: All submissions for a task
    - phase_id: All submissions for a phase
    """
    # Get submission IDs
    if submission_ids:
        ids_to_rejudge = submission_ids
    elif task_id:
        ids_to_rejudge = get_submissions_by_task(task_id)
    elif phase_id:
        ids_to_rejudge = get_submissions_by_phase(phase_id)
    else:
        return {"error": "Must specify submission_ids, task_id, or phase_id"}

    # Create rejudge jobs
    job_group = group(
        rejudge_single_submission.s(sid, reason)
        for sid in ids_to_rejudge
    )

    # Execute in parallel
    result = job_group.apply_async()

    return {
        "total_submissions": len(ids_to_rejudge),
        "group_id": str(result),
        "reason": reason
    }


@celery_app.task(bind=True, name="rejudge_single_submission", max_retries=3)
def rejudge_single_submission(
    self,
    submission_id: str,
    reason: str
) -> Dict[str, Any]:
    """Rejudge a single submission"""

    # Update submission status
    update_submission_status(submission_id, "rejudging")

    # Record in audit log
    create_audit_log(
        action="rejudge",
        resource_type="submission",
        resource_id=submission_id,
        new_value={"reason": reason}
    )

    try:
        # Get submission details
        submission = get_submission(submission_id)
        task = get_task(submission.task_id)
        phase = get_phase(submission.phase_id)

        # Run validation
        if submission.status == "finished":
            # Skip validation if already valid
            pass

        # Re-score
        score_result = score_submission(
            submission_id=submission_id,
            task_metrics=task.metric_names,
            ground_truth_path=task.dataset_ref,
            predictions_path=submission.files_path,
            aggregation_rule=task.aggregation_rule
        )

        # Update rejudge count
        increment_rejudge_count(submission_id)

        return {
            "submission_id": submission_id,
            "success": True,
            "new_score": score_result.get("raw_total")
        }

    except Exception as e:
        update_submission_status(submission_id, "failed", str(e))
        raise self.retry(exc=e, countdown=120)
```

---

## 8. Task Dependencies & Flow

### 8.1 Task Chain

```python
# backend/app/workers/pipelines/judging_pipeline.py
from celery import chain, group
from app.workers.tasks.validate import validate_submission
from app.workers.tasks.execute import execute_submission
from app.workers.tasks.score import score_submission

def create_judging_pipeline(submission_id: str, task_config: Dict):
    """
    Create the complete judging pipeline.

    Pipeline:
    1. validate_submission (P0)
    2. execute_submission (if code-based) OR skip (if output-based)
    3. score_submission (P0)
    4. update_leaderboard (sync)
    """

    if task_config["evaluator_type"] == "output":
        # Output-based: validate -> score
        return chain(
            validate_submission.s(task_config.get("schema")),
            score_submission.s(
                task_config["metric_names"],
                task_config["ground_truth_path"],
                task_config["predictions_path"],
                task_config["aggregation_rule"]
            )
        ).apply_async()

    elif task_config["evaluator_type"] == "code":
        # Code-based: validate -> execute -> score
        return chain(
            validate_submission.s(task_config.get("schema")),
            execute_submission.s(task_config),
            score_submission.s(
                task_config["metric_names"],
                task_config["ground_truth_path"],
                task_config["predictions_path"],
                task_config["aggregation_rule"]
            )
        ).apply_async()

    else:
        raise ValueError(f"Unknown evaluator type: {task_config['evaluator_type']}")
```

### 8.2 Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     JUDGING PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                                               │
│  │  SUBMISSION │                                               │
│  │   RECEIVED  │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐     ┌─────────────────┐                     │
│  │   UPDATE     │────►│  VALIDATOR TASK  │                     │
│  │   STATUS     │     │  (celery.validate)│                     │
│  └──────────────┘     └────────┬────────┘                     │
│                                │                               │
│                    ┌───────────┴───────────┐                   │
│                    │                       │                   │
│               ┌────▼────┐           ┌─────▼─────┐            │
│               │  FAIL  │           │   PASS    │             │
│               │        │           │           │             │
│               └────┬────┘           │           ▼             │
│                    │                │    ┌──────────────┐     │
│                    │                │    │ UPDATE       │     │
│                    │                │    │ STATUS       │     │
│                    │                │    └──────┬───────┘     │
│                    │                │           │             │
│                    │                │           ▼             │
│                    │                │   ┌───────────────┐     │
│                    │                │   │  EVAL TYPE    │     │
│                    │                │   └───────┬───────┘     │
│                    │                │           │             │
│         ┌──────────┴──────────┐     │           │             │
│         │                     │     │     ┌──────▼──────┐     │
│    ┌────▼─────┐          ┌────▼──────▼────▼────┐           │
│    │  OUTPUT  │          │      CODE           │           │
│    │  BASED   │          │      BASED          │           │
│    └────┬─────┘          └──────┬──────────────┘           │
│         │                       │                             │
│         │                       ▼                             │
│         │              ┌────────────────┐                     │
│         │              │   EXECUTOR     │                     │
│         │              │  TASK (Docker) │                     │
│         │              └───────┬────────┘                     │
│         │                      │                               │
│         └──────────┬──────────┘                               │
│                    │                                          │
│                    ▼                                          │
│           ┌────────────────┐                                 │
│           │   SCORER TASK   │                                 │
│           │ (celery.score)  │                                 │
│           │                 │                                 │
│           │  - Metric 1     │                                 │
│           │  - Metric 2     │                                 │
│           │  - Aggregate    │                                 │
│           └───────┬──────────┘                                 │
│                   │                                            │
│                   ▼                                            │
│           ┌────────────────┐                                  │
│           │  SAVE SCORES   │                                  │
│           │  TO DATABASE   │                                  │
│           └───────┬─────────┘                                  │
│                   │                                            │
│                   ▼                                            │
│           ┌────────────────┐                                  │
│           │ UPDATE LEADER   │                                  │
│           │ BOARD ENTRIES  │                                  │
│           └───────┬─────────┘                                  │
│                   │                                            │
│                   ▼                                            │
│           ┌────────────────┐                                  │
│           │ NOTIFY VIA WS   │                                  │
│           └───────┬─────────┘                                  │
│                   │                                            │
│                   ▼                                            │
│           ┌────────────────┐                                  │
│           │  FINISHED      │                                  │
│           └────────────────┘                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## 9. Monitoring & Health Check

### 9.1 Flower Configuration

```bash
# Install Flower for monitoring
pip install flower

# Run Flower
celery -A app.workers.celery_app flower --port=5555
```

### 9.2 Health Check Endpoint

```python
# backend/app/apps/admin/health.py
from fastapi import APIRouter
from celery.events.state import State
from app.workers.celery_app import celery_app

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/workers")
async def get_workers_status():
    """Get status of all Celery workers"""
    inspector = celery_app.control.inspect()

    active = inspector.active()
    stats = inspector.stats()
    registered = inspector.registered()

    return {
        "workers": {
            name: {
                "status": "active" if name in active else "idle",
                "active_tasks": active.get(name, []),
                "processed": stats.get(name, {}).get("total", {}),
            }
            for name in stats.keys()
        },
        "total_workers": len(stats),
        "queues": registered
    }

@router.get("/queue")
async def get_queue_stats():
    """Get queue statistics"""
    inspector = celery_app.control.inspect()

    active = inspector.active()
    reserved = inspector.reserved()

    return {
        "pending": len(reserved) if reserved else 0,
        "running": sum(len(tasks) for tasks in active.values()) if active else 0,
    }
```

---

## 10. Directory Structure

```
backend/
├── app/
│   ├── workers/
│   │   ├── celery_app.py           # Celery config
│   │   ├── tasks/
│   │   │   ├── __init__.py
│   │   │   ├── validate.py         # Validation tasks
│   │   │   ├── execute.py          # Execution tasks
│   │   │   ├── score.py           # Scoring tasks
│   │   │   └── rejudge.py         # Rejudge tasks
│   │   ├── plugins/
│   │   │   ├── __init__.py
│   │   │   ├── registry.py         # Plugin registry
│   │   │   ├── base_metric.py     # Base class
│   │   │   ├── classification_metrics.py
│   │   │   ├── nlp_metrics.py
│   │   │   └── image_metrics.py
│   │   └── pipelines/
│   │       └── judging_pipeline.py  # Pipeline orchestration
│   └── ...
└── alembic/
    └── versions/
```

---

## 11. Todo List

- [x] Celery configuration
- [x] Queue design
- [x] Worker startup commands
- [x] Metric plugin base class
- [x] Accuracy/F1 metrics
- [x] BLEU/Cosine metrics
- [x] PSNR/MSE metrics
- [x] Plugin registry
- [x] Validator tasks
- [x] Executor tasks (Docker sandbox)
- [x] Scorer tasks
- [x] Rejudge system
- [x] Pipeline orchestration
- [x] Monitoring (Flower + health check)

---

## 12. Success Criteria

1. **Workers can be started independently**
2. **Metric plugins are discoverable and pluggable**
3. **Submission state machine is correctly implemented**
4. **Docker sandbox is isolated and secure**
5. **Rejudge respects audit trail**
6. **Queue monitoring is functional**

---

## 13. Open Questions

1. GPU worker management - how to handle GPU allocation?
2. Metric plugin hot-reload - reload new metrics without restart?
3. Test data protection - how to prevent data leakage?
4. Worker autoscaling - auto-scale based on queue depth?