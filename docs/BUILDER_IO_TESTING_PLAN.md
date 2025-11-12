# Builder.io Integration Testing & Verification Plan

**Phase:** 6.3 - Testing & Documentation  
**Objective:** Verify Builder.io integration works correctly and document the complete workflow  
**Estimated Time:** 2-3 hours  
**Prerequisites:** Phase 6.1-6.2 complete, models created in Builder.io

---

## 🧪 Testing Checklist

### Pre-Flight Checks (15 min)

- [ ] Environment variables set correctly
  ```bash
  echo $NEXT_PUBLIC_BUILDER_API_KEY
  echo $NEXT_PUBLIC_BUILDER_SPACE
  ```

- [ ] Dev server running
  ```bash
  npm run dev  # Should start without errors
  ```

- [ ] Builder.io models created
  - [ ] admin-workbench-header
  - [ ] admin-workbench-metrics
  - [ ] admin-workbench-sidebar
  - [ ] admin-workbench-footer

- [ ] Models have entries named `main` and published
  - [ ] Test API endpoint manually:
  ```bash
  curl "https://cdn.builder.io/api/v3/content/admin-workbench-header?apiKey=YOUR_KEY&space=YOUR_SPACE"
  ```

---

## ✅ Functional Testing (45 min)

### Test Suite 1: Content Loading

**Test 1.1: Header Content Loads**
```
Steps:
1. Navigate to http://localhost:3000/admin/users
2. Open DevTools → Network tab
3. Filter by "admin-workbench" or "api"
4. Look for GET request to /api/builder-io/content?model=admin-workbench-header
5. Verify response status is 200
6. Verify response contains expected content

Expected Result:
- Request succeeds (200 status)
- Response has content from Builder.io
- Header renders without errors
- No console errors
```

**Test 1.2: Metrics Content Loads**
```
Steps:
1. On /admin/users page, observe metrics section
2. In DevTools Network, find request for admin-workbench-metrics
3. Check response status and content

Expected Result:
- Metrics content loads
- KPI cards display correctly
- Values align properly
- Cards are responsive
```

**Test 1.3: Sidebar Content Loads**
```
Steps:
1. On /admin/users page, observe sidebar (desktop view)
2. In DevTools Network, find request for admin-workbench-sidebar
3. Check sidebar renders with Builder.io content

Expected Result:
- Sidebar displays with Builder content
- Filters appear correctly
- Widgets render properly
- No layout shifts
```

**Test 1.4: Footer Content Loads**
```
Steps:
1. Select some users (checkboxes)
2. Observe footer sticky panel appears
3. In DevTools Network, find request for admin-workbench-footer
4. Verify bulk actions panel displays

Expected Result:
- Footer loads Builder.io content
- Bulk action controls appear
- Action buttons are functional
```

---

### Test Suite 2: Content Updates

**Test 2.1: Publish Changes in Builder.io**
```
Steps:
1. In Builder.io dashboard, edit admin-workbench-header
2. Make visible change (add text, change color, etc.)
3. Click "Publish"
4. In app, wait max 5 minutes for cache to expire
5. Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)
6. Observe changes appear

Expected Result:
- Changes visible within 5 minutes
- No code deployment needed
- Cache properly expires
- Fallback works if Builder.io unavailable
```

**Test 2.2: Multiple Model Updates**
```
Steps:
1. Update header, metrics, sidebar, footer simultaneously
2. Publish all changes
3. Refresh dashboard
4. Verify all changes appear together

Expected Result:
- All sections update correctly
- No conflicts between updates
- Layout remains stable
```

---

### Test Suite 3: Fallback Behavior

**Test 3.1: Disable Builder.io (Remove API Key)**
```
Steps:
1. Comment out or remove NEXT_PUBLIC_BUILDER_API_KEY
2. Restart dev server
3. Navigate to /admin/users
4. Observe page rendering

Expected Result:
- Default components render (QuickActionsBar, OverviewCards, etc.)
- No console errors
- Page fully functional without Builder.io
- Performance not affected
```

**Test 3.2: Disable Builder.io (Remove Space ID)**
```
Steps:
1. Comment out or remove NEXT_PUBLIC_BUILDER_SPACE
2. Restart dev server
3. Navigate to /admin/users

Expected Result:
- Fallback to default components
- No errors in console
- Page works normally
```

**Test 3.3: Builder.io Unavailable (Network Error Simulation)**
```
Steps:
1. Open DevTools → Network tab
2. Throttle network to "Offline"
3. With Builder.io enabled, navigate to /admin/users
4. Restore network

Expected Result:
- Default components render while offline
- No error toast appears (graceful fallback)
- Page remains usable
- After network restored, can reload and get Builder.io content
```

---

### Test Suite 4: API Endpoint Verification

**Test 4.1: API Endpoint Response Format**
```
Steps:
1. Call API directly:
   curl "http://localhost:3000/api/builder-io/content?model=admin-workbench-header&space=YOUR_SPACE"
2. Check response

Expected Result:
- HTTP 200 status
- Valid JSON response
- Content-Type: application/json
- Cache-Control headers present
```

**Test 4.2: Missing Parameters Handling**
```
Steps:
1. Call API without model parameter:
   curl "http://localhost:3000/api/builder-io/content?space=YOUR_SPACE"
2. Call API without space parameter:
   curl "http://localhost:3000/api/builder-io/content?model=admin-workbench-header"

Expected Result:
- HTTP 400 (Bad Request) for missing params
- Error message: "Missing required parameters"
- Graceful error response
```

**Test 4.3: Invalid Model Name**
```
Steps:
1. Call API with non-existent model:
   curl "http://localhost:3000/api/builder-io/content?model=invalid-model&space=YOUR_SPACE"

Expected Result:
- HTTP response (likely 200 with empty content or 404)
- App handles gracefully
- Falls back to default component
- No error thrown
```

---

### Test Suite 5: Performance Testing

**Test 5.1: Content Loading Time**
```
Steps:
1. Open DevTools → Network tab
2. Navigate to /admin/users
3. Measure time for builder-io content requests
4. Repeat 3 times, measure average

Expected Result:
- Header content loads < 500ms
- Metrics content loads < 500ms
- Sidebar content loads < 500ms
- Footer content loads < 500ms
- Total page load time < 2.5s (LCP)
```

**Test 5.2: Cache Effectiveness**
```
Steps:
1. Navigate to /admin/users (first load)
2. Note Network tab response time
3. Wait 1 minute
4. Refresh page (Cmd+R or Ctrl+R, NOT hard refresh)
5. Note response time for builder-io requests
6. Compare times

Expected Result:
- Second load is faster (uses cache)
- Cache-Control headers set correctly
- 5-minute cache working as expected
- Fallback load time acceptable
```

**Test 5.3: Lighthouse Performance**
```
Steps:
1. Open DevTools → Lighthouse tab
2. Run audit for mobile and desktop
3. Note LCP, FCP, TTI metrics
4. Check Builder.io content fetch timing

Expected Result:
- Mobile score > 80
- Desktop score > 90
- LCP < 2.5s
- First Contentful Paint < 1.5s
- No performance regression vs without Builder.io
```

---

### Test Suite 6: Responsive Design

**Test 6.1: Desktop View (1920px)**
```
Steps:
1. Set browser to 1920x1080
2. Navigate to /admin/users
3. Load Builder.io content
4. Observe layout and styling

Expected Result:
- 3-column layout (sidebar, content, spacer)
- Header spans full width
- Footer spans full width
- Content properly aligned
- No overflow or clipping
```

**Test 6.2: Tablet View (768-1399px)**
```
Steps:
1. Set browser to 1024x768
2. Navigate to /admin/users
3. Observe sidebar handling

Expected Result:
- Sidebar hidden by default
- Toggle button appears
- Clicking toggle shows sidebar drawer
- Main content expands to fill space
- Header and footer remain visible
```

**Test 6.3: Mobile View (<768px)**
```
Steps:
1. Set browser to 375x667
2. Navigate to /admin/users
3. Test sidebar toggle

Expected Result:
- Sidebar hidden
- Small toggle button visible
- Full-width content
- Sidebar appears as modal drawer
- Touch-friendly spacing
- No horizontal scroll
```

---

### Test Suite 7: Dark Mode

**Test 7.1: Dark Mode Rendering**
```
Steps:
1. Open DevTools → Rendering
2. Emulate CSS media feature: prefers-color-scheme = dark
3. Navigate to /admin/users
4. Load Builder.io content
5. Observe color scheme

Expected Result:
- Background is dark
- Text is light
- Cards have dark backgrounds
- Contrast is proper (4.5:1)
- All Builder content respects dark mode
```

**Test 7.2: Dark Mode Toggle**
```
Steps:
1. If app has dark mode toggle, click it
2. Observe Builder.io content updates
3. Toggle back to light mode

Expected Result:
- Colors update appropriately
- No layout shifts
- Content remains readable
- Both modes work smoothly
```

---

### Test Suite 8: Accessibility

**Test 8.1: Keyboard Navigation**
```
Steps:
1. Press Tab repeatedly
2. Navigate through entire page
3. Verify focus indicators visible
4. Verify all interactive elements reachable

Expected Result:
- All elements focusable with Tab
- Focus indicators visible
- Logical tab order
- No keyboard traps
```

**Test 8.2: Screen Reader Testing**
```
Steps:
1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate to /admin/users
3. Read through page content

Expected Result:
- All content properly announced
- Headers identified correctly
- Button labels announced
- No missing alt text
- Interactive elements announced
```

**Test 8.3: Color Contrast**
```
Steps:
1. Use WebAIM or similar tool
2. Check text contrast ratios
3. Verify backgrounds and text

Expected Result:
- Normal text: 4.5:1 ratio
- Large text: 3:1 ratio
- All Builder.io content meets WCAG AA
```

---

### Test Suite 9: Error Handling

**Test 9.1: Invalid Content Structure**
```
Steps:
1. Manually create invalid JSON in Builder.io
2. Publish changes
3. Refresh page

Expected Result:
- Fallback to default component
- Error logged in console
- Page remains functional
- User not blocked
```

**Test 9.2: API Timeout**
```
Steps:
1. In DevTools Network, slow 3G throttle
2. Navigate to /admin/users
3. Page should load despite slow API

Expected Result:
- Default component renders while waiting
- Eventually loads Builder.io content
- No timeout errors to user
- Page usable during wait
```

**Test 9.3: Authentication Failure**
```
Steps:
1. Set wrong API key
2. Navigate to /admin/users

Expected Result:
- Fallback renders gracefully
- API error logged
- No auth error shown to user
- Page functional
```

---

## 📊 Test Report Template

```markdown
# Builder.io Integration Test Report
Date: [DATE]
Tester: [NAME]
Environment: [dev/staging/production]

## Test Execution Summary
- Total Tests: 50+
- Passed: __
- Failed: __
- Blocked: __
- Coverage: ___%

## Results by Test Suite

### Suite 1: Content Loading
- Test 1.1: [PASS/FAIL/BLOCK]
- Test 1.2: [PASS/FAIL/BLOCK]
- Test 1.3: [PASS/FAIL/BLOCK]
- Test 1.4: [PASS/FAIL/BLOCK]

### Suite 2: Content Updates
- Test 2.1: [PASS/FAIL/BLOCK]
- Test 2.2: [PASS/FAIL/BLOCK]

### Suite 3: Fallback Behavior
- Test 3.1: [PASS/FAIL/BLOCK]
- Test 3.2: [PASS/FAIL/BLOCK]
- Test 3.3: [PASS/FAIL/BLOCK]

[... other suites ...]

## Issues Found
1. Issue #1: [Description] - Severity: [Critical/High/Medium/Low]
2. Issue #2: [Description] - Severity: [Critical/High/Medium/Low]

## Performance Metrics
- Header load: ___ ms
- Metrics load: ___ ms
- Sidebar load: ___ ms
- Footer load: ___ ms
- Lighthouse Score: ___/100

## Sign-Off
- [ ] All critical tests passed
- [ ] All high-priority issues resolved
- [ ] Performance acceptable
- [ ] Accessibility compliant
- [ ] Ready for Phase 7 (Testing & Audits)

Signed: ________________ Date: ________
```

---

## 🚀 Integration Testing (Automated)

### E2E Test: Builder.io Content Loading

```typescript
// src/app/admin/users/__tests__/builder-io-integration.spec.ts
import { test, expect } from '@playwright/test'

test('Builder.io content loads and renders correctly', async ({ page }) => {
  await page.goto('/admin/users')

  // Wait for Builder.io content to load
  await page.waitForResponse(response =>
    response.url().includes('api/builder-io/content')
  )

  // Verify header renders
  const header = page.locator('[data-builder-model="admin-workbench-header"]')
  await expect(header).toBeVisible()

  // Verify metrics render
  const metrics = page.locator('[data-builder-model="admin-workbench-metrics"]')
  await expect(metrics).toBeVisible()

  // Verify sidebar renders
  const sidebar = page.locator('[data-builder-model="admin-workbench-sidebar"]')
  await expect(sidebar).toBeVisible()
})

test('Fallback renders when Builder.io unavailable', async ({ page, context }) => {
  // Intercept Builder.io requests and fail them
  await context.route('**/api/builder-io/**', route => {
    route.abort('failed')
  })

  await page.goto('/admin/users')

  // Default QuickActionsBar should render
  const quickActions = page.locator('[class*="QuickActionsBar"]')
  await expect(quickActions).toBeVisible()
})

test('Content updates after publish', async ({ page }) => {
  // First load
  await page.goto('/admin/users')
  const header1 = await page.textContent('[data-builder-model="admin-workbench-header"]')

  // Simulate Builder.io publish (change content)
  // In real scenario, manually publish in Builder.io

  // Wait for cache to expire and reload
  await page.waitForTimeout(60 * 1000) // 1 minute
  await page.reload()

  const header2 = await page.textContent('[data-builder-model="admin-workbench-header"]')
  // Compare header1 and header2 if they should differ
})
```

---

## ✅ Success Criteria

All of the following must be true:

- ✅ All content loads from Builder.io within 500ms
- ✅ Fallback renders when Builder.io unavailable
- ✅ Performance meets LCP < 2.5s requirement
- ✅ Dark mode supported
- ✅ Responsive on all breakpoints
- ✅ Accessibility: WCAG 2.1 AA compliant
- ✅ No console errors
- ✅ Cache working (5-minute default)
- ✅ API errors handled gracefully
- ✅ Mobile views work smoothly

---

## 📚 Documentation Deliverables

Phase 6.3 includes:

1. ✅ [BUILDER_IO_INTEGRATION_GUIDE.md](./BUILDER_IO_INTEGRATION_GUIDE.md) - Setup & architecture
2. ✅ [BUILDER_IO_SETUP_MODELS.md](./BUILDER_IO_SETUP_MODELS.md) - Model creation steps
3. ✅ [BUILDER_IO_TESTING_PLAN.md](./BUILDER_IO_TESTING_PLAN.md) - This file
4. 📝 Implementation checklist (below)

---

## ✅ Phase 6 Completion Checklist

### Infrastructure (Phase 6.1)
- [x] Configuration file created
- [x] Hook for content fetching created
- [x] API endpoint implemented
- [x] Slot wrapper components created

### Editable Slots (Phase 6.2)
- [x] Builder slot components integrated into AdminUsersLayout
- [x] Fallback behavior implemented
- [x] All 4 slots (header, metrics, sidebar, footer) wired up
- [x] Model configuration guide created

### Testing & Documentation (Phase 6.3)
- [x] Testing plan created
- [x] Integration guide written
- [x] Model setup guide written
- [x] E2E test examples provided
- [ ] Manual testing performed (requires Builder.io setup)
- [ ] Test report filled out
- [ ] Issues resolved

---

## 🎯 Next Phase

After completing Phase 6 testing:
- Move to **Phase 7: Testing & Accessibility**
- Run unit tests for all components
- Run E2E tests for key workflows
- Perform accessibility audit
- Complete performance audit

---

**Next Steps:**
1. Set up Builder.io models per BUILDER_IO_SETUP_MODELS.md
2. Run through all test suites in this plan
3. Document any issues found
4. Fix critical issues before Phase 7
5. Proceed to Phase 7: Unit Tests & E2E Tests

