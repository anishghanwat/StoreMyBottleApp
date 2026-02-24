#!/usr/bin/env python3
"""
Migration script to add system_settings table
"""

from sqlalchemy import create_engine, text
from config import settings
import sys

def migrate():
    """Add system_settings table"""
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL to create system_settings table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS system_settings (
        id VARCHAR(36) PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        data_type VARCHAR(20) DEFAULT 'string',
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_key (setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # Default settings to insert
    default_settings = [
        # General Settings
        ("app_name", "StoreMyBottle", "general", "Application name", "string", True),
        ("app_description", "Bottle storage and redemption service", "general", "Application description", "string", True),
        ("support_email", "support@storemybottle.com", "general", "Support email address", "string", True),
        ("support_phone", "+1234567890", "general", "Support phone number", "string", True),
        
        # Feature Toggles
        ("enable_promotions", "true", "features", "Enable promotions system", "boolean", False),
        ("enable_support_tickets", "true", "features", "Enable support ticket system", "boolean", False),
        ("enable_audit_logs", "true", "features", "Enable audit logging", "boolean", False),
        ("enable_user_registration", "true", "features", "Allow new user registration", "boolean", False),
        ("enable_bartender_approval", "true", "features", "Require admin approval for bartenders", "boolean", False),
        
        # Notification Settings
        ("notify_new_purchase", "true", "notifications", "Notify on new purchase", "boolean", False),
        ("notify_new_redemption", "true", "notifications", "Notify on new redemption", "boolean", False),
        ("notify_new_ticket", "true", "notifications", "Notify on new support ticket", "boolean", False),
        ("notify_low_inventory", "true", "notifications", "Notify on low inventory", "boolean", False),
        
        # Business Rules
        ("min_purchase_amount", "50.00", "business", "Minimum purchase amount", "number", True),
        ("max_bottles_per_purchase", "10", "business", "Maximum bottles per purchase", "number", True),
        ("redemption_expiry_days", "365", "business", "Days until redemption expires", "number", True),
        ("low_inventory_threshold", "5", "business", "Low inventory alert threshold", "number", False),
        
        # Email Templates
        ("email_welcome_subject", "Welcome to StoreMyBottle!", "email", "Welcome email subject", "string", False),
        ("email_welcome_body", "Thank you for joining StoreMyBottle. Your account is now active.", "email", "Welcome email body", "text", False),
        ("email_purchase_subject", "Purchase Confirmation", "email", "Purchase confirmation subject", "string", False),
        ("email_redemption_subject", "Redemption Successful", "email", "Redemption confirmation subject", "string", False),
    ]
    
    try:
        with engine.connect() as conn:
            print("Creating system_settings table...")
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✓ system_settings table created successfully")
            
            # Insert default settings
            print("\nInserting default settings...")
            for key, value, category, description, data_type, is_public in default_settings:
                insert_sql = text("""
                    INSERT INTO system_settings 
                    (id, setting_key, setting_value, category, description, data_type, is_public)
                    VALUES (UUID(), :key, :value, :category, :description, :data_type, :is_public)
                    ON DUPLICATE KEY UPDATE 
                    setting_value = VALUES(setting_value),
                    description = VALUES(description)
                """)
                conn.execute(insert_sql, {
                    "key": key,
                    "value": value,
                    "category": category,
                    "description": description,
                    "data_type": data_type,
                    "is_public": is_public
                })
            conn.commit()
            print(f"✓ Inserted {len(default_settings)} default settings")
            
            return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("System Settings Migration")
    print("=" * 60)
    
    success = migrate()
    
    if success:
        print("\n✓ Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Migration failed!")
        sys.exit(1)
