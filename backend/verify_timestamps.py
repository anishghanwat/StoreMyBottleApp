"""
Verify all timestamps in the application are timezone-aware and correct
"""
from datetime import datetime, timezone, timedelta
from database import SessionLocal
from models import Purchase, Redemption, User, Venue, Bottle, PaymentStatus, RedemptionStatus
from sqlalchemy import inspect

def verify_timestamps():
    """Verify all timestamp fields are timezone-aware"""
    db = SessionLocal()
    
    print("=" * 80)
    print("TIMESTAMP VERIFICATION REPORT")
    print("=" * 80)
    print()
    
    # Check database timezone settings
    print("1. DATABASE TIMEZONE CHECK")
    print("-" * 80)
    from sqlalchemy import text
    result = db.execute(text("SELECT @@global.time_zone, @@session.time_zone;")).fetchone()
    print(f"   Global timezone: {result[0]}")
    print(f"   Session timezone: {result[1]}")
    print()
    
    # Check model definitions
    print("2. MODEL TIMESTAMP FIELDS")
    print("-" * 80)
    models_to_check = [User, Venue, Bottle, Purchase, Redemption]
    
    for model in models_to_check:
        print(f"\n   {model.__tablename__}:")
        mapper = inspect(model)
        for column in mapper.columns:
            if 'DateTime' in str(column.type):
                has_tz = getattr(column.type, 'timezone', False)
                print(f"      - {column.name}: DateTime(timezone={has_tz})")
    
    print()
    
    # Check actual data
    print("3. ACTUAL DATA VERIFICATION")
    print("-" * 80)
    
    # Check purchases
    recent_purchases = db.query(Purchase).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).order_by(Purchase.created_at.desc()).limit(5).all()
    
    print(f"\n   Recent Purchases ({len(recent_purchases)} found):")
    for p in recent_purchases:
        print(f"      Purchase ID: {p.id[:8]}...")
        print(f"         created_at: {p.created_at} (tzinfo: {p.created_at.tzinfo})")
        if p.purchased_at:
            print(f"         purchased_at: {p.purchased_at} (tzinfo: {p.purchased_at.tzinfo})")
            
            # Calculate expiry
            purchase_date = p.purchased_at if p.purchased_at else p.created_at
            if purchase_date.tzinfo is None:
                purchase_date = purchase_date.replace(tzinfo=timezone.utc)
            
            expiry = purchase_date + timedelta(days=30)
            now = datetime.now(timezone.utc)
            days_until_expiry = (expiry - now).days
            
            print(f"         Expires: {expiry}")
            print(f"         Days until expiry: {days_until_expiry}")
        print()
    
    # Check redemptions
    recent_redemptions = db.query(Redemption).order_by(
        Redemption.created_at.desc()
    ).limit(5).all()
    
    print(f"\n   Recent Redemptions ({len(recent_redemptions)} found):")
    for r in recent_redemptions:
        print(f"      Redemption ID: {r.id[:8]}...")
        print(f"         created_at: {r.created_at} (tzinfo: {r.created_at.tzinfo})")
        print(f"         qr_expires_at: {r.qr_expires_at} (tzinfo: {r.qr_expires_at.tzinfo})")
        
        # Check if expired
        expiry = r.qr_expires_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        
        now = datetime.now(timezone.utc)
        is_expired = now > expiry
        time_diff = (expiry - now).total_seconds() / 60  # minutes
        
        print(f"         Status: {r.status}")
        print(f"         Is Expired: {is_expired}")
        print(f"         Time until expiry: {time_diff:.1f} minutes")
        
        if r.redeemed_at:
            print(f"         redeemed_at: {r.redeemed_at} (tzinfo: {r.redeemed_at.tzinfo})")
        print()
    
    # Summary
    print()
    print("4. SUMMARY")
    print("-" * 80)
    
    issues = []
    
    # Check for timezone-naive timestamps
    for p in recent_purchases:
        if p.created_at.tzinfo is None:
            issues.append(f"Purchase {p.id[:8]} has timezone-naive created_at")
        if p.purchased_at and p.purchased_at.tzinfo is None:
            issues.append(f"Purchase {p.id[:8]} has timezone-naive purchased_at")
    
    for r in recent_redemptions:
        if r.created_at.tzinfo is None:
            issues.append(f"Redemption {r.id[:8]} has timezone-naive created_at")
        if r.qr_expires_at.tzinfo is None:
            issues.append(f"Redemption {r.id[:8]} has timezone-naive qr_expires_at")
        if r.redeemed_at and r.redeemed_at.tzinfo is None:
            issues.append(f"Redemption {r.id[:8]} has timezone-naive redeemed_at")
    
    if issues:
        print("   ⚠️  ISSUES FOUND:")
        for issue in issues:
            print(f"      - {issue}")
    else:
        print("   ✅ All timestamps are timezone-aware!")
    
    print()
    print("=" * 80)
    
    db.close()

if __name__ == "__main__":
    verify_timestamps()
