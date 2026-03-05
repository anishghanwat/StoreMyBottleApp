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
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # CORS Configuration
    CORS_ORIGINS: Optional[str] = None  # Comma-separated list of allowed origins
    
    def get_cors_origins(self) -> List[str]:
        """
        Get list of allowed CORS origins based on environment.
        
        Production: Only specific domains from CORS_ORIGINS env var
        Development: Localhost ports + any custom origins
        """
        origins = []
        
        # Add custom origins from environment variable
        if self.CORS_ORIGINS:
            custom_origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
            origins.extend(custom_origins)
        
        # Development: Add localhost origins
        if self.ENVIRONMENT == "development":
            dev_origins = [
                "http://localhost:5173",  # Customer frontend
                "http://localhost:5174",  # Bartender frontend
                "http://localhost:5175",  # Admin frontend
                "http://localhost:3000",  # Alternative port
                "http://localhost:8080",  # Test server
                "https://localhost:5173",
                "https://localhost:5174",
                "https://localhost:5175",
                "https://localhost:3000",
            ]
            origins.extend(dev_origins)
        
        # Always include the main frontend URL
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        
        return origins
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
