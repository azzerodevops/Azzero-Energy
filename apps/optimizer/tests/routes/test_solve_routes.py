"""Tests for routes.solve — POST /solve/{id}, GET /solve/{id}/status, GET /solve/{id}/results.

All database calls are mocked so no real Supabase connection is needed.
"""
from unittest.mock import AsyncMock, MagicMock, patch, call

import pytest
from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


class TestSolveEndpoint:
    """Tests for POST /solve/{scenario_id}."""

    @patch("routes.solve.update_scenario_status", new_callable=AsyncMock)
    def test_solve_returns_200_queued(self, mock_update_status):
        """POST /solve/{id} returns 200 with status='queued'."""
        mock_update_status.return_value = None

        response = client.post("/solve/test-scenario-123")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "queued"
        assert data["scenario_id"] == "test-scenario-123"

    @patch("routes.solve.update_scenario_status", new_callable=AsyncMock)
    def test_solve_returns_message(self, mock_update_status):
        """POST /solve/{id} response includes a message."""
        mock_update_status.return_value = None

        response = client.post("/solve/test-scenario-abc")

        data = response.json()
        assert "message" in data
        assert isinstance(data["message"], str)

    @patch("routes.solve.update_scenario_status", new_callable=AsyncMock)
    def test_solve_calls_update_status_queued(self, mock_update_status):
        """POST /solve/{id} calls update_scenario_status with 'queued'."""
        mock_update_status.return_value = None

        client.post("/solve/test-scenario-xyz")

        # The first call should be ("scenario_id", "queued") from the route handler.
        # The background task may also call it, so just check the first call.
        assert mock_update_status.call_count >= 1
        first_call = mock_update_status.call_args_list[0]
        assert first_call == call("test-scenario-xyz", "queued")

    @patch("routes.solve.update_scenario_status", new_callable=AsyncMock)
    def test_solve_404_when_scenario_not_found(self, mock_update_status):
        """POST /solve/{id} returns 404 when update_scenario_status raises."""
        mock_update_status.side_effect = Exception("Scenario not found")

        response = client.post("/solve/nonexistent-id")

        assert response.status_code == 404
        assert "Scenario not found" in response.json()["detail"]


class TestStatusEndpoint:
    """Tests for GET /solve/{scenario_id}/status."""

    @patch("db.client.get_supabase_client")
    def test_status_returns_correct_structure(self, mock_get_client):
        """GET /solve/{id}/status returns correct status structure."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        # Build the chained Supabase call mock
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_eq = MagicMock()
        mock_select.eq.return_value = mock_eq
        mock_single = MagicMock()
        mock_eq.single.return_value = mock_single

        mock_response = MagicMock()
        mock_response.data = {"status": "running"}
        mock_single.execute.return_value = mock_response

        response = client.get("/solve/test-scenario-1/status")

        assert response.status_code == 200
        data = response.json()
        assert data["scenario_id"] == "test-scenario-1"
        assert data["status"] == "running"

    @patch("db.client.get_supabase_client")
    def test_status_404_when_not_found(self, mock_get_client):
        """GET /solve/{id}/status returns 404 when scenario not found."""
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_eq = MagicMock()
        mock_select.eq.return_value = mock_eq
        mock_single = MagicMock()
        mock_eq.single.return_value = mock_single

        # Simulate Supabase raising when record not found
        mock_single.execute.side_effect = Exception("Row not found")

        response = client.get("/solve/nonexistent-id/status")

        assert response.status_code == 404


class TestResultsEndpoint:
    """Tests for GET /solve/{scenario_id}/results."""

    def test_results_404_when_not_in_cache(self):
        """GET /solve/{id}/results returns 404 when not in cache or DB."""
        # Clear the in-memory cache for this scenario
        from routes.solve import _results_cache
        _results_cache.pop("nonexistent-id", None)

        with patch("db.client.get_supabase_client") as mock_get_client:
            mock_client = MagicMock()
            mock_get_client.return_value = mock_client

            mock_table = MagicMock()
            mock_client.table.return_value = mock_table
            mock_select = MagicMock()
            mock_table.select.return_value = mock_select
            mock_eq = MagicMock()
            mock_select.eq.return_value = mock_eq

            mock_response = MagicMock()
            mock_response.data = []  # Empty — no results found
            mock_eq.execute.return_value = mock_response

            response = client.get("/solve/nonexistent-id/results")

            assert response.status_code == 404
            assert "No results found" in response.json()["detail"]

    def test_results_from_cache(self):
        """GET /solve/{id}/results returns cached results if available."""
        from routes.solve import _results_cache
        from models.output import OptimizationResult

        # Insert a result into the cache
        cached_result = OptimizationResult(
            scenario_id="cached-scenario",
            status="completed",
            total_capex=50000.0,
            total_savings_annual=8000.0,
            co2_reduction_percent=0.25,
        )
        _results_cache["cached-scenario"] = cached_result

        try:
            response = client.get("/solve/cached-scenario/results")

            assert response.status_code == 200
            data = response.json()
            assert data["scenario_id"] == "cached-scenario"
            assert data["status"] == "completed"
            assert data["total_capex"] == 50000.0
            assert data["co2_reduction_percent"] == 0.25
        finally:
            # Clean up
            _results_cache.pop("cached-scenario", None)
