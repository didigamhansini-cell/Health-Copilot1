from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import UserProfile
from app.routers import profile, copilot, vitals, labs, medications, summary, auth, appointments

# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Seed default profile if absent
def initialize_database():
    db = SessionLocal()
    try:
        existing = db.query(UserProfile).first()
        if not existing:
            default_profile = UserProfile(
                name="Alex Smith",
                age=34,
                gender="Female",
                blood_type="O+",
                height_cm=168.0,
                weight_kg=65.0,
                allergies="Penicillin",
                chronic_conditions="Mild Hypertension",
                emergency_contact_name="Sarah Smith",
                emergency_contact_phone="112"
            )
            db.add(default_profile)
            db.commit()
    finally:
        db.close()

initialize_database()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Safety-first, intelligent AI Personal Health Copilot and biomarker management API."
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register feature routers
app.include_router(auth.router)
app.include_router(appointments.router)
app.include_router(profile.router)
app.include_router(copilot.router)
app.include_router(vitals.router)
app.include_router(labs.router)
app.include_router(medications.router)
app.include_router(summary.router)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "medical_safety_mode": "enforced"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
