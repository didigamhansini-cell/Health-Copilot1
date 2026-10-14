import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "AI-Powered Personal Health Copilot"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = "sqlite:///./health_copilot.db"
    
    # Optional LLM API Keys (Falls back cleanly to Clinical Offline Intelligence Engine)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_AI_PROVIDER: str = "auto"  # "auto", "gemini", "openai", "offline"

    # Emergency Services configuration
    EMERGENCY_NUMBER: str = "911 / 112"
    POISON_CONTROL: str = "1-800-222-1222"

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
