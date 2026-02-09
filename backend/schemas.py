from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from models import PaymentStatus, PaymentMethod, RedemptionStatus


# ============ Venue Schemas ============

class VenueBase(BaseModel):
    name: str
    location: str
    is_open: bool
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    image_url: Optional[str] = None


class VenueResponse(VenueBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class VenueCreate(VenueBase):
    pass


class VenueList(BaseModel):
    venues: List[VenueResponse]
    total: int


class VenueStatsResponse(BaseModel):
    served_today: int
    active_bottles: int


# ============ Bottle Schemas ============

class BottleBase(BaseModel):
    brand: str
    name: str
    price: Decimal
    volume_ml: int = Field(alias="ml")
    image_url: Optional[str] = None


class BottleCreate(BottleBase):
    venue_id: str
    is_available: bool = True
    
    class Config:
        populate_by_name = True


class BottleResponse(BottleBase):
    id: str
    venue_id: str = Field(alias="venueId")
    is_available: bool
    
    class Config:
        from_attributes = True
        populate_by_name = True


class BottleList(BaseModel):
    bottles: List[BottleResponse]
    total: int


# ============ Authentication Schemas ============

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class GoogleLoginRequest(BaseModel):
    token: str


class PhoneSendOTPRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+?[1-9]\d{1,14}$")


class PhoneVerifyOTPRequest(BaseModel):
    phone: str
    otp_code: str = Field(..., min_length=6, max_length=6)


class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    name: str
    role: str
    venue_id: Optional[str] = None
    venue_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============ Purchase Schemas ============

class PurchaseCreateRequest(BaseModel):
    bottle_id: str
    venue_id: str


class PurchaseConfirmRequest(BaseModel):
    payment_method: PaymentMethod


class PurchaseResponse(BaseModel):
    id: str
    user_id: str
    bottle_id: str
    venue_id: str
    total_ml: int
    remaining_ml: int
    purchase_price: Decimal
    payment_status: PaymentStatus
    payment_method: Optional[PaymentMethod] = None
    purchased_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserBottleResponse(BaseModel):
    """User's bottle with denormalized data for frontend"""
    id: str
    bottle_id: str = Field(alias="bottleId")
    venue_name: str = Field(alias="venueName")
    bottle_name: str = Field(alias="bottleName")
    bottle_brand: str = Field(alias="bottleBrand")
    total_ml: int = Field(alias="totalMl")
    remaining_ml: int = Field(alias="remainingMl")
    image_url: str = Field(alias="image")
    expires_at: datetime = Field(alias="expiresAt")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class UserBottleList(BaseModel):
    bottles: List[UserBottleResponse]
    total: int


# ============ Purchase Request Schemas (Bartender) ============

class PurchaseRequestResponse(BaseModel):
    id: str
    customer_name: str
    bottle_name: str
    bottle_brand: str
    volume_ml: int
    amount: Decimal
    payment_method: Optional[PaymentMethod] = None
    created_at: datetime
    status: PaymentStatus
    
    class Config:
        from_attributes = True


class ProcessPurchaseRequest(BaseModel):
    action: str = Field(..., pattern="^(confirm|reject)$")



# ============ Redemption Schemas ============

class RedemptionCreateRequest(BaseModel):
    purchase_id: str
    peg_size_ml: int = Field(..., ge=30, le=60)


class RedemptionResponse(BaseModel):
    id: str
    purchase_id: str
    peg_size_ml: int
    qr_token: str
    qr_data: str
    qr_expires_at: datetime
    status: RedemptionStatus
    created_at: datetime
    
    # Expanded details for frontend
    bottle_name: Optional[str] = None
    bottle_brand: Optional[str] = None
    customer_name: Optional[str] = None
    remaining_ml: Optional[int] = None
    total_ml: Optional[int] = None
    
    class Config:
        from_attributes = True


class QRValidationRequest(BaseModel):
    qr_token: str


class QRValidationResponse(BaseModel):
    success: bool
    message: str
    redemption: Optional[RedemptionResponse] = None


class RedemptionHistoryItem(BaseModel):
    id: str
    bottle_name: str
    bottle_brand: str
    venue_name: str
    peg_size_ml: int
    status: RedemptionStatus
    redeemed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class RedemptionHistoryList(BaseModel):
    redemptions: List[RedemptionHistoryItem]
    total: int


# ============ Profile Schemas ============

class ProfileResponse(BaseModel):
    user: UserResponse
    total_bottles: int
    total_spent: Decimal
    total_redemptions: int


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(user|bartender|admin)$")
    venue_id: Optional[str] = None

