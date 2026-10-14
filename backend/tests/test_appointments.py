import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_doctors_list():
    res = client.get("/api/appointments/doctors")
    assert res.status_code == 200
    doctors = res.json()
    assert len(doctors) >= 4
    assert any(d["specialty"].startswith("Cardiology") for d in doctors)

def test_book_appointment_token_generation():
    book_res = client.post("/api/appointments/book", json={
        "patient_name": "Test Patient",
        "doctor_name": "Dr. Sarah Jenkins, MD",
        "specialty": "Cardiology & Vascular Health",
        "appointment_date": "Next Monday",
        "time_slot": "09:30 AM",
        "reason": "Chest tightness checkup"
    })
    assert book_res.status_code == 200
    apt = book_res.json()
    # Verify Token Number is generated
    assert "token_number" in apt
    assert apt["token_number"].startswith("TK-")
    assert apt["queue_position"] >= 1
    assert "hospital_room" in apt
    assert apt["status"] == "Confirmed"

def test_list_appointments():
    res = client.get("/api/appointments")
    assert res.status_code == 200
    apts = res.json()
    assert len(apts) >= 1
    assert "token_number" in apts[0]
