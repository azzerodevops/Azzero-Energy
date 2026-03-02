"""Tests for the demand profile generator.

Validates that generated profiles:
1. Have exactly 8760 elements
2. Sum correctly to the annual consumption
3. Have no negative values
4. Show expected patterns (seasonal, daily)
"""

import sys
import os

# Ensure the optimizer root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from profiles.generator import (
    generate_hourly_profile,
    default_profile_type_for_end_use,
)

HOURS = 8760
TOLERANCE = 0.01  # 0.01 kWh tolerance on total energy


# -----------------------------------------------------------------------
# Parametrized tests across all profile types and end uses
# -----------------------------------------------------------------------

PROFILE_TYPES = [
    "flat",
    "office",
    "industrial_1shift",
    "industrial_2shift",
    "industrial_3shift",
    "commercial",
    "residential",
]

END_USES = [
    "ELECTRICITY",
    "HEAT_HIGH_T",
    "HEAT_MED_T",
    "HEAT_LOW_T",
    "COLD",
]

ANNUAL_MWH_VALUES = [1.0, 100.0, 5000.0]


@pytest.mark.parametrize("profile_type", PROFILE_TYPES)
@pytest.mark.parametrize("end_use", END_USES)
@pytest.mark.parametrize("annual_mwh", ANNUAL_MWH_VALUES)
def test_profile_length_and_sum(profile_type, end_use, annual_mwh):
    """Each profile must have 8760 elements and sum to annual_mwh * 1000 kWh."""
    profile = generate_hourly_profile(
        annual_mwh=annual_mwh,
        end_use=end_use,
        profile_type=profile_type,
    )

    assert len(profile) == HOURS, f"Profile length is {len(profile)}, expected {HOURS}"

    total_kwh = sum(profile)
    expected_kwh = annual_mwh * 1000.0
    assert abs(total_kwh - expected_kwh) < TOLERANCE, (
        f"Total energy mismatch for {profile_type}/{end_use}: "
        f"{total_kwh:.4f} kWh vs expected {expected_kwh:.4f} kWh "
        f"(diff={abs(total_kwh - expected_kwh):.6f})"
    )


@pytest.mark.parametrize("profile_type", PROFILE_TYPES)
@pytest.mark.parametrize("end_use", END_USES)
def test_no_negative_values(profile_type, end_use):
    """All profile values must be non-negative."""
    profile = generate_hourly_profile(
        annual_mwh=100.0,
        end_use=end_use,
        profile_type=profile_type,
    )

    min_val = min(profile)
    assert min_val >= 0.0, (
        f"Negative value found in {profile_type}/{end_use}: {min_val}"
    )


def test_zero_consumption_returns_zero_profile():
    """Zero annual consumption should return all zeros."""
    profile = generate_hourly_profile(
        annual_mwh=0.0,
        end_use="ELECTRICITY",
        profile_type="office",
    )
    assert len(profile) == HOURS
    assert all(v == 0.0 for v in profile)


def test_negative_consumption_returns_zero_profile():
    """Negative annual consumption should return all zeros."""
    profile = generate_hourly_profile(
        annual_mwh=-10.0,
        end_use="ELECTRICITY",
        profile_type="office",
    )
    assert len(profile) == HOURS
    assert all(v == 0.0 for v in profile)


# -----------------------------------------------------------------------
# Pattern-specific tests
# -----------------------------------------------------------------------


def test_office_weekday_higher_than_weekend():
    """Office profile should have higher weekday usage than weekend."""
    profile = generate_hourly_profile(
        annual_mwh=100.0,
        end_use="ELECTRICITY",
        profile_type="office",
    )

    # Sum weekday hours vs weekend hours
    # January 1, 2025 is a Wednesday
    weekday_total = 0.0
    weekend_total = 0.0
    weekday_count = 0
    weekend_count = 0

    for h in range(HOURS):
        day_of_week = (2 + h // 24) % 7  # Wed=2 for Jan 1, 2025
        if day_of_week < 5:  # Mon-Fri
            weekday_total += profile[h]
            weekday_count += 1
        else:
            weekend_total += profile[h]
            weekend_count += 1

    avg_weekday = weekday_total / weekday_count if weekday_count else 0
    avg_weekend = weekend_total / weekend_count if weekend_count else 0

    assert avg_weekday > avg_weekend * 2, (
        f"Office weekday avg ({avg_weekday:.2f}) should be much higher than "
        f"weekend avg ({avg_weekend:.2f})"
    )


def test_industrial_3shift_relatively_flat():
    """3-shift industrial should be relatively flat (low coefficient of variation)."""
    profile = generate_hourly_profile(
        annual_mwh=100.0,
        end_use="ELECTRICITY",
        profile_type="industrial_3shift",
    )

    avg = sum(profile) / HOURS
    variance = sum((v - avg) ** 2 for v in profile) / HOURS
    std = variance ** 0.5
    cv = std / avg  # coefficient of variation

    assert cv < 0.15, (
        f"3-shift profile should be nearly flat, but CV={cv:.3f} (std={std:.4f}, avg={avg:.4f})"
    )


def test_heating_seasonal_winter_higher():
    """Heating profiles should have higher values in winter than summer."""
    profile = generate_hourly_profile(
        annual_mwh=100.0,
        end_use="HEAT_HIGH_T",
        profile_type="office",
    )

    # January (hours 0-743) vs July (hours 4344-5087)
    jan_total = sum(profile[0:744])
    jul_total = sum(profile[4344:5088])

    assert jan_total > jul_total * 2, (
        f"Heating Jan total ({jan_total:.2f}) should be much higher than "
        f"Jul total ({jul_total:.2f})"
    )


def test_cooling_seasonal_summer_higher():
    """Cooling profiles should have higher values in summer than winter."""
    profile = generate_hourly_profile(
        annual_mwh=100.0,
        end_use="COLD",
        profile_type="office",
    )

    # January (hours 0-743) vs July (hours 4344-5087)
    jan_total = sum(profile[0:744])
    jul_total = sum(profile[4344:5088])

    assert jul_total > jan_total * 2, (
        f"Cooling Jul total ({jul_total:.2f}) should be much higher than "
        f"Jan total ({jan_total:.2f})"
    )


def test_residential_evening_peak():
    """Residential profile should have an evening peak (18-22)."""
    profile = generate_hourly_profile(
        annual_mwh=100.0,
        end_use="ELECTRICITY",
        profile_type="residential",
    )

    # Check first week, average weekday
    # Pick a Wednesday (day 0 = Jan 1, 2025 is Wed)
    day_0_profile = profile[0:24]

    # Evening hours (18-22) should be higher than morning hours (2-6)
    evening_avg = sum(day_0_profile[18:22]) / 4
    night_avg = sum(day_0_profile[2:6]) / 4

    assert evening_avg > night_avg * 2, (
        f"Residential evening avg ({evening_avg:.4f}) should be much higher "
        f"than night avg ({night_avg:.4f})"
    )


# -----------------------------------------------------------------------
# Custom working days
# -----------------------------------------------------------------------


def test_custom_working_days():
    """Profile with only Saturday and Sunday as working days."""
    profile = generate_hourly_profile(
        annual_mwh=100.0,
        end_use="ELECTRICITY",
        profile_type="office",
        working_days=["sat", "sun"],
    )

    assert len(profile) == HOURS
    total = sum(profile)
    expected = 100.0 * 1000.0
    assert abs(total - expected) < TOLERANCE


# -----------------------------------------------------------------------
# Default profile type mapping
# -----------------------------------------------------------------------


def test_default_profile_types():
    """Verify default profile type mapping for each end-use."""
    assert default_profile_type_for_end_use("ELECTRICITY") == "office"
    assert default_profile_type_for_end_use("HEAT_HIGH_T") == "industrial_1shift"
    assert default_profile_type_for_end_use("HEAT_MED_T") == "industrial_1shift"
    assert default_profile_type_for_end_use("HEAT_LOW_T") == "office"
    assert default_profile_type_for_end_use("COLD") == "office"
    assert default_profile_type_for_end_use("UNKNOWN") == "flat"
