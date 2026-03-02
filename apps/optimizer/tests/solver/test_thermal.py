"""Tests for solver.thermal — thermal balance constraints and feasibility."""
import pulp
import pytest

from models.input import (
    AnalysisData,
    Demand,
    Resource,
    Technology,
    TechIO,
    ScenarioConfig,
)
from models.enums import EndUse, ResourceType, Objective
from solver.variables import create_all_variables, HOURS
from solver.thermal import add_thermal_balance
from solver.electricity import add_electricity_balance
from solver.objectives import set_cost_objective
from solver.runner import run_optimization


class TestThermalBalanceConstraints:
    """Tests for add_thermal_balance constraint generation."""

    def test_constraints_added_for_heat_low_t(self, thermal_data):
        """Thermal balance constraints are added for HEAT_LOW_T demand."""
        data, config = thermal_data
        prob = pulp.LpProblem("test_thermal", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_thermal_balance(prob, v, data, config)

        # Should have HOURS constraints for thermal balance (HEAT_LOW_T)
        balance_names = [
            name for name in prob.constraints
            if name.startswith("thermal_balance_HEAT_LOW_T")
        ]
        assert len(balance_names) == HOURS

    def test_capacity_constraints_added(self, thermal_data):
        """Per-tech capacity constraints added for each producing tech."""
        data, config = thermal_data
        prob = pulp.LpProblem("test_thermal_cap", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_thermal_balance(prob, v, data, config)

        # Should have HOURS capacity constraints for t1 (gas boiler)
        cap_names = [
            name for name in prob.constraints
            if name.startswith("thermal_cap_t1_HEAT_LOW_T")
        ]
        assert len(cap_names) == HOURS

    def test_no_constraints_when_no_thermal_demand(self, simple_electricity_data):
        """No thermal constraints if data has no thermal demands."""
        data, config = simple_electricity_data
        prob = pulp.LpProblem("test_no_thermal", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_thermal_balance(prob, v, data, config)

        # No thermal balance constraints should exist
        thermal_names = [
            name for name in prob.constraints
            if "thermal_balance" in name
        ]
        assert len(thermal_names) == 0


class TestThermalSolverFeasibility:
    """Tests for solver feasibility with thermal constraints."""

    def test_solver_feasible_with_gas_boiler(self, thermal_data):
        """Solver finds a feasible solution with gas boiler for heat demand."""
        data, config = thermal_data
        prob = pulp.LpProblem("test_thermal_feasible", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_electricity_balance(prob, v, data, config)
        add_thermal_balance(prob, v, data, config)
        set_cost_objective(prob, v, data)

        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=120)
        prob.solve(solver)

        assert prob.status == pulp.constants.LpStatusOptimal

    def test_optimal_capacity_reasonable(self, thermal_data):
        """Gas boiler capacity should be enough to meet peak demand."""
        data, config = thermal_data
        prob = pulp.LpProblem("test_thermal_capacity", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_electricity_balance(prob, v, data, config)
        add_thermal_balance(prob, v, data, config)
        set_cost_objective(prob, v, data)

        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=120)
        prob.solve(solver)

        assert prob.status == pulp.constants.LpStatusOptimal

        cap_boiler = pulp.value(v.cap["t1"])
        assert cap_boiler is not None
        assert cap_boiler > 0

        # The heat demand is 800 MWh/year. With flat profile that is
        # 800 * 1000 / 8760 ~ 91.3 kWh/h. With capacity_factor=0.9,
        # we need cap >= 91.3 / 0.9 ~ 101.5 kW.
        min_expected = 800.0 * 1000 / HOURS / 0.9
        assert cap_boiler >= min_expected - 1.0  # small tolerance

    def test_boiler_cap_within_max(self, thermal_data):
        """Boiler capacity should not exceed max_size_kw."""
        data, config = thermal_data
        prob = pulp.LpProblem("test_thermal_max", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_electricity_balance(prob, v, data, config)
        add_thermal_balance(prob, v, data, config)
        set_cost_objective(prob, v, data)

        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=120)
        prob.solve(solver)

        assert prob.status == pulp.constants.LpStatusOptimal

        cap_boiler = pulp.value(v.cap["t1"])
        # max_size_kw for gas boiler in thermal_data is 2000.0
        assert cap_boiler <= 2000.0 + 0.01  # small tolerance


class TestThermalBaselineFallback:
    """Tests for the thermal baseline fallback (thermal_buy variables).

    These tests verify that thermal demands are always satisfiable even
    when no technology produces the required end-use, thanks to the
    baseline supply from conventional equipment (gas boiler / chiller).
    """

    def _make_data_no_thermal_tech(self, end_use: EndUse, consumption: float) -> tuple:
        """Helper: electricity demand + a thermal demand, NO thermal technology."""
        data = AnalysisData(
            analysis_id="test-baseline",
            wacc=0.05,
            demands=[
                Demand(id="d1", end_use=EndUse.ELECTRICITY, annual_consumption_mwh=100.0),
                Demand(id="d2", end_use=end_use, annual_consumption_mwh=consumption),
            ],
            resources=[
                Resource(id="r1", resource_type=ResourceType.ELECTRICITY,
                         buying_price=120.0, selling_price=50.0, co2_factor=0.4),
                Resource(id="r2", resource_type=ResourceType.NATURAL_GAS,
                         buying_price=40.0, co2_factor=0.2),
            ],
            technologies=[],  # No technologies at all!
            storage_systems=[],
        )
        config = ScenarioConfig(scenario_id="test-baseline", objective=Objective.COST)
        return data, config

    def test_heat_low_t_feasible_without_technology(self):
        """HEAT_LOW_T demand is feasible even with no boiler technology."""
        data, config = self._make_data_no_thermal_tech(EndUse.HEAT_LOW_T, 500.0)
        prob = pulp.LpProblem("test_baseline_heat", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_electricity_balance(prob, v, data, config)
        add_thermal_balance(prob, v, data, config)
        set_cost_objective(prob, v, data)

        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=60)
        prob.solve(solver)

        assert prob.status == pulp.constants.LpStatusOptimal

    def test_heat_high_t_feasible_without_technology(self):
        """HEAT_HIGH_T demand is feasible even with no CHP/boiler."""
        data, config = self._make_data_no_thermal_tech(EndUse.HEAT_HIGH_T, 1000.0)
        prob = pulp.LpProblem("test_baseline_hht", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_electricity_balance(prob, v, data, config)
        add_thermal_balance(prob, v, data, config)
        set_cost_objective(prob, v, data)

        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=60)
        prob.solve(solver)

        assert prob.status == pulp.constants.LpStatusOptimal

    def test_cold_feasible_without_technology(self):
        """COLD demand is feasible even with no chiller technology."""
        data, config = self._make_data_no_thermal_tech(EndUse.COLD, 300.0)
        prob = pulp.LpProblem("test_baseline_cold", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_electricity_balance(prob, v, data, config)
        add_thermal_balance(prob, v, data, config)
        set_cost_objective(prob, v, data)

        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=60)
        prob.solve(solver)

        assert prob.status == pulp.constants.LpStatusOptimal

    def test_thermal_buy_covers_full_demand(self):
        """With no thermal tech, thermal_buy should cover 100% of demand."""
        data, config = self._make_data_no_thermal_tech(EndUse.HEAT_LOW_T, 500.0)
        prob = pulp.LpProblem("test_thbuy_amount", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_electricity_balance(prob, v, data, config)
        add_thermal_balance(prob, v, data, config)
        set_cost_objective(prob, v, data)

        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=60)
        prob.solve(solver)

        assert prob.status == pulp.constants.LpStatusOptimal

        # thermal_buy should supply 500 MWh = 500,000 kWh total
        eu_key = EndUse.HEAT_LOW_T.value
        total_thbuy = sum(pulp.value(var) or 0.0 for var in v.thermal_buy[eu_key])
        assert abs(total_thbuy - 500_000.0) < 1.0  # within 1 kWh tolerance

    def test_run_optimization_succeeds_without_thermal_tech(self):
        """Full run_optimization succeeds with thermal demand but no thermal tech."""
        data, config = self._make_data_no_thermal_tech(EndUse.HEAT_LOW_T, 500.0)
        result = run_optimization(data, config)

        assert result.status == "completed"
        assert result.solver_status == "Optimal"

    def test_multi_thermal_demand_feasible(self):
        """Multiple thermal demands simultaneously are feasible without tech."""
        data = AnalysisData(
            analysis_id="test-multi-thermal",
            wacc=0.05,
            demands=[
                Demand(id="d1", end_use=EndUse.ELECTRICITY, annual_consumption_mwh=100.0),
                Demand(id="d2", end_use=EndUse.HEAT_HIGH_T, annual_consumption_mwh=2000.0),
                Demand(id="d3", end_use=EndUse.HEAT_LOW_T, annual_consumption_mwh=1000.0),
                Demand(id="d4", end_use=EndUse.COLD, annual_consumption_mwh=500.0),
            ],
            resources=[
                Resource(id="r1", resource_type=ResourceType.ELECTRICITY,
                         buying_price=120.0, selling_price=50.0, co2_factor=0.4),
                Resource(id="r2", resource_type=ResourceType.NATURAL_GAS,
                         buying_price=40.0, co2_factor=0.2),
            ],
            technologies=[],
            storage_systems=[],
        )
        config = ScenarioConfig(scenario_id="test-multi", objective=Objective.COST)

        result = run_optimization(data, config)

        assert result.status == "completed"
        assert result.solver_status == "Optimal"
