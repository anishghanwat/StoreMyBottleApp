# Frontend Authorization Testing Guide

## Date: March 5, 2026
## Phase 2 Task 2.4: Authorization Checks - Frontend Verification

---

## Prerequisites

### 1. Backend Running
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontends Running

**Admin Panel**:
```bash
cd admin
npm run dev
# Access: http://localhost:5175
```

**Bartender App**:
```bash
cd frontend-bartender
npm run dev
# Access: http://localhost:5174
```

**Customer App**:
```bash
cd frontend
npm run dev
# Access: http://localhost:5173
```

---

## Test Accounts

### Admin Account
- **Email**: `admin@storemybottle.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Access**: All endpoints, all venues, all data

### Bartender Account
- **Email**: `anishghanwat2003@gmail.com`
- **Password**: `Anish@123`
- **Role**: `bartender`
- **Venue**: Venue 4 (Electric Dreams)
- **Access**: Own venue only, cannot access admin endpoints

### Customer Account
- **Email**: Create a new customer account via signup
- **Password**: Your choice (must meet requirements)
- **Role**: `customer`
- **Access**: Own data only

---

## Test Scenarios

### Scenario 1: Admin Panel Access Control

#### Test 1.1: Admin Login ✅
1. Open admin panel: http://localhost:5175
2. Login with admin credentials
3. **Expected**: Successfully logged in, redirected to dashboard
4. **Verify**: Can see dashboard with stats

#### Test 1.2: Admin Can Access All Sections ✅
1. Navigate to each section:
   - Dashboard
   - Venues
   - Bottles
   - Purchases
   - Redemptions
   - Bartenders
   - Users
   - Promotions
   - Reports
   - Settings
2. **Expected**: All sections load without errors
3. **Verify**: Data displays correctly in each section

#### Test 1.3: Admin Can View All Venues ✅
1. Go to Venues section
2. **Expected**: See all 5 venues
3. **Verify**: Can click on each venue to see details

#### Test 1.4: Admin Can View All Purchases ✅
1. Go to Purchases section
2. **Expected**: See all purchases from all users
3. **Verify**: Can filter by status, venue, date

#### Test 1.5: Admin Can View All Redemptions ✅
1. Go to Redemptions section
2. **Expected**: See all redemptions from all venues
3. **Verify**: Can filter by status, venue, date

---

### Scenario 2: Bartender App Access Control

#### Test 2.1: Bartender Login ✅
1. Open bartender app: http://localhost:5174
2. Login with bartender credentials
3. **Expected**: Successfully logged in
4. **Verify**: See bartender home screen

#### Test 2.2: Bartender Cannot Access Admin Panel ❌
1. Try to open admin panel: http://localhost:5175
2. Login with bartender credentials
3. **Expected**: Either:
   - Blocked at login (403 error)
   - Redirected to unauthorized page
   - Limited access (no admin sections visible)
4. **Verify**: Cannot access admin-only features

#### Test 2.3: Bartender Can Access Own Venue Data ✅
1. In bartender app, go to home/dashboard
2. **Expected**: See data for Venue 4 (Electric Dreams) only
3. **Verify**: 
   - Pending purchases for venue 4
   - Recent redemptions for venue 4
   - Inventory for venue 4

#### Test 2.4: Bartender Can Scan QR Codes ✅
1. Go to "Scan QR" section
2. **Expected**: Camera access requested
3. **Verify**: Can scan QR codes

#### Test 2.5: Bartender Can Only Redeem at Own Venue ❌
1. Generate a QR code for Venue 4 (use customer app)
2. Scan with bartender app
3. **Expected**: QR code validates and redeems successfully
4. **Test Cross-Venue** (if possible):
   - Generate QR for different venue
   - Try to scan with bartender
   - **Expected**: Error message "Wrong venue"

---

### Scenario 3: Customer App Access Control

#### Test 3.1: Customer Signup ✅
1. Open customer app: http://localhost:5173
2. Click "Sign Up"
3. Create new account
4. **Expected**: Account created, logged in automatically
5. **Verify**: See customer home screen

#### Test 3.2: Customer Can View Own Purchases ✅
1. Go to "My Bottles" section
2. **Expected**: See only own purchased bottles
3. **Verify**: Cannot see other users' bottles

#### Test 3.3: Customer Can Generate QR Codes ✅
1. Select a bottle from "My Bottles"
2. Click "Redeem Peg"
3. Select peg size (30ml, 45ml, or 60ml)
4. **Expected**: QR code generated
5. **Verify**: 
   - QR code displays
   - Expiry time shown (15 minutes)
   - Venue name shown

#### Test 3.4: Customer Can View Own Redemption History ✅
1. Go to "History" or "Profile" section
2. **Expected**: See only own redemptions
3. **Verify**: Cannot see other users' redemptions

#### Test 3.5: Customer Cannot Access Admin Features ❌
1. Try to access admin endpoints directly:
   - http://localhost:8000/api/admin/stats
   - http://localhost:8000/api/admin/venues
2. **Expected**: 403 Forbidden error
3. **Verify**: No admin data accessible

---

### Scenario 4: Cross-User Data Access (Security Test)

#### Test 4.1: User Cannot Access Other User's Purchases ❌
1. Login as Customer A
2. Note a purchase ID from Customer A
3. Logout and login as Customer B
4. Try to access Customer A's purchase:
   - Direct API call: `GET /api/purchases/{customer_a_purchase_id}`
   - Or try to manipulate URL in browser
5. **Expected**: 403 Forbidden or 404 Not Found
6. **Verify**: Cannot see other user's data

#### Test 4.2: User Cannot Access Other User's Redemptions ❌
1. Login as Customer A
2. Note a redemption ID from Customer A
3. Logout and login as Customer B
4. Try to access Customer A's redemption:
   - Direct API call: `GET /api/redemptions/{customer_a_redemption_id}`
5. **Expected**: 403 Forbidden or 404 Not Found
6. **Verify**: Cannot see other user's redemptions

---

### Scenario 5: Cross-Venue Access (Security Test)

#### Test 5.1: Bartender Cannot Access Other Venue's Data ❌
1. Login as Bartender at Venue 4
2. Try to access Venue 1's pending purchases:
   - Direct API call: `GET /api/purchases/venue/1/pending`
3. **Expected**: 403 Forbidden
4. **Verify**: Error message about wrong venue

#### Test 5.2: Bartender Cannot Redeem QR from Other Venue ❌
1. Generate QR code for Venue 1 (use customer app)
2. Login as Bartender at Venue 4
3. Try to scan/validate the QR code
4. **Expected**: Error message "Wrong venue"
5. **Verify**: Redemption blocked

---

## Testing Checklist

### Admin Panel Tests
- [ ] Admin can login
- [ ] Admin can access dashboard
- [ ] Admin can view all venues
- [ ] Admin can view all purchases
- [ ] Admin can view all redemptions
- [ ] Admin can view all users
- [ ] Admin can create/edit venues
- [ ] Admin can create/edit bottles
- [ ] Admin can manage bartenders
- [ ] Admin can view analytics

### Bartender App Tests
- [ ] Bartender can login
- [ ] Bartender sees own venue data only
- [ ] Bartender can scan QR codes
- [ ] Bartender can redeem QR at own venue
- [ ] Bartender blocked from other venues
- [ ] Bartender cannot access admin panel
- [ ] Bartender can view recent redemptions
- [ ] Bartender can view inventory

### Customer App Tests
- [ ] Customer can signup
- [ ] Customer can login
- [ ] Customer can view venues
- [ ] Customer can purchase bottles
- [ ] Customer can view own bottles
- [ ] Customer can generate QR codes
- [ ] Customer can view redemption history
- [ ] Customer blocked from other users' data
- [ ] Customer blocked from admin features

### Security Tests
- [ ] Cross-user purchase access blocked
- [ ] Cross-user redemption access blocked
- [ ] Cross-venue bartender access blocked
- [ ] Cross-venue QR redemption blocked
- [ ] Admin endpoints require admin role
- [ ] Bartender endpoints require bartender role
- [ ] Proper 403 errors for unauthorized access

---

## Expected Behaviors

### Successful Authorization ✅
- User sees only their own data
- Bartender sees only their venue's data
- Admin sees all data
- Proper role-based menu/navigation
- No errors in console

### Failed Authorization ❌
- 403 Forbidden HTTP status
- Error message displayed to user
- User redirected to appropriate page
- No sensitive data leaked in error
- Console shows authorization error

---

## Browser Console Checks

### What to Look For

**Good Signs** ✅:
- No 403 errors for authorized requests
- Successful API calls (200 status)
- Proper authentication headers sent
- Cookies set correctly (HttpOnly)

**Bad Signs** ❌:
- 403 errors for legitimate requests
- Missing authentication headers
- Cookies not being sent
- CORS errors
- Authorization errors in console

### How to Check

1. Open Browser DevTools (F12)
2. Go to Network tab
3. Perform actions in the app
4. Check each API request:
   - Status code (should be 200 for authorized)
   - Request headers (should include cookies)
   - Response (should contain expected data)

---

## Common Issues and Solutions

### Issue 1: 403 on All Requests
**Cause**: Not logged in or session expired  
**Solution**: Login again

### Issue 2: CORS Errors
**Cause**: Frontend origin not in CORS whitelist  
**Solution**: Check backend CORS configuration

### Issue 3: Cookies Not Sent
**Cause**: Different domains or HTTPS/HTTP mismatch  
**Solution**: Ensure both frontend and backend use same protocol

### Issue 4: Admin Can't Access Admin Panel
**Cause**: Role not set correctly in database  
**Solution**: Check user role in database

### Issue 5: Bartender Sees Wrong Venue
**Cause**: venue_id not set correctly  
**Solution**: Check bartender's venue_id in database

---

## Manual Testing Script

### Quick Test (5 minutes)

```bash
# 1. Start backend
cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 2. Start admin panel
cd admin && npm run dev

# 3. Test admin login
# - Open http://localhost:5175
# - Login as admin@storemybottle.com / admin123
# - Verify dashboard loads
# - Check venues, purchases, redemptions

# 4. Start bartender app
cd frontend-bartender && npm run dev

# 5. Test bartender login
# - Open http://localhost:5174
# - Login as anishghanwat2003@gmail.com / Anish@123
# - Verify home screen loads
# - Check venue data displays

# 6. Test bartender restrictions
# - Try to open http://localhost:5175 with bartender credentials
# - Verify access denied or limited features
```

### Comprehensive Test (30 minutes)

Follow all test scenarios above, checking each checkbox.

---

## Reporting Issues

If you find authorization issues, report with:

1. **User Role**: Admin / Bartender / Customer
2. **Action Attempted**: What you tried to do
3. **Expected Result**: What should happen
4. **Actual Result**: What actually happened
5. **Error Message**: Any error shown
6. **Console Errors**: Browser console output
7. **Network Tab**: Failed request details

---

## Success Criteria

Authorization is working correctly if:

✅ Admins can access all features  
✅ Bartenders can only access their venue  
✅ Customers can only access their own data  
✅ Cross-user access is blocked (403)  
✅ Cross-venue access is blocked (403)  
✅ Proper error messages displayed  
✅ No sensitive data leaked  
✅ All role-based features work  

---

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Document any issues found
3. ✅ Fix any authorization bugs
4. ⏳ Move to Phase 2 Task 2.5: OTP Security
5. ⏳ Move to Phase 2 Task 2.6: Payment Gateway

---

## Related Documentation

- [Authorization Implementation](./PHASE2_TASK4_AUTHORIZATION_COMPLETE.md)
- [Authorization Test Results](./AUTHORIZATION_TEST_RESULTS.md)
- [Phase 2 Plan](./PHASE_2_PLAN.md)
- [Security Remediation Plan](./SECURITY_REMEDIATION_PLAN.md)
