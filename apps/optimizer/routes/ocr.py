"""OCR bill scanning API routes."""

from __future__ import annotations

import asyncio
import logging
from functools import partial

from fastapi import APIRouter, File, UploadFile, HTTPException

from ocr.extractor import extract_bill_data, BillData

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("/bill", response_model=BillData)
async def scan_bill(file: UploadFile = File(...)):
    """Scan an energy bill image and extract structured data."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Il file deve essere un'immagine (JPEG, PNG, etc.)",
        )

    # Limit file size (10 MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Il file non può superare 10 MB",
        )

    try:
        # Run blocking Anthropic API call in a thread to avoid blocking the event loop
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None, partial(extract_bill_data, contents, file.content_type)
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.exception("OCR extraction failed")
        raise HTTPException(
            status_code=500,
            detail=f"Errore durante l'estrazione: {str(e)}",
        )
