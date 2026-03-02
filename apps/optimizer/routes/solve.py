from __future__ import annotations
import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException
from models.output import SolveResponse, StatusResponse, OptimizationResult, ValidationResult
from models.enums import ScenarioStatus
from db.client import (
    fetch_analysis_data,
    fetch_scenario_config,
    save_results,
    update_scenario_status,
    validate_analysis_data,
)
from solver.runner import run_optimization

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/solve", tags=["solver"])

# In-memory store for results (simple approach, production would use Redis)
_results_cache: dict[str, OptimizationResult] = {}

# Italian-language error messages for common solver failures
_SOLVER_ERROR_HINTS: dict[str, str] = {
    "Infeasible": (
        "Il problema è infeasible (nessuna soluzione possibile). "
        "Cause comuni: vincoli di budget troppo stretti, capacità minima "
        "troppo alta rispetto alla domanda, oppure dati di conversione "
        "tecnologica mancanti. Prova a rilassare i vincoli o aggiungere "
        "più tecnologie."
    ),
    "Unbounded": (
        "Il problema è illimitato (unbounded). Questo di solito indica "
        "un errore nei dati: prezzi a zero o fattori di conversione mancanti."
    ),
    "Not Solved": (
        "Il solver non è riuscito a trovare una soluzione entro il "
        "tempo limite. Prova a semplificare lo scenario o aumentare "
        "il timeout."
    ),
}


def _translate_solver_error(error_message: str) -> str:
    """Translate solver error messages to Italian with actionable hints."""
    for key, hint in _SOLVER_ERROR_HINTS.items():
        if key.lower() in error_message.lower():
            return hint
    # Fallback: wrap the original message in Italian context
    return f"Errore del solver: {error_message}"


async def _run_solve_job(scenario_id: str) -> None:
    """Background task that runs the optimization."""
    try:
        await update_scenario_status(scenario_id, "running")

        config, analysis_id = await fetch_scenario_config(scenario_id)
        data, auto_fixes = await fetch_analysis_data(analysis_id, auto_fix=True)

        if auto_fixes:
            logger.info(
                "Auto-fix applicati per scenario %s: %s",
                scenario_id,
                "; ".join(auto_fixes),
            )

        result = run_optimization(data, config)

        if result.status == "completed":
            await save_results(scenario_id, result)
            await update_scenario_status(scenario_id, "completed")
        else:
            # Translate error to Italian for user display
            italian_error = (
                _translate_solver_error(result.error_message)
                if result.error_message
                else "Ottimizzazione fallita per un errore sconosciuto."
            )
            await update_scenario_status(
                scenario_id, "failed", error_message=italian_error
            )

        _results_cache[scenario_id] = result

    except Exception as e:
        logger.exception(f"Optimization failed for scenario {scenario_id}")
        italian_error = _translate_solver_error(str(e))
        await update_scenario_status(
            scenario_id, "failed", error_message=italian_error
        )
        _results_cache[scenario_id] = OptimizationResult(
            scenario_id=scenario_id,
            status="failed",
            error_message=italian_error,
        )


@router.get("/{scenario_id}/validate", response_model=ValidationResult)
async def validate(scenario_id: str):
    """Pre-validate analysis data before running optimization.

    Returns errors (blocking), warnings (non-blocking), and
    any auto-fixes that were applied during validation.
    """
    try:
        result = await validate_analysis_data(scenario_id)
        return result
    except Exception as e:
        logger.exception(f"Validation failed for scenario {scenario_id}")
        return ValidationResult(
            valid=False,
            errors=[f"Errore durante la validazione: {str(e)}"],
        )


@router.post("/{scenario_id}", response_model=SolveResponse)
async def solve(scenario_id: str, background_tasks: BackgroundTasks):
    """Launch optimization for a scenario.

    Performs pre-validation before queueing. If blocking errors are found,
    returns them immediately without starting the solver.
    """
    # Pre-validate before queueing
    try:
        validation = await validate_analysis_data(scenario_id)
        if not validation.valid:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Validazione fallita. Correggi i seguenti errori prima di lanciare l'ottimizzazione.",
                    "errors": validation.errors,
                    "warnings": validation.warnings,
                    "auto_fixes_applied": validation.auto_fixes_applied,
                },
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Pre-validation failed for scenario {scenario_id}")
        raise HTTPException(
            status_code=500,
            detail=f"Errore durante la pre-validazione: {str(e)}",
        )

    try:
        await update_scenario_status(scenario_id, "queued")
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Scenario non trovato: {e}")

    background_tasks.add_task(_run_solve_job, scenario_id)
    return SolveResponse(scenario_id=scenario_id)


@router.get("/{scenario_id}/status", response_model=StatusResponse)
async def status(scenario_id: str):
    """Check the status of an optimization run."""
    from db.client import get_supabase_client
    client = get_supabase_client()

    try:
        try:
            resp = (
                client.table("scenarios")
                .select("status, error_message")
                .eq("id", scenario_id)
                .single()
                .execute()
            )
        except Exception:
            # Fallback if error_message column doesn't exist
            resp = (
                client.table("scenarios")
                .select("status")
                .eq("id", scenario_id)
                .single()
                .execute()
            )
        return StatusResponse(
            scenario_id=scenario_id,
            status=resp.data["status"],
            error_message=resp.data.get("error_message"),
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Scenario non trovato")


@router.get("/{scenario_id}/results", response_model=OptimizationResult)
async def results(scenario_id: str):
    """Get optimization results for a scenario."""
    # Check cache first
    if scenario_id in _results_cache:
        return _results_cache[scenario_id]

    # Check DB
    from db.client import get_supabase_client
    client = get_supabase_client()

    sr = client.table("scenario_results").select("*").eq("scenario_id", scenario_id).execute()
    if not sr.data:
        raise HTTPException(status_code=404, detail="Nessun risultato trovato per questo scenario")

    sr_data = sr.data[0]

    # Fetch tech results
    tr = client.table("tech_results").select("*, technology_catalog(name)").eq("scenario_result_id", sr_data["id"]).execute()

    from models.output import TechResult
    tech_results = [
        TechResult(
            technology_id=t["technology_id"],
            technology_name=t.get("technology_catalog", {}).get("name", ""),
            optimal_capacity_kw=float(t["optimal_capacity_kw"] or 0),
            annual_production_mwh=float(t["annual_production_mwh"] or 0),
            capex=float(t["capex"] or 0),
            annual_savings=float(t["annual_savings"] or 0),
        )
        for t in tr.data
    ]

    return OptimizationResult(
        scenario_id=scenario_id,
        status="completed",
        total_capex=float(sr_data["total_capex"] or 0),
        total_opex_annual=float(sr_data["total_opex_annual"] or 0),
        total_savings_annual=float(sr_data["total_savings_annual"] or 0),
        payback_years=float(sr_data["payback_years"]) if sr_data.get("payback_years") else None,
        irr=float(sr_data["irr"]) if sr_data.get("irr") else None,
        npv=float(sr_data["npv"]) if sr_data.get("npv") else None,
        co2_reduction_percent=float(sr_data["co2_reduction_percent"] or 0),
        tech_results=tech_results,
    )
