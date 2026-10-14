from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Appointment, User
from app.schemas import DoctorProfile, AppointmentCreate, AppointmentResponse
from app.routers.auth import get_current_user_obj

router = APIRouter(prefix="/api/appointments", tags=["Doctor Appointments & Token Generation"])

DOCTORS_DATABASE: List[DoctorProfile] = [
    DoctorProfile(
        id="doc_1",
        name="Dr. Sarah Jenkins, MD",
        specialty="Cardiology & Vascular Health",
        qualification="MD (Cardiology), FACC",
        experience_years=14,
        hospital_room="Room 302 (Cardio Wing)",
        rating=4.9,
        available_slots=["09:30 AM", "11:00 AM", "02:30 PM", "04:00 PM"]
    ),
    DoctorProfile(
        id="doc_2",
        name="Dr. Rajiv Sharma, MD",
        specialty="General Medicine & Primary Care",
        qualification="MBBS, MD (Internal Medicine)",
        experience_years=18,
        hospital_room="Room 105 (OPD Block A)",
        rating=4.8,
        available_slots=["10:00 AM", "11:30 AM", "01:00 PM", "03:30 PM"]
    ),
    DoctorProfile(
        id="doc_3",
        name="Dr. Elena Rostova, PhD",
        specialty="Endocrinology & Diabetes",
        qualification="MD, PhD (Metabolic Diseases)",
        experience_years=12,
        hospital_room="Room 214 (Endocrine Center)",
        rating=4.9,
        available_slots=["09:00 AM", "10:30 AM", "02:00 PM", "04:30 PM"]
    ),
    DoctorProfile(
        id="doc_4",
        name="Dr. Marcus Vance, MD",
        specialty="Pulmonology & Respiratory Care",
        qualification="MD (Chest & Critical Care)",
        experience_years=16,
        hospital_room="Room 408 (Pulmonary Suite)",
        rating=4.7,
        available_slots=["11:00 AM", "01:30 PM", "03:00 PM"]
    ),
    DoctorProfile(
        id="doc_5",
        name="Dr. Priya Nair, MD",
        specialty="Neurology & Cognitive Health",
        qualification="DM (Neurology), FAAN",
        experience_years=15,
        hospital_room="Room 501 (Neuro Sciences)",
        rating=4.9,
        available_slots=["10:30 AM", "12:00 PM", "03:30 PM", "05:00 PM"]
    )
]

@router.get("/doctors", response_model=List[DoctorProfile])
def get_doctors():
    """Retrieve list of available specialist doctors."""
    return DOCTORS_DATABASE

@router.get("", response_model=List[AppointmentResponse])
def get_user_appointments(user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Retrieve all booked appointments and tokens strictly for the authenticated user."""
    return db.query(Appointment).filter(Appointment.user_id == user.id).order_by(Appointment.created_at.desc()).all()

@router.post("/book", response_model=AppointmentResponse)
def book_appointment(data: AppointmentCreate, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """
    Books an appointment with the selected doctor and generates a unique Token Number,
    room assignment, and queue position for the authenticated user.
    """
    doctor = next((d for d in DOCTORS_DATABASE if d.name == data.doctor_name), None)
    room = doctor.hospital_room if doctor else "Room 101"

    existing_count = db.query(Appointment).count()
    token_num = f"TK-{100 + existing_count + 1}"
    queue_pos = existing_count + 1

    appointment = Appointment(
        user_id=user.id,
        patient_name=data.patient_name or user.name,
        doctor_name=data.doctor_name,
        specialty=data.specialty,
        hospital_room=room,
        appointment_date=data.appointment_date,
        time_slot=data.time_slot,
        token_number=token_num,
        queue_position=queue_pos,
        reason=data.reason or "Clinical consultation",
        status="Confirmed"
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.delete("/{appointment_id}")
def cancel_appointment(appointment_id: int, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Cancels a booked appointment belonging to the authenticated user."""
    apt = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.user_id == user.id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found or not authorized")
    db.delete(apt)
    db.commit()
    return {"message": "Appointment cancelled successfully"}
