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


class BottleAdminResponse(BaseModel):
    """Admin view of bottle with venue name"""
    id: str
    venue_id: str
    venue_name: str
    brand: str
    name: str
    price: Decimal
    volume_ml: int
    image_url: Optional[str] = None
    is_available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class BottleUpdate(BaseModel):
    """Schema for updating bottle"""
    venue_id: Optional[str] = None
    brand: Optional[str] = None
    name: Optional[str] = None
    price: Optional[Decimal] = None
    volume_ml: Optional[int] = Field(None, alias="ml")
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    
    class Config:
        populate_by_name = True


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


# ============ Admin Purchase Schemas ============

class PurchaseAdminResponse(BaseModel):
    """Admin view of purchase with user, bottle, and venue details"""
    id: str
    user_id: str
    user_name: str
    user_email: Optional[str] = None
    bottle_id: str
    bottle_name: str
    bottle_brand: str
    venue_id: str
    venue_name: str
    total_ml: int
    remaining_ml: int
    purchase_price: Decimal
    payment_status: PaymentStatus
    payment_method: Optional[PaymentMethod] = None
    purchased_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PurchaseAdminList(BaseModel):
    purchases: List[PurchaseAdminResponse]
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
    user_name: Optional[str] = None  # Customer name for bartender view
    
    class Config:
        from_attributes = True


class RedemptionHistoryList(BaseModel):
    redemptions: List[RedemptionHistoryItem]
    total: int


# ============ Admin Redemption Schemas ============

class RedemptionAdminResponse(BaseModel):
    """Admin view of redemption with user, bottle, venue, and bartender details"""
    id: str
    purchase_id: str
    user_id: str
    user_name: str
    user_email: Optional[str] = None
    bottle_id: str
    bottle_name: str
    bottle_brand: str
    venue_id: str
    venue_name: str
    peg_size_ml: int
    status: RedemptionStatus
    qr_expires_at: datetime
    redeemed_at: Optional[datetime] = None
    redeemed_by_staff_id: Optional[str] = None
    redeemed_by_staff_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class RedemptionAdminList(BaseModel):
    redemptions: List[RedemptionAdminResponse]
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


# ============ Bartender Schemas ============

class BartenderResponse(BaseModel):
    """Bartender view with venue details"""
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    venue_id: Optional[str] = None
    venue_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class BartenderList(BaseModel):
    bartenders: List[BartenderResponse]
    total: int


class BartenderCreate(BaseModel):
    """Create a new bartender"""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str
    venue_id: str


class BartenderUpdate(BaseModel):
    """Update bartender details"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    venue_id: Optional[str] = None


# ============ Analytics Schemas ============

class VenueRevenue(BaseModel):
    """Revenue by venue"""
    venue_id: str
    venue_name: str
    revenue: Decimal
    bottles_sold: int

class RevenueTrend(BaseModel):
    """Revenue trend data point"""
    date: str
    revenue: Decimal
    
class RevenueAnalytics(BaseModel):
    """Revenue analytics response"""
    total_revenue: Decimal
    revenue_this_month: Decimal
    revenue_this_week: Decimal
    revenue_today: Decimal
    average_order_value: Decimal
    revenue_by_venue: List[VenueRevenue]
    revenue_trend: List[RevenueTrend]

class TopBottle(BaseModel):
    """Top selling bottle"""
    bottle_id: str
    bottle_name: str
    bottle_brand: str
    quantity_sold: int
    revenue: Decimal

class SalesTrend(BaseModel):
    """Sales trend data point"""
    date: str
    bottles_sold: int

class SalesAnalytics(BaseModel):
    """Sales analytics response"""
    total_bottles_sold: int
    bottles_sold_this_month: int
    bottles_sold_this_week: int
    bottles_sold_today: int
    top_bottles: List[TopBottle]
    sales_trend: List[SalesTrend]
    sales_by_venue: List[VenueRevenue]

class VenueRedemptions(BaseModel):
    """Redemptions by venue"""
    venue_id: str
    venue_name: str
    total_redemptions: int
    pending_redemptions: int
    redeemed_count: int

class HourlyRedemptions(BaseModel):
    """Redemptions by hour"""
    hour: int
    count: int

class RedemptionAnalytics(BaseModel):
    """Redemption analytics response"""
    total_redemptions: int
    redeemed_count: int
    pending_count: int
    expired_count: int
    redemption_rate: float
    redemptions_by_venue: List[VenueRedemptions]
    redemptions_by_hour: List[HourlyRedemptions]

class UserGrowth(BaseModel):
    """User growth data point"""
    date: str
    total_users: int
    new_users: int

class UserAnalytics(BaseModel):
    """User analytics response"""
    total_users: int
    new_users_this_month: int
    new_users_this_week: int
    new_users_today: int
    customers_count: int
    bartenders_count: int
    admins_count: int
    user_growth: List[UserGrowth]


# ============ Report Schemas ============

class RevenueReportItem(BaseModel):
    """Revenue report line item"""
    date: str
    venue_name: str
    bottle_name: str
    bottle_brand: str
    quantity: int
    unit_price: Decimal
    total_revenue: Decimal
    payment_method: Optional[str] = None

class RevenueReport(BaseModel):
    """Revenue report response"""
    items: List[RevenueReportItem]
    total_revenue: Decimal
    total_transactions: int
    start_date: str
    end_date: str

class SalesReportItem(BaseModel):
    """Sales report line item"""
    bottle_id: str
    bottle_name: str
    bottle_brand: str
    venue_name: str
    quantity_sold: int
    total_revenue: Decimal
    average_price: Decimal

class SalesReport(BaseModel):
    """Sales report response"""
    items: List[SalesReportItem]
    total_bottles_sold: int
    total_revenue: Decimal
    start_date: str
    end_date: str

class InventoryReportItem(BaseModel):
    """Inventory report line item"""
    bottle_id: str
    bottle_name: str
    bottle_brand: str
    venue_name: str
    price: Decimal
    volume_ml: int
    is_available: bool
    total_sold: int
    total_revenue: Decimal

class InventoryReport(BaseModel):
    """Inventory report response"""
    items: List[InventoryReportItem]
    total_bottles: int
    available_bottles: int
    unavailable_bottles: int

class UserActivityReportItem(BaseModel):
    """User activity report line item"""
    user_id: str
    user_name: str
    user_email: Optional[str] = None
    total_purchases: int
    total_spent: Decimal
    total_redemptions: int
    last_activity: Optional[datetime] = None
    joined_date: datetime

class UserActivityReport(BaseModel):
    """User activity report response"""
    items: List[UserActivityReportItem]
    total_users: int
    active_users: int
    total_spent: Decimal


# ============ Venue Analytics Schemas ============

class VenuePerformanceMetrics(BaseModel):
    """Performance metrics for a single venue"""
    venue_id: str
    venue_name: str
    total_revenue: Decimal
    total_bottles_sold: int
    total_redemptions: int
    active_bottles: int
    total_customers: int
    average_order_value: Decimal
    redemption_rate: float
    revenue_rank: int
    sales_rank: int

class VenueComparisonItem(BaseModel):
    """Venue comparison data point"""
    venue_id: str
    venue_name: str
    revenue: Decimal
    bottles_sold: int
    redemptions: int
    customers: int

class VenueTrendData(BaseModel):
    """Venue trend data point"""
    date: str
    revenue: Decimal
    bottles_sold: int
    redemptions: int

class VenueTopBottle(BaseModel):
    """Top selling bottle at venue"""
    bottle_id: str
    bottle_name: str
    bottle_brand: str
    quantity_sold: int
    revenue: Decimal

class VenueDetailedAnalytics(BaseModel):
    """Detailed analytics for a specific venue"""
    venue_id: str
    venue_name: str
    venue_location: str
    
    # Summary metrics
    total_revenue: Decimal
    revenue_this_month: Decimal
    revenue_this_week: Decimal
    total_bottles_sold: int
    bottles_sold_this_month: int
    total_redemptions: int
    redemptions_this_month: int
    active_bottles: int
    total_customers: int
    average_order_value: Decimal
    redemption_rate: float
    
    # Trends
    revenue_trend: List[VenueTrendData]
    top_bottles: List[VenueTopBottle]
    
    # Rankings
    revenue_rank: int
    sales_rank: int
    total_venues: int

class VenuePerformanceComparison(BaseModel):
    """Venue performance comparison response"""
    venues: List[VenuePerformanceMetrics]
    comparison_data: List[VenueComparisonItem]
    start_date: str
    end_date: str
    total_venues: int



# ============ Promotion Schemas ============

class PromotionBase(BaseModel):
    """Base promotion schema"""
    code: str
    name: str
    description: Optional[str] = None
    type: str  # percentage, fixed_amount, free_peg
    value: Decimal
    min_purchase_amount: Optional[Decimal] = None
    max_discount_amount: Optional[Decimal] = None
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = None
    venue_id: Optional[str] = None
    valid_from: datetime
    valid_until: datetime
    status: str  # active, inactive, expired

class PromotionCreate(PromotionBase):
    """Create promotion schema"""
    pass

class PromotionUpdate(BaseModel):
    """Update promotion schema"""
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    value: Optional[Decimal] = None
    min_purchase_amount: Optional[Decimal] = None
    max_discount_amount: Optional[Decimal] = None
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = None
    venue_id: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    status: Optional[str] = None

class PromotionResponse(PromotionBase):
    """Promotion response schema"""
    id: str
    usage_count: int
    venue_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PromotionList(BaseModel):
    """Promotion list response"""
    promotions: List[PromotionResponse]
    total: int

class PromotionValidation(BaseModel):
    """Promotion validation request"""
    code: str
    purchase_amount: Decimal
    venue_id: str
    user_id: str

class PromotionValidationResponse(BaseModel):
    """Promotion validation response"""
    valid: bool
    message: str
    promotion: Optional[PromotionResponse] = None
    discount_amount: Optional[Decimal] = None


# ============ Support Ticket Schemas ============

class TicketCommentBase(BaseModel):
    """Base ticket comment schema"""
    comment: str
    is_internal: bool = False

class TicketCommentCreate(TicketCommentBase):
    """Create ticket comment schema"""
    pass

class TicketCommentResponse(TicketCommentBase):
    """Ticket comment response schema"""
    id: str
    ticket_id: str
    user_id: str
    user_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SupportTicketBase(BaseModel):
    """Base support ticket schema"""
    subject: str
    description: str
    category: str  # technical, billing, account, redemption, general
    priority: str = "medium"  # low, medium, high, urgent

class SupportTicketCreate(SupportTicketBase):
    """Create support ticket schema"""
    pass

class SupportTicketUpdate(BaseModel):
    """Update support ticket schema"""
    subject: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to_id: Optional[str] = None

class SupportTicketResponse(SupportTicketBase):
    """Support ticket response schema"""
    id: str
    ticket_number: str
    user_id: str
    user_name: str
    user_email: Optional[str] = None
    status: str
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    comments_count: int = 0
    
    class Config:
        from_attributes = True

class SupportTicketDetailResponse(SupportTicketResponse):
    """Detailed support ticket response with comments"""
    comments: List[TicketCommentResponse] = []

class SupportTicketList(BaseModel):
    """Support ticket list response"""
    tickets: List[SupportTicketResponse]
    total: int


# ============ Audit Log Schemas ============

class AuditLogResponse(BaseModel):
    """Audit log response"""
    id: str
    user_id: Optional[str]
    user_name: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class AuditLogList(BaseModel):
    """Audit log list response"""
    logs: List[AuditLogResponse]
    total: int


# ============ System Settings Schemas ============

class SystemSettingCreate(BaseModel):
    """Create system setting"""
    setting_key: str
    setting_value: Optional[str]
    category: str
    description: Optional[str]
    data_type: str = "string"
    is_public: bool = False

class SystemSettingUpdate(BaseModel):
    """Update system setting"""
    setting_value: Optional[str]
    description: Optional[str]
    is_public: Optional[bool]

class SystemSettingResponse(BaseModel):
    """System setting response"""
    id: str
    setting_key: str
    setting_value: Optional[str]
    category: str
    description: Optional[str]
    data_type: str
    is_public: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SystemSettingsList(BaseModel):
    """System settings list response"""
    settings: List[SystemSettingResponse]
    total: int

class SystemSettingsBulkUpdate(BaseModel):
    """Bulk update settings"""
    settings: List[dict]
