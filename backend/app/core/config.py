from typing import Optional, List
import os
from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./munda_market.db"
    DATABASE_TEST_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # WhatsApp Business API
    WHATSAPP_API_URL: Optional[str] = None
    WHATSAPP_ACCESS_TOKEN: Optional[str] = None
    
    # SMS (Twilio)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Payment Gateways
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_SECRET_KEY: Optional[str] = None
    ECOCASH_API_URL: Optional[str] = None
    ECOCASH_API_KEY: Optional[str] = None
    ZIPIT_API_URL: Optional[str] = None
    ZIPIT_API_KEY: Optional[str] = None
    
    # File Storage
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Application
    DEBUG: bool = True
    LOG_LEVEL: str = "info"
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Munda Market"
    PROJECT_VERSION: str = "1.0.0"
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    class Config:
        env_file = "config.env"
        case_sensitive = True


settings = Settings()
