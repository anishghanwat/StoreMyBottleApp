"""
Verify that critical operations are idempotent and cannot be undone
"""
from database import SessionLocal
from models import Purchase, Redemption, PaymentStatus, RedemptionStatus
from datetime import datetime, timezone

def verify_idempotency():
    """Verify idempotency of critical operations"""
    db = SessionLocal()
    
    print("=" * 80)
    print("IDEMPOTENCY VERIFICATION REPORT")
    print("=" * 80)
    print()
    
    issues = []
    
    # 1. Check for duplicate redemptions (same QR used twice)
    print("1. CHECKING FOR DUPLICATE REDEMPTIONS")
    print("-" * 80)
    
    # Check if any QR token has multiple REDEEMED redemptions
    from sqlalchemy import func
    duplicate_redemptions = db.query(
        Redemption.qr_token,
        func.count(Redemption.id).label('count')
    ).filter(
        Redemption.status == RedemptionStatus.REDEEMED
    ).group_by(
        Redemption.qr_token
    ).having(
        func.count(Redemption.id) > 1
    ).all()
    
    if duplicate_redemptions:
        print(f"   ❌ FOUND {len(duplicate_redemptions)} QR codes redeemed multiple times!")
        for qr_token, count in duplicate_redemptions:
            print(f"      - QR Token {qr_token[:20]}... redeemed {count} times")
            issues.append(f"QR token {qr_token} redeemed {count} times")
    else:
        print("   ✅ No duplicate redemptions found")
    
    print()
    
    # 2. Check for purchases confirmed multiple times
    print("2. CHECKING PURCHASE STATE TRANSITIONS")
    print("-" * 80)
    
    # Check if any purchase has been modified after confirmation
    confirmed_purchases = db.query(Purchase).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).all()
    
    print(f"   Found {len(confirmed_purchases)} confirmed purchases")
    
    # Check if any have suspicious patterns
    suspicious = []
    for p in confirmed_purchases:
        if p.purchased_at and p.updated_at:
            # If updated significantly after purchase, might be suspicious
            time_diff = (p.updated_at - p.purchased_at).total_seconds()
            if time_diff > 60:  # More than 1 minute after purchase
                suspicious.append((p.id, time_diff))
    
    if suspicious:
        print(f"   ⚠️  Found {len(suspicious)} purchases updated after confirmation:")
        for purchase_id, diff in suspicious[:5]:
            print(f"      - Purchase {purchase_id[:8]}... updated {diff:.0f}s after confirmation")
    else:
        print("   ✅ No suspicious purchase modifications")
    
    print()
    
    # 3. Check redemption status consistency
    print("3. CHECKING REDEMPTION STATUS CONSISTENCY")
    print("-" * 80)
    
    # Redeemed redemptions should have redeemed_at timestamp
    redeemed_without_timestamp = db.query(Redemption).filter(
        Redemption.status == RedemptionStatus.REDEEMED,
        Redemption.redeemed_at.is_(None)
    ).count()
    
    if redeemed_without_timestamp > 0:
        print(f"   ❌ Found {redeemed_without_timestamp} redeemed redemptions without timestamp")
        issues.append(f"{redeemed_without_timestamp} redeemed redemptions missing timestamp")
    else:
        print("   ✅ All redeemed redemptions have timestamps")
    
    # Pending/Expired redemptions should NOT have redeemed_at
    invalid_timestamps = db.query(Redemption).filter(
        Redemption.status.in_([RedemptionStatus.PENDING, RedemptionStatus.EXPIRED]),
        Redemption.redeemed_at.isnot(None)
    ).count()
    
    if invalid_timestamps > 0:
        print(f"   ❌ Found {invalid_timestamps} non-redeemed redemptions with timestamp")
        issues.append(f"{invalid_timestamps} non-redeemed redemptions have timestamp")
    else:
        print("   ✅ No invalid redemption timestamps")
    
    print()
    
    # 4. Check purchase status consistency
    print("4. CHECKING PURCHASE STATUS CONSISTENCY")
    print("-" * 80)
    
    # Confirmed purchases should have purchased_at
    confirmed_without_timestamp = db.query(Purchase).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at.is_(None)
    ).count()
    
    if confirmed_without_timestamp > 0:
        print(f"   ❌ Found {confirmed_without_timestamp} confirmed purchases without timestamp")
        issues.append(f"{confirmed_without_timestamp} confirmed purchases missing timestamp")
    else:
        print("   ✅ All confirmed purchases have timestamps")
    
    # Pending purchases should NOT have purchased_at
    pending_with_timestamp = db.query(Purchase).filter(
        Purchase.payment_status == PaymentStatus.PENDING,
        Purchase.purchased_at.isnot(None)
    ).count()
    
    if pending_with_timestamp > 0:
        print(f"   ❌ Found {pending_with_timestamp} pending purchases with timestamp")
        issues.append(f"{pending_with_timestamp} pending purchases have timestamp")
    else:
        print("   ✅ No invalid purchase timestamps")
    
    print()
    
    # 5. Check bottle volume consistency
    print("5. CHECKING BOTTLE VOLUME CONSISTENCY")
    print("-" * 80)
    
    # Check if remaining_ml > total_ml
    invalid_volumes = db.query(Purchase).filter(
        Purchase.remaining_ml > Purchase.total_ml
    ).count()
    
    if invalid_volumes > 0:
        print(f"   ❌ Found {invalid_volumes} purchases with remaining > total")
        issues.append(f"{invalid_volumes} purchases have invalid volumes")
    else:
        print("   ✅ All bottle volumes are valid")
    
    # Check if remaining_ml is negative
    negative_volumes = db.query(Purchase).filter(
        Purchase.remaining_ml < 0
    ).count()
    
    if negative_volumes > 0:
        print(f"   ❌ Found {negative_volumes} purchases with negative volume")
        issues.append(f"{negative_volumes} purchases have negative volumes")
    else:
        print("   ✅ No negative volumes")
    
    print()
    
    # 6. Check for race conditions in redemptions
    print("6. CHECKING FOR POTENTIAL RACE CONDITIONS")
    print("-" * 80)
    
    # Check if any purchase has redemptions that exceed total volume
    from sqlalchemy import func
    over_redeemed = db.query(
        Purchase.id,
        Purchase.total_ml,
        Purchase.remaining_ml,
        func.sum(Redemption.peg_size_ml).label('total_redeemed')
    ).join(
        Redemption, Purchase.id == Redemption.purchase_id
    ).filter(
        Redemption.status == RedemptionStatus.REDEEMED
    ).group_by(
        Purchase.id, Purchase.total_ml, Purchase.remaining_ml
    ).all()
    
    race_conditions = []
    for purchase_id, total_ml, remaining_ml, total_redeemed in over_redeemed:
        expected_remaining = total_ml - (total_redeemed or 0)
        if abs(expected_remaining - remaining_ml) > 1:  # Allow 1ml tolerance
            race_conditions.append((purchase_id, expected_remaining, remaining_ml))
    
    if race_conditions:
        print(f"   ⚠️  Found {len(race_conditions)} purchases with volume mismatches:")
        for purchase_id, expected, actual in race_conditions[:5]:
            print(f"      - Purchase {purchase_id[:8]}... expected {expected}ml, actual {actual}ml")
        issues.append(f"{len(race_conditions)} purchases have volume mismatches")
    else:
        print("   ✅ No volume mismatches detected")
    
    print()
    
    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    if issues:
        print(f"   ❌ FOUND {len(issues)} ISSUES:")
        for issue in issues:
            print(f"      - {issue}")
    else:
        print("   ✅ ALL CHECKS PASSED - System is idempotent and consistent!")
    
    print()
    print("=" * 80)
    
    db.close()
    
    return len(issues) == 0

if __name__ == "__main__":
    success = verify_idempotency()
    exit(0 if success else 1)
