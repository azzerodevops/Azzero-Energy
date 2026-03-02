"""File-based job store for cross-worker job state persistence.

Stores each job as a JSON file in /tmp/azzeroco2_jobs/ so that multiple
uvicorn workers can share job state.  Uses fcntl.flock for safe concurrent
read/write access.

Usage:
    from utils.job_store import set_job, get_job, update_job

    set_job("abc-123", {"status": "queued", "scenario_id": "s1"})
    update_job("abc-123", {"status": "running"})
    job = get_job("abc-123")   # -> dict | None
"""

from __future__ import annotations

import fcntl
import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_JOBS_DIR = Path("/tmp/azzeroco2_jobs")


def _ensure_dir() -> None:
    _JOBS_DIR.mkdir(parents=True, exist_ok=True)


def _job_path(job_id: str) -> Path:
    # Sanitise: only allow alphanumerics and hyphens in the filename
    safe_id = "".join(c for c in job_id if c.isalnum() or c == "-")
    return _JOBS_DIR / f"{safe_id}.json"


def set_job(job_id: str, data: dict[str, Any]) -> None:
    """Create or overwrite a job entry."""
    _ensure_dir()
    path = _job_path(job_id)
    with open(path, "w") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            json.dump(data, f)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)


def get_job(job_id: str) -> dict[str, Any] | None:
    """Read a job entry. Returns None if the job does not exist."""
    path = _job_path(job_id)
    if not path.exists():
        return None
    try:
        with open(path, "r") as f:
            fcntl.flock(f, fcntl.LOCK_SH)
            try:
                return json.load(f)
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to read job %s: %s", job_id, exc)
        return None


def update_job(job_id: str, updates: dict[str, Any]) -> None:
    """Merge *updates* into an existing job entry (read-modify-write)."""
    _ensure_dir()
    path = _job_path(job_id)
    with open(path, "a+") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            f.seek(0)
            content = f.read()
            existing = json.loads(content) if content else {}
            existing.update(updates)
            f.seek(0)
            f.truncate()
            json.dump(existing, f)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)
