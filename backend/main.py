from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from sqlalchemy.exc import SQLAlchemyError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from config import settings
from database import engine, Base
from routers import venues, auth, purchases, redemptions, profile, admin

# Create rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses.
    Implements OWASP security best practices.
    """
    async def dispatch(self, request: Request, call_next):
        # Skip security headers for API documentation endpoints
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            response = await call_next(request)
            return response
        
        response = await call_next(request)
        
        # HSTS (HTTP Strict Transport Security)
        # Forces browsers to use HTTPS for all future requests
        if settings.ENVIRONMENT == "production":
            # Production: Enforce HTTPS for 1 year, include subdomains
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        else:
            # Development: Shorter duration for testing
            response.headers["Strict-Transport-Security"] = "max-age=3600"
        
        # X-Content-Type-Options
        # Prevents MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options
        # Prevents clickjacking attacks
        response.headers["X-Frame-Options"] = "DENY"
        
        # X-XSS-Protection
        # Enables browser XSS filter (legacy, but still useful)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Content-Security-Policy
        # Prevents XSS, clickjacking, and other code injection attacks
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",  # Allow Swagger UI CDN
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",  # Allow Swagger UI styles
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)
        
        # Referrer-Policy
        # Controls how much referrer information is sent
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions-Policy (formerly Feature-Policy)
        # Controls which browser features can be used
        permissions = [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=()",
            "usb=()",
            "magnetometer=()",
            "gyroscope=()",
            "accelerometer=()"
        ]
        response.headers["Permissions-Policy"] = ", ".join(permissions)
        
        return response


# HTTPS Redirect Middleware (Production only)
class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """
    Redirect all HTTP requests to HTTPS in production.
    When behind a reverse proxy (like Nginx), check X-Forwarded-Proto header.
    """
    async def dispatch(self, request: Request, call_next):
        # Only redirect in production
        if settings.ENVIRONMENT == "production":
            # Check X-Forwarded-Proto header (set by Nginx)
            forwarded_proto = request.headers.get("x-forwarded-proto", "")
            
            # If no proxy header, fall back to checking request scheme
            if forwarded_proto:
                # Behind proxy: trust the X-Forwarded-Proto header
                if forwarded_proto == "http":
                    # Build HTTPS URL
                    https_url = request.url.replace(scheme="https")
                    return RedirectResponse(url=str(https_url), status_code=301)
            elif request.url.scheme == "http":
                # Direct connection: check request scheme
                https_url = request.url.replace(scheme="https")
                return RedirectResponse(url=str(https_url), status_code=301)
        
        return await call_next(request)

# Create FastAPI app
app = FastAPI(
    title="StoreMyBottle API",
    description="Backend API for StoreMyBottle - Bottle storage and redemption service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add security middlewares
# Note: HTTPS redirect is handled by Nginx reverse proxy, not by the app
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware - Secure configuration
# No wildcards allowed when using credentials (HttpOnly cookies)
cors_origins = settings.get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # Specific origins only (no wildcards)
    allow_credentials=True,  # Required for HttpOnly cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["Content-Length", "Content-Type"],
    max_age=3600,  # Cache preflight requests for 1 hour
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
    print(f"🔒 CORS Origins: {', '.join(settings.get_cors_origins())}")
    print(f"🔐 HTTPS Enforcement: {'✅ Enabled' if settings.ENVIRONMENT == 'production' else '⚠️  Disabled (dev mode)'}")
    print(f"🛡️  Security Headers: ✅ Enabled")
    
    # Auto-initialize database on startup (for production deployments)
    try:
        print("🗄️  Checking database connection...")
        # Test connection
        from database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
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
        from sqlalchemy import text
        
        # Test connection
        db = SessionLocal()
        db.execute(text("SELECT 1"))
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
        import bcrypt
        
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
        
        # Create admin user with a simple password
        # Use bcrypt directly to avoid any passlib issues
        simple_password = "admin123"
        
        # Hash the password using bcrypt directly
        try:
            # Ensure password is bytes and within bcrypt's 72 byte limit
            password_bytes = simple_password.encode('utf-8')[:72]
            salt = bcrypt.gensalt(rounds=12)
            password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        except Exception as hash_error:
            db.close()
            return {
                "status": "error",
                "message": f"Password hashing failed: {str(hash_error)}"
            }
        
        # Create admin user
        admin = User(
            name="Admin",
            email="admin@storemybottle.com",
            phone="+1234567890",
            hashed_password=password_hash,
            role="admin"
        )
        
        db.add(admin)
        db.commit()
        db.close()
        
        return {
            "status": "success",
            "message": "Admin user created successfully",
            "email": "admin@storemybottle.com",
            "password": simple_password,
            "warning": "Please change the password immediately after first login!"
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": f"Admin creation failed: {str(e)}",
            "traceback": traceback.format_exc()
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
