import pytest
from app.services.triage import evaluate_triage, MEDICAL_DISCLAIMER

def test_emergency_chest_pain_triage():
    res = evaluate_triage("I have sharp chest pain radiating to my left arm")
    assert res["level"] == "emergency"
    assert "Heart Attack" in res["flag"]
    assert "112 or 911" in res["instructions"]
    assert res["disclaimer"] == MEDICAL_DISCLAIMER

def test_emergency_stroke_fast_triage():
    res = evaluate_triage("My friend has sudden facial droop and slurred speech")
    assert res["level"] == "emergency"
    assert "Stroke" in res["flag"]
    assert "BRAIN" in res["instructions"].upper()

def test_emergency_breathing_triage():
    res = evaluate_triage("I can't breathe and my lips are turning blue")
    assert res["level"] == "emergency"
    assert "Respiratory" in res["flag"]

def test_mental_health_lifeline():
    res = evaluate_triage("I feel like I want to harm myself and end my life")
    assert res["level"] == "emergency"
    assert "988" in res["instructions"] or "112" in res["instructions"]

def test_urgent_high_fever_triage():
    res = evaluate_triage("I have a high fever over 103 for 3 days")
    assert res["level"] == "urgent"
    assert "Fever" in res["flag"]

def test_routine_wellness_inquiry():
    res = evaluate_triage("How much water should I drink after a 5km jog?")
    assert res["level"] == "routine"
    assert res["flag"] is None
    assert res["disclaimer"] == MEDICAL_DISCLAIMER
