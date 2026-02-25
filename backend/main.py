from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from sqlalchemy.exc import SQLAlchemyError

from config import settings
from database import engine, Base
from routers import venues, auth, purchases, redemptions, profile, admin

# Create FastAPI app
app = FastAPI(
    title="StoreMyBottle API",
    description="Backend API for StoreMyBottle - Bottle storage and redemption service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"] with credentials is invalid. using regex for local network
    allow_origins=[
        settings.FRONTEND_URL, 
        "http://localhost:5173", 
        "http://localhost:5174",
        "https://localhost:5173",
        "https://localhost:5174",
        "https://192.168.31.5:5174",
        "http://192.168.31.5:5174",
        "http://localhost:3000",
        "https://localhost:3000",
        "http://localhost:5175",
        "http://localhost:5176"
    ],
    allow_origin_regex=r"https?://192\.168\.\d+\.\d+(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": jsonable_encoder(exc.errors()),
            "body": exc.body.decode() if isinstance(exc.body, bytes) else str(exc.body)
        }
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Database error occurred",
            "error": str(exc) if settings.ENVIRONMENT == "development" else "Internal server error"
        }
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print("🚀 Starting StoreMyBottle API...")
    print(f"📝 Environment: {settings.ENVIRONMENT}")
    print(f"🌐 Frontend URL: {settings.FRONTEND_URL}")
    
    # Auto-initialize database on startup (for production deployments)
    try:
        print("🗄️  Checking database connection...")
        # Test connection
        from database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        print("✅ Database connection successful")
        
        # Create tables if they don't exist
        print("📊 Creating database tables if needed...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables ready")
        
    except Exception as e:
        print(f"⚠️  Database initialization warning: {e}")
        print("⚠️  Some features may not work until database is properly configured")
    
    print(f"📚 API Docs: /docs")
    print("✅ StoreMyBottle API is ready!")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    print("👋 Shutting down StoreMyBottle API...")


# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "StoreMyBottle API",
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to StoreMyBottle API",
        "docs": "/docs",
        "health": "/health"
    }


# Database initialization endpoint (for production setup)
@app.post("/api/init-db")
def initialize_database():
    """Initialize database tables - call this once after deployment"""
    try:
        from database import SessionLocal
        
        # Test connection
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        return {
            "status": "success",
            "message": "Database initialized successfully",
            "tables_created": True
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database initialization failed: {str(e)}"
        }


# Create admin user endpoint (for production setup)
@app.post("/api/create-admin")
def create_admin_user():
    """Create default admin user - call this once after database initialization"""
    try:
        from database import SessionLocal
        from models import User
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        db = SessionLocal()
        
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@storemybottle.com").first()
        if existing_admin:
            db.close()
            return {
                "status": "info",
                "message": "Admin user already exists",
                "email": "admin@storemybottle.com"
            }
        
        # Create admin user
        admin = User(
            name="Admin",
            email="admin@storemybottle.com",
            phone="+1234567890",
            password_hash=pwd_context.hash("admin123"),
            role="admin",
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.close()
        
        return {
            "status": "success",
            "message": "Admin user created successfully",
            "email": "admin@storemybottle.com",
            "password": "admin123",
            "warning": "Please change the password immediately after first login!"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Admin creation failed: {str(e)}"
        }


# Register routers
app.include_router(venues.router)
app.include_router(auth.router)
app.include_router(purchases.router)
app.include_router(redemptions.router)
app.include_router(profile.router)
app.include_router(admin.router)


if __name__ == "__main__":
    import uvicorn
    # Use HTTPS for all connections (required for camera access on phones)
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        ssl_keyfile="key.pem",
        ssl_certfile="cert.pem"
    )
