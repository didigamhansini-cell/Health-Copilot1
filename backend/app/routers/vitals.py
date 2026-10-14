from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import VitalRecord, User
from app.schemas import VitalRecordCreate, VitalRecordResponse, VitalsTrendsResponse
from app.routers.auth import get_current_user_obj

router = APIRouter(prefix="/api/vitals", tags=["Vitals Tracking"])

def seed_demo_vitals_if_needed(user_id: int, db: Session):
    count = db.query(VitalRecord).filter(VitalRecord.user_id == user_id).count()
    if count == 0:
        base_time = datetime.now(timezone.utc) - timedelta(days=6)
        samples = [
            VitalRecord(
                user_id=user_id,
                timestamp=base_time + timedelta(days=0),
                systolic_bp=128, diastolic_bp=82, heart_rate=72, blood_glucose=94.0,
                spo2=98.0, sleep_hours=7.2, steps=8400, water_ml=2200, stress_level=4,
                notes="Morning check after breakfast"
            ),
            VitalRecord(
                user_id=user_id,
                timestamp=base_time + timedelta(days=1),
                systolic_bp=124, diastolic_bp=80, heart_rate=70, blood_glucose=92.0,
                spo2=99.0, sleep_hours=7.8, steps=9100, water_ml=2400, stress_level=3,
                notes="Good rested morning"
            ),
            VitalRecord(
                user_id=user_id,
                timestamp=base_time + timedelta(days=2),
                systolic_bp=134, diastolic_bp=86, heart_rate=78, blood_glucose=108.0,
                spo2=98.0, sleep_hours=5.5, steps=5200, water_ml=1600, stress_level=7,
                notes="High stress workday, less sleep"
            ),
            VitalRecord(
                user_id=user_id,
                timestamp=base_time + timedelta(days=3),
                systolic_bp=130, diastolic_bp=84, heart_rate=74, blood_glucose=99.0,
                spo2=98.0, sleep_hours=6.8, steps=7800, water_ml=2000, stress_level=5,
                notes="Evening walk completed"
            ),
            VitalRecord(
                user_id=user_id,
                timestamp=base_time + timedelta(days=4),
                systolic_bp=122, diastolic_bp=78, heart_rate=68, blood_glucose=91.0,
                spo2=99.0, sleep_hours=8.0, steps=10200, water_ml=2500, stress_level=2,
                notes="Weekend recovery"
            ),
            VitalRecord(
                user_id=user_id,
                timestamp=base_time + timedelta(days=5),
                systolic_bp=126, diastolic_bp=81, heart_rate=71, blood_glucose=95.0,
                spo2=98.0, sleep_hours=7.4, steps=8600, water_ml=2100, stress_level=4,
                notes="Normal routine check"
            )
        ]
        db.add_all(samples)
        db.commit()

@router.get("", response_model=VitalsTrendsResponse)
def get_vitals_summary(user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Retrieve historical vitals, computed averages, and detected anomaly flags strictly for authenticated user."""
    # Seed demo baseline only for the demo account
    if user.email == "alex@example.com":
        seed_demo_vitals_if_needed(user.id, db)

    records = db.query(VitalRecord).filter(VitalRecord.user_id == user.id).order_by(VitalRecord.timestamp.asc()).all()

    averages = {
        "systolic_bp": None,
        "diastolic_bp": None,
        "heart_rate": None,
        "blood_glucose": None,
        "spo2": None,
        "sleep_hours": None,
        "steps": None,
        "water_ml": None,
        "stress_level": None
    }
    status_flags = []

    if records:
        systolics = [r.systolic_bp for r in records if r.systolic_bp is not None]
        diastolics = [r.diastolic_bp for r in records if r.diastolic_bp is not None]
        hrs = [r.heart_rate for r in records if r.heart_rate is not None]
        glucoses = [r.blood_glucose for r in records if r.blood_glucose is not None]
        spo2s = [r.spo2 for r in records if r.spo2 is not None]
        sleeps = [r.sleep_hours for r in records if r.sleep_hours is not None]
        steps_list = [r.steps for r in records if r.steps is not None]
        waters = [r.water_ml for r in records if r.water_ml is not None]
        stresses = [r.stress_level for r in records if r.stress_level is not None]

        if systolics:
            averages["systolic_bp"] = round(sum(systolics) / len(systolics), 1)
        if diastolics:
            averages["diastolic_bp"] = round(sum(diastolics) / len(diastolics), 1)
        if hrs:
            averages["heart_rate"] = round(sum(hrs) / len(hrs), 1)
        if glucoses:
            averages["blood_glucose"] = round(sum(glucoses) / len(glucoses), 1)
        if spo2s:
            averages["spo2"] = round(sum(spo2s) / len(spo2s), 1)
        if sleeps:
            averages["sleep_hours"] = round(sum(sleeps) / len(sleeps), 1)
        if steps_list:
            averages["steps"] = round(sum(steps_list) / len(steps_list), 0)
        if waters:
            averages["water_ml"] = round(sum(waters) / len(waters), 0)
        if stresses:
            averages["stress_level"] = round(sum(stresses) / len(stresses), 1)

        latest = records[-1]
        if latest.systolic_bp and latest.systolic_bp >= 135:
            status_flags.append(f"Elevated Blood Pressure: Latest reading was {latest.systolic_bp}/{latest.diastolic_bp} mmHg.")
        if latest.blood_glucose and latest.blood_glucose >= 105:
            status_flags.append(f"Borderline Fasting Glucose: Latest reading was {latest.blood_glucose} mg/dL.")
        if latest.sleep_hours and latest.sleep_hours < 6.0:
            status_flags.append(f"Sleep Deficit: Logged {latest.sleep_hours} hrs of sleep recently.")
        if latest.spo2 and latest.spo2 < 95.0:
            status_flags.append(f"Low SpO2 Alert: Oxygen saturation recorded at {latest.spo2}%.")

    return {
        "recent_records": records,
        "averages": averages,
        "status_flags": status_flags
    }

@router.post("", response_model=VitalRecordResponse)
def log_vital_record(data: VitalRecordCreate, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Log a new vitals entry for the authenticated user."""
    record = VitalRecord(
        user_id=user.id,
        timestamp=datetime.now(timezone.utc),
        systolic_bp=data.systolic_bp,
        diastolic_bp=data.diastolic_bp,
        heart_rate=data.heart_rate,
        blood_glucose=data.blood_glucose,
        spo2=data.spo2,
        sleep_hours=data.sleep_hours,
        steps=data.steps,
        water_ml=data.water_ml,
        stress_level=data.stress_level,
        notes=data.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{record_id}")
def delete_vital_record(record_id: int, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Delete a specific vitals record belonging to the authenticated user."""
    rec = db.query(VitalRecord).filter(VitalRecord.id == record_id, VitalRecord.user_id == user.id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Vital record not found or unauthorized")
    db.delete(rec)
    db.commit()
    return {"message": "Record deleted successfully"}
