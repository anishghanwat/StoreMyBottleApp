# Phase 2: Analytics & Reporting - Implementation Plan

**Start Date:** February 21, 2026  
**Estimated Time:** 8-10 hours  
**Priority:** High

---

## Overview

Transform the admin dashboard from basic stats to a comprehensive analytics platform with charts, reports, and insights.

---

## Phase 2.1: Enhanced Dashboard Analytics

### Features to Implement:
1. **Revenue Analytics**
   - Total revenue (all time, this month, this week)
   - Revenue by venue
   - Revenue trends over time (line chart)
   - Average order value

2. **Sales Analytics**
   - Bottles sold (daily, weekly, monthly)
   - Sales trends (line chart)
   - Top selling bottles
   - Sales by venue (bar chart)

3. **Redemption Analytics**
   - Total redemptions
   - Redemption rate (redeemed vs pending)
   - Redemptions by venue
   - Peak redemption times

4. **User Analytics**
   - Total users
   - New users (this week/month)
   - Active users
   - User growth chart

### Backend Work:
- Create `/api/admin/analytics/revenue` endpoint
- Create `/api/admin/analytics/sales` endpoint
- Create `/api/admin/analytics/redemptions` endpoint
- Create `/api/admin/analytics/users` endpoint
- Add date range filtering
- Aggregate data efficiently

### Frontend Work:
- Update Dashboard.tsx with real charts
- Add date range picker
- Create reusable chart components
- Add loading states
- Add export functionality

**Estimated Time:** 3-4 hours

---

## Phase 2.2: Reports Page

### Features to Implement:
1. **Revenue Report**
   - Detailed revenue breakdown
   - By venue, by bottle, by time period
   - Export to CSV

2. **Sales Report**
   - Detailed sales data
   - Top performers
   - Slow movers
   - Export to CSV

3. **Inventory Report**
   - Current stock levels
   - Bottles by venue
   - Availability status
   - Export to CSV

4. **User Activity Report**
   - User purchases
   - User redemptions
   - User engagement metrics
   - Export to CSV

### Backend Work:
- Create `/api/admin/reports/revenue` endpoint
- Create `/api/admin/reports/sales` endpoint
- Create `/api/admin/reports/inventory` endpoint
- Create `/api/admin/reports/users` endpoint
- Add CSV export functionality
- Add date range and filters

### Frontend Work:
- Create Reports.tsx component
- Add report type selector
- Add filters (date, venue, etc.)
- Add export buttons
- Create data tables
- Add print functionality

**Estimated Time:** 3-4 hours

---

## Phase 2.3: Venue Performance Analytics

### Features to Implement:
1. **Venue Comparison**
   - Side-by-side venue metrics
   - Revenue comparison
   - Sales comparison
   - Redemption comparison

2. **Venue Details**
   - Individual venue analytics
   - Top bottles per venue
   - Peak hours
   - Customer retention

### Backend Work:
- Create `/api/admin/analytics/venues` endpoint
- Create `/api/admin/analytics/venues/{id}` endpoint
- Add comparison logic

### Frontend Work:
- Update Venues.tsx with analytics
- Add venue comparison view
- Add charts per venue
- Add drill-down capability

**Estimated Time:** 2-3 hours

---

## Technical Implementation

### Backend Schemas (schemas.py)

```python
class RevenueAnalytics(BaseModel):
    total_revenue: Decimal
    revenue_this_month: Decimal
    revenue_this_week: Decimal
    revenue_by_venue: List[VenueRevenue]
    revenue_trend: List[RevenueTrend]

class SalesAnalytics(BaseModel):
    total_bottles_sold: int
    bottles_sold_this_month: int
    bottles_sold_this_week: int
    top_bottles: List[TopBottle]
    sales_trend: List[SalesTrend]

class RedemptionAnalytics(BaseModel):
    total_redemptions: int
    redemption_rate: float
    redemptions_by_venue: List[VenueRedemptions]
    redemptions_by_hour: List[HourlyRedemptions]

class UserAnalytics(BaseModel):
    total_users: int
    new_users_this_month: int
    active_users: int
    user_growth: List[UserGrowth]
```

### Backend Endpoints (routers/admin.py)

```python
@router.get("/analytics/revenue")
def get_revenue_analytics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    venue_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Aggregate revenue data
    pass

@router.get("/analytics/sales")
def get_sales_analytics(...):
    # Aggregate sales data
    pass

@router.get("/analytics/redemptions")
def get_redemption_analytics(...):
    # Aggregate redemption data
    pass

@router.get("/analytics/users")
def get_user_analytics(...):
    # Aggregate user data
    pass
```

### Frontend Components

```typescript
// admin/src/components/Dashboard.tsx
- Enhanced with real analytics
- Multiple chart types (line, bar, pie)
- Date range selector
- Venue filter

// admin/src/components/Reports.tsx (NEW)
- Report type selector
- Filters panel
- Data tables
- Export buttons

// admin/src/components/analytics/ (NEW FOLDER)
- RevenueChart.tsx
- SalesChart.tsx
- RedemptionChart.tsx
- UserGrowthChart.tsx
```

---

## Success Criteria

### Phase 2.1: Dashboard
- [ ] Revenue charts display correctly
- [ ] Sales trends show accurate data
- [ ] Redemption analytics working
- [ ] User growth chart functional
- [ ] Date range filtering works
- [ ] All data loads from API

### Phase 2.2: Reports
- [ ] Revenue report generates correctly
- [ ] Sales report shows detailed data
- [ ] Inventory report accurate
- [ ] User activity report functional
- [ ] CSV export works
- [ ] Filters apply correctly

### Phase 2.3: Venue Analytics
- [ ] Venue comparison works
- [ ] Individual venue analytics display
- [ ] Charts render correctly
- [ ] Drill-down functionality works

---

## Dependencies

### NPM Packages (Already Installed)
- recharts (for charts)
- date-fns (for date handling)
- react-day-picker (for date picker)

### Backend Packages (Already Installed)
- sqlalchemy (for queries)
- pandas (optional, for data processing)

---

## Implementation Order

1. **Start with Backend Analytics Endpoints** (Phase 2.1)
   - Revenue analytics
   - Sales analytics
   - Redemption analytics
   - User analytics

2. **Update Dashboard with Real Data** (Phase 2.1)
   - Replace mock data with API calls
   - Add real charts
   - Add date range picker

3. **Create Reports Page** (Phase 2.2)
   - Build reports component
   - Add export functionality
   - Add filters

4. **Add Venue Analytics** (Phase 2.3)
   - Venue comparison
   - Individual venue details

---

## Notes

- Use existing chart components from Dashboard
- Leverage existing API patterns from Phase 1
- Keep queries optimized for performance
- Add caching for frequently accessed analytics
- Consider adding real-time updates for live metrics

---

**Ready to start with Phase 2.1: Enhanced Dashboard Analytics!** 🚀
