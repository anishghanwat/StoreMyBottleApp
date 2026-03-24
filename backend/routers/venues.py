from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models import Venue, Bottle, Purchase, PaymentStatus, VenueRating
from auth import get_current_user
from schemas import (
    VenueResponse, VenueList, BottleResponse, BottleList, VenueStatsResponse,
    VenueRateRequest
)

router = APIRouter(prefix="/api/venues", tags=["venues"])


def _attach_ratings(venues: list, db: Session) -> list:
    """Attach avg rating and count to a list of Venue ORM objects, return as dicts."""
    if not venues:
        return []
    venue_ids = [v.id for v in venues]
    rows = db.query(
        VenueRating.venue_id,
        func.avg(VenueRating.rating).label("avg_rating"),
        func.count(VenueRating.id).label("cnt"),
    ).filter(VenueRating.venue_id.in_(venue_ids)).group_by(VenueRating.venue_id).all()
    rating_map = {r.venue_id: (round(float(r.avg_rating), 1), r.cnt) for r in rows}

    result = []
    for v in venues:
        avg, cnt = rating_map.get(v.id, (None, 0))
        d = {c.name: getattr(v, c.name) for c in v.__table__.columns}
        d["rating"] = avg
        d["rating_count"] = cnt
        result.append(d)
    return result


@router.get("", response_model=VenueList)
def get_venues(
    skip: int = 0, 
    limit: int = 20, 
    search: Optional[str] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of venues with optional city filtering"""
    query = db.query(Venue)
    
    if search:
        query = query.filter(Venue.name.ilike(f"%{search}%"))
    
    if city:
        query = query.filter(Venue.location.ilike(f"%{city}%"))
        
    total = query.count()
    venues = query.offset(skip).limit(limit).all()
    enriched = _attach_ratings(venues, db)
    
    return VenueList(venues=enriched, total=total)


@router.get("/{venue_id}", response_model=VenueResponse)
def get_venue(venue_id: str, db: Session = Depends(get_db)):
    """Get venue details"""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
    enriched = _attach_ratings([venue], db)
    return enriched[0]


@router.get("/{venue_id}/bottles", response_model=BottleList)
def get_venue_bottles(
    venue_id: str, 
    skip: int = 0, 
    limit: int = 50,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get bottles available at a venue"""
    # check venue exists
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
        
    query = db.query(Bottle).filter(
        Bottle.venue_id == venue_id,
        Bottle.is_available == True
    )
    
    if category:
        # If we had categories, filter here. For now, name search?
        pass
        
    total = query.count()
    bottles = query.offset(skip).limit(limit).all()
    
    return BottleList(bottles=bottles, total=total)


@router.post("/{venue_id}/rate", status_code=status.HTTP_200_OK)
def rate_venue_authenticated(
    venue_id: str,
    request_data: VenueRateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Submit or update a star rating (1–5) for a venue. Requires a confirmed purchase at the venue."""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found")

    # Verify user has a confirmed purchase at this venue
    has_purchase = db.query(Purchase).filter(
        Purchase.user_id == current_user.id,
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED,
    ).first()
    if not has_purchase:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must have a confirmed purchase at this venue to rate it",
        )

    # Upsert rating
    existing = db.query(VenueRating).filter(
        VenueRating.venue_id == venue_id,
        VenueRating.user_id == current_user.id,
    ).first()

    if existing:
        existing.rating = request_data.rating
    else:
        db.add(VenueRating(
            venue_id=venue_id,
            user_id=current_user.id,
            rating=request_data.rating,
        ))
    db.commit()

    # Return updated average
    row = db.query(
        func.avg(VenueRating.rating).label("avg"),
        func.count(VenueRating.id).label("cnt"),
    ).filter(VenueRating.venue_id == venue_id).first()

    return {
        "success": True,
        "your_rating": request_data.rating,
        "average_rating": round(float(row.avg), 1) if row.avg else request_data.rating,
        "rating_count": row.cnt,
    }


@router.get("/{venue_id}/stats", response_model=VenueStatsResponse)
def get_venue_stats(venue_id: str, db: Session = Depends(get_db)):
    """Get venue statistics (active bottles, served today)"""
    # Active bottles stored by users at this venue
    active_bottles = db.query(Purchase).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.remaining_ml > 0
    ).count()
    
    # Served today (redemptions) implementation requires Redemption model join?
    # Or just count purchases today?
    # Let's count "served" as redemptions today.
    # Note: Redemption model needs to be imported if we use it.
    from models import Redemption, RedemptionStatus
    from datetime import datetime, time, timezone

    today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)

    served_today = db.query(Redemption).filter(
        Redemption.venue_id == venue_id,
        Redemption.status == RedemptionStatus.REDEEMED,
        Redemption.redeemed_at >= today_start
    ).count()
    
    return VenueStatsResponse(
        served_today=served_today,
        active_bottles=active_bottles
    )


@router.get("/{venue_id}/promotions")
def get_venue_promotions(
    venue_id: str,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Get active promotions for a venue (public endpoint)"""
    from models import Promotion, PromotionStatus
    from datetime import datetime
    
    # Check venue exists
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
    
    # Get active promotions for this venue or global promotions
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    promotions = db.query(Promotion).filter(
        Promotion.status == PromotionStatus.ACTIVE,
        Promotion.valid_from <= now,
        Promotion.valid_until >= now,
        (Promotion.venue_id == venue_id) | (Promotion.venue_id == None)
    ).limit(limit).all()
    
    result = []
    for promo in promotions:
        result.append({
            "id": promo.id,
            "code": promo.code,
            "description": promo.description,
            "discount_type": promo.type.value,
            "discount_value": promo.value,
            "valid_from": promo.valid_from.isoformat(),
            "valid_until": promo.valid_until.isoformat(),
            "venue_id": promo.venue_id
        })
    
    return {
        "promotions": result,
        "total": len(result)
    }

