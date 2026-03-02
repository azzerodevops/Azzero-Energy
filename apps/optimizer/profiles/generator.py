"""Demand profile generator for AzzeroCO2 Energy Optimizer.

Generates realistic 8760-hour demand profiles for Italian energy systems,
accounting for daily patterns, weekday/weekend differences, and seasonal
variation (heating in winter, cooling in summer).

All profiles are returned in kW (power), so that integrating over 1 hour
gives kWh.  The sum of all 8760 values equals annual_mwh * 1000 (kWh).
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta

HOURS = 8760
# Reference year: 2025 (non-leap). Hour 0 = 2025-01-01 00:00
_REF_YEAR = 2025
_JAN1 = datetime(_REF_YEAR, 1, 1)


# -----------------------------------------------------------------------
# Public API
# -----------------------------------------------------------------------


def generate_hourly_profile(
    annual_mwh: float,
    end_use: str,
    profile_type: str = "flat",
    operating_hours: int = 4000,
    working_days: list[str] | None = None,
) -> list[float]:
    """Generate a realistic 8760-hour demand profile.

    Parameters
    ----------
    annual_mwh : float
        Total annual energy consumption in MWh.
    end_use : str
        The end-use type: ELECTRICITY, HEAT_HIGH_T, HEAT_MED_T,
        HEAT_LOW_T, or COLD.
    profile_type : str
        One of: flat, office, industrial_1shift, industrial_2shift,
        industrial_3shift, commercial, residential.
    operating_hours : int
        Approximate annual operating hours (used only for 'flat' type).
    working_days : list[str] | None
        Active weekdays as lowercase English names (e.g. ["mon", "tue"]).
        Defaults to Monday-Friday for office/industrial profiles.

    Returns
    -------
    list[float]
        8760 values in kW.  sum(profile) == annual_mwh * 1000 (kWh).
    """
    if annual_mwh <= 0:
        return [0.0] * HOURS

    # Build the raw (un-scaled) shape
    raw = _build_raw_shape(profile_type, operating_hours, working_days)

    # Apply seasonal modulation for thermal/cold demands
    seasonal = _seasonal_modulation(end_use)
    modulated = [raw[h] * seasonal[h] for h in range(HOURS)]

    # Scale so that total energy equals annual_mwh * 1000 kWh
    total_raw = sum(modulated)
    if total_raw <= 0:
        # Fallback: if everything is zero, make a true flat profile
        flat_kw = annual_mwh * 1000.0 / HOURS
        return [flat_kw] * HOURS

    scale = (annual_mwh * 1000.0) / total_raw
    profile = [modulated[h] * scale for h in range(HOURS)]

    return profile


# -----------------------------------------------------------------------
# Raw profile shapes (before seasonal modulation, un-scaled)
# -----------------------------------------------------------------------


def _build_raw_shape(
    profile_type: str,
    operating_hours: int,
    working_days: list[str] | None,
) -> list[float]:
    """Return a raw 8760-element shape array (arbitrary units).

    The shape is later multiplied by seasonal factors and then scaled
    so that the total sums to the correct annual consumption.
    """
    builder = _PROFILE_BUILDERS.get(profile_type, _build_flat)
    return builder(operating_hours, working_days)


def _build_flat(
    operating_hours: int, working_days: list[str] | None
) -> list[float]:
    """Constant load during operating hours, zero otherwise.

    If operating_hours >= 8760, the load is truly flat 24/7.
    Otherwise distribute operating hours across weekdays.
    """
    if operating_hours >= HOURS:
        return [1.0] * HOURS

    wd = _resolve_working_days(working_days, default_weekend=False)
    profile = [0.0] * HOURS

    # Distribute operating hours: compute daily hours
    working_day_count = sum(
        1 for h in range(0, HOURS, 24) if _day_name(h) in wd
    )
    if working_day_count == 0:
        return [1.0] * HOURS

    daily_hours = min(24, operating_hours / working_day_count)
    start_hour = max(0, int((24 - daily_hours) / 2))
    end_hour = min(24, start_hour + int(math.ceil(daily_hours)))

    for h in range(HOURS):
        day = _day_name(h)
        hour_of_day = h % 24
        if day in wd and start_hour <= hour_of_day < end_hour:
            profile[h] = 1.0

    return profile


def _build_office(
    _operating_hours: int, working_days: list[str] | None
) -> list[float]:
    """Typical Italian office: 8:00-18:00 weekdays, reduced on weekends.

    Shape: ramp up 7-9, peak 9-12, slight dip 13-14 (lunch),
    peak 14-17, ramp down 17-19. Weekend at 10% baseload.
    """
    wd = _resolve_working_days(working_days, default_weekend=False)

    # Hourly multipliers for a typical workday (0-23)
    workday_shape = [
        0.05, 0.05, 0.05, 0.05, 0.05, 0.05,  # 0-5: night
        0.10, 0.30, 0.70, 0.95, 1.00, 1.00,  # 6-11: ramp + morning peak
        0.85, 0.75, 0.95, 1.00, 1.00, 0.90,  # 12-17: lunch dip + afternoon
        0.50, 0.20, 0.10, 0.08, 0.05, 0.05,  # 18-23: ramp down
    ]
    # Weekend/non-working day shape (security, standby, HVAC minimal)
    weekend_shape = [0.05] * 24

    profile = [0.0] * HOURS
    for h in range(HOURS):
        day = _day_name(h)
        hod = h % 24
        if day in wd:
            profile[h] = workday_shape[hod]
        else:
            profile[h] = weekend_shape[hod]

    return profile


def _build_industrial_1shift(
    _operating_hours: int, working_days: list[str] | None
) -> list[float]:
    """Single shift industrial: 06:00-14:00, weekdays only.

    Italian manufacturing typical single shift pattern.
    """
    wd = _resolve_working_days(working_days, default_weekend=False)

    workday_shape = [
        0.05, 0.05, 0.05, 0.05, 0.05, 0.20,  # 0-5: night standby
        0.80, 0.95, 1.00, 1.00, 1.00, 1.00,   # 6-11: production ramp + peak
        1.00, 0.95, 0.60, 0.15, 0.08, 0.05,   # 12-17: last hour + shutdown
        0.05, 0.05, 0.05, 0.05, 0.05, 0.05,   # 18-23: off
    ]
    weekend_shape = [0.03] * 24

    profile = [0.0] * HOURS
    for h in range(HOURS):
        day = _day_name(h)
        hod = h % 24
        if day in wd:
            profile[h] = workday_shape[hod]
        else:
            profile[h] = weekend_shape[hod]

    return profile


def _build_industrial_2shift(
    _operating_hours: int, working_days: list[str] | None
) -> list[float]:
    """Double shift industrial: 06:00-22:00, weekdays only.

    Two shifts with a brief transition dip between them.
    """
    wd = _resolve_working_days(working_days, default_weekend=False)

    workday_shape = [
        0.05, 0.05, 0.05, 0.05, 0.05, 0.25,   # 0-5: night standby
        0.85, 0.95, 1.00, 1.00, 1.00, 1.00,    # 6-11: first shift peak
        1.00, 0.85, 0.90, 1.00, 1.00, 1.00,    # 12-17: shift change + second shift
        1.00, 1.00, 0.95, 0.80, 0.30, 0.10,    # 18-23: second shift end + shutdown
    ]
    weekend_shape = [0.03] * 24

    profile = [0.0] * HOURS
    for h in range(HOURS):
        day = _day_name(h)
        hod = h % 24
        if day in wd:
            profile[h] = workday_shape[hod]
        else:
            profile[h] = weekend_shape[hod]

    return profile


def _build_industrial_3shift(
    _operating_hours: int, _working_days: list[str] | None
) -> list[float]:
    """Three-shift / continuous 24/7 industrial operation.

    Nearly flat with small shift-change dips. Runs every day.
    """
    # Hourly shape: slight dip at shift changes (6h, 14h, 22h)
    continuous_shape = [
        0.95, 0.95, 0.95, 0.95, 0.95, 0.90,  # 0-5: night shift
        0.85, 0.95, 1.00, 1.00, 1.00, 1.00,   # 6-11: morning shift start
        1.00, 1.00, 0.90, 0.95, 1.00, 1.00,   # 12-17: afternoon shift start
        1.00, 1.00, 1.00, 0.95, 0.90, 0.95,   # 18-23: night shift start
    ]

    profile = [0.0] * HOURS
    for h in range(HOURS):
        profile[h] = continuous_shape[h % 24]

    return profile


def _build_commercial(
    _operating_hours: int, working_days: list[str] | None
) -> list[float]:
    """Commercial/retail pattern: 09:00-21:00, higher on weekends.

    Italian shops and commercial centers with extended weekend hours.
    """
    wd = _resolve_working_days(working_days, default_weekend=False)

    weekday_shape = [
        0.05, 0.05, 0.05, 0.05, 0.05, 0.05,  # 0-5: closed
        0.05, 0.10, 0.30, 0.70, 0.85, 0.95,   # 6-11: opening ramp
        1.00, 0.90, 0.85, 0.90, 0.95, 1.00,   # 12-17: midday + afternoon peak
        1.00, 0.95, 0.80, 0.40, 0.10, 0.05,   # 18-23: evening + closing
    ]
    # Italian weekends: shops are busier, especially Saturday
    weekend_shape = [
        0.05, 0.05, 0.05, 0.05, 0.05, 0.05,  # 0-5: closed
        0.05, 0.08, 0.25, 0.65, 0.90, 1.00,   # 6-11: opening (slightly later)
        1.00, 0.95, 0.90, 0.95, 1.00, 1.10,   # 12-17: full day busy
        1.10, 1.05, 0.90, 0.50, 0.15, 0.05,   # 18-23: extended evening + close
    ]

    profile = [0.0] * HOURS
    for h in range(HOURS):
        day = _day_name(h)
        hod = h % 24
        if day in wd:
            profile[h] = weekday_shape[hod]
        else:
            profile[h] = weekend_shape[hod]

    return profile


def _build_residential(
    _operating_hours: int, _working_days: list[str] | None
) -> list[float]:
    """Italian residential pattern with morning and evening peaks.

    Characteristic double-peak: morning (7-9) for breakfast/getting ready,
    evening (18-22) for cooking/entertainment. Weekend more distributed.
    """
    weekday_shape = [
        0.15, 0.10, 0.08, 0.08, 0.08, 0.10,  # 0-5: night base
        0.20, 0.55, 0.70, 0.50, 0.30, 0.25,   # 6-11: morning peak
        0.35, 0.40, 0.30, 0.25, 0.30, 0.45,   # 12-17: midday (some cooking)
        0.70, 0.90, 1.00, 0.95, 0.70, 0.40,   # 18-23: evening peak
    ]
    weekend_shape = [
        0.15, 0.10, 0.08, 0.08, 0.08, 0.08,  # 0-5: night base
        0.10, 0.20, 0.40, 0.55, 0.60, 0.65,   # 6-11: later wake up
        0.70, 0.75, 0.60, 0.50, 0.45, 0.55,   # 12-17: cooking + afternoon
        0.70, 0.85, 1.00, 0.95, 0.75, 0.45,   # 18-23: evening peak
    ]

    profile = [0.0] * HOURS
    for h in range(HOURS):
        day = _day_name(h)
        hod = h % 24
        if day in {"sat", "sun"}:
            profile[h] = weekend_shape[hod]
        else:
            profile[h] = weekday_shape[hod]

    return profile


# Registry of profile builders
_PROFILE_BUILDERS = {
    "flat": _build_flat,
    "office": _build_office,
    "industrial_1shift": _build_industrial_1shift,
    "industrial_2shift": _build_industrial_2shift,
    "industrial_3shift": _build_industrial_3shift,
    "commercial": _build_commercial,
    "residential": _build_residential,
}


# -----------------------------------------------------------------------
# Seasonal modulation
# -----------------------------------------------------------------------


def _seasonal_modulation(end_use: str) -> list[float]:
    """Return 8760 seasonal multipliers based on end-use.

    - ELECTRICITY: mild seasonal variation (higher in summer for AC in Italy)
    - HEAT_*: strong winter peak, near-zero in summer
    - COLD: strong summer peak, near-zero in winter

    Uses a cosine model anchored to Italian climate patterns:
    - Coldest month: January (day ~15)
    - Hottest month: July/August (day ~200)
    """
    if end_use == "ELECTRICITY":
        return _seasonal_electricity()
    elif end_use in ("HEAT_HIGH_T", "HEAT_MED_T", "HEAT_LOW_T"):
        return _seasonal_heating()
    elif end_use == "COLD":
        return _seasonal_cooling()
    else:
        return [1.0] * HOURS


def _seasonal_electricity() -> list[float]:
    """Mild seasonal variation for Italian electricity demand.

    Higher in summer (air conditioning) and winter (heating/lighting),
    slightly lower in spring/autumn. Variation amplitude: +/- 15%.
    """
    factors = [0.0] * HOURS
    for h in range(HOURS):
        day_of_year = h // 24
        # Two peaks: winter (day ~15) and summer (day ~200)
        # Model as sum of two cosines
        winter_cos = math.cos(2 * math.pi * (day_of_year - 15) / 365)
        summer_cos = math.cos(2 * math.pi * (day_of_year - 200) / 365)
        # Blend: winter contributes ~8%, summer ~10%
        factors[h] = 1.0 + 0.08 * winter_cos + 0.10 * summer_cos
    return factors


def _seasonal_heating() -> list[float]:
    """Strong seasonal variation for heating demands in Italian climate.

    Heating season: roughly October through April.
    Peak in January, zero in June-August.

    Uses degree-day-like cosine model with Italian climate zone reference.
    The typical Italian heating season runs from ~October 15 to ~April 15
    (zona climatica D/E).
    """
    factors = [0.0] * HOURS
    for h in range(HOURS):
        day_of_year = h // 24
        # Cosine model: peak at day 15 (mid-January), trough at day 197 (mid-July)
        cos_val = math.cos(2 * math.pi * (day_of_year - 15) / 365)
        # Transform: heating factor = max(0, cos + offset)
        # With offset=0.0, we get ~50% of year active. Shift slightly negative
        # to get a narrower heating season more realistic for central Italy.
        raw = cos_val - 0.05
        # Clamp to [0, 1] and apply power curve for sharper seasonal shape
        factor = max(0.0, raw) ** 1.3
        # Add small baseload (domestic hot water, process heat)
        factors[h] = factor + 0.05
    return factors


def _seasonal_cooling() -> list[float]:
    """Strong seasonal variation for cooling demands in Italian climate.

    Cooling season: roughly May through September.
    Peak in July-August.
    """
    factors = [0.0] * HOURS
    for h in range(HOURS):
        day_of_year = h // 24
        # Cosine model: peak at day 200 (mid-July), trough at day 15 (mid-January)
        cos_val = math.cos(2 * math.pi * (day_of_year - 200) / 365)
        # Narrower active period than heating
        raw = cos_val - 0.15
        factor = max(0.0, raw) ** 1.3
        # Minimal baseload (server rooms, refrigeration)
        factors[h] = factor + 0.02
    return factors


# -----------------------------------------------------------------------
# Utility functions
# -----------------------------------------------------------------------


def _day_name(hour_index: int) -> str:
    """Return lowercase 3-letter day name for the given hour index.

    Hour 0 is midnight on January 1, 2025 (Wednesday).
    """
    dt = _JAN1 + timedelta(hours=hour_index)
    return dt.strftime("%a").lower()[:3]


def _resolve_working_days(
    working_days: list[str] | None,
    default_weekend: bool = False,
) -> set[str]:
    """Resolve working days to a set of 3-letter lowercase day names.

    Parameters
    ----------
    working_days : list[str] | None
        User-provided list, e.g. ["mon", "tue", "wed", "thu", "fri"].
        If None, defaults to Mon-Fri (or Mon-Sun if default_weekend=True).
    default_weekend : bool
        If True, include Sat/Sun in the default working days.
    """
    if working_days is not None and len(working_days) > 0:
        return {d.lower()[:3] for d in working_days}

    days = {"mon", "tue", "wed", "thu", "fri"}
    if default_weekend:
        days.update({"sat", "sun"})
    return days


# -----------------------------------------------------------------------
# Profile type auto-detection from end_use
# -----------------------------------------------------------------------


def default_profile_type_for_end_use(end_use: str) -> str:
    """Return a sensible default profile type based on end-use.

    Used when no profile_type is specified in the database.
    """
    if end_use == "ELECTRICITY":
        return "office"
    elif end_use in ("HEAT_HIGH_T", "HEAT_MED_T"):
        return "industrial_1shift"
    elif end_use == "HEAT_LOW_T":
        return "office"
    elif end_use == "COLD":
        return "office"
    return "flat"
