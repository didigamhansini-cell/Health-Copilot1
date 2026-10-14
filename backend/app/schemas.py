from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# ----------------- User Profile -----------------
class UserProfileBase(BaseModel):
    name: str = "Alex Smith"
    age: int = 32
    gender: str = "Not specified"
    blood_type: str = "O+"
    height_cm: float = 175.0
    weight_kg: float = 70.0
    allergies: str = "None documented"
    chronic_conditions: str = "None"
    emergency_contact_name: str = "Family Member"
    emergency_contact_phone: str = "112"

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class UserProfileResponse(UserProfileBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------- Vitals -----------------
class VitalRecordCreate(BaseModel):
    systolic_bp: Optional[int] = Field(None, ge=50, le=260, description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: Optional[int] = Field(None, ge=30, le=160, description="Diastolic Blood Pressure (mmHg)")
    heart_rate: Optional[int] = Field(None, ge=30, le=250, description="Resting Heart Rate (bpm)")
    blood_glucose: Optional[float] = Field(None, ge=20, le=600, description="Fasting/Random Glucose (mg/dL)")
    spo2: Optional[float] = Field(None, ge=50, le=100, description="Oxygen Saturation (%)")
    sleep_hours: Optional[float] = Field(None, ge=0, le=24, description="Sleep Duration (hours)")
    steps: Optional[int] = Field(None, ge=0, le=100000, description="Step Count")
    water_ml: Optional[int] = Field(None, ge=0, le=10000, description="Water Intake (ml)")
    stress_level: Optional[int] = Field(None, ge=1, le=10, description="Self-reported stress (1-10)")
    notes: Optional[str] = None

class VitalRecordResponse(VitalRecordCreate):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class VitalsTrendsResponse(BaseModel):
    recent_records: List[VitalRecordResponse]
    averages: Dict[str, Optional[float]]
    status_flags: List[str]


# ----------------- Medications -----------------
class MedicationCreate(BaseModel):
    name: str
    dosage: str = "10mg"
    frequency: str = "Once daily"
    schedule_time: str = "08:00 AM"
    purpose: str = "General wellness"
    instructions: str = "Take with water after food"
    active: bool = True

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    schedule_time: Optional[str] = None
    purpose: Optional[str] = None
    instructions: Optional[str] = None
    active: Optional[bool] = None

class MedicationResponse(MedicationCreate):
    id: int
    last_taken_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DrugInteractionItem(BaseModel):
    severity: str  # "high", "moderate", "advisory"
    medications_involved: List[str]
    description: str
    recommendation: str

class InteractionCheckResponse(BaseModel):
    total_active: int
    has_interactions: bool
    interactions: List[DrugInteractionItem]


# ----------------- Lab Analysis -----------------
class BiomarkerResult(BaseModel):
    name: str
    value: float
    unit: str
    reference_range: str
    status: str  # "NORMAL", "LOW", "ELEVATED", "CRITICAL"
    explanation: str

class LabAnalyzeRequest(BaseModel):
    title: str = "Recent Lab Panel"
    test_date: Optional[str] = "Today"
    panel_type: str = "Comprehensive Metabolic / Lipid Panel"
    raw_text: Optional[str] = None
    structured_data: Optional[Dict[str, float]] = None

class LabReportResponse(BaseModel):
    id: Optional[int] = None
    title: str
    test_date: str
    panel_type: str
    markers: List[BiomarkerResult]
    summary_insight: str
    questions_for_doctor: List[str]
    created_at: Optional[datetime] = None


# ----------------- Copilot Chat -----------------
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    api_key_override: Optional[str] = None
    provider: Optional[str] = None  # "auto", "gemini", "openai", "offline"
    language: Optional[str] = "en"  # "en", "hi", "es", "fr", "de", "zh"

class ChatResponse(BaseModel):
    reply: str
    triage_level: str  # "emergency", "urgent", "routine"
    triage_flag: Optional[str] = None
    disclaimer: str
    suggested_followups: List[str]
    timestamp: datetime

class ChatMessageItem(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime
    triage_level: str
    triage_flag: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------- Doctor Summary -----------------
class DoctorSummaryResponse(BaseModel):
    patient_name: str
    patient_age: int
    generated_at: str
    vital_signs_summary: Dict[str, Any]
    active_medications: List[Dict[str, str]]
    known_allergies: str
    chronic_conditions: str
    recent_anomalies_or_concerns: List[str]
    questions_to_discuss: List[str]
    disclaimer: str


# ----------------- Authentication -----------------
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    age: Optional[int] = 30
    gender: Optional[str] = "Not specified"
    blood_type: Optional[str] = "O+"
    height_cm: Optional[float] = 170.0
    weight_kg: Optional[float] = 68.0
    allergies: Optional[str] = "None documented"
    chronic_conditions: Optional[str] = "None"
    emergency_contact_name: Optional[str] = "Family Member"
    emergency_contact_phone: Optional[str] = "112"

class UserLogin(BaseModel):
    email: str
    password: str

class UserInfo(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)

class UserAuthResponse(BaseModel):
    token: str
    user: UserInfo


# ----------------- Doctor Appointments -----------------
class DoctorProfile(BaseModel):
    id: str
    name: str
    specialty: str
    qualification: str
    experience_years: int
    hospital_room: str
    rating: float
    available_slots: List[str]

class AppointmentCreate(BaseModel):
    patient_name: Optional[str] = "Alex Smith"
    doctor_name: str
    specialty: str
    appointment_date: str
    time_slot: str
    reason: Optional[str] = "Routine consultation"

class AppointmentResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    patient_name: str
    doctor_name: str
    specialty: str
    hospital_room: str
    appointment_date: str
    time_slot: str
    token_number: str
    queue_position: int
    reason: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
