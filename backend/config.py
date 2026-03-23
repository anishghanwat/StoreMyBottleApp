from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate JWT secret on startup
        if len(self.JWT_SECRET_KEY) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters long. "
                "Generate a strong secret with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
            )
    
    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    
    # Twilio
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Resend (Email Service)
    RESEND_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "onboarding@resend.dev"
    RESEND_TEST_EMAIL: Optional[str] = None  # For testing email delivery
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # Web Push (VAPID)
    VAPID_PUBLIC_KEY: Optional[str] = None
    VAPID_PRIVATE_KEY: Optional[str] = None
    VAPID_EMAIL: str = "mailto:admin@storemybottle.in"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Frontend URL (for CORS)
    FRONTEND_URL: Optional[str] = None

    # CORS Configuration
    CORS_ORIGINS: Optional[str] = None  # Comma-separated list of allowed origins
    
    def get_cors_origins(self) -> List[str]:
        """
        Get list of allowed CORS origins based on environment.
        
        Production: Only specific domains from CORS_ORIGINS env var
        Development: Localhost ports + any custom origins
        """
        origins = set()
        
        # Add custom origins from environment variable
        if self.CORS_ORIGINS:
            for origin in self.CORS_ORIGINS.split(","):
                origins.add(origin.strip())
        
        # Always include the main frontend URL
        if self.FRONTEND_URL:
            origins.add(self.FRONTEND_URL)
        
        # Production: always include all storemybottle.in subdomains
        if self.ENVIRONMENT == "production":
            production_origins = [
                "https://storemybottle.in",
                "https://www.storemybottle.in",
                "https://admin.storemybottle.in",
                "https://bartender.storemybottle.in",
            ]
            origins.update(production_origins)
        
        # Development: Add localhost origins
        if self.ENVIRONMENT == "development":
            dev_origins = [
                "http://localhost:5173",   # Customer frontend
                "http://localhost:5174",   # Bartender frontend
                "http://localhost:5175",   # Admin frontend
                "http://localhost:3000",   # Alternative port
                "http://localhost:8080",   # Test server
                "https://localhost:5173",
                "https://localhost:5174",
                "https://localhost:5175",
                "https://localhost:3000",
            ]
            origins.update(dev_origins)
        
        return list(origins)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
