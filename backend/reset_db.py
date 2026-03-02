"""
Reset database - Drop all tables and recreate them
"""
import sys
import os

# Add current directory to sys.path
sys.path.append(os.getcwd())

from database import engine, Base
from models import *  # Import all models

def reset_database():
    """Drop all tables and recreate them"""
    try:
        print("🗑️  Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✅ All tables dropped")
        
        print("\n📊 Creating all tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created")
        
        print("\n✅ Database reset complete!")
        print("\nNext steps:")
        print("1. Run: python init_db.py")
        print("2. Run: python create_admin.py admin@storemybottle.com admin123")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("========================================")
    print("StoreMyBottle - Database Reset")
    print("========================================")
    print("\n⚠️  WARNING: This will delete ALL data!")
    
    confirm = input("\nAre you sure? Type 'yes' to continue: ")
    
    if confirm.lower() == 'yes':
        reset_database()
    else:
        print("❌ Reset cancelled")
