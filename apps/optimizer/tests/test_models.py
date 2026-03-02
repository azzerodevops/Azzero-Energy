"""Tests for models — Pydantic model validation and enum values."""
import pytest
from pydantic import ValidationError

from models.enums import EndUse, ResourceType, StorageType, Objective, ScenarioStatus
from models.input import (
    AnalysisData,
    Demand,
    Resource,
    Technology,
    TechIO,
    StorageSystem,
    ScenarioConfig,
    ScenarioTechConfig,
)
from models.output import (
    OptimizationResult,
    TechResult,
    StorageResult,
    SolveResponse,
    StatusResponse,
)


# ---- Enum tests ----


class TestEnums:
    """Tests for all enum definitions."""

    def test_end_use_values(self):
        """EndUse enum has the expected 5 members."""
        assert EndUse.ELECTRICITY == "ELECTRICITY"
        assert EndUse.HEAT_HIGH_T == "HEAT_HIGH_T"
        assert EndUse.HEAT_MED_T == "HEAT_MED_T"
        assert EndUse.HEAT_LOW_T == "HEAT_LOW_T"
        assert EndUse.COLD == "COLD"
        assert len(EndUse) == 5

    def test_resource_type_values(self):
        """ResourceType enum has the expected 8 members."""
        assert ResourceType.ELECTRICITY == "electricity"
        assert ResourceType.NATURAL_GAS == "natural_gas"
        assert ResourceType.BIOMASS == "biomass"
        assert ResourceType.DIESEL == "diesel"
        assert ResourceType.LPG == "lpg"
        assert ResourceType.SOLAR == "solar"
        assert ResourceType.WIND == "wind"
        assert ResourceType.HYDROGEN == "hydrogen"
        assert len(ResourceType) == 8

    def test_storage_type_values(self):
        """StorageType enum has the expected 3 members."""
        assert StorageType.BATTERY_LION == "battery_lion"
        assert StorageType.THERMAL_HOT == "thermal_hot"
        assert StorageType.THERMAL_COLD == "thermal_cold"
        assert len(StorageType) == 3

    def test_objective_values(self):
        """Objective enum has cost and decarbonization."""
        assert Objective.COST == "cost"
        assert Objective.DECARBONIZATION == "decarbonization"
        assert len(Objective) == 2

    def test_scenario_status_values(self):
        """ScenarioStatus enum has the expected 6 members."""
        assert ScenarioStatus.DRAFT == "draft"
        assert ScenarioStatus.QUEUED == "queued"
        assert ScenarioStatus.RUNNING == "running"
        assert ScenarioStatus.COMPLETED == "completed"
        assert ScenarioStatus.FAILED == "failed"
        assert ScenarioStatus.OUTDATED == "outdated"
        assert len(ScenarioStatus) == 6

    def test_enums_are_str_enums(self):
        """All enums subclass str so they serialize to strings."""
        assert isinstance(EndUse.ELECTRICITY, str)
        assert isinstance(ResourceType.NATURAL_GAS, str)
        assert isinstance(StorageType.BATTERY_LION, str)
        assert isinstance(Objective.COST, str)
        assert isinstance(ScenarioStatus.DRAFT, str)


# ---- Input model tests ----


class TestDemandModel:
    """Tests for the Demand model."""

    def test_valid_demand(self):
        """Demand can be instantiated with valid data."""
        d = Demand(
            id="d1",
            end_use=EndUse.ELECTRICITY,
            annual_consumption_mwh=1000.0,
        )
        assert d.id == "d1"
        assert d.end_use == EndUse.ELECTRICITY
        assert d.annual_consumption_mwh == 1000.0
        assert d.hourly_profile is None

    def test_demand_with_hourly_profile(self):
        """Demand accepts an optional hourly profile."""
        profile = [10.0] * 8760
        d = Demand(
            id="d2",
            end_use=EndUse.HEAT_LOW_T,
            annual_consumption_mwh=500.0,
            hourly_profile=profile,
        )
        assert d.hourly_profile is not None
        assert len(d.hourly_profile) == 8760

    def test_demand_missing_required_fields(self):
        """Demand raises ValidationError when required fields are missing."""
        with pytest.raises(ValidationError):
            Demand()

    def test_demand_invalid_end_use(self):
        """Demand raises ValidationError for invalid end_use value."""
        with pytest.raises(ValidationError):
            Demand(
                id="d1",
                end_use="INVALID_END_USE",
                annual_consumption_mwh=100.0,
            )


class TestResourceModel:
    """Tests for the Resource model."""

    def test_valid_resource(self):
        """Resource can be instantiated with valid data."""
        r = Resource(
            id="r1",
            resource_type=ResourceType.ELECTRICITY,
            buying_price=120.0,
        )
        assert r.id == "r1"
        assert r.resource_type == ResourceType.ELECTRICITY
        assert r.buying_price == 120.0
        assert r.selling_price == 0.0  # default
        assert r.co2_factor == 0.0  # default
        assert r.max_availability is None  # default

    def test_resource_with_all_fields(self):
        """Resource with all optional fields populated."""
        r = Resource(
            id="r2",
            resource_type=ResourceType.NATURAL_GAS,
            buying_price=40.0,
            selling_price=0.0,
            co2_factor=0.2,
            max_availability=5000.0,
        )
        assert r.co2_factor == 0.2
        assert r.max_availability == 5000.0

    def test_resource_invalid_type(self):
        """Resource raises ValidationError for invalid resource_type."""
        with pytest.raises(ValidationError):
            Resource(
                id="r1",
                resource_type="nuclear",
                buying_price=100.0,
            )


class TestTechnologyModel:
    """Tests for the Technology model."""

    def test_valid_technology(self):
        """Technology can be instantiated with valid data."""
        t = Technology(
            id="t1",
            name="Solar PV",
            category="renewable",
            capex_per_kw=800.0,
            lifetime=25,
        )
        assert t.id == "t1"
        assert t.name == "Solar PV"
        assert t.capex_per_kw == 800.0
        assert t.lifetime == 25
        assert t.is_existing is False  # default

    def test_technology_defaults(self):
        """Technology has sensible defaults for optional fields."""
        t = Technology(id="t1", name="Test", category="test")
        assert t.capex_per_kw == 0.0
        assert t.maintenance_annual_per_kw == 0.0
        assert t.lifetime == 20
        assert t.capacity_factor == 1.0
        assert t.min_size_kw == 0.0
        assert t.max_size_kw == 100000.0
        assert t.installed_capacity_kw == 0.0
        assert t.is_existing is False
        assert t.inputs == []
        assert t.outputs == []

    def test_technology_with_io(self):
        """Technology with inputs and outputs."""
        t = Technology(
            id="t1",
            name="CHP",
            category="cogen",
            inputs=[TechIO(resource_type=ResourceType.NATURAL_GAS, conversion_factor=1.0)],
            outputs=[
                TechIO(end_use=EndUse.ELECTRICITY, conversion_factor=0.4),
                TechIO(end_use=EndUse.HEAT_LOW_T, conversion_factor=0.5),
            ],
        )
        assert len(t.inputs) == 1
        assert len(t.outputs) == 2
        assert t.inputs[0].resource_type == ResourceType.NATURAL_GAS
        assert t.outputs[0].end_use == EndUse.ELECTRICITY


class TestTechIOModel:
    """Tests for the TechIO model."""

    def test_techio_defaults(self):
        """TechIO has None for optional fields and conversion_factor=1.0."""
        io = TechIO()
        assert io.resource_type is None
        assert io.end_use is None
        assert io.conversion_factor == 1.0

    def test_techio_as_input(self):
        """TechIO as a technology input (resource_type set)."""
        io = TechIO(resource_type=ResourceType.SOLAR, conversion_factor=1.0)
        assert io.resource_type == ResourceType.SOLAR
        assert io.end_use is None

    def test_techio_as_output(self):
        """TechIO as a technology output (end_use set)."""
        io = TechIO(end_use=EndUse.ELECTRICITY, conversion_factor=0.9)
        assert io.end_use == EndUse.ELECTRICITY
        assert io.conversion_factor == 0.9


class TestStorageSystemModel:
    """Tests for the StorageSystem model."""

    def test_valid_storage_system(self):
        """StorageSystem can be instantiated with valid data."""
        s = StorageSystem(
            id="s1",
            storage_type=StorageType.BATTERY_LION,
            capacity_kwh=500.0,
            max_charge_kw=100.0,
            max_discharge_kw=100.0,
        )
        assert s.id == "s1"
        assert s.storage_type == StorageType.BATTERY_LION
        assert s.capacity_kwh == 500.0

    def test_storage_defaults(self):
        """StorageSystem has correct defaults."""
        s = StorageSystem(id="s1", storage_type=StorageType.BATTERY_LION)
        assert s.name == ""
        assert s.capacity_kwh == 0.0
        assert s.charge_efficiency == 0.95
        assert s.discharge_efficiency == 0.95
        assert s.self_discharge_rate == 0.0
        assert s.capex_per_kwh == 0.0
        assert s.min_soc == 0.1
        assert s.max_soc == 0.9

    def test_storage_invalid_type(self):
        """StorageSystem raises ValidationError for invalid storage_type."""
        with pytest.raises(ValidationError):
            StorageSystem(id="s1", storage_type="flywheel")


class TestScenarioConfigModel:
    """Tests for ScenarioConfig and ScenarioTechConfig."""

    def test_valid_scenario_config(self):
        """ScenarioConfig can be instantiated with valid data."""
        c = ScenarioConfig(scenario_id="sc1")
        assert c.scenario_id == "sc1"
        assert c.objective == Objective.COST  # default
        assert c.co2_target is None
        assert c.budget_limit is None
        assert c.tech_configs == []

    def test_scenario_config_with_overrides(self):
        """ScenarioConfig with objective and budget set."""
        c = ScenarioConfig(
            scenario_id="sc2",
            objective=Objective.DECARBONIZATION,
            budget_limit=500000.0,
            co2_target=0.5,
        )
        assert c.objective == Objective.DECARBONIZATION
        assert c.budget_limit == 500000.0
        assert c.co2_target == 0.5

    def test_scenario_tech_config(self):
        """ScenarioTechConfig can be instantiated."""
        tc = ScenarioTechConfig(
            technology_id="t1",
            min_capacity_kw=50.0,
            max_capacity_kw=2000.0,
            force_include=True,
        )
        assert tc.technology_id == "t1"
        assert tc.min_capacity_kw == 50.0
        assert tc.max_capacity_kw == 2000.0
        assert tc.force_include is True

    def test_scenario_tech_config_defaults(self):
        """ScenarioTechConfig defaults to None for capacity and False for force."""
        tc = ScenarioTechConfig(technology_id="t1")
        assert tc.min_capacity_kw is None
        assert tc.max_capacity_kw is None
        assert tc.force_include is False


class TestAnalysisDataModel:
    """Tests for the AnalysisData model."""

    def test_valid_analysis_data(self):
        """AnalysisData can be instantiated with minimal valid data."""
        ad = AnalysisData(analysis_id="a1")
        assert ad.analysis_id == "a1"
        assert ad.wacc == 0.05  # default
        assert ad.demands == []
        assert ad.resources == []
        assert ad.technologies == []
        assert ad.storage_systems == []

    def test_analysis_data_missing_id(self):
        """AnalysisData raises ValidationError without analysis_id."""
        with pytest.raises(ValidationError):
            AnalysisData()


# ---- Output model tests ----


class TestTechResultModel:
    """Tests for the TechResult model."""

    def test_valid_tech_result(self):
        """TechResult can be instantiated with valid data."""
        tr = TechResult(
            technology_id="t1",
            technology_name="Solar PV",
            optimal_capacity_kw=250.0,
            annual_production_mwh=328.5,
            capex=200000.0,
            annual_savings=12000.0,
        )
        assert tr.technology_id == "t1"
        assert tr.optimal_capacity_kw == 250.0

    def test_tech_result_defaults(self):
        """TechResult has zero defaults for numeric fields."""
        tr = TechResult(technology_id="t1")
        assert tr.technology_name == ""
        assert tr.optimal_capacity_kw == 0.0
        assert tr.annual_production_mwh == 0.0
        assert tr.capex == 0.0
        assert tr.annual_opex == 0.0
        assert tr.annual_savings == 0.0


class TestStorageResultModel:
    """Tests for the StorageResult model."""

    def test_valid_storage_result(self):
        """StorageResult can be instantiated with valid data."""
        sr = StorageResult(
            storage_id="s1",
            storage_name="Li-ion",
            optimal_capacity_kwh=500.0,
            capex=100000.0,
            annual_cycles=250.5,
        )
        assert sr.storage_id == "s1"
        assert sr.annual_cycles == 250.5

    def test_storage_result_defaults(self):
        """StorageResult has zero defaults."""
        sr = StorageResult(storage_id="s1")
        assert sr.storage_name == ""
        assert sr.optimal_capacity_kwh == 0.0
        assert sr.capex == 0.0
        assert sr.annual_cycles == 0.0


class TestOptimizationResultModel:
    """Tests for the OptimizationResult model."""

    def test_valid_optimization_result(self):
        """OptimizationResult can be instantiated with valid data."""
        result = OptimizationResult(
            scenario_id="sc1",
            status="completed",
            total_capex=150000.0,
            total_savings_annual=25000.0,
            co2_reduction_percent=0.35,
        )
        assert result.scenario_id == "sc1"
        assert result.status == "completed"
        assert result.co2_reduction_percent == 0.35

    def test_optimization_result_defaults(self):
        """OptimizationResult has sensible defaults."""
        result = OptimizationResult(scenario_id="sc1")
        assert result.status == "completed"
        assert result.solver_status == ""
        assert result.total_capex == 0.0
        assert result.total_opex_annual == 0.0
        assert result.total_savings_annual == 0.0
        assert result.payback_years is None
        assert result.irr is None
        assert result.npv is None
        assert result.co2_baseline == 0.0
        assert result.co2_optimized == 0.0
        assert result.co2_reduction_percent == 0.0
        assert result.tech_results == []
        assert result.storage_results == []
        assert result.error_message is None

    def test_optimization_result_with_nested_results(self):
        """OptimizationResult with nested tech and storage results."""
        result = OptimizationResult(
            scenario_id="sc1",
            tech_results=[
                TechResult(technology_id="t1", optimal_capacity_kw=100.0),
                TechResult(technology_id="t2", optimal_capacity_kw=200.0),
            ],
            storage_results=[
                StorageResult(storage_id="s1", optimal_capacity_kwh=500.0),
            ],
        )
        assert len(result.tech_results) == 2
        assert len(result.storage_results) == 1


class TestSolveResponseModel:
    """Tests for the SolveResponse model."""

    def test_valid_solve_response(self):
        """SolveResponse can be instantiated."""
        sr = SolveResponse(scenario_id="sc1")
        assert sr.status == "queued"
        assert sr.scenario_id == "sc1"
        assert sr.message == "Optimization job queued"

    def test_solve_response_missing_id(self):
        """SolveResponse raises ValidationError without scenario_id."""
        with pytest.raises(ValidationError):
            SolveResponse()


class TestStatusResponseModel:
    """Tests for the StatusResponse model."""

    def test_valid_status_response(self):
        """StatusResponse can be instantiated."""
        sr = StatusResponse(
            scenario_id="sc1",
            status=ScenarioStatus.RUNNING,
        )
        assert sr.scenario_id == "sc1"
        assert sr.status == ScenarioStatus.RUNNING
        assert sr.message == ""

    def test_status_response_invalid_status(self):
        """StatusResponse raises ValidationError for invalid status."""
        with pytest.raises(ValidationError):
            StatusResponse(
                scenario_id="sc1",
                status="invalid_status",
            )
