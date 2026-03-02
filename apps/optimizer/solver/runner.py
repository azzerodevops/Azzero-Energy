from __future__ import annotations
import logging
import pulp
from config import settings
from models.input import AnalysisData, ScenarioConfig
from models.output import OptimizationResult, TechResult, StorageResult
from models.enums import Objective, EndUse
from solver.variables import create_all_variables, OptVars, HOURS
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

    if not data.technologies:
        return OptimizationResult(
            scenario_id=config.scenario_id,
            status="failed",
            error_message=(
                "Nessuna tecnologia trovata per questa analisi. "
                "Aggiungi almeno una tecnologia nella sezione 'Tecnologie'."
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

    # Check that at least one technology has conversion data
    techs_with_io = [t for t in data.technologies if t.inputs and t.outputs]
    if not techs_with_io:
        return OptimizationResult(
            scenario_id=config.scenario_id,
            status="failed",
            error_message=(
                "Nessuna delle tecnologie selezionate ha dati di conversione (input/output). "
                "L'ottimizzazione non può procedere senza parametri di conversione. "
                "Contatta l'amministratore per configurare il catalogo tecnologie."
            ),
        )

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
        # Translate solver status to actionable Italian error messages
        status_messages: dict[str, str] = {
            "Infeasible": (
                "Il problema è infeasible: non esiste una soluzione che soddisfi tutti i vincoli. "
                "Possibili cause:\n"
                "- Vincolo di budget troppo restrittivo\n"
                "- Capacità minima delle tecnologie superiore alla domanda\n"
                "- Dati di conversione tecnologica mancanti o errati\n"
                "Prova a rilassare i vincoli o aggiungere più tecnologie."
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

    total_savings = baseline_cost - (optimized_cost + total_opex)

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
        irr=None,  # IRR requires iterative calculation, skip for now
        npv=round(npv, 2) if npv is not None else None,
        co2_baseline=round(baseline_co2, 4),
        co2_optimized=round(optimized_co2, 4),
        co2_reduction_percent=round(co2_reduction, 4),
        tech_results=tech_results,
        storage_results=storage_results,
    )


def _calculate_baseline_cost(data: AnalysisData, resource_map: dict) -> float:
    """Calculate the baseline annual energy cost (no optimization, buy everything from grid)."""
    total = 0.0
    for demand in data.demands:
        # For electricity, use electricity price
        if demand.end_use == EndUse.ELECTRICITY:
            r = resource_map.get("electricity")
            if r:
                total += demand.annual_consumption_mwh * r.buying_price  # EUR (MWh * EUR/MWh)
        elif demand.end_use in (EndUse.HEAT_HIGH_T, EndUse.HEAT_MED_T, EndUse.HEAT_LOW_T):
            r = resource_map.get("natural_gas")
            if r:
                total += demand.annual_consumption_mwh * r.buying_price
        elif demand.end_use == EndUse.COLD:
            r = resource_map.get("electricity")
            if r:
                total += demand.annual_consumption_mwh * r.buying_price
    return total


def _calculate_baseline_co2(data: AnalysisData, resource_map: dict) -> float:
    """Calculate baseline annual CO2 emissions (no optimization)."""
    total = 0.0
    for demand in data.demands:
        if demand.end_use == EndUse.ELECTRICITY:
            r = resource_map.get("electricity")
            if r:
                total += demand.annual_consumption_mwh * r.co2_factor  # tCO2
        elif demand.end_use in (EndUse.HEAT_HIGH_T, EndUse.HEAT_MED_T, EndUse.HEAT_LOW_T):
            r = resource_map.get("natural_gas")
            if r:
                total += demand.annual_consumption_mwh * r.co2_factor
        elif demand.end_use == EndUse.COLD:
            r = resource_map.get("electricity")
            if r:
                total += demand.annual_consumption_mwh * r.co2_factor
    return total
