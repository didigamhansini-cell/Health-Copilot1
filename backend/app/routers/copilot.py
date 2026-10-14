from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ChatMessage, UserProfile, User
from app.schemas import ChatRequest, ChatResponse, ChatMessageItem
from app.services.ai_service import process_chat_message
from app.routers.auth import get_current_user_obj

router = APIRouter(prefix="/api/chat", tags=["AI Copilot Chat"])

@router.get("/quick-prompts")
def get_quick_prompts():
    """Returns curated clinical & wellness sample prompts to help users get started quickly."""
    return [
        {"category": "Symptom Check", "prompt": "I've had a dull tension headache and eye strain for the past 2 days. What should I observe?"},
        {"category": "Vital Guidance", "prompt": "My blood pressure reading was 134/86 mmHg this morning. What does this mean?"},
        {"category": "Lab Inquiry", "prompt": "Can you explain what an elevated HbA1c of 5.9% means for my metabolic health?"},
        {"category": "Lifestyle & Sleep", "prompt": "I have trouble falling asleep before 1 AM and feel exhausted. What sleep hygiene routine works?"},
        {"category": "Emergency Safety Check", "prompt": "I have sudden severe chest tightness and left arm pain."}
    ]

@router.post("", response_model=ChatResponse)
async def chat_with_copilot(req: ChatRequest, user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """
    Processes user message, executes triage assessment, generates clinical guidance,
    and records conversation history strictly for the authenticated user.
    """
    # Fetch user's dedicated profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    profile_dict = None
    if profile:
        profile_dict = {
            "name": profile.name,
            "age": profile.age,
            "gender": profile.gender,
            "chronic_conditions": profile.chronic_conditions,
            "allergies": profile.allergies
        }
    else:
        profile_dict = {
            "name": user.name,
            "age": 30,
            "gender": "Not specified",
            "chronic_conditions": "None",
            "allergies": "None documented"
        }

    # Save user message
    user_msg_db = ChatMessage(
        user_id=user.id,
        session_id=req.session_id,
        role="user",
        content=req.message,
        triage_level="routine"
    )
    db.add(user_msg_db)
    db.commit()

    # Process AI reasoning + Triage
    response_data = await process_chat_message(
        user_message=req.message,
        user_profile=profile_dict,
        api_key_override=req.api_key_override,
        provider=req.provider,
        language=req.language or "en"
    )

    # Save assistant reply
    asst_msg_db = ChatMessage(
        user_id=user.id,
        session_id=req.session_id,
        role="assistant",
        content=response_data["reply"],
        triage_level=response_data["triage_level"],
        triage_flag=response_data["triage_flag"]
    )
    db.add(asst_msg_db)
    db.commit()

    return ChatResponse(**response_data)

@router.get("/history", response_model=List[ChatMessageItem])
def get_chat_history(session_id: str = "default", user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Retrieve chat history strictly for the authenticated user."""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == user.id,
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.timestamp.asc()).all()
    return messages

@router.delete("/history")
def clear_chat_history(session_id: str = "default", user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """Clear chat conversation history for the authenticated user."""
    db.query(ChatMessage).filter(
        ChatMessage.user_id == user.id,
        ChatMessage.session_id == session_id
    ).delete()
    db.commit()
    return {"message": "Chat history cleared successfully"}
