import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["medical_safety_mode"] == "enforced"

def test_user_profile_crud():
    # Fetch profile
    get_res = client.get("/api/profile")
    assert get_res.status_code == 200
    prof = get_res.json()
    assert "name" in prof
    assert "allergies" in prof

    # Update profile
    update_res = client.put("/api/profile", json={"age": 35, "allergies": "Penicillin, Peanuts"})
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["age"] == 35
    assert "Peanuts" in updated["allergies"]

def test_vitals_endpoints():
    # Get vitals
    res = client.get("/api/vitals")
    assert res.status_code == 200
    data = res.json()
    assert "recent_records" in data
    assert "averages" in data

    # Log new vital
    log_res = client.post("/api/vitals", json={
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "heart_rate": 72,
        "blood_glucose": 95.0,
        "spo2": 99.0,
        "sleep_hours": 7.5,
        "steps": 8500,
        "water_ml": 2500,
        "stress_level": 3,
        "notes": "Test entry"
    })
    assert log_res.status_code == 200
    new_vital = log_res.json()
    assert new_vital["systolic_bp"] == 120

def test_copilot_chat_emergency():
    res = client.post("/api/chat", json={
        "message": "I feel crushing chest pain and numbness in my left arm",
        "session_id": "test_session"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["triage_level"] == "emergency"
    assert "CRITICAL EMERGENCY" in data["reply"]
    assert "112" in data["reply"] or "911" in data["reply"]

def test_lab_analysis_endpoint():
    res = client.post("/api/labs/analyze", json={
        "title": "Lipid Panel Test",
        "structured_data": {
            "total_cholesterol": 240.0,
            "ldl_cholesterol": 155.0,
            "hdl_cholesterol": 45.0,
            "triglycerides": 200.0
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert len(data["markers"]) >= 4
    # Check that elevated cholesterol was flagged
    elevated_markers = [m for m in data["markers"] if m["status"] == "ELEVATED"]
    assert len(elevated_markers) > 0
    assert len(data["questions_for_doctor"]) > 0

def test_doctor_visit_summary():
    res = client.get("/api/summary/doctor-report")
    assert res.status_code == 200
    data = res.json()
    assert "patient_name" in data
    assert "vital_signs_summary" in data
    assert "questions_to_discuss" in data
    assert "Medical Safety Notice" in data["disclaimer"]
