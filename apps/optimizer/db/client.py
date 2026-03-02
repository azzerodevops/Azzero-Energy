"""Supabase database client for the AzzeroCO2 optimizer.

Uses the supabase-py SDK to fetch analysis data, scenario configurations,
and persist optimization results back to the database.
"""

from __future__ import annotations

import logging
from supabase import create_client, Client

from config import settings

logger = logging.getLogger(__name__)

_client: Client | None = None

# Default resource definitions for auto-fix
_DEFAULT_RESOURCES = [
    {
        "resource_type": "electricity",
        "buying_price": 250.0,    # EUR/MWh
        "selling_price": 50.0,    # EUR/MWh
        "co2_factor": 0.233,      # tCO2/MWh (media Italia 2024)
    },
    {
        "resource_type": "natural_gas",
        "buying_price": 90.0,     # EUR/MWh
        "selling_price": 0.0,
        "co2_factor": 0.202,      # tCO2/MWh
    },
]

# Number of hours in a year for flat profile generation
_HOURS_PER_YEAR = 8760


def get_supabase_client() -> Client:
    """Return a singleton Supabase client using the service role key."""
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client


async def fetch_analysis_data(
    analysis_id: str,
    auto_fix: bool = True,
) -> tuple["AnalysisData", list[str]]:
    """Fetch all data needed for optimization from Supabase.

    Queries: analyses, demands, analysis_resources,
    analysis_technologies + technology_catalog + tech_inputs/outputs,
    and storage_systems.

    When auto_fix is True, missing resources and demand profiles are
    automatically generated. Returns a tuple of (AnalysisData, auto_fixes)
    where auto_fixes is a list of Italian-language descriptions of auto-applied
    corrections.
    """
    from models.input import AnalysisData, Demand, Resource, StorageSystem, Technology, TechIO
    from profiles.generator import generate_hourly_profile, default_profile_type_for_end_use

    client = get_supabase_client()
    auto_fixes: list[str] = []

    # 1. Fetch analysis record (for wacc, etc.)
    analysis = (
        client.table("analyses")
        .select("*")
        .eq("id", analysis_id)
        .single()
        .execute()
    )

    # 2. Fetch energy demands
    demands_resp = (
        client.table("demands")
        .select("*")
        .eq("analysis_id", analysis_id)
        .execute()
    )

    # 3. Fetch available resources with prices and emission factors
    resources_resp = (
        client.table("analysis_resources")
        .select("*")
        .eq("analysis_id", analysis_id)
        .execute()
    )

    # --- Auto-fix: insert default resources if none found ---
    if auto_fix and not resources_resp.data:
        logger.warning(
            "Nessuna risorsa trovata per l'analisi %s — inserimento risorse di default",
            analysis_id,
        )
        for res_def in _DEFAULT_RESOURCES:
            client.table("analysis_resources").insert(
                {"analysis_id": analysis_id, **res_def}
            ).execute()
        auto_fixes.append(
            "Aggiunte risorse energetiche di default "
            "(rete elettrica @ 250 EUR/MWh + gas naturale @ 90 EUR/MWh)"
        )
        # Re-fetch after insert
        resources_resp = (
            client.table("analysis_resources")
            .select("*")
            .eq("analysis_id", analysis_id)
            .execute()
        )

    # 4. Fetch analysis_technologies joined with the technology catalog
    at_resp = (
        client.table("analysis_technologies")
        .select("*, technology_catalog(*)")
        .eq("analysis_id", analysis_id)
        .execute()
    )

    # 5. For each technology, fetch its input/output conversion factors
    technologies: list[Technology] = []
    for at in at_resp.data:
        cat = at["technology_catalog"]
        tech_id: str = cat["id"]

        inputs_resp = (
            client.table("tech_inputs")
            .select("*")
            .eq("technology_id", tech_id)
            .execute()
        )
        outputs_resp = (
            client.table("tech_outputs")
            .select("*")
            .eq("technology_id", tech_id)
            .execute()
        )

        tech = Technology(
            id=tech_id,
            name=cat["name"],
            category=cat["category"],
            capex_per_kw=float(cat["capex_per_kw"] or 0),
            maintenance_annual_per_kw=float(cat["maintenance_annual_per_kw"] or 0),
            lifetime=int(cat["lifetime"] or 20),
            capacity_factor=float(cat["capacity_factor"] or 1.0),
            min_size_kw=float(cat["min_size_kw"] or 0),
            max_size_kw=float(cat["max_size_kw"] or 100000),
            installed_capacity_kw=float(at["installed_capacity_kw"] or 0),
            is_existing=at["is_existing"] or False,
            inputs=[
                TechIO(
                    resource_type=i["resource_type"],
                    conversion_factor=float(i["conversion_factor"] or 1.0),
                )
                for i in inputs_resp.data
            ],
            outputs=[
                TechIO(
                    end_use=o["end_use"],
                    conversion_factor=float(o["conversion_factor"] or 1.0),
                )
                for o in outputs_resp.data
            ],
        )
        technologies.append(tech)

    # 6. Fetch storage systems
    storage_resp = (
        client.table("storage_systems")
        .select("*")
        .eq("analysis_id", analysis_id)
        .execute()
    )

    # Build demands with auto-fix for missing hourly profiles
    demands: list[Demand] = []
    for d in demands_resp.data:
        hourly_profile = d.get("hourly_profile")
        annual_mwh = float(d["annual_consumption_mwh"] or 0)
        end_use = d["end_use"]
        profile_type = d.get("profile_type") or "nace_default"

        if auto_fix and hourly_profile is None and annual_mwh > 0:
            # Determine the profile type to use for generation
            gen_profile_type = profile_type
            if gen_profile_type in ("nace_default", "custom", "upload"):
                gen_profile_type = default_profile_type_for_end_use(end_use)

            # Generate realistic hourly profile using the profile generator
            hourly_profile = generate_hourly_profile(
                annual_mwh=annual_mwh,
                end_use=end_use,
                profile_type=gen_profile_type,
            )
            logger.warning(
                "Profilo orario mancante per domanda %s (%s) — generato profilo '%s'",
                d["id"],
                end_use,
                gen_profile_type,
            )
            auto_fixes.append(
                f"Generato profilo orario '{gen_profile_type}' per {end_use} "
                f"({annual_mwh:.1f} MWh/anno)"
            )

        demands.append(
            Demand(
                id=d["id"],
                end_use=end_use,
                annual_consumption_mwh=annual_mwh,
                profile_type=profile_type,
                hourly_profile=hourly_profile,
            )
        )

    # Build and return the complete AnalysisData model + auto-fixes list
    return (
        AnalysisData(
            analysis_id=analysis_id,
            wacc=float(analysis.data["wacc"] or 0.05),
            demands=demands,
            resources=[
                Resource(
                    id=r["id"],
                    resource_type=r["resource_type"],
                    buying_price=float(r["buying_price"] or 0),
                    selling_price=float(r["selling_price"] or 0),
                    co2_factor=float(r["co2_factor"] or 0),
                    max_availability=(
                        float(r["max_availability"]) if r.get("max_availability") else None
                    ),
                )
                for r in resources_resp.data
            ],
            technologies=technologies,
            storage_systems=[
                StorageSystem(
                    id=s["id"],
                    name=s.get("name", ""),
                    storage_type=s["storage_type"],
                    capacity_kwh=float(s["capacity_kwh"] or 0),
                    max_charge_kw=float(s["max_charge_kw"] or 0),
                    max_discharge_kw=float(s["max_discharge_kw"] or 0),
                    charge_efficiency=float(s["charge_efficiency"] or 0.95),
                    discharge_efficiency=float(s["discharge_efficiency"] or 0.95),
                    self_discharge_rate=float(s["self_discharge_rate"] or 0),
                    capex_per_kwh=float(s["capex_per_kwh"] or 0),
                    min_soc=float(s["min_soc"] or 0.1),
                    max_soc=float(s["max_soc"] or 0.9),
                )
                for s in storage_resp.data
            ],
        ),
        auto_fixes,
    )


async def fetch_scenario_config(scenario_id: str) -> tuple["ScenarioConfig", str]:
    """Fetch scenario configuration and return (ScenarioConfig, analysis_id).

    Queries the scenarios table and its associated tech_configs to build
    the ScenarioConfig model that drives the optimizer constraints.
    """
    from models.input import ScenarioConfig, ScenarioTechConfig

    client = get_supabase_client()

    scenario = (
        client.table("scenarios")
        .select("*")
        .eq("id", scenario_id)
        .single()
        .execute()
    )

    tech_configs_resp = (
        client.table("scenario_tech_configs")
        .select("*")
        .eq("scenario_id", scenario_id)
        .execute()
    )

    config = ScenarioConfig(
        scenario_id=scenario_id,
        objective=scenario.data["objective"] or "cost",
        co2_target=(
            float(scenario.data["co2_target"])
            if scenario.data.get("co2_target") is not None
            else None
        ),
        budget_limit=(
            float(scenario.data["budget_limit"])
            if scenario.data.get("budget_limit") is not None
            else None
        ),
        tech_configs=[
            ScenarioTechConfig(
                technology_id=tc["technology_id"],
                min_capacity_kw=(
                    float(tc["min_capacity_kw"])
                    if tc.get("min_capacity_kw") is not None
                    else None
                ),
                max_capacity_kw=(
                    float(tc["max_capacity_kw"])
                    if tc.get("max_capacity_kw") is not None
                    else None
                ),
                force_include=tc.get("force_include", False),
            )
            for tc in tech_configs_resp.data
        ],
    )

    return config, scenario.data["analysis_id"]


async def update_scenario_status(
    scenario_id: str,
    status: str,
    error_message: str | None = None,
) -> None:
    """Update the scenario status in the database.

    When status is 'failed', the error_message is saved for user display.
    When status changes to any other value, error_message is cleared.
    """
    client = get_supabase_client()

    update_data: dict[str, str | None] = {"status": status}

    # Try to include error_message if the column exists
    try:
        if status == "failed":
            update_data["error_message"] = error_message or "Errore sconosciuto durante l'ottimizzazione."
        else:
            update_data["error_message"] = None
        client.table("scenarios").update(update_data).eq("id", scenario_id).execute()
    except Exception as e:
        if "error_message" in str(e):
            # Column doesn't exist yet — update without it
            logger.warning("error_message column not found, updating status only")
            client.table("scenarios").update({"status": status}).eq("id", scenario_id).execute()
        else:
            raise


async def save_results(scenario_id: str, result: "OptimizationResult") -> None:
    """Save optimization results to scenario_results and tech_results tables.

    Performs an upsert pattern: deletes any existing results for the scenario
    before inserting new ones, so re-runs are idempotent.
    """
    from models.output import OptimizationResult  # noqa: F811 – runtime type check

    client = get_supabase_client()

    # Delete existing results for this scenario (upsert pattern)
    existing = (
        client.table("scenario_results")
        .select("id")
        .eq("scenario_id", scenario_id)
        .execute()
    )
    for existing_row in existing.data:
        client.table("tech_results").delete().eq(
            "scenario_result_id", existing_row["id"]
        ).execute()
    client.table("scenario_results").delete().eq(
        "scenario_id", scenario_id
    ).execute()

    # Insert the new scenario-level result
    sr = (
        client.table("scenario_results")
        .insert(
            {
                "scenario_id": scenario_id,
                "total_capex": result.total_capex,
                "total_opex_annual": result.total_opex_annual,
                "total_savings_annual": result.total_savings_annual,
                "payback_years": result.payback_years,
                "irr": result.irr,
                "npv": result.npv,
                "co2_reduction_percent": result.co2_reduction_percent,
            }
        )
        .execute()
    )

    scenario_result_id: str = sr.data[0]["id"]

    # Insert per-technology results
    for tr in result.tech_results:
        client.table("tech_results").insert(
            {
                "scenario_result_id": scenario_result_id,
                "technology_id": tr.technology_id,
                "optimal_capacity_kw": tr.optimal_capacity_kw,
                "annual_production_mwh": tr.annual_production_mwh,
                "capex": tr.capex,
                "annual_savings": tr.annual_savings,
            }
        ).execute()


async def validate_analysis_data(scenario_id: str) -> "ValidationResult":
    """Pre-validate analysis data before running optimization.

    Checks that the analysis linked to the given scenario has the minimum
    data required for a successful solve. When fixable issues are detected
    (e.g. missing resources), auto-fixes are applied and reported.

    Returns a ValidationResult with errors, warnings and auto_fixes_applied.
    """
    from models.output import ValidationResult

    client = get_supabase_client()

    errors: list[str] = []
    warnings: list[str] = []
    auto_fixes: list[str] = []

    # --- Resolve scenario -> analysis_id ---
    try:
        scenario = (
            client.table("scenarios")
            .select("analysis_id")
            .eq("id", scenario_id)
            .single()
            .execute()
        )
        analysis_id: str = scenario.data["analysis_id"]
    except Exception:
        return ValidationResult(
            valid=False,
            errors=["Scenario non trovato. Verifica che l'ID sia corretto."],
        )

    # --- 1. Check demands ---
    demands_resp = (
        client.table("demands")
        .select("id, end_use, annual_consumption_mwh, hourly_profile")
        .eq("analysis_id", analysis_id)
        .execute()
    )

    if not demands_resp.data:
        errors.append(
            "Nessuna domanda energetica configurata. "
            "Aggiungi almeno un consumo (elettricità, calore, ecc.) nella sezione 'Consumi'."
        )
    else:
        zero_demands = [
            d for d in demands_resp.data
            if float(d.get("annual_consumption_mwh") or 0) == 0
        ]
        if zero_demands:
            warnings.append(
                f"{len(zero_demands)} domanda/e con consumo annuo pari a zero — "
                "verranno ignorate dall'ottimizzatore."
            )

        no_profile = [
            d for d in demands_resp.data
            if d.get("hourly_profile") is None and float(d.get("annual_consumption_mwh") or 0) > 0
        ]
        if no_profile:
            auto_fixes.append(
                f"Profilo orario mancante per {len(no_profile)} domanda/e — "
                "verrà generato un profilo piatto basato sul consumo annuo."
            )

    # --- 2. Check resources ---
    resources_resp = (
        client.table("analysis_resources")
        .select("id, resource_type, buying_price")
        .eq("analysis_id", analysis_id)
        .execute()
    )

    if not resources_resp.data:
        # Auto-fix: insert default resources
        for res_def in _DEFAULT_RESOURCES:
            client.table("analysis_resources").insert(
                {"analysis_id": analysis_id, **res_def}
            ).execute()
        auto_fixes.append(
            "Aggiunte risorse energetiche di default "
            "(rete elettrica @ 250 EUR/MWh + gas naturale @ 90 EUR/MWh)"
        )
    else:
        resource_types = {r["resource_type"] for r in resources_resp.data}
        if "electricity" not in resource_types:
            warnings.append(
                "La rete elettrica non è configurata come risorsa. "
                "Questo potrebbe limitare le soluzioni disponibili."
            )
        zero_price = [
            r for r in resources_resp.data if float(r.get("buying_price") or 0) == 0
        ]
        if zero_price:
            warnings.append(
                f"{len(zero_price)} risorsa/e con prezzo di acquisto a zero — "
                "l'ottimizzatore potrebbe sovrautilizzarle."
            )

    # --- 3. Check technologies ---
    at_resp = (
        client.table("analysis_technologies")
        .select("id, technology_id, technology_catalog(id, name)")
        .eq("analysis_id", analysis_id)
        .execute()
    )

    if not at_resp.data:
        errors.append(
            "Nessuna tecnologia selezionata per l'analisi. "
            "Aggiungi almeno una tecnologia nella sezione 'Tecnologie'."
        )
    else:
        # Check that at least one technology has defined inputs AND outputs
        techs_without_io: list[str] = []
        for at in at_resp.data:
            cat = at.get("technology_catalog")
            if not cat:
                continue
            tech_id = cat["id"] if isinstance(cat, dict) else cat[0]["id"]
            tech_name = cat["name"] if isinstance(cat, dict) else cat[0]["name"]

            inputs = (
                client.table("tech_inputs")
                .select("id")
                .eq("technology_id", tech_id)
                .execute()
            )
            outputs = (
                client.table("tech_outputs")
                .select("id")
                .eq("technology_id", tech_id)
                .execute()
            )

            if not inputs.data or not outputs.data:
                techs_without_io.append(tech_name)

        if techs_without_io:
            if len(techs_without_io) == len(at_resp.data):
                # ALL technologies lack I/O — this is an error
                errors.append(
                    "Nessuna delle tecnologie selezionate ha dati di conversione (input/output) definiti. "
                    "L'ottimizzazione non può procedere. Contatta l'amministratore per configurare "
                    "i parametri di conversione nel catalogo tecnologie."
                )
            else:
                warnings.append(
                    f"Le seguenti tecnologie non hanno dati di conversione completi e "
                    f"potrebbero non essere considerate: {', '.join(techs_without_io)}."
                )

    valid = len(errors) == 0

    return ValidationResult(
        valid=valid,
        errors=errors,
        warnings=warnings,
        auto_fixes_applied=auto_fixes,
    )
