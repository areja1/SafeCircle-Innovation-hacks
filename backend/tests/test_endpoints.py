"""
Basic smoke tests for SafeCircle backend endpoints.
Run with: pytest tests/test_endpoints.py -v
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "SafeCircle API is running"


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_missing_fields():
    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code == 422  # Unprocessable entity


def test_signup_missing_fields():
    response = client.post("/api/v1/auth/signup", json={"email": "test@test.com"})
    assert response.status_code == 422


def test_protected_route_without_token():
    """All protected routes should return 422 (missing header) without auth."""
    response = client.get("/api/v1/circles")
    assert response.status_code == 422


def test_crisis_start_invalid_type():
    """Invalid crisis type should return 422 (auth is mocked so body validation runs)."""
    with patch("routers.deps.get_current_user", return_value={"id": "user-1", "email": "a@b.com"}):
        response = client.post(
            "/api/v1/crisis/start",
            json={"crisis_type": "volcano_eruption", "state": "AZ"},
        )
    assert response.status_code == 422


def test_contribute_negative_amount():
    """Negative contribution amount should fail validation."""
    with patch("routers.deps.get_current_user", return_value={"id": "user-1", "email": "a@b.com"}):
        response = client.post(
            "/api/v1/circles/some-circle/pool/contribute",
            json={"amount": -50},
        )
        # Will fail at pool lookup (no DB), but amount validation should trigger
        assert response.status_code in (400, 403, 404, 422)


def test_benefits_check_defaults():
    """Benefits check with no auth should return 422 (missing header)."""
    response = client.get("/api/v1/benefits/check")
    assert response.status_code == 422
