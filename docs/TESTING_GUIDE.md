# Testing Guide - Ready to Start

## Date: March 5, 2026

## 🎯 Quick Start

All fixes are complete and the application is ready for comprehensive testing. Use this guide to systematically test all features.

---

## 📋 Testing Credentials

### Admin Panel
- URL: `https://localhost:5173` (admin folder)
- Email: `admin@storemybottle.com`
- Password: `admin123`

### Bartender App
- URL: `https://localhost:5174` (frontend-bartender folder)
- Email: `anishghanwat2003@gmail.com`
- Password: `Anish@123`

### Customer App
- URL: `https://localhost:5175` (frontend folder)
- Create new test accounts during testing

### Backend
- URL: `https://localhost:8000`
- Must run with SSL: `python -m uvicorn main:app --reload --ssl-keyfile=key.pem --ssl-certfile=cert.pem --host 0.0.0.0`

---

## ✅ What's Been Fixed

### Admin Panel
1. ✅ Form validation on all CRUD operations
2. ✅ Delete confirmation dialogs working
3. ✅ Dropdown menus working
4. ✅ Field name mismatches fixed (volume_ml)
5. ✅ Type definitions updated
6. ✅ Import syntax errors fixed
7. ✅ Z-index issues resolved

### Customer Frontend
1. ✅ Login/Signup validation
2. ✅ Mobile-friendly toast notifications
3. ✅ Bottle volume display fixed
4. ✅ Payment flow with expiration
5. ✅ QR code generation and recovery
6. ✅ Pending payment recovery

### Bartender Frontend
1. ✅ Login validation
2. ✅ QR scanning
3. ✅ Redemption approval
4. ✅ Purchase request handling

---

## 🧪 Recommended Testing Order

### Phase 1: Admin Panel (30 minutes)
Start here to set up test data:

1. **Login** (2 min)
   - Test admin credentials
   - Verify session persistence

2. **Create Test Venue** (5 min)
   - Add a test venue with all fields
   - Test validation (empty fields, invalid email/phone)
   - Verify venue appears in list

3. **Create Test Bottles** (10 min)
   - Add 3-5 bottles for your test venue
   - Test validation (missing fields, negative prices)
   - Verify bottles appear in list
   - Test volume_ml field works correctly

4. **Create Test Bartender** (5 min)
   - Add bartender for your test venue
   - Test password strength validation
   - Test email/phone validation
   - Verify bartender can login

5. **Test Delete Operations** (5 min)
   - Try deleting a bottle → Confirm dialog appears
   - Cancel and verify bottle still exists
   - Delete and verify bottle is removed
   - Test delete for venues (should work same way)

6. **Test Edit Operations** (3 min)
   - Edit a bottle's price
   - Edit a venue's name
   - Verify changes save correctly

### Phase 2: Customer Flow (45 minutes)

1. **Signup** (5 min)
   - Create new customer account
   - Test validation (weak password, invalid email)
   - Verify success redirects to venue selection

2. **Browse Venues** (5 min)
   - Verify your test venue appears
   - Test search functionality
   - Click venue to see bottles

3. **Browse Bottles** (5 min)
   - Verify bottles show correct volume (750ml, etc.)
   - Verify prices display correctly
   - Click bottle to see details

4. **Purchase Flow** (15 min)
   - Click "Buy Now" on a bottle
   - Verify 15-minute timer starts
   - Verify payment page shows correct details
   - Test "Cancel Payment" button
   - Complete a purchase
   - Verify bottle appears in "My Bottles"

5. **Pending Payments** (10 min)
   - Start another purchase but don't complete
   - Navigate away from payment page
   - Go to "My Bottles"
   - Verify amber alert shows pending payment
   - Click "Resume →" and verify it goes back to payment
   - Let timer expire (or wait 15 min)
   - Verify expired payment disappears

6. **Redeem Peg** (5 min)
   - Go to "My Bottles"
   - Click "Redeem" on purchased bottle
   - Select peg size (30ml, 45ml, 60ml)
   - Verify QR code generates
   - Verify 15-minute timer starts

### Phase 3: Bartender Flow (30 minutes)

1. **Login** (2 min)
   - Login with test bartender credentials
   - Verify dashboard shows

2. **Scan QR Code** (10 min)
   - Click "Scan QR"
   - Allow camera permission
   - Scan customer's QR code (from Phase 2)
   - Verify redemption details show correctly
   - Click "Approve"
   - Verify success message
   - Verify volume deducted from customer's bottle

3. **Test Expired QR** (10 min)
   - Customer generates new QR code
   - Wait 15 minutes (or change system time)
   - Try to scan expired QR
   - Verify error message shows

4. **Pending Requests** (5 min)
   - Customer initiates new purchase
   - Bartender goes to "Pending Requests"
   - Verify request shows with timer
   - Click "Confirm"
   - Verify request disappears
   - Customer verifies purchase completed

5. **View Stats** (3 min)
   - Check redemption history
   - Verify stats are accurate
   - Check inventory view

### Phase 4: Mobile Testing (30 minutes)

Test on actual mobile device:

1. **Customer App on Mobile** (15 min)
   - Test all flows from Phase 2
   - Verify toast notifications appear correctly
   - Verify bottom navigation works
   - Verify QR code is large enough
   - Test form inputs (keyboard doesn't cover)

2. **Bartender App on Mobile** (15 min)
   - Test QR scanner with mobile camera
   - Verify touch interactions work
   - Test all buttons are large enough

### Phase 5: Edge Cases (30 minutes)

1. **Network Issues** (10 min)
   - Turn off WiFi during API call
   - Verify error message shows
   - Turn WiFi back on
   - Verify app recovers

2. **Concurrent Actions** (10 min)
   - Two customers try to redeem from same bottle
   - Verify both work correctly
   - Verify volume deducts properly

3. **Validation Edge Cases** (10 min)
   - Try creating bottle with 0 price
   - Try creating bottle with 999999999 price
   - Try creating venue with special characters
   - Try creating bartender with weak password

---

## 🐛 Bug Reporting Template

When you find a bug, document it like this:

```
### Bug #1: [Short Description]
- **Severity**: High/Medium/Low
- **Component**: Admin/Customer/Bartender
- **Steps to Reproduce**:
  1. Step 1
  2. Step 2
  3. Step 3
- **Expected**: What should happen
- **Actual**: What actually happens
- **Screenshot**: (if applicable)
```

---

## 📊 Testing Checklist Progress

Track your progress:

- [ ] Phase 1: Admin Panel (30 min)
- [ ] Phase 2: Customer Flow (45 min)
- [ ] Phase 3: Bartender Flow (30 min)
- [ ] Phase 4: Mobile Testing (30 min)
- [ ] Phase 5: Edge Cases (30 min)

**Total Estimated Time**: 2.5 hours

---

## 💡 Tips

1. **Test systematically** - Follow the phases in order
2. **Document everything** - Note any issues immediately
3. **Test on mobile** - Many users will use mobile devices
4. **Try to break it** - Test edge cases and unusual inputs
5. **Check the console** - Look for JavaScript errors
6. **Monitor network** - Check API response times

---

## 🚀 After Testing

Once testing is complete:

1. Report all bugs found
2. Prioritize bugs (High/Medium/Low)
3. Fix critical bugs first
4. Re-test fixed bugs
5. Deploy to staging
6. Final acceptance testing
7. Deploy to production

---

## 📝 Notes Section

Use this space to jot down observations:

```
[Your notes here]
```

---

## ✅ Ready to Start!

Everything is working and ready for testing. Start with Phase 1 (Admin Panel) to set up your test data, then proceed through the phases systematically.

Good luck with testing! 🎉
