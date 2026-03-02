from __future__ import annotations
import pulp
from models.input import AnalysisData, ScenarioConfig, Technology, StorageSystem, Resource
from models.enums import EndUse, ResourceType

HOURS = 8760

# ---------------------------------------------------------------------------
# Baseline thermal supply parameters
# ---------------------------------------------------------------------------
# Efficiency of conventional equipment used to satisfy thermal demand when
# no optimized technology is selected.  For HEAT_* this is a gas boiler
# efficiency; for COLD it is the COP of an electric chiller.
BASELINE_EFFICIENCY: dict[EndUse, float] = {
    EndUse.HEAT_HIGH_T: 0.88,   # industrial gas boiler
    EndUse.HEAT_MED_T: 0.90,    # standard gas boiler
    EndUse.HEAT_LOW_T: 0.92,    # condensing gas boiler
    EndUse.COLD: 3.0,           # electric chiller COP
}

# Which resource provides the baseline supply for each thermal end-use.
BASELINE_RESOURCE: dict[EndUse, ResourceType] = {
    EndUse.HEAT_HIGH_T: ResourceType.NATURAL_GAS,
    EndUse.HEAT_MED_T: ResourceType.NATURAL_GAS,
    EndUse.HEAT_LOW_T: ResourceType.NATURAL_GAS,
    EndUse.COLD: ResourceType.ELECTRICITY,
}


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
        # Baseline thermal supply: thermal_buy[end_use_value][h]
        # Represents energy supplied by conventional equipment (gas boiler / chiller)
        self.thermal_buy: dict[str, list[pulp.LpVariable]] = {}


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

    # Baseline thermal supply variables for each thermal demand
    _create_thermal_buy_variables(v, data)

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


def _create_thermal_buy_variables(v: OptVars, data: AnalysisData) -> None:
    """Create baseline thermal supply variables for each thermal demand.

    These represent purchasing thermal energy through conventional equipment
    (gas boiler for heat, electric chiller for cold).  They act as a fallback
    that guarantees feasibility for every thermal end-use, similar to how the
    electricity grid makes the electricity balance always satisfiable.
    """
    thermal_end_uses = {EndUse.HEAT_HIGH_T, EndUse.HEAT_MED_T, EndUse.HEAT_LOW_T, EndUse.COLD}

    for demand in data.demands:
        if demand.end_use not in thermal_end_uses:
            continue
        eu = demand.end_use.value
        if eu in v.thermal_buy:
            continue  # already created
        v.thermal_buy[eu] = [
            pulp.LpVariable(f"thbuy_{eu}_{h}", lowBound=0, cat="Continuous")
            for h in range(HOURS)
        ]
