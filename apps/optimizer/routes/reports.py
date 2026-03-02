"""Report generation API routes.

Job state is persisted to /tmp/azzeroco2_jobs/ via utils.job_store so that
multiple uvicorn workers can share state (BUG-001 fix).
"""

from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

from db.client import get_supabase_client
from report.data import fetch_report_data
from report.docx_gen import generate_docx
from report.xlsx_gen import generate_xlsx
from report.pptx_gen import generate_pptx
from report.models import ReportRequest, ReportResponse  # noqa: F401 — used by API docs
from utils.job_store import set_job, get_job, update_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/report", tags=["report"])

MIME_TYPES = {
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

SUPPORTED_FORMATS = {"docx", "xlsx", "pptx"}


def _run_generation(
    job_id: str, analysis_id: str, scenario_id: str, fmt: str = "docx"
) -> None:
    """Background task to generate a report in the requested format."""
    try:
        update_job(job_id, {"status": "generating"})

        client = get_supabase_client()

        # 1. Fetch data
        data = fetch_report_data(client, analysis_id, scenario_id)

        # 2. Generate based on format
        if fmt == "xlsx":
            output_path = generate_xlsx(data)
        elif fmt == "pptx":
            output_path = generate_pptx(data)
        else:
            output_path = generate_docx(data)

        update_job(job_id, {
            "status": "completed",
            "file_path": str(output_path),
            "file_name": output_path.name,
            "format": fmt,
        })

        # 3. Save record to reports table (best-effort — schema may lack columns)
        try:
            client.table("reports").insert(
                {
                    "analysis_id": analysis_id,
                    "scenario_id": scenario_id,
                    "name": f"Report {data.analysis.name}",
                    "format": fmt,
                    "file_url": str(output_path),
                    "status": "completed",
                }
            ).execute()
        except Exception as db_err:
            logger.warning(f"Could not save report record to DB: {db_err}")

    except Exception as e:
        logger.exception(f"Report generation failed for job {job_id}")
        update_job(job_id, {"status": "failed", "error": str(e)})


@router.post("/{scenario_id}")
async def generate_report(
    scenario_id: str,
    background_tasks: BackgroundTasks,
    analysis_id: str | None = None,
    format: str = "docx",
):
    """Start report generation for a scenario in the given format."""
    if format not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato non supportato: {format}. Usa: {', '.join(sorted(SUPPORTED_FORMATS))}",
        )

    if not analysis_id:
        # Look up analysis_id from scenario
        client = get_supabase_client()
        result = (
            client.table("scenarios")
            .select("analysis_id, status")
            .eq("id", scenario_id)
            .single()
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Scenario non trovato")
        if result.data["status"] != "completed":
            raise HTTPException(
                status_code=400,
                detail="Lo scenario deve essere completato per generare un report",
            )
        analysis_id = result.data["analysis_id"]

    job_id = str(uuid.uuid4())

    set_job(job_id, {
        "status": "queued",
        "scenario_id": scenario_id,
        "analysis_id": analysis_id,
        "format": format,
    })

    background_tasks.add_task(_run_generation, job_id, analysis_id, scenario_id, format)

    return {"job_id": job_id, "status": "queued"}


@router.get("/{job_id}/status")
async def report_status(job_id: str):
    """Check report generation status."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job non trovato")

    return {
        "job_id": job_id,
        "status": job["status"],
        "error": job.get("error"),
    }


@router.get("/{job_id}/download")
async def download_report(job_id: str):
    """Download generated report file."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job non trovato")
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Report non ancora pronto")

    file_path = Path(job["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File non trovato")

    fmt = job.get("format", "docx")
    mime = MIME_TYPES.get(fmt, "application/octet-stream")

    return FileResponse(
        path=str(file_path),
        filename=job.get("file_name", f"report.{fmt}"),
        media_type=mime,
    )
