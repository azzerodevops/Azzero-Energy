from __future__ import annotations
import pulp
from models.input import AnalysisData, ScenarioConfig, Technology, StorageSystem, Resource
from models.enums import EndUse, ResourceType

HOURS = 8760

class OptVars:
    """Container for all optimization decision variables."""
    def __init__(self):
        self.cap: dict[str, pulp.LpVariable] = {}
        self.use: dict[str, pulp.LpVariable] = {}
        self.energy_in: dict[str, dict[str, list[pulp.LpVariable]]] = {}
        self.energy_out: dict[str, dict[str, list[pulp.LpVariable]]] = {}
        self.soc: dict[str, list[pulp.LpVariable]] = {}
        self.charge: dict[str, list[pulp.LpVariable]] = {}
        self.discharge: dict[str, list[pulp.LpVariable]] = {}
        self.buy: dict[str, list[pulp.LpVariable]] = {}
        self.sell: dict[str, list[pulp.LpVariable]] = {}


def create_all_variables(data: AnalysisData, config: ScenarioConfig) -> OptVars:
    """Create all decision variables for the optimization model."""
    v = OptVars()

    # Build tech config lookup for scenario overrides
    tech_config_map = {tc.technology_id: tc for tc in config.tech_configs}

    for tech in data.technologies:
        tc = tech_config_map.get(tech.id)
        _create_tech_variables(v, tech, tc, data)

    for storage in data.storage_systems:
        _create_storage_variables(v, storage)

    for resource in data.resources:
        _create_resource_variables(v, resource)

    return v


def _create_tech_variables(v: OptVars, tech: Technology, tc, data: AnalysisData) -> None:
    """Create variables for a single technology."""
    tid = tech.id

    # Capacity bounds from scenario config or tech defaults
    min_cap = tc.min_capacity_kw if (tc and tc.min_capacity_kw is not None) else tech.min_size_kw
    max_cap = tc.max_capacity_kw if (tc and tc.max_capacity_kw is not None) else tech.max_size_kw

    # If existing tech, capacity is fixed
    if tech.is_existing:
        v.cap[tid] = pulp.LpVariable(f"cap_{tid}", lowBound=tech.installed_capacity_kw, upBound=tech.installed_capacity_kw, cat="Continuous")
        v.use[tid] = pulp.LpVariable(f"use_{tid}", cat="Binary")
    else:
        v.cap[tid] = pulp.LpVariable(f"cap_{tid}", lowBound=0, upBound=max_cap, cat="Continuous")
        v.use[tid] = pulp.LpVariable(f"use_{tid}", cat="Binary")

    # Energy input variables (per resource that is an input)
    v.energy_in[tid] = {}
    for inp in tech.inputs:
        if inp.resource_type:
            rt = inp.resource_type.value
            v.energy_in[tid][rt] = [
                pulp.LpVariable(f"ein_{tid}_{rt}_{h}", lowBound=0, cat="Continuous")
                for h in range(HOURS)
            ]

    # Energy output variables (per end-use that is an output)
    v.energy_out[tid] = {}
    for out in tech.outputs:
        if out.end_use:
            eu = out.end_use.value
            v.energy_out[tid][eu] = [
                pulp.LpVariable(f"eout_{tid}_{eu}_{h}", lowBound=0, cat="Continuous")
                for h in range(HOURS)
            ]


def _create_storage_variables(v: OptVars, storage: StorageSystem) -> None:
    """Create variables for a single storage system."""
    sid = storage.id

    v.soc[sid] = [
        pulp.LpVariable(f"soc_{sid}_{h}", lowBound=0, cat="Continuous")
        for h in range(HOURS)
    ]
    v.charge[sid] = [
        pulp.LpVariable(f"chg_{sid}_{h}", lowBound=0, upBound=storage.max_charge_kw, cat="Continuous")
        for h in range(HOURS)
    ]
    v.discharge[sid] = [
        pulp.LpVariable(f"dis_{sid}_{h}", lowBound=0, upBound=storage.max_discharge_kw, cat="Continuous")
        for h in range(HOURS)
    ]


def _create_resource_variables(v: OptVars, resource: Resource) -> None:
    """Create buy/sell variables for a resource."""
    rt = resource.resource_type.value

    v.buy[rt] = [
        pulp.LpVariable(f"buy_{rt}_{h}", lowBound=0, cat="Continuous")
        for h in range(HOURS)
    ]

    # Only electricity can be sold back
    if resource.resource_type == ResourceType.ELECTRICITY:
        v.sell[rt] = [
            pulp.LpVariable(f"sell_{rt}_{h}", lowBound=0, cat="Continuous")
            for h in range(HOURS)
        ]
