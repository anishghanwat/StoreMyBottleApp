# Security Analysis - StoreMyBottle Application

## Date: March 5, 2026

## Executive Summary

This document provides a comprehensive security analysis of the StoreMyBottle application, identifying vulnerabilities, risks, and providing a prioritized remediation plan.

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. JWT Secret Key Exposure
**Severity**: CRITICAL  
**Risk**: Complete authentication bypass

**Issue**:
- JWT secret key is stored in `.env` file
- Default example shows weak key: `your-secret-key-change-this-in-production`
- If `.env` is committed to git or exposed, entire auth system is compromised
- No key rotation mechanism

**Impact**:
- Attacker can forge valid JWT tokens for any user
- Complete account takeover possible
- Admin access can be gained
- All user data at risk

**Current Code**:
```python
# config.py
JWT_SECRET_KEY: str  # From .env
```

---

### 2. Database Credentials in Plain Text
**Severity**: CRITICAL  
**Risk**: Complete database compromise

**Issue**:
- Database URL with credentials stored in `.env` file
- Example: `mysql+pymysql://root:password@localhost:3306/storemybottle`
- Root user with weak password
- No encryption at rest

**Impact**:
- Direct database access if `.env` is exposed
- All user data, passwords, payment info accessible
- Data can be modified or deleted
- Compliance violations (GDPR, PCI-DSS)

---

### 3. No Rate Limiting
**Severity**: CRITICAL  
**Risk**: Brute force attacks, DDoS

**Issue**:
- No rate limiting on login endpoint
- No rate limiting on password reset
- No rate limiting on OTP generation
- No CAPTCHA or bot protection

**Impact**:
- Brute force password attacks
- Account enumeration
- OTP flooding
- API abuse and DDoS
- Resource exhaustion

**Attack Scenario**:
```python
# Attacker can try unlimited passwords
for password in password_list:
    login(email, password)  # No rate limit!
```

---

### 4. Weak Password Policy
**Severity**: HIGH  
**Risk**: Easy account compromise

**Issue**:
- Frontend validation only (8+ chars, uppercase, lowercase, number)
- No backend password strength enforcement
- No password complexity requirements on backend
- No password history (users can reuse old passwords)
- No password expiration policy

**Current Code**:
```python
# auth.py - No password validation!
def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')
```

**Impact**:
- Users can set weak passwords via API directly
- Brute force attacks easier
- Dictionary attacks effective

---

### 5. No Input Sanitization
**Severity**: HIGH  
**Risk**: SQL Injection, XSS

**Issue**:
- No input validation on backend for many fields
- Relying on Pydantic schemas only (not enough)
- No HTML escaping for user-generated content
- No SQL injection protection beyond ORM

**Vulnerable Areas**:
- Venue names, addresses
- Bottle names, brands
- User names
- Support ticket descriptions
- Promotion codes

**Attack Scenario**:
```python
# Potential XSS in venue name
venue_name = "<script>alert('XSS')</script>"
# If displayed without escaping, executes in browser
```

---

### 6. Insecure Session Management
**Severity**: HIGH  
**Risk**: Session hijacking, token theft

**Issues**:
- Tokens stored in localStorage (vulnerable to XSS)
- No HttpOnly cookies
- No Secure flag on cookies
- No SameSite protection
- Refresh tokens never expire (7 days but no cleanup)
- No session invalidation on password change

**Current Code**:
```typescript
// session.ts - Insecure storage!
localStorage.setItem(TOKEN_KEY, accessToken);
localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
```

**Impact**:
- XSS can steal all tokens
- CSRF attacks possible
- Session hijacking
- Token replay attacks

---

## 🟠 HIGH SECURITY ISSUES

### 7. CORS Misconfiguration
**Severity**: HIGH  
**Risk**: Unauthorized API access

**Issue**:
- Wildcard CORS with credentials attempted
- Regex pattern allows any 192.168.x.x IP
- No origin validation
- Allows all methods and headers

**Current Code**:
```python
# main.py
allow_origins=[...],
allow_origin_regex=r"https?://192\.168\.\d+\.\d+(:\d+)?",
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
```

**Impact**:
- Any website can make requests to your API
- CSRF attacks easier
- Data exfiltration possible

---

### 8. No HTTPS Enforcement
**Severity**: HIGH  
**Risk**: Man-in-the-middle attacks

**Issue**:
- HTTPS only used in development (self-signed certs)
- No HSTS headers
- No redirect from HTTP to HTTPS
- Mixed content possible

**Impact**:
- Credentials sent in plain text
- Session tokens intercepted
- Data tampering
- Cookie theft

---

### 9. Insufficient Authorization Checks
**Severity**: HIGH  
**Risk**: Privilege escalation

**Issues**:
- Role checks only in some endpoints
- No resource-level authorization
- Bartenders can access other venues' data
- No ownership validation on purchases/redemptions

**Example**:
```python
# Missing check: Can user access THIS purchase?
@router.get("/purchases/{purchase_id}")
async def get_purchase(purchase_id: str, user: User = Depends(get_current_user)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    return purchase  # No check if purchase belongs to user!
```

**Impact**:
- Users can access other users' data
- Bartenders can approve redemptions at wrong venues
- Data leakage

---

### 10. Weak OTP Implementation
**Severity**: HIGH  
**Risk**: Account takeover via OTP

**Issues**:
- Fixed OTP in development: "123456"
- Only 6 digits (1 million combinations)
- No rate limiting on OTP attempts
- 5-minute expiry too long
- OTPs not invalidated after use (can be reused)

**Current Code**:
```python
# auth.py
code = "123456"  # HARDCODED IN DEV!
if settings.ENVIRONMENT == "production":
    code = str(random.randint(100000, 999999))
```

**Impact**:
- Brute force OTP in development
- Easy to guess in production (6 digits)
- Account takeover

---

### 11. Password Reset Token Issues
**Severity**: HIGH  
**Risk**: Account takeover

**Issues**:
- Tokens sent via email (insecure channel)
- 1-hour expiry too long
- No rate limiting on reset requests
- Tokens not invalidated after use
- No notification to user when password changed

**Current Code**:
```python
# auth.py
token = secrets.token_urlsafe(32)  # Good
expires = datetime.utcnow() + timedelta(hours=1)  # Too long!
```

**Impact**:
- Email interception
- Token brute force
- Account takeover
- No user awareness of compromise

---

### 12. No Audit Logging
**Severity**: MEDIUM  
**Risk**: No forensics, compliance issues

**Issue**:
- Audit log table exists but not used
- No logging of:
  - Login attempts (success/failure)
  - Password changes
  - Admin actions
  - Data modifications
  - Failed authorization attempts

**Impact**:
- Can't detect breaches
- Can't investigate incidents
- Compliance violations
- No accountability

---

## 🟡 MEDIUM SECURITY ISSUES

### 13. Sensitive Data in Logs
**Severity**: MEDIUM  
**Risk**: Information disclosure

**Issue**:
- Passwords printed to console in development
- OTP codes printed to console
- Reset tokens printed to console
- Database queries logged in development

**Current Code**:
```python
# auth.py
print(f"DEBUG OTP for {phone}: {code}")  # SENSITIVE!
print(f"Reset URL: {reset_url}")  # Contains token!
```

**Impact**:
- Credentials in log files
- Tokens exposed
- Privacy violations

---

### 14. No API Versioning
**Severity**: MEDIUM  
**Risk**: Breaking changes, compatibility issues

**Issue**:
- All endpoints at `/api/*`
- No version in URL
- Can't deprecate old endpoints safely
- Breaking changes affect all clients

**Impact**:
- Can't evolve API safely
- Breaking changes break all apps
- No migration path

---

### 15. Missing Security Headers
**Severity**: MEDIUM  
**Risk**: Various attacks

**Missing Headers**:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Content-Security-Policy
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

**Impact**:
- Clickjacking attacks
- MIME sniffing attacks
- XSS attacks easier

---

### 16. QR Code Security Issues
**Severity**: MEDIUM  
**Risk**: Unauthorized redemptions

**Issues**:
- QR tokens are UUIDs (predictable pattern)
- 15-minute expiry might be too long
- No device binding
- Can be screenshot and shared
- No one-time use enforcement at QR level

**Current Code**:
```python
# auth.py
def generate_qr_token() -> str:
    return base64.urlsafe_b64encode(uuid.uuid4().bytes).decode().rstrip("=")
```

**Impact**:
- QR codes can be shared
- Screenshots can be reused
- Fraud possible

---

### 17. No Payment Verification
**Severity**: MEDIUM  
**Risk**: Fraud, revenue loss

**Issue**:
- Payment confirmation is just a button click
- No actual payment gateway integration
- No payment verification
- Bartender can confirm without payment
- No refund mechanism

**Current Code**:
```python
# Just updates status, no actual payment!
purchase.payment_status = PaymentStatus.CONFIRMED
purchase.payment_method = payment_method
```

**Impact**:
- Free bottles
- Revenue loss
- Fraud

---

### 18. Insufficient Error Handling
**Severity**: MEDIUM  
**Risk**: Information disclosure

**Issues**:
- Stack traces exposed in development
- Database errors show schema details
- Validation errors reveal field names
- Generic error messages in production (good)

**Impact**:
- Schema enumeration
- Attack surface mapping
- Information leakage

---

## 🟢 LOW SECURITY ISSUES

### 19. No Account Lockout
**Severity**: LOW  
**Risk**: Brute force (mitigated by rate limiting if added)

**Issue**:
- No account lockout after failed attempts
- No temporary suspension
- No CAPTCHA after failures

---

### 20. No Email Verification
**Severity**: LOW  
**Risk**: Fake accounts, spam

**Issue**:
- Users can sign up with any email
- No email verification required
- Can create multiple accounts

---

### 21. No 2FA/MFA
**Severity**: LOW  
**Risk**: Account compromise (if password leaked)

**Issue**:
- No two-factor authentication
- No multi-factor authentication
- Only password-based auth

---

### 22. Predictable IDs
**Severity**: LOW  
**Risk**: Enumeration

**Issue**:
- UUIDs are good (not sequential)
- But still enumerable
- No obfuscation

---

## 📊 SECURITY RISK MATRIX

| Issue | Severity | Likelihood | Impact | Priority |
|-------|----------|------------|--------|----------|
| JWT Secret Exposure | Critical | High | Critical | P0 |
| Database Credentials | Critical | High | Critical | P0 |
| No Rate Limiting | Critical | High | High | P0 |
| Weak Password Policy | High | High | High | P1 |
| No Input Sanitization | High | Medium | High | P1 |
| Insecure Session Mgmt | High | High | High | P1 |
| CORS Misconfiguration | High | Medium | Medium | P1 |
| No HTTPS Enforcement | High | Medium | High | P1 |
| Insufficient AuthZ | High | Medium | High | P1 |
| Weak OTP | High | Medium | High | P1 |
| Password Reset Issues | High | Medium | High | P2 |
| No Audit Logging | Medium | Low | Medium | P2 |
| Sensitive Data in Logs | Medium | High | Low | P2 |
| No API Versioning | Medium | Low | Medium | P3 |
| Missing Security Headers | Medium | Medium | Low | P2 |
| QR Code Issues | Medium | Medium | Medium | P2 |
| No Payment Verification | Medium | High | High | P1 |
| Error Handling | Medium | Low | Low | P3 |
| No Account Lockout | Low | Medium | Low | P3 |
| No Email Verification | Low | Medium | Low | P3 |
| No 2FA | Low | Low | Medium | P3 |
| Predictable IDs | Low | Low | Low | P4 |

---

## 🛡️ COMPLIANCE CONCERNS

### GDPR (General Data Protection Regulation)
- ❌ No data encryption at rest
- ❌ No data retention policy
- ❌ No right to be forgotten implementation
- ❌ No data export functionality
- ❌ No consent management
- ❌ No privacy policy
- ❌ No data breach notification process

### PCI-DSS (Payment Card Industry)
- ❌ No actual payment processing (good - reduces scope)
- ❌ But payment methods stored (card, UPI)
- ❌ No encryption of payment data
- ❌ No secure payment gateway

### OWASP Top 10 (2021)
1. ✅ Broken Access Control - VULNERABLE
2. ✅ Cryptographic Failures - VULNERABLE
3. ✅ Injection - PARTIALLY PROTECTED (ORM)
4. ✅ Insecure Design - VULNERABLE
5. ✅ Security Misconfiguration - VULNERABLE
6. ✅ Vulnerable Components - NEED AUDIT
7. ✅ Authentication Failures - VULNERABLE
8. ✅ Software & Data Integrity - VULNERABLE
9. ✅ Logging & Monitoring - VULNERABLE
10. ✅ SSRF - NOT APPLICABLE

---

