"""Generate static charts for reports using matplotlib.

Produces PNG images with the AzzeroCO2 brand dark theme for embedding
inside DOCX (and eventually PDF) reports.  All chart functions accept a
``ReportData`` instance and a writable ``output_dir`` path, and return
the ``Path`` of the saved image.

The module-level ``generate_all_charts`` helper creates a temporary
directory, generates every chart, and returns a ``dict[str, Path]``.
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend — must be set before pyplot import
import matplotlib.pyplot as plt  # noqa: E402

from .models import ReportData

# ---------------------------------------------------------------------------
# Brand palette
# ---------------------------------------------------------------------------

COLORS = ["#0097D7", "#00B894", "#6C5CE7", "#FFB020", "#E17055"]
BG_COLOR = "#1E293B"
TEXT_COLOR = "#F8FAFC"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _setup_style() -> None:
    """Configure matplotlib rcParams for dark-theme branded charts."""
    plt.rcParams.update({
        "figure.facecolor": BG_COLOR,
        "axes.facecolor": BG_COLOR,
        "axes.edgecolor": TEXT_COLOR,
        "text.color": TEXT_COLOR,
        "xtick.color": TEXT_COLOR,
        "ytick.color": TEXT_COLOR,
        "axes.labelcolor": TEXT_COLOR,
        "font.size": 10,
        "font.family": "sans-serif",
    })


def _euro_formatter(x: float, _pos: int | None = None) -> str:
    return f"\u20ac {x:,.0f}"


# ---------------------------------------------------------------------------
# Individual chart generators
# ---------------------------------------------------------------------------


def generate_energy_mix_chart(data: ReportData, output_dir: Path) -> Path:
    """Pie chart: energy consumption breakdown by end use."""
    _setup_style()
    fig, ax = plt.subplots(figsize=(6, 4))

    labels = [d.end_use_label for d in data.demands]
    values = [d.annual_consumption_mwh for d in data.demands]
    colors = COLORS[: len(labels)]

    if not values or all(v == 0 for v in values):
        ax.text(0.5, 0.5, "Nessun dato", ha="center", va="center", fontsize=14)
    else:
        wedges, texts, autotexts = ax.pie(
            values,
            labels=labels,
            colors=colors,
            autopct="%1.1f%%",
            startangle=90,
            textprops={"fontsize": 9},
        )
        for t in autotexts:
            t.set_color("white")

    ax.set_title(
        "Ripartizione consumi energetici (MWh)",
        fontsize=12,
        fontweight="bold",
        pad=15,
    )
    plt.tight_layout()

    path = output_dir / "energy_mix.png"
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


def generate_capex_chart(data: ReportData, output_dir: Path) -> Path:
    """Horizontal bar chart: CAPEX per technology."""
    _setup_style()
    techs = data.scenario.tech_results
    fig_height = max(3, len(techs) * 0.6 + 1)
    fig, ax = plt.subplots(figsize=(7, fig_height))

    if not techs:
        ax.text(0.5, 0.5, "Nessun dato", ha="center", va="center", fontsize=14)
    else:
        names = [t.technology_name for t in techs]
        capex_vals = [t.capex for t in techs]

        bars = ax.barh(names, capex_vals, color=COLORS[0], height=0.6)
        ax.set_xlabel("CAPEX (\u20ac)")
        ax.set_title(
            "Investimento per tecnologia",
            fontsize=12,
            fontweight="bold",
            pad=15,
        )

        # Value labels to the right of each bar
        max_val = max(capex_vals) if capex_vals else 1
        for bar, val in zip(bars, capex_vals):
            ax.text(
                bar.get_width() + max_val * 0.02,
                bar.get_y() + bar.get_height() / 2,
                f"\u20ac {val:,.0f}",
                va="center",
                fontsize=9,
            )

    ax.xaxis.set_major_formatter(plt.FuncFormatter(_euro_formatter))
    plt.tight_layout()

    path = output_dir / "capex_breakdown.png"
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


def generate_savings_chart(data: ReportData, output_dir: Path) -> Path:
    """Grouped bar chart: CAPEX vs Annual Savings per technology."""
    _setup_style()
    fig, ax = plt.subplots(figsize=(8, 4))

    techs = data.scenario.tech_results
    if not techs:
        ax.text(0.5, 0.5, "Nessun dato", ha="center", va="center", fontsize=14)
    else:
        import numpy as np

        names = [t.technology_name for t in techs]
        capex = [t.capex for t in techs]
        savings = [t.annual_savings for t in techs]

        x = np.arange(len(names))
        width = 0.35

        ax.bar(x - width / 2, capex, width, label="CAPEX", color=COLORS[0])
        ax.bar(x + width / 2, savings, width, label="Risparmio annuo", color=COLORS[1])

        ax.set_xticks(x)
        ax.set_xticklabels(names, rotation=30, ha="right", fontsize=8)
        ax.set_ylabel("\u20ac")
        ax.set_title(
            "CAPEX vs Risparmio annuo",
            fontsize=12,
            fontweight="bold",
            pad=15,
        )
        ax.legend()

    ax.yaxis.set_major_formatter(plt.FuncFormatter(_euro_formatter))
    plt.tight_layout()

    path = output_dir / "capex_vs_savings.png"
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


def generate_cashflow_chart(data: ReportData, output_dir: Path) -> Path:
    """Line chart: cumulative cashflow projection over 20 years."""
    _setup_style()
    fig, ax = plt.subplots(figsize=(8, 4))

    total_capex = data.scenario.total_capex
    annual_savings = data.scenario.total_savings_annual
    annual_opex = data.scenario.total_opex_annual
    net_annual = annual_savings - annual_opex

    years = list(range(0, 21))
    cashflow = [-total_capex + net_annual * y for y in years]

    ax.plot(years, cashflow, color=COLORS[0], linewidth=2, marker="o", markersize=3)
    ax.axhline(y=0, color=TEXT_COLOR, linewidth=0.5, linestyle="--", alpha=0.5)
    ax.fill_between(
        years, cashflow, 0,
        where=[c >= 0 for c in cashflow],
        alpha=0.2, color=COLORS[1],
    )
    ax.fill_between(
        years, cashflow, 0,
        where=[c < 0 for c in cashflow],
        alpha=0.2, color=COLORS[4],
    )

    ax.set_xlabel("Anno")
    ax.set_ylabel("\u20ac")
    ax.set_title("Flusso di cassa cumulato", fontsize=12, fontweight="bold", pad=15)
    ax.yaxis.set_major_formatter(plt.FuncFormatter(_euro_formatter))
    plt.tight_layout()

    path = output_dir / "cashflow.png"
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    return path


# ---------------------------------------------------------------------------
# Convenience wrapper
# ---------------------------------------------------------------------------


def generate_all_charts(data: ReportData) -> dict[str, Path]:
    """Generate all report charts and return ``{name: path}``."""
    output_dir = Path(tempfile.mkdtemp(prefix="azzeroco2_charts_"))

    charts: dict[str, Path] = {}
    charts["energy_mix"] = generate_energy_mix_chart(data, output_dir)
    charts["capex_breakdown"] = generate_capex_chart(data, output_dir)
    charts["capex_vs_savings"] = generate_savings_chart(data, output_dir)
    charts["cashflow"] = generate_cashflow_chart(data, output_dir)

    return charts
