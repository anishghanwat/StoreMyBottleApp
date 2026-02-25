# Form Validation Quick Reference

## ✅ All Forms Are Validated!

### Customer Forms

**Login/Signup** (`frontend/src/app/screens/Login.tsx`)
- Email: `type="email"` + `required` + `EmailStr` (backend)
- Password: `type="password"` + `required` + `minLength={6}`
- Name: `type="text"` + `required` (signup only)

**Phone OTP**
- Phone: `pattern=r"^\+?[1-9]\d{1,14}$"` (backend)
- OTP: `min_length=6, max_length=6` (backend)

---

### Bartender Forms

**Login/Signup** (`frontend-bartender/src/app/pages/BartenderLogin.tsx`)
- Email: `type="email"` + `required` + `EmailStr` (backend)
- Password: `type="password"` + `required` + show/hide toggle
- Name: `type="text"` + `required` (signup only)
- Phone: `type="tel"` + `required` (signup only)
- Role Check: Must be "bartender" or "admin"

---

### Admin Forms

**Login** (`admin/src/components/Login.tsx`)
- Email: `type="email"` + `required` + `EmailStr` (backend)
- Password: `type="password"` + `required`
- Role Check: Must be "admin"

---

### Purchase Forms

**Create Purchase**
- bottle_id: `required` (string)
- venue_id: `required` (string)

**Confirm Purchase**
- payment_method: `enum` (upi, cash, card)

---

### Redemption Forms

**Generate QR**
- purchase_id: `required` (string)
- peg_size_ml: `ge=30, le=60` (30-60ml only)

**Validate QR**
- qr_token: `required` (string)
- Additional checks: expired, already used, insufficient volume

---

## Validation Patterns

### Email Validation
```python
# Backend
email: EmailStr  # Pydantic validates format

# Frontend
<input type="email" required />
```

### Password Validation
```python
# Backend
password: str  # Required string

# Frontend
<input type="password" required minLength={6} />
```

### Phone Validation
```python
# Backend
phone: str = Field(..., pattern=r"^\+?[1-9]\d{1,14}$")

# Frontend
<input type="tel" required />
```

### Range Validation
```python
# Backend
peg_size_ml: int = Field(..., ge=30, le=60)
```

### Enum Validation
```python
# Backend
payment_method: PaymentMethod  # Enum type
role: str = Field(..., pattern="^(user|bartender|admin)$")
```

---

## Error Handling

### Frontend
```tsx
{error && (
  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
    <p className="text-red-400 text-sm">{error}</p>
  </div>
)}
```

### Backend
```python
raise HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="Validation error message"
)
```

---

## Security Features

✅ Password hashing (bcrypt)  
✅ JWT authentication  
✅ Refresh tokens  
✅ Session management  
✅ Role-based access control  
✅ Input sanitization (Pydantic)  
✅ SQL injection prevention (ORM)  
✅ XSS prevention (React)  

---

## Testing

All validation tested in E2E tests:
- ✅ Valid inputs accepted
- ✅ Invalid inputs rejected
- ✅ Error messages displayed
- ✅ Security checks working

---

**Status:** ✅ All forms properly validated  
**Last Updated:** February 25, 2026
