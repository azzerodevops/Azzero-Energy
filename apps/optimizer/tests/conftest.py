import sys
import os
import pytest

# Add optimizer root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models.input import (
    AnalysisData, Demand, Resource, Technology, TechIO,
    StorageSystem, ScenarioConfig, ScenarioTechConfig,
)
from models.enums import EndUse, ResourceType, StorageType, Objective


@pytest.fixture
def simple_electricity_data() -> tuple[AnalysisData, ScenarioConfig]:
    """Simple test case: electricity demand + solar PV + grid."""
    data = AnalysisData(
        analysis_id="test-analysis-1",
        wacc=0.05,
        demands=[
            Demand(
                id="d1",
                end_use=EndUse.ELECTRICITY,
                annual_consumption_mwh=1000.0,
                hourly_profile=None,  # flat profile
            ),
        ],
        resources=[
            Resource(
                id="r1",
                resource_type=ResourceType.ELECTRICITY,
                buying_price=120.0,  # EUR/MWh
                selling_price=50.0,
                co2_factor=0.4,  # tCO2/MWh
            ),
            Resource(
                id="r2",
                resource_type=ResourceType.SOLAR,
                buying_price=0.0,
                selling_price=0.0,
                co2_factor=0.0,
            ),
        ],
        technologies=[
            Technology(
                id="t1",
                name="Solar PV",
                category="renewable",
                capex_per_kw=800.0,
                maintenance_annual_per_kw=10.0,
                lifetime=25,
                capacity_factor=0.15,
                min_size_kw=0.0,
                max_size_kw=5000.0,
                inputs=[TechIO(resource_type=ResourceType.SOLAR, conversion_factor=1.0)],
                outputs=[TechIO(end_use=EndUse.ELECTRICITY, conversion_factor=1.0)],
            ),
        ],
        storage_systems=[],
    )

    config = ScenarioConfig(
        scenario_id="test-scenario-1",
        objective=Objective.COST,
    )

    return data, config


@pytest.fixture
def thermal_data() -> tuple[AnalysisData, ScenarioConfig]:
    """Test case with electricity + heat demand + CHP."""
    data = AnalysisData(
        analysis_id="test-analysis-2",
        wacc=0.05,
        demands=[
            Demand(
                id="d1",
                end_use=EndUse.ELECTRICITY,
                annual_consumption_mwh=500.0,
            ),
            Demand(
                id="d2",
                end_use=EndUse.HEAT_LOW_T,
                annual_consumption_mwh=800.0,
            ),
        ],
        resources=[
            Resource(
                id="r1",
                resource_type=ResourceType.ELECTRICITY,
                buying_price=120.0,
                selling_price=50.0,
                co2_factor=0.4,
            ),
            Resource(
                id="r2",
                resource_type=ResourceType.NATURAL_GAS,
                buying_price=40.0,
                co2_factor=0.2,
            ),
        ],
        technologies=[
            Technology(
                id="t1",
                name="Gas Boiler",
                category="thermal",
                capex_per_kw=100.0,
                maintenance_annual_per_kw=5.0,
                lifetime=20,
                capacity_factor=0.9,
                min_size_kw=0.0,
                max_size_kw=2000.0,
                inputs=[TechIO(resource_type=ResourceType.NATURAL_GAS, conversion_factor=1.0)],
                outputs=[TechIO(end_use=EndUse.HEAT_LOW_T, conversion_factor=0.9)],
            ),
        ],
        storage_systems=[],
    )

    config = ScenarioConfig(
        scenario_id="test-scenario-2",
        objective=Objective.COST,
    )

    return data, config


@pytest.fixture
def storage_data() -> tuple[AnalysisData, ScenarioConfig]:
    """Test case with battery storage."""
    data = AnalysisData(
        analysis_id="test-analysis-3",
        wacc=0.05,
        demands=[
            Demand(
                id="d1",
                end_use=EndUse.ELECTRICITY,
                annual_consumption_mwh=100.0,
            ),
        ],
        resources=[
            Resource(
                id="r1",
                resource_type=ResourceType.ELECTRICITY,
                buying_price=120.0,
                selling_price=50.0,
                co2_factor=0.4,
            ),
            Resource(
                id="r2",
                resource_type=ResourceType.SOLAR,
                buying_price=0.0,
                co2_factor=0.0,
            ),
        ],
        technologies=[
            Technology(
                id="t1",
                name="Solar PV",
                category="renewable",
                capex_per_kw=800.0,
                maintenance_annual_per_kw=10.0,
                lifetime=25,
                capacity_factor=0.15,
                min_size_kw=0.0,
                max_size_kw=1000.0,
                inputs=[TechIO(resource_type=ResourceType.SOLAR, conversion_factor=1.0)],
                outputs=[TechIO(end_use=EndUse.ELECTRICITY, conversion_factor=1.0)],
            ),
        ],
        storage_systems=[
            StorageSystem(
                id="s1",
                name="Li-ion Battery",
                storage_type=StorageType.BATTERY_LION,
                capacity_kwh=500.0,
                max_charge_kw=100.0,
                max_discharge_kw=100.0,
                charge_efficiency=0.95,
                discharge_efficiency=0.95,
                self_discharge_rate=0.0001,
                capex_per_kwh=200.0,
                min_soc=0.1,
                max_soc=0.9,
            ),
        ],
    )

    config = ScenarioConfig(
        scenario_id="test-scenario-3",
        objective=Objective.COST,
    )

    return data, config
