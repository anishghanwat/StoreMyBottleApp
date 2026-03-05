# Authorization Visual Guide

## What Each Role Should See

---

## 🔴 Admin (Full Access)

### Admin Panel (http://localhost:5175)

**Login**: admin@storemybottle.com / admin123

```
┌─────────────────────────────────────────┐
│  StoreMyBottle - Admin Panel            │
├─────────────────────────────────────────┤
│  ☰ Menu                                 │
│    📊 Dashboard          ✅ VISIBLE     │
│    🏢 Venues             ✅ VISIBLE     │
│    🍾 Bottles            ✅ VISIBLE     │
│    💰 Purchases          ✅ VISIBLE     │
│    🎫 Redemptions        ✅ VISIBLE     │
│    👔 Bartenders         ✅ VISIBLE     │
│    👥 Users              ✅ VISIBLE     │
│    🎁 Promotions         ✅ VISIBLE     │
│    📈 Reports            ✅ VISIBLE     │
│    ⚙️  Settings          ✅ VISIBLE     │
└─────────────────────────────────────────┘
```

**Can Access**:
- ✅ All venues (Venue 1, 2, 3, 4, 5)
- ✅ All purchases (from all users)
- ✅ All redemptions (from all venues)
- ✅ All user data
- ✅ All analytics and reports
- ✅ Create/Edit/Delete operations

**Cannot Access**:
- ❌ Nothing - admin has full access

---

## 🟡 Bartender (Venue-Limited Access)

### Bartender App (http://localhost:5174)

**Login**: anishghanwat2003@gmail.com / Anish@123  
**Assigned Venue**: Venue 4 (Electric Dreams)

```
┌─────────────────────────────────────────┐
│  StoreMyBottle - Bartender              │
├─────────────────────────────────────────┤
│  ☰ Menu                                 │
│    🏠 Home               ✅ VISIBLE     │
│    📷 Scan QR            ✅ VISIBLE     │
│    📋 History            ✅ VISIBLE     │
│    📊 Stats              ✅ VISIBLE     │
│    📦 Inventory          ✅ VISIBLE     │
│    👤 Profile            ✅ VISIBLE     │
│                                         │
│  Current Venue: Venue 4 (Electric Dreams)│
│                                         │
│  Pending Purchases:                     │
│    - Only from Venue 4  ✅ VISIBLE     │
│                                         │
│  Recent Redemptions:                    │
│    - Only from Venue 4  ✅ VISIBLE     │
└─────────────────────────────────────────┘
```

**Can Access**:
- ✅ Own venue data (Venue 4 only)
- ✅ Pending purchases at Venue 4
- ✅ Redemptions at Venue 4
- ✅ QR code scanner
- ✅ Redeem QR codes for Venue 4
- ✅ View inventory for Venue 4
- ✅ Own profile

**Cannot Access**:
- ❌ Admin panel
- ❌ Other venues' data (Venue 1, 2, 3, 5)
- ❌ Other venues' purchases
- ❌ Other venues' redemptions
- ❌ Cannot redeem QR codes from other venues
- ❌ User management
- ❌ Venue management
- ❌ Global analytics

**What Happens If Bartender Tries**:
```
❌ Access Admin Panel
   → 403 Forbidden or Login redirects to bartender app

❌ Access Venue 1 Data
   → 403 Forbidden: "Not authorized for this venue"

❌ Redeem QR from Venue 1
   → Error: "This QR code is for a different venue"
```

---

## 🟢 Customer (Own Data Only)

### Customer App (http://localhost:5173)

**Login**: [Your customer account]

```
┌─────────────────────────────────────────┐
│  StoreMyBottle - Customer               │
├─────────────────────────────────────────┤
│  ☰ Menu                                 │
│    🏠 Home               ✅ VISIBLE     │
│    🏢 Venues             ✅ VISIBLE     │
│    🍾 My Bottles         ✅ VISIBLE     │
│    🎫 Redeem             ✅ VISIBLE     │
│    📜 History            ✅ VISIBLE     │
│    👤 Profile            ✅ VISIBLE     │
│                                         │
│  My Bottles:                            │
│    - Only own bottles   ✅ VISIBLE     │
│    - Can generate QR    ✅ VISIBLE     │
│                                         │
│  Redemption History:                    │
│    - Only own redemptions ✅ VISIBLE   │
└─────────────────────────────────────────┘
```

**Can Access**:
- ✅ View all venues (read-only)
- ✅ Purchase bottles
- ✅ View own bottles
- ✅ Generate QR codes for own bottles
- ✅ View own redemption history
- ✅ Own profile
- ✅ Update own profile

**Cannot Access**:
- ❌ Admin panel
- ❌ Bartender features
- ❌ Other users' bottles
- ❌ Other users' purchases
- ❌ Other users' redemptions
- ❌ Venue management
- ❌ User management
- ❌ Analytics/Reports

**What Happens If Customer Tries**:
```
❌ Access Admin Panel
   → 403 Forbidden or Login fails

❌ Access Other User's Purchase
   → 403 Forbidden: "Not authorized to access this purchase"

❌ Access Admin Endpoints
   → 403 Forbidden: "Requires admin role"
```

---

## API Endpoint Access Matrix

| Endpoint | Admin | Bartender | Customer |
|----------|-------|-----------|----------|
| `GET /api/admin/stats` | ✅ 200 | ❌ 403 | ❌ 403 |
| `GET /api/admin/venues` | ✅ 200 | ❌ 403 | ❌ 403 |
| `GET /api/admin/purchases` | ✅ 200 | ❌ 403 | ❌ 403 |
| `GET /api/venues` | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /api/venues/{id}/bottles` | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /api/purchases/my-bottles` | ✅ 200 | ✅ 200 | ✅ 200 |
| `GET /api/purchases/{id}` | ✅ All | ❌ 403 | ✅ Own only |
| `GET /api/purchases/venue/{id}/pending` | ✅ All | ✅ Own venue | ❌ 403 |
| `POST /api/redemptions/validate` | ✅ All | ✅ Own venue | ❌ 403 |
| `GET /api/redemptions/venue/{id}/recent` | ✅ All | ✅ Own venue | ❌ 403 |
| `GET /api/redemptions/history` | ✅ All | ✅ Own | ✅ Own |

---

## Visual Flow: QR Code Redemption

### ✅ Correct Flow (Same Venue)

```
Customer (Venue 4)          Bartender (Venue 4)
     │                            │
     │ 1. Generate QR             │
     │    for Venue 4             │
     │─────────────────────────>  │
     │                            │
     │                            │ 2. Scan QR
     │                            │    at Venue 4
     │                            │
     │                            │ 3. Validate
     │                            │    ✅ Same venue
     │                            │    ✅ Valid QR
     │                            │    ✅ Not expired
     │                            │
     │ <─────────────────────────│ 4. Redeem Success
     │    Peg dispensed           │    ✅ 200 OK
```

### ❌ Blocked Flow (Different Venue)

```
Customer (Venue 1)          Bartender (Venue 4)
     │                            │
     │ 1. Generate QR             │
     │    for Venue 1             │
     │─────────────────────────>  │
     │                            │
     │                            │ 2. Scan QR
     │                            │    at Venue 4
     │                            │
     │                            │ 3. Validate
     │                            │    ❌ Wrong venue!
     │                            │    (QR for Venue 1,
     │                            │     Bartender at Venue 4)
     │                            │
     │ <─────────────────────────│ 4. Error
     │    ❌ 403 Forbidden        │    "Wrong venue"
```

---

## Error Messages by Role

### Admin
- ✅ Rarely sees errors (has full access)
- ❌ Only sees errors for invalid data or system issues

### Bartender
- ❌ "Not authorized for this venue" - Trying to access other venue
- ❌ "Requires admin role" - Trying to access admin endpoints
- ❌ "This QR code is for a different venue" - Wrong venue QR

### Customer
- ❌ "Not authorized to access this purchase" - Other user's purchase
- ❌ "Not authorized to access this redemption" - Other user's redemption
- ❌ "Requires admin role" - Admin endpoints
- ❌ "Requires bartender role" - Bartender endpoints

---

## Testing Tips

### 1. Use Browser DevTools
- Open Network tab (F12)
- Watch for 403 errors
- Check request headers (cookies should be sent)
- Verify response data

### 2. Test in Incognito Mode
- Prevents cookie conflicts
- Clean slate for each test
- Better for testing different roles

### 3. Use Multiple Browsers
- Chrome for Admin
- Firefox for Bartender
- Edge for Customer
- Easier to switch between roles

### 4. Check Console
- Look for authorization errors
- Check for CORS issues
- Verify API calls succeed

---

## Success Indicators

### ✅ Authorization Working
- Users see only appropriate data
- 403 errors for unauthorized access
- Proper error messages displayed
- No sensitive data in errors
- Cookies sent with requests
- No CORS errors

### ❌ Authorization Broken
- Users see other users' data
- No 403 errors when they should appear
- Generic error messages
- Sensitive data in error responses
- Cookies not being sent
- CORS errors blocking requests

---

## Quick Reference

**Admin**: Everything  
**Bartender**: Own venue only  
**Customer**: Own data only  

**403 = Good** (when unauthorized)  
**200 = Good** (when authorized)  

**Test**: Try to access what you shouldn't  
**Expect**: 403 Forbidden  
**Result**: If you get 200, authorization is broken!

---

## Related Documents

- [Frontend Testing Guide](./FRONTEND_AUTHORIZATION_TESTING.md)
- [Quick Checklist](./AUTHORIZATION_QUICK_CHECKLIST.md)
- [Test Results](./AUTHORIZATION_TEST_RESULTS.md)
- [Implementation Details](./PHASE2_TASK4_AUTHORIZATION_COMPLETE.md)
