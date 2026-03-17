"""Migration: Add profile_image_url column to users table"""
import os
from dotenv import load_dotenv
import sqlalchemy as sa

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = sa.create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_image_url'"
    ))
    exists = result.scalar()

    if not exists:
        conn.execute(sa.text(
            "ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(1000) NULL AFTER google_id"
        ))
        conn.commit()
        print("Added profile_image_url column to users table.")
    else:
        print("Column already exists, skipping.")
