"""Tests for routes.health — GET /health endpoint."""
from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


class TestHealthEndpoint:
    """Tests for the /health endpoint."""

    def test_health_returns_200(self):
        """GET /health returns HTTP 200."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_status_ok(self):
        """GET /health response includes status='ok'."""
        response = client.get("/health")
        data = response.json()
        assert data["status"] == "ok"

    def test_health_includes_version(self):
        """GET /health response includes a version field."""
        response = client.get("/health")
        data = response.json()
        assert "version" in data
        assert isinstance(data["version"], str)
        assert len(data["version"]) > 0

    def test_health_includes_service_name(self):
        """GET /health response includes service='optimizer'."""
        response = client.get("/health")
        data = response.json()
        assert data["service"] == "optimizer"

    def test_health_response_structure(self):
        """GET /health response has exactly the expected keys."""
        response = client.get("/health")
        data = response.json()
        expected_keys = {"status", "service", "version"}
        assert set(data.keys()) == expected_keys
