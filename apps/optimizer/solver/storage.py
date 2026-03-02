from __future__ import annotations

import pulp

from models.input import AnalysisData, StorageSystem
from solver.variables import OptVars, HOURS


def add_storage_constraints(
    prob: pulp.LpProblem,
    v: OptVars,
    data: AnalysisData,
) -> None:
    """Add state-of-charge dynamics and bounds for every storage system.

    For each storage the constraints are:
      1. SOC dynamics (energy balance each hour, cyclic boundary at h=0).
      2. SOC bounds (min_soc * capacity <= SOC <= max_soc * capacity).
      3. Charge/discharge power limits are already enforced as variable upper
         bounds in variables.py, so no explicit constraints are added here.
    """
    for storage in data.storage_systems:
        sid = storage.id

        # Skip if no variables were created for this storage
        if sid not in v.soc:
            continue

        cap = storage.capacity_kwh
        eta_c = storage.charge_efficiency
        eta_d = storage.discharge_efficiency
        sd = storage.self_discharge_rate
        min_e = storage.min_soc * cap
        max_e = storage.max_soc * cap

        for h in range(HOURS):
            h_prev = h - 1 if h > 0 else HOURS - 1  # wrap around

            # SOC dynamics
            prob += (
                v.soc[sid][h]
                == v.soc[sid][h_prev] * (1 - sd)
                + v.charge[sid][h] * eta_c
                - v.discharge[sid][h] / eta_d,
                f"soc_dynamics_{sid}_{h}",
            )

            # SOC bounds
            prob += (v.soc[sid][h] >= min_e, f"soc_min_{sid}_{h}")
            prob += (v.soc[sid][h] <= max_e, f"soc_max_{sid}_{h}")
