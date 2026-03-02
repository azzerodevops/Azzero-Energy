from pydantic import BaseModel, Field

from .enums import EndUse, ResourceType, StorageType, Objective


class Demand(BaseModel):
    id: str
    end_use: EndUse
    annual_consumption_mwh: float
    profile_type: str = "nace_default"
    hourly_profile: list[float] | None = None


class Resource(BaseModel):
    id: str
    resource_type: ResourceType
    buying_price: float
    selling_price: float = 0.0
    co2_factor: float = 0.0
    max_availability: float | None = None


class TechIO(BaseModel):
    """A single input or output of a technology."""

    resource_type: ResourceType | None = None
    end_use: EndUse | None = None
    conversion_factor: float = 1.0


class Technology(BaseModel):
    id: str
    name: str
    category: str
    capex_per_kw: float = 0.0
    maintenance_annual_per_kw: float = 0.0
    lifetime: int = 20
    capacity_factor: float = 1.0
    min_size_kw: float = 0.0
    max_size_kw: float = 100000.0
    installed_capacity_kw: float = 0.0
    is_existing: bool = False
    inputs: list[TechIO] = Field(default_factory=list)
    outputs: list[TechIO] = Field(default_factory=list)


class StorageSystem(BaseModel):
    id: str
    name: str = ""
    storage_type: StorageType
    capacity_kwh: float = 0.0
    max_charge_kw: float = 0.0
    max_discharge_kw: float = 0.0
    charge_efficiency: float = 0.95
    discharge_efficiency: float = 0.95
    self_discharge_rate: float = 0.0
    capex_per_kwh: float = 0.0
    min_soc: float = 0.1
    max_soc: float = 0.9


class ScenarioConfig(BaseModel):
    scenario_id: str
    objective: Objective = Objective.COST
    co2_target: float | None = None
    budget_limit: float | None = None
    tech_configs: list["ScenarioTechConfig"] = Field(default_factory=list)


class ScenarioTechConfig(BaseModel):
    technology_id: str
    min_capacity_kw: float | None = None
    max_capacity_kw: float | None = None
    force_include: bool = False


class AnalysisData(BaseModel):
    analysis_id: str
    wacc: float = 0.05
    demands: list[Demand] = Field(default_factory=list)
    resources: list[Resource] = Field(default_factory=list)
    technologies: list[Technology] = Field(default_factory=list)
    storage_systems: list[StorageSystem] = Field(default_factory=list)
