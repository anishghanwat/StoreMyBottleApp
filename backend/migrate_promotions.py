"""
Migration script to add promotions table and update purchases table
Run this script to add promotion support to the database
"""

from sqlalchemy import text
from database import engine

def migrate():
    """Add promotions table and update purchases table"""
    
    with engine.connect() as conn:
        # Add promotion_code and discount_amount to purchases table
        try:
            conn.execute(text("""
                ALTER TABLE purchases 
                ADD COLUMN promotion_code VARCHAR(50) NULL,
                ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL
            """))
            conn.commit()
            print("✅ Added promotion_code and discount_amount columns to purchases table")
        except Exception as e:
            print(f"⚠️  Purchases table columns might already exist: {e}")
        
        # Create promotions table
        try:
            conn.execute(text("""
                CREATE TABLE promotions (
                    id VARCHAR(36) PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    description VARCHAR(500),
                    type ENUM('percentage', 'fixed_amount', 'free_peg') NOT NULL,
                    value DECIMAL(10, 2) NOT NULL,
                    min_purchase_amount DECIMAL(10, 2),
                    max_discount_amount DECIMAL(10, 2),
                    usage_limit INT,
                    usage_count INT DEFAULT 0 NOT NULL,
                    per_user_limit INT,
                    venue_id VARCHAR(36),
                    valid_from DATETIME NOT NULL,
                    valid_until DATETIME NOT NULL,
                    status ENUM('active', 'inactive', 'expired') DEFAULT 'active' NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_code (code),
                    FOREIGN KEY (venue_id) REFERENCES venues(id)
                )
            """))
            conn.commit()
            print("✅ Created promotions table")
        except Exception as e:
            print(f"⚠️  Promotions table might already exist: {e}")
        
        print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    print("Starting promotions migration...")
    migrate()
