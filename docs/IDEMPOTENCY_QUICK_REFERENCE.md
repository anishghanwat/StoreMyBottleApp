# Idempotency Quick Reference

## Key Guarantees

| Operation | Can Be Done Twice? | Protection |
|-----------|-------------------|------------|
| Redeem QR Code | ❌ NO | Status check + Row lock + DB constraint |
| Confirm Purchase | ❌ NO | Status check + Row lock |
| Deduct Bottle Volume | ❌ NO | Row lock + DB constraint |
| Generate QR Code | ✅ YES | Creates new token each time |

## State Transitions (One-Way Only)

### Purchase
```
PENDING → CONFIRMED ✓
PENDING → FAILED ✓
CONFIRMED → PENDING ✗ (blocked)
FAILED → CONFIRMED ✗ (blocked)
```

### Redemption
```
PENDING → REDEEMED ✓
PENDING → EXPIRED ✓
PENDING → CANCELLED ✓
REDEEMED → PENDING ✗ (blocked)
```

## Database Constraints

```sql
-- Bottle volumes must be valid
remaining_ml >= 0
remaining_ml <= total_ml

-- Peg sizes must be standard
peg_size_ml IN (30, 45, 60)
```

## Error Handling

### QR Code Already Used
```json
{
  "success": false,
  "message": "QR code already used"
}
```

### Purchase Already Processed
```json
{
  "status_code": 400,
  "detail": "Purchase already processed with status: confirmed"
}
```

### Insufficient Volume
```json
{
  "success": false,
  "message": "Insufficient volume in bottle"
}
```

## Testing Commands

```bash
# Verify idempotency
cd backend
python verify_idempotency.py

# Add constraints (run once)
python add_idempotency_constraints.py
```

## Code Patterns

### Safe Purchase Confirmation
```python
# Get with lock
purchase = db.query(Purchase).filter(
    Purchase.id == purchase_id
).with_for_update().first()

# Check status
if purchase.payment_status != PaymentStatus.PENDING:
    raise HTTPException(400, "Already processed")

# Update atomically
purchase.payment_status = PaymentStatus.CONFIRMED
purchase.purchased_at = datetime.now(timezone.utc)

try:
    db.commit()
except Exception as e:
    db.rollback()
    raise
```

### Safe QR Redemption
```python
# Check status first
if redemption.status == RedemptionStatus.REDEEMED:
    return {"success": False, "message": "Already used"}

# Get purchase with lock
purchase = db.query(Purchase).filter(
    Purchase.id == redemption.purchase_id
).with_for_update().first()

# Double-check status
db.refresh(redemption)
if redemption.status != RedemptionStatus.PENDING:
    return {"success": False, "message": "Status changed"}

# Update atomically
purchase.remaining_ml -= redemption.peg_size_ml
redemption.status = RedemptionStatus.REDEEMED
redemption.redeemed_at = datetime.now(timezone.utc)

try:
    db.commit()
except Exception as e:
    db.rollback()
    raise
```

## Common Mistakes to Avoid

### ❌ Don't: Check status without lock
```python
# BAD - Race condition possible
if purchase.payment_status == PaymentStatus.PENDING:
    purchase.payment_status = PaymentStatus.CONFIRMED
    db.commit()
```

### ✅ Do: Lock then check
```python
# GOOD - Safe from race conditions
purchase = db.query(Purchase).with_for_update().first()
if purchase.payment_status == PaymentStatus.PENDING:
    purchase.payment_status = PaymentStatus.CONFIRMED
    db.commit()
```

### ❌ Don't: Forget to rollback
```python
# BAD - Leaves transaction open on error
db.commit()
```

### ✅ Do: Use try-except
```python
# GOOD - Rolls back on error
try:
    db.commit()
except Exception as e:
    db.rollback()
    raise
```

## Verification Checklist

Before deploying:
- [ ] Run `verify_idempotency.py` - all checks pass
- [ ] Database constraints added
- [ ] Test double redemption - should fail
- [ ] Test double payment - should fail
- [ ] Test concurrent operations - only one succeeds
- [ ] Test expired QR - should fail
- [ ] Check error messages are user-friendly

## Monitoring

Watch for these in logs:
- "QR code already used" - Normal, user tried to reuse QR
- "Purchase already processed" - Normal, duplicate request
- "Failed to process redemption" - Investigate, might be DB issue
- "Failed to confirm purchase" - Investigate, might be DB issue

## Rollback Procedure

If you need to manually fix data:

```sql
-- NEVER do this in production without approval
-- This is for emergency recovery only

-- Undo a redemption (DANGEROUS)
UPDATE redemptions 
SET status = 'PENDING', redeemed_at = NULL 
WHERE id = 'redemption-id';

UPDATE purchases 
SET remaining_ml = remaining_ml + 60 
WHERE id = 'purchase-id';

-- Better: Create compensating transaction
-- Add volume back as a new purchase or adjustment
```

## Support

If users report:
- "Can't redeem my QR" → Check if already redeemed or expired
- "Payment not working" → Check if already confirmed
- "Bottle shows wrong volume" → Run verification script

Check database:
```sql
-- Check redemption status
SELECT * FROM redemptions WHERE qr_token = 'token';

-- Check purchase status
SELECT * FROM purchases WHERE id = 'purchase-id';

-- Check bottle volume
SELECT total_ml, remaining_ml, 
       (SELECT SUM(peg_size_ml) FROM redemptions 
        WHERE purchase_id = purchases.id AND status = 'REDEEMED') as redeemed
FROM purchases WHERE id = 'purchase-id';
```
