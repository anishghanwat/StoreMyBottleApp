from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Ensure DATABASE_URL uses pymysql driver
database_url = settings.DATABASE_URL
if database_url.startswith("mysql://"):
    database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)

# SSL configuration for database (production)
connect_args = {}
if settings.ENVIRONMENT == "production":
    # Enable SSL for production database connections
    connect_args = {
        "ssl": {
            "ssl_mode": "REQUIRED"
            # Uncomment and configure for certificate-based SSL:
            # "ssl_ca": "/path/to/ca-cert.pem",
            # "ssl_cert": "/path/to/client-cert.pem",
            # "ssl_key": "/path/to/client-key.pem"
        }
    }

# Create database engine
engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,  # Connection pool size
    max_overflow=20,  # Max connections beyond pool_size
    echo=settings.ENVIRONMENT == "development",
    connect_args=connect_args
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
