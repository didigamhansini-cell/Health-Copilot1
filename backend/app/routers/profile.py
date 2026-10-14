from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserProfile, User
from app.schemas import UserProfileResponse, UserProfileUpdate
from app.routers.auth import get_current_user_obj

router = APIRouter(prefix="/api/profile", tags=["User Profile"])

def get_or_create_user_profile(user: User, db: Session) -> UserProfile:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(
            user_id=user.id,
            name=user.name,
            age=30,
            gender="Not specified",
            blood_type="O+",
            height_cm=170.0,
            weight_kg=68.0,
            allergies="None documented",
            chronic_conditions="None",
            emergency_contact_name="Family Member",
            emergency_contact_phone="112"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.get("", response_model=UserProfileResponse)
def get_profile(user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Retrieve personal health profile for the authenticated user."""
    return get_or_create_user_profile(user, db)

@router.put("", response_model=UserProfileResponse)
def update_profile(updates: UserProfileUpdate, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Update personal health profile details for the authenticated user."""
    profile = get_or_create_user_profile(user, db)
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
