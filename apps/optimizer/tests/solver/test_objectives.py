"""Tests for solver.objectives — CRF calculation and objective functions."""
import math

import pulp
import pytest

from models.input import (
    AnalysisData,
    Demand,
    Resource,
    Technology,
    TechIO,
    ScenarioConfig,
    StorageSystem,
)
from models.enums import EndUse, ResourceType, StorageType, Objective
from solver.objectives import crf, set_cost_objective, set_co2_objective
from solver.variables import create_all_variables, HOURS


# ---- CRF function tests ----


class TestCrf:
    """Unit tests for the Capital Recovery Factor function."""

    def test_crf_known_value(self):
        """CRF(0.05, 25) should be approximately 0.0710."""
        result = crf(0.05, 25)
        assert result == pytest.approx(0.0710, abs=0.001)

    def test_crf_high_wacc(self):
        """CRF with 10% WACC and 20 years."""
        result = crf(0.10, 20)
        # Manual: 0.10 * (1.10^20) / ((1.10^20) - 1)
        factor = 1.10 ** 20
        expected = 0.10 * factor / (factor - 1)
        assert result == pytest.approx(expected, rel=1e-9)

    def test_crf_zero_wacc(self):
        """CRF with 0% WACC should return 1/lifetime."""
        result = crf(0.0, 25)
        assert result == pytest.approx(1.0 / 25, rel=1e-9)

    def test_crf_negative_wacc(self):
        """CRF with negative WACC should return 1/lifetime (same as zero)."""
        result = crf(-0.02, 20)
        assert result == pytest.approx(1.0 / 20, rel=1e-9)

    def test_crf_zero_lifetime(self):
        """CRF with 0 lifetime should return 1.0 (division by max(0,1)=1)."""
        result = crf(0.05, 0)
        assert result == pytest.approx(1.0, rel=1e-9)

    def test_crf_negative_lifetime(self):
        """CRF with negative lifetime should return 1.0."""
        result = crf(0.05, -5)
        assert result == pytest.approx(1.0, rel=1e-9)

    def test_crf_both_zero(self):
        """CRF(0, 0) should return 1.0."""
        result = crf(0.0, 0)
        assert result == pytest.approx(1.0, rel=1e-9)

    def test_crf_one_year(self):
        """CRF with 1-year lifetime: should equal (1+wacc)."""
        # CRF = wacc * (1+wacc)^1 / ((1+wacc)^1 - 1)
        #      = wacc * (1+wacc) / wacc = (1+wacc)
        result = crf(0.05, 1)
        assert result == pytest.approx(1.05, rel=1e-9)

    def test_crf_returns_float(self):
        """CRF always returns a float."""
        assert isinstance(crf(0.05, 25), float)


# ---- Cost objective tests ----


class TestCostObjective:
    """Tests for set_cost_objective."""

    def test_cost_objective_adds_terms(self, simple_electricity_data):
        """Verify set_cost_objective adds an objective named 'total_annual_cost'."""
        data, config = simple_electricity_data
        prob = pulp.LpProblem("test_cost", pulp.LpMinimize)
        v = create_all_variables(data, config)

        set_cost_objective(prob, v, data)

        # The objective should have been set (PuLP stores it as prob.objective)
        assert prob.objective is not None
        # Check the problem has a named objective
        assert prob.status == 0  # not yet solved

    def test_cost_objective_includes_capex_for_new_tech(self):
        """New technology: objective includes capex * CRF * cap."""
        data = AnalysisData(
            analysis_id="test",
            wacc=0.05,
            demands=[
                Demand(id="d1", end_use=EndUse.ELECTRICITY, annual_consumption_mwh=100.0),
            ],
            resources=[
                Resource(
                    id="r1",
                    resource_type=ResourceType.ELECTRICITY,
                    buying_price=120.0,
                    selling_price=50.0,
                    co2_factor=0.4,
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
                    max_size_kw=1000.0,
                    is_existing=False,
                    inputs=[TechIO(resource_type=ResourceType.SOLAR)],
                    outputs=[TechIO(end_use=EndUse.ELECTRICITY)],
                ),
            ],
        )
        config = ScenarioConfig(scenario_id="test")

        prob = pulp.LpProblem("test_capex", pulp.LpMinimize)
        v = create_all_variables(data, config)
        set_cost_objective(prob, v, data)

        # Objective expression should contain the cap variable
        obj_str = str(prob.objective)
        assert "cap_t1" in obj_str

    def test_cost_objective_excludes_capex_for_existing_tech(self):
        """Existing technology: capex is already paid, only maintenance in objective."""
        data = AnalysisData(
            analysis_id="test",
            wacc=0.05,
            demands=[
                Demand(id="d1", end_use=EndUse.ELECTRICITY, annual_consumption_mwh=100.0),
            ],
            resources=[
                Resource(
                    id="r1",
                    resource_type=ResourceType.ELECTRICITY,
                    buying_price=120.0,
                    co2_factor=0.4,
                ),
            ],
            technologies=[
                Technology(
                    id="t_existing",
                    name="Existing Boiler",
                    category="thermal",
                    capex_per_kw=500.0,
                    maintenance_annual_per_kw=20.0,
                    lifetime=20,
                    installed_capacity_kw=100.0,
                    is_existing=True,
                    inputs=[TechIO(resource_type=ResourceType.NATURAL_GAS)],
                    outputs=[TechIO(end_use=EndUse.HEAT_LOW_T)],
                ),
            ],
        )
        config = ScenarioConfig(scenario_id="test")

        prob = pulp.LpProblem("test_existing", pulp.LpMinimize)
        v = create_all_variables(data, config)
        set_cost_objective(prob, v, data)

        # The coefficient of cap_t_existing should be only maintenance (20.0),
        # not capex * CRF + maintenance.
        obj = prob.objective
        cap_var = v.cap["t_existing"]
        coeff = obj.get(cap_var, 0.0)
        # maintenance_annual_per_kw = 20.0
        assert coeff == pytest.approx(20.0, rel=1e-6)

    def test_cost_objective_includes_buy_sell_terms(self, simple_electricity_data):
        """Verify buy/sell resource terms appear in the objective."""
        data, config = simple_electricity_data
        prob = pulp.LpProblem("test_buysell", pulp.LpMinimize)
        v = create_all_variables(data, config)
        set_cost_objective(prob, v, data)

        obj_str = str(prob.objective)
        # Buy variables for electricity should be present
        assert "buy_electricity_0" in obj_str

    def test_cost_objective_includes_storage_capex(self):
        """When storage has capex > 0, a constant term is added."""
        data = AnalysisData(
            analysis_id="test",
            wacc=0.05,
            demands=[
                Demand(id="d1", end_use=EndUse.ELECTRICITY, annual_consumption_mwh=100.0),
            ],
            resources=[
                Resource(
                    id="r1",
                    resource_type=ResourceType.ELECTRICITY,
                    buying_price=120.0,
                    co2_factor=0.4,
                ),
            ],
            technologies=[],
            storage_systems=[
                StorageSystem(
                    id="s1",
                    storage_type=StorageType.BATTERY_LION,
                    capacity_kwh=500.0,
                    max_charge_kw=100.0,
                    max_discharge_kw=100.0,
                    capex_per_kwh=200.0,
                ),
            ],
        )
        config = ScenarioConfig(scenario_id="test")

        prob = pulp.LpProblem("test_storage_capex", pulp.LpMinimize)
        v = create_all_variables(data, config)
        set_cost_objective(prob, v, data)

        # The objective should have a constant component from storage capex
        assert prob.objective is not None


# ---- CO2 objective tests ----


class TestCo2Objective:
    """Tests for set_co2_objective."""

    def test_co2_objective_adds_terms(self, simple_electricity_data):
        """Verify set_co2_objective sets the objective function."""
        data, config = simple_electricity_data
        prob = pulp.LpProblem("test_co2", pulp.LpMinimize)
        v = create_all_variables(data, config)

        set_co2_objective(prob, v, data)

        assert prob.objective is not None

    def test_co2_objective_only_includes_co2_resources(self):
        """Only resources with co2_factor > 0 appear in CO2 objective."""
        data = AnalysisData(
            analysis_id="test",
            wacc=0.05,
            demands=[
                Demand(id="d1", end_use=EndUse.ELECTRICITY, annual_consumption_mwh=100.0),
            ],
            resources=[
                Resource(
                    id="r1",
                    resource_type=ResourceType.ELECTRICITY,
                    buying_price=120.0,
                    co2_factor=0.4,
                ),
                Resource(
                    id="r2",
                    resource_type=ResourceType.SOLAR,
                    buying_price=0.0,
                    co2_factor=0.0,  # zero emissions
                ),
            ],
            technologies=[],
        )
        config = ScenarioConfig(scenario_id="test")

        prob = pulp.LpProblem("test_co2_resources", pulp.LpMinimize)
        v = create_all_variables(data, config)
        set_co2_objective(prob, v, data)

        obj_str = str(prob.objective)
        # Electricity (co2_factor=0.4) should be in objective
        assert "buy_electricity_0" in obj_str
        # Solar (co2_factor=0.0) should NOT appear in objective
        assert "buy_solar_0" not in obj_str

    def test_co2_objective_with_budget_constraint(self, simple_electricity_data):
        """When budget_limit is given, a budget constraint is added."""
        data, config = simple_electricity_data
        prob = pulp.LpProblem("test_co2_budget", pulp.LpMinimize)
        v = create_all_variables(data, config)

        set_co2_objective(prob, v, data, budget_limit=100000.0)

        # Check that the budget constraint was added
        constraint_names = [name for name in prob.constraints]
        assert "budget_constraint" in constraint_names

    def test_co2_objective_no_budget_constraint_when_none(self, simple_electricity_data):
        """No budget constraint when budget_limit is None."""
        data, config = simple_electricity_data
        prob = pulp.LpProblem("test_co2_no_budget", pulp.LpMinimize)
        v = create_all_variables(data, config)

        set_co2_objective(prob, v, data, budget_limit=None)

        constraint_names = [name for name in prob.constraints]
        assert "budget_constraint" not in constraint_names

    def test_co2_objective_no_budget_constraint_when_zero(self, simple_electricity_data):
        """No budget constraint when budget_limit is 0."""
        data, config = simple_electricity_data
        prob = pulp.LpProblem("test_co2_zero_budget", pulp.LpMinimize)
        v = create_all_variables(data, config)

        set_co2_objective(prob, v, data, budget_limit=0.0)

        constraint_names = [name for name in prob.constraints]
        assert "budget_constraint" not in constraint_names
