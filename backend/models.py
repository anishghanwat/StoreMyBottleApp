from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid
import enum


def generate_uuid():
    """Generate UUID as string"""
    return str(uuid.uuid4())


class PaymentStatus(str, enum.Enum):
    """Payment status enum"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"


class PaymentMethod(str, enum.Enum):
    """Payment method enum"""
    UPI = "upi"
    CASH = "cash"
    CARD = "card"


class RedemptionStatus(str, enum.Enum):
    """Redemption status enum"""
    PENDING = "pending"
    REDEEMED = "redeemed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class UserRole(str, enum.Enum):
    """User role enum"""
    CUSTOMER = "customer"
    BARTENDER = "bartender"
    ADMIN = "admin"


class PromotionType(str, enum.Enum):
    """Promotion type enum"""
    PERCENTAGE = "percentage"  # e.g., 10% off
    FIXED_AMOUNT = "fixed_amount"  # e.g., ₹100 off
    FREE_PEG = "free_peg"  # Free peg with purchase


class PromotionStatus(str, enum.Enum):
    """Promotion status enum"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"


class TicketStatus(str, enum.Enum):
    """Support ticket status enum"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    """Support ticket priority enum"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketCategory(str, enum.Enum):
    """Support ticket category enum"""
    TECHNICAL = "technical"
    BILLING = "billing"
    ACCOUNT = "account"
    REDEMPTION = "redemption"
    GENERAL = "general"


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    role = Column(String(50), default="customer", nullable=False)
    venue_id = Column(String(36), ForeignKey("venues.id", ondelete="SET NULL"), nullable=True)
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    purchases = relationship("Purchase", back_populates="user", cascade="all, delete-orphan")
    redemptions = relationship("Redemption", back_populates="user", cascade="all, delete-orphan")


class Venue(Base):
    """Venue model"""
    __tablename__ = "venues"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    location = Column(String(500), nullable=False)
    is_open = Column(Boolean, default=True, nullable=False)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    image_url = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    bottles = relationship("Bottle", back_populates="venue", cascade="all, delete-orphan")
    purchases = relationship("Purchase", back_populates="venue")
    redemptions = relationship("Redemption", back_populates="venue")


class Bottle(Base):
    """Bottle catalog model"""
    __tablename__ = "bottles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    venue_id = Column(String(36), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)
    brand = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    volume_ml = Column(Integer, nullable=False)
    image_url = Column(String(1000), nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    venue = relationship("Venue", back_populates="bottles")
    purchases = relationship("Purchase", back_populates="bottle")


class Purchase(Base):
    """User's purchased bottles"""
    __tablename__ = "purchases"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    bottle_id = Column(String(36), ForeignKey("bottles.id", ondelete="RESTRICT"), nullable=False)
    venue_id = Column(String(36), ForeignKey("venues.id", ondelete="RESTRICT"), nullable=False)
    total_ml = Column(Integer, nullable=False)
    remaining_ml = Column(Integer, nullable=False)
    purchase_price = Column(Numeric(10, 2), nullable=False)
    promotion_code = Column(String(50), nullable=True)  # Applied promotion code
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)  # Discount applied
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    purchased_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="purchases")
    bottle = relationship("Bottle", back_populates="purchases")
    venue = relationship("Venue", back_populates="purchases")
    redemptions = relationship("Redemption", back_populates="purchase", cascade="all, delete-orphan")


class Redemption(Base):
    """Peg redemptions"""
    __tablename__ = "redemptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    purchase_id = Column(String(36), ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    venue_id = Column(String(36), ForeignKey("venues.id", ondelete="RESTRICT"), nullable=False)
    peg_size_ml = Column(Integer, nullable=False)
    qr_token = Column(String(500), unique=True, nullable=False, index=True)
    qr_expires_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(SQLEnum(RedemptionStatus), default=RedemptionStatus.PENDING, nullable=False)
    redeemed_at = Column(DateTime(timezone=True), nullable=True)
    redeemed_by_staff_id = Column(String(36), nullable=True)  # For future staff tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    purchase = relationship("Purchase", back_populates="redemptions")
    user = relationship("User", back_populates="redemptions")
    venue = relationship("Venue", back_populates="redemptions")


class OTP(Base):
    """OTP for phone authentication"""
    __tablename__ = "otps"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    phone = Column(String(20), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())



class Promotion(Base):
    """Promotions and discount codes"""
    __tablename__ = "promotions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    type = Column(SQLEnum(PromotionType), nullable=False)
    value = Column(Numeric(10, 2), nullable=False)  # Percentage or amount
    min_purchase_amount = Column(Numeric(10, 2), nullable=True)  # Minimum purchase required
    max_discount_amount = Column(Numeric(10, 2), nullable=True)  # Max discount cap
    usage_limit = Column(Integer, nullable=True)  # Total usage limit (null = unlimited)
    usage_count = Column(Integer, default=0, nullable=False)  # Current usage count
    per_user_limit = Column(Integer, nullable=True)  # Usage limit per user
    venue_id = Column(String(36), ForeignKey("venues.id"), nullable=True)  # Null = all venues
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=False)
    status = Column(SQLEnum(PromotionStatus), default=PromotionStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    venue = relationship("Venue", backref="promotions")



class SupportTicket(Base):
    """Support tickets for customer issues"""
    __tablename__ = "support_tickets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_number = Column(String(20), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(String(2000), nullable=False)
    category = Column(SQLEnum(TicketCategory), nullable=False)
    priority = Column(SQLEnum(TicketPriority), default=TicketPriority.MEDIUM, nullable=False)
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.OPEN, nullable=False)
    assigned_to_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="tickets")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], backref="assigned_tickets")
    comments = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan")


class TicketComment(Base):
    """Comments/replies on support tickets"""
    __tablename__ = "ticket_comments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    comment = Column(String(2000), nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)  # Internal notes not visible to customer
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    ticket = relationship("SupportTicket", back_populates="comments")
    user = relationship("User", backref="ticket_comments")


class AuditLog(Base):
    """Audit logs for tracking admin actions"""
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    user_name = Column(String(255), nullable=True)
    action = Column(String(50), nullable=False, index=True)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type = Column(String(50), nullable=False, index=True)  # Table name: users, venues, bottles, etc.
    entity_id = Column(String(36), nullable=True)  # ID of the affected record
    details = Column(Text, nullable=True)  # JSON string with additional details
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)  # Browser/client info
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class SystemSetting(Base):
    """System-wide configuration settings"""
    __tablename__ = "system_settings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    setting_key = Column(String(100), unique=True, nullable=False, index=True)
    setting_value = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)  # general, payment, notification, etc.
    description = Column(String(500), nullable=True)
    data_type = Column(String(20), default="string", nullable=False)  # string, number, boolean, json
    is_public = Column(Boolean, default=False, nullable=False)  # Whether setting is visible to non-admins
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserSession(Base):
    """User sessions for tracking active logins"""
    __tablename__ = "user_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    refresh_token = Column(String(500), unique=True, nullable=False, index=True)
    access_token = Column(String(500), nullable=False)
    device_info = Column(String(500), nullable=True)  # Browser, OS, device type
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)  # Full user agent string
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="sessions")





class PasswordResetToken(Base):
    """Password reset tokens for forgot password functionality"""
    __tablename__ = "password_reset_tokens"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(100), unique=True, nullable=False, index=True)
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="password_reset_tokens")
