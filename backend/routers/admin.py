from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import User, Venue, Bottle, Purchase, PaymentStatus
from auth import get_current_active_admin
from schemas import (
    UserResponse, UserRoleUpdate, VenueCreate, VenueResponse, 
    BottleCreate, BottleResponse, VenueList
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
