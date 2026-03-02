"""Generate AI-powered energy technology suggestions using Claude API."""

from __future__ import annotations

import json
import logging

from anthropic import Anthropic
from pydantic import BaseModel

from config import settings

logger = logging.getLogger(__name__)


class TechSuggestion(BaseModel):
    """A single technology suggestion from the AI."""
    technology_name: str
    category: str  # e.g. "solar", "heat_pump", "battery"
    rationale: str  # Why this is recommended
    estimated_capacity_kw: float | None = None
    estimated_savings_percent: float | None = None
    priority: str  # "high", "medium", "low"
    co2_impact: str  # Brief description of CO2 impact


class SuggestionsResponse(BaseModel):
    """Response containing AI suggestions."""
    suggestions: list[TechSuggestion]
    overall_assessment: str  # General assessment of the energy profile
    key_opportunities: list[str]  # Top 3-5 bullet points


class EnergyProfile(BaseModel):
    """Input energy profile for suggestion generation."""
    nace_code: str | None = None
    sector: str | None = None
    annual_consumption_mwh: float
    demands: list[dict]  # [{end_use, annual_consumption_mwh}]
    resources: list[dict]  # [{resource_type, buying_price}]
    existing_technologies: list[dict]  # [{name, capacity_kw, category}]
    available_technologies: list[dict]  # [{name, category, capex_per_kw}]
    budget_limit: float | None = None
    roof_area_sqm: float | None = None
    latitude: float | None = None


SYSTEM_PROMPT = """Sei un consulente energetico esperto specializzato in efficienza energetica e decarbonizzazione per il mercato italiano.

Dato il profilo energetico di un sito industriale/commerciale, devi suggerire le tecnologie più appropriate per ridurre costi e emissioni CO2.

Considera:
- Il settore NACE e le caratteristiche tipiche del settore
- I consumi attuali per vettore energetico (elettricità, calore, freddo)
- Le risorse già disponibili e i relativi costi
- Le tecnologie già installate (per evitare duplicati)
- Il catalogo tecnologie disponibili con i relativi costi
- Il budget disponibile (se specificato)
- L'area tetto disponibile per fotovoltaico (se specificata)
- La localizzazione geografica (irraggiamento solare)

Rispondi in formato JSON con la seguente struttura:
{
  "suggestions": [
    {
      "technology_name": "nome della tecnologia",
      "category": "categoria (solar, wind, heat_pump, chp, boiler, chiller, battery, thermal_storage, led, other)",
      "rationale": "spiegazione in italiano del perché è consigliata",
      "estimated_capacity_kw": numero o null,
      "estimated_savings_percent": percentuale stimata di risparmio (0-100) o null,
      "priority": "high/medium/low",
      "co2_impact": "descrizione breve dell'impatto CO2"
    }
  ],
  "overall_assessment": "valutazione generale del profilo energetico in italiano (2-3 frasi)",
  "key_opportunities": ["opportunità 1", "opportunità 2", "opportunità 3"]
}

Fornisci 3-6 suggerimenti ordinati per priorità. Rispondi SOLO con il JSON."""


def generate_suggestions(profile: EnergyProfile) -> SuggestionsResponse:
    """Generate AI-powered technology suggestions for an energy profile."""
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY non configurata")

    client = Anthropic(api_key=settings.anthropic_api_key)

    # Build the user message with all profile context
    user_msg = f"""Profilo energetico del sito:

- Settore NACE: {profile.nace_code or 'Non specificato'}
- Consumo totale annuo: {profile.annual_consumption_mwh:.1f} MWh

Domande energetiche:
{json.dumps(profile.demands, indent=2, ensure_ascii=False)}

Risorse energetiche (prezzi):
{json.dumps(profile.resources, indent=2, ensure_ascii=False)}

Tecnologie già installate:
{json.dumps(profile.existing_technologies, indent=2, ensure_ascii=False) if profile.existing_technologies else 'Nessuna'}

Catalogo tecnologie disponibili:
{json.dumps(profile.available_technologies, indent=2, ensure_ascii=False)}

Budget disponibile: {f'€ {profile.budget_limit:,.0f}' if profile.budget_limit else 'Non specificato'}
Area tetto: {f'{profile.roof_area_sqm:,.0f} m²' if profile.roof_area_sqm else 'Non specificata'}
Latitudine: {profile.latitude or 'Non specificata'}

Genera i suggerimenti di intervento energetico."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw_text = message.content[0].text.strip()

    try:
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        data = json.loads(raw_text)
        return SuggestionsResponse(**data)
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Failed to parse AI suggestions: {e}")
        return SuggestionsResponse(
            suggestions=[],
            overall_assessment="Impossibile generare suggerimenti al momento.",
            key_opportunities=[],
        )
