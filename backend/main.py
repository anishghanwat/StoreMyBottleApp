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
    print(f"📚 API Docs: http://localhost:8000/docs")


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
