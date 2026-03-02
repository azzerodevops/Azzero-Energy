"""Integration test for full optimization pipeline."""
from solver.runner import run_optimization


def test_full_electricity_optimization(simple_electricity_data):
    """Test full pipeline with electricity demand + solar PV."""
    data, config = simple_electricity_data
    result = run_optimization(data, config)

    assert result.status == "completed"
    assert result.solver_status == "Optimal"
    assert result.total_capex >= 0
    assert result.co2_baseline > 0


def test_full_thermal_optimization(thermal_data):
    """Test full pipeline with electricity + heat demand."""
    data, config = thermal_data
    result = run_optimization(data, config)

    assert result.status == "completed"
    assert result.solver_status == "Optimal"


def test_optimization_no_demands():
    """Test that optimization fails gracefully with no demands."""
    from models.input import AnalysisData, ScenarioConfig

    data = AnalysisData(analysis_id="empty")
    config = ScenarioConfig(scenario_id="empty")

    result = run_optimization(data, config)
    assert result.status == "failed"
    assert "No energy demands" in result.error_message


def test_optimization_no_technologies():
    """Test that optimization fails gracefully with no technologies."""
    from models.input import AnalysisData, ScenarioConfig, Demand
    from models.enums import EndUse

    data = AnalysisData(
        analysis_id="no-tech",
        demands=[Demand(id="d1", end_use=EndUse.ELECTRICITY, annual_consumption_mwh=100)],
    )
    config = ScenarioConfig(scenario_id="no-tech")

    result = run_optimization(data, config)
    assert result.status == "failed"
    assert "No technologies" in result.error_message
