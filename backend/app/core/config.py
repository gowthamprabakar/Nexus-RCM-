import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RCM Pulse API"
    API_V1_STR: str = "/api/v1"
    
    # DB Settings (matching docker-compose)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://postgres:password123@localhost:5432/rcmpulse"
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "b3c66f8e70997e0b51f9db")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"]

    class Config:
        case_sensitive = True

settings = Settings()
