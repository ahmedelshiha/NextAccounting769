# Manual Verification Checklist - Entities Tab Retirement

Use this guide to manually verify the Entities Tab retirement implementation before production deployment.

---

## Pre-Test Setup

### Prerequisites Checklist
- [ ] Dev server running: `npm run dev`
- [ ] No errors in terminal logs
- [ ] Browser console open (F12)
- [ ] Network tab open (to observe API calls)
- [ ] Logged in as admin user

### Environment Setup

**Test Phase 1: Feature Flag OFF (Backward Compatibility)**
```bash
export NEXT_PUBLIC_RETIRE_ENTITIES_TAB=false
npm run dev
```

**Test Phase 2: Feature Flag ON (New Experience)**
```bash
export NEXT_PUBLIC_RETIRE_ENTITIES_TAB=true
npm run dev
# Hard refresh browser after restart
```

---

## PHASE 1: FEATURE FLAG OFF (BACKWARD COMPATIBILITY)

### ✓ Test 1.1: Entities Tab Visible
**Goal**: Verify Entities tab appears in navigation when FF is OFF

**Steps**:
1. Navigate to: `http://localhost:3000/admin/users`
2. Look at tab navigation bar
3. Observe tabs from left to right

**Expected Results** ✅:
```
Tabs visible: Dashboard | Entities | Workflows | Bulk Operations | Audit | Roles & Permissions | Admin
- Entities tab should be visible between Dashboard and Workflows
- Entities tab has 🏢 icon
- Entities tab is clickable
```

**Verification**:
- [ ] Entities tab is visible
- [ ] Icon 🏢 is displayed
- [ ] Tab is clickable
- [ ] No console errors

---

### ✓ Test 1.2: Entities Tab Content
**Goal**: Verify Entities tab shows Clients and Team sub-tabs

**Steps**:
1. Click on "Entities" tab
2. Observe content below the tab bar
3. Look for sub-tabs or sections

**Expected Results** ✅:
```
When Entities tab is active:
- Clients sub-tab appears
- Team sub-tab appears
- Sub-tab content loads (client list or team grid)
- No loading errors
```

**Verification**:
- [ ] Entities tab becomes active
- [ ] Content region updates
- [ ] Can click Clients sub-tab
- [ ] Can click Team sub-tab
- [ ] No 404 or error messages
- [ ] Console shows no errors

---

### ✓ Test 1.3: Legacy Route /admin/clients
**Goal**: Verify /admin/clients still works normally with FF OFF

**Steps**:
1. Navigate to: `http://localhost:3000/admin/clients`
2. Observe page behavior
3. Check URL and active tab

**Expected Results** ✅:
```
- Current URL shows: /admin/users?tab=entities&type=clients
- Dashboard tab is NOT active
- Entities tab IS active
- Clients sub-tab is selected
- Client list appears
- Status message: "Clients management" or similar
```

**Verification**:
- [ ] Redirect happens (or stays at /admin/clients)
- [ ] Entities tab is active
- [ ] Clients content visible
- [ ] No error messages
- [ ] Network requests show deprecation headers

---

### ✓ Test 1.4: Legacy Route /admin/team
**Goal**: Verify /admin/team still works normally with FF OFF

**Steps**:
1. Navigate to: `http://localhost:3000/admin/team`
2. Observe page behavior
3. Check URL and active tab

**Expected Results** ✅:
```
- Current URL shows: /admin/users?tab=entities&type=team
- Dashboard tab is NOT active
- Entities tab IS active
- Team sub-tab is selected
- Team member list appears
```

**Verification**:
- [ ] Redirect happens (or stays at /admin/team)
- [ ] Entities tab is active
- [ ] Team content visible
- [ ] No error messages

---

### ✓ Test 1.5: Dashboard Tab Still Works
**Goal**: Verify Dashboard tab is still functional with FF OFF

**Steps**:
1. Navigate to: `http://localhost:3000/admin/users?tab=dashboard`
2. Observe Dashboard content
3. Look for Overview and Operations sub-tabs

**Expected Results** ✅:
```
- Dashboard tab is active
- Shows Overview and Operations sub-tabs
- Overview tab shows metrics/KPIs
- Operations tab shows User Directory with filters
- Role preset chips visible: All, Clients, Team, Admins
```

**Verification**:
- [ ] Dashboard tab active
- [ ] Overview tab content loads
- [ ] Operations tab content loads
- [ ] Can switch between sub-tabs
- [ ] Role chips visible and clickable

---

## PHASE 2: FEATURE FLAG ON (NEW EXPERIENCE)

**Before starting Phase 2**:
1. Set env: `export NEXT_PUBLIC_RETIRE_ENTITIES_TAB=true`
2. Restart dev server: `npm run dev`
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Wait for page to fully load

---

### ✓ Test 2.1: Entities Tab Hidden
**Goal**: Verify Entities tab is hidden when FF is ON

**Steps**:
1. Navigate to: `http://localhost:3000/admin/users`
2. Look at tab navigation bar
3. Count the tabs

**Expected Results** ✅:
```
Tabs visible: Dashboard | Workflows | Bulk Operations | Audit | Roles & Permissions | Admin
- Entities tab should NOT be visible
- No gap where Entities tab was
- Tab count is 6 (not 7)
- Dashboard tab is first
```

**Verification**:
- [ ] Entities tab is NOT visible
- [ ] Other tabs still present
- [ ] Dashboard is the first tab
- [ ] No console errors about missing tab

---

### ✓ Test 2.2: Legacy Route /admin/clients Redirects
**Goal**: Verify /admin/clients redirects to Dashboard with CLIENT filter when FF is ON

**Steps**:
1. Navigate to: `http://localhost:3000/admin/clients`
2. Wait for redirect to complete
3. Check URL and tab state
4. Observe page content

**Expected Results** ✅:
```
- Redirect to: /admin/users?tab=dashboard&role=CLIENT
- Dashboard tab is active
- Entities tab is NOT visible
- Users Directory shows with filters applied
- "Clients" role chip appears highlighted/active
- Table shows only users with CLIENT role (if data exists)
```

**Verification**:
- [ ] Redirect happens
- [ ] URL contains tab=dashboard and role=CLIENT
- [ ] Dashboard tab active
- [ ] Entities tab hidden
- [ ] Clients chip highlighted
- [ ] Telemetry event logged (check Network tab for API calls)

---

### ✓ Test 2.3: Legacy Route /admin/team Redirects
**Goal**: Verify /admin/team redirects to Dashboard with TEAM_MEMBER filter when FF is ON

**Steps**:
1. Navigate to: `http://localhost:3000/admin/team`
2. Wait for redirect to complete
3. Check URL and tab state
4. Observe page content

**Expected Results** ✅:
```
- Redirect to: /admin/users?tab=dashboard&role=TEAM_MEMBER
- Dashboard tab is active
- Entities tab is NOT visible
- Users Directory shows with filters applied
- "Team" role chip appears highlighted/active
- Table shows only users with TEAM_MEMBER or TEAM_LEAD roles
```

**Verification**:
- [ ] Redirect happens
- [ ] URL contains tab=dashboard and role=TEAM_MEMBER
- [ ] Dashboard tab active
- [ ] Entities tab hidden
- [ ] Team chip highlighted
- [ ] Telemetry event logged

---

### ✓ Test 2.4: Direct Entities Tab Request
**Goal**: Verify direct navigation to Entities tab redirects to Dashboard when FF is ON

**Steps**:
1. Navigate to: `http://localhost:3000/admin/users?tab=entities`
2. Wait for page to load/redirect
3. Check which tab is active

**Expected Results** ✅:
```
- Redirect to: /admin/users?tab=dashboard
- Dashboard tab becomes active
- Entities tab is NOT visible
- Shows all users (no role filter pre-applied)
```

**Verification**:
- [ ] Redirect happens
- [ ] URL shows tab=dashboard
- [ ] Dashboard tab active
- [ ] Entities tab hidden
- [ ] Telemetry event logged for redirect

---

### ✓ Test 2.5: Role Filter Chips Work
**Goal**: Verify role preset chips filter correctly in Dashboard

**Steps**:
1. Navigate to: `http://localhost:3000/admin/users?tab=dashboard`
2. Go to Operations sub-tab
3. Observe role filter chips below the quick actions bar
4. Click "Clients" chip
5. Observe URL change and table update
6. Click "Team" chip
7. Observe URL change and table update
8. Click "All Users" chip
9. Observe table shows all users again

**Expected Results** ✅:
```
Role Chips Visible:
- 👥 All Users
- 🏢 Clients
- 👨‍💼 Team
- 🔐 Admins

After clicking "Clients":
- URL: ?tab=dashboard&role=CLIENT
- Chip highlighted/active
- Table filters to show only CLIENT role users

After clicking "Team":
- URL: ?tab=dashboard&role=TEAM_MEMBER
- Chip highlighted/active
- Table filters to show team members

After clicking "All Users":
- URL: ?tab=dashboard (no role param)
- All users displayed
```

**Verification**:
- [ ] All role chips visible
- [ ] Chips are clickable
- [ ] URL updates when chip clicked
- [ ] Table content changes after click
- [ ] Active chip has visual feedback (different styling)

---

### ✓ Test 2.6: Create New User From Dashboard
**Goal**: Verify creating a new user from Dashboard works with Unified Form

**Steps**:
1. Navigate to: `http://localhost:3000/admin/users?tab=dashboard`
2. Locate "Add User" button (in quick actions bar)
3. Click "Add User"
4. Fill out form:
   - Name: "Test Client" 
   - Email: "testclient@example.com"
   - Role: Select "Client" from dropdown
5. Click "Create User"

**Expected Results** ✅:
```
Form Opens:
- Modal titled "Create New User" appears
- Form has fields: Name, Email, Role, Status, etc.

Form Submission:
- Form validates required fields
- Shows success toast: "User created successfully"
- Modal closes automatically
- New user appears in table (after refresh or auto-update)

With Role Selected (Client):
- Client-specific fields appear: Company, Tier, Phone
```

**Verification**:
- [ ] Add User button is visible
- [ ] Click opens UnifiedUserFormModal
- [ ] Form has proper fields for selected role
- [ ] Validation prevents empty email
- [ ] User can be created
- [ ] Success toast appears
- [ ] Modal closes
- [ ] User appears in directory

---

### ✓ Test 2.7: User Profile Drawer
**Goal**: Verify clicking a user opens profile drawer without full page navigation

**Steps**:
1. Navigate to: `http://localhost:3000/admin/users?tab=dashboard`
2. Go to Operations sub-tab
3. Locate user table with list of users
4. Click on any user row
5. Observe panel opening on right side
6. Click X or outside panel to close

**Expected Results** ✅:
```
When User Row Clicked:
- Right side panel opens (drawer/sidebar)
- Panel shows user details
- Tabs visible: Overview, Activity, Details, Settings
- URL does NOT change (still on /admin/users)

Panel Content:
- User name displayed
- Email shown
- Role visible
- Can view activity
- Can edit fields

When Closing:
- Click X button closes panel
- Or click outside panel area
- User stays on same Dashboard page
- No full page navigation
```

**Verification**:
- [ ] User row is clickable
- [ ] Panel opens on right (not new page)
- [ ] User details visible
- [ ] URL unchanged
- [ ] Can close panel without navigation
- [ ] No console errors

---

### ✓ Test 2.8: Bulk Operations
**Goal**: Verify bulk user operations work

**Steps**:
1. Navigate to: `http://localhost:3000/admin/users?tab=dashboard`
2. Go to Operations sub-tab
3. Select 2-3 users using checkboxes in the table
4. Observe bulk action panel appearing above table
5. Select action: "Change Role"
6. Select new role: "TEAM_LEAD"
7. Click "Apply"

**Expected Results** ✅:
```
When Users Selected:
- Checkboxes in table can be clicked
- Selected state shows with checkbox ☑
- Count shows: "(X selected)"
- Bulk action panel appears

When Action Applied:
- Toast shows: "Applied to X users: Changed role to TEAM_LEAD"
- Selected users update role in table
- Selection clears
- Panel disappears
```

**Verification**:
- [ ] Checkboxes are functional
- [ ] Selection count shows
- [ ] Bulk panel appears on selection
- [ ] Action dropdown works
- [ ] Value selection works
- [ ] Apply button works
- [ ] Success toast appears
- [ ] Changes apply to users

---

## ACCESSIBILITY & USABILITY TESTING

### ✓ Test 3.1: Keyboard Navigation
**Goal**: Verify all features work with keyboard only

**Prerequisites**: Browser focused on Dashboard page

**Steps**:
1. Press `Tab` repeatedly through the page
2. Observe focus highlighting on each element
3. Press `Enter` on buttons to activate
4. Press `Escape` to close modals
5. Use `Arrow Keys` in dropdowns

**Expected Results** ✅:
```
Tab Navigation:
- All buttons have visible focus rings
- All links show focus indicator
- Tab order is logical (left-to-right, top-to-bottom)
- Can reach "Add User" button with Tab
- Can reach all role chips with Tab

Escape Key:
- Closes open modals
- Closes open dropdowns
- Returns focus to button that opened it

Enter Key:
- Activates buttons
- Selects items from dropdowns
- Submits forms
```

**Verification**:
- [ ] Tab navigation works
- [ ] Focus ring visible on all elements
- [ ] Escape closes modals
- [ ] Enter activates buttons
- [ ] Arrow keys navigate dropdowns

---

### ✓ Test 3.2: Form Validation
**Goal**: Verify form validation prevents invalid submissions

**Steps**:
1. Click "Add User" button
2. Try to submit form without filling Name field
3. Observe error message
4. Try to submit without Email
5. Observe error message
6. Enter invalid email: "notanemail"
7. Try to submit
8. Observe email validation error

**Expected Results** ✅:
```
Missing Name:
- Error message: "Name is required"
- Form doesn't submit
- Modal stays open

Missing Email:
- Error message: "Email is required"
- Form doesn't submit

Invalid Email:
- Error message: "Invalid email format"
- Form doesn't submit
- User can correct and resubmit
```

**Verification**:
- [ ] Name validation works
- [ ] Email required validation works
- [ ] Email format validation works
- [ ] Error messages are clear
- [ ] Form doesn't submit with errors

---

## API & NETWORK TESTING

### ✓ Test 4.1: Deprecation Headers (FF ANY STATE)
**Goal**: Verify legacy API endpoints return deprecation headers

**Steps**:
1. Open DevTools: F12 → Network tab
2. Filter to: "XHR" requests only
3. Navigate to page that calls `/api/admin/entities/clients`
4. Find the request in Network tab
5. Click request → Response Headers
6. Scroll to find these headers

**Expected Results** ✅:
```
Response Headers Include:
✓ Deprecation: true
✓ Sunset: <date 90 days from now> (e.g., "Fri, 15 Aug 2025 12:00:00 GMT")
✓ Link: </api/admin/users?role=CLIENT>; rel="successor"
✓ X-API-Warn: "This endpoint is deprecated..."

Status Code: 200 (still functional)
```

**Verification**:
- [ ] Deprecation header present
- [ ] Sunset header has future date
- [ ] Link header points to successor endpoint
- [ ] X-API-Warn header present
- [ ] Request still works (200 status)

---

### ✓ Test 4.2: Unified API Endpoint
**Goal**: Verify new /api/admin/users endpoint works with role filters

**Steps**:
1. Open DevTools: F12 → Network tab
2. Navigate to: `http://localhost:3000/admin/users?tab=dashboard&role=CLIENT`
3. Observe Network requests
4. Find request to: `/api/admin/users?role=CLIENT...`
5. Click request → Response
6. Verify response contains only CLIENT role users

**Expected Results** ✅:
```
API Request:
GET /api/admin/users?role=CLIENT&...

Response:
{
  "users": [
    { "id": "...", "name": "...", "email": "...", "role": "CLIENT", ... },
    { "id": "...", "name": "...", "email": "...", "role": "CLIENT", ... }
  ],
  "total": 5
}

Status: 200
```

**Verification**:
- [ ] Request URL includes role parameter
- [ ] Response contains users array
- [ ] Users in response have correct role
- [ ] Status code is 200 (success)

---

## PERFORMANCE TESTING

### ✓ Test 5.1: Page Load Time
**Goal**: Verify Dashboard loads quickly

**Steps**:
1. Open DevTools: F12
2. Go to Performance tab
3. Click record
4. Navigate to: `http://localhost:3000/admin/users`
5. Wait for page to fully load
6. Stop recording
7. Review metrics

**Expected Results** ✅:
```
Target Metrics:
✓ First Contentful Paint (FCP): < 1.5 seconds
✓ Largest Contentful Paint (LCP): < 2.5 seconds
✓ Time to Interactive (TTI): < 3 seconds
✓ Cumulative Layout Shift (CLS): < 0.1

Bundle Size:
✓ JavaScript < 500KB
✓ CSS < 50KB
```

**Verification**:
- [ ] Page loads in < 2 seconds
- [ ] No layout shifts after load
- [ ] All elements rendered by 2.5s

---

### ✓ Test 5.2: Scroll Performance
**Goal**: Verify table scrolling is smooth (60fps)

**Steps**:
1. Navigate to: `http://localhost:3000/admin/users?tab=dashboard`
2. Go to Operations tab
3. Open DevTools: F12 → Performance
4. Click record
5. Scroll down through user table (10-15 scrolls)
6. Stop recording
7. Review FPS graph

**Expected Results** ✅:
```
Scroll Performance:
✓ FPS stays at 60 (solid line, no drops)
✓ Scrolling feels smooth (no jank)
✓ Main thread doesn't block
✓ No layout recalculations visible
```

**Verification**:
- [ ] Scrolling is smooth
- [ ] FPS stays consistent
- [ ] No visible lag or jank
- [ ] Table remains responsive while scrolling

---

## BROWSER COMPATIBILITY (CROSS-BROWSER)

Test on these browsers if available:

### Chrome/Edge (Chromium-based)
- [ ] Dashboard loads: ✅
- [ ] Tabs work: ✅
- [ ] Forms work: ✅
- [ ] Drawer opens: ✅
- [ ] No console errors: ✅

### Firefox
- [ ] Dashboard loads: ✅
- [ ] Tabs work: ✅
- [ ] Forms work: ✅
- [ ] Drawer opens: ✅
- [ ] No console errors: ✅

### Safari (macOS/iOS)
- [ ] Dashboard loads: ✅
- [ ] Tabs work: ✅
- [ ] Forms work: ✅
- [ ] Drawer opens: ✅
- [ ] Responsive on mobile: ✅

---

## FINAL VERIFICATION CHECKLIST

After all tests, verify:

### Code Quality
- [ ] No console errors
- [ ] No broken images
- [ ] All links work
- [ ] No 404s

### Feature Flag OFF State
- [ ] Entities tab visible
- [ ] Legacy routes work normally
- [ ] Old forms still work
- [ ] All tests pass

### Feature Flag ON State
- [ ] Entities tab hidden
- [ ] Legacy routes redirect
- [ ] Dashboard fully functional
- [ ] New forms work
- [ ] All tests pass

### Ready for Production?
- [ ] ✅ All Phase 1 tests pass (FF OFF)
- [ ] ✅ All Phase 2 tests pass (FF ON)
- [ ] ✅ No critical issues found
- [ ] ✅ Performance acceptable
- [ ] ✅ Accessibility verified
- [ ] ✅ Documentation complete

**Status**: 🟢 **READY FOR STAGING** → **READY FOR PRODUCTION**

---

## Test Summary Form

```
Date: ____________
Tester: __________
Environment: Staging / Production

PHASE 1 (FF OFF): ___/8 tests passed
PHASE 2 (FF ON): ___/8 tests passed
ACCESSIBILITY: ___/2 tests passed
API: ___/2 tests passed
PERFORMANCE: ___/2 tests passed

Total: ___/24 tests passed

Overall Status: 🟢 PASS / 🟡 NEEDS FIXES / 🔴 BLOCKING ISSUES

Issues Found:
1. _______________
2. _______________
3. _______________

Approved for Production: YES / NO

Signed: _____________ Date: _________
```

---

**Good luck with testing!** 🚀
