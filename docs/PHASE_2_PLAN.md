# Phase 2: High Priority Security Fixes - Remaining Tasks

## Current Status

✅ **COMPLETED (3/6 tasks)**:
- Task 2.1: Secure Session Management (HttpOnly Cookies) ✅
- Task 2.2: Fix CORS Configuration ✅
- Task 2.3: Enforce HTTPS & Security Headers ✅

⏳ **REMAINING (3/6 tasks)**:
- Task 2.4: Implement Authorization Checks
- Task 2.5: Strengthen OTP Security
- Task 2.6: Integrate Real Payment Gateway

---

## Task 2.4: Implement Authorization Checks

**Timeline**: 3 days  
**Effort**: High  
**Priority**: P1 - Critical

### What This Means

Currently, the app has authentication (knowing WHO you are) but weak authorization (knowing WHAT you can do). This task adds proper permission checks to ensure:

1. **Resource Ownership Validation**: Users can only access their own data
   - Example: User A cannot view User B's purchases
   - Example: User cannot modify someone else's profile

2. **Role-Based Access Control (RBAC)**: Different roles have different permissions
   - Admin: Can manage all venues, users, bottles, etc.
   - Bartender: Can only redeem at their assigned venue
   - Customer: Can only view/manage their own purchases

3. **Venue-Based Authorization**: Bartenders can only work at their assigned venue
   - Bartender at Venue A cannot redeem QR codes for Venue B
   - Prevents cross-venue fraud

### Current Vulnerabilities

```python
# BAD - No ownership check
@router.get("/purchases/{purchase_id}")
async def get_purchase(purchase_id: str, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    return purchase  # ❌ Any logged-in user can see ANY purchase!
```

### What We'll Implement

```python
# GOOD - With ownership validation
@router.get("/purchases/{purchase_id}")
async def get_purchase(
    purchase_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(404, "Purchase not found")
    
    # Check ownership
    if purchase.user_id != user.id and user.role != "admin":
        raise HTTPException(403, "Not authorized to access this purchase")
    
    return purchase  # ✅ Only owner or admin can see it
```

### Implementation Steps

1. Create authorization helper functions
2. Add ownership validation to all user-specific endpoints
3. Add role checks to admin endpoints
4. Add venue validation to bartender endpoints
5. Create authorization decorators for reusability
6. Test all authorization scenarios

---

## Task 2.5: Strengthen OTP Security

**Timeline**: 2 days  
**Effort**: Medium  
**Priority**: P1 - Important

### What This Means

The current OTP (One-Time Password) system has several security issues:

1. **Hardcoded OTP in Development**: Makes testing easy but is a security risk
2. **Short OTP Length**: 4-6 digits are easy to brute force
3. **Long Expiry Time**: 10-15 minutes is too long
4. **No Rate Limiting**: Attackers can try unlimited OTP guesses
5. **OTP Reuse**: Same OTP can be used multiple times

### Current Issues

```python
# BAD - Current implementation
def create_otp(db: Session, phone: str) -> OTP:
    code = str(random.randint(1000, 9999))  # ❌ Only 4 digits
    expires = datetime.utcnow() + timedelta(minutes=15)  # ❌ Too long
    
    # ❌ Hardcoded OTP in dev
    if settings.ENVIRONMENT == "development":
        code = "1234"
    
    otp = OTP(phone=phone, otp_code=code, expires_at=expires)
    db.add(otp)
    return otp
```

### What We'll Implement

```python
# GOOD - Secure implementation
def create_otp(db: Session, phone: str) -> OTP:
    # ✅ 8-digit OTP (100 million combinations)
    code = str(secrets.randbelow(90000000) + 10000000)
    
    # ✅ Short expiry - 2 minutes
    expires = datetime.utcnow() + timedelta(minutes=2)
    
    # ✅ Invalidate existing OTPs
    db.query(OTP).filter(
        OTP.phone == phone,
        OTP.is_verified == False
    ).update({"is_verified": True})
    
    otp = OTP(phone=phone, otp_code=code, expires_at=expires)
    db.add(otp)
    db.commit()
    return otp

# ✅ Add rate limiting
@router.post("/auth/send-otp")
@limiter.limit("3/hour")  # Only 3 OTP requests per hour
async def send_otp(request: Request, phone: str, db: Session = Depends(get_db)):
    ...

# ✅ Invalidate after use
def verify_otp(db: Session, phone: str, code: str) -> bool:
    otp = db.query(OTP).filter(
        OTP.phone == phone,
        OTP.otp_code == code,
        OTP.is_verified == False,
        OTP.expires_at > datetime.utcnow()
    ).first()
    
    if otp:
        otp.is_verified = True  # ✅ One-time use
        db.commit()
        return True
    return False
```

### Implementation Steps

1. Remove hardcoded OTP (even in development)
2. Increase OTP length to 8 digits
3. Reduce expiry time to 2 minutes
4. Add rate limiting to OTP endpoints
5. Invalidate OTP immediately after use
6. Add attempt tracking (max 3 wrong attempts)
7. Test OTP flow thoroughly

---

## Task 2.6: Integrate Real Payment Gateway

**Timeline**: 5 days  
**Effort**: High  
**Priority**: P1 - Critical for Production

### What This Means

Currently, the app has a mock payment system that:
- Doesn't actually charge money
- Has no payment verification
- No refund mechanism
- No transaction tracking
- Not production-ready

This task integrates a real payment gateway (Razorpay or Stripe) to:
1. Accept real payments
2. Verify payment completion
3. Handle payment failures
4. Support refunds
5. Track all transactions
6. Comply with payment regulations

### Current Mock Implementation

```python
# BAD - Mock payment
@router.post("/purchases/{purchase_id}/payment")
async def process_payment(purchase_id: str):
    # ❌ No actual payment processing
    purchase.payment_status = "completed"
    return {"success": True}  # ❌ Always succeeds
```

### What We'll Implement (Razorpay Example)

```python
# GOOD - Real payment integration
import razorpay

client = razorpay.Client(auth=(
    settings.RAZORPAY_KEY_ID,
    settings.RAZORPAY_KEY_SECRET
))

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
    
    if not purchase:
        raise HTTPException(404, "Purchase not found")
    
    # ✅ Create real Razorpay order
    order = client.order.create({
        "amount": int(purchase.purchase_price * 100),  # Paise
        "currency": "INR",
        "receipt": purchase_id,
        "payment_capture": 1
    })
    
    # ✅ Store order ID
    purchase.payment_order_id = order["id"]
    db.commit()
    
    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"]
    }

# ✅ Webhook to verify payment
@router.post("/webhooks/payment")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    # Verify webhook signature
    signature = request.headers.get("X-Razorpay-Signature")
    body = await request.body()
    
    try:
        client.utility.verify_webhook_signature(
            body.decode(),
            signature,
            settings.RAZORPAY_WEBHOOK_SECRET
        )
    except:
        raise HTTPException(400, "Invalid signature")
    
    # Process payment confirmation
    data = await request.json()
    payment_id = data["payload"]["payment"]["entity"]["id"]
    order_id = data["payload"]["payment"]["entity"]["order_id"]
    
    # Update purchase
    purchase = db.query(Purchase).filter(
        Purchase.payment_order_id == order_id
    ).first()
    
    if purchase:
        purchase.payment_status = "completed"
        purchase.payment_transaction_id = payment_id
        db.commit()
    
    return {"status": "ok"}
```

### Implementation Steps

1. Choose payment provider (Razorpay recommended for India)
2. Set up payment gateway account
3. Add payment gateway SDK to requirements
4. Create payment order endpoint
5. Implement payment verification webhook
6. Add payment status tracking
7. Implement refund mechanism
8. Add transaction logging
9. Test with test API keys
10. Update frontend to use real payment flow

### Payment Gateway Options

**Razorpay** (Recommended for India):
- ✅ Popular in India
- ✅ Supports UPI, cards, wallets
- ✅ Good documentation
- ✅ 2% transaction fee
- ✅ Easy integration

**Stripe** (International):
- ✅ Global leader
- ✅ Excellent documentation
- ✅ 2.9% + ₹2 per transaction
- ⚠️ More complex for Indian market

---

## Summary: What "Additional Security Tasks" Means

The "Additional Security Tasks" section refers to these 3 remaining Phase 2 tasks:

1. **Authorization Checks** - Ensure users can only access their own data
2. **OTP Security** - Make one-time passwords actually secure
3. **Payment Gateway** - Replace mock payments with real payment processing

These are called "additional" because they build on top of the authentication and transport security we've already implemented (HttpOnly cookies, CORS, HTTPS).

---

## Recommended Order

I recommend implementing in this order:

1. **Task 2.4: Authorization Checks** (3 days)
   - Most critical security issue
   - Prevents unauthorized data access
   - Required before production

2. **Task 2.5: OTP Security** (2 days)
   - Important for account security
   - Relatively quick to implement
   - Low risk of breaking existing features

3. **Task 2.6: Payment Gateway** (5 days)
   - Most complex task
   - Requires external service setup
   - Can be done last as it's isolated

---

## Next Steps

Would you like to:
1. Start with Task 2.4 (Authorization Checks)?
2. Start with Task 2.5 (OTP Security)?
3. Start with Task 2.6 (Payment Gateway)?
4. Move to Phase 3 instead?
5. Take a break and test what we've done so far?

Let me know which task you'd like to tackle next!
