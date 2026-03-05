# Authorization Testing - Quick Checklist ✅

## Setup
- [ ] Backend running on port 8000
- [ ] Admin panel running on port 5175
- [ ] Bartender app running on port 5174
- [ ] Customer app running on port 5173

---

## Admin Tests (http://localhost:5175)

**Login**: admin@storemybottle.com / admin123

- [ ] Can login successfully
- [ ] Dashboard loads with stats
- [ ] Can view all venues (5 venues)
- [ ] Can view all purchases
- [ ] Can view all redemptions
- [ ] Can view all users
- [ ] Can create/edit venues
- [ ] Can manage bartenders
- [ ] No 403 errors in console

---

## Bartender Tests (http://localhost:5174)

**Login**: anishghanwat2003@gmail.com / Anish@123

- [ ] Can login successfully
- [ ] Home screen shows Venue 4 data
- [ ] Can see pending purchases for Venue 4
- [ ] Can see recent redemptions for Venue 4
- [ ] Can access QR scanner
- [ ] Can scan and redeem QR codes
- [ ] Cannot access admin panel (try http://localhost:5175)
- [ ] No unauthorized data visible

---

## Customer Tests (http://localhost:5173)

**Create new account or use existing**

- [ ] Can signup/login successfully
- [ ] Can view venues list
- [ ] Can purchase bottles
- [ ] Can view "My Bottles"
- [ ] Can generate QR codes
- [ ] QR code shows venue name
- [ ] QR code shows expiry time
- [ ] Can view redemption history
- [ ] Only sees own data

---

## Security Tests

### Cross-User Access (Should FAIL with 403)
- [ ] User A cannot access User B's purchases
- [ ] User A cannot access User B's redemptions

### Cross-Venue Access (Should FAIL with 403)
- [ ] Bartender at Venue 4 cannot access Venue 1 data
- [ ] Bartender cannot redeem QR from different venue

### Role Restrictions (Should FAIL with 403)
- [ ] Customer cannot access admin endpoints
- [ ] Bartender cannot access admin endpoints
- [ ] Customer cannot access bartender endpoints

---

## Browser Console Check

Open DevTools (F12) → Network tab

**Look for**:
- ✅ 200 OK for authorized requests
- ✅ Cookies being sent with requests
- ✅ No CORS errors
- ❌ 403 Forbidden for unauthorized attempts
- ❌ No sensitive data in errors

---

## Quick Test Commands

```bash
# Test admin access
curl http://localhost:8000/api/admin/stats \
  -H "Authorization: Bearer {admin_token}"
# Expected: 200 OK

# Test bartender blocked from admin
curl http://localhost:8000/api/admin/stats \
  -H "Authorization: Bearer {bartender_token}"
# Expected: 403 Forbidden

# Test bartender can access own venue
curl http://localhost:8000/api/purchases/venue/4/pending \
  -H "Authorization: Bearer {bartender_token}"
# Expected: 200 OK

# Test bartender blocked from other venue
curl http://localhost:8000/api/purchases/venue/1/pending \
  -H "Authorization: Bearer {bartender_token}"
# Expected: 403 Forbidden
```

---

## Pass Criteria

✅ All admin tests pass  
✅ All bartender tests pass  
✅ All customer tests pass  
✅ All security tests fail correctly (403)  
✅ No console errors for authorized actions  
✅ Proper error messages for unauthorized actions  

---

## If Tests Fail

1. Check backend is running
2. Check user roles in database
3. Check venue_id for bartenders
4. Check browser console for errors
5. Check Network tab for failed requests
6. Verify cookies are being sent
7. Check CORS configuration

---

## Report Format

**Issue**: [Brief description]  
**User**: [Admin/Bartender/Customer]  
**Action**: [What was attempted]  
**Expected**: [What should happen]  
**Actual**: [What happened]  
**Error**: [Error message if any]  
**Status Code**: [HTTP status]  

---

## Next Steps

After all tests pass:
- [ ] Document results
- [ ] Fix any issues found
- [ ] Move to Phase 2 Task 2.5: OTP Security

---

**Testing Date**: _____________  
**Tester**: _____________  
**Results**: ☐ Pass ☐ Fail ☐ Partial  
**Notes**: _____________________________________________
