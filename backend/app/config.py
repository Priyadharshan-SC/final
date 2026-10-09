import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PCBInspect AI Edge Engine"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENV: str = "production"
    DEBUG: bool = False
    
    # Database Configurations
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pcbinspect"
    SQLITE_FALLBACK_DB: str = "inspection_cache.db"
    
    # Redis & Celery Config
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Hardware & Camera Configurations
    SERIAL_PORT: str = "/dev/ttyUSB0"
    BAUD_RATE: int = 115200
    MOCK_PLC: bool = True
    TARGET_FPS: int = 40
    
    # Cloud Storage Configurations (AWS S3 / Supabase)
    AWS_ACCESS_KEY_ID: str = "mock_key"
    AWS_SECRET_ACCESS_KEY: str = "mock_secret"
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "pcb-inspect-images"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
