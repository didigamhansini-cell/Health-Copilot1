from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserProfile, VitalRecord, Medication, User
from app.schemas import DoctorSummaryResponse
from app.services.triage import MEDICAL_DISCLAIMER
from app.routers.auth import get_current_user_obj

router = APIRouter(prefix="/api/summary", tags=["Doctor Visit Summary"])

@router.get("/doctor-report", response_model=DoctorSummaryResponse)
def generate_doctor_visit_report(user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """
    Compiles a structured health summary strictly for the authenticated user,
    aggregating their own vitals, medications, and discussion points.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    patient_name = profile.name if profile else user.name
    patient_age = profile.age if profile else 30
    allergies = profile.allergies if profile else "None documented"
    chronic_conditions = profile.chronic_conditions if profile else "None"

    # Active medications for this user
    meds = db.query(Medication).filter(Medication.user_id == user.id, Medication.active == True).all()
    med_list = [
        {"name": m.name, "dosage": m.dosage, "frequency": m.frequency, "purpose": m.purpose}
        for m in meds
    ]

    # Recent vitals for this user (last 7 entries)
    records = db.query(VitalRecord).filter(VitalRecord.user_id == user.id).order_by(VitalRecord.timestamp.desc()).limit(7).all()
    records = list(reversed(records))

    vitals_summary = {
        "record_count": len(records),
        "latest_systolic_bp": records[-1].systolic_bp if records else None,
        "latest_diastolic_bp": records[-1].diastolic_bp if records else None,
        "latest_heart_rate": records[-1].heart_rate if records else None,
        "latest_blood_glucose": records[-1].blood_glucose if records else None,
        "avg_systolic_bp": round(sum(r.systolic_bp for r in records if r.systolic_bp) / len(records), 1) if records else None,
        "avg_diastolic_bp": round(sum(r.diastolic_bp for r in records if r.diastolic_bp) / len(records), 1) if records else None,
        "avg_sleep_hours": round(sum(r.sleep_hours for r in records if r.sleep_hours) / len(records), 1) if records else None
    }

    # Anomalies
    anomalies = []
    if vitals_summary["avg_systolic_bp"] and vitals_summary["avg_systolic_bp"] >= 130:
        anomalies.append(f"7-day average systolic BP is elevated ({vitals_summary['avg_systolic_bp']} mmHg).")
    if vitals_summary["latest_blood_glucose"] and vitals_summary["latest_blood_glucose"] >= 105:
        anomalies.append(f"Latest fasting blood glucose was borderline high ({vitals_summary['latest_blood_glucose']} mg/dL).")
    if vitals_summary["avg_sleep_hours"] and vitals_summary["avg_sleep_hours"] < 6.5:
        anomalies.append(f"Short sleep duration noted (average {vitals_summary['avg_sleep_hours']} hours/night).")

    # Discussion points for doctor
    questions = [
        "Are my current blood pressure and fasting glucose trends within our individualized target goals?",
        "Should we adjust any medication dosages or dosing schedules based on this log?",
        "Are routine laboratory tests (e.g. Lipid panel, HbA1c, Metabolic panel) due this visit?",
        "What specific lifestyle modifications (aerobic exercise target, sodium limits) should I prioritize next?"
    ]

    return {
        "patient_name": patient_name,
        "patient_age": patient_age,
        "generated_at": datetime.now(timezone.utc).strftime("%B %d, %Y - %H:%M UTC"),
        "vital_signs_summary": vitals_summary,
        "active_medications": med_list,
        "known_allergies": allergies,
        "chronic_conditions": chronic_conditions,
        "recent_anomalies_or_concerns": anomalies,
        "questions_to_discuss": questions,
        "disclaimer": MEDICAL_DISCLAIMER
    }
