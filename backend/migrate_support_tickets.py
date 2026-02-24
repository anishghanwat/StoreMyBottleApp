"""
Migration script to add support tickets tables
Run this script to add support ticket system to the database
"""

from sqlalchemy import text
from database import engine

def migrate():
    """Add support_tickets and ticket_comments tables"""
    
    with engine.connect() as conn:
        # Create support_tickets table
        try:
            conn.execute(text("""
                CREATE TABLE support_tickets (
                    id VARCHAR(36) PRIMARY KEY,
                    ticket_number VARCHAR(20) UNIQUE NOT NULL,
                    user_id VARCHAR(36) NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    description VARCHAR(2000) NOT NULL,
                    category ENUM('technical', 'billing', 'account', 'redemption', 'general') NOT NULL,
                    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' NOT NULL,
                    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open' NOT NULL,
                    assigned_to_id VARCHAR(36),
                    resolved_at DATETIME,
                    closed_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_ticket_number (ticket_number),
                    INDEX idx_status (status),
                    INDEX idx_user_id (user_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
                )
            """))
            conn.commit()
            print("✅ Created support_tickets table")
        except Exception as e:
            print(f"⚠️  Support_tickets table might already exist: {e}")
        
        # Create ticket_comments table
        try:
            conn.execute(text("""
                CREATE TABLE ticket_comments (
                    id VARCHAR(36) PRIMARY KEY,
                    ticket_id VARCHAR(36) NOT NULL,
                    user_id VARCHAR(36) NOT NULL,
                    comment VARCHAR(2000) NOT NULL,
                    is_internal BOOLEAN DEFAULT FALSE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_ticket_id (ticket_id),
                    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """))
            conn.commit()
            print("✅ Created ticket_comments table")
        except Exception as e:
            print(f"⚠️  Ticket_comments table might already exist: {e}")
        
        print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    print("Starting support tickets migration...")
    migrate()
