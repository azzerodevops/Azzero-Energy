from pydantic import BaseModel, Field
from .enums import ScenarioStatus


class TechResult(BaseModel):
    """Result for a single technology in the optimization."""
    technology_id: str
    technology_name: str = ""
    optimal_capacity_kw: float = 0.0
    annual_production_mwh: float = 0.0
    capex: float = 0.0
    annual_opex: float = 0.0
    annual_savings: float = 0.0


class StorageResult(BaseModel):
    """Result for a single storage system."""
    storage_id: str
    storage_name: str = ""
    optimal_capacity_kwh: float = 0.0
    capex: float = 0.0
    annual_cycles: float = 0.0


class OptimizationResult(BaseModel):
    """Complete optimization result for a scenario."""
    scenario_id: str
    status: str = "completed"
    solver_status: str = ""
    total_capex: float = 0.0
    total_opex_annual: float = 0.0
    total_savings_annual: float = 0.0
    payback_years: float | None = None
    irr: float | None = None
    npv: float | None = None
    co2_baseline: float = 0.0  # tCO2/year before optimization
    co2_optimized: float = 0.0  # tCO2/year after optimization
    co2_reduction_percent: float = 0.0
    tech_results: list[TechResult] = Field(default_factory=list)
    storage_results: list[StorageResult] = Field(default_factory=list)
    error_message: str | None = None


class ValidationResult(BaseModel):
    """Result of pre-optimization data validation."""
    valid: bool = True
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    auto_fixes_applied: list[str] = Field(default_factory=list)


class SolveResponse(BaseModel):
    """Response for POST /solve/{scenario_id}."""
    status: str = "queued"
    scenario_id: str
    message: str = "Optimization job queued"


class StatusResponse(BaseModel):
    """Response for GET /solve/{scenario_id}/status."""
    scenario_id: str
    status: ScenarioStatus
    message: str = ""
    error_message: str | None = None
