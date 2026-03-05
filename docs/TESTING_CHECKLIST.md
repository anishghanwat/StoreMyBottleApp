# Complete Testing Checklist

## Date: March 5, 2026

---

## 🎯 Testing Strategy

### Test Environments:
- ✅ Desktop Browser (Chrome/Firefox/Safari)
- ✅ Mobile Browser (iOS Safari/Android Chrome)
- ✅ Different Screen Sizes (320px, 768px, 1024px, 1920px)

### Test Data:
- Admin: `admin@storemybottle.com` / `admin123`
- Bartender: `anishghanwat2003@gmail.com` / `Anish@123`
- Customer: Create new test accounts

---

## 📱 CUSTOMER FRONTEND TESTING

### 1. Authentication Flow
- [ ] **Signup**
  - [ ] Valid email and password (8+ chars, uppercase, lowercase, number)
  - [ ] Invalid email format → Shows error
  - [ ] Weak password → Shows error
  - [ ] Duplicate email → Shows error
  - [ ] Empty fields → Shows validation errors
  - [ ] Success → Redirects to venue selection

- [ ] **Login**
  - [ ] Valid credentials → Success
  - [ ] Invalid credentials → Shows error
  - [ ] Empty fields → Shows validation errors
  - [ ] Remember session → Stays logged in on refresh

- [ ] **Forgot Password**
  - [ ] Valid email → Shows success message
  - [ ] Invalid email → Shows error
  - [ ] Reset link works (check email)

- [ ] **Logout**
  - [ ] Logout button works
  - [ ] Redirects to login
  - [ ] Session cleared

### 2. Venue Selection
- [ ] **Venue List**
  - [ ] Shows all venues
  - [ ] Location-based greeting works
  - [ ] Venue cards display correctly
  - [ ] Images load properly
  - [ ] Click venue → Goes to bottle menu

- [ ] **Search/Filter**
  - [ ] Search by venue name works
  - [ ] Filter by city works (if implemented)
  - [ ] No results message shows

### 3. Bottle Menu
- [ ] **Bottle List**
  - [ ] Shows all bottles for selected venue
  - [ ] Images load properly
  - [ ] Price displays correctly
  - [ ] Volume displays correctly (750ml, etc.)
  - [ ] Category filter works
  - [ ] Search works

- [ ] **Bottle Details**
  - [ ] Click bottle → Shows details
  - [ ] All information displays correctly
  - [ ] "Buy Now" button works

### 4. Purchase Flow
- [ ] **Initiate Purchase**
  - [ ] Click "Buy Now" → Goes to payment page
  - [ ] Bottle details show correctly
  - [ ] Price shows correctly
  - [ ] 15-minute timer starts

- [ ] **Payment Page**
  - [ ] Timer counts down correctly
  - [ ] Timer turns red at <5 minutes
  - [ ] Timer shows "Expired" at 0:00
  - [ ] Payment methods display
  - [ ] "Cancel Payment" button works
  - [ ] Cancel shows confirmation
  - [ ] Cancelled payment removed from pending

- [ ] **Payment Confirmation**
  - [ ] Select payment method
  - [ ] Confirm payment → Success
  - [ ] Redirects to My Bottles
  - [ ] Bottle appears in My Bottles

### 5. My Bottles
- [ ] **Bottle List**
  - [ ] Shows all purchased bottles
  - [ ] Remaining volume displays correctly
  - [ ] Progress bar shows correctly
  - [ ] Empty state shows when no bottles

- [ ] **Pending Payments**
  - [ ] Shows pending payments in amber alert
  - [ ] Timer counts down
  - [ ] "Resume →" button works
  - [ ] Expired payments disappear
  - [ ] Auto-refresh when all expire

- [ ] **Active QR Codes**
  - [ ] Shows active QR in violet alert
  - [ ] "View QR →" button works
  - [ ] Navigates back to QR screen

- [ ] **Redeem Peg**
  - [ ] Click "Redeem" → Shows peg size selection
  - [ ] 30ml, 45ml, 60ml options work
  - [ ] Can't redeem more than remaining
  - [ ] Generates QR code

### 6. QR Code Screen
- [ ] **QR Display**
  - [ ] QR code displays correctly
  - [ ] Bottle details show
  - [ ] Peg size shows
  - [ ] 15-minute timer starts
  - [ ] Timer counts down correctly
  - [ ] Timer turns red at <5 minutes

- [ ] **QR Expiration**
  - [ ] QR expires after 15 minutes
  - [ ] Shows "Expired" message
  - [ ] "Generate New QR" button works

- [ ] **QR Recovery**
  - [ ] Go back and return → QR still shows
  - [ ] Refresh page → QR recovers from localStorage
  - [ ] Expired QR doesn't recover

### 7. Profile
- [ ] **Profile Display**
  - [ ] Name displays correctly
  - [ ] Email displays correctly
  - [ ] Total bottles count correct
  - [ ] Total spent correct

- [ ] **Edit Profile**
  - [ ] Can update name
  - [ ] Can update email
  - [ ] Validation works
  - [ ] Save button works

### 8. Mobile Experience (Customer)
- [ ] **Navigation**
  - [ ] Bottom nav works on mobile
  - [ ] All tabs accessible
  - [ ] Active tab highlighted

- [ ] **Toast Notifications**
  - [ ] Appear at top-center
  - [ ] Don't overlap with notch
  - [ ] Don't overlap with bottom nav
  - [ ] Swipe to dismiss works
  - [ ] Auto-dismiss after timeout

- [ ] **Forms**
  - [ ] Inputs are large enough to tap
  - [ ] Keyboard doesn't cover inputs
  - [ ] Validation messages visible

- [ ] **QR Code**
  - [ ] QR code is large enough
  - [ ] Timer is visible
  - [ ] Doesn't get cut off

---

## 👨‍🍳 BARTENDER FRONTEND TESTING

### 1. Authentication
- [ ] **Login**
  - [ ] Valid credentials → Success
  - [ ] Invalid credentials → Shows error
  - [ ] Empty fields → Shows validation errors
  - [ ] Pending approval message (if not approved)

- [ ] **Forgot Password**
  - [ ] Works same as customer

### 2. Home Dashboard
- [ ] **Stats Display**
  - [ ] Served today count
  - [ ] Active bottles count
  - [ ] Stats update correctly

- [ ] **Quick Actions**
  - [ ] "Scan QR" button works
  - [ ] "View Inventory" button works
  - [ ] "Pending Requests" button works

### 3. QR Scanning
- [ ] **Scanner**
  - [ ] Camera permission requested
  - [ ] Camera feed shows
  - [ ] Can scan QR code
  - [ ] Valid QR → Shows redemption details
  - [ ] Invalid QR → Shows error
  - [ ] Expired QR → Shows error

- [ ] **Redemption Details**
  - [ ] Customer name shows
  - [ ] Bottle details show
  - [ ] Peg size shows
  - [ ] Remaining volume shows
  - [ ] "Approve" button works
  - [ ] "Reject" button works

- [ ] **Approval**
  - [ ] Approve → Success message
  - [ ] Volume deducted correctly
  - [ ] QR becomes invalid
  - [ ] Can't scan same QR twice

### 4. Pending Requests
- [ ] **Request List**
  - [ ] Shows all pending purchase requests
  - [ ] Customer name shows
  - [ ] Bottle details show
  - [ ] Amount shows
  - [ ] Timer shows (15 min)

- [ ] **Process Request**
  - [ ] "Confirm" button works
  - [ ] "Reject" button works
  - [ ] Confirmation dialog shows
  - [ ] Request removed after action
  - [ ] Expired requests disappear

### 5. Inventory
- [ ] **Bottle List**
  - [ ] Shows all bottles for bartender's venue
  - [ ] Stock status shows
  - [ ] Can filter by availability
  - [ ] Can search bottles

### 6. Redemption History
- [ ] **History List**
  - [ ] Shows recent redemptions
  - [ ] Customer name shows
  - [ ] Bottle details show
  - [ ] Timestamp shows
  - [ ] Can filter by status
  - [ ] Can filter by date

### 7. Stats Page
- [ ] **Statistics**
  - [ ] Total redemptions
  - [ ] Today's redemptions
  - [ ] This week's redemptions
  - [ ] Charts display correctly

### 8. Mobile Experience (Bartender)
- [ ] **QR Scanner**
  - [ ] Works on mobile camera
  - [ ] Fullscreen mode works
  - [ ] Focus works properly

- [ ] **Touch Interactions**
  - [ ] Buttons are large enough
  - [ ] Swipe gestures work
  - [ ] Pull to refresh works

---

## 👨‍💼 ADMIN PANEL TESTING

### 1. Authentication
- [ ] **Login**
  - [ ] Admin credentials work
  - [ ] Invalid credentials → Error
  - [ ] Session persists

### 2. Dashboard
- [ ] **Stats Display**
  - [ ] Total users count
  - [ ] Total venues count
  - [ ] Total bottles count
  - [ ] Total revenue
  - [ ] Charts display correctly

- [ ] **Recent Activity**
  - [ ] Shows recent purchases
  - [ ] Shows recent redemptions
  - [ ] Timestamps correct

### 3. Venues Management
- [ ] **List View**
  - [ ] Shows all venues
  - [ ] Search works
  - [ ] Refresh button works
  - [ ] Empty state shows

- [ ] **Create Venue**
  - [ ] Click "Add Venue" → Opens dialog
  - [ ] All fields present
  - [ ] Validation works:
    - [ ] Name required (1-255 chars)
    - [ ] Address required (1-500 chars)
    - [ ] Email format validation
    - [ ] Phone format validation
    - [ ] Image URL format validation
  - [ ] Create button works
  - [ ] Success toast shows
  - [ ] List refreshes

- [ ] **Edit Venue**
  - [ ] Click Edit → Opens dialog with data
  - [ ] Can modify all fields
  - [ ] Validation works
  - [ ] Save button works
  - [ ] Success toast shows

- [ ] **Delete Venue**
  - [ ] Click Delete → Shows confirmation
  - [ ] Confirmation dialog visible
  - [ ] Cancel button works
  - [ ] Delete button works
  - [ ] Success toast shows
  - [ ] Venue removed from list

### 4. Bottles Management
- [ ] **List View**
  - [ ] Shows all bottles
  - [ ] Venue filter works
  - [ ] Search works
  - [ ] Refresh button works

- [ ] **Create Bottle**
  - [ ] Click "Add Bottle" → Opens dialog
  - [ ] Venue dropdown works
  - [ ] All fields present
  - [ ] Validation works:
    - [ ] Venue required
    - [ ] Brand required (1-255 chars)
    - [ ] Name required (1-255 chars)
    - [ ] Price required (positive, max 999,999.99)
    - [ ] Volume required (positive, max 10,000 ml)
    - [ ] Image URL format validation
  - [ ] Create button works
  - [ ] Success toast shows

- [ ] **Edit Bottle**
  - [ ] Click Edit → Opens dialog with data
  - [ ] Can modify all fields
  - [ ] Validation works
  - [ ] Save button works

- [ ] **Delete Bottle**
  - [ ] Click Delete → Shows confirmation
  - [ ] Confirmation works
  - [ ] Bottle deleted

### 5. Users Management
- [ ] **List View**
  - [ ] Shows all users
  - [ ] Search works
  - [ ] Role badges show correctly

- [ ] **Edit User Role**
  - [ ] Click "Edit Role" → Opens dialog
  - [ ] Role dropdown works
  - [ ] Venue dropdown shows for bartender role
  - [ ] Save button works
  - [ ] Role updated correctly

### 6. Bartenders Management
- [ ] **List View**
  - [ ] Shows all bartenders
  - [ ] Venue filter works
  - [ ] Search works

- [ ] **Create Bartender**
  - [ ] Click "Add Bartender" → Opens dialog
  - [ ] All fields present
  - [ ] Validation works:
    - [ ] Name required (1-255 chars)
    - [ ] Email OR phone required
    - [ ] Email format validation
    - [ ] Phone format validation
    - [ ] Password required (8+ chars)
    - [ ] Password strength validation (uppercase, lowercase, number)
    - [ ] Venue required
  - [ ] Create button works
  - [ ] Success toast shows

- [ ] **Edit Bartender**
  - [ ] Click Edit → Opens dialog
  - [ ] Can modify fields
  - [ ] Validation works
  - [ ] Save button works

- [ ] **Delete Bartender**
  - [ ] Click Delete → Shows confirmation
  - [ ] Confirmation works
  - [ ] Bartender deleted

### 7. Purchases Management
- [ ] **List View**
  - [ ] Shows all purchases
  - [ ] Status filter works
  - [ ] Venue filter works
  - [ ] Search works

- [ ] **Purchase Details**
  - [ ] Click purchase → Shows details
  - [ ] All information correct

### 8. Redemptions Management
- [ ] **List View**
  - [ ] Shows all redemptions
  - [ ] Status filter works
  - [ ] Venue filter works

- [ ] **Redemption Details**
  - [ ] All information displays correctly

### 9. Promotions Management
- [ ] **List View**
  - [ ] Shows all promotions
  - [ ] Status filter works
  - [ ] Venue filter works

- [ ] **Create Promotion**
  - [ ] Dialog opens
  - [ ] All fields work
  - [ ] Validation works
  - [ ] Create button works

- [ ] **Edit/Delete Promotion**
  - [ ] Edit works
  - [ ] Delete confirmation works

### 10. Support Tickets
- [ ] **List View**
  - [ ] Shows all tickets
  - [ ] Status filter works

- [ ] **Create Ticket**
  - [ ] Dialog opens
  - [ ] Category dropdown works
  - [ ] Priority dropdown works
  - [ ] Create button works

- [ ] **Ticket Details**
  - [ ] Shows ticket details
  - [ ] Can add comments
  - [ ] Can change status
  - [ ] Can assign to user

### 11. Reports
- [ ] **Revenue Report**
  - [ ] Date range picker works
  - [ ] Venue filter works
  - [ ] Generate button works
  - [ ] Data displays correctly
  - [ ] Export works (if implemented)

- [ ] **Sales Report**
  - [ ] Works correctly
  - [ ] Data accurate

- [ ] **Inventory Report**
  - [ ] Shows current inventory
  - [ ] Data accurate

### 12. Analytics
- [ ] **Venue Analytics**
  - [ ] Venue selector works
  - [ ] Charts display correctly
  - [ ] Data accurate

- [ ] **Revenue Analytics**
  - [ ] Charts display correctly
  - [ ] Trends show correctly

### 13. Settings
- [ ] **System Settings**
  - [ ] Can view settings
  - [ ] Can update settings
  - [ ] Save button works

### 14. Admin Mobile Experience
- [ ] **Sidebar**
  - [ ] Collapses on mobile
  - [ ] Hamburger menu works
  - [ ] All menu items accessible

- [ ] **Tables**
  - [ ] Horizontal scroll works
  - [ ] Actions menu works
  - [ ] Responsive layout

- [ ] **Forms**
  - [ ] Dialogs fit on screen
  - [ ] Inputs are accessible
  - [ ] Dropdowns work on mobile

---

## 🔍 EDGE CASES & ERROR SCENARIOS

### Network Issues
- [ ] **Offline**
  - [ ] Shows appropriate error message
  - [ ] Doesn't crash app
  - [ ] Recovers when back online

- [ ] **Slow Connection**
  - [ ] Loading states show
  - [ ] Doesn't timeout too quickly
  - [ ] User can retry

- [ ] **API Errors**
  - [ ] 400 errors show validation messages
  - [ ] 401 errors redirect to login
  - [ ] 403 errors show permission denied
  - [ ] 404 errors show not found
  - [ ] 500 errors show server error
  - [ ] Network errors show connection error

### Data Edge Cases
- [ ] **Empty States**
  - [ ] No venues → Shows empty state
  - [ ] No bottles → Shows empty state
  - [ ] No purchases → Shows empty state
  - [ ] Empty states have helpful messages

- [ ] **Large Data**
  - [ ] Many bottles → Pagination works
  - [ ] Long names → Text truncates properly
  - [ ] Large images → Load properly

- [ ] **Special Characters**
  - [ ] Names with special chars work
  - [ ] Emails with + work
  - [ ] Prices with decimals work

### Timing Edge Cases
- [ ] **Expired Timers**
  - [ ] Payment expires → Can't complete
  - [ ] QR expires → Can't scan
  - [ ] Timers update in real-time

- [ ] **Concurrent Actions**
  - [ ] Two users redeem same bottle → Handles correctly
  - [ ] Bartender approves expired QR → Shows error
  - [ ] Delete while editing → Handles gracefully

### Permission Edge Cases
- [ ] **Customer Access**
  - [ ] Can't access admin panel
  - [ ] Can't access bartender panel
  - [ ] Can only see own data

- [ ] **Bartender Access**
  - [ ] Can't access admin panel
  - [ ] Can only see own venue data
  - [ ] Can't modify other venues

- [ ] **Admin Access**
  - [ ] Can access everything
  - [ ] Can modify all data

---

## 📊 PERFORMANCE TESTING

### Load Times
- [ ] **Initial Load**
  - [ ] Customer app loads < 3 seconds
  - [ ] Bartender app loads < 3 seconds
  - [ ] Admin app loads < 3 seconds

- [ ] **API Response Times**
  - [ ] List endpoints < 500ms
  - [ ] Create endpoints < 1s
  - [ ] Update endpoints < 1s
  - [ ] Delete endpoints < 1s

### Resource Usage
- [ ] **Memory**
  - [ ] No memory leaks
  - [ ] Memory usage stable

- [ ] **Network**
  - [ ] Images optimized
  - [ ] API calls minimized
  - [ ] No unnecessary requests

---

## 🐛 BUG TRACKING

### Found Bugs:
1. ❌ [Bug Description]
   - Steps to reproduce:
   - Expected behavior:
   - Actual behavior:
   - Priority: High/Medium/Low

---

## ✅ TESTING SUMMARY

### Completion Status:
- [ ] Customer Frontend: 0/8 sections
- [ ] Bartender Frontend: 0/8 sections
- [ ] Admin Panel: 0/14 sections
- [ ] Edge Cases: 0/4 sections
- [ ] Performance: 0/2 sections

### Overall Status: NOT STARTED

### Bugs Found: 0
### Bugs Fixed: 0
### Bugs Remaining: 0

---

## 📝 NOTES

Add any observations, suggestions, or issues here:

