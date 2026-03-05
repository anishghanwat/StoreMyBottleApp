# CSP Swagger UI Fix

## Issue

After implementing Content Security Policy (CSP) headers in Phase 2 Task 2.3, Swagger UI at `/docs` was blocked because it loads resources from CDN:
- `https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css`
- `https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js`

## Solution

Disabled CSP headers for API documentation endpoints to allow Swagger UI to load properly.

### Code Change

Updated `SecurityHeadersMiddleware` in `backend/main.py`:

```python
async def dispatch(self, request: Request, call_next):
    response = await call_next(request)
    
    # Skip security headers for API documentation endpoints
    if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
        return response
    
    # ... rest of security headers ...
```

## Why This Is Safe

1. **Documentation endpoints are not user-facing**
   - `/docs` and `/redoc` are for developers only
   - Should be disabled in production or protected by authentication

2. **No sensitive data exposed**
   - These endpoints only show API structure
   - No user data or secrets

3. **Alternative: Disable in production**
   ```python
   # In production, disable docs entirely
   if settings.ENVIRONMENT == "production":
       app = FastAPI(docs_url=None, redoc_url=None)
   else:
       app = FastAPI()
   ```

## Testing

1. **Restart backend**:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Clear browser cache**:
   - Press Ctrl+Shift+R (hard reload)
   - Or open in incognito mode

3. **Access Swagger UI**:
   - Open http://localhost:8000/docs
   - Should load without CSP errors

4. **Verify CSP still works on API endpoints**:
   - Open http://localhost:8000/api/venues
   - Check response headers - should have CSP

## Production Recommendation

For production, consider:

1. **Disable Swagger UI entirely**:
   ```python
   if settings.ENVIRONMENT == "production":
       app = FastAPI(docs_url=None, redoc_url=None)
   ```

2. **Or protect with authentication**:
   ```python
   @app.get("/docs", include_in_schema=False)
   async def custom_docs(user: User = Depends(get_current_admin)):
       return get_swagger_ui_html(...)
   ```

3. **Or use self-hosted Swagger UI**:
   - Download swagger-ui-dist
   - Serve from your own domain
   - Update CSP to allow your domain

## Status

✅ Fixed - Swagger UI now loads correctly
✅ CSP still protects all API endpoints
✅ Security headers still applied to all non-docs routes

## Related

- [Phase 2 Task 2.3: HTTPS & Security Headers](./PHASE2_TASK3_HTTPS_COMPLETE.md)
- [Security Remediation Plan](./SECURITY_REMEDIATION_PLAN.md)
