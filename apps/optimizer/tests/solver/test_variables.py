"""Tests for solver.variables — variable creation and bounds."""
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
    ScenarioTechConfig,
)
from models.enums import EndUse, ResourceType, StorageType, Objective
from solver.variables import create_all_variables, OptVars, HOURS


class TestOptVarsCreation:
    """Tests for create_all_variables returning a well-formed OptVars."""

    def test_returns_optvars_instance(self, simple_electricity_data):
        """create_all_variables returns an OptVars instance."""
        data, config = simple_electricity_data
        v = create_all_variables(data, config)
        assert isinstance(v, OptVars)

    def test_empty_data_returns_empty_vars(self):
        """No techs/storage/resources yields empty dicts."""
        data = AnalysisData(analysis_id="empty")
        config = ScenarioConfig(scenario_id="empty")
        v = create_all_variables(data, config)

        assert isinstance(v, OptVars)
        assert len(v.cap) == 0
        assert len(v.buy) == 0
        assert len(v.sell) == 0
        assert len(v.soc) == 0


class TestTechnologyVariables:
    """Tests for technology variable creation."""

    def test_cap_variable_created_for_each_tech(self, simple_electricity_data):
        """One capacity variable per technology."""
        data, config = simple_electricity_data
        v = create_all_variables(data, config)

        # simple_electricity_data has 1 technology with id "t1"
        assert "t1" in v.cap
        assert isinstance(v.cap["t1"], pulp.LpVariable)

    def test_use_binary_variable_created(self, simple_electricity_data):
        """A binary use variable is created for each technology."""
        data, config = simple_electricity_data
        v = create_all_variables(data, config)

        assert "t1" in v.use
        # PuLP stores Binary as Integer with bounds [0,1]
        assert v.use["t1"].cat in ("Binary", "Integer")
        assert v.use["t1"].lowBound == 0
        assert v.use["t1"].upBound == 1

    def test_new_tech_cap_bounds(self):
        """Non-existing tech: cap bounded [0, max_size_kw]."""
        data = AnalysisData(
            analysis_id="test",
            demands=[
                Demand(id="d1", end_use=EndUse.ELECTRICITY, annual_consumption_mwh=100.0),
            ],
            technologies=[
                Technology(
                    id="t1",
                    name="PV",
                    category="renewable",
                    min_size_kw=10.0,
                    max_size_kw=5000.0,
                    is_existing=False,
                    inputs=[TechIO(resource_type=ResourceType.SOLAR)],
                    outputs=[TechIO(end_use=EndUse.ELECTRICITY)],
                ),
            ],
        )
        config = ScenarioConfig(scenario_id="test")
        v = create_all_variables(data, config)

        cap = v.cap["t1"]
        assert cap.lowBound == 0
        assert cap.upBound == 5000.0

    def test_existing_tech_cap_fixed(self):
        """Existing tech: cap is fixed at installed_capacity_kw."""
        data = AnalysisData(
            analysis_id="test",
            technologies=[
                Technology(
                    id="t_ex",
                    name="Existing Boiler",
                    category="thermal",
                    installed_capacity_kw=200.0,
                    is_existing=True,
                    inputs=[TechIO(resource_type=ResourceType.NATURAL_GAS)],
                    outputs=[TechIO(end_use=EndUse.HEAT_LOW_T)],
                ),
            ],
        )
        config = ScenarioConfig(scenario_id="test")
        v = create_all_variables(data, config)

        cap = v.cap["t_ex"]
        assert cap.lowBound == 200.0
        assert cap.upBound == 200.0

    def test_scenario_config_overrides_bounds(self):
        """ScenarioTechConfig overrides min/max from tech defaults."""
        data = AnalysisData(
            analysis_id="test",
            technologies=[
                Technology(
                    id="t1",
                    name="PV",
                    category="renewable",
                    min_size_kw=0.0,
                    max_size_kw=10000.0,
                    is_existing=False,
                    inputs=[TechIO(resource_type=ResourceType.SOLAR)],
                    outputs=[TechIO(end_use=EndUse.ELECTRICITY)],
                ),
            ],
        )
        config = ScenarioConfig(
            scenario_id="test",
            tech_configs=[
                ScenarioTechConfig(
                    technology_id="t1",
                    min_capacity_kw=50.0,
                    max_capacity_kw=2000.0,
                ),
            ],
        )
        v = create_all_variables(data, config)

        cap = v.cap["t1"]
        # For new tech: lowBound is always 0, max is overridden by scenario config
        assert cap.lowBound == 0
        assert cap.upBound == 2000.0

    def test_energy_in_variables_per_resource_input(self):
        """Energy input variables are created per resource type input."""
        data = AnalysisData(
            analysis_id="test",
            technologies=[
                Technology(
                    id="t1",
                    name="CHP",
                    category="cogen",
                    inputs=[
                        TechIO(resource_type=ResourceType.NATURAL_GAS, conversion_factor=1.0),
                    ],
                    outputs=[
                        TechIO(end_use=EndUse.ELECTRICITY, conversion_factor=0.4),
                        TechIO(end_use=EndUse.HEAT_LOW_T, conversion_factor=0.5),
                    ],
                ),
            ],
        )
        config = ScenarioConfig(scenario_id="test")
        v = create_all_variables(data, config)

        assert "t1" in v.energy_in
        assert "natural_gas" in v.energy_in["t1"]
        assert len(v.energy_in["t1"]["natural_gas"]) == HOURS

    def test_energy_out_variables_per_end_use(self):
        """Energy output variables are created per end-use output."""
        data = AnalysisData(
            analysis_id="test",
            technologies=[
                Technology(
                    id="t1",
                    name="CHP",
                    category="cogen",
                    inputs=[TechIO(resource_type=ResourceType.NATURAL_GAS)],
                    outputs=[
                        TechIO(end_use=EndUse.ELECTRICITY, conversion_factor=0.4),
                        TechIO(end_use=EndUse.HEAT_LOW_T, conversion_factor=0.5),
                    ],
                ),
            ],
        )
        config = ScenarioConfig(scenario_id="test")
        v = create_all_variables(data, config)

        assert "t1" in v.energy_out
        assert EndUse.ELECTRICITY.value in v.energy_out["t1"]
        assert EndUse.HEAT_LOW_T.value in v.energy_out["t1"]
        assert len(v.energy_out["t1"][EndUse.ELECTRICITY.value]) == HOURS
        assert len(v.energy_out["t1"][EndUse.HEAT_LOW_T.value]) == HOURS

    def test_energy_out_variables_non_negative(self):
        """All energy output variables have lowBound=0."""
        data = AnalysisData(
            analysis_id="test",
            technologies=[
                Technology(
                    id="t1",
                    name="PV",
                    category="renewable",
                    inputs=[TechIO(resource_type=ResourceType.SOLAR)],
                    outputs=[TechIO(end_use=EndUse.ELECTRICITY)],
                ),
            ],
        )
        config = ScenarioConfig(scenario_id="test")
        v = create_all_variables(data, config)

        for var in v.energy_out["t1"][EndUse.ELECTRICITY.value]:
            assert var.lowBound == 0


class TestStorageVariables:
    """Tests for storage variable creation."""

    def test_soc_charge_discharge_created(self, storage_data):
        """SOC, charge and discharge variables created for each storage."""
        data, config = storage_data
        v = create_all_variables(data, config)

        assert "s1" in v.soc
        assert "s1" in v.charge
        assert "s1" in v.discharge
        assert len(v.soc["s1"]) == HOURS
        assert len(v.charge["s1"]) == HOURS
        assert len(v.discharge["s1"]) == HOURS

    def test_charge_upper_bound(self, storage_data):
        """Charge variables bounded by max_charge_kw."""
        data, config = storage_data
        v = create_all_variables(data, config)

        # storage_data has max_charge_kw=100.0
        for var in v.charge["s1"]:
            assert var.upBound == 100.0
            assert var.lowBound == 0

    def test_discharge_upper_bound(self, storage_data):
        """Discharge variables bounded by max_discharge_kw."""
        data, config = storage_data
        v = create_all_variables(data, config)

        # storage_data has max_discharge_kw=100.0
        for var in v.discharge["s1"]:
            assert var.upBound == 100.0
            assert var.lowBound == 0

    def test_soc_non_negative(self, storage_data):
        """SOC variables have lowBound=0."""
        data, config = storage_data
        v = create_all_variables(data, config)

        for var in v.soc["s1"]:
            assert var.lowBound == 0


class TestResourceVariables:
    """Tests for resource buy/sell variable creation."""

    def test_buy_variables_for_each_resource(self, simple_electricity_data):
        """Buy variables created for every resource."""
        data, config = simple_electricity_data
        v = create_all_variables(data, config)

        # simple_electricity_data has ELECTRICITY and SOLAR resources
        assert "electricity" in v.buy
        assert "solar" in v.buy
        assert len(v.buy["electricity"]) == HOURS
        assert len(v.buy["solar"]) == HOURS

    def test_sell_only_for_electricity(self, simple_electricity_data):
        """Sell variables only created for ELECTRICITY resource type."""
        data, config = simple_electricity_data
        v = create_all_variables(data, config)

        assert "electricity" in v.sell
        assert "solar" not in v.sell

    def test_buy_variables_non_negative(self, simple_electricity_data):
        """All buy variables have lowBound=0."""
        data, config = simple_electricity_data
        v = create_all_variables(data, config)

        for var in v.buy["electricity"]:
            assert var.lowBound == 0

    def test_correct_total_variable_count(self, simple_electricity_data):
        """Verify total number of variables matches expectations."""
        data, config = simple_electricity_data
        v = create_all_variables(data, config)

        # 1 technology: 1 cap + 1 use + HOURS energy_in (solar) + HOURS energy_out (elec)
        # 2 resources: 2 * HOURS buy + 1 * HOURS sell (only elec)
        expected_buy = 2 * HOURS
        expected_sell = HOURS

        total_buy = sum(len(vars_list) for vars_list in v.buy.values())
        total_sell = sum(len(vars_list) for vars_list in v.sell.values())

        assert total_buy == expected_buy
        assert total_sell == expected_sell
