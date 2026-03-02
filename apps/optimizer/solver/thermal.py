"""Thermal and cold balance constraints.

Adds heat and cold balance constraints to the PuLP model for all
non-electricity end-uses: HEAT_HIGH_T, HEAT_MED_T, HEAT_LOW_T, COLD.
"""

from __future__ import annotations

import pulp

from models.input import AnalysisData, ScenarioConfig
from models.enums import EndUse, StorageType
from solver.variables import OptVars, HOURS

# The four thermal end-uses handled by this module.
_THERMAL_END_USES: list[EndUse] = [
    EndUse.HEAT_HIGH_T,
    EndUse.HEAT_MED_T,
    EndUse.HEAT_LOW_T,
    EndUse.COLD,
]

# Maps each thermal end-use to the matching storage type.
_STORAGE_TYPE_MAP: dict[EndUse, StorageType] = {
    EndUse.HEAT_HIGH_T: StorageType.THERMAL_HOT,
    EndUse.HEAT_MED_T: StorageType.THERMAL_HOT,
    EndUse.HEAT_LOW_T: StorageType.THERMAL_HOT,
    EndUse.COLD: StorageType.THERMAL_COLD,
}


def add_thermal_balance(
    prob: pulp.LpProblem,
    v: OptVars,
    data: AnalysisData,
    config: ScenarioConfig,
) -> None:
    """Add thermal / cold balance and capacity constraints.

    For each of the four thermal end-uses the function:
    1. Locates the corresponding demand (or skips if none).
    2. Builds an hourly demand profile in kWh.
    3. Adds an hourly energy-balance constraint:
       sum(production) + storage_discharge - storage_charge == demand.
    4. Adds per-technology, per-hour capacity constraints:
       energy_out <= cap * capacity_factor.

    Parameters
    ----------
    prob : pulp.LpProblem
        The optimisation problem to which constraints are added.
    v : OptVars
        Container with all decision variables already created.
    data : AnalysisData
        Input data (demands, technologies, storage systems).
    config : ScenarioConfig
        Scenario-level configuration (unused here but kept for
        a consistent function signature across constraint modules).
    """

    for end_use in _THERMAL_END_USES:
        _add_balance_for_end_use(prob, v, data, end_use)


# ------------------------------------------------------------------
# Internal helpers
# ------------------------------------------------------------------


def _add_balance_for_end_use(
    prob: pulp.LpProblem,
    v: OptVars,
    data: AnalysisData,
    end_use: EndUse,
) -> None:
    """Handle balance + capacity constraints for a single thermal end-use."""

    # ---- 1. Find the demand for this end-use ----
    demand = _find_demand(data, end_use)
    if demand is None:
        return  # no demand for this end-use -> nothing to constrain

    hourly_demand_kwh = _build_hourly_profile_kwh(demand)

    # ---- 2. Identify technologies that produce this end-use ----
    eu_key = end_use.value
    producing_techs = [
        tech
        for tech in data.technologies
        if any(out.end_use == end_use for out in tech.outputs)
    ]

    # ---- 3. Identify matching thermal storage systems ----
    target_storage_type = _STORAGE_TYPE_MAP[end_use]
    matching_storages = [
        s
        for s in data.storage_systems
        if s.storage_type == target_storage_type
    ]

    # ---- 4. Hourly balance constraint ----
    # Include baseline thermal supply (thermal_buy) as fallback – analogous
    # to the grid buy variable in the electricity balance.
    has_baseline = eu_key in v.thermal_buy

    for h in range(HOURS):
        # Production terms
        production_terms: list[pulp.LpVariable] = []
        for tech in producing_techs:
            tid = tech.id
            if tid in v.energy_out and eu_key in v.energy_out[tid]:
                production_terms.append(v.energy_out[tid][eu_key][h])

        # Storage discharge / charge terms
        storage_discharge_terms: list[pulp.LpVariable] = []
        storage_charge_terms: list[pulp.LpVariable] = []
        for storage in matching_storages:
            sid = storage.id
            if sid in v.discharge:
                storage_discharge_terms.append(v.discharge[sid][h])
            if sid in v.charge:
                storage_charge_terms.append(v.charge[sid][h])

        # Build the LHS expression
        lhs = pulp.lpSum(production_terms) \
            + pulp.lpSum(storage_discharge_terms) \
            - pulp.lpSum(storage_charge_terms)

        # Baseline fallback: conventional equipment (gas boiler / chiller)
        if has_baseline:
            lhs += v.thermal_buy[eu_key][h]

        prob += (
            lhs == hourly_demand_kwh[h],
            f"thermal_balance_{end_use.value}_h{h}",
        )

    # ---- 5. Per-tech capacity constraints ----
    for tech in producing_techs:
        tid = tech.id
        if tid not in v.energy_out or eu_key not in v.energy_out[tid]:
            continue

        cf = tech.capacity_factor
        for h in range(HOURS):
            prob += (
                v.energy_out[tid][eu_key][h] <= v.cap[tid] * cf,
                f"thermal_cap_{tid}_{end_use.value}_h{h}",
            )


def _find_demand(data: AnalysisData, end_use: EndUse):
    """Return the first Demand matching *end_use*, or None."""
    for d in data.demands:
        if d.end_use == end_use:
            return d
    return None


def _build_hourly_profile_kwh(demand) -> list[float]:
    """Return an 8760-element list of hourly demand in kWh.

    If the demand already carries an ``hourly_profile`` (assumed in kWh),
    use it directly.  Otherwise create a flat profile by spreading
    ``annual_consumption_mwh`` (converted to kWh) evenly across all hours.
    """
    if demand.hourly_profile is not None:
        return demand.hourly_profile

    flat_kwh = demand.annual_consumption_mwh * 1000.0 / HOURS
    return [flat_kwh] * HOURS
