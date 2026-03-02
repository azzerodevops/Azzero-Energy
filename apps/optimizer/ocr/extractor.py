"""Extract energy bill data from images using Claude Vision API."""

from __future__ import annotations

import base64
import json
import logging

from anthropic import Anthropic
from pydantic import BaseModel

from config import settings

logger = logging.getLogger(__name__)


class BillData(BaseModel):
    """Structured data extracted from an energy bill."""
    provider: str | None = None
    bill_period: str | None = None
    consumption_kwh: float | None = None
    total_amount_eur: float | None = None
    unit_price_eur_kwh: float | None = None
    power_kw: float | None = None
    meter_number: str | None = None
    supply_type: str | None = None  # "electricity" or "gas"
    confidence: float = 0.0  # 0-1 confidence score


SYSTEM_PROMPT = """Sei un assistente specializzato nell'estrazione di dati da bollette energetiche italiane.
Analizza l'immagine della bolletta e estrai i seguenti dati in formato JSON:

{
  "provider": "nome del fornitore di energia",
  "bill_period": "periodo di fatturazione (es. 'Gennaio 2024 - Marzo 2024')",
  "consumption_kwh": numero di kWh consumati (solo il numero),
  "total_amount_eur": importo totale in EUR (solo il numero),
  "unit_price_eur_kwh": prezzo unitario in EUR/kWh (solo il numero),
  "power_kw": potenza impegnata in kW (solo il numero, se presente),
  "meter_number": "numero del contatore/POD/PDR",
  "supply_type": "electricity" o "gas",
  "confidence": un numero da 0 a 1 che indica la tua fiducia nell'estrazione
}

Se un campo non è leggibile o non presente, usa null.
Rispondi SOLO con il JSON, senza testo aggiuntivo."""


def extract_bill_data(image_bytes: bytes, media_type: str = "image/jpeg") -> BillData:
    """Extract structured data from a bill image using Claude Vision.

    Args:
        image_bytes: Raw image bytes (JPEG, PNG, etc.)
        media_type: MIME type of the image

    Returns:
        BillData with extracted fields
    """
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY non configurata")

    client = Anthropic(api_key=settings.anthropic_api_key)

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT,
                    },
                ],
            }
        ],
    )

    raw_text = message.content[0].text.strip()

    # Try to parse JSON from response
    try:
        # Handle potential markdown code blocks
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        data = json.loads(raw_text)
        return BillData(**data)
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Failed to parse OCR response: {e}")
        return BillData(confidence=0.0)
