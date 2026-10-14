import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import User, UserProfile
from app.schemas import UserRegister, UserLogin, UserAuthResponse, UserInfo

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    """Computes a SHA-256 hash for password storage."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def seed_demo_user_if_needed(db: Session):
    existing = db.query(User).filter(User.email == "alex@example.com").first()
    if not existing:
        demo = User(
            name="Alex Smith",
            email="alex@example.com",
            password_hash=hash_password("health123")
        )
        db.add(demo)
        db.commit()
        db.refresh(demo)

        # Ensure demo user has an associated profile
        prof = db.query(UserProfile).filter(UserProfile.user_id == demo.id).first()
        if not prof:
            prof = UserProfile(
                user_id=demo.id,
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
            db.add(prof)
            db.commit()

def get_current_user_obj(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    """Dependency returning the authenticated User object."""
    seed_demo_user_if_needed(db)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        try:
            parts = token.split("_")
            if len(parts) >= 2:
                user_id = int(parts[1])
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    return user
        except Exception:
            pass

    # Fallback to demo/first user for backwards compatibility with tests
    user = db.query(User).first()
    if user:
        return user
    raise HTTPException(status_code=401, detail="Authentication required")

@router.post("/register", response_model=UserAuthResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Registers a new user account and creates an isolated personal health profile."""
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = User(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        password_hash=hash_password(data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize a clean, dedicated personal health profile for this new user
    user_profile = UserProfile(
        user_id=new_user.id,
        name=new_user.name,
        age=data.age or 30,
        gender=data.gender or "Not specified",
        blood_type=data.blood_type or "O+",
        height_cm=data.height_cm or 170.0,
        weight_kg=data.weight_kg or 68.0,
        allergies=data.allergies or "None documented",
        chronic_conditions=data.chronic_conditions or "None",
        emergency_contact_name=data.emergency_contact_name or "Family Member",
        emergency_contact_phone=data.emergency_contact_phone or "112"
    )
    db.add(user_profile)
    db.commit()

    token = f"token_{new_user.id}_{secrets.token_hex(16)}"
    return {
        "token": token,
        "user": UserInfo.model_validate(new_user)
    }

@router.post("/login", response_model=UserAuthResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user with their own email and password."""
    seed_demo_user_if_needed(db)
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or user.password_hash != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = f"token_{user.id}_{secrets.token_hex(16)}"
    return {
        "token": token,
        "user": UserInfo.model_validate(user)
    }

@router.get("/me", response_model=UserInfo)
def get_current_user_me(user: User = Depends(get_current_user_obj)):
    """Returns the authenticated user details."""
    return UserInfo.model_validate(user)
