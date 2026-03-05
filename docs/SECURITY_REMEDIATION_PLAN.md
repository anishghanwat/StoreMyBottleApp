# Security Remediation Plan - StoreMyBottle

## Date: March 5, 2026

## Overview

This document provides a prioritized, actionable plan to remediate security vulnerabilities identified in the security analysis.

---

## 🚨 PHASE 1: CRITICAL FIXES (Week 1)

### Priority P0 - Must Fix Before Production

#### 1.1 Secure JWT Secret Management
**Timeline**: 1 day  
**Effort**: Low

**Actions**:
1. Generate strong random secret (64+ characters)
2. Store in environment variables only
3. Never commit to git
4. Use different secrets for dev/staging/prod
5. Implement key rotation mechanism
6. Add secret validation on startup

**Implementation**:
```python
# Generate strong secret
import secrets
JWT_SECRET_KEY = secrets.token_urlsafe(64)

# Validate on startup
if len(settings.JWT_SECRET_KEY) < 32:
    raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
```

---

#### 1.2 Secure Database Credentials
**Timeline**: 1 day  
**Effort**: Low

**Actions**:
1. Use environment variables for all credentials
2. Never commit .env files
3. Use secrets management service (AWS Secrets Manager, HashiCorp Vault)
4. Rotate credentials regularly
5. Use least privilege database user (not root)
6. Enable SSL for database connections

**Implementation**:
```python
# database.py
engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={
        "ssl": {
            "ssl_ca": "/path/to/ca-cert.pem",
            "ssl_cert": "/path/to/client-cert.pem",
            "ssl_key": "/path/to/client-key.pem"
        }
    }
)
```

---

#### 1.3 Implement Rate Limiting
**Timeline**: 2 days  
**Effort**: Medium

**Actions**:
1. Install slowapi or fastapi-limiter
2. Add rate limits to all auth endpoints
3. Add rate limits to sensitive endpoints
4. Implement IP-based and user-based limits
5. Add CAPTCHA for repeated failures

**Implementation**:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to endpoints
@router.post("/auth/login")
@limiter.limit("5/minute")  # 5 attempts per minute
async def login(request: Request, ...):
    ...

@router.post("/auth/forgot-password")
@limiter.limit("3/hour")  # 3 requests per hour
async def forgot_password(request: Request, ...):
    ...
```

---

#### 1.4 Enforce Strong Passwords (Backend)
**Timeline**: 1 day  
**Effort**: Low

**Actions**:
1. Add password validation on backend
2. Enforce minimum 12 characters
3. Require uppercase, lowercase, number, special char
4. Check against common password lists
5. Implement password history (prevent reuse)

**Implementation**:
```python
import re
from passlib.pwd import genword

def validate_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < 12:
        return False, "Password must be at least 12 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain number"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain special character"
    
    # Check against common passwords
    if password.lower() in COMMON_PASSWORDS:
        return False, "Password is too common"
    
    return True, "Password is strong"
```

---

#### 1.5 Implement Input Sanitization
**Timeline**: 2 days  
**Effort**: Medium

**Actions**:
1. Add input validation to all Pydantic schemas
2. Sanitize HTML in user inputs
3. Add length limits to all fields
4. Validate email formats strictly
5. Validate phone formats
6. Escape output in templates

**Implementation**:
```python
from pydantic import validator, Field
import bleach

class VenueCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    location: str = Field(..., min_length=1, max_length=500)
    
    @validator('name', 'location')
    def sanitize_html(cls, v):
        # Remove all HTML tags
        return bleach.clean(v, tags=[], strip=True)
    
    @validator('name')
    def validate_name(cls, v):
        # Only allow alphanumeric and basic punctuation
        if not re.match(r'^[a-zA-Z0-9\s\-\.,&\']+$', v):
            raise ValueError('Name contains invalid characters')
        return v
```

---

## 🔥 PHASE 2: HIGH PRIORITY FIXES (Week 2)

### Priority P1 - Fix Before Beta Launch

#### 2.1 Secure Session Management
**Timeline**: 3 days  
**Effort**: High

**Actions**:
1. Move tokens from localStorage to HttpOnly cookies
2. Implement CSRF protection
3. Add Secure and SameSite flags
4. Implement session invalidation on password change
5. Add device fingerprinting
6. Cleanup expired sessions regularly

**Implementation**:
```python
# Backend - Set HttpOnly cookies
from fastapi.responses import Response

@router.post("/auth/login")
async def login(response: Response, ...):
    # ... authentication logic ...
    
    # Set HttpOnly cookie for access token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,  # HTTPS only
        samesite="strict",
        max_age=1800  # 30 minutes
    )
    
    # Set HttpOnly cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=604800  # 7 days
    )
    
    return {"success": True, "user": user}
```

```typescript
// Frontend - Use cookies instead of localStorage
// Cookies are automatically sent with requests
// No need to manually add Authorization header
```

---

#### 2.2 Fix CORS Configuration
**Timeline**: 1 day  
**Effort**: Low

**Actions**:
1. Whitelist specific origins only
2. Remove wildcard patterns
3. Validate origin on each request
4. Use environment variables for allowed origins
5. Different configs for dev/staging/prod

**Implementation**:
```python
# config.py
ALLOWED_ORIGINS: List[str] = [
    "https://app.storemybottle.com",
    "https://admin.storemybottle.com",
    "https://bartender.storemybottle.com"
]

# Development only
if ENVIRONMENT == "development":
    ALLOWED_ORIGINS.extend([
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://localhost:5173",
        "https://localhost:5174",
        "https://localhost:5175"
    ])

# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600
)
```

---

#### 2.3 Enforce HTTPS
**Timeline**: 2 days  
**Effort**: Medium

**Actions**:
1. Get valid SSL certificates (Let's Encrypt)
2. Configure HTTPS on all servers
3. Add HSTS headers
4. Redirect HTTP to HTTPS
5. Update all URLs to HTTPS
6. Enable HTTPS in production

**Implementation**:
```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Redirect HTTP to HTTPS
if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# Add security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```

---

#### 2.4 Implement Authorization Checks
**Timeline**: 3 days  
**Effort**: High

**Actions**:
1. Add resource ownership validation
2. Implement role-based access control (RBAC)
3. Add venue-based authorization for bartenders
4. Validate user can access requested resources
5. Add authorization decorators

**Implementation**:
```python
# auth.py
async def verify_purchase_ownership(
    purchase_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(404, "Purchase not found")
    if purchase.user_id != user.id and user.role != "admin":
        raise HTTPException(403, "Not authorized to access this purchase")
    return purchase

# Use in endpoints
@router.get("/purchases/{purchase_id}")
async def get_purchase(
    purchase: Purchase = Depends(verify_purchase_ownership)
):
    return purchase
```

---

#### 2.5 Strengthen OTP Security
**Timeline**: 2 days  
**Effort**: Medium

**Actions**:
1. Remove hardcoded OTP in development
2. Increase OTP length to 8 digits
3. Reduce expiry to 2 minutes
4. Invalidate OTP after use
5. Add rate limiting (3 attempts max)
6. Add delay between attempts

**Implementation**:
```python
def create_otp(db: Session, phone: str) -> OTP:
    # Generate 8-digit OTP
    code = str(secrets.randbelow(90000000) + 10000000)
    
    # Set expiration to 2 minutes
    expires = datetime.utcnow() + timedelta(minutes=2)
    
    # Invalidate existing OTPs
    db.query(OTP).filter(
        OTP.phone == phone,
        OTP.is_verified == False
    ).update({"is_verified": True})
    
    otp = OTP(phone=phone, otp_code=code, expires_at=expires)
    db.add(otp)
    db.commit()
    return otp

def verify_otp(db: Session, phone: str, code: str) -> bool:
    otp = db.query(OTP).filter(
        OTP.phone == phone,
        OTP.otp_code == code,
        OTP.is_verified == False,
        OTP.expires_at > datetime.utcnow()
    ).first()
    
    if otp:
        # Invalidate immediately after use
        otp.is_verified = True
        db.commit()
        return True
    return False
```

---

#### 2.6 Integrate Real Payment Gateway
**Timeline**: 5 days  
**Effort**: High

**Actions**:
1. Choose payment provider (Razorpay, Stripe)
2. Implement payment gateway integration
3. Add payment verification webhooks
4. Store payment transaction IDs
5. Implement refund mechanism
6. Add payment status tracking

**Implementation**:
```python
import razorpay

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@router.post("/purchases/{purchase_id}/payment")
async def create_payment_order(
    purchase_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id,
        Purchase.user_id == user.id
    ).first()
    
    # Create Razorpay order
    order = client.order.create({
        "amount": int(purchase.purchase_price * 100),  # Amount in paise
        "currency": "INR",
        "receipt": purchase_id,
        "payment_capture": 1
    })
    
    return {"order_id": order["id"], "amount": order["amount"]}

@router.post("/webhooks/payment")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    # Verify webhook signature
    signature = request.headers.get("X-Razorpay-Signature")
    body = await request.body()
    
    client.utility.verify_payment_signature({
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": signature
    })
    
    # Update purchase status
    # ...
```

---

## 🔧 PHASE 3: MEDIUM PRIORITY FIXES (Week 3-4)

### Priority P2 - Important for Production

#### 3.1 Implement Comprehensive Audit Logging
**Timeline**: 3 days  
**Effort**: Medium

**Actions**:
1. Log all authentication events
2. Log all admin actions
3. Log data modifications
4. Log failed authorization attempts
5. Add log rotation
6. Implement log analysis

**Implementation**:
```python
def create_audit_log(
    db: Session,
    user_id: str,
    action: str,
    entity_type: str,
    entity_id: str = None,
    details: dict = None,
    request: Request = None
):
    log = AuditLog(
        user_id=user_id,
        user_name=user.name if user else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=json.dumps(details) if details else None,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(log)
    db.commit()

# Use in endpoints
@router.post("/admin/venues")
async def create_venue(
    venue_data: VenueCreate,
    user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
    request: Request = None
):
    venue = Venue(**venue_data.dict())
    db.add(venue)
    db.commit()
    
    # Log the action
    create_audit_log(
        db, user.id, "CREATE", "venues", venue.id,
        {"name": venue.name}, request
    )
    
    return venue
```

---

#### 3.2 Remove Sensitive Data from Logs
**Timeline**: 1 day  
**Effort**: Low

**Actions**:
1. Remove password logging
2. Remove OTP logging
3. Remove token logging
4. Mask sensitive data in logs
5. Use structured logging

**Implementation**:
```python
import logging
from pythonjsonlogger import jsonlogger

# Configure structured logging
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)

# Mask sensitive data
def mask_sensitive_data(data: dict) -> dict:
    sensitive_keys = ['password', 'otp_code', 'token', 'secret']
    masked = data.copy()
    for key in sensitive_keys:
        if key in masked:
            masked[key] = "***REDACTED***"
    return masked

# Use in logging
logger.info("User login", extra=mask_sensitive_data({
    "user_id": user.id,
    "email": user.email,
    "password": password  # Will be masked
}))
```

---

#### 3.3 Add Security Headers
**Timeline**: 1 day  
**Effort**: Low

**Actions**:
1. Add all OWASP recommended headers
2. Configure CSP properly
3. Add feature policy
4. Test headers with security scanners

**Implementation**:
```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # HSTS
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    
    # Prevent MIME sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"
    
    # XSS Protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Referrer Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Content Security Policy
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://api.storemybottle.com"
    )
    
    # Permissions Policy
    response.headers["Permissions-Policy"] = (
        "geolocation=(), "
        "microphone=(), "
        "camera=(self)"
    )
    
    return response
```

---

#### 3.4 Improve Password Reset Security
**Timeline**: 2 days  
**Effort**: Medium

**Actions**:
1. Reduce token expiry to 15 minutes
2. Add rate limiting (3 requests per day)
3. Invalidate all sessions on password change
4. Send notification email on password change
5. Add security questions (optional)

**Implementation**:
```python
def create_password_reset_token(db: Session, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    
    # Shorter expiry - 15 minutes
    expires = datetime.utcnow() + timedelta(minutes=15)
    
    # Invalidate existing tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id,
        PasswordResetToken.is_used == False
    ).update({"is_used": True})
    
    reset_token = PasswordResetToken(
        user_id=user_id,
        token=token,
        expires_at=expires
    )
    db.add(reset_token)
    db.commit()
    
    return token

def use_password_reset_token(db: Session, token: str, new_password: str) -> bool:
    user_id = verify_password_reset_token(db, token)
    if not user_id:
        return False
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    
    # Mark token as used
    db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token
    ).update({"is_used": True})
    
    # Invalidate all user sessions
    invalidate_all_user_sessions(db, user_id)
    
    # Send notification email
    send_password_changed_notification(user.email, user.name)
    
    db.commit()
    return True
```

---

#### 3.5 Enhance QR Code Security
**Timeline**: 2 days  
**Effort**: Medium

**Actions**:
1. Use cryptographically secure tokens
2. Reduce expiry to 10 minutes
3. Add device binding
4. Implement one-time use at QR level
5. Add watermark with timestamp

**Implementation**:
```python
def generate_qr_token() -> str:
    # Use cryptographically secure random
    return secrets.token_urlsafe(32)

def create_redemption(
    db: Session,
    purchase_id: str,
    peg_size_ml: int,
    user_id: str,
    device_fingerprint: str = None
) -> Redemption:
    qr_token = generate_qr_token()
    
    # Shorter expiry - 10 minutes
    qr_expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    redemption = Redemption(
        purchase_id=purchase_id,
        user_id=user_id,
        peg_size_ml=peg_size_ml,
        qr_token=qr_token,
        qr_expires_at=qr_expires_at,
        device_fingerprint=device_fingerprint  # New field
    )
    
    db.add(redemption)
    db.commit()
    return redemption

def validate_qr_code(
    db: Session,
    qr_token: str,
    device_fingerprint: str = None
) -> tuple[bool, str, Redemption]:
    redemption = db.query(Redemption).filter(
        Redemption.qr_token == qr_token
    ).first()
    
    if not redemption:
        return False, "Invalid QR code", None
    
    # Check if already used
    if redemption.status != RedemptionStatus.PENDING:
        return False, "QR code already used", None
    
    # Check expiry
    if redemption.qr_expires_at < datetime.utcnow():
        redemption.status = RedemptionStatus.EXPIRED
        db.commit()
        return False, "QR code expired", None
    
    # Check device binding
    if device_fingerprint and redemption.device_fingerprint:
        if device_fingerprint != redemption.device_fingerprint:
            return False, "QR code can only be used on original device", None
    
    return True, "Valid QR code", redemption
```

---

## 🎯 PHASE 4: NICE-TO-HAVE IMPROVEMENTS (Week 5+)

### Priority P3 - Future Enhancements

#### 4.1 Implement API Versioning
**Timeline**: 2 days  
**Effort**: Medium

**Actions**:
1. Add version prefix to all routes
2. Support multiple versions
3. Deprecation warnings
4. Version negotiation

**Implementation**:
```python
# v1 routes
v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(auth.router)
v1_router.include_router(venues.router)

# v2 routes (future)
v2_router = APIRouter(prefix="/api/v2")

app.include_router(v1_router)
```

---

#### 4.2 Add Account Lockout
**Timeline**: 1 day  
**Effort**: Low

**Actions**:
1. Track failed login attempts
2. Lock account after 5 failures
3. Temporary lockout (30 minutes)
4. Email notification on lockout
5. Admin unlock capability

---

#### 4.3 Implement Email Verification
**Timeline**: 2 days  
**Effort**: Medium

**Actions**:
1. Send verification email on signup
2. Generate verification token
3. Verify email before full access
4. Resend verification email
5. Mark email as verified

---

#### 4.4 Add Two-Factor Authentication
**Timeline**: 5 days  
**Effort**: High

**Actions**:
1. Support TOTP (Google Authenticator)
2. Support SMS OTP
3. Backup codes
4. Remember device option
5. Force 2FA for admin accounts

---

#### 4.5 Implement Data Encryption at Rest
**Timeline**: 3 days  
**Effort**: High

**Actions**:
1. Encrypt sensitive fields in database
2. Use AES-256 encryption
3. Secure key management
4. Transparent encryption/decryption
5. Encrypt backups

---

## 📋 IMPLEMENTATION CHECKLIST

### Before Starting
- [ ] Review all security issues
- [ ] Prioritize based on risk
- [ ] Allocate resources
- [ ] Set up security testing environment
- [ ] Create backup of current system

### Phase 1 (Week 1)
- [ ] Secure JWT secrets
- [ ] Secure database credentials
- [ ] Implement rate limiting
- [ ] Enforce strong passwords
- [ ] Add input sanitization
- [ ] Test all changes
- [ ] Deploy to staging

### Phase 2 (Week 2)
- [ ] Implement secure session management
- [ ] Fix CORS configuration
- [ ] Enforce HTTPS
- [ ] Add authorization checks
- [ ] Strengthen OTP security
- [ ] Integrate payment gateway
- [ ] Test all changes
- [ ] Deploy to staging

### Phase 3 (Week 3-4)
- [ ] Implement audit logging
- [ ] Remove sensitive data from logs
- [ ] Add security headers
- [ ] Improve password reset
- [ ] Enhance QR code security
- [ ] Test all changes
- [ ] Deploy to staging

### Phase 4 (Week 5+)
- [ ] API versioning
- [ ] Account lockout
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Data encryption at rest
- [ ] Test all changes
- [ ] Deploy to production

---

## 🧪 TESTING REQUIREMENTS

### Security Testing Checklist

#### Authentication Testing
- [ ] Test rate limiting on login
- [ ] Test password strength validation
- [ ] Test session expiry
- [ ] Test token refresh
- [ ] Test logout (single device)
- [ ] Test logout (all devices)
- [ ] Test password reset flow
- [ ] Test OTP generation and validation

#### Authorization Testing
- [ ] Test role-based access control
- [ ] Test resource ownership validation
- [ ] Test venue-based authorization
- [ ] Test privilege escalation attempts
- [ ] Test horizontal privilege escalation
- [ ] Test vertical privilege escalation

#### Input Validation Testing
- [ ] Test SQL injection attempts
- [ ] Test XSS attempts
- [ ] Test command injection
- [ ] Test path traversal
- [ ] Test file upload (if applicable)
- [ ] Test special characters
- [ ] Test length limits

#### Session Management Testing
- [ ] Test session fixation
- [ ] Test session hijacking
- [ ] Test CSRF protection
- [ ] Test cookie security flags
- [ ] Test concurrent sessions
- [ ] Test session timeout

#### API Security Testing
- [ ] Test CORS configuration
- [ ] Test rate limiting
- [ ] Test API versioning
- [ ] Test error handling
- [ ] Test security headers
- [ ] Test HTTPS enforcement

---

## 🔍 SECURITY MONITORING

### Ongoing Security Measures

#### 1. Continuous Monitoring
- Set up intrusion detection system (IDS)
- Monitor failed login attempts
- Track API abuse patterns
- Alert on suspicious activities
- Monitor database access

#### 2. Regular Security Audits
- Quarterly penetration testing
- Monthly vulnerability scans
- Weekly dependency updates
- Daily log reviews
- Annual third-party audit

#### 3. Incident Response Plan
- Define security incident levels
- Establish response team
- Create communication plan
- Document response procedures
- Conduct regular drills

#### 4. Security Metrics
- Track failed login attempts
- Monitor API error rates
- Measure response times
- Track security patches applied
- Monitor user complaints

---

## 📚 SECURITY RESOURCES

### Tools & Libraries

#### Python/FastAPI
- `slowapi` - Rate limiting
- `python-jose` - JWT handling
- `bcrypt` - Password hashing
- `bleach` - HTML sanitization
- `python-multipart` - File uploads
- `cryptography` - Encryption

#### Security Scanning
- `bandit` - Python security linter
- `safety` - Dependency vulnerability scanner
- `OWASP ZAP` - Web app security scanner
- `Burp Suite` - Penetration testing
- `sqlmap` - SQL injection testing

#### Monitoring
- `Sentry` - Error tracking
- `Datadog` - Application monitoring
- `ELK Stack` - Log aggregation
- `Prometheus` - Metrics collection
- `Grafana` - Visualization

---

## 💰 ESTIMATED COSTS

### Development Time
- Phase 1: 40 hours (1 week)
- Phase 2: 80 hours (2 weeks)
- Phase 3: 60 hours (1.5 weeks)
- Phase 4: 80 hours (2 weeks)
- **Total**: 260 hours (~6.5 weeks)

### Third-Party Services
- SSL Certificates: $0 (Let's Encrypt)
- Payment Gateway: 2-3% per transaction
- SMS OTP: $0.01-0.05 per SMS
- Email Service: $10-50/month
- Security Scanning: $100-500/month
- Monitoring: $50-200/month

### Infrastructure
- WAF (Web Application Firewall): $20-100/month
- DDoS Protection: $50-500/month
- Backup Storage: $10-50/month
- Secrets Management: $0-100/month

---

## ✅ SUCCESS CRITERIA

### Security Goals
- [ ] Zero critical vulnerabilities
- [ ] All high-priority issues resolved
- [ ] Pass OWASP Top 10 checklist
- [ ] Pass penetration test
- [ ] Achieve 90%+ security score
- [ ] Compliance with GDPR basics
- [ ] No sensitive data in logs
- [ ] All communications encrypted
- [ ] Comprehensive audit logging
- [ ] Incident response plan in place

---

## 📞 NEXT STEPS

1. **Review this plan** with development team
2. **Prioritize** based on business needs
3. **Allocate resources** (developers, time, budget)
4. **Set up** security testing environment
5. **Begin Phase 1** implementation
6. **Test thoroughly** after each phase
7. **Deploy incrementally** to staging
8. **Monitor** for issues
9. **Document** all changes
10. **Train team** on security best practices

---

## 📝 NOTES

- This plan is comprehensive but flexible
- Adjust priorities based on your specific needs
- Some fixes can be done in parallel
- Don't skip testing phases
- Security is an ongoing process, not a one-time fix
- Keep this document updated as you progress

