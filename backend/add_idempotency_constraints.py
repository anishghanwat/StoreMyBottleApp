"""
Add database constraints to enforce idempotency
"""
from sqlalchemy import text
from database import engine

def add_constraints():
    """Add database constraints to prevent duplicate operations"""
    
    print("=" * 80)
    print("ADDING IDEMPOTENCY CONSTRAINTS")
    print("=" * 80)
    print()
    
    with engine.connect() as conn:
        
        # 1. Add check constraint: remaining_ml >= 0
        print("1. Adding constraint: remaining_ml >= 0")
        try:
            conn.execute(text("""
                ALTER TABLE purchases 
                ADD CONSTRAINT chk_remaining_ml_positive 
                CHECK (remaining_ml >= 0)
            """))
            conn.commit()
            print("   ✅ Added constraint: remaining_ml >= 0")
        except Exception as e:
            if "Duplicate" in str(e) or "already exists" in str(e):
                print("   ℹ️  Constraint already exists")
            else:
                print(f"   ⚠️  Could not add constraint: {e}")
        
        print()
        
        # 2. Add check constraint: remaining_ml <= total_ml
        print("2. Adding constraint: remaining_ml <= total_ml")
        try:
            conn.execute(text("""
                ALTER TABLE purchases 
                ADD CONSTRAINT chk_remaining_ml_valid 
                CHECK (remaining_ml <= total_ml)
            """))
            conn.commit()
            print("   ✅ Added constraint: remaining_ml <= total_ml")
        except Exception as e:
            if "Duplicate" in str(e) or "already exists" in str(e):
                print("   ℹ️  Constraint already exists")
            else:
                print(f"   ⚠️  Could not add constraint: {e}")
        
        print()
        
        # 3. Add check constraint: peg_size_ml in (30, 45, 60)
        print("3. Adding constraint: peg_size_ml in (30, 45, 60)")
        try:
            conn.execute(text("""
                ALTER TABLE redemptions 
                ADD CONSTRAINT chk_peg_size_valid 
                CHECK (peg_size_ml IN (30, 45, 60))
            """))
            conn.commit()
            print("   ✅ Added constraint: peg_size_ml in (30, 45, 60)")
        except Exception as e:
            if "Duplicate" in str(e) or "already exists" in str(e):
                print("   ℹ️  Constraint already exists")
            else:
                print(f"   ⚠️  Could not add constraint: {e}")
        
        print()
        
        # 4. Add index on redemption status for faster queries
        print("4. Adding index on redemption status")
        try:
            conn.execute(text("""
                CREATE INDEX idx_redemptions_status 
                ON redemptions(status)
            """))
            conn.commit()
            print("   ✅ Added index on redemption status")
        except Exception as e:
            if "Duplicate" in str(e) or "already exists" in str(e):
                print("   ℹ️  Index already exists")
            else:
                print(f"   ⚠️  Could not add index: {e}")
        
        print()
        
        # 5. Add index on purchase status for faster queries
        print("5. Adding index on purchase payment_status")
        try:
            conn.execute(text("""
                CREATE INDEX idx_purchases_payment_status 
                ON purchases(payment_status)
            """))
            conn.commit()
            print("   ✅ Added index on purchase payment_status")
        except Exception as e:
            if "Duplicate" in str(e) or "already exists" in str(e):
                print("   ℹ️  Index already exists")
            else:
                print(f"   ⚠️  Could not add index: {e}")
        
        print()
        
    print("=" * 80)
    print("CONSTRAINTS ADDED")
    print("=" * 80)
    print()
    print("These constraints ensure:")
    print("  - Bottle volumes cannot go negative")
    print("  - Remaining volume cannot exceed total volume")
    print("  - Peg sizes are valid (30, 45, or 60 ml)")
    print("  - Faster queries on status fields")
    print()

if __name__ == "__main__":
    add_constraints()
