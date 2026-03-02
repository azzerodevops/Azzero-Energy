"""Fetch and aggregate all data needed for report generation.

This module queries Supabase for analysis, site, demand, resource, and
scenario result data, then assembles it into a single ReportData model
that the document renderer can consume.

Note: The Supabase Python client is synchronous, so this function is a
regular ``def`` rather than ``async def``.  Call it from an async route
handler via ``asyncio.to_thread(fetch_report_data, client, ...)``.
"""

from __future__ import annotations

from datetime import datetime, timezone

from supabase import Client

from .models import (
    AnalysisInfo,
    DemandSummary,
    ReportData,
    ResourceSummary,
    ScenarioSummary,
    SiteInfo,
    TechResultSummary,
)

# ---------------------------------------------------------------------------
# Label mappings (Italian)
# ---------------------------------------------------------------------------

END_USE_LABELS: dict[str, str] = {
    "ELECTRICITY": "Elettricità",
    "HEAT_HIGH_T": "Calore alta temperatura",
    "HEAT_MED_T": "Calore media temperatura",
    "HEAT_LOW_T": "Calore bassa temperatura",
    "COLD": "Freddo",
}

RESOURCE_LABELS: dict[str, str] = {
    "electricity": "Elettricità (rete)",
    "natural_gas": "Gas naturale",
    "biomass": "Biomassa",
    "diesel": "Gasolio",
    "lpg": "GPL",
    "solar": "Solare",
    "wind": "Eolico",
    "hydrogen": "Idrogeno",
}


# ---------------------------------------------------------------------------
# Data fetcher
# ---------------------------------------------------------------------------


def fetch_report_data(
    client: Client,
    analysis_id: str,
    scenario_id: str,
) -> ReportData:
    """Fetch all data needed for a report from Supabase.

    Parameters
    ----------
    client:
        An authenticated Supabase ``Client`` instance (service role).
    analysis_id:
        UUID of the analysis to report on.
    scenario_id:
        UUID of the scenario whose results should be included.

    Returns
    -------
    ReportData
        A fully-populated report payload ready for document rendering.
    """

    # 1. Fetch analysis + site ------------------------------------------------
    analysis_resp = (
        client.table("analyses")
        .select("id, name, description, year, wacc, sites(name, address, city, province, latitude, longitude)")
        .eq("id", analysis_id)
        .single()
        .execute()
    )

    a = analysis_resp.data
    site_data = a.get("sites", {})
    if isinstance(site_data, list):
        site_data = site_data[0] if site_data else {}

    analysis = AnalysisInfo(
        id=a["id"],
        name=a["name"],
        description=a.get("description"),
        year=a["year"],
        wacc=float(a["wacc"]) if a.get("wacc") else None,
        site=SiteInfo(**site_data) if site_data else SiteInfo(name="N/D"),
    )

    # 2. Fetch demands ---------------------------------------------------------
    demands_resp = (
        client.table("demands")
        .select("end_use, annual_consumption_mwh")
        .eq("analysis_id", analysis_id)
        .execute()
    )

    demands = [
        DemandSummary(
            end_use=d["end_use"],
            end_use_label=END_USE_LABELS.get(d["end_use"], d["end_use"]),
            annual_consumption_mwh=float(d["annual_consumption_mwh"]),
        )
        for d in (demands_resp.data or [])
    ]

    # 3. Fetch resources -------------------------------------------------------
    resources_resp = (
        client.table("analysis_resources")
        .select("resource_type, buying_price, co2_factor")
        .eq("analysis_id", analysis_id)
        .execute()
    )

    resources = [
        ResourceSummary(
            resource_type=r["resource_type"],
            resource_label=RESOURCE_LABELS.get(r["resource_type"], r["resource_type"]),
            buying_price=float(r["buying_price"]) if r.get("buying_price") else None,
            co2_factor=float(r["co2_factor"]) if r.get("co2_factor") else None,
        )
        for r in (resources_resp.data or [])
    ]

    # 4. Fetch scenario + aggregate results ------------------------------------
    scenario_resp = (
        client.table("scenarios")
        .select("id, name, objective")
        .eq("id", scenario_id)
        .single()
        .execute()
    )
    s = scenario_resp.data

    results_resp = (
        client.table("scenario_results")
        .select("*")
        .eq("scenario_id", scenario_id)
        .single()
        .execute()
    )
    r = results_resp.data

    # 5. Fetch per-technology results ------------------------------------------
    tech_results_resp = (
        client.table("tech_results")
        .select("*, technology_catalog(name, category)")
        .eq("scenario_result_id", r["id"])
        .execute()
    )

    tech_results: list[TechResultSummary] = []
    for t in tech_results_resp.data or []:
        cat = t.get("technology_catalog", {})
        if isinstance(cat, list):
            cat = cat[0] if cat else {}
        tech_results.append(
            TechResultSummary(
                technology_name=cat.get("name", "N/D"),
                category=cat.get("category", ""),
                optimal_capacity_kw=float(t.get("optimal_capacity_kw", 0)),
                annual_production_mwh=float(t.get("annual_production_mwh", 0)),
                capex=float(t.get("capex", 0)),
                annual_savings=float(t.get("annual_savings", 0)),
            )
        )

    scenario = ScenarioSummary(
        id=s["id"],
        name=s["name"],
        objective=s["objective"],
        total_capex=float(r.get("total_capex", 0)),
        total_opex_annual=float(r.get("total_opex_annual", 0)),
        total_savings_annual=float(r.get("total_savings_annual", 0)),
        payback_years=float(r["payback_years"]) if r.get("payback_years") else None,
        irr=float(r["irr"]) if r.get("irr") else None,
        npv=float(r["npv"]) if r.get("npv") else None,
        co2_reduction_percent=(
            float(r["co2_reduction_percent"]) if r.get("co2_reduction_percent") else None
        ),
        tech_results=tech_results,
    )

    # 6. Assemble ReportData ---------------------------------------------------
    return ReportData(
        analysis=analysis,
        demands=demands,
        resources=resources,
        scenario=scenario,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
