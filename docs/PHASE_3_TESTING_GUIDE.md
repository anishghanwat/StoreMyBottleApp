# Phase 3 Testing Guide

## Overview
This guide provides step-by-step instructions for testing all Phase 3 features in the admin panel.

---

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   python main.py
   ```
   Should be running on `https://localhost:8000`

2. **Admin Panel Running**
   ```bash
   cd admin
   npm run dev
   ```
   Should be running on `https://localhost:3000`

3. **Admin Account**
   - Email: Your admin email
   - Password: Your admin password

---

## Phase 3.1: Promotions System Testing

### Test 1: View Promotions
1. Navigate to "Promotions" in the sidebar
2. Verify the page loads without errors
3. Check that existing promotions are displayed (if any)
4. Verify summary cards show correct counts

### Test 2: Create Promotion
1. Click "Create Promotion" button
2. Fill in the form:
   - Code: `TEST10`
   - Description: `10% off test promotion`
   - Type: `Percentage`
   - Value: `10`
   - Max Uses: `100`
   - Venue: Select a venue or leave as "All Venues"
   - Valid From: Today's date
   - Valid Until: Future date
3. Click "Create"
4. Verify success toast appears
5. Verify new promotion appears in the list

### Test 3: Edit Promotion
1. Click "Edit" on a promotion
2. Change the description
3. Click "Update"
4. Verify success toast appears
5. Verify changes are reflected in the list

### Test 4: Delete Promotion
1. Click "Delete" on a promotion
2. Confirm deletion
3. Verify success toast appears
4. Verify promotion is removed from the list

### Test 5: Search & Filter
1. Use search box to find promotions by code
2. Filter by type (percentage, fixed_amount, free_peg)
3. Filter by status (active, inactive, expired)
4. Verify results update correctly

---

## Phase 3.2: Support Tickets System Testing

### Test 1: View Support Tickets
1. Navigate to "Support Tickets" in the sidebar
2. Verify the page loads without errors
3. Check that existing tickets are displayed (if any)
4. Verify summary cards show correct counts

### Test 2: Create Support Ticket
1. Click "Create Ticket" button
2. Fill in the form:
   - Subject: `Test ticket`
   - Description: `This is a test support ticket`
   - Category: Select a category
   - Priority: Select a priority
   - User ID: Enter a valid user ID
3. Click "Create"
4. Verify success toast appears
5. Verify new ticket appears in the list

### Test 3: View Ticket Details
1. Click on a ticket to view details
2. Verify all ticket information is displayed
3. Check that comments section is visible

### Test 4: Add Comment
1. In ticket details, scroll to comments section
2. Enter a comment: `This is a test comment`
3. Click "Add Comment"
4. Verify success toast appears
5. Verify comment appears in the list

### Test 5: Update Ticket Status
1. In ticket details, change the status dropdown
2. Select a different status (e.g., "In Progress")
3. Click "Update Status"
4. Verify success toast appears
5. Verify status badge updates

### Test 6: Assign Ticket
1. In ticket details, enter a staff member ID
2. Click "Assign"
3. Verify success toast appears
4. Verify assigned staff ID is displayed

### Test 7: Delete Ticket
1. In ticket details, click "Delete Ticket"
2. Confirm deletion
3. Verify success toast appears
4. Verify redirected to tickets list
5. Verify ticket is removed

### Test 8: Search & Filter
1. Use search box to find tickets by subject
2. Filter by status (open, in_progress, resolved, closed)
3. Filter by priority (low, medium, high, urgent)
4. Filter by category
5. Verify results update correctly

---

## Phase 3.3: Audit Logs System Testing

### Test 1: View Audit Logs
1. Navigate to "Audit Logs" in the sidebar
2. Verify the page loads without errors
3. Check that audit logs are displayed
4. Verify logs show recent actions

### Test 2: Filter by Action Type
1. Use the "Action" dropdown
2. Select different action types (CREATE, UPDATE, DELETE, etc.)
3. Verify results filter correctly

### Test 3: Filter by Entity Type
1. Use the "Entity Type" dropdown
2. Select different entity types (bottle, purchase, user, etc.)
3. Verify results filter correctly

### Test 4: Filter by Date Range
1. Select a start date
2. Select an end date
3. Verify logs within date range are displayed

### Test 5: Search by User
1. Enter a user ID in the search box
2. Verify logs for that user are displayed

### Test 6: Export to CSV
1. Click "Export CSV" button
2. Verify CSV file downloads
3. Open CSV file and verify data is correct

### Test 7: Verify Audit Trail
1. Perform an action in another section (e.g., create a bottle)
2. Return to Audit Logs
3. Verify the action was logged
4. Check that all details are correct (user, action, entity, timestamp)

---

## Phase 3.4: Settings Management Testing

### Test 1: View Settings
1. Navigate to "Settings" in the sidebar
2. Verify the page loads without errors
3. Check that all 5 tabs are visible:
   - General
   - Features
   - Notifications
   - Business Rules
   - Email Templates

### Test 2: General Settings Tab
1. Click on "General" tab
2. Verify settings are displayed:
   - App Name
   - Support Email
   - Support Phone
   - Timezone
   - Currency
3. Edit a setting (e.g., change App Name)
4. Click "Save All Changes"
5. Verify success toast appears
6. Refresh page and verify change persisted

### Test 3: Features Tab
1. Click on "Features" tab
2. Verify feature flags are displayed as switches:
   - Enable Promotions
   - Enable Support Tickets
   - Enable Audit Logs
   - Enable Notifications
3. Toggle a switch
4. Click "Save All Changes"
5. Verify success toast appears
6. Refresh page and verify change persisted

### Test 4: Notifications Tab
1. Click on "Notifications" tab
2. Verify notification settings are displayed
3. Toggle notification switches
4. Change notification frequency
5. Click "Save All Changes"
6. Verify success toast appears

### Test 5: Business Rules Tab
1. Click on "Business Rules" tab
2. Verify business rule settings are displayed:
   - Min Purchase Amount
   - Max Purchase Amount
   - Peg Size (ml)
   - Max Pegs Per Bottle
3. Edit a numeric value
4. Click "Save All Changes"
5. Verify success toast appears

### Test 6: Email Templates Tab
1. Click on "Email Templates" tab
2. Verify email template textareas are displayed:
   - Welcome Email
   - Purchase Confirmation
   - Redemption Confirmation
   - Support Ticket Response
3. Edit a template
4. Click "Save All Changes"
5. Verify success toast appears

### Test 7: Add New Setting
1. Click "Add New Setting" button
2. Fill in the form:
   - Key: `test_setting`
   - Value: `test value`
   - Category: Select a category
   - Description: `Test setting description`
3. Click "Add"
4. Verify success toast appears
5. Verify new setting appears in the appropriate tab

### Test 8: Delete Setting
1. Find a custom setting (not a default one)
2. Click the delete icon
3. Confirm deletion
4. Verify success toast appears
5. Verify setting is removed

### Test 9: Refresh Settings
1. Click the "Refresh" button
2. Verify settings reload from server
3. Verify any unsaved changes are discarded

---

## Integration Testing

### Test 1: Promotions in Purchases
1. Create an active promotion
2. Make a test purchase using the promotion code
3. Verify discount is applied correctly
4. Check that promotion usage count increases

### Test 2: Audit Logs Track All Actions
1. Perform various actions:
   - Create a bottle
   - Update a user
   - Delete a promotion
   - Create a support ticket
2. Navigate to Audit Logs
3. Verify all actions are logged with correct details

### Test 3: Feature Flags Control Visibility
1. Go to Settings > Features
2. Disable "Enable Promotions"
3. Save changes
4. Verify Promotions menu item is hidden (if implemented)
5. Re-enable the feature

### Test 4: Settings Affect System Behavior
1. Go to Settings > Business Rules
2. Change "Min Purchase Amount" to 100
3. Save changes
4. Try to make a purchase below 100 (if validation implemented)
5. Verify validation works

---

## Error Handling Testing

### Test 1: Network Errors
1. Stop the backend server
2. Try to perform any action in the admin panel
3. Verify error toast appears with appropriate message
4. Restart backend server

### Test 2: Invalid Data
1. Try to create a promotion with invalid data:
   - Empty code
   - Negative value
   - Invalid date range
2. Verify validation errors are shown

### Test 3: Unauthorized Access
1. Log out of admin panel
2. Try to access admin pages directly via URL
3. Verify redirect to login page

---

## Performance Testing

### Test 1: Large Data Sets
1. Create multiple promotions (10+)
2. Create multiple support tickets (20+)
3. Generate many audit logs (perform 50+ actions)
4. Verify pages load quickly
5. Verify search and filter work smoothly

### Test 2: Concurrent Actions
1. Open multiple browser tabs
2. Perform actions in different tabs simultaneously
3. Verify data stays consistent
4. Verify no conflicts or errors

---

## Browser Compatibility Testing

Test all features in:
- Chrome
- Firefox
- Safari
- Edge

Verify:
- All features work correctly
- UI displays properly
- No console errors

---

## Mobile Responsiveness Testing

1. Open admin panel on mobile device or use browser dev tools
2. Test all Phase 3 features on mobile
3. Verify:
   - Tables are scrollable
   - Forms are usable
   - Buttons are clickable
   - Modals display correctly

---

## Checklist Summary

### Phase 3.1 - Promotions
- [ ] View promotions list
- [ ] Create promotion
- [ ] Edit promotion
- [ ] Delete promotion
- [ ] Search promotions
- [ ] Filter by type
- [ ] Filter by status

### Phase 3.2 - Support Tickets
- [ ] View tickets list
- [ ] Create ticket
- [ ] View ticket details
- [ ] Add comment
- [ ] Update status
- [ ] Assign ticket
- [ ] Delete ticket
- [ ] Search tickets
- [ ] Filter by status/priority/category

### Phase 3.3 - Audit Logs
- [ ] View audit logs
- [ ] Filter by action type
- [ ] Filter by entity type
- [ ] Filter by date range
- [ ] Search by user
- [ ] Export to CSV
- [ ] Verify audit trail accuracy

### Phase 3.4 - Settings
- [ ] View all settings tabs
- [ ] Edit general settings
- [ ] Toggle feature flags
- [ ] Edit notification settings
- [ ] Edit business rules
- [ ] Edit email templates
- [ ] Add new setting
- [ ] Delete setting
- [ ] Refresh settings

### Integration
- [ ] Promotions work in purchases
- [ ] Audit logs track all actions
- [ ] Feature flags control visibility
- [ ] Settings affect system behavior

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Invalid data validation works
- [ ] Unauthorized access prevented

### Performance
- [ ] Large data sets load quickly
- [ ] Concurrent actions work correctly

### Compatibility
- [ ] Works in all major browsers
- [ ] Mobile responsive

---

## Reporting Issues

If you find any bugs or issues during testing:

1. Note the exact steps to reproduce
2. Capture any error messages or console logs
3. Take screenshots if applicable
4. Document expected vs actual behavior
5. Report to development team

---

## Success Criteria

All Phase 3 features are considered successfully tested when:

1. All checklist items are completed
2. No critical bugs found
3. All features work as expected
4. Error handling is appropriate
5. Performance is acceptable
6. UI is responsive and user-friendly

---

**Happy Testing!** 🧪✅
