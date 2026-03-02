"""AI suggestions API routes."""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ai.suggestions import generate_suggestions, EnergyProfile, SuggestionsResponse
from ai.estimator import generate_estimate, SiteInfo, EstimateResponse
from db.client import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/suggestions/{analysis_id}", response_model=SuggestionsResponse)
async def get_suggestions(analysis_id: str):
    """Generate AI technology suggestions for an analysis."""
    try:
        client = get_supabase_client()

        # Fetch analysis with site info
        analysis = client.table("analyses").select(
            "*, sites(nace_code, sector, roof_area_sqm, latitude)"
        ).eq("id", analysis_id).single().execute()

        if not analysis.data:
            raise HTTPException(status_code=404, detail="Analisi non trovata")

        # Fetch demands
        demands = client.table("demands").select(
            "end_use, annual_consumption_mwh"
        ).eq("analysis_id", analysis_id).execute()

        # Fetch resources
        resources = client.table("analysis_resources").select(
            "resource_type, buying_price"
        ).eq("analysis_id", analysis_id).execute()

        # Fetch existing technologies
        existing_techs = client.table("analysis_technologies").select(
            "installed_capacity_kw, is_existing, technology_catalog(name, category)"
        ).eq("analysis_id", analysis_id).eq("is_existing", True).execute()

        # Fetch available technology catalog
        catalog = client.table("technology_catalog").select(
            "name, category, capex_per_kw"
        ).execute()

        site = analysis.data.get("sites") or {}
        total_consumption = sum(
            float(d.get("annual_consumption_mwh", 0))
            for d in (demands.data or [])
        )

        profile = EnergyProfile(
            nace_code=site.get("nace_code"),
            sector=site.get("sector"),
            annual_consumption_mwh=total_consumption,
            demands=[{"end_use": d["end_use"], "annual_consumption_mwh": float(d.get("annual_consumption_mwh", 0))} for d in (demands.data or [])],
            resources=[{"resource_type": r["resource_type"], "buying_price": float(r.get("buying_price", 0))} for r in (resources.data or [])],
            existing_technologies=[
                {"name": t.get("technology_catalog", {}).get("name", ""),
                 "capacity_kw": float(t.get("installed_capacity_kw", 0)),
                 "category": t.get("technology_catalog", {}).get("category", "")}
                for t in (existing_techs.data or [])
            ],
            available_technologies=[
                {"name": c["name"], "category": c["category"], "capex_per_kw": float(c.get("capex_per_kw", 0))}
                for c in (catalog.data or [])
            ],
            roof_area_sqm=float(site.get("roof_area_sqm")) if site.get("roof_area_sqm") else None,
            latitude=float(site.get("latitude")) if site.get("latitude") else None,
        )

        # Run blocking Anthropic API call in a thread to avoid blocking the event loop
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, generate_suggestions, profile)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("AI suggestions generation failed")
        raise HTTPException(status_code=500, detail=f"Errore: {str(e)}")


# --------------------------------------------------------------------------- #
#  POST /ai/estimate — AI-powered energy consumption estimation               #
# --------------------------------------------------------------------------- #

class EstimateRequest(BaseModel):
    """Request body for the energy estimation endpoint."""
    site_info: SiteInfo
    questions: list[str]


@router.post("/estimate", response_model=EstimateResponse)
async def estimate_consumption(payload: EstimateRequest):
    """Use AI to estimate energy consumption based on site characteristics."""
    try:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None,
            generate_estimate,
            payload.site_info,
            payload.questions,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("AI energy estimation failed")
        raise HTTPException(status_code=500, detail=f"Errore: {str(e)}")
