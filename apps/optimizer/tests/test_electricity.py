"""Test electricity-only optimization."""
import pulp
from models.enums import EndUse
from solver.variables import create_all_variables, HOURS
from solver.electricity import add_electricity_balance
from solver.objectives import set_cost_objective


def test_electricity_balance_flat_profile(simple_electricity_data):
    """Test that electricity balance is satisfied with flat demand profile."""
    data, config = simple_electricity_data

    prob = pulp.LpProblem("test_elec", pulp.LpMinimize)
    v = create_all_variables(data, config)
    add_electricity_balance(prob, v, data, config)
    set_cost_objective(prob, v, data)

    solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=60)
    prob.solve(solver)

    assert prob.status == pulp.constants.LpStatusOptimal

    # Check that some capacity is allocated
    cap_solar = pulp.value(v.cap["t1"])
    assert cap_solar is not None
    assert cap_solar >= 0


def test_grid_only_feasible(simple_electricity_data):
    """Test that the problem is feasible even without any technologies (grid only)."""
    data, config = simple_electricity_data
    data.technologies = []  # Remove all technologies

    prob = pulp.LpProblem("test_grid_only", pulp.LpMinimize)
    v = create_all_variables(data, config)
    add_electricity_balance(prob, v, data, config)
    set_cost_objective(prob, v, data)

    solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=60)
    prob.solve(solver)

    assert prob.status == pulp.constants.LpStatusOptimal
