"""Tests for solver.storage — SOC constraints and battery feasibility."""
import pulp
import pytest

from models.input import (
    AnalysisData,
    Demand,
    Resource,
    Technology,
    TechIO,
    StorageSystem,
    ScenarioConfig,
)
from models.enums import EndUse, ResourceType, StorageType
from solver.variables import create_all_variables, HOURS
from solver.storage import add_storage_constraints
from solver.electricity import add_electricity_balance
from solver.objectives import set_cost_objective


class TestSOCConstraints:
    """Tests for add_storage_constraints SOC dynamics and bounds."""

    def test_soc_dynamics_constraints_added(self, storage_data):
        """SOC dynamics constraints are added for each hour."""
        data, config = storage_data
        prob = pulp.LpProblem("test_soc_dynamics", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_storage_constraints(prob, v, data)

        dynamics_names = [
            name for name in prob.constraints
            if name.startswith("soc_dynamics_s1")
        ]
        assert len(dynamics_names) == HOURS

    def test_soc_min_constraints_added(self, storage_data):
        """SOC minimum bound constraints are added for each hour."""
        data, config = storage_data
        prob = pulp.LpProblem("test_soc_min", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_storage_constraints(prob, v, data)

        min_names = [
            name for name in prob.constraints
            if name.startswith("soc_min_s1")
        ]
        assert len(min_names) == HOURS

    def test_soc_max_constraints_added(self, storage_data):
        """SOC maximum bound constraints are added for each hour."""
        data, config = storage_data
        prob = pulp.LpProblem("test_soc_max", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_storage_constraints(prob, v, data)

        max_names = [
            name for name in prob.constraints
            if name.startswith("soc_max_s1")
        ]
        assert len(max_names) == HOURS

    def test_total_constraint_count(self, storage_data):
        """Total constraints = 3 * HOURS (dynamics + min + max) per storage."""
        data, config = storage_data
        prob = pulp.LpProblem("test_soc_count", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_storage_constraints(prob, v, data)

        s1_constraints = [
            name for name in prob.constraints
            if "_s1_" in name
        ]
        assert len(s1_constraints) == 3 * HOURS

    def test_no_constraints_without_storage(self, simple_electricity_data):
        """No storage constraints if data has no storage systems."""
        data, config = simple_electricity_data
        prob = pulp.LpProblem("test_no_storage", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_storage_constraints(prob, v, data)

        # No storage-related constraints
        soc_names = [
            name for name in prob.constraints
            if "soc_" in name
        ]
        assert len(soc_names) == 0


class TestStorageSolverFeasibility:
    """Tests for solver feasibility with battery storage."""

    def test_solver_feasible_with_battery(self, storage_data):
        """Solver finds a feasible solution with battery storage."""
        data, config = storage_data
        prob = pulp.LpProblem("test_battery_feasible", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_electricity_balance(prob, v, data, config)
        add_storage_constraints(prob, v, data)
        set_cost_objective(prob, v, data)

        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=120)
        prob.solve(solver)

        assert prob.status == pulp.constants.LpStatusOptimal

    def test_soc_within_bounds_after_solve(self, storage_data):
        """After solving, SOC stays within [min_soc, max_soc] * capacity."""
        data, config = storage_data
        prob = pulp.LpProblem("test_soc_bounds", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_electricity_balance(prob, v, data, config)
        add_storage_constraints(prob, v, data)
        set_cost_objective(prob, v, data)

        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=120)
        prob.solve(solver)

        assert prob.status == pulp.constants.LpStatusOptimal

        storage = data.storage_systems[0]
        min_energy = storage.min_soc * storage.capacity_kwh  # 0.1 * 500 = 50
        max_energy = storage.max_soc * storage.capacity_kwh  # 0.9 * 500 = 450

        # Check a sample of hours (checking all 8760 would be slow)
        sample_hours = [0, 100, 1000, 4380, 8000, HOURS - 1]
        for h in sample_hours:
            soc_val = pulp.value(v.soc["s1"][h])
            if soc_val is not None:
                assert soc_val >= min_energy - 0.01, f"SOC below min at h={h}: {soc_val}"
                assert soc_val <= max_energy + 0.01, f"SOC above max at h={h}: {soc_val}"

    def test_charge_discharge_within_limits(self, storage_data):
        """After solving, charge/discharge stay within power limits."""
        data, config = storage_data
        prob = pulp.LpProblem("test_power_limits", pulp.LpMinimize)
        v = create_all_variables(data, config)

        add_electricity_balance(prob, v, data, config)
        add_storage_constraints(prob, v, data)
        set_cost_objective(prob, v, data)

        solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=120)
        prob.solve(solver)

        assert prob.status == pulp.constants.LpStatusOptimal

        storage = data.storage_systems[0]
        max_charge = storage.max_charge_kw  # 100.0
        max_discharge = storage.max_discharge_kw  # 100.0

        sample_hours = [0, 500, 2000, 5000, 8000]
        for h in sample_hours:
            chg_val = pulp.value(v.charge["s1"][h])
            dis_val = pulp.value(v.discharge["s1"][h])
            if chg_val is not None:
                assert chg_val >= -0.01, f"Charge negative at h={h}"
                assert chg_val <= max_charge + 0.01, f"Charge exceeds limit at h={h}"
            if dis_val is not None:
                assert dis_val >= -0.01, f"Discharge negative at h={h}"
                assert dis_val <= max_discharge + 0.01, f"Discharge exceeds limit at h={h}"
