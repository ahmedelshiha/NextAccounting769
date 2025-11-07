# Entities Tab Retirement - Complete Test Plan & Validation Guide

**Status**: Ready for Testing ✅
**Date**: 2024
**Purpose**: Comprehensive validation of Entities Tab retirement implementation

---

## Quick Start

### Prerequisites
```bash
# Ensure dev server is running
npm run dev

# Install test dependencies
npm install
```

### Running Tests

#### Phase 1: Feature Flag OFF (Backward Compatibility)
```bash
# Set feature flag to OFF
export NEXT_PUBLIC_RETIRE_ENTITIES_TAB=false

# Restart dev server for changes to take effect
# Then run these tests:
npm run test:e2e -- admin-unified-redirects.spec.ts
npm run test:e2e -- admin-entities-tab.spec.ts
npm run test:e2e -- admin-add-user-flow.spec.ts
npm run test:e2e -- phase3-virtual-scrolling.spec.ts

# Expected: ALL TESTS PASS ✅
```

#### Phase 2: Feature Flag ON (New Experience)
```bash
# Set feature flag to ON
export NEXT_PUBLIC_RETIRE_ENTITIES_TAB=true

# Restart dev server for changes to take effect
# Then run the same tests:
npm run test:e2e -- admin-unified-redirects.spec.ts
npm run test:e2e -- admin-entities-tab.spec.ts
npm run test:e2e -- admin-add-user-flow.spec.ts
npm run test:e2e -- phase3-virtual-scrolling.spec.ts

# Expected: ALL TESTS PASS (with adaptive behavior) ✅
```

---

## Test Coverage & Verification

### 1️⃣ Admin Unified Redirects Tests
**File**: `e2e/tests/admin-unified-redirects.spec.ts`

#### Test Cases:
```
✓ permissions redirects to RBAC tab
✓ roles redirects to RBAC tab
✓ clients redirects to Dashboard tab with CLIENT role filter
✓ team redirects to Dashboard tab with TEAM_MEMBER role filter
✓ role filter chips work when navigating dashboard directly
```

**What It Validates**:
- Legacy routes (`/admin/clients`, `/admin/team`) redirect correctly
- URL role parameters are applied (`?role=CLIENT`, `?role=TEAM_MEMBER`)
- Dashboard tab becomes active on redirect
- Role filter chips are visible and active

**Expected Results**:
- ✅ All redirects lead to correct dashboard tab
- ✅ Role filters are pre-applied
- ✅ No 404 or error pages
- ✅ Telemetry events logged for redirects

---

### 2️⃣ Admin Entities Tab Tests
**File**: `e2e/tests/admin-entities-tab.spec.ts`

#### Test Cases with Feature Flag OFF:
```
✓ clients sub-tab shows list when feature flag is disabled
✓ team sub-tab shows team grid when feature flag is disabled
✓ entities tab appears in navigation when feature flag is disabled
```

#### Test Cases with Feature Flag ON:
```
✓ clients sub-tab redirects to dashboard when feature flag enabled
✓ team sub-tab redirects to dashboard when feature flag enabled
✓ entities tab hidden from navigation when feature flag enabled
```

**What It Validates**:
- Entities tab UI behavior based on feature flag state
- Backward compatibility when flag is OFF
- Proper hiding when flag is ON
- Graceful handling of tab=entities requests

**Expected Results**:
- ✅ With FF OFF: Entities tab visible, Clients/Team sub-tabs work
- ✅ With FF ON: Entities tab hidden, requests redirect to Dashboard
- ✅ No errors in console
- ✅ Smooth navigation in both states

---

### 3️⃣ Admin Add User Flow Tests
**File**: `e2e/tests/admin-add-user-flow.spec.ts`

#### Test Cases (Both FF States):
```
✓ Create user from Dashboard
✓ Create client from role preset
✓ Create team member from role preset
✓ Create admin from role preset
✓ Form validation works correctly
✓ Password generation works
✓ Modal can be closed/canceled
✓ Keyboard navigation works
```

**What It Validates**:
- Unified user creation flow works in Dashboard
- Role presets filter correctly
- Form validation for each role
- Modal interactions and accessibility
- Both legacy Entities flow and new Dashboard flow

**Expected Results**:
- ✅ Users can be created from Dashboard
- ✅ Role-specific fields appear based on selection
- ✅ Validation prevents invalid submissions
- ✅ Success toasts appear
- ✅ Modal closes after successful creation
- �� User list refreshes with new user

---

### 4️⃣ Phase 3 Virtual Scrolling Tests
**File**: `e2e/tests/phase3-virtual-scrolling.spec.ts`

#### Test Cases:
```
✓ Users table renders on dashboard operations
✓ Virtualized rows display with fixed height
✓ Row selection works without performance degradation
✓ Sorting works without re-rendering entire list
✓ Smooth scrolling maintains performance
✓ Column freezing works (if implemented)
✓ Responsive design on mobile
```

**What It Validates**:
- Dashboard user directory performs well with large datasets
- Virtualization maintains 60fps scrolling
- Selection operations don't cause jank
- Mobile viewport handles scrolling properly

**Expected Results**:
- ✅ Dashboard navigates directly (no Entities tab first)
- ✅ Table renders and scrolls smoothly
- ✅ No performance degradation with 1000+ rows
- ✅ Selections work without lag

---

## Manual Smoke Tests

Run these tests manually in browser to verify critical paths:

### Test Scenario 1: Legacy Route Redirect (FF OFF)
```
1. Navigate to http://localhost:3000/admin/clients
2. ✓ Should land on /admin/users?tab=dashboard&role=CLIENT
3. ✓ Entities tab should be visible in navigation
4. ✓ Dashboard tab should be active
5. ✓ Users table should show only clients (if filtering applied)
6. ✓ No console errors
```

### Test Scenario 2: Legacy Route Redirect (FF ON)
```
1. Set NEXT_PUBLIC_RETIRE_ENTITIES_TAB=true
2. Restart dev server
3. Navigate to http://localhost:3000/admin/clients
4. ✓ Should redirect to /admin/users?tab=dashboard&role=CLIENT
5. ✓ Entities tab should NOT be visible
6. ✓ Dashboard tab should be active
7. ✓ Role preset "Clients" should be highlighted/active
8. ✓ No console errors
```

### Test Scenario 3: Role Filter Chips (Both States)
```
1. Navigate to /admin/users?tab=dashboard
2. ✓ Should see role filter chips: "All Users", "Clients", "Team", "Admins"
3. Click "Clients" chip
4. ✓ URL should update to include ?role=CLIENT
5. ✓ Users table should filter to show clients only
6. ✓ Click "Team" chip
7. ✓ URL should update to ?role=TEAM_MEMBER
8. ✓ Users table should filter to show team members only
9. ✓ Click "All Users" to reset filter
10. ✓ All users should be shown
```

### Test Scenario 4: Create New User (FF ON)
```
1. Navigate to /admin/users?tab=dashboard
2. Click "Add User" button
3. ✓ UnifiedUserFormModal should open
4. Select role: "Client"
5. ✓ Form should show client-specific fields (company, tier, phone)
6. Fill required fields (name, email)
7. Click "Create User"
8. ✓ Success toast should appear
9. ✓ Modal should close
10. ✓ New user should appear in table (or on refresh)
```

### Test Scenario 5: User Profile Drawer (Both States)
```
1. Navigate to /admin/users?tab=dashboard
2. Go to Operations sub-tab
3. Click on any user row
4. ✓ UserProfileDialog drawer should open on right side
5. ✓ Should show user details (Overview, Activity, Details tabs)
6. ✓ Can edit fields in drawer
7. Click outside drawer or X button
8. ✓ Drawer should close
9. ✓ Should not navigate away from page
```

### Test Scenario 6: Bulk Operations (Both States)
```
1. Navigate to /admin/users?tab=dashboard
2. Go to Operations sub-tab
3. Select 3+ users using checkboxes
4. ✓ Bulk action panel should appear
5. Select action: "Change Role"
6. Select new role: "TEAM_LEAD"
7. Click "Apply"
8. ✓ Toast should show success
9. ✓ Selected users should update to new role
```

### Test Scenario 7: API Deprecation Headers (FF Any State)
```
1. Open browser DevTools → Network tab
2. Navigate to /admin/users?tab=dashboard
3. Go to Operations sub-tab
4. Trigger a request to /api/admin/entities/clients (e.g., if component still calls it)
5. Check Response Headers:
   ✓ Should contain: Deprecation: true
   ✓ Should contain: Sunset: <date 90 days out>
   ✓ Should contain: Link: </api/admin/users?role=CLIENT>; rel="successor"
   ✓ Should contain: X-API-Warn header with message
```

---

## Accessibility Testing

### Keyboard Navigation (Both States)
```
1. Navigate to /admin/users?tab=dashboard
2. Press Tab to navigate through controls:
   ✓ Should reach all buttons, tabs, form fields
   ✓ Tab order should be logical (left-to-right, top-to-bottom)
3. Press Enter on buttons:
   ✓ Should activate button actions
4. Press Escape to close modals/drawers:
   ✓ Modal should close
   ✓ Drawer should close
5. Arrow keys in select dropdowns:
   ✓ Should navigate through options
   ✓ Should select with Enter
```

### Screen Reader Testing (Both States)
```
1. Navigate to /admin/users?tab=dashboard
2. Verify with screen reader:
   ✓ Page title announced correctly
   ✓ Tab labels announced
   ✓ Active tab indicated
   ✓ Button purposes clear
   ✓ Form labels associated with inputs
   ✓ Table headers announced
   ✓ Row labels in table
   ✓ Alert/toast announcements live regions
```

### Color Contrast & Visual (Both States)
```
1. Check all text has sufficient contrast
   ✓ Text should meet WCAG AA standards (4.5:1 for normal text)
2. Verify no information conveyed by color alone
   ✓ Status indicators have text labels too
3. Focus indicators visible
   ✓ Focused elements should have clear focus ring
```

---

## Performance Testing

### Load Time (Both States)
```
1. Open browser DevTools → Lighthouse
2. Run Lighthouse audit on /admin/users
3. Check metrics:
   ✓ First Contentful Paint < 2 seconds
   ✓ Largest Contentful Paint < 2.5 seconds
   ✓ Cumulative Layout Shift < 0.1
4. Repeat with 1000+ users in database
   ✓ Should still load in < 2 seconds (cached)
   ✓ First load with slow 3G may take 3-5 seconds
```

### Interaction Performance (Both States)
```
1. Dashboard with 1000+ users loaded
2. Click role filter chip
3. ✓ Filter should apply in < 300ms
4. Scroll through user table
5. ✓ Scrolling should be smooth (60fps)
6. Select multiple users
7. ✓ Selections should register immediately
8. Open user drawer
9. ✓ Drawer should appear in < 200ms
```

### Network Performance (Both States)
```
1. DevTools → Network tab
2. Filter requests to /api/admin/
3. Check request sizes:
   ✓ GET /api/admin/users should be < 100KB
   ✓ POST /api/admin/users should be < 50KB
4. Check response times:
   ✓ Cached responses < 50ms
   ✓ Fresh responses < 500ms
5. Verify request deduplication
   ✓ Same request shouldn't fire twice
```

---

## Browser Compatibility Testing

### Desktop Browsers
- [ ] **Chrome 120+**: All features work
- [ ] **Firefox 121+**: All features work
- [ ] **Safari 17+**: All features work
- [ ] **Edge 120+**: All features work

### Mobile Browsers
- [ ] **Chrome Mobile**: Responsive layout, touches work
- [ ] **Safari iOS**: Drawer responsive, no layout issues
- [ ] **Firefox Mobile**: All features accessible

### Test Compatibility
```bash
# Run headless tests across browsers
npm run test:e2e -- --project=chromium --project=webkit

# If on non-Netlify (has WebKit available)
```

---

## Telemetry & Monitoring Testing

### Event Tracking (FF OFF)
```
1. Tail logs/event tracking system
2. Navigate to /admin/clients
3. ✓ Event logged: users.redirect_legacy { from: '/admin/clients', to: '/admin/users' }
4. Create a new user
5. ✓ Event logged: users.create_user { role: 'CLIENT' }
```

### Event Tracking (FF ON)
```
1. Tail logs/event tracking system
2. Set FF to ON, restart dev server
3. Navigate to /admin/clients
4. ✓ Event logged: users.redirect_legacy { from: '/admin/clients', to: '/admin/users' }
5. Entities tab request via direct URL: /admin/users?tab=entities
6. ✓ Event logged: users.redirect_legacy { from: 'entities', to: 'dashboard' }
```

---

## Test Execution Report Template

```markdown
# Test Execution Report - Entities Tab Retirement

**Date**: [YYYY-MM-DD]
**Tester**: [Name]
**Environment**: [Staging/Production]
**Feature Flag State**: OFF / ON

## Test Results

### E2E Tests (Automated)
- [ ] admin-unified-redirects.spec.ts: ___/5 tests passed
- [ ] admin-entities-tab.spec.ts: ___/3 tests passed
- [ ] admin-add-user-flow.spec.ts: ___/10 tests passed
- [ ] phase3-virtual-scrolling.spec.ts: ___/6 tests passed

**Total**: ___/24 tests passed
**Status**: [✅ PASS / ⚠️ PARTIAL / ❌ FAIL]

### Manual Smoke Tests
- [ ] Legacy route redirect (FF OFF): [✅/⚠️/❌]
- [ ] Legacy route redirect (FF ON): [✅/⚠️/❌]
- [ ] Role filter chips: [✅/⚠️/❌]
- [ ] Create new user: [✅/⚠️/❌]
- [ ] User profile drawer: [✅/⚠️/❌]
- [ ] Bulk operations: [✅/⚠️/❌]
- [ ] API deprecation headers: [✅/⚠️/❌]

### Accessibility Tests
- [ ] Keyboard navigation: [✅/⚠️/❌]
- [ ] Screen reader compatible: [✅/⚠️/❌]
- [ ] Color contrast: [✅/⚠️/❌]
- [ ] Focus indicators: [✅/⚠️/❌]

### Performance Tests
- [ ] Load time < 2s: [✅/⚠️/❌]
- [ ] Scroll performance 60fps: [✅/⚠️/❌]
- [ ] Interaction latency < 300ms: [✅/⚠️/❌]

### Browser Compatibility
- [ ] Chrome: [✅/⚠️/❌]
- [ ] Firefox: [✅/⚠️/❌]
- [ ] Safari: [✅/⚠️/❌]
- [ ] Mobile: [✅/⚠️/❌]

## Issues Found

### Critical (Blocking)
- [ ] None found ✅

### Major (Should fix)
- [ ] Issue 1: [Description]
  - Steps: ...
  - Expected: ...
  - Actual: ...

### Minor (Nice to have)
- [ ] Issue 1: [Description]

## Sign-Off

- Tested by: __________________ Date: __________
- Approved by: ________________ Date: __________
- Ready for production: [YES / NO]
```

---

## Troubleshooting Common Issues

### Tests Failing with "Element not found"
```
✓ Cause: Feature flag not applied (dev server not restarted)
✓ Solution: Set env var, THEN restart dev server with npm run dev
```

### Entities Tab Still Visible (FF Should Be ON)
```
✓ Cause: Changes not hot-reloaded
✓ Solution: Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
```

### Tests Timeout on Page Load
```
✓ Cause: Dev server slow or not responding
✓ Solution: Check dev server logs, may need restart
```

### API Returning 401 Unauthorized
```
✓ Cause: Dev login token expired
✓ Solution: Tests auto-login via /api/_dev/login endpoint
✓ If issue persists: Check E2E_BASE_URL environment variable
```

### Can't Find Test Reports
```
✓ Location: ./e2e-report/index.html (after test run)
✓ View in browser: open ./e2e-report/index.html
```

---

## Next Steps After Testing

### ✅ All Tests Pass
1. Update docs with test results
2. Proceed to production deployment
3. Follow rollout plan in main doc

### ⚠️ Some Tests Fail
1. Document failures in Issues section
2. Create bug fixes
3. Re-run affected tests
4. Update this plan with findings

### ❌ Critical Failures
1. Do NOT deploy to production
2. Investigate root cause
3. File bugs and fix
4. Restart testing from beginning

---

## Quick Reference: Feature Flag States

### NEXT_PUBLIC_RETIRE_ENTITIES_TAB = false
- ✅ Entities tab visible in navigation
- ✅ Can navigate to /admin/users?tab=entities
- ✅ Legacy /admin/clients and /admin/team still show Entities tab
- ✅ Old ClientFormModal and TeamMemberFormModal still used
- 📊 All tests pass
- 🎯 This is the safe default for initial deployment

### NEXT_PUBLIC_RETIRE_ENTITIES_TAB = true
- ❌ Entities tab hidden from navigation
- ❌ /admin/users?tab=entities redirects to dashboard
- ✅ /admin/clients redirects to dashboard with role=CLIENT
- ✅ /admin/team redirects to dashboard with role=TEAM_MEMBER
- ✅ Dashboard shows new role chips, filters, unified form
- 📊 All tests pass with adaptive behavior
- 🎯 Enable gradually after successful staging (10% → 50% → 100%)

---

## Testing Complete ✅

After all tests pass in both FF states:
1. Mark as "Ready for Staging" in deployment checklist
2. Move to Production Rollout phase
3. Enable feature flag gradually with telemetry monitoring
4. Monitor deprecated API usage
5. Track user feedback

**Good luck! 🚀**
