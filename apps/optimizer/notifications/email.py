"""Email notification service for scenario completion.

For MVP, notifications are logged to console. When SMTP credentials are
configured (OPTIMIZER_SMTP_HOST, etc.), real emails will be sent.
"""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from config import settings

logger = logging.getLogger(__name__)


def _build_completed_html(
    scenario_name: str,
    analysis_name: str,
    total_capex: float,
    total_savings: float,
    payback_years: float | None,
    co2_reduction: float | None,
) -> str:
    """Build HTML email body for completed scenario."""
    return f"""<!DOCTYPE html>
<html>
<head>
<style>
  body {{ font-family: 'Inter', Arial, sans-serif; background: #121827; color: #F8FAFC; margin: 0; padding: 0; }}
  .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
  .header {{ text-align: center; margin-bottom: 30px; }}
  .header h1 {{ color: #0097D7; font-size: 24px; margin: 0; }}
  .header p {{ color: #94A3B8; font-size: 14px; margin-top: 8px; }}
  .card {{ background: #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 20px; }}
  .card h2 {{ color: #F8FAFC; font-size: 18px; margin: 0 0 16px 0; }}
  .kpi-grid {{ display: flex; flex-wrap: wrap; gap: 16px; }}
  .kpi {{ flex: 1; min-width: 120px; background: #121827; border-radius: 8px; padding: 16px; text-align: center; }}
  .kpi .label {{ color: #94A3B8; font-size: 12px; text-transform: uppercase; }}
  .kpi .value {{ color: #F8FAFC; font-size: 20px; font-weight: 700; margin-top: 4px; }}
  .kpi .value.green {{ color: #00B894; }}
  .badge {{ display: inline-block; background: #00B894; color: #121827; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }}
  .footer {{ text-align: center; color: #64748B; font-size: 12px; margin-top: 30px; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>AzzeroCO2 Energy</h1>
    <p>Il clima nelle nostre mani</p>
  </div>
  <div class="card">
    <h2>Ottimizzazione completata <span class="badge">&#10003;</span></h2>
    <p style="color: #94A3B8; font-size: 14px;">
      Lo scenario <strong>{scenario_name}</strong> dell'analisi
      <strong>{analysis_name}</strong> è stato calcolato con successo.
    </p>
    <div class="kpi-grid" style="margin-top: 20px;">
      <div class="kpi">
        <div class="label">CAPEX Totale</div>
        <div class="value">&euro; {total_capex:,.0f}</div>
      </div>
      <div class="kpi">
        <div class="label">Risparmio Annuo</div>
        <div class="value green">&euro; {total_savings:,.0f}</div>
      </div>
      <div class="kpi">
        <div class="label">Payback</div>
        <div class="value">{f'{payback_years:.1f} anni' if payback_years else '&mdash;'}</div>
      </div>
      <div class="kpi">
        <div class="label">Riduzione CO&#8322;</div>
        <div class="value green">{f'{co2_reduction:.1f}%' if co2_reduction else '&mdash;'}</div>
      </div>
    </div>
  </div>
  <p style="text-align: center;">
    <a href="http://localhost:3000/dashboard" style="color: #0097D7; text-decoration: none; font-weight: 600;">
      Visualizza risultati &rarr;
    </a>
  </p>
  <div class="footer">
    <p>AzzeroCO2 Energy &mdash; Piattaforma di analisi energetica</p>
  </div>
</div>
</body>
</html>"""


def _build_failed_html(scenario_name: str, analysis_name: str, error: str) -> str:
    """Build HTML email body for failed scenario."""
    return f"""<!DOCTYPE html>
<html>
<head>
<style>
  body {{ font-family: 'Inter', Arial, sans-serif; background: #121827; color: #F8FAFC; margin: 0; padding: 0; }}
  .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
  .header {{ text-align: center; margin-bottom: 30px; }}
  .header h1 {{ color: #0097D7; font-size: 24px; margin: 0; }}
  .card {{ background: #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 20px; }}
  .badge-error {{ display: inline-block; background: #FF6B6B; color: #121827; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }}
  .error-box {{ background: #FF6B6B20; border: 1px solid #FF6B6B40; border-radius: 8px; padding: 12px; margin-top: 16px; color: #FF6B6B; font-size: 13px; }}
  .footer {{ text-align: center; color: #64748B; font-size: 12px; margin-top: 30px; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>AzzeroCO2 Energy</h1>
  </div>
  <div class="card">
    <h2>Ottimizzazione fallita <span class="badge-error">&#10007;</span></h2>
    <p style="color: #94A3B8;">
      Lo scenario <strong>{scenario_name}</strong> dell'analisi
      <strong>{analysis_name}</strong> non è stato completato.
    </p>
    <div class="error-box">{error}</div>
  </div>
  <div class="footer">
    <p>AzzeroCO2 Energy</p>
  </div>
</div>
</body>
</html>"""


def send_scenario_notification(
    to_email: str,
    scenario_name: str,
    analysis_name: str,
    status: str,  # "completed" or "failed"
    total_capex: float = 0,
    total_savings: float = 0,
    payback_years: float | None = None,
    co2_reduction: float | None = None,
    error: str = "",
) -> bool:
    """Send email notification about scenario completion.

    Returns True if the notification was sent (or logged) successfully.
    """
    subject = (
        f"✓ Ottimizzazione completata: {scenario_name}"
        if status == "completed"
        else f"✗ Ottimizzazione fallita: {scenario_name}"
    )

    if status == "completed":
        html = _build_completed_html(
            scenario_name, analysis_name,
            total_capex, total_savings, payback_years, co2_reduction,
        )
    else:
        html = _build_failed_html(scenario_name, analysis_name, error)

    # If SMTP is not configured, log to console
    if not settings.smtp_host:
        logger.info(
            f"[EMAIL NOTIFICATION] To: {to_email}\n"
            f"Subject: {subject}\n"
            f"Status: {status}\n"
            f"Scenario: {scenario_name} | Analysis: {analysis_name}\n"
            f"CAPEX: €{total_capex:,.0f} | Savings: €{total_savings:,.0f}\n"
            f"Payback: {payback_years} | CO2: {co2_reduction}%"
        )
        return True

    # Send real email via SMTP
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.smtp_from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)

        logger.info(f"Email sent to {to_email}: {subject}")
        return True

    except Exception as e:
        logger.exception(f"Failed to send email to {to_email}")
        return False
