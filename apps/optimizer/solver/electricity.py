"""Electricity balance and related constraints for the optimization model.

Adds hourly demand balance, technology capacity/efficiency constraints,
Big-M sizing constraints, and resource availability limits.
"""

from __future__ import annotations

import pulp

from models.input import AnalysisData, ScenarioConfig
from models.enums import EndUse, ResourceType
from solver.variables import OptVars, HOURS


# ---------------------------------------------------------------------------
# Renewable resource types that are bounded by capacity factor, not fuel
# ---------------------------------------------------------------------------
_RENEWABLE_INPUTS = {ResourceType.SOLAR.value, ResourceType.WIND.value}


def add_electricity_balance(
    prob: pulp.LpProblem,
    v: OptVars,
    data: AnalysisData,
    config: ScenarioConfig,
) -> None:
    """Add all electricity-side constraints to *prob*.

    Covers:
    1. Hourly electricity demand balance
    2. Technology output capacity limits
    3. Technology input-output energy balance (efficiency)
    4. Renewable input capacity bounds
    5. Big-M sizing constraints for new technologies
    6. Resource annual availability limits
    """

    # Build fast lookup maps ------------------------------------------------
    tech_map = {t.id: t for t in data.technologies}
    tech_cfg_map = {tc.technology_id: tc for tc in config.tech_configs}

    battery_ids = [
        s.id for s in data.storage_systems if s.storage_type.value == "battery_lion"
    ]

    # Electricity demand profile (kWh per hour) -----------------------------
    elec_demand = _get_demand_profile(data, EndUse.ELECTRICITY)

    elec_rt = ResourceType.ELECTRICITY.value  # "electricity"

    # -----------------------------------------------------------------------
    # 1. Hourly electricity balance
    # -----------------------------------------------------------------------
    for h in range(HOURS):
        supply_terms: list[pulp.LpVariable | pulp.LpAffineExpression] = []

        # Generation from technologies
        for tid, out_dict in v.energy_out.items():
            if EndUse.ELECTRICITY.value in out_dict:
                supply_terms.append(out_dict[EndUse.ELECTRICITY.value][h])

        # Battery discharge (+) and charge (-)
        for sid in battery_ids:
            if sid in v.discharge:
                supply_terms.append(v.discharge[sid][h])
            if sid in v.charge:
                supply_terms.append(-v.charge[sid][h])

        # Grid buy (+)
        if elec_rt in v.buy:
            supply_terms.append(v.buy[elec_rt][h])

        # Grid sell (-)
        if elec_rt in v.sell:
            supply_terms.append(-v.sell[elec_rt][h])

        prob += (
            pulp.lpSum(supply_terms) == elec_demand[h],
            f"elec_balance_h{h}",
        )

    # -----------------------------------------------------------------------
    # 2. Technology output capacity limits
    # -----------------------------------------------------------------------
    for tid, out_dict in v.energy_out.items():
        if EndUse.ELECTRICITY.value not in out_dict:
            continue
        tech = tech_map[tid]
        for h in range(HOURS):
            prob += (
                out_dict[EndUse.ELECTRICITY.value][h]
                <= v.cap[tid] * tech.capacity_factor,
                f"cap_limit_{tid}_h{h}",
            )

    # -----------------------------------------------------------------------
    # 3. Technology input-output energy balance (efficiency)
    # -----------------------------------------------------------------------
    for tech in data.technologies:
        tid = tech.id
        has_inputs = tid in v.energy_in and len(v.energy_in[tid]) > 0
        has_outputs = tid in v.energy_out and len(v.energy_out[tid]) > 0

        if not (has_inputs and has_outputs):
            continue

        # Build maps for conversion factors
        output_cf = {}
        for out in tech.outputs:
            if out.end_use:
                output_cf[out.end_use.value] = out.conversion_factor

        input_cf = {}
        for inp in tech.inputs:
            if inp.resource_type:
                input_cf[inp.resource_type.value] = inp.conversion_factor

        for h in range(HOURS):
            # LHS: total output energy weighted by output conversion factors
            out_terms = []
            for eu, cf in output_cf.items():
                if eu in v.energy_out[tid]:
                    # energy_out / conversion_factor
                    out_terms.append(v.energy_out[tid][eu][h] / cf if cf != 0 else 0)

            # RHS: total input energy weighted by input conversion factors
            in_terms = []
            for rt, cf in input_cf.items():
                if rt in v.energy_in[tid]:
                    in_terms.append(v.energy_in[tid][rt][h] * cf)

            if out_terms and in_terms:
                prob += (
                    pulp.lpSum(out_terms) <= pulp.lpSum(in_terms),
                    f"efficiency_{tid}_h{h}",
                )

    # -----------------------------------------------------------------------
    # 4. Renewable input capacity bounds
    # -----------------------------------------------------------------------
    for tech in data.technologies:
        tid = tech.id
        if tid not in v.energy_in:
            continue
        for inp in tech.inputs:
            if inp.resource_type and inp.resource_type.value in _RENEWABLE_INPUTS:
                rt = inp.resource_type.value
                if rt in v.energy_in[tid]:
                    for h in range(HOURS):
                        prob += (
                            v.energy_in[tid][rt][h]
                            <= v.cap[tid] * tech.capacity_factor,
                            f"renew_cap_{tid}_{rt}_h{h}",
                        )

    # -----------------------------------------------------------------------
    # 5. Big-M sizing constraints for non-existing technologies
    # -----------------------------------------------------------------------
    for tech in data.technologies:
        tid = tech.id
        if tech.is_existing:
            continue

        tc = tech_cfg_map.get(tid)
        max_cap = (
            tc.max_capacity_kw
            if (tc and tc.max_capacity_kw is not None)
            else tech.max_size_kw
        )
        min_cap = (
            tc.min_capacity_kw
            if (tc and tc.min_capacity_kw is not None)
            else tech.min_size_kw
        )

        prob += (
            v.cap[tid] <= max_cap * v.use[tid],
            f"bigM_upper_{tid}",
        )
        prob += (
            v.cap[tid] >= min_cap * v.use[tid],
            f"bigM_lower_{tid}",
        )

        # Force-include technologies
        if tc and tc.force_include:
            prob += (
                v.use[tid] >= 1,
                f"force_include_{tid}",
            )

    # -----------------------------------------------------------------------
    # 6. Resource annual availability limits
    # -----------------------------------------------------------------------
    for resource in data.resources:
        if resource.max_availability is None:
            continue
        rt = resource.resource_type.value
        if rt not in v.buy:
            continue
        prob += (
            pulp.lpSum(v.buy[rt][h] for h in range(HOURS))
            <= resource.max_availability * 1000,  # MWh -> kWh
            f"avail_{rt}",
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_demand_profile(data: AnalysisData, end_use: EndUse) -> list[float]:
    """Return an 8760-element kWh demand profile for the given end-use.

    If the demand provides an explicit hourly_profile, it is used directly.
    Otherwise a flat profile is built from the annual consumption.
    """
    for demand in data.demands:
        if demand.end_use == end_use:
            if demand.hourly_profile and len(demand.hourly_profile) == HOURS:
                return demand.hourly_profile
            # Flat profile: convert annual MWh to kWh then spread evenly
            hourly_kwh = demand.annual_consumption_mwh * 1000.0 / HOURS
            return [hourly_kwh] * HOURS

    # No demand found for this end-use: zero profile
    return [0.0] * HOURS
