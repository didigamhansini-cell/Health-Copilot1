from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True, nullable=True)
    name = Column(String(100), default="User")
    age = Column(Integer, default=32)
    gender = Column(String(50), default="Not specified")
    blood_type = Column(String(10), default="O+")
    height_cm = Column(Float, default=175.0)
    weight_kg = Column(Float, default=70.0)
    allergies = Column(Text, default="None documented")
    chronic_conditions = Column(Text, default="None")
    emergency_contact_name = Column(String(100), default="Family Member")
    emergency_contact_phone = Column(String(50), default="112")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class VitalRecord(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    systolic_bp = Column(Integer, nullable=True)     # mmHg (e.g. 120)
    diastolic_bp = Column(Integer, nullable=True)    # mmHg (e.g. 80)
    heart_rate = Column(Integer, nullable=True)      # bpm (e.g. 72)
    blood_glucose = Column(Float, nullable=True)     # mg/dL (e.g. 95.0)
    spo2 = Column(Float, nullable=True)              # % (e.g. 98.0)
    sleep_hours = Column(Float, nullable=True)       # hours (e.g. 7.5)
    steps = Column(Integer, nullable=True)           # count (e.g. 8500)
    water_ml = Column(Integer, nullable=True)        # ml (e.g. 2000)
    stress_level = Column(Integer, nullable=True)    # 1 to 10
    notes = Column(Text, nullable=True)


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    name = Column(String(120), nullable=False)
    dosage = Column(String(80), default="10mg")
    frequency = Column(String(80), default="Once daily")
    schedule_time = Column(String(50), default="08:00 AM")
    purpose = Column(String(200), default="General wellness")
    instructions = Column(Text, default="Take after food with water")
    active = Column(Boolean, default=True)
    last_taken_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    session_id = Column(String(64), default="default", index=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utc_now)
    triage_level = Column(String(20), default="routine")  # "emergency", "urgent", "routine"
    triage_flag = Column(String(100), nullable=True)


class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    title = Column(String(150), nullable=False)
    test_date = Column(String(50), default="Recent")
    panel_type = Column(String(100), default="General Panel")
    notes = Column(Text, nullable=True)
    results_json = Column(Text, nullable=False)  # JSON-encoded parsed biomarkers
    created_at = Column(DateTime, default=utc_now)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=utc_now)


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    patient_name = Column(String(100), default="Alex Smith")
    doctor_name = Column(String(120), nullable=False)
    specialty = Column(String(100), nullable=False)
    hospital_room = Column(String(50), default="Room 204")
    appointment_date = Column(String(50), nullable=False)
    time_slot = Column(String(50), nullable=False)
    token_number = Column(String(50), nullable=False, index=True)
    queue_position = Column(Integer, default=1)
    reason = Column(Text, default="Routine consultation")
    status = Column(String(50), default="Confirmed")
    created_at = Column(DateTime, default=utc_now)
