#!/usr/bin/env python3
"""
Migration script to add audit_logs table
"""

from sqlalchemy import create_engine, Column, String, Text, DateTime, Integer, text
from sqlalchemy.sql import func
from database import Base
from config import settings
import sys

def migrate():
    """Add audit_logs table"""
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL to create audit_logs table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        user_name VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(36),
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_entity_type (entity_type),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    try:
        with engine.connect() as conn:
            print("Creating audit_logs table...")
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✓ audit_logs table created successfully")
            return True
    except Exception as e:
        print(f"✗ Error creating audit_logs table: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Audit Logs Migration")
    print("=" * 60)
    
    success = migrate()
    
    if success:
        print("\n✓ Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Migration failed!")
        sys.exit(1)
