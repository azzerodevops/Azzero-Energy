from __future__ import annotations
import pulp
from models.input import AnalysisData, ScenarioConfig
from models.enums import EndUse, Objective, ResourceType
from solver.variables import OptVars, HOURS, BASELINE_EFFICIENCY, BASELINE_RESOURCE


def crf(wacc: float, lifetime: int) -> float:
    """Capital Recovery Factor — annualizes a CAPEX investment.

    CRF = wacc * (1 + wacc)^n / ((1 + wacc)^n - 1)
    If wacc=0, return 1/lifetime.
    """
    if wacc <= 0 or lifetime <= 0:
        return 1.0 / max(lifetime, 1)
    factor = (1 + wacc) ** lifetime
    return wacc * factor / (factor - 1)


def set_cost_objective(
    prob: pulp.LpProblem,
    v: OptVars,
    data: AnalysisData,
) -> None:
    """Set objective to minimize total annualized cost.

    Total cost = sum over technologies of:
        capex_annualized[t] + maintenance[t]
    + sum over resources, hours of:
        buy[r][h] * buying_price[r] / 1000  (price is EUR/MWh, energy is kWh)
    - sum over resources, hours of:
        sell[r][h] * selling_price[r] / 1000

    Where capex_annualized[t] = capex_per_kw * cap[t] * CRF(wacc, lifetime[t])
    And maintenance[t] = maintenance_annual_per_kw * cap[t]

    For existing technologies, don't include capex (already paid).
    """
    terms = []

    for tech in data.technologies:
        tid = tech.id
        if tid not in v.cap:
            continue

        # Annualized CAPEX (only for new technologies)
        if not tech.is_existing:
            annuity = crf(data.wacc, tech.lifetime)
            terms.append(tech.capex_per_kw * annuity * v.cap[tid])

        # Annual maintenance
        terms.append(tech.maintenance_annual_per_kw * v.cap[tid])

    # Resource purchase/sell costs
    resource_map = {r.resource_type.value: r for r in data.resources}

    for rt_str, buy_vars in v.buy.items():
        r = resource_map.get(rt_str)
        if r:
            # buying_price is EUR/MWh, buy vars are in kWh → divide by 1000
            terms.append(pulp.lpSum(buy_vars) * r.buying_price / 1000)

    for rt_str, sell_vars in v.sell.items():
        r = resource_map.get(rt_str)
        if r and r.selling_price > 0:
            terms.append(-pulp.lpSum(sell_vars) * r.selling_price / 1000)

    # Storage CAPEX (annualized)
    for storage in data.storage_systems:
        if storage.capex_per_kwh > 0 and storage.capacity_kwh > 0:
            # Storage capex is fixed (not a variable), add as constant
            annuity = crf(data.wacc, 15)  # assume 15 year lifetime for storage
            terms.append(storage.capex_per_kwh * storage.capacity_kwh * annuity)

    # Baseline thermal supply costs (gas boiler / electric chiller)
    terms.extend(_thermal_buy_cost_terms(v, data, resource_map))

    prob += pulp.lpSum(terms), "total_annual_cost"


def set_co2_objective(
    prob: pulp.LpProblem,
    v: OptVars,
    data: AnalysisData,
    budget_limit: float | None = None,
) -> None:
    """Set objective to minimize total CO2 emissions.

    CO2 = sum over resources, hours of:
        buy[r][h] * co2_factor[r] / 1000  (co2_factor is tCO2/MWh, energy is kWh)

    Optionally add a budget constraint:
        total_annual_cost <= budget_limit
    """
    co2_terms = []
    resource_map = {r.resource_type.value: r for r in data.resources}

    for rt_str, buy_vars in v.buy.items():
        r = resource_map.get(rt_str)
        if r and r.co2_factor > 0:
            co2_terms.append(pulp.lpSum(buy_vars) * r.co2_factor / 1000)

    # Baseline thermal supply CO2 emissions
    co2_terms.extend(_thermal_buy_co2_terms(v, data, resource_map))

    prob += pulp.lpSum(co2_terms), "total_co2_emissions"

    # Optional budget constraint
    if budget_limit is not None and budget_limit > 0:
        cost_terms = []
        for tech in data.technologies:
            tid = tech.id
            if tid not in v.cap:
                continue
            if not tech.is_existing:
                annuity = crf(data.wacc, tech.lifetime)
                cost_terms.append(tech.capex_per_kw * annuity * v.cap[tid])
            cost_terms.append(tech.maintenance_annual_per_kw * v.cap[tid])

        for rt_str, buy_vars in v.buy.items():
            r = resource_map.get(rt_str)
            if r:
                cost_terms.append(pulp.lpSum(buy_vars) * r.buying_price / 1000)

        for rt_str, sell_vars in v.sell.items():
            r = resource_map.get(rt_str)
            if r and r.selling_price > 0:
                cost_terms.append(-pulp.lpSum(sell_vars) * r.selling_price / 1000)

        # Include thermal baseline costs in budget constraint
        cost_terms.extend(_thermal_buy_cost_terms(v, data, resource_map))

        prob += (pulp.lpSum(cost_terms) <= budget_limit, "budget_constraint")


# ---------------------------------------------------------------------------
# Helpers for baseline thermal supply cost / CO2
# ---------------------------------------------------------------------------


def _thermal_buy_cost_terms(
    v: OptVars,
    data: AnalysisData,
    resource_map: dict,
) -> list:
    """Return PuLP cost terms for all thermal_buy variables.

    Cost of thermal_buy[eu][h] = buying_price_of_resource / efficiency / 1000
    (buying_price is EUR/MWh, thermal_buy is kWh → divide by 1000).
    """
    terms = []
    for eu_str, buy_vars in v.thermal_buy.items():
        eu = EndUse(eu_str)
        efficiency = BASELINE_EFFICIENCY.get(eu, 0.9)
        resource_type = BASELINE_RESOURCE.get(eu)
        if resource_type is None:
            continue
        r = resource_map.get(resource_type.value)
        if r is None:
            continue
        # price per kWh of *thermal* energy delivered
        price_per_kwh = r.buying_price / efficiency / 1000  # EUR/kWh_thermal
        terms.append(pulp.lpSum(buy_vars) * price_per_kwh)
    return terms


def _thermal_buy_co2_terms(
    v: OptVars,
    data: AnalysisData,
    resource_map: dict,
) -> list:
    """Return PuLP CO2 terms for all thermal_buy variables.

    CO2 of thermal_buy[eu][h] = co2_factor_of_resource / efficiency / 1000
    (co2_factor is tCO2/MWh, thermal_buy is kWh → divide by 1000).
    """
    terms = []
    for eu_str, buy_vars in v.thermal_buy.items():
        eu = EndUse(eu_str)
        efficiency = BASELINE_EFFICIENCY.get(eu, 0.9)
        resource_type = BASELINE_RESOURCE.get(eu)
        if resource_type is None:
            continue
        r = resource_map.get(resource_type.value)
        if r is None or r.co2_factor <= 0:
            continue
        co2_per_kwh = r.co2_factor / efficiency / 1000  # tCO2/kWh_thermal
        terms.append(pulp.lpSum(buy_vars) * co2_per_kwh)
    return terms
