from enum import Enum


class EndUse(str, Enum):
    ELECTRICITY = "ELECTRICITY"
    HEAT_HIGH_T = "HEAT_HIGH_T"
    HEAT_MED_T = "HEAT_MED_T"
    HEAT_LOW_T = "HEAT_LOW_T"
    COLD = "COLD"


class ResourceType(str, Enum):
    ELECTRICITY = "electricity"
    NATURAL_GAS = "natural_gas"
    BIOMASS = "biomass"
    DIESEL = "diesel"
    LPG = "lpg"
    SOLAR = "solar"
    WIND = "wind"
    HYDROGEN = "hydrogen"


class StorageType(str, Enum):
    BATTERY_LION = "battery_lion"
    THERMAL_HOT = "thermal_hot"
    THERMAL_COLD = "thermal_cold"


class Objective(str, Enum):
    COST = "cost"
    DECARBONIZATION = "decarbonization"


class ScenarioStatus(str, Enum):
    DRAFT = "draft"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    OUTDATED = "outdated"
