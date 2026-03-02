"""Pydantic models for report generation.

Defines the data structures used to aggregate analysis, demand, resource,
and scenario results into a single ReportData payload for document rendering.
"""

from __future__ import annotations

from pydantic import BaseModel


class SiteInfo(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None
    province: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class AnalysisInfo(BaseModel):
    id: str
    name: str
    description: str | None = None
    year: int
    wacc: float | None = None
    site: SiteInfo


class DemandSummary(BaseModel):
    end_use: str
    end_use_label: str
    annual_consumption_mwh: float


class ResourceSummary(BaseModel):
    resource_type: str
    resource_label: str
    buying_price: float | None = None
    co2_factor: float | None = None


class TechResultSummary(BaseModel):
    technology_name: str
    category: str
    optimal_capacity_kw: float
    annual_production_mwh: float
    capex: float
    annual_savings: float


class ScenarioSummary(BaseModel):
    id: str
    name: str
    objective: str
    total_capex: float
    total_opex_annual: float
    total_savings_annual: float
    payback_years: float | None = None
    irr: float | None = None
    npv: float | None = None
    co2_reduction_percent: float | None = None
    tech_results: list[TechResultSummary]


class ReportData(BaseModel):
    """Complete data needed to generate a report."""

    analysis: AnalysisInfo
    demands: list[DemandSummary]
    resources: list[ResourceSummary]
    scenario: ScenarioSummary
    generated_at: str  # ISO datetime string


class ReportRequest(BaseModel):
    analysis_id: str
    scenario_id: str
    format: str = "docx"  # "docx" or "pdf"


class ReportResponse(BaseModel):
    report_id: str
    status: str  # "queued", "generating", "completed", "failed"
    file_url: str | None = None
