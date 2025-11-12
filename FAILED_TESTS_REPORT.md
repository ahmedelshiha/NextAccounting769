# FAILED TESTS REPORT

Generated: 2025-11-08

This file lists test files that failed during recent test runs (use this as a checklist to fix them one-by-one).

## How to run an individual test file
- Run a single file with vitest via package scripts:
  - pnpm test -- <path/to/test/file> -r dot
  - Example: pnpm test -- tests/integration/tenant-mismatch.portal.security.test.ts -r dot

--

## Summary of failed test files (observed)

1. tests/admin-user-management-settings.api.test.ts
   - Status: 16/20 tests failed (many endpoints returning 401 instead of expected 200)
   - Likely cause: missing auth/tenant setup or required environment (e.g., DB, tenant creation, session mocks)

2. tests/integration/tenant-mismatch.portal.security.test.ts
   - Status: 6/6 tests failed
   - Observed error: "API wrapper error" / unexpected HTTP codes (500 or 401 vs expected 404/403)
   - Likely cause: tenant context or prisma mocks not configured correctly in test environment

3. tests/integration/prisma-tenant-guard.test.ts
   - Status: 1 failed (others passed)
   - Failure: "throws when tenant context is missing" did not throw as expected
   - Likely cause: prisma tenant guard behaviour or test harness mismatch

4. tests/admin-services.route.test.ts
   - Status: multiple failed (6 failed)
   - Symptoms: API routes returned 401 instead of 200; Redis cache missing (fallback message observed)
   - Likely cause: missing auth/env (Redis cache module) or DB connectivity in tests

5. src/__tests__/builder-io-integration.test.ts
   - Status: 6 failed
   - Symptoms: Builder.io model definitions/inputs undefined
   - Likely cause: builder-io config/environment not available in test env or required mocks missing

6. src/lib/menu/__tests__/menuMapping.test.ts
   - Status: 2 failed
   - Symptoms: menu mapping ordering/content mismatches
   - Likely cause: test assumptions vs current menu config

7. src/lib/menu/__tests__/defaultMenu.test.ts
   - Status: 1 failed
   - Symptoms: missing expected menu sections

8. src/components/admin/layout/__tests__/menuCustomizationIntegration.test.ts
   - Status: 2 failed
   - Symptoms: navigation transformations not matching expected result

9. tests/booking-settings.api.test.ts
   - Status: 5 failed
   - Symptoms: API endpoints returned 401 where 200 expected
   - Likely cause: auth/tenant/environment setup

10. src/app/admin/settings/localization/__tests__/AnalyticsTab.test.tsx
    - Status: failed (multiple assertions)
    - Symptoms: `document is not defined` / missing DOM (jsdom) or navigator
    - Likely cause: test environment not configured for DOM or missing mocks

11. src/app/admin/settings/localization/__tests__/OrganizationTab.test.tsx
    - Status: failed (multiple)
    - Symptoms: `document is not defined`

12. src/app/admin/settings/localization/__tests__/DiscoveryTab.test.tsx
    - Status: failed (multiple)
    - Symptoms: `document is not defined`

13. tests/e2e/admin-bookings.stats-consistency.smoke.test.ts
    - Status: failed
    - Symptoms: "bookingsMod.POST is not a function" - mocking issue

14. src/components/admin/layout/__tests__/menuCustomizationIntegration.test.ts
    - Status: 2 failed (navigation related)

15. Additional cross-cutting failures observed:
    - Many tests produce: `document is not defined` or `Cannot read properties of undefined (reading 'navigator')` — indicates jsdom/test-environment issues for some UI tests.
    - Redis cache module missing: message "RedisCache unavailable, falling back to in-memory cache: Cannot find module './cache/redis'" — tests expect Redis or a mock.
    - Some API tests return 401 instead of 200: likely missing mock authentication/session or tenant creation.

--

## Recommended triage and fixes (step-by-step)
1. Fix environment & secrets for tests
   - Ensure required env vars are present when running tests locally or in CI:
     - NETLIFY_DATABASE_URL (or equivalent DB connection)
     - NEXTAUTH_URL, NEXTAUTH_SECRET
     - Any feature flags that gate APIs (set appropriate values for CI)
     - Redis mocked or provide a Redis URL (or add a simple mock module under src/lib/cache/redis)

2. Run failing tests one-by-one and inspect stack traces
   - Example: pnpm test -- tests/integration/tenant-mismatch.portal.security.test.ts -r dot

3. For tenant/auth related API failures
   - Verify test setup creates tenant and session, or mock requireTenantContext/getSession helpers
   - Check api-wrapper/tenant utils for test-time overrides

4. For `document is not defined` failures
   - Ensure vitest is using jsdom for UI tests, or mark tests as `@vitest-environment jsdom`
   - Add simple mocks for `navigator` if code reads it directly in module scope

5. For builder-io related failures
   - Ensure builder config is available in test env or add a mock for builder-io config provider

6. For Redis errors
   - Add a lightweight mock module at src/lib/cache/redis.js that exports required interfaces used by cache.service, or set env to disable Redis usage in tests.

7. For mocking HTTP/DB interactions
   - Use the existing test helpers in the repo (look under tests/ or test-utils) to seed DB or mock prisma responses.

--

## Quick checklist (mark as you fix)
- [ ] tests/admin-user-management-settings.api.test.ts
- [ ] tests/integration/tenant-mismatch.portal.security.test.ts
- [ ] tests/integration/prisma-tenant-guard.test.ts
- [ ] tests/admin-services.route.test.ts
- [ ] src/__tests__/builder-io-integration.test.ts
- [ ] src/lib/menu/__tests__/menuMapping.test.ts
- [ ] src/lib/menu/__tests__/defaultMenu.test.ts
- [ ] src/components/admin/layout/__tests__/menuCustomizationIntegration.test.ts
- [ ] tests/booking-settings.api.test.ts
- [ ] src/app/admin/settings/localization/__tests__/AnalyticsTab.test.tsx
- [ ] src/app/admin/settings/localization/__tests__/OrganizationTab.test.tsx
- [ ] src/app/admin/settings/localization/__tests__/DiscoveryTab.test.tsx
- [ ] tests/e2e/admin-bookings.stats-consistency.smoke.test.ts

--

If you want, I can:
- Run each failing test individually and append detailed stack traces here (takes time) — confirm and I will run them one-by-one.
- Create minimal mocks for Redis and tenant/session helpers to reduce noise and re-run tests to get a smaller failing list.


## How to generate a complete failing-tests list locally (recommended)
1. Run vitest and output JSON: pnpm test -- --reporter json > vitest-report.json
2. Parse failures with the following Node script (save as scripts/parse-vitest-report.js):

```js
const fs = require('fs')
const r = JSON.parse(fs.readFileSync('vitest-report.json', 'utf8'))
const failed = []
for (const file of r.files || []) {
  for (const test of file.tests || []) {
    if (test.status === 'fail') {
      failed.push({ file: file.file, title: test.title, location: test.location })
    }
  }
}
fs.writeFileSync('FAILED_TESTS_DETAILED.json', JSON.stringify(failed, null, 2))
console.log('Wrote FAILED_TESTS_DETAILED.json with', failed.length, 'entries')
```

3. Open FAILED_TESTS_DETAILED.json to see every failed test with file and title.

This is the most reliable way to get an exhaustive list; I recommend running it in your CI or locally where DB/env are configured.

--

I updated this report with all failing test files that I observed during the runs I could execute (above). If you want, I can run vitest here again for a long-duration run and append the JSON results to the repo — but it may time out without proper env.

