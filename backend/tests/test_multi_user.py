import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_multi_user_strict_isolation():
    # 1. Register User Alpha
    res_a = client.post("/api/auth/register", json={
        "name": "Alpha Patient",
        "email": "alpha@healthtest.com",
        "password": "alphapassword123"
    })
    assert res_a.status_code in [200, 400]
    token_a = res_a.json()["token"] if res_a.status_code == 200 else client.post("/api/auth/login", json={
        "email": "alpha@healthtest.com",
        "password": "alphapassword123"
    }).json()["token"]

    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User Alpha logs a vital
    vital_a = client.post("/api/vitals", headers=headers_a, json={
        "systolic_bp": 118,
        "diastolic_bp": 76,
        "heart_rate": 68
    })
    assert vital_a.status_code == 200

    # User Alpha books an appointment
    apt_a = client.post("/api/appointments/book", headers=headers_a, json={
        "doctor_name": "Dr. Sarah Jenkins, MD",
        "specialty": "Cardiology",
        "appointment_date": "2026-10-20",
        "time_slot": "10:00 AM",
        "reason": "Alpha annual check"
    })
    assert apt_a.status_code == 200
    token_num_a = apt_a.json()["token_number"]

    # 2. Register User Beta
    res_b = client.post("/api/auth/register", json={
        "name": "Beta Patient",
        "email": "beta@healthtest.com",
        "password": "betapassword123"
    })
    assert res_b.status_code in [200, 400]
    token_b = res_b.json()["token"] if res_b.status_code == 200 else client.post("/api/auth/login", json={
        "email": "beta@healthtest.com",
        "password": "betapassword123"
    }).json()["token"]

    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Verify Beta has completely isolated data
    # Profile name should be Beta Patient
    prof_b = client.get("/api/profile", headers=headers_b).json()
    assert prof_b["name"] == "Beta Patient"

    # Beta's vitals should have 0 records (Alpha's vitals not visible)
    vitals_b = client.get("/api/vitals", headers=headers_b).json()
    assert len(vitals_b["recent_records"]) == 0

    # Beta's appointments should have 0 records (Alpha's token not visible)
    apts_b = client.get("/api/appointments", headers=headers_b).json()
    assert len(apts_b) == 0

    # 4. Beta books their own appointment
    apt_b = client.post("/api/appointments/book", headers=headers_b, json={
        "doctor_name": "Dr. Rajiv Sharma, MD",
        "specialty": "General Medicine",
        "appointment_date": "2026-10-22",
        "time_slot": "02:00 PM",
        "reason": "Beta consultation"
    })
    assert apt_b.status_code == 200
    token_num_b = apt_b.json()["token_number"]
    assert token_num_b != token_num_a

    # 5. Verify Alpha still only sees Alpha's appointments
    apts_a_check = client.get("/api/appointments", headers=headers_a).json()
    alpha_tokens = [a["token_number"] for a in apts_a_check]
    assert token_num_a in alpha_tokens
    assert token_num_b not in alpha_tokens
