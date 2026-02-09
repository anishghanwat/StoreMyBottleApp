from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, ForeignKey, Enum as SQLEnum
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
