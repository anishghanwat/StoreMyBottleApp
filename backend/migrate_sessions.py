#!/usr/bin/env python3
"""
Migration script to add user_sessions table
"""

from sqlalchemy import create_engine, text
from config import settings
import sys

def migrate():
    """Add user_sessions table"""
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL to create user_sessions table
    # Note: Using utf8mb4_0900_ai_ci to match users table collation
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        refresh_token VARCHAR(500) NOT NULL UNIQUE,
        access_token VARCHAR(500) NOT NULL,
        device_info VARCHAR(500) DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        expires_at DATETIME NOT NULL,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY idx_user_id (user_id),
        KEY idx_refresh_token (refresh_token),
        KEY idx_is_active (is_active),
        KEY idx_expires_at (expires_at),
        CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    """
    
    try:
        with engine.connect() as conn:
            print("Creating user_sessions table...")
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✓ user_sessions table created successfully")
            return True
    except Exception as e:
        print(f"✗ Error creating user_sessions table: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("User Sessions Migration")
    print("=" * 60)
    
    success = migrate()
    
    if success:
        print("\n✓ Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n✗ Migration failed!")
        sys.exit(1)
