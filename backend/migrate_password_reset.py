#!/usr/bin/env python3
"""
Migration script to add password_reset_tokens table
"""

from sqlalchemy import text
from database import engine, get_db

def migrate():
    """Add password_reset_tokens table"""
    
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token VARCHAR(100) NOT NULL UNIQUE,
        is_used BOOLEAN NOT NULL DEFAULT FALSE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_token (token),
        INDEX idx_expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    with engine.connect() as conn:
        print("Creating password_reset_tokens table...")
        conn.execute(text(create_table_sql))
        conn.commit()
        print("✅ Table created successfully!")

if __name__ == "__main__":
    migrate()
