from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, date

from database import get_db
from models import User, Venue, Bottle, Purchase, PaymentStatus, Redemption, RedemptionStatus
from auth import get_current_active_admin
from schemas import (
    UserResponse, UserRoleUpdate, VenueCreate, VenueResponse, 
    BottleCreate, BottleResponse, BottleAdminResponse, BottleUpdate, VenueList,
    PurchaseAdminResponse, PurchaseAdminList,
    RedemptionAdminResponse, RedemptionAdminList,
    BartenderResponse, BartenderList, BartenderCreate, BartenderUpdate,
    RevenueAnalytics, VenueRevenue, RevenueTrend,
    SalesAnalytics, TopBottle, SalesTrend,
    RedemptionAnalytics, VenueRedemptions, HourlyRedemptions,
    UserAnalytics, UserGrowth,
    RevenueReport, RevenueReportItem,
    SalesReport, SalesReportItem,
    InventoryReport, InventoryReportItem,
    UserActivityReport, UserActivityReportItem,
    VenuePerformanceComparison, VenuePerformanceMetrics, VenueComparisonItem,
    VenueDetailedAnalytics, VenueTrendData, VenueTopBottle,
    PromotionCreate, PromotionUpdate, PromotionResponse, PromotionList,
    PromotionValidation, PromotionValidationResponse,
    SupportTicketCreate, SupportTicketUpdate, SupportTicketResponse,
    SupportTicketDetailResponse, SupportTicketList,
    TicketCommentCreate, TicketCommentResponse,
    AuditLogResponse, AuditLogList,
    SystemSettingCreate, SystemSettingUpdate, SystemSettingResponse,
    SystemSettingsList, SystemSettingsBulkUpdate
)

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_active_admin)]
)

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get global dashboard stats"""
    total_users = db.query(User).count()
    total_venues = db.query(Venue).count()
    total_bottles = db.query(Bottle).count()
    
    # Calculate total revenue (sum of confirmed purchases)
    revenue = db.query(func.sum(Purchase.purchase_price)).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).scalar() or 0

    # Total Redemptions
    from models import Redemption, RedemptionStatus
    total_redemptions = db.query(Redemption).filter(Redemption.status == RedemptionStatus.REDEEMED).count()
    
    # Bottles Sold (Count of confirmed purchases)
    bottles_sold = db.query(Purchase).filter(Purchase.payment_status == PaymentStatus.CONFIRMED).count()

    return {
        "total_users": total_users,
        "total_venues": total_venues,
        "total_bottles": total_bottles,
        "total_revenue": revenue,
        "total_redemptions": total_redemptions,
        "bottles_sold": bottles_sold
    }

@router.get("/users", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """List all users"""
    return db.query(User).offset(skip).limit(limit).all()

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str, 
    role_update: UserRoleUpdate, 
    db: Session = Depends(get_db)
):
    """Update user role and venue assignment"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role_update.role
    user.venue_id = role_update.venue_id
    
    db.commit()
    db.refresh(user)
    return user

@router.get("/venues", response_model=List[VenueResponse])
def get_venues(db: Session = Depends(get_db)):
    """List all venues"""
    return db.query(Venue).all()

@router.post("/venues", response_model=VenueResponse)
def create_venue(venue: VenueCreate, db: Session = Depends(get_db)):
    """Create a new venue"""
    # Check duplicate? (optional)
    
    db_venue = Venue(
        name=venue.name,
        location=venue.location,
        is_open=venue.is_open,
        image_url=venue.image_url,
        contact_email=venue.contact_email,
        contact_phone=venue.contact_phone
    )
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    return db_venue

@router.put("/venues/{venue_id}", response_model=VenueResponse)
def update_venue(
    venue_id: str,
    venue_update: VenueCreate, # Reusing Create schema for now, or create VenueUpdate
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    print("--------------------------------------------------")
    print(f"DEBUG: Updating venue {venue_id}")
    print(f"DEBUG: Payload: {venue_update.dict()}")
    print("--------------------------------------------------")

    for key, value in venue_update.dict().items():
        setattr(venue, key, value)
    
    db.commit()
    db.refresh(venue)
    return venue

@router.delete("/venues/{venue_id}")
def delete_venue(
    venue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    db.delete(venue)
    db.commit()
    return {"message": "Venue deleted"}

@router.get("/bottles", response_model=List[BottleAdminResponse])
def get_bottles(
    venue_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all bottles with venue information"""
    query = db.query(Bottle).join(Venue)
    
    if venue_id:
        query = query.filter(Bottle.venue_id == venue_id)
    
    bottles = query.offset(skip).limit(limit).all()
    
    # Transform to include venue name
    result = []
    for bottle in bottles:
        result.append(BottleAdminResponse(
            id=bottle.id,
            venue_id=bottle.venue_id,
            venue_name=bottle.venue.name,
            brand=bottle.brand,
            name=bottle.name,
            price=bottle.price,
            volume_ml=bottle.volume_ml,
            image_url=bottle.image_url,
            is_available=bottle.is_available,
            created_at=bottle.created_at
        ))
    
    return result


@router.get("/bottles/{bottle_id}", response_model=BottleAdminResponse)
def get_bottle(bottle_id: str, db: Session = Depends(get_db)):
    """Get bottle details"""
    bottle = db.query(Bottle).filter(Bottle.id == bottle_id).first()
    if not bottle:
        raise HTTPException(status_code=404, detail="Bottle not found")
    
    return BottleAdminResponse(
        id=bottle.id,
        venue_id=bottle.venue_id,
        venue_name=bottle.venue.name,
        brand=bottle.brand,
        name=bottle.name,
        price=bottle.price,
        volume_ml=bottle.volume_ml,
        image_url=bottle.image_url,
        is_available=bottle.is_available,
        created_at=bottle.created_at
    )


@router.post("/bottles", response_model=BottleResponse)
def create_bottle(bottle: BottleCreate, db: Session = Depends(get_db)):
    """Create a new bottle"""
    # Verify venue exists
    venue = db.query(Venue).filter(Venue.id == bottle.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
        
    db_bottle = Bottle(
        name=bottle.name,
        brand=bottle.brand,
        price=bottle.price,
        volume_ml=bottle.volume_ml,
        venue_id=bottle.venue_id,
        image_url=bottle.image_url,
        is_available=bottle.is_available
    )
    db.add(db_bottle)
    db.commit()
    db.refresh(db_bottle)
    return db_bottle


@router.put("/bottles/{bottle_id}", response_model=BottleAdminResponse)
def update_bottle(
    bottle_id: str,
    bottle_update: BottleUpdate,
    db: Session = Depends(get_db)
):
    """Update bottle details"""
    bottle = db.query(Bottle).filter(Bottle.id == bottle_id).first()
    if not bottle:
        raise HTTPException(status_code=404, detail="Bottle not found")
    
    # Update only provided fields
    update_data = bottle_update.dict(exclude_unset=True)
    
    # Handle the 'ml' alias
    if 'ml' in update_data:
        update_data['volume_ml'] = update_data.pop('ml')
    
    # Verify venue exists if venue_id is being updated
    if 'venue_id' in update_data:
        venue = db.query(Venue).filter(Venue.id == update_data['venue_id']).first()
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
    
    for key, value in update_data.items():
        setattr(bottle, key, value)
    
    db.commit()
    db.refresh(bottle)
    
    return BottleAdminResponse(
        id=bottle.id,
        venue_id=bottle.venue_id,
        venue_name=bottle.venue.name,
        brand=bottle.brand,
        name=bottle.name,
        price=bottle.price,
        volume_ml=bottle.volume_ml,
        image_url=bottle.image_url,
        is_available=bottle.is_available,
        created_at=bottle.created_at
    )


@router.delete("/bottles/{bottle_id}")
def delete_bottle(bottle_id: str, db: Session = Depends(get_db)):
    """Delete a bottle"""
    bottle = db.query(Bottle).filter(Bottle.id == bottle_id).first()
    if not bottle:
        raise HTTPException(status_code=404, detail="Bottle not found")
    
    # Check if bottle has any purchases
    purchase_count = db.query(Purchase).filter(Purchase.bottle_id == bottle_id).count()
    if purchase_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete bottle with {purchase_count} existing purchases. Consider marking as unavailable instead."
        )
    
    db.delete(bottle)
    db.commit()
    return {"message": "Bottle deleted successfully"}


# ============ Purchase Management ============

@router.get("/purchases", response_model=PurchaseAdminList)
def get_purchases(
    status: Optional[str] = None,
    venue_id: Optional[str] = None,
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all purchases with filters"""
    query = db.query(Purchase).join(User).join(Bottle).join(Venue)
    
    # Apply filters
    if status:
        try:
            status_enum = PaymentStatus(status)
            query = query.filter(Purchase.payment_status == status_enum)
        except ValueError:
            pass  # Invalid status, ignore filter
    
    if venue_id:
        query = query.filter(Purchase.venue_id == venue_id)
    
    if user_id:
        query = query.filter(Purchase.user_id == user_id)
    
    # Order by most recent first
    query = query.order_by(Purchase.created_at.desc())
    
    total = query.count()
    purchases = query.offset(skip).limit(limit).all()
    
    # Transform to admin response
    result = []
    for purchase in purchases:
        result.append(PurchaseAdminResponse(
            id=purchase.id,
            user_id=purchase.user_id,
            user_name=purchase.user.name,
            user_email=purchase.user.email,
            bottle_id=purchase.bottle_id,
            bottle_name=purchase.bottle.name,
            bottle_brand=purchase.bottle.brand,
            venue_id=purchase.venue_id,
            venue_name=purchase.venue.name,
            total_ml=purchase.total_ml,
            remaining_ml=purchase.remaining_ml,
            purchase_price=purchase.purchase_price,
            payment_status=purchase.payment_status,
            payment_method=purchase.payment_method,
            purchased_at=purchase.purchased_at,
            created_at=purchase.created_at
        ))
    
    return PurchaseAdminList(purchases=result, total=total)


@router.get("/purchases/{purchase_id}", response_model=PurchaseAdminResponse)
def get_purchase(purchase_id: str, db: Session = Depends(get_db)):
    """Get purchase details"""
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    return PurchaseAdminResponse(
        id=purchase.id,
        user_id=purchase.user_id,
        user_name=purchase.user.name,
        user_email=purchase.user.email,
        bottle_id=purchase.bottle_id,
        bottle_name=purchase.bottle.name,
        bottle_brand=purchase.bottle.brand,
        venue_id=purchase.venue_id,
        venue_name=purchase.venue.name,
        total_ml=purchase.total_ml,
        remaining_ml=purchase.remaining_ml,
        purchase_price=purchase.purchase_price,
        payment_status=purchase.payment_status,
        payment_method=purchase.payment_method,
        purchased_at=purchase.purchased_at,
        created_at=purchase.created_at
    )


# ============ Redemption Management ============

@router.get("/redemptions", response_model=RedemptionAdminList)
def get_redemptions(
    status: Optional[str] = None,
    venue_id: Optional[str] = None,
    user_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all redemptions with filters"""
    query = db.query(Redemption).join(User).join(Purchase).join(Bottle).join(Venue)
    
    # Apply filters
    if status:
        try:
            status_enum = RedemptionStatus(status)
            query = query.filter(Redemption.status == status_enum)
        except ValueError:
            pass  # Invalid status, ignore filter
    
    if venue_id:
        query = query.filter(Redemption.venue_id == venue_id)
    
    if user_id:
        query = query.filter(Redemption.user_id == user_id)
    
    # Order by most recent first
    query = query.order_by(Redemption.created_at.desc())
    
    total = query.count()
    redemptions = query.offset(skip).limit(limit).all()
    
    # Transform to admin response
    result = []
    for redemption in redemptions:
        # Get bartender name if redeemed
        bartender_name = None
        if redemption.redeemed_by_staff_id:
            bartender = db.query(User).filter(User.id == redemption.redeemed_by_staff_id).first()
            if bartender:
                bartender_name = bartender.name
        
        result.append(RedemptionAdminResponse(
            id=redemption.id,
            purchase_id=redemption.purchase_id,
            user_id=redemption.user_id,
            user_name=redemption.user.name,
            user_email=redemption.user.email,
            bottle_id=redemption.purchase.bottle_id,
            bottle_name=redemption.purchase.bottle.name,
            bottle_brand=redemption.purchase.bottle.brand,
            venue_id=redemption.venue_id,
            venue_name=redemption.venue.name,
            peg_size_ml=redemption.peg_size_ml,
            status=redemption.status,
            qr_expires_at=redemption.qr_expires_at,
            redeemed_at=redemption.redeemed_at,
            redeemed_by_staff_id=redemption.redeemed_by_staff_id,
            redeemed_by_staff_name=bartender_name,
            created_at=redemption.created_at
        ))
    
    return RedemptionAdminList(redemptions=result, total=total)


@router.get("/redemptions/{redemption_id}", response_model=RedemptionAdminResponse)
def get_redemption(redemption_id: str, db: Session = Depends(get_db)):
    """Get redemption details"""
    redemption = db.query(Redemption).filter(Redemption.id == redemption_id).first()
    if not redemption:
        raise HTTPException(status_code=404, detail="Redemption not found")
    
    # Get bartender name if redeemed
    bartender_name = None
    if redemption.redeemed_by_staff_id:
        bartender = db.query(User).filter(User.id == redemption.redeemed_by_staff_id).first()
        if bartender:
            bartender_name = bartender.name
    
    return RedemptionAdminResponse(
        id=redemption.id,
        purchase_id=redemption.purchase_id,
        user_id=redemption.user_id,
        user_name=redemption.user.name,
        user_email=redemption.user.email,
        bottle_id=redemption.purchase.bottle_id,
        bottle_name=redemption.purchase.bottle.name,
        bottle_brand=redemption.purchase.bottle.brand,
        venue_id=redemption.venue_id,
        venue_name=redemption.venue.name,
        peg_size_ml=redemption.peg_size_ml,
        status=redemption.status,
        qr_expires_at=redemption.qr_expires_at,
        redeemed_at=redemption.redeemed_at,
        redeemed_by_staff_id=redemption.redeemed_by_staff_id,
        redeemed_by_staff_name=bartender_name,
        created_at=redemption.created_at
    )


# ============ Bartender Management ============

@router.get("/bartenders", response_model=BartenderList)
def get_bartenders(
    venue_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all bartenders with venue information"""
    query = db.query(User).filter(User.role == "bartender")
    
    if venue_id:
        query = query.filter(User.venue_id == venue_id)
    
    # Order by most recent first
    query = query.order_by(User.created_at.desc())
    
    total = query.count()
    bartenders = query.offset(skip).limit(limit).all()
    
    # Transform to include venue name
    result = []
    for bartender in bartenders:
        venue_name = None
        if bartender.venue_id:
            venue = db.query(Venue).filter(Venue.id == bartender.venue_id).first()
            if venue:
                venue_name = venue.name
        
        result.append(BartenderResponse(
            id=bartender.id,
            name=bartender.name,
            email=bartender.email,
            phone=bartender.phone,
            venue_id=bartender.venue_id,
            venue_name=venue_name,
            created_at=bartender.created_at
        ))
    
    return BartenderList(bartenders=result, total=total)


@router.get("/bartenders/{bartender_id}", response_model=BartenderResponse)
def get_bartender(bartender_id: str, db: Session = Depends(get_db)):
    """Get bartender details"""
    bartender = db.query(User).filter(
        User.id == bartender_id,
        User.role == "bartender"
    ).first()
    
    if not bartender:
        raise HTTPException(status_code=404, detail="Bartender not found")
    
    venue_name = None
    if bartender.venue_id:
        venue = db.query(Venue).filter(Venue.id == bartender.venue_id).first()
        if venue:
            venue_name = venue.name
    
    return BartenderResponse(
        id=bartender.id,
        name=bartender.name,
        email=bartender.email,
        phone=bartender.phone,
        venue_id=bartender.venue_id,
        venue_name=venue_name,
        created_at=bartender.created_at
    )


@router.post("/bartenders", response_model=BartenderResponse)
def create_bartender(
    bartender: BartenderCreate,
    db: Session = Depends(get_db)
):
    """Create a new bartender"""
    from auth import get_password_hash
    
    # Check if email or phone already exists
    if bartender.email:
        existing = db.query(User).filter(User.email == bartender.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    if bartender.phone:
        existing = db.query(User).filter(User.phone == bartender.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone already registered")
    
    # Verify venue exists
    venue = db.query(Venue).filter(Venue.id == bartender.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Create bartender user
    db_bartender = User(
        name=bartender.name,
        email=bartender.email,
        phone=bartender.phone,
        hashed_password=get_password_hash(bartender.password),
        role="bartender",
        venue_id=bartender.venue_id
    )
    
    db.add(db_bartender)
    db.commit()
    db.refresh(db_bartender)
    
    return BartenderResponse(
        id=db_bartender.id,
        name=db_bartender.name,
        email=db_bartender.email,
        phone=db_bartender.phone,
        venue_id=db_bartender.venue_id,
        venue_name=venue.name,
        created_at=db_bartender.created_at
    )


@router.put("/bartenders/{bartender_id}", response_model=BartenderResponse)
def update_bartender(
    bartender_id: str,
    bartender_update: BartenderUpdate,
    db: Session = Depends(get_db)
):
    """Update bartender details"""
    bartender = db.query(User).filter(
        User.id == bartender_id,
        User.role == "bartender"
    ).first()
    
    if not bartender:
        raise HTTPException(status_code=404, detail="Bartender not found")
    
    # Update only provided fields
    update_data = bartender_update.dict(exclude_unset=True)
    
    # Check for duplicate email/phone if being updated
    if 'email' in update_data and update_data['email']:
        existing = db.query(User).filter(
            User.email == update_data['email'],
            User.id != bartender_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    if 'phone' in update_data and update_data['phone']:
        existing = db.query(User).filter(
            User.phone == update_data['phone'],
            User.id != bartender_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone already in use")
    
    # Verify venue exists if being updated
    if 'venue_id' in update_data and update_data['venue_id']:
        venue = db.query(Venue).filter(Venue.id == update_data['venue_id']).first()
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
    
    for key, value in update_data.items():
        setattr(bartender, key, value)
    
    db.commit()
    db.refresh(bartender)
    
    venue_name = None
    if bartender.venue_id:
        venue = db.query(Venue).filter(Venue.id == bartender.venue_id).first()
        if venue:
            venue_name = venue.name
    
    return BartenderResponse(
        id=bartender.id,
        name=bartender.name,
        email=bartender.email,
        phone=bartender.phone,
        venue_id=bartender.venue_id,
        venue_name=venue_name,
        created_at=bartender.created_at
    )


@router.delete("/bartenders/{bartender_id}")
def delete_bartender(bartender_id: str, db: Session = Depends(get_db)):
    """Delete a bartender"""
    bartender = db.query(User).filter(
        User.id == bartender_id,
        User.role == "bartender"
    ).first()
    
    if not bartender:
        raise HTTPException(status_code=404, detail="Bartender not found")
    
    # Check if bartender has redeemed any items
    redemption_count = db.query(Redemption).filter(
        Redemption.redeemed_by_staff_id == bartender_id
    ).count()
    
    if redemption_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete bartender with {redemption_count} redemption records. Consider deactivating instead."
        )
    
    db.delete(bartender)
    db.commit()
    return {"message": "Bartender deleted successfully"}


# ============ Analytics Endpoints ============

@router.get("/analytics/revenue", response_model=RevenueAnalytics)
def get_revenue_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    venue_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get revenue analytics with trends and breakdowns"""
    
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        start = datetime.now() - timedelta(days=30)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        end = datetime.now()
    
    # Base query for confirmed purchases
    query = db.query(Purchase).filter(Purchase.payment_status == PaymentStatus.CONFIRMED)
    
    if venue_id:
        query = query.filter(Purchase.venue_id == venue_id)
    
    # Total revenue (all time)
    total_revenue = db.query(func.sum(Purchase.purchase_price)).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).scalar() or 0
    
    # Revenue this month
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    revenue_this_month = db.query(func.sum(Purchase.purchase_price)).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= month_start
    ).scalar() or 0
    
    # Revenue this week
    week_start = datetime.now() - timedelta(days=datetime.now().weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    revenue_this_week = db.query(func.sum(Purchase.purchase_price)).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= week_start
    ).scalar() or 0
    
    # Revenue today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    revenue_today = db.query(func.sum(Purchase.purchase_price)).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= today_start
    ).scalar() or 0
    
    # Average order value
    total_orders = db.query(func.count(Purchase.id)).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).scalar() or 1
    average_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Revenue by venue
    revenue_by_venue_data = db.query(
        Venue.id,
        Venue.name,
        func.sum(Purchase.purchase_price).label('revenue'),
        func.count(Purchase.id).label('bottles_sold')
    ).join(Purchase).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).group_by(Venue.id, Venue.name).all()
    
    revenue_by_venue = [
        VenueRevenue(
            venue_id=v.id,
            venue_name=v.name,
            revenue=v.revenue or 0,
            bottles_sold=v.bottles_sold or 0
        )
        for v in revenue_by_venue_data
    ]
    
    # Revenue trend (last 30 days)
    revenue_trend_data = db.query(
        func.date(Purchase.purchased_at).label('date'),
        func.sum(Purchase.purchase_price).label('revenue')
    ).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= start,
        Purchase.purchased_at <= end
    ).group_by(func.date(Purchase.purchased_at)).order_by(func.date(Purchase.purchased_at)).all()
    
    revenue_trend = [
        RevenueTrend(
            date=str(r.date),
            revenue=r.revenue or 0
        )
        for r in revenue_trend_data
    ]
    
    return RevenueAnalytics(
        total_revenue=total_revenue,
        revenue_this_month=revenue_this_month,
        revenue_this_week=revenue_this_week,
        revenue_today=revenue_today,
        average_order_value=average_order_value,
        revenue_by_venue=revenue_by_venue,
        revenue_trend=revenue_trend
    )


@router.get("/analytics/sales", response_model=SalesAnalytics)
def get_sales_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    venue_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get sales analytics with top bottles and trends"""
    
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        start = datetime.now() - timedelta(days=30)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        end = datetime.now()
    
    # Total bottles sold (all time)
    total_bottles_sold = db.query(func.count(Purchase.id)).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).scalar() or 0
    
    # Bottles sold this month
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    bottles_sold_this_month = db.query(func.count(Purchase.id)).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= month_start
    ).scalar() or 0
    
    # Bottles sold this week
    week_start = datetime.now() - timedelta(days=datetime.now().weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    bottles_sold_this_week = db.query(func.count(Purchase.id)).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= week_start
    ).scalar() or 0
    
    # Bottles sold today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    bottles_sold_today = db.query(func.count(Purchase.id)).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= today_start
    ).scalar() or 0
    
    # Top bottles
    top_bottles_data = db.query(
        Bottle.id,
        Bottle.name,
        Bottle.brand,
        func.count(Purchase.id).label('quantity_sold'),
        func.sum(Purchase.purchase_price).label('revenue')
    ).join(Purchase).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).group_by(Bottle.id, Bottle.name, Bottle.brand).order_by(
        func.count(Purchase.id).desc()
    ).limit(10).all()
    
    top_bottles = [
        TopBottle(
            bottle_id=b.id,
            bottle_name=b.name,
            bottle_brand=b.brand,
            quantity_sold=b.quantity_sold or 0,
            revenue=b.revenue or 0
        )
        for b in top_bottles_data
    ]
    
    # Sales trend (last 30 days)
    sales_trend_data = db.query(
        func.date(Purchase.purchased_at).label('date'),
        func.count(Purchase.id).label('bottles_sold')
    ).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= start,
        Purchase.purchased_at <= end
    ).group_by(func.date(Purchase.purchased_at)).order_by(func.date(Purchase.purchased_at)).all()
    
    sales_trend = [
        SalesTrend(
            date=str(s.date),
            bottles_sold=s.bottles_sold or 0
        )
        for s in sales_trend_data
    ]
    
    # Sales by venue
    sales_by_venue_data = db.query(
        Venue.id,
        Venue.name,
        func.sum(Purchase.purchase_price).label('revenue'),
        func.count(Purchase.id).label('bottles_sold')
    ).join(Purchase).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).group_by(Venue.id, Venue.name).all()
    
    sales_by_venue = [
        VenueRevenue(
            venue_id=v.id,
            venue_name=v.name,
            revenue=v.revenue or 0,
            bottles_sold=v.bottles_sold or 0
        )
        for v in sales_by_venue_data
    ]
    
    return SalesAnalytics(
        total_bottles_sold=total_bottles_sold,
        bottles_sold_this_month=bottles_sold_this_month,
        bottles_sold_this_week=bottles_sold_this_week,
        bottles_sold_today=bottles_sold_today,
        top_bottles=top_bottles,
        sales_trend=sales_trend,
        sales_by_venue=sales_by_venue
    )


@router.get("/analytics/redemptions", response_model=RedemptionAnalytics)
def get_redemption_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    venue_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get redemption analytics with venue breakdown and hourly patterns"""
    
    # Total redemptions
    total_redemptions = db.query(func.count(Redemption.id)).scalar() or 0
    
    # Redeemed count
    redeemed_count = db.query(func.count(Redemption.id)).filter(
        Redemption.status == RedemptionStatus.REDEEMED
    ).scalar() or 0
    
    # Pending count
    pending_count = db.query(func.count(Redemption.id)).filter(
        Redemption.status == RedemptionStatus.PENDING
    ).scalar() or 0
    
    # Expired count
    expired_count = db.query(func.count(Redemption.id)).filter(
        Redemption.status == RedemptionStatus.EXPIRED
    ).scalar() or 0
    
    # Redemption rate
    redemption_rate = (redeemed_count / total_redemptions * 100) if total_redemptions > 0 else 0.0
    
    # Redemptions by venue
    redemptions_by_venue_data = db.query(
        Venue.id,
        Venue.name,
        func.count(Redemption.id).label('total_redemptions')
    ).join(Redemption).group_by(Venue.id, Venue.name).all()
    
    # Get pending and redeemed counts separately for each venue
    venue_redemptions_list = []
    for v in redemptions_by_venue_data:
        pending = db.query(func.count(Redemption.id)).filter(
            Redemption.venue_id == v.id,
            Redemption.status == RedemptionStatus.PENDING
        ).scalar() or 0
        
        redeemed = db.query(func.count(Redemption.id)).filter(
            Redemption.venue_id == v.id,
            Redemption.status == RedemptionStatus.REDEEMED
        ).scalar() or 0
        
        venue_redemptions_list.append(VenueRedemptions(
            venue_id=v.id,
            venue_name=v.name,
            total_redemptions=v.total_redemptions or 0,
            pending_redemptions=pending,
            redeemed_count=redeemed
        ))
    
    redemptions_by_venue = venue_redemptions_list
    
    # Redemptions by hour (for redeemed items)
    redemptions_by_hour_data = db.query(
        func.extract('hour', Redemption.redeemed_at).label('hour'),
        func.count(Redemption.id).label('count')
    ).filter(
        Redemption.status == RedemptionStatus.REDEEMED,
        Redemption.redeemed_at.isnot(None)
    ).group_by(func.extract('hour', Redemption.redeemed_at)).all()
    
    redemptions_by_hour = [
        HourlyRedemptions(
            hour=int(r.hour) if r.hour else 0,
            count=r.count or 0
        )
        for r in redemptions_by_hour_data
    ]
    
    return RedemptionAnalytics(
        total_redemptions=total_redemptions,
        redeemed_count=redeemed_count,
        pending_count=pending_count,
        expired_count=expired_count,
        redemption_rate=redemption_rate,
        redemptions_by_venue=redemptions_by_venue,
        redemptions_by_hour=redemptions_by_hour
    )


@router.get("/analytics/users", response_model=UserAnalytics)
def get_user_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get user analytics with growth trends"""
    
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        start = datetime.now() - timedelta(days=30)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        end = datetime.now()
    
    # Total users
    total_users = db.query(func.count(User.id)).scalar() or 0
    
    # New users this month
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_this_month = db.query(func.count(User.id)).filter(
        User.created_at >= month_start
    ).scalar() or 0
    
    # New users this week
    week_start = datetime.now() - timedelta(days=datetime.now().weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    new_users_this_week = db.query(func.count(User.id)).filter(
        User.created_at >= week_start
    ).scalar() or 0
    
    # New users today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    new_users_today = db.query(func.count(User.id)).filter(
        User.created_at >= today_start
    ).scalar() or 0
    
    # Users by role
    customers_count = db.query(func.count(User.id)).filter(User.role == "customer").scalar() or 0
    bartenders_count = db.query(func.count(User.id)).filter(User.role == "bartender").scalar() or 0
    admins_count = db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0
    
    # User growth trend (last 30 days)
    user_growth_data = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('new_users')
    ).filter(
        User.created_at >= start,
        User.created_at <= end
    ).group_by(func.date(User.created_at)).order_by(func.date(User.created_at)).all()
    
    # Calculate cumulative total
    cumulative_total = db.query(func.count(User.id)).filter(
        User.created_at < start
    ).scalar() or 0
    
    user_growth = []
    for ug in user_growth_data:
        cumulative_total += ug.new_users
        user_growth.append(UserGrowth(
            date=str(ug.date),
            total_users=cumulative_total,
            new_users=ug.new_users or 0
        ))
    
    return UserAnalytics(
        total_users=total_users,
        new_users_this_month=new_users_this_month,
        new_users_this_week=new_users_this_week,
        new_users_today=new_users_today,
        customers_count=customers_count,
        bartenders_count=bartenders_count,
        admins_count=admins_count,
        user_growth=user_growth
    )



# ============ Report Endpoints ============

@router.get("/reports/revenue", response_model=RevenueReport)
def get_revenue_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    venue_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Generate detailed revenue report"""
    
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        start = datetime.now() - timedelta(days=30)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        end = datetime.now()
    
    # Query purchases with details
    query = db.query(
        Purchase.purchased_at,
        Venue.name.label('venue_name'),
        Bottle.name.label('bottle_name'),
        Bottle.brand.label('bottle_brand'),
        Purchase.purchase_price,
        Purchase.payment_method
    ).join(Venue).join(Bottle).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= start,
        Purchase.purchased_at <= end
    )
    
    if venue_id:
        query = query.filter(Purchase.venue_id == venue_id)
    
    purchases = query.order_by(Purchase.purchased_at.desc()).all()
    
    # Build report items
    items = []
    for p in purchases:
        items.append(RevenueReportItem(
            date=str(p.purchased_at.date()) if p.purchased_at else str(datetime.now().date()),
            venue_name=p.venue_name,
            bottle_name=p.bottle_name,
            bottle_brand=p.bottle_brand,
            quantity=1,
            unit_price=p.purchase_price,
            total_revenue=p.purchase_price,
            payment_method=p.payment_method.value if p.payment_method else None
        ))
    
    # Calculate totals
    total_revenue = sum(item.total_revenue for item in items)
    total_transactions = len(items)
    
    return RevenueReport(
        items=items,
        total_revenue=total_revenue,
        total_transactions=total_transactions,
        start_date=str(start.date()),
        end_date=str(end.date())
    )


@router.get("/reports/sales", response_model=SalesReport)
def get_sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    venue_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Generate detailed sales report"""
    
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        start = datetime.now() - timedelta(days=30)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        end = datetime.now()
    
    # Query sales by bottle
    query = db.query(
        Bottle.id,
        Bottle.name,
        Bottle.brand,
        Venue.name.label('venue_name'),
        func.count(Purchase.id).label('quantity_sold'),
        func.sum(Purchase.purchase_price).label('total_revenue'),
        func.avg(Purchase.purchase_price).label('average_price')
    ).join(Purchase).join(Venue).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= start,
        Purchase.purchased_at <= end
    )
    
    if venue_id:
        query = query.filter(Purchase.venue_id == venue_id)
    
    sales = query.group_by(Bottle.id, Bottle.name, Bottle.brand, Venue.name).order_by(
        func.count(Purchase.id).desc()
    ).all()
    
    # Build report items
    items = [
        SalesReportItem(
            bottle_id=s.id,
            bottle_name=s.name,
            bottle_brand=s.brand,
            venue_name=s.venue_name,
            quantity_sold=s.quantity_sold or 0,
            total_revenue=s.total_revenue or 0,
            average_price=s.average_price or 0
        )
        for s in sales
    ]
    
    # Calculate totals
    total_bottles_sold = sum(item.quantity_sold for item in items)
    total_revenue = sum(item.total_revenue for item in items)
    
    return SalesReport(
        items=items,
        total_bottles_sold=total_bottles_sold,
        total_revenue=total_revenue,
        start_date=str(start.date()),
        end_date=str(end.date())
    )


@router.get("/reports/inventory", response_model=InventoryReport)
def get_inventory_report(
    venue_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Generate inventory report"""
    
    # Query bottles with sales data
    query = db.query(
        Bottle.id,
        Bottle.name,
        Bottle.brand,
        Venue.name.label('venue_name'),
        Bottle.price,
        Bottle.volume_ml,
        Bottle.is_available
    ).join(Venue)
    
    if venue_id:
        query = query.filter(Bottle.venue_id == venue_id)
    
    bottles = query.all()
    
    # Build report items with sales data
    items = []
    for b in bottles:
        # Get sales count for this bottle
        total_sold = db.query(func.count(Purchase.id)).filter(
            Purchase.bottle_id == b.id,
            Purchase.payment_status == PaymentStatus.CONFIRMED
        ).scalar() or 0
        
        # Get total revenue for this bottle
        total_revenue = db.query(func.sum(Purchase.purchase_price)).filter(
            Purchase.bottle_id == b.id,
            Purchase.payment_status == PaymentStatus.CONFIRMED
        ).scalar() or 0
        
        items.append(InventoryReportItem(
            bottle_id=b.id,
            bottle_name=b.name,
            bottle_brand=b.brand,
            venue_name=b.venue_name,
            price=b.price,
            volume_ml=b.volume_ml,
            is_available=b.is_available,
            total_sold=total_sold,
            total_revenue=total_revenue
        ))
    
    # Calculate totals
    total_bottles = len(items)
    available_bottles = sum(1 for item in items if item.is_available)
    unavailable_bottles = total_bottles - available_bottles
    
    return InventoryReport(
        items=items,
        total_bottles=total_bottles,
        available_bottles=available_bottles,
        unavailable_bottles=unavailable_bottles
    )


@router.get("/reports/user-activity", response_model=UserActivityReport)
def get_user_activity_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Generate user activity report"""
    
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        start = datetime.now() - timedelta(days=30)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        end = datetime.now()
    
    # Query users with activity
    users = db.query(User).filter(User.role == "customer").all()
    
    items = []
    total_spent_all = 0
    active_users = 0
    
    for user in users:
        # Get purchase count and total spent
        purchase_data = db.query(
            func.count(Purchase.id).label('count'),
            func.sum(Purchase.purchase_price).label('total')
        ).filter(
            Purchase.user_id == user.id,
            Purchase.payment_status == PaymentStatus.CONFIRMED,
            Purchase.purchased_at >= start,
            Purchase.purchased_at <= end
        ).first()
        
        total_purchases = purchase_data.count or 0
        total_spent = purchase_data.total or 0
        
        # Get redemption count
        total_redemptions = db.query(func.count(Redemption.id)).filter(
            Redemption.user_id == user.id,
            Redemption.created_at >= start,
            Redemption.created_at <= end
        ).scalar() or 0
        
        # Get last activity
        last_purchase = db.query(Purchase.purchased_at).filter(
            Purchase.user_id == user.id,
            Purchase.payment_status == PaymentStatus.CONFIRMED
        ).order_by(Purchase.purchased_at.desc()).first()
        
        last_activity = last_purchase.purchased_at if last_purchase else None
        
        if total_purchases > 0:
            active_users += 1
        
        total_spent_all += total_spent
        
        items.append(UserActivityReportItem(
            user_id=user.id,
            user_name=user.name,
            user_email=user.email,
            total_purchases=total_purchases,
            total_spent=total_spent,
            total_redemptions=total_redemptions,
            last_activity=last_activity,
            joined_date=user.created_at
        ))
    
    # Sort by total spent descending
    items.sort(key=lambda x: x.total_spent, reverse=True)
    
    return UserActivityReport(
        items=items,
        total_users=len(items),
        active_users=active_users,
        total_spent=total_spent_all
    )


# ============ Venue Analytics Endpoints ============

@router.get("/analytics/venues/comparison", response_model=VenuePerformanceComparison)
def get_venue_comparison(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get venue performance comparison - OPTIMIZED"""
    from schemas import VenuePerformanceComparison, VenuePerformanceMetrics, VenueComparisonItem
    
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        start = datetime.now() - timedelta(days=30)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        end = datetime.now()
    
    # Get all venues with aggregated data in fewer queries
    venues = db.query(Venue).all()
    total_venues = len(venues)
    
    # Get all purchase data in one query
    purchase_data = db.query(
        Purchase.venue_id,
        func.sum(Purchase.purchase_price).label('total_revenue'),
        func.count(Purchase.id).label('total_bottles_sold'),
        func.count(func.distinct(Purchase.user_id)).label('total_customers')
    ).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).group_by(Purchase.venue_id).all()
    
    # Get redemption data in one query
    redemption_data = db.query(
        Redemption.venue_id,
        func.count(Redemption.id).label('total_redemptions')
    ).filter(
        Redemption.status == RedemptionStatus.REDEEMED
    ).group_by(Redemption.venue_id).all()
    
    # Get active bottles in one query
    bottle_data = db.query(
        Bottle.venue_id,
        func.count(Bottle.id).label('active_bottles')
    ).filter(
        Bottle.is_available == True
    ).group_by(Bottle.venue_id).all()
    
    # Create lookup dictionaries
    purchase_lookup = {p.venue_id: p for p in purchase_data}
    redemption_lookup = {r.venue_id: r for r in redemption_data}
    bottle_lookup = {b.venue_id: b for b in bottle_data}
    
    # Calculate metrics for each venue
    venue_metrics = []
    for venue in venues:
        p_data = purchase_lookup.get(venue.id)
        r_data = redemption_lookup.get(venue.id)
        b_data = bottle_lookup.get(venue.id)
        
        total_revenue = float(p_data.total_revenue) if p_data and p_data.total_revenue else 0
        total_bottles_sold = p_data.total_bottles_sold if p_data else 0
        total_customers = p_data.total_customers if p_data else 0
        total_redemptions = r_data.total_redemptions if r_data else 0
        active_bottles = b_data.active_bottles if b_data else 0
        
        # Average order value
        average_order_value = total_revenue / total_bottles_sold if total_bottles_sold > 0 else 0
        
        # Redemption rate
        redemption_rate = (total_redemptions / total_bottles_sold * 100) if total_bottles_sold > 0 else 0.0
        
        venue_metrics.append({
            'venue_id': venue.id,
            'venue_name': venue.name,
            'total_revenue': total_revenue,
            'total_bottles_sold': total_bottles_sold,
            'total_redemptions': total_redemptions,
            'active_bottles': active_bottles,
            'total_customers': total_customers,
            'average_order_value': average_order_value,
            'redemption_rate': redemption_rate
        })
    
    # Sort by revenue and assign ranks
    venue_metrics_sorted_revenue = sorted(venue_metrics, key=lambda x: x['total_revenue'], reverse=True)
    for idx, vm in enumerate(venue_metrics_sorted_revenue):
        vm['revenue_rank'] = idx + 1
    
    # Sort by sales and assign ranks
    venue_metrics_sorted_sales = sorted(venue_metrics, key=lambda x: x['total_bottles_sold'], reverse=True)
    for idx, vm in enumerate(venue_metrics_sorted_sales):
        for vm2 in venue_metrics:
            if vm2['venue_id'] == vm['venue_id']:
                vm2['sales_rank'] = idx + 1
                break
    
    # Build response
    venues_list = [
        VenuePerformanceMetrics(**vm)
        for vm in venue_metrics
    ]
    
    # Comparison data (for charts)
    comparison_data = [
        VenueComparisonItem(
            venue_id=vm['venue_id'],
            venue_name=vm['venue_name'],
            revenue=vm['total_revenue'],
            bottles_sold=vm['total_bottles_sold'],
            redemptions=vm['total_redemptions'],
            customers=vm['total_customers']
        )
        for vm in venue_metrics
    ]
    
    return VenuePerformanceComparison(
        venues=venues_list,
        comparison_data=comparison_data,
        start_date=str(start.date()),
        end_date=str(end.date()),
        total_venues=total_venues
    )


@router.get("/analytics/venues/{venue_id}", response_model=VenueDetailedAnalytics)
def get_venue_detailed_analytics(
    venue_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get detailed analytics for a specific venue"""
    from schemas import VenueDetailedAnalytics, VenueTrendData, VenueTopBottle
    
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        start = datetime.now() - timedelta(days=30)
    
    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        end = datetime.now()
    
    # Get venue
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    # Total revenue (all time)
    total_revenue = db.query(func.sum(Purchase.purchase_price)).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).scalar() or 0
    
    # Revenue this month
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    revenue_this_month = db.query(func.sum(Purchase.purchase_price)).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= month_start
    ).scalar() or 0
    
    # Revenue this week
    week_start = datetime.now() - timedelta(days=datetime.now().weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    revenue_this_week = db.query(func.sum(Purchase.purchase_price)).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= week_start
    ).scalar() or 0
    
    # Total bottles sold
    total_bottles_sold = db.query(func.count(Purchase.id)).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).scalar() or 0
    
    # Bottles sold this month
    bottles_sold_this_month = db.query(func.count(Purchase.id)).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= month_start
    ).scalar() or 0
    
    # Total redemptions
    total_redemptions = db.query(func.count(Redemption.id)).filter(
        Redemption.venue_id == venue_id,
        Redemption.status == RedemptionStatus.REDEEMED
    ).scalar() or 0
    
    # Redemptions this month
    redemptions_this_month = db.query(func.count(Redemption.id)).filter(
        Redemption.venue_id == venue_id,
        Redemption.status == RedemptionStatus.REDEEMED,
        Redemption.redeemed_at >= month_start
    ).scalar() or 0
    
    # Active bottles
    active_bottles = db.query(func.count(Bottle.id)).filter(
        Bottle.venue_id == venue_id,
        Bottle.is_available == True
    ).scalar() or 0
    
    # Total customers
    total_customers = db.query(func.count(func.distinct(Purchase.user_id))).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).scalar() or 0
    
    # Average order value
    average_order_value = total_revenue / total_bottles_sold if total_bottles_sold > 0 else 0
    
    # Redemption rate
    redemption_rate = (total_redemptions / total_bottles_sold * 100) if total_bottles_sold > 0 else 0.0
    
    # Revenue trend with redemptions - OPTIMIZED
    revenue_trend_data = db.query(
        func.date(Purchase.purchased_at).label('date'),
        func.sum(Purchase.purchase_price).label('revenue'),
        func.count(Purchase.id).label('bottles_sold')
    ).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.purchased_at >= start,
        Purchase.purchased_at <= end
    ).group_by(func.date(Purchase.purchased_at)).order_by(func.date(Purchase.purchased_at)).all()
    
    # Get all redemptions for the date range in one query
    redemptions_by_date = db.query(
        func.date(Redemption.redeemed_at).label('date'),
        func.count(Redemption.id).label('count')
    ).filter(
        Redemption.venue_id == venue_id,
        Redemption.status == RedemptionStatus.REDEEMED,
        Redemption.redeemed_at >= start,
        Redemption.redeemed_at <= end
    ).group_by(func.date(Redemption.redeemed_at)).all()
    
    # Create lookup dictionary for redemptions
    redemptions_lookup = {str(r.date): r.count for r in redemptions_by_date}
    
    # Build trend data
    revenue_trend = []
    for r in revenue_trend_data:
        date_str = str(r.date)
        redemptions = redemptions_lookup.get(date_str, 0)
        
        revenue_trend.append(VenueTrendData(
            date=date_str,
            revenue=r.revenue or 0,
            bottles_sold=r.bottles_sold or 0,
            redemptions=redemptions
        ))
    
    # Top bottles
    top_bottles_data = db.query(
        Bottle.id,
        Bottle.name,
        Bottle.brand,
        func.count(Purchase.id).label('quantity_sold'),
        func.sum(Purchase.purchase_price).label('revenue')
    ).join(Purchase).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).group_by(Bottle.id, Bottle.name, Bottle.brand).order_by(
        func.count(Purchase.id).desc()
    ).limit(10).all()
    
    top_bottles = [
        VenueTopBottle(
            bottle_id=b.id,
            bottle_name=b.name,
            bottle_brand=b.brand,
            quantity_sold=b.quantity_sold or 0,
            revenue=b.revenue or 0
        )
        for b in top_bottles_data
    ]
    
    # Calculate rankings - OPTIMIZED with single queries
    all_venues = db.query(Venue).all()
    total_venues = len(all_venues)
    
    # Revenue ranking - single query
    venue_revenues = db.query(
        Purchase.venue_id,
        func.sum(Purchase.purchase_price).label('revenue')
    ).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).group_by(Purchase.venue_id).order_by(func.sum(Purchase.purchase_price).desc()).all()
    
    revenue_rank = next((idx + 1 for idx, vr in enumerate(venue_revenues) if vr.venue_id == venue_id), total_venues)
    
    # Sales ranking - single query
    venue_sales = db.query(
        Purchase.venue_id,
        func.count(Purchase.id).label('sales')
    ).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).group_by(Purchase.venue_id).order_by(func.count(Purchase.id).desc()).all()
    
    sales_rank = next((idx + 1 for idx, vs in enumerate(venue_sales) if vs.venue_id == venue_id), total_venues)
    
    return VenueDetailedAnalytics(
        venue_id=venue.id,
        venue_name=venue.name,
        venue_location=venue.location,
        total_revenue=total_revenue,
        revenue_this_month=revenue_this_month,
        revenue_this_week=revenue_this_week,
        total_bottles_sold=total_bottles_sold,
        bottles_sold_this_month=bottles_sold_this_month,
        total_redemptions=total_redemptions,
        redemptions_this_month=redemptions_this_month,
        active_bottles=active_bottles,
        total_customers=total_customers,
        average_order_value=average_order_value,
        redemption_rate=redemption_rate,
        revenue_trend=revenue_trend,
        top_bottles=top_bottles,
        revenue_rank=revenue_rank,
        sales_rank=sales_rank,
        total_venues=total_venues
    )


# ============ Promotion Management Endpoints ============

@router.get("/promotions", response_model=PromotionList)
def get_promotions(
    status: Optional[str] = None,
    venue_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all promotions with filters"""
    from models import Promotion, PromotionStatus
    from schemas import PromotionList, PromotionResponse
    
    query = db.query(Promotion)
    
    # Apply filters
    if status:
        try:
            status_enum = PromotionStatus(status)
            query = query.filter(Promotion.status == status_enum)
        except ValueError:
            pass
    
    if venue_id:
        query = query.filter((Promotion.venue_id == venue_id) | (Promotion.venue_id == None))
    
    # Order by most recent first
    query = query.order_by(Promotion.created_at.desc())
    
    total = query.count()
    promotions = query.offset(skip).limit(limit).all()
    
    # Transform to include venue name
    result = []
    for promo in promotions:
        venue_name = None
        if promo.venue_id:
            venue = db.query(Venue).filter(Venue.id == promo.venue_id).first()
            if venue:
                venue_name = venue.name
        
        result.append(PromotionResponse(
            id=promo.id,
            code=promo.code,
            name=promo.name,
            description=promo.description,
            type=promo.type.value,
            value=promo.value,
            min_purchase_amount=promo.min_purchase_amount,
            max_discount_amount=promo.max_discount_amount,
            usage_limit=promo.usage_limit,
            usage_count=promo.usage_count,
            per_user_limit=promo.per_user_limit,
            venue_id=promo.venue_id,
            venue_name=venue_name,
            valid_from=promo.valid_from,
            valid_until=promo.valid_until,
            status=promo.status.value,
            created_at=promo.created_at,
            updated_at=promo.updated_at
        ))
    
    return PromotionList(promotions=result, total=total)


@router.get("/promotions/{promotion_id}", response_model=PromotionResponse)
def get_promotion(promotion_id: str, db: Session = Depends(get_db)):
    """Get promotion details"""
    from models import Promotion
    from schemas import PromotionResponse
    
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    venue_name = None
    if promo.venue_id:
        venue = db.query(Venue).filter(Venue.id == promo.venue_id).first()
        if venue:
            venue_name = venue.name
    
    return PromotionResponse(
        id=promo.id,
        code=promo.code,
        name=promo.name,
        description=promo.description,
        type=promo.type.value,
        value=promo.value,
        min_purchase_amount=promo.min_purchase_amount,
        max_discount_amount=promo.max_discount_amount,
        usage_limit=promo.usage_limit,
        usage_count=promo.usage_count,
        per_user_limit=promo.per_user_limit,
        venue_id=promo.venue_id,
        venue_name=venue_name,
        valid_from=promo.valid_from,
        valid_until=promo.valid_until,
        status=promo.status.value,
        created_at=promo.created_at,
        updated_at=promo.updated_at
    )


@router.post("/promotions", response_model=PromotionResponse)
def create_promotion(
    promotion: PromotionCreate,
    db: Session = Depends(get_db)
):
    """Create a new promotion"""
    from models import Promotion, PromotionType, PromotionStatus
    from schemas import PromotionCreate, PromotionResponse
    
    # Check if code already exists
    existing = db.query(Promotion).filter(Promotion.code == promotion.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Promotion code already exists")
    
    # Verify venue exists if specified
    if promotion.venue_id:
        venue = db.query(Venue).filter(Venue.id == promotion.venue_id).first()
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
    
    # Validate dates
    if promotion.valid_from >= promotion.valid_until:
        raise HTTPException(status_code=400, detail="valid_from must be before valid_until")
    
    # Create promotion
    db_promotion = Promotion(
        code=promotion.code.upper(),  # Store codes in uppercase
        name=promotion.name,
        description=promotion.description,
        type=PromotionType(promotion.type),
        value=promotion.value,
        min_purchase_amount=promotion.min_purchase_amount,
        max_discount_amount=promotion.max_discount_amount,
        usage_limit=promotion.usage_limit,
        per_user_limit=promotion.per_user_limit,
        venue_id=promotion.venue_id,
        valid_from=promotion.valid_from,
        valid_until=promotion.valid_until,
        status=PromotionStatus(promotion.status)
    )
    
    db.add(db_promotion)
    db.commit()
    db.refresh(db_promotion)
    
    venue_name = None
    if db_promotion.venue_id:
        venue = db.query(Venue).filter(Venue.id == db_promotion.venue_id).first()
        if venue:
            venue_name = venue.name
    
    return PromotionResponse(
        id=db_promotion.id,
        code=db_promotion.code,
        name=db_promotion.name,
        description=db_promotion.description,
        type=db_promotion.type.value,
        value=db_promotion.value,
        min_purchase_amount=db_promotion.min_purchase_amount,
        max_discount_amount=db_promotion.max_discount_amount,
        usage_limit=db_promotion.usage_limit,
        usage_count=db_promotion.usage_count,
        per_user_limit=db_promotion.per_user_limit,
        venue_id=db_promotion.venue_id,
        venue_name=venue_name,
        valid_from=db_promotion.valid_from,
        valid_until=db_promotion.valid_until,
        status=db_promotion.status.value,
        created_at=db_promotion.created_at,
        updated_at=db_promotion.updated_at
    )


@router.put("/promotions/{promotion_id}", response_model=PromotionResponse)
def update_promotion(
    promotion_id: str,
    promotion_update: PromotionUpdate,
    db: Session = Depends(get_db)
):
    """Update promotion details"""
    from models import Promotion, PromotionType, PromotionStatus
    from schemas import PromotionUpdate, PromotionResponse
    
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    # Update only provided fields
    update_data = promotion_update.dict(exclude_unset=True)
    
    # Check for duplicate code if being updated
    if 'code' in update_data and update_data['code']:
        existing = db.query(Promotion).filter(
            Promotion.code == update_data['code'].upper(),
            Promotion.id != promotion_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Promotion code already in use")
        update_data['code'] = update_data['code'].upper()
    
    # Verify venue exists if being updated
    if 'venue_id' in update_data and update_data['venue_id']:
        venue = db.query(Venue).filter(Venue.id == update_data['venue_id']).first()
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
    
    # Convert enum strings to enums
    if 'type' in update_data:
        update_data['type'] = PromotionType(update_data['type'])
    if 'status' in update_data:
        update_data['status'] = PromotionStatus(update_data['status'])
    
    for key, value in update_data.items():
        setattr(promo, key, value)
    
    db.commit()
    db.refresh(promo)
    
    venue_name = None
    if promo.venue_id:
        venue = db.query(Venue).filter(Venue.id == promo.venue_id).first()
        if venue:
            venue_name = venue.name
    
    return PromotionResponse(
        id=promo.id,
        code=promo.code,
        name=promo.name,
        description=promo.description,
        type=promo.type.value,
        value=promo.value,
        min_purchase_amount=promo.min_purchase_amount,
        max_discount_amount=promo.max_discount_amount,
        usage_limit=promo.usage_limit,
        usage_count=promo.usage_count,
        per_user_limit=promo.per_user_limit,
        venue_id=promo.venue_id,
        venue_name=venue_name,
        valid_from=promo.valid_from,
        valid_until=promo.valid_until,
        status=promo.status.value,
        created_at=promo.created_at,
        updated_at=promo.updated_at
    )


@router.delete("/promotions/{promotion_id}")
def delete_promotion(promotion_id: str, db: Session = Depends(get_db)):
    """Delete a promotion"""
    from models import Promotion
    
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    
    db.delete(promo)
    db.commit()
    return {"message": "Promotion deleted successfully"}


@router.post("/promotions/validate", response_model=PromotionValidationResponse)
def validate_promotion(
    validation: PromotionValidation,
    db: Session = Depends(get_db)
):
    """Validate a promotion code"""
    from models import Promotion, PromotionStatus, PromotionType, Purchase, PaymentStatus
    from schemas import PromotionValidation, PromotionValidationResponse, PromotionResponse
    
    # Find promotion by code
    promo = db.query(Promotion).filter(Promotion.code == validation.code.upper()).first()
    
    if not promo:
        return PromotionValidationResponse(
            valid=False,
            message="Invalid promotion code"
        )
    
    # Check status
    if promo.status != PromotionStatus.ACTIVE:
        return PromotionValidationResponse(
            valid=False,
            message="Promotion is not active"
        )
    
    # Check dates
    now = datetime.now()
    if now < promo.valid_from:
        return PromotionValidationResponse(
            valid=False,
            message="Promotion has not started yet"
        )
    if now > promo.valid_until:
        return PromotionValidationResponse(
            valid=False,
            message="Promotion has expired"
        )
    
    # Check venue
    if promo.venue_id and promo.venue_id != validation.venue_id:
        return PromotionValidationResponse(
            valid=False,
            message="Promotion not valid for this venue"
        )
    
    # Check minimum purchase amount
    if promo.min_purchase_amount and validation.purchase_amount < promo.min_purchase_amount:
        return PromotionValidationResponse(
            valid=False,
            message=f"Minimum purchase amount is ₹{promo.min_purchase_amount}"
        )
    
    # Check usage limit
    if promo.usage_limit and promo.usage_count >= promo.usage_limit:
        return PromotionValidationResponse(
            valid=False,
            message="Promotion usage limit reached"
        )
    
    # Check per-user limit
    if promo.per_user_limit:
        user_usage = db.query(func.count(Purchase.id)).filter(
            Purchase.user_id == validation.user_id,
            Purchase.promotion_code == promo.code,
            Purchase.payment_status == PaymentStatus.CONFIRMED
        ).scalar() or 0
        
        if user_usage >= promo.per_user_limit:
            return PromotionValidationResponse(
                valid=False,
                message="You have reached the usage limit for this promotion"
            )
    
    # Calculate discount
    discount_amount = 0
    if promo.type == PromotionType.PERCENTAGE:
        discount_amount = (validation.purchase_amount * promo.value) / 100
        if promo.max_discount_amount:
            discount_amount = min(discount_amount, promo.max_discount_amount)
    elif promo.type == PromotionType.FIXED_AMOUNT:
        discount_amount = min(promo.value, validation.purchase_amount)
    
    venue_name = None
    if promo.venue_id:
        venue = db.query(Venue).filter(Venue.id == promo.venue_id).first()
        if venue:
            venue_name = venue.name
    
    return PromotionValidationResponse(
        valid=True,
        message="Promotion code is valid",
        promotion=PromotionResponse(
            id=promo.id,
            code=promo.code,
            name=promo.name,
            description=promo.description,
            type=promo.type.value,
            value=promo.value,
            min_purchase_amount=promo.min_purchase_amount,
            max_discount_amount=promo.max_discount_amount,
            usage_limit=promo.usage_limit,
            usage_count=promo.usage_count,
            per_user_limit=promo.per_user_limit,
            venue_id=promo.venue_id,
            venue_name=venue_name,
            valid_from=promo.valid_from,
            valid_until=promo.valid_until,
            status=promo.status.value,
            created_at=promo.created_at,
            updated_at=promo.updated_at
        ),
        discount_amount=discount_amount
    )


# ============ Support Ticket Management Endpoints ============

@router.get("/tickets", response_model=SupportTicketList)
def get_support_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all support tickets with filters"""
    from models import SupportTicket, TicketStatus, TicketCategory, TicketPriority, TicketComment
    from schemas import SupportTicketList, SupportTicketResponse
    
    query = db.query(SupportTicket)
    
    # Apply filters
    if status:
        try:
            status_enum = TicketStatus(status)
            query = query.filter(SupportTicket.status == status_enum)
        except ValueError:
            pass
    
    if category:
        try:
            category_enum = TicketCategory(category)
            query = query.filter(SupportTicket.category == category_enum)
        except ValueError:
            pass
    
    if priority:
        try:
            priority_enum = TicketPriority(priority)
            query = query.filter(SupportTicket.priority == priority_enum)
        except ValueError:
            pass
    
    if assigned_to_id:
        if assigned_to_id == "unassigned":
            query = query.filter(SupportTicket.assigned_to_id == None)
        else:
            query = query.filter(SupportTicket.assigned_to_id == assigned_to_id)
    
    # Order by most recent first
    query = query.order_by(SupportTicket.created_at.desc())
    
    total = query.count()
    tickets = query.offset(skip).limit(limit).all()
    
    # Transform to include user and assignee names
    result = []
    for ticket in tickets:
        user_name = ticket.user.name if ticket.user else "Unknown"
        user_email = ticket.user.email if ticket.user else None
        
        assigned_to_name = None
        if ticket.assigned_to_id:
            assignee = db.query(User).filter(User.id == ticket.assigned_to_id).first()
            if assignee:
                assigned_to_name = assignee.name
        
        # Count comments
        comments_count = db.query(func.count(TicketComment.id)).filter(
            TicketComment.ticket_id == ticket.id
        ).scalar() or 0
        
        result.append(SupportTicketResponse(
            id=ticket.id,
            ticket_number=ticket.ticket_number,
            user_id=ticket.user_id,
            user_name=user_name,
            user_email=user_email,
            subject=ticket.subject,
            description=ticket.description,
            category=ticket.category.value,
            priority=ticket.priority.value,
            status=ticket.status.value,
            assigned_to_id=ticket.assigned_to_id,
            assigned_to_name=assigned_to_name,
            resolved_at=ticket.resolved_at,
            closed_at=ticket.closed_at,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            comments_count=comments_count
        ))
    
    return SupportTicketList(tickets=result, total=total)


@router.get("/tickets/{ticket_id}", response_model=SupportTicketDetailResponse)
def get_support_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """Get support ticket details with comments"""
    from models import SupportTicket, TicketComment
    from schemas import SupportTicketDetailResponse, TicketCommentResponse
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    user_name = ticket.user.name if ticket.user else "Unknown"
    user_email = ticket.user.email if ticket.user else None
    
    assigned_to_name = None
    if ticket.assigned_to_id:
        assignee = db.query(User).filter(User.id == ticket.assigned_to_id).first()
        if assignee:
            assigned_to_name = assignee.name
    
    # Get comments
    comments = db.query(TicketComment).filter(
        TicketComment.ticket_id == ticket_id
    ).order_by(TicketComment.created_at.asc()).all()
    
    comments_list = []
    for comment in comments:
        comment_user = db.query(User).filter(User.id == comment.user_id).first()
        comments_list.append(TicketCommentResponse(
            id=comment.id,
            ticket_id=comment.ticket_id,
            user_id=comment.user_id,
            user_name=comment_user.name if comment_user else "Unknown",
            comment=comment.comment,
            is_internal=comment.is_internal,
            created_at=comment.created_at
        ))
    
    return SupportTicketDetailResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        user_id=ticket.user_id,
        user_name=user_name,
        user_email=user_email,
        subject=ticket.subject,
        description=ticket.description,
        category=ticket.category.value,
        priority=ticket.priority.value,
        status=ticket.status.value,
        assigned_to_id=ticket.assigned_to_id,
        assigned_to_name=assigned_to_name,
        resolved_at=ticket.resolved_at,
        closed_at=ticket.closed_at,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        comments_count=len(comments_list),
        comments=comments_list
    )


@router.post("/tickets", response_model=SupportTicketResponse)
def create_support_ticket(
    ticket: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Create a new support ticket"""
    from models import SupportTicket, TicketCategory, TicketPriority, TicketStatus
    from schemas import SupportTicketCreate, SupportTicketResponse
    import random
    
    # Generate unique ticket number
    while True:
        ticket_number = f"TKT-{random.randint(100000, 999999)}"
        existing = db.query(SupportTicket).filter(SupportTicket.ticket_number == ticket_number).first()
        if not existing:
            break
    
    # Create ticket
    db_ticket = SupportTicket(
        ticket_number=ticket_number,
        user_id=current_user.id,  # Admin creating on behalf of user
        subject=ticket.subject,
        description=ticket.description,
        category=TicketCategory(ticket.category),
        priority=TicketPriority(ticket.priority),
        status=TicketStatus.OPEN
    )
    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    
    return SupportTicketResponse(
        id=db_ticket.id,
        ticket_number=db_ticket.ticket_number,
        user_id=db_ticket.user_id,
        user_name=current_user.name,
        user_email=current_user.email,
        subject=db_ticket.subject,
        description=db_ticket.description,
        category=db_ticket.category.value,
        priority=db_ticket.priority.value,
        status=db_ticket.status.value,
        assigned_to_id=None,
        assigned_to_name=None,
        resolved_at=None,
        closed_at=None,
        created_at=db_ticket.created_at,
        updated_at=db_ticket.updated_at,
        comments_count=0
    )


@router.put("/tickets/{ticket_id}", response_model=SupportTicketResponse)
def update_support_ticket(
    ticket_id: str,
    ticket_update: SupportTicketUpdate,
    db: Session = Depends(get_db)
):
    """Update support ticket details"""
    from models import SupportTicket, TicketCategory, TicketPriority, TicketStatus, TicketComment
    from schemas import SupportTicketUpdate, SupportTicketResponse
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Update only provided fields
    update_data = ticket_update.dict(exclude_unset=True)
    
    # Convert enum strings to enums
    if 'category' in update_data:
        update_data['category'] = TicketCategory(update_data['category'])
    if 'priority' in update_data:
        update_data['priority'] = TicketPriority(update_data['priority'])
    if 'status' in update_data:
        new_status = TicketStatus(update_data['status'])
        update_data['status'] = new_status
        
        # Set resolved_at when status changes to resolved
        if new_status == TicketStatus.RESOLVED and not ticket.resolved_at:
            update_data['resolved_at'] = datetime.now()
        
        # Set closed_at when status changes to closed
        if new_status == TicketStatus.CLOSED and not ticket.closed_at:
            update_data['closed_at'] = datetime.now()
    
    # Verify assignee exists if being updated
    if 'assigned_to_id' in update_data and update_data['assigned_to_id']:
        assignee = db.query(User).filter(User.id == update_data['assigned_to_id']).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee not found")
    
    for key, value in update_data.items():
        setattr(ticket, key, value)
    
    db.commit()
    db.refresh(ticket)
    
    user_name = ticket.user.name if ticket.user else "Unknown"
    user_email = ticket.user.email if ticket.user else None
    
    assigned_to_name = None
    if ticket.assigned_to_id:
        assignee = db.query(User).filter(User.id == ticket.assigned_to_id).first()
        if assignee:
            assigned_to_name = assignee.name
    
    comments_count = db.query(func.count(TicketComment.id)).filter(
        TicketComment.ticket_id == ticket.id
    ).scalar() or 0
    
    return SupportTicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        user_id=ticket.user_id,
        user_name=user_name,
        user_email=user_email,
        subject=ticket.subject,
        description=ticket.description,
        category=ticket.category.value,
        priority=ticket.priority.value,
        status=ticket.status.value,
        assigned_to_id=ticket.assigned_to_id,
        assigned_to_name=assigned_to_name,
        resolved_at=ticket.resolved_at,
        closed_at=ticket.closed_at,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        comments_count=comments_count
    )


@router.delete("/tickets/{ticket_id}")
def delete_support_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """Delete a support ticket"""
    from models import SupportTicket
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db.delete(ticket)
    db.commit()
    return {"message": "Ticket deleted successfully"}


@router.post("/tickets/{ticket_id}/comments", response_model=TicketCommentResponse)
def add_ticket_comment(
    ticket_id: str,
    comment: TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Add a comment to a support ticket"""
    from models import SupportTicket, TicketComment
    from schemas import TicketCommentCreate, TicketCommentResponse
    
    # Verify ticket exists
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Create comment
    db_comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        comment=comment.comment,
        is_internal=comment.is_internal
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    return TicketCommentResponse(
        id=db_comment.id,
        ticket_id=db_comment.ticket_id,
        user_id=db_comment.user_id,
        user_name=current_user.name,
        comment=db_comment.comment,
        is_internal=db_comment.is_internal,
        created_at=db_comment.created_at
    )


# ============ Audit Log Endpoints ============

@router.get("/audit-logs", response_model=AuditLogList)
def get_audit_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all audit logs with filters"""
    from models import AuditLog
    from schemas import AuditLogList, AuditLogResponse
    from datetime import datetime
    
    query = db.query(AuditLog)
    
    # Apply filters
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(AuditLog.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(AuditLog.created_at <= end_dt)
        except ValueError:
            pass
    
    # Order by most recent first
    query = query.order_by(AuditLog.created_at.desc())
    
    total = query.count()
    logs = query.offset(skip).limit(limit).all()
    
    return AuditLogList(logs=logs, total=total)


# Helper function to create audit log entries
def create_audit_log(
    db: Session,
    user_id: Optional[str],
    user_name: Optional[str],
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Create an audit log entry"""
    from models import AuditLog
    import uuid
    
    audit_log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        user_name=user_name,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(audit_log)
    db.commit()
    
    return audit_log


# ============ System Settings Endpoints ============

@router.get("/settings", response_model=SystemSettingsList)
def get_system_settings(
    category: Optional[str] = None,
    is_public: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List all system settings with filters"""
    from models import SystemSetting
    from schemas import SystemSettingsList, SystemSettingResponse
    
    query = db.query(SystemSetting)
    
    # Apply filters
    if category:
        query = query.filter(SystemSetting.category == category)
    
    if is_public is not None:
        query = query.filter(SystemSetting.is_public == is_public)
    
    # Order by category and key
    query = query.order_by(SystemSetting.category, SystemSetting.setting_key)
    
    settings = query.all()
    total = len(settings)
    
    return SystemSettingsList(settings=settings, total=total)


@router.get("/settings/{setting_key}", response_model=SystemSettingResponse)
def get_system_setting(setting_key: str, db: Session = Depends(get_db)):
    """Get a specific system setting"""
    from models import SystemSetting
    
    setting = db.query(SystemSetting).filter(
        SystemSetting.setting_key == setting_key
    ).first()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    return setting


@router.post("/settings", response_model=SystemSettingResponse)
def create_system_setting(
    setting_data: SystemSettingCreate,
    db: Session = Depends(get_db)
):
    """Create a new system setting"""
    from models import SystemSetting
    import uuid
    
    # Check if setting already exists
    existing = db.query(SystemSetting).filter(
        SystemSetting.setting_key == setting_data.setting_key
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Setting key already exists")
    
    setting = SystemSetting(
        id=str(uuid.uuid4()),
        **setting_data.dict()
    )
    
    db.add(setting)
    db.commit()
    db.refresh(setting)
    
    return setting


@router.put("/settings/{setting_key}", response_model=SystemSettingResponse)
def update_system_setting(
    setting_key: str,
    setting_data: SystemSettingUpdate,
    db: Session = Depends(get_db)
):
    """Update a system setting"""
    from models import SystemSetting
    
    setting = db.query(SystemSetting).filter(
        SystemSetting.setting_key == setting_key
    ).first()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    # Update fields
    update_data = setting_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(setting, field, value)
    
    db.commit()
    db.refresh(setting)
    
    return setting


@router.post("/settings/bulk-update")
def bulk_update_settings(
    bulk_data: SystemSettingsBulkUpdate,
    db: Session = Depends(get_db)
):
    """Bulk update multiple settings"""
    from models import SystemSetting
    
    updated_count = 0
    errors = []
    
    for setting_update in bulk_data.settings:
        try:
            setting_key = setting_update.get("setting_key")
            setting_value = setting_update.get("setting_value")
            
            if not setting_key:
                continue
            
            setting = db.query(SystemSetting).filter(
                SystemSetting.setting_key == setting_key
            ).first()
            
            if setting:
                setting.setting_value = setting_value
                updated_count += 1
            else:
                errors.append(f"Setting not found: {setting_key}")
        except Exception as e:
            errors.append(f"Error updating {setting_key}: {str(e)}")
    
    db.commit()
    
    return {
        "updated": updated_count,
        "errors": errors,
        "message": f"Updated {updated_count} settings"
    }


@router.delete("/settings/{setting_key}")
def delete_system_setting(setting_key: str, db: Session = Depends(get_db)):
    """Delete a system setting"""
    from models import SystemSetting
    
    setting = db.query(SystemSetting).filter(
        SystemSetting.setting_key == setting_key
    ).first()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    db.delete(setting)
    db.commit()
    
    return {"message": "Setting deleted successfully"}
