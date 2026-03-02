"""Routes for demand profile generation.

Provides endpoints to preview generated profiles (downsampled for charting)
and to apply full 8760-hour profiles to all demands in an analysis.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from profiles.generator import (
    generate_hourly_profile,
    default_profile_type_for_end_use,
)
from db.client import get_supabase_client

router = APIRouter(prefix="/profiles", tags=["profiles"])

HOURS = 8760
# Number of points for the downsampled preview (24h * 12 months = 288)
PREVIEW_POINTS = 288


# -----------------------------------------------------------------------
# Request / Response models
# -----------------------------------------------------------------------


class ProfileGenerateRequest(BaseModel):
    """Request body for profile generation preview."""

    annual_mwh: float = Field(..., gt=0, description="Annual consumption in MWh")
    end_use: str = Field(
        ...,
        description="End-use type: ELECTRICITY, HEAT_HIGH_T, HEAT_MED_T, HEAT_LOW_T, COLD",
    )
    profile_type: str = Field(
        "flat",
        description="Profile type: flat, office, industrial_1shift, industrial_2shift, industrial_3shift, commercial, residential",
    )
    operating_hours: int = Field(4000, ge=1, le=8760, description="Annual operating hours (for flat profile)")
    working_days: list[str] | None = Field(
        None,
        description="Active weekdays as 3-letter lowercase names (e.g. ['mon','tue','wed','thu','fri'])",
    )


class ProfilePreviewResponse(BaseModel):
    """Downsampled profile for charting."""

    points: list[float] = Field(
        ...,
        description="Downsampled profile values (kW) with PREVIEW_POINTS elements",
    )
    total_kwh: float = Field(..., description="Total energy (kWh) of the full profile")
    peak_kw: float = Field(..., description="Peak demand (kW)")
    avg_kw: float = Field(..., description="Average demand (kW)")
    hours_count: int = Field(HOURS, description="Number of hours in full profile (always 8760)")
    preview_points_count: int = Field(PREVIEW_POINTS, description="Number of points in preview")


class ProfileApplyResponse(BaseModel):
    """Response for apply-to-analysis endpoint."""

    demands_updated: int = Field(..., description="Number of demands that had profiles generated")
    demands_skipped: int = Field(..., description="Number of demands that already had profiles")


# -----------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------


@router.post("/generate", response_model=ProfilePreviewResponse)
async def generate_profile_preview(req: ProfileGenerateRequest) -> ProfilePreviewResponse:
    """Generate a demand profile and return a downsampled preview for charting.

    The full 8760-hour profile is generated, then downsampled to 288 points
    (one per ~30.4 hours) for efficient frontend rendering.
    """
    profile = generate_hourly_profile(
        annual_mwh=req.annual_mwh,
        end_use=req.end_use,
        profile_type=req.profile_type,
        operating_hours=req.operating_hours,
        working_days=req.working_days,
    )

    # Downsample: take every Nth point
    step = max(1, HOURS // PREVIEW_POINTS)
    preview = [profile[i * step] for i in range(PREVIEW_POINTS)]

    total_kwh = sum(profile)
    peak_kw = max(profile)
    avg_kw = total_kwh / HOURS

    return ProfilePreviewResponse(
        points=preview,
        total_kwh=round(total_kwh, 2),
        peak_kw=round(peak_kw, 2),
        avg_kw=round(avg_kw, 2),
        hours_count=HOURS,
        preview_points_count=PREVIEW_POINTS,
    )


@router.post("/apply/{analysis_id}", response_model=ProfileApplyResponse)
async def apply_profiles_to_analysis(analysis_id: str) -> ProfileApplyResponse:
    """Generate and save 8760-hour profiles for all demands in an analysis.

    For each demand that does not already have an hourly_profile, this
    endpoint generates one based on the demand's end_use and profile_type,
    then saves it back to the database.

    Demands that already have an hourly_profile are skipped.
    """
    client = get_supabase_client()

    # Fetch all demands for this analysis
    demands_resp = (
        client.table("demands")
        .select("id, end_use, annual_consumption_mwh, profile_type, hourly_profile")
        .eq("analysis_id", analysis_id)
        .execute()
    )

    if not demands_resp.data:
        raise HTTPException(
            status_code=404,
            detail=f"No demands found for analysis {analysis_id}",
        )

    updated = 0
    skipped = 0

    for demand in demands_resp.data:
        # Skip demands that already have a profile
        if demand.get("hourly_profile") is not None:
            skipped += 1
            continue

        end_use = demand["end_use"]
        annual_mwh = float(demand.get("annual_consumption_mwh") or 0)

        if annual_mwh <= 0:
            skipped += 1
            continue

        # Determine profile type: use DB value or default based on end_use
        profile_type = demand.get("profile_type") or "nace_default"

        # Map legacy/NACE profile types to generator types
        if profile_type in ("nace_default", "custom", "upload"):
            profile_type = default_profile_type_for_end_use(end_use)

        # Generate the full 8760-hour profile
        profile = generate_hourly_profile(
            annual_mwh=annual_mwh,
            end_use=end_use,
            profile_type=profile_type,
        )

        # Save to database
        client.table("demands").update(
            {"hourly_profile": profile}
        ).eq("id", demand["id"]).execute()

        updated += 1

    return ProfileApplyResponse(
        demands_updated=updated,
        demands_skipped=skipped,
    )
