from __future__ import annotations
import logging
import pulp
from config import settings
from models.input import AnalysisData, ScenarioConfig
from models.output import OptimizationResult, TechResult, StorageResult
from models.enums import Objective, EndUse, ResourceType
from solver.variables import create_all_variables, OptVars, HOURS, BASELINE_EFFICIENCY, BASELINE_RESOURCE
from solver.electricity import add_electricity_balance
from solver.thermal import add_thermal_balance
from solver.storage import add_storage_constraints
from solver.objectives import set_cost_objective, set_co2_objective, crf

logger = logging.getLogger(__name__)


def run_optimization(data: AnalysisData, config: ScenarioConfig) -> OptimizationResult:
    """Run the full MILP optimization.

    1. Create PuLP problem
    2. Create all decision variables
    3. Add electricity balance constraints
    4. Add thermal/cold balance constraints
    5. Add storage constraints
    6. Set objective function
    7. Solve
    8. Extract and return results
    """
    logger.info(f"Starting optimization for scenario {config.scenario_id}")

    # Validate input data
    if not data.demands:
        return OptimizationResult(
            scenario_id=config.scenario_id,
            status="failed",
            error_message=(
                "Nessuna domanda energetica trovata per questa analisi. "
                "Aggiungi almeno un consumo (elettricità, calore, ecc.) nella sezione 'Consumi'."
            ),
        )

    if not data.resources:
        return OptimizationResult(
            scenario_id=config.scenario_id,
            status="failed",
            error_message=(
                "Nessuna risorsa energetica disponibile. "
                "Configura almeno la rete elettrica nella sezione 'Risorse'."
            ),
        )

    if not data.technologies:
        logger.info(
            "No technologies provided — optimization will use baseline supply only "
            "(grid electricity + conventional thermal equipment)."
        )

    # Pre-optimization coverage analysis
    warnings = _check_demand_coverage(data)
    if warnings:
        logger.info(f"Pre-optimization warnings: {warnings}")

    # 1. Create problem
    sense = pulp.LpMinimize
    prob = pulp.LpProblem("energy_optimization", sense)

    # 2. Create variables
    v = create_all_variables(data, config)

    # 3-5. Add constraints
    add_electricity_balance(prob, v, data, config)
    add_thermal_balance(prob, v, data, config)
    add_storage_constraints(prob, v, data)

    # 6. Set objective
    if config.objective == Objective.COST:
        set_cost_objective(prob, v, data)
    else:
        set_co2_objective(prob, v, data, config.budget_limit)

    # 7. Solve
    logger.info("Solving MILP problem...")
    try:
        # Try HiGHS first, fall back to CBC
        try:
            solver = pulp.HiGHS_CMD(msg=0, timeLimit=settings.solver_timeout)
            prob.solve(solver)
        except Exception:
            logger.warning("HiGHS not available, falling back to CBC")
            solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=settings.solver_timeout)
            prob.solve(solver)
    except Exception as e:
        logger.error(f"Solver failed: {e}")
        return OptimizationResult(
            scenario_id=config.scenario_id,
            status="failed",
            error_message=f"Errore del solver: {str(e)}",
        )

    solver_status = pulp.LpStatus[prob.status]
    logger.info(f"Solver status: {solver_status}")

    if prob.status != pulp.constants.LpStatusOptimal:
        # Build context-aware Italian error messages
        infeasible_details = ""
        if warnings:
            infeasible_details = "\n\nDettagli:\n" + "\n".join(f"- {w}" for w in warnings)

        status_messages: dict[str, str] = {
            "Infeasible": (
                "Il problema è infeasible: non esiste una soluzione che soddisfi tutti i vincoli."
                + infeasible_details
                + "\n\nSuggerimenti:\n"
                "- Se hai impostato un budget, prova ad aumentarlo o rimuoverlo\n"
                "- Se hai forzato una tecnologia, verifica che sia compatibile con il budget\n"
                "- Per scenari di decarbonizzazione, verifica che l'obiettivo CO₂ sia raggiungibile"
            ),
            "Unbounded": (
                "Il problema è illimitato (unbounded). Questo indica un errore "
                "nei dati: probabilmente prezzi a zero o fattori di conversione mancanti."
            ),
            "Not Solved": (
                "Il solver non è riuscito a trovare una soluzione entro il tempo limite. "
                "Prova a semplificare lo scenario riducendo il numero di tecnologie."
            ),
            "Undefined": (
                "Stato del solver non definito. Potrebbe indicare un problema "
                "con i dati di input. Verifica che tutti i parametri siano corretti."
            ),
        }
        error_msg = status_messages.get(
            solver_status,
            f"Il solver non ha trovato una soluzione ottimale. Stato: {solver_status}",
        )
        return OptimizationResult(
            scenario_id=config.scenario_id,
            status="failed",
            solver_status=solver_status,
            error_message=error_msg,
        )

    # 8. Extract results
    return _extract_results(prob, v, data, config, solver_status)


def _extract_results(
    prob: pulp.LpProblem,
    v: OptVars,
    data: AnalysisData,
    config: ScenarioConfig,
    solver_status: str,
) -> OptimizationResult:
    """Extract optimization results from solved model."""

    tech_results = []
    total_capex = 0.0
    total_opex = 0.0
    total_savings = 0.0

    # Calculate baseline cost (buying all energy from grid at current prices)
    resource_map = {r.resource_type.value: r for r in data.resources}
    baseline_cost = _calculate_baseline_cost(data, resource_map)
    baseline_co2 = _calculate_baseline_co2(data, resource_map)

    for tech in data.technologies:
        tid = tech.id
        if tid not in v.cap:
            continue

        cap_val = pulp.value(v.cap[tid]) or 0.0
        if cap_val < 0.01:  # skip negligible capacities
            continue

        # Calculate annual production (sum of all energy outputs)
        annual_prod_kwh = 0.0
        if tid in v.energy_out:
            for eu, hourly_vars in v.energy_out[tid].items():
                annual_prod_kwh += sum(pulp.value(var) or 0.0 for var in hourly_vars)

        # CAPEX
        tech_capex = 0.0
        if not tech.is_existing:
            tech_capex = tech.capex_per_kw * cap_val

        # Annual OPEX (maintenance)
        tech_opex = tech.maintenance_annual_per_kw * cap_val

        # Annualized CAPEX
        annuity = crf(data.wacc, tech.lifetime) if not tech.is_existing else 0.0

        tech_results.append(TechResult(
            technology_id=tid,
            technology_name=tech.name,
            optimal_capacity_kw=round(cap_val, 2),
            annual_production_mwh=round(annual_prod_kwh / 1000, 4),
            capex=round(tech_capex, 2),
            annual_opex=round(tech_opex, 2),
            annual_savings=0.0,  # calculated below
        ))

        total_capex += tech_capex
        total_opex += tech_opex

    # Calculate optimized resource costs
    optimized_cost = 0.0
    optimized_co2 = 0.0

    for rt_str, buy_vars in v.buy.items():
        r = resource_map.get(rt_str)
        if r:
            total_bought_kwh = sum(pulp.value(var) or 0.0 for var in buy_vars)
            optimized_cost += total_bought_kwh * r.buying_price / 1000  # EUR
            optimized_co2 += total_bought_kwh * r.co2_factor / 1000  # tCO2

    for rt_str, sell_vars in v.sell.items():
        r = resource_map.get(rt_str)
        if r and r.selling_price > 0:
            total_sold_kwh = sum(pulp.value(var) or 0.0 for var in sell_vars)
            optimized_cost -= total_sold_kwh * r.selling_price / 1000

    # Baseline thermal supply cost and CO2
    for eu_str, buy_vars in v.thermal_buy.items():
        eu = EndUse(eu_str)
        efficiency = BASELINE_EFFICIENCY.get(eu, 0.9)
        res_type = BASELINE_RESOURCE.get(eu)
        if res_type is None:
            continue
        r = resource_map.get(res_type.value)
        if r is None:
            continue
        total_thbuy_kwh = sum(pulp.value(var) or 0.0 for var in buy_vars)
        optimized_cost += total_thbuy_kwh * r.buying_price / efficiency / 1000
        optimized_co2 += total_thbuy_kwh * r.co2_factor / efficiency / 1000
        if total_thbuy_kwh > 0:
            logger.info(
                f"Baseline thermal supply for {eu_str}: "
                f"{total_thbuy_kwh / 1000:.1f} MWh "
                f"(cost: {total_thbuy_kwh * r.buying_price / efficiency / 1000:.0f} EUR)"
            )

    total_savings = baseline_cost - (optimized_cost + total_opex)

    # BUG-003 fix: distribute total_savings proportionally by production
    total_production = sum(t.annual_production_mwh for t in tech_results)
    if total_production > 0 and total_savings > 0:
        for t in tech_results:
            t.annual_savings = round(
                total_savings * (t.annual_production_mwh / total_production), 2
            )

    # Financial metrics
    payback = total_capex / total_savings if total_savings > 0 else None

    # NPV (simple: -capex + savings * PV annuity factor over 20 years)
    npv = None
    if total_savings > 0 and data.wacc > 0:
        pv_factor = (1 - (1 + data.wacc) ** -20) / data.wacc
        npv = -total_capex + total_savings * pv_factor

    # CO2 reduction
    co2_reduction = 0.0
    if baseline_co2 > 0:
        co2_reduction = (baseline_co2 - optimized_co2) / baseline_co2

    # Storage results
    storage_results = []
    for storage in data.storage_systems:
        sid = storage.id
        if sid in v.charge:
            total_charged = sum(pulp.value(var) or 0.0 for var in v.charge[sid])
            cycles = total_charged / storage.capacity_kwh if storage.capacity_kwh > 0 else 0
            storage_results.append(StorageResult(
                storage_id=sid,
                storage_name=storage.name,
                optimal_capacity_kwh=storage.capacity_kwh,
                capex=storage.capex_per_kwh * storage.capacity_kwh,
                annual_cycles=round(cycles, 1),
            ))

    return OptimizationResult(
        scenario_id=config.scenario_id,
        status="completed",
        solver_status=solver_status,
        total_capex=round(total_capex, 2),
        total_opex_annual=round(total_opex, 2),
        total_savings_annual=round(total_savings, 2),
        payback_years=round(payback, 2) if payback is not None else None,
        irr=_calculate_irr(total_capex, total_savings),
        npv=round(npv, 2) if npv is not None else None,
        co2_baseline=round(baseline_co2, 4),
        co2_optimized=round(optimized_co2, 4),
        co2_reduction_percent=round(co2_reduction, 4),
        tech_results=tech_results,
        storage_results=storage_results,
    )


def _calculate_baseline_cost(data: AnalysisData, resource_map: dict) -> float:
    """Calculate the baseline annual energy cost (no optimization).

    For electricity: buy from grid.
    For thermal: buy fuel and convert via conventional equipment (gas boiler / chiller)
    accounting for conversion efficiency.
    """
    total = 0.0
    for demand in data.demands:
        if demand.end_use == EndUse.ELECTRICITY:
            r = resource_map.get("electricity")
            if r:
                total += demand.annual_consumption_mwh * r.buying_price
        else:
            # Thermal: use baseline resource + efficiency
            efficiency = BASELINE_EFFICIENCY.get(demand.end_use, 0.9)
            res_type = BASELINE_RESOURCE.get(demand.end_use)
            if res_type:
                r = resource_map.get(res_type.value)
                if r:
                    total += demand.annual_consumption_mwh * r.buying_price / efficiency
    return total


def _calculate_baseline_co2(data: AnalysisData, resource_map: dict) -> float:
    """Calculate baseline annual CO2 emissions (no optimization)."""
    total = 0.0
    for demand in data.demands:
        if demand.end_use == EndUse.ELECTRICITY:
            r = resource_map.get("electricity")
            if r:
                total += demand.annual_consumption_mwh * r.co2_factor
        else:
            efficiency = BASELINE_EFFICIENCY.get(demand.end_use, 0.9)
            res_type = BASELINE_RESOURCE.get(demand.end_use)
            if res_type:
                r = resource_map.get(res_type.value)
                if r:
                    total += demand.annual_consumption_mwh * r.co2_factor / efficiency
    return total


def _calculate_irr(capex: float, annual_savings: float, years: int = 20) -> float | None:
    """Calculate IRR (Internal Rate of Return) using the bisection method.

    IRR is the discount rate that makes NPV = 0.
    Cash flows: [-capex, savings, savings, ..., savings] for `years` periods.
    Returns the IRR as a decimal (e.g. 0.12 = 12%), or None if not computable.
    """
    if capex <= 0 or annual_savings <= 0:
        return None

    def npv_at_rate(rate: float) -> float:
        return -capex + sum(annual_savings / (1 + rate) ** t for t in range(1, years + 1))

    # If NPV is negative even at 0% discount, the project never pays back
    if npv_at_rate(0.0) < 0:
        return None

    # Upper bound: 500% — if NPV is still positive, return that bound
    high = 5.0
    if npv_at_rate(high) > 0:
        return round(high, 4)

    # Bisection between 0% and 500%
    low = 0.0
    for _ in range(100):
        mid = (low + high) / 2
        if npv_at_rate(mid) > 0:
            low = mid
        else:
            high = mid
        if abs(high - low) < 0.0001:
            break

    return round((low + high) / 2, 4)


def _check_demand_coverage(data: AnalysisData) -> list[str]:
    """Check which demand vectors have dedicated technology coverage.

    Returns a list of warning strings for demands that rely entirely on
    baseline supply (no technology produces that end-use).
    """
    warnings: list[str] = []

    _EU_LABELS = {
        EndUse.ELECTRICITY: "Elettricità",
        EndUse.HEAT_HIGH_T: "Calore alta temperatura",
        EndUse.HEAT_MED_T: "Calore media temperatura",
        EndUse.HEAT_LOW_T: "Calore bassa temperatura",
        EndUse.COLD: "Raffrescamento",
    }

    for demand in data.demands:
        if demand.annual_consumption_mwh <= 0:
            continue
        eu = demand.end_use

        # Check if any technology produces this end-use
        has_producer = any(
            any(out.end_use == eu for out in tech.outputs)
            for tech in data.technologies
        )

        if not has_producer:
            label = _EU_LABELS.get(eu, eu.value)
            if eu == EndUse.ELECTRICITY:
                # Electricity is always covered by the grid
                continue
            warnings.append(
                f"{label} ({demand.annual_consumption_mwh:.0f} MWh/anno): "
                f"nessuna tecnologia selezionata produce questo vettore energetico. "
                f"Sarà coperto dal sistema convenzionale (baseline)."
            )
    return warnings
