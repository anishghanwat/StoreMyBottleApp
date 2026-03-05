# Security Quick Checklist - StoreMyBottle

## 🚨 BEFORE PRODUCTION DEPLOYMENT

### Critical Security Checklist

#### Authentication & Authorization
- [ ] JWT secret is strong (64+ characters) and unique
- [ ] JWT secret is stored in environment variables only
- [ ] JWT secret is different for dev/staging/prod
- [ ] Rate limiting on login endpoint (5 attempts/minute)
- [ ] Rate limiting on signup endpoint (3 attempts/hour)
- [ ] Rate limiting on password reset (3 attempts/day)
- [ ] Password strength enforced on backend (12+ chars, complexity)
- [ ] Passwords hashed with bcrypt (12 rounds minimum)
- [ ] Role-based access control (RBAC) implemented
- [ ] Resource ownership validation on all endpoints
- [ ] Admin-only endpoints protected
- [ ] Bartender venue-based authorization working

#### Session Management
- [ ] Tokens stored in HttpOnly cookies (not localStorage)
- [ ] Secure flag set on cookies (HTTPS only)
- [ ] SameSite flag set on cookies (strict)
- [ ] CSRF protection implemented
- [ ] Session expiry working (30 minutes)
- [ ] Refresh token rotation working
- [ ] Sessions invalidated on password change
- [ ] Sessions invalidated on logout
- [ ] Expired sessions cleaned up regularly

#### Database Security
- [ ] Database credentials in environment variables
- [ ] Database user has least privilege (not root)
- [ ] Database connections use SSL/TLS
- [ ] SQL injection protection (using ORM)
- [ ] Database backups encrypted
- [ ] Database access logs enabled
- [ ] Connection pooling configured properly

#### Input Validation
- [ ] All user inputs validated on backend
- [ ] HTML sanitization on text fields
- [ ] Email format validation
- [ ] Phone format validation
- [ ] URL format validation
- [ ] Length limits on all fields
- [ ] Special characters handled properly
- [ ] File upload validation (if applicable)

#### Network Security
- [ ] HTTPS enforced on all endpoints
- [ ] HTTP redirects to HTTPS
- [ ] Valid SSL certificate installed
- [ ] HSTS header configured (1 year)
- [ ] CORS properly configured (no wildcards)
- [ ] Only necessary origins whitelisted
- [ ] TLS 1.2+ only (no SSL, TLS 1.0, TLS 1.1)

#### Security Headers
- [ ] Strict-Transport-Security header set
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy configured
- [ ] Content-Security-Policy configured
- [ ] Permissions-Policy configured

#### Logging & Monitoring
- [ ] Audit logging implemented
- [ ] Login attempts logged (success/failure)
- [ ] Admin actions logged
- [ ] Data modifications logged
- [ ] Failed authorization attempts logged
- [ ] No passwords in logs
- [ ] No tokens in logs
- [ ] No OTP codes in logs
- [ ] Log rotation configured
- [ ] Logs monitored for suspicious activity

#### Payment Security
- [ ] Real payment gateway integrated
- [ ] Payment verification implemented
- [ ] Webhook signature verification
- [ ] Payment status tracking
- [ ] Refund mechanism implemented
- [ ] No card data stored locally
- [ ] PCI-DSS compliance (if storing card data)

#### OTP Security
- [ ] OTP is 8 digits (not 6)
- [ ] OTP expiry is 2 minutes (not 5)
- [ ] OTP invalidated after use
- [ ] Rate limiting on OTP generation (3/hour)
- [ ] Rate limiting on OTP verification (3 attempts)
- [ ] No hardcoded OTP in any environment
- [ ] OTP sent via secure channel

#### QR Code Security
- [ ] QR tokens are cryptographically secure
- [ ] QR expiry is 10 minutes (not 15)
- [ ] QR codes are one-time use
- [ ] QR validation checks expiry
- [ ] QR validation checks status
- [ ] Device binding implemented (optional)

#### Error Handling
- [ ] Generic error messages in production
- [ ] No stack traces exposed
- [ ] No database errors exposed
- [ ] Error logging configured
- [ ] 404 for unauthorized resources (not 403)

#### Dependency Security
- [ ] All dependencies up to date
- [ ] No known vulnerabilities (run `safety check`)
- [ ] Dependency scanning in CI/CD
- [ ] Regular dependency updates scheduled

#### Environment Configuration
- [ ] .env files not committed to git
- [ ] .env.example has no real secrets
- [ ] Different secrets for each environment
- [ ] Environment variables validated on startup
- [ ] Secrets rotation plan in place

---

## 🧪 SECURITY TESTING CHECKLIST

### Before Each Deployment

#### Automated Tests
- [ ] Run security linter (`bandit`)
- [ ] Run dependency scanner (`safety check`)
- [ ] Run unit tests (100% pass)
- [ ] Run integration tests (100% pass)
- [ ] Run API tests (100% pass)

#### Manual Tests
- [ ] Test login with wrong password (should fail)
- [ ] Test login with correct password (should work)
- [ ] Test rate limiting (should block after limit)
- [ ] Test password reset flow (should work)
- [ ] Test session expiry (should logout)
- [ ] Test CORS (should block unauthorized origins)
- [ ] Test authorization (should block unauthorized access)
- [ ] Test XSS attempts (should be sanitized)
- [ ] Test SQL injection (should be blocked)

#### Security Scans
- [ ] Run OWASP ZAP scan
- [ ] Run SSL Labs test (A+ rating)
- [ ] Run security headers test (A+ rating)
- [ ] Check for exposed secrets (git-secrets)
- [ ] Review audit logs

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All critical issues fixed
- [ ] All high-priority issues fixed
- [ ] Security testing completed
- [ ] Penetration testing completed (optional)
- [ ] Security review approved
- [ ] Backup plan in place
- [ ] Rollback plan in place
- [ ] Incident response plan ready

### Post-Deployment
- [ ] Monitor error rates
- [ ] Monitor failed login attempts
- [ ] Monitor API response times
- [ ] Check security logs
- [ ] Verify HTTPS working
- [ ] Verify rate limiting working
- [ ] Test critical flows
- [ ] Update documentation

---

## 🚨 INCIDENT RESPONSE CHECKLIST

### If Security Breach Detected

#### Immediate Actions (First Hour)
- [ ] Isolate affected systems
- [ ] Revoke compromised credentials
- [ ] Invalidate all sessions
- [ ] Enable maintenance mode
- [ ] Notify security team
- [ ] Preserve evidence (logs, backups)

#### Investigation (First 24 Hours)
- [ ] Identify breach scope
- [ ] Identify affected users
- [ ] Identify compromised data
- [ ] Identify attack vector
- [ ] Document timeline
- [ ] Collect forensic evidence

#### Remediation (First Week)
- [ ] Fix vulnerability
- [ ] Deploy security patches
- [ ] Reset all passwords
- [ ] Notify affected users
- [ ] Notify authorities (if required)
- [ ] Update security measures
- [ ] Conduct post-mortem

---

## 📞 EMERGENCY CONTACTS

### Security Team
- Security Lead: [Name/Email]
- DevOps Lead: [Name/Email]
- CTO: [Name/Email]

### External Resources
- Hosting Provider Support: [Contact]
- Security Consultant: [Contact]
- Legal Team: [Contact]

---

## 📚 QUICK REFERENCE

### Important Commands

```bash
# Check for security issues
bandit -r backend/

# Check dependencies
safety check

# Run tests
pytest tests/

# Check SSL certificate
openssl s_client -connect yourdomain.com:443

# Test rate limiting
ab -n 100 -c 10 https://api.yourdomain.com/api/auth/login
```

### Important Files
- `backend/.env` - Environment variables (NEVER commit!)
- `backend/auth.py` - Authentication logic
- `backend/main.py` - CORS and middleware
- `docs/SECURITY_ANALYSIS.md` - Full analysis
- `docs/SECURITY_REMEDIATION_PLAN.md` - Fix guide

---

## ✅ SIGN-OFF

Before deploying to production, this checklist must be reviewed and signed off by:

- [ ] Development Lead: _________________ Date: _______
- [ ] Security Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______
- [ ] CTO/Technical Director: _________________ Date: _______

---

**Remember**: If you're not sure about any item, DON'T deploy to production!

