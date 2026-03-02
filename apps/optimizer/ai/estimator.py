"""AI-powered energy consumption estimator using Claude API."""

from __future__ import annotations

import json
import logging

from anthropic import Anthropic
from pydantic import BaseModel

from config import settings

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
#  Models                                                                      #
# --------------------------------------------------------------------------- #

class SiteInfo(BaseModel):
    """Site characteristics provided by the user from the wizard."""
    nace_code: str | None = None
    sector: str | None = None
    area_sqm: float | None = None
    employees: int | None = None
    operating_hours: int | None = None


class EnergyEstimate(BaseModel):
    """Estimated energy consumption values."""
    electricity_mwh: float
    gas_mwh: float
    heat_mwh: float
    profile_suggestion: str
    confidence: str  # "alta", "media", "bassa"


class EstimateResponse(BaseModel):
    """Response from the AI energy estimator."""
    estimates: EnergyEstimate
    recommendations: list[str]
    reasoning: str


# --------------------------------------------------------------------------- #
#  System prompt                                                               #
# --------------------------------------------------------------------------- #

ESTIMATE_SYSTEM_PROMPT = """Sei un auditor energetico italiano esperto con oltre 20 anni di esperienza in diagnosi energetiche per edifici commerciali e industriali secondo la norma ISO 50001.

Il tuo compito è stimare i consumi energetici annuali di un sito basandoti sulle informazioni disponibili (codice NACE, settore, superficie, numero dipendenti, ore operative).

Usa i tuoi benchmark di riferimento per il mercato italiano:
- Consumi specifici per settore NACE (kWh/m2, kWh/dipendente, kWh/ora operativa)
- Profili di carico tipici per settore (picchi mattutini, serali, stagionali)
- Ripartizione tipica tra elettricita, gas naturale e calore di processo

REGOLE:
1. Stima SEMPRE tutti i valori, anche con informazioni limitate. Usa i benchmark di settore.
2. Il campo "confidence" deve essere "alta" se hai NACE + superficie + dipendenti + ore, "media" se hai almeno 2 di questi, "bassa" se ne hai solo 1 o nessuno.
3. Il campo "profile_suggestion" deve descrivere il profilo di carico tipico (es. "Profilo ufficio: picco 8-18 lunedi-venerdi, carico base basso nel weekend").
4. Le "recommendations" devono essere 3-5 suggerimenti specifici e pratici in italiano.
5. Il campo "reasoning" deve spiegare brevemente come hai calcolato le stime (benchmark usati, ipotesi).

Rispondi SOLO con JSON valido nel seguente formato:
{
  "estimates": {
    "electricity_mwh": numero,
    "gas_mwh": numero,
    "heat_mwh": numero,
    "profile_suggestion": "descrizione del profilo di carico tipico",
    "confidence": "alta|media|bassa"
  },
  "recommendations": ["suggerimento 1", "suggerimento 2", "..."],
  "reasoning": "spiegazione del calcolo"
}"""


# --------------------------------------------------------------------------- #
#  Generator function                                                          #
# --------------------------------------------------------------------------- #

def generate_estimate(
    site_info: SiteInfo,
    questions: list[str],
) -> EstimateResponse:
    """Generate AI-powered energy consumption estimates for a site."""
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY non configurata")

    client = Anthropic(api_key=settings.anthropic_api_key)

    # Build context from site info
    info_parts: list[str] = []
    if site_info.nace_code:
        info_parts.append(f"- Codice NACE: {site_info.nace_code}")
    if site_info.sector:
        info_parts.append(f"- Settore: {site_info.sector}")
    if site_info.area_sqm is not None:
        info_parts.append(f"- Superficie: {site_info.area_sqm:,.0f} m\u00b2")
    if site_info.employees is not None:
        info_parts.append(f"- Dipendenti: {site_info.employees}")
    if site_info.operating_hours is not None:
        info_parts.append(f"- Ore operative annue: {site_info.operating_hours}")

    site_context = "\n".join(info_parts) if info_parts else "Nessuna informazione specifica disponibile."

    # Build user questions section
    questions_text = ""
    if questions:
        questions_text = "\n\nDomande specifiche dell'utente:\n" + "\n".join(
            f"- {q}" for q in questions
        )

    user_msg = f"""Informazioni sul sito:
{site_context}
{questions_text}

Sulla base di queste informazioni, stima i consumi energetici annuali e fornisci raccomandazioni."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=ESTIMATE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw_text = message.content[0].text.strip()

    try:
        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        data = json.loads(raw_text)
        return EstimateResponse(**data)
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Failed to parse AI estimate response: {e}\nRaw: {raw_text[:500]}")
        # Return a fallback response
        return EstimateResponse(
            estimates=EnergyEstimate(
                electricity_mwh=0,
                gas_mwh=0,
                heat_mwh=0,
                profile_suggestion="Impossibile determinare il profilo di carico.",
                confidence="bassa",
            ),
            recommendations=[
                "Inserisci manualmente i consumi dalle bollette energetiche.",
                "Contatta il tuo fornitore di energia per i dati storici.",
            ],
            reasoning="Non e' stato possibile generare una stima automatica. Si consiglia l'inserimento manuale.",
        )
