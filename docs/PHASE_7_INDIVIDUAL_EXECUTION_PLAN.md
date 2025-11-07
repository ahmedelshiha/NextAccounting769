# Phase 7: Individual Test Execution Plan for Admin/Users

**Project:** AdminWorkBench Transformation  
**Focus:** Testing & Accessibility for admin/users only  
**Timeline:** Extended with individual step-by-step execution  
**Date Started:** January 2025  

---

## 🎯 Objective

Execute comprehensive testing for the AdminWorkBench admin/users dashboard, handling each test file individually with detailed verification and documentation.

---

## 📋 Test Suite Inventory

### Unit Tests - Admin/Users Components

#### 1. BulkActionsPanel.test.tsx
**Location:** `src/app/admin/users/components/workbench/__tests__/`  
**Test Count:** 23 tests  
**Status:** ✅ PASSING (Verified in initial run)  
**Execution Time:** ~7.6 seconds  
**Key Tests:**
- Rendering with user count
- Action type/value selectors
- User interactions (preview, apply, clear)
- Modal integration
- Error handling
- Accessibility

**Execution Command:**
```bash
npm run test -- "src/app/admin/users/components/workbench/__tests__/BulkActionsPanel.test.tsx"
```

**Pass Criteria:** All 23 tests should pass

---

#### 2. AdminUsersLayout.test.tsx
**Location:** `src/app/admin/users/components/workbench/__tests__/`  
**Test Count:** ~30+ tests  
**Status:** ✅ Ready (needs execution verification)  
**Key Test Areas:**
- Component rendering (header, main, sidebar)
- State management (user selection)
- Responsive behavior
- Integration with child components

**Execution Command:**
```bash
npm run test -- "src/app/admin/users/components/workbench/__tests__/AdminUsersLayout.test.tsx"
```

**Pass Criteria:** >95% tests passing

---

#### 3. OverviewCards.test.tsx
**Location:** `src/app/admin/users/components/workbench/__tests__/`  
**Test Count:** 12 tests  
**Status:** ✅ Fixed (import paths corrected)  
**Recent Changes:**
- Fixed mock import path: `../../contexts/` → `../../../contexts/`
- Fixed OperationsOverviewCards mock path
- All tests ready for execution

**Execution Command:**
```bash
npm run test -- "src/app/admin/users/components/workbench/__tests__/OverviewCards.test.tsx"
```

**Pass Criteria:** All 12 tests should pass

---

#### 4. BuilderSlots.test.tsx
**Location:** `src/app/admin/users/components/workbench/__tests__/`  
**Test Count:** ~30+ tests  
**Status:** ✅ Ready (needs execution verification)  
**Key Test Areas:**
- Builder.io slot components (header, metrics, sidebar, footer)
- Fallback behavior when Builder disabled
- Content rendering
- Error handling
- Accessibility

**Execution Command:**
```bash
npm run test -- "src/app/admin/users/components/workbench/__tests__/BuilderSlots.test.tsx"
```

**Pass Criteria:** >95% tests passing

---

#### 5. ExecutiveDashboardTabWrapper.test.tsx
**Location:** `src/app/admin/users/components/__tests__/`  
**Test Count:** ~10+ tests  
**Status:** ✅ Ready (needs execution verification)  
**Key Test Areas:**
- Feature flag routing
- Old vs new UI switching
- User role handling

**Execution Command:**
```bash
npm run test -- "src/app/admin/users/components/__tests__/ExecutiveDashboardTabWrapper.test.tsx"
```

**Pass Criteria:** All tests should pass

---

### E2E Tests

#### AdminWorkBench Flows
**Location:** `e2e/admin-workbench-flows.spec.ts`  
**Test Count:** ~30+ scenarios  
**Status:** ✅ Ready for execution  

**Execution Command:**
```bash
npm run test:e2e -- e2e/admin-workbench-flows.spec.ts
```

**Pass Criteria:** All scenarios should pass

---

## 🔧 Individual Test Execution Steps

### STEP 1: BulkActionsPanel Tests
**Time Estimate:** 5-10 minutes  
**Priority:** High (Already passing)

```bash
npm run test -- "src/app/admin/users/components/workbench/__tests__/BulkActionsPanel.test.tsx"
```

**Expected Output:**
```
✓ src/app/admin/users/components/workbench/__tests__/BulkActionsPanel.test.tsx (23 tests)
```

**Success Criteria:**
- [ ] 23/23 tests passing
- [ ] Execution time < 10 seconds
- [ ] No console warnings
- [ ] No deprecation notices

**If Fails:**
1. Review error message
2. Check if code changes affected component
3. Update test if needed
4. Re-run and verify

---

### STEP 2: OverviewCards Tests
**Time Estimate:** 5-10 minutes  
**Priority:** High (Recently fixed)

```bash
npm run test -- "src/app/admin/users/components/workbench/__tests__/OverviewCards.test.tsx"
```

**Expected Output:**
```
✓ src/app/admin/users/components/workbench/__tests__/OverviewCards.test.tsx (12 tests)
```

**Success Criteria:**
- [ ] 12/12 tests passing
- [ ] No "useUsersContext must be used within" errors
- [ ] All mocks working correctly
- [ ] Execution time < 10 seconds

**If Fails:**
1. Check mock imports are correct
2. Verify UsersContextProvider is mocked
3. Review console output for specific error
4. Update mock if needed
5. Re-run and verify

---

### STEP 3: AdminUsersLayout Tests
**Time Estimate:** 10-15 minutes  
**Priority:** High

```bash
npm run test -- "src/app/admin/users/components/workbench/__tests__/AdminUsersLayout.test.tsx"
```

**Expected Output:**
```
✓ src/app/admin/users/components/workbench/__tests__/AdminUsersLayout.test.tsx (30+ tests)
```

**Success Criteria:**
- [ ] >95% tests passing (at least 28/30)
- [ ] No rendering errors
- [ ] State management working
- [ ] Context provider properly mocked
- [ ] Execution time < 15 seconds

**If Fails:**
1. Identify specific test failure
2. Check if component code changed
3. Review mock configuration
4. Update test or component
5. Re-run affected test
6. Document any issues found

---

### STEP 4: BuilderSlots Tests
**Time Estimate:** 10-15 minutes  
**Priority:** Medium

```bash
npm run test -- "src/app/admin/users/components/workbench/__tests__/BuilderSlots.test.tsx"
```

**Expected Output:**
```
✓ src/app/admin/users/components/workbench/__tests__/BuilderSlots.test.tsx (30+ tests)
```

**Success Criteria:**
- [ ] >95% tests passing
- [ ] Fallback components rendering correctly
- [ ] Builder.io integration mocks working
- [ ] Error handling working
- [ ] Execution time < 20 seconds

**If Fails:**
1. Check useBuilderContent mock
2. Verify component import paths
3. Review Builder.io slot rendering logic
4. Update test or component
5. Re-run and verify

---

### STEP 5: ExecutiveDashboardTabWrapper Tests
**Time Estimate:** 5-10 minutes  
**Priority:** Medium

```bash
npm run test -- "src/app/admin/users/components/__tests__/ExecutiveDashboardTabWrapper.test.tsx"
```

**Expected Output:**
```
✓ src/app/admin/users/components/__tests__/ExecutiveDashboardTabWrapper.test.tsx (10+ tests)
```

**Success Criteria:**
- [ ] All tests passing
- [ ] Feature flag routing working
- [ ] Old/new UI switching verified
- [ ] Execution time < 10 seconds

**If Fails:**
1. Check feature flag mock
2. Verify component rendering logic
3. Review environment variable setup
4. Update test if needed
5. Re-run and verify

---

### STEP 6: Full Unit Test Suite
**Time Estimate:** 5-15 minutes  
**Priority:** High (Summary execution)

```bash
npm run test -- "src/app/admin/users" --reporter=verbose
```

**Expected Output:**
```
✓ All admin/users tests passing
Summary: 95+/100 tests passed
```

**Success Criteria:**
- [ ] >95% of all tests passing
- [ ] No console errors
- [ ] Total execution time < 30 seconds
- [ ] Code coverage > 80%

**Coverage Report:**
```bash
npm run test -- "src/app/admin/users" --coverage
```

---

### STEP 7: E2E Tests
**Time Estimate:** 20-30 minutes  
**Priority:** High

```bash
npm run test:e2e -- e2e/admin-workbench-flows.spec.ts
```

**Expected Output:**
```
✓ AdminWorkBench Dashboard - E2E Tests (30+ tests)
All tests passed
```

**Success Criteria:**
- [ ] All 30+ scenarios passing
- [ ] No flaky tests
- [ ] Screenshots generated
- [ ] All breakpoints tested
- [ ] Total execution time < 5 minutes

**If Fails:**
1. Check which scenario failed
2. Review Playwright logs
3. Verify application state
4. Check for missing data-testid attributes
5. Update test or component
6. Re-run specific failing test

---

## ♿ Accessibility Audit Steps

### STEP 8: Manual Accessibility Testing

**Time Estimate:** 30-45 minutes  

#### 8.1: Keyboard Navigation Testing
- [ ] Tab through all interactive elements
- [ ] Verify logical tab order
- [ ] Test Escape key to close modals
- [ ] Test Enter/Space to activate buttons
- [ ] Check for keyboard traps

**Elements to Test:**
1. QuickActionsBar buttons
2. Sidebar toggle
3. Filter checkboxes
4. Clear filters button
5. User table rows
6. Bulk action dropdowns
7. Preview modal
8. Undo toast button

#### 8.2: Screen Reader Testing

**Choose one:**
- NVDA (Windows) - Free
- JAWS (Windows) - Licensed
- VoiceOver (macOS) - Built-in

**Test Sequence:**
1. [ ] Open app at `/admin/users`
2. [ ] Enable screen reader
3. [ ] Navigate page structure
4. [ ] Verify all labels present
5. [ ] Check announcements
6. [ ] Test form inputs
7. [ ] Test interactive components

#### 8.3: Color Contrast Testing

**Tools:**
- Chrome DevTools (Inspect element > Accessibility)
- WebAIM Contrast Checker
- Lighthouse (DevTools > Lighthouse)

**Check:**
- [ ] All text >= 4.5:1
- [ ] UI components >= 3:1
- [ ] Dark mode contrast
- [ ] Focus indicators visible

#### 8.4: Automated A11y Scan

```bash
# Install axe DevTools extension in Chrome
# Open /admin/users
# Run axe scan from extension
# Document any violations
```

**Expected Results:**
- [ ] 0 critical violations
- [ ] 0 serious violations
- [ ] Fixes for any moderate/minor

---

## 📊 Performance Audit Steps

### STEP 9: Lighthouse Audit

**Time Estimate:** 15-20 minutes

#### 9.1: Desktop Audit
```bash
npm run lighthouse -- https://localhost:3000/admin/users --chrome-flags="--no-sandbox"
```

**Expected Targets:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

#### 9.2: Mobile Audit
```bash
npm run lighthouse -- https://localhost:3000/admin/users --chrome-flags="--no-sandbox" --preset=mobile
```

**Expected Targets:**
- Performance: > 80
- Accessibility: > 90

#### 9.3: Core Web Vitals
Check:
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

---

## 📝 Documentation & Reporting

### STEP 10: Create Test Report

**Create file:** `docs/PHASE_7_TEST_RESULTS.md`

**Contents:**
```markdown
# Phase 7 Test Results

## Unit Tests Summary
- BulkActionsPanel: X/23 passed
- AdminUsersLayout: X/30+ passed
- OverviewCards: X/12 passed
- BuilderSlots: X/30+ passed
- ExecutiveDashboardTabWrapper: X/10+ passed
- **Total: X/105+ (X%)**

## E2E Tests Summary
- admin-workbench-flows: X/30+ passed
- **Total: X/30+ (X%)**

## Coverage Report
- Line Coverage: X%
- Branch Coverage: X%
- Function Coverage: X%

## Accessibility Results
- Critical Violations: X
- Serious Violations: X
- Moderate Violations: X
- WCAG 2.1 AA: [PASS/FAIL]

## Performance Results
- Lighthouse (Desktop): X/100
- Lighthouse (Mobile): X/100
- LCP: Xs
- FID: Xms
- CLS: X

## Summary
[Overall status and recommendations]
```

---

## ✅ Completion Checklist

### Unit Tests Phase
- [ ] BulkActionsPanel tests executed and passing
- [ ] OverviewCards tests executed and passing
- [ ] AdminUsersLayout tests executed and passing
- [ ] BuilderSlots tests executed and passing
- [ ] ExecutiveDashboardTabWrapper tests executed and passing
- [ ] Full suite coverage > 80%
- [ ] No console errors or warnings

### E2E Tests Phase
- [ ] AdminWorkBench flows executed
- [ ] All 30+ scenarios passing
- [ ] Responsive design verified
- [ ] User interactions working
- [ ] No visual regressions

### Accessibility Phase
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Color contrast verified
- [ ] 0 critical violations
- [ ] 0 serious violations
- [ ] WCAG 2.1 AA compliant

### Performance Phase
- [ ] Lighthouse desktop > 90
- [ ] Lighthouse mobile > 80
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### Documentation Phase
- [ ] Test results documented
- [ ] Issues identified and logged
- [ ] Recommendations provided
- [ ] Phase 7 sign-off ready

---

## 🚀 Next Steps After Phase 7

1. **Fix any failing tests** - Address issues found during execution
2. **Remediate A11y violations** - Fix WCAG issues found
3. **Optimize performance** - Improve LCP/FCP metrics
4. **Phase 8 - Monitoring** - Setup Sentry and feature flags
5. **Deployment** - Execute staged rollout

---

**Timeline:** Extended for thorough individual testing  
**Focus:** Admin/users dashboard only  
**Approach:** Step-by-step verification and documentation  
**Next Review:** After Step 7 completion
