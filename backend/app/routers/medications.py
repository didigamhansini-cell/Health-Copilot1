from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Medication, User
from app.schemas import (
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
    InteractionCheckResponse,
    DrugInteractionItem
)
from app.routers.auth import get_current_user_obj

router = APIRouter(prefix="/api/medications", tags=["Medications & Supplements"])

KNOWN_INTERACTIONS = [
    {
        "pair": ["aspirin", "ibuprofen"],
        "severity": "high",
        "description": "Concurrent use of Aspirin and Ibuprofen significantly elevates gastrointestinal bleeding risk and may reduce cardioprotective antiplatelet effects of aspirin.",
        "recommendation": "Consult your physician or pharmacist for an alternative pain/anti-inflammatory strategy like Acetaminophen/Paracetamol."
    },
    {
        "pair": ["warfarin", "aspirin"],
        "severity": "high",
        "description": "Dual blood-thinning effects dramatically increase spontaneous hemorrhage and bruising risks.",
        "recommendation": "Strict clinical monitoring of INR and doctor supervision required."
    },
    {
        "pair": ["atorvastatin", "grapefruit"],
        "severity": "moderate",
        "description": "Grapefruit compounds inhibit CYP3A4 liver enzymes, multiplying statin concentration in blood and increasing muscle pain / rhabdomyolysis risk.",
        "recommendation": "Avoid grapefruit and grapefruit juice while on Atorvastatin or Simvastatin."
    },
    {
        "pair": ["lisinopril", "potassium"],
        "severity": "moderate",
        "description": "ACE inhibitors conserve potassium in the body. Concomitant potassium supplements can lead to hyperkalemia (dangerous irregular heartbeats).",
        "recommendation": "Avoid high-dose potassium supplements or salt substitutes unless prescribed by your cardiologist."
    },
    {
        "pair": ["metformin", "alcohol"],
        "severity": "high",
        "description": "Heavy alcohol intake while on Metformin markedly increases the danger of lactic acidosis, a rare but life-threatening complication.",
        "recommendation": "Avoid excessive or binge alcohol consumption."
    },
    {
        "pair": ["levothyroxine", "calcium"],
        "severity": "moderate",
        "description": "Calcium supplements bind to thyroid hormone, drastically reducing its gut absorption.",
        "recommendation": "Separate taking Levothyroxine and Calcium supplements by at least 4 hours."
    }
]

def seed_demo_medications_if_needed(user_id: int, db: Session):
    count = db.query(Medication).filter(Medication.user_id == user_id).count()
    if count == 0:
        samples = [
            Medication(
                user_id=user_id,
                name="Amlodipine",
                dosage="5mg",
                frequency="Once daily",
                schedule_time="08:00 AM",
                purpose="Blood pressure control",
                instructions="Take with a glass of water each morning",
                active=True,
                last_taken_at=datetime.now(timezone.utc)
            ),
            Medication(
                user_id=user_id,
                name="Vitamin D3",
                dosage="2000 IU",
                frequency="Once daily",
                schedule_time="09:00 AM",
                purpose="Bone & immune support",
                instructions="Take with meal containing dietary fat for optimal absorption",
                active=True,
                last_taken_at=datetime.now(timezone.utc)
            ),
            Medication(
                user_id=user_id,
                name="Omega-3 Fish Oil",
                dosage="1000mg",
                frequency="Once daily",
                schedule_time="01:00 PM",
                purpose="Cardiovascular & lipid support",
                instructions="Take after lunch",
                active=True
            )
        ]
        db.add_all(samples)
        db.commit()

@router.get("", response_model=List[MedicationResponse])
def get_medications(user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Retrieve all logged medications and supplements for the authenticated user."""
    if user.email == "alex@example.com":
        seed_demo_medications_if_needed(user.id, db)
    return db.query(Medication).filter(Medication.user_id == user.id).order_by(Medication.active.desc(), Medication.name.asc()).all()

@router.post("", response_model=MedicationResponse)
def add_medication(data: MedicationCreate, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Add a new medication or supplement for the authenticated user."""
    med = Medication(
        user_id=user.id,
        name=data.name,
        dosage=data.dosage,
        frequency=data.frequency,
        schedule_time=data.schedule_time,
        purpose=data.purpose,
        instructions=data.instructions,
        active=data.active,
        created_at=datetime.now(timezone.utc)
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med

@router.put("/{med_id}", response_model=MedicationResponse)
def update_medication(med_id: int, updates: MedicationUpdate, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Update details or status of a medication belonging to the authenticated user."""
    med = db.query(Medication).filter(Medication.id == med_id, Medication.user_id == user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found or unauthorized")

    for k, v in updates.model_dump(exclude_unset=True).items():
        setattr(med, k, v)

    db.commit()
    db.refresh(med)
    return med

@router.post("/{med_id}/take", response_model=MedicationResponse)
def log_dose_taken(med_id: int, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Marks a medication as taken for today for the authenticated user."""
    med = db.query(Medication).filter(Medication.id == med_id, Medication.user_id == user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found or unauthorized")

    med.last_taken_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(med)
    return med

@router.delete("/{med_id}")
def delete_medication(med_id: int, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Deletes a medication entry belonging to the authenticated user."""
    med = db.query(Medication).filter(Medication.id == med_id, Medication.user_id == user.id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found or unauthorized")

    db.delete(med)
    db.commit()
    return {"message": "Medication deleted"}

@router.get("/interactions/check", response_model=InteractionCheckResponse)
def check_interactions(user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Cross-references active medications for the authenticated user against interaction rules."""
    active_meds = db.query(Medication).filter(Medication.user_id == user.id, Medication.active == True).all()
    active_names = [m.name.lower() for m in active_meds]

    flagged_interactions = []
    for rule in KNOWN_INTERACTIONS:
        p1, p2 = rule["pair"][0], rule["pair"][1]
        has_p1 = any(p1 in name for name in active_names)
        has_p2 = any(p2 in name for name in active_names)
        if has_p1 and has_p2:
            flagged_interactions.append(
                DrugInteractionItem(
                    severity=rule["severity"],
                    medications_involved=[p1.capitalize(), p2.capitalize()],
                    description=rule["description"],
                    recommendation=rule["recommendation"]
                )
            )

    return {
        "total_active": len(active_meds),
        "has_interactions": len(flagged_interactions) > 0,
        "interactions": flagged_interactions
    }
