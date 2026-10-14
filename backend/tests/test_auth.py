import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_user_registration_and_login():
    email = "test_user_appointment@example.com"
    # Register
    reg_res = client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": email,
        "password": "securepassword123"
    })
    assert reg_res.status_code in [200, 400]

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": "securepassword123"
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "token" in data
    assert data["user"]["email"] == email

def test_login_invalid_credentials():
    login_res = client.post("/api/auth/login", json={
        "email": "nonexistent_email@example.com",
        "password": "wrongpassword"
    })
    assert login_res.status_code == 401
