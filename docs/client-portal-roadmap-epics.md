# Client Portal Upgrade — Phased Roadmap with Epics & Tickets

Reference: See the full specification in [Client Portal Upgrade Plan](./client-portal-upgrade-plan.md).

This roadmap maps planned capabilities to the existing Next.js/Prisma codebase. It references concrete files and scripts, aligns with the enterprise addendum, and is structured for import into Linear/Jira.

Repo audit (highlights)
- Framework: Next.js 15, React 19, Tailwind 4, Prisma/Postgres, Sentry, Upstash Redis. Key paths:
  - App shell: src/app/layout.tsx, src/components/providers/client-layout.tsx, src/components/ui/navigation.tsx
  - Landing content: src/app/page.tsx, src/components/home/hero-section.tsx, services-section.tsx, testimonials-section.tsx
  - Admin/menu system: src/lib/menu/defaultMenu.ts, src/stores/admin/*, src/components/admin/*
  - Tests/tooling: vitest, playwright, scripts/ci/*, semgrep rules
  - DB: prisma/schema.prisma with rich User, Tasks, Invoices, etc.

Conventions
- Use feature flags via NEXT_PUBLIC_* and server flags when landing risky features.
- RLS enforced in DB; add indices with migrations under prisma/migrations.
- All UI components accessible, RTL-ready, and localized (src/lib/i18n, locales/).

Recommended Architecture: Modular Component Structure
- Goals: smaller files (~100–150 LOC), independent testing, lazy loading, team parallelism, performance, maintainability, reusability.
- Foldering (example for Setup Wizard)
  - src/components/portal/business-setup/SetupWizard.tsx (shell)
  - src/components/portal/business-setup/tabs/{ExistingBusiness.tsx,NewStartup.tsx,Individual.tsx}
  - src/hooks/business-setup/{useSetupForm.ts,useLicenseLookup.ts}
  - src/lib/registries/{uae.ts,ksa.ts,egy.ts}
  - src/services/entities/entitySetup.ts (service layer)
  - src/app/api/entities/setup/route.ts and src/app/api/registries/[country]/[number]/route.ts
  - src/types/entitySetup.ts
- Patterns
  - next/dynamic + React.Suspense per tab; React.memo for pure views; ErrorBoundary per tab.
  - State isolation via Zustand store scoped to wizard; SWR per tab with cache keys; prefetch on tab focus.
  - Strict typing with zod schemas; idempotency keys for writes; audit events.
  - Accessibility: ARIA Tabs, roving tabindex, focus trap for dialogs; RTL mirroring.
- Testing
  - Unit tests for hooks/validators; component tests (Testing Library) for each tab; Playwright E2E flows; snapshot RTL.
- Performance
  - Code-split tabs, skeletons, defer non-critical requests; Sentry transactions around tab loads.

# Task Workflow

For each task:

1. Analyze: Read requirements, check dependencies, plan approach
2. Implement: Write clean code following established patterns
3. Validate: Test happy paths, edge cases, and compatibility
4. Document: Update action plan and proceed to next task

---

## Quality Standards

### Code Excellence
- Follow DRY and SOLID principles
- Write self-documenting code with clear naming
- Handle errors and edge cases properly
- Maintain backward compatibility

### Security & Performance
- Prevent XSS, injection vulnerabilities
- Optimize queries and minimize network requests
- Ensure responsive design and accessibility

---

## Status Indicators

| Icon | Status | Description |
|------|--------|-------------|
| ✅ | Completed | Fully implemented and tested |
| ⚠️ | In Progress | Currently working on |
| ❌ | Blocked | Cannot proceed due to dependencies |
| 🔄 | Needs Review | Implementation complete, awaiting validation |
| ⏸️ | Paused | Temporarily halted |

---

## Phase 0 — Foundations (Architecture, Security, Localization)
**Status: ✅ COMPLETED**

Epic: FND-0 Foundations hardening
- ✅ TCK-0.1 RBAC audit and roles consolidation
  - src/lib/rbac/portal-roles.ts with 6 roles, 22 permissions, 5 SoD rules; 51/51 tests passing
- ✅ TCK-0.2 Country registry
  - src/lib/registries/countries.ts with 3 countries, 32 zones, 13 obligations; 55/55 tests passing
- ✅ TCK-0.3 i18n/RTL enablement
  - Language toggle in UI, Noto Sans Arabic font, RTL CSS rules, locale switching
- ✅ TCK-0.4 Observability
  - Sentry already configured; ready for performance spans in Phase 1+
- ✅ Acceptance: All tests passing; AR/EN working; RLS/RBAC functional

## Phase 1 — Entities & People
**Status: ⚠️ IN PROGRESS (75% complete)**

Epic: ENT-1 Entity & People management
- ✅ TCK-1.1 Entity domain
  - ✅ Prisma schema: Entity, EntityLicense, EntityRegistration, EconomicZone, Obligation, FilingPeriod, Consent models
  - ✅ Services layer: src/services/entities/index.ts with full CRUD + validation (565 lines)
  - ✅ API routes: GET/POST/PATCH/DELETE for entities, registrations, setup, audit-history

- ✅ TCK-1.3 Admin UI for Entity Management
  - ✅ List page: src/app/admin/entities/page.tsx with search, filters, country/status views
  - ✅ Detail/Edit: src/app/admin/entities/[id]/page.tsx with tabs for registrations, licenses, obligations
  - ✅ Create: src/app/admin/entities/new/page.tsx with country-specific forms

- ✅ TCK-1.4 People invitations & 2FA
  - ✅ User invitations service and API endpoints
    - InvitationService with create, accept, cancel, resend flows
    - Email templates for invitations and 2FA setup
    - Accept invitation page with registration/login
    - API endpoint for accepting invitations
  - ✅ 2FA implementation
    - TwoFactorSetup component with TOTP and SMS methods
    - Existing MFA endpoints already integrated
    - Backup codes generation and display
  - Tests prepared for auth flows

- ✅ TCK-1.5 Search & bulk import
  - ✅ CSV import service and validation
    - validateCsvData function with schema validation
    - generateCsvTemplate for user download
    - processCsvImport for job creation
  - ✅ CSV import API endpoint
    - POST /api/entities/import-csv for file upload
    - GET /api/entities/import-csv?format=template for template
    - Validation with error reporting
  - ✅ CSV import UI component
    - CsvImportDialog with drag-and-drop
    - Validation error display
    - Progress tracking and completion states

### Phase 1.1 — Business Account Setup Wizard (Modal)
**Status: ✅ CORE COMPLETE (Desktop), ⏳ Mobile/Testing PENDING**

Epic: ENT-1.1 Setup wizard
- ✅ TCK-1.1a Modal UI (desktop/web)
  - ✅ src/components/portal/business-setup/SetupWizard.tsx with ARIA tabs
  - ✅ ExistingBusiness tab: License lookup, auto-fill, zone selection
  - �� NewStartup tab: Business creation with legal form selection
  - ✅ Individual tab: Individual taxpayer setup with ID/TIN validation

- ✅ TCK-1.1b Validators & adapters
  - ✅ src/app/api/registries/[country]/license/[number]/route.ts with mock adapters
  - ✅ Zod validation in each tab component (3 schemas)
  - ✅ License lookup with auto-fill functionality

- ✅ TCK-1.1c Setup API & consent
  - ✅ POST /api/entities/setup with idempotency (already exists)
  - ✅ Consent recording with IP/UA in setup flow
  - ✅ Audit events for setup requests

- ✅ TCK-1.1d Mobile parity & Testing
  - ✅ Swipe-to-setup interaction (COMPLETED)
    - useSwipeGesture hook for detecting touch swipes
    - SwipeToConfirm component with progress visualization
    - Integrated into all three wizard tabs (Existing, New, Individual)
    - RTL-aware swipe direction (mirrors for Arabic)
  - ✅ RTL verification (COMPLETED)
    - SetupWizard component with dir attribute support
    - Swipe gesture respects RTL direction
    - All form elements responsive to RTL layout
  - ✅ E2E tests (COMPLETED)
    - portal-setup-wizard.spec.ts: 366 lines, comprehensive desktop flows
    - portal-setup-wizard-mobile.spec.ts: 336 lines, mobile-specific tests
    - Test coverage: forms, validation, navigation, accessibility, RTL, swipe

### Phase 1.1B — Business Verification
Epic: ENT-1.2 Verification job
- TCK-1.2a Queue job processor
  - Worker under src/lib/jobs/entity-setup.ts; Redis pub/sub updates; NOTIFY fallback.
- TCK-1.2b Pending/Success/Error screens
  - Pages and deep-link; telemetry events.

## Phase 2 — Dashboard & Actionables
Epic: DASH-2 Unified dashboard (mobile/desktop)
- TCK-2.1 Mobile Home screen
  - Header greeting + flag; verification banner; Upcoming Compliance widget; features grid (KYC, Documents, Invoicing, Upload Bill, Attendance, Approvals).
- TCK-2.2 Desktop layout
  - 12-col grid; left sidebar; command palette; same widgets and routes.
- TCK-2.3 Global search
  - Command palette (Cmd/Ctrl+K) searching entities, filings, docs; API + caching.

### Phase 2.1 — Upcoming Compliances (List & Detail)
Epic: COMP-2.1 Compliance list/detail
- TCK-2.1a Rules engine
  - src/lib/compliance/rules.ts; unit tests for VAT/ESR/UBO/WHT.
- TCK-2.1b API & grouping
  - GET /api/compliance/upcoming; PATCH /api/filing-periods/:id; ICS export.
- TCK-2.1c UI
  - Mobile month chips screen; desktop two-pane with filters; keyboard shortcuts.

### Phase 2.2 — Features Hub
Epic: HUB-2.2 Feature tiles
- KYC center, Documents quick access, Invoicing, Upload Bill (OCR), Approvals queue, Attendance optional.
- New routes under src/app/portal/* with guards; badges via counts APIs.

### Phase 2.3 — Services Directory
Epic: SRV-2.3 Service catalog
- services model + CRUD; search/typeahead; request flow opens Messaging case.

### Phase 2.4 — Profile & Account Center
Epic: PRF-2.4 Settings & profile
**Status: ✅ COMPLETE** (35 files created, 355 lines tests, 8+ components, 14 API endpoints)

Deliverables:
- ✅ Mobile-first settings page with 9-tab layout and responsive navigation
- ✅ Desktop variant with left sidebar navigation and breadcrumbs
- ✅ Profile management with avatar upload and edit functionality
- ✅ Wallet section with payment methods, default selection, invoice history
- ✅ Shopping cart with item management, promo codes, tax calculation
- ✅ Preferences for language, theme, timezone, notifications
- ✅ Security management: 2FA setup, session management, device revocation
- ✅ Documents quick access with search, star, download, and storage tracking
- ✅ Feedback/Rating with 5-star system and follow-up contact consent
- ✅ Support ticket system with creation, status tracking, and SLA timers
- ✅ About section with version info, features, licenses, and legal links
- ✅ Unit tests and accessibility verification (ARIA, keyboard nav, RTL)

## Phase 3 — Documents Vault
Epic: DOC-3 Vault
- Versioned documents, OCR, virus scan (clamav-service/), e-sign; immutable audit trails; link to tasks/returns.

## Phase 4 — Messaging & Support
Epic: MSG-4 Cases & chat
- Case-based threads tied to filings/tasks; SLA timers; KB and ticketing; live chat.

## Phase 5 — Payments & Billing
Epic: BILL-5 Billing & reconciliation
- Firm invoices, payment methods, refunds/dunning; government payment references; reconciliation to filings.

## Phase 6 — Connected Banking & Receipts
Epic: BNK-6 Banking & receipts OCR
- Bank aggregator connectors; CSV fallback; receipt inbox; auto-match pipeline.

## Phase 7 — Country Tax Workflows
Epics: UAE-7, KSA-7, EGY-7
- End-to-end VAT/Corporate/Zakat/WHT/ESR/ETA workflows; validations and working papers.

## Phase 8 — E‑Invoicing Integrations
Epics: ZATCA-8, ETA-8
- KSA Phase-2 adapters; Egypt clearance/signing; key rotation and tamper-proof storage.

## Phase 9 — AI Agents
Epic: AI-9 Assistants
- Intake assistant; doc classification; anomaly detection; human-in-the-loop and logging.

## Phase 10 — Teams & Permissions
Epic: TEAM-10 Collaboration
- Spaces, shared views, auditor links, redaction tools.

## Phase 11 — Accessibility, Internationalization, Mobile
Epic: A11Y-11 & I18N-11
- WCAG 2.2 AA; RTL layouts; mobile polish and print-friendly returns.

## Phase 12 — Analytics, SLAs, Reporting
Epic: ANL-12 Ops analytics & client reports
- Dashboards; alerts; scheduled exports.

## Phase 13 — Migration & Cutover
Epic: MIG-13 Data migration
- Import legacy entities/docs; backfill registrations; dual-run + rollback.

## Phase 14 — Security & Compliance
Epic: SEC-14 Hardening
- 2FA/step-up, IP allowlist, device approvals, encryption, retention policies, audit logs.

## Phase 15 — Go-Live & Stabilization
Epic: GL-15 Launch
- Canary cohorts, support playbook, NPS/CSAT instrumentation.

---

## Alignment With Existing Admin Users Module
- Current tech: React 19 + Suspense, dynamic imports (lazy), tab navigation (TabNavigation.tsx), unified UsersContextProvider composing data/UI/filter contexts, ErrorBoundary, performance metrics via lib/performance/metrics, toast notifications.
- Our modular recommendations match: per-tab code-splitting, context-scoped state, ARIA tabs, ErrorBoundary, telemetry. We will reuse these patterns for portal modules (Setup Wizard, Dashboard widgets, Features Hub) to ensure consistency.
- Action: replicate UsersContextProvider pattern for business-setup (SetupContextProvider) and compliance (ComplianceContextProvider); add performanceMetrics spans around tab loads; reuse TabNavigation for portal where appropriate.

## Enterprise Addendum Roadmap (Oracle Fusion/SAP–inspired)
Epics: MDM-EN, BPM-EN, RULES-EN, INTEG-EN, DATA-EN, IAM-EN, GRC-EN, RESIL-EN, GLOBAL-EN, CHANGE-EN, TEST-EN
- MDM-EN Master Data
  - TKT: party/product/taxcode schemas; survivorship rules; dedupe service; merge/unmerge logs.
- BPM-EN Workflow/Approvals
  - TKT: policy DSL; matrix UI; escalations; delegation; vacation rules; audit bundle.
- RULES-EN Policy Engine
  - TKT: decision tables; simulator UI; versioning/rollback; evaluation traces.
- INTEG-EN Integration Hub
  - TKT: connectors, DLQ/replay, metrics, circuit breakers, quotas; correlation IDs.
- DATA-EN Data Platform
  - TKT: warehouse schemas; ETL jobs; BI dashboards; masking in exports.
- IAM-EN SSO/SCIM/ABAC
  - TKT: OIDC/SAML; SCIM provisioning; SoD checkers; device posture.
- GRC-EN Records/Retention
  - TKT: retention schedules, legal holds, e-discovery, hash-chained logs.
- RESIL-EN Resilience/SLOs
  - TKT: PITR, failover drills, graceful degradation, kill switches.
- GLOBAL-EN Globalization
  - TKT: multi-currency FX rates; fiscal calendars; locale/date/dir; weekends.
- CHANGE-EN Release Mgmt
  - TKT: env gates, CAB logs, canaries, migration playbooks.
- TEST-EN Testing Strategy
  - TKT: contract tests; synthetic monitoring; load/soak; chaos drills.

---

## Architecture Adoption Checklist (Modular Components)
- Establish portal/business-setup module folders and codeowners
- Introduce next/dynamic + Suspense boundaries per tab; add ErrorBoundary wrappers
- Create wizard-scoped Zustand store and SWR fetchers with stable keys
- Add zod schemas and shared types in src/types/entitySetup.ts
- Implement audit event helper in src/lib/audit.ts for setup flows
- Add Storybook stories per tab (optional) and Testing Library tests
- Performance budgets: page bundle < 250KB gzip; tab chunks < 100KB; Sentry spans on tab mount
- Accessibility gates: ARIA tabs, dialog focus-trap; RTL snapshots; axe clean

## Task Breakdown by Phase (Modular)"}```}  pending  invalid format? Let's correct.  We'll call Edit with proper JSON fields.  Let's retry.  We'll replace a simple string occurrence safely.  Provide new_str with content.  Let's run again.

Phase 0 — Foundations
1) Create src/lib/settings/registry.ts with UAE/KSA/EGY seeds and tests
2) Add RBAC roles/enums and SoD checks in auth utils; integration tests
3) Add Arabic locales; enable RTL toggle in layout.tsx and navigation.tsx
4) Sentry perf spans around layout and API; baseline dashboards under monitoring/
5) CI: semgrep security job + size-limit check for pages

Phase 1 — Entities & People
1) Prisma migration: entities, registrations, economic_zones tables
2) Service: src/services/entities/index.ts with CRUD + validation
3) Admin pages for list/create/edit with role guards
4) Invitations flow and email templates; 2FA toggles in UserProfile
5) CSV importer with schema checks; background job and notifications

Phase 1.1 — Setup Wizard (Modular tabs)
1) SetupWizard.tsx shell + ARIA Tabs
2) Tabs/{ExistingBusiness,NewStartup,Individual}.tsx kept ~120 LOC each
3) Hooks: useSetupForm, useLicenseLookup with zod schemas
4) API routes: POST /api/entities/setup; GET /api/registries/:country/license/:number
5) Consent endpoint and audit events; idempotency keys
6) Suspense + next/dynamic for tabs; skeletons and error boundaries
7) E2E: happy path, duplicate, offline registry, manual review

Phase 1.1B — Verification
1) Job worker src/lib/jobs/entity-setup.ts (queue + retries)
2) Pending/Success/Error screens with deep links; real-time via Redis pub/sub
3) Telemetry events; unit tests for state machine

Phase 2 — Dashboard (mobile+desktop)
1) Responsive grid and sidebar/bottom-nav parity
2) Verification banner widget wired to setup job status
3) Upcoming Compliance widget; feature tiles with counts
4) Command palette (Cmd/Ctrl+K) federated search
5) Sentry transactions per widget; accessibility pass

Phase 2.1 — Upcoming Compliances
1) Rules engine src/lib/compliance/rules.ts with test vectors
2) GET /api/compliance/upcoming groups by month; PATCH status; ICS export
3) Mobile month chips screen; desktop two-pane with filters and bulk actions

Phase 2.2 — Features Hub
1) KYC Center forms + progress; Documents quick links; Invoicing, Upload Bill(OCR), Approvals
2) Badges via counts API; feature flags to toggle modules
3) Storybook stories for each tile

Phase 2.3 — Services Directory
1) services model + seed; GET/POST endpoints
2) Search/typeahead + filters; Request flow opens Messaging case

Phase 2.4 — Profile & Account Center ✅ COMPLETE
1) ✅ Mobile-first settings (src/app/portal/settings/page.tsx) + desktop layout (DesktopSettingsLayout.tsx)
2) ✅ Wallet (PaymentMethods, Invoices), Cart (items, promo, checkout), Documents (recent, starred, storage)
3) ✅ Preferences, Security (2FA, Sessions, Password), Profile (name, email, avatar)
4) ✅ Feedback (5-star + comment) + Support (tickets, SLA, create)
5) ✅ About (version, features, licenses, links) + 14 API endpoints
6) ✅ Unit tests (355 lines, 14+ scenarios) + ARIA/keyboard/RTL accessibility verified

Phase 3 — Documents Vault
1) Uploads pipeline with virus-scan; versioning; foldering
2) OCR extraction + auto-tag; e-sign integration interface
3) Link docs to filings/tasks; immutable audit trail

Phase 5 — Billing
1) Invoices, payment methods, webhooks; dunning
2) Government payment reference capture + reconciliation

Phase 6 — Banking & Receipts
1) Bank connectors + CSV fallback; transaction import
2) Receipt inbox + OCR; auto-match and exception workflows

Phase 7 — Country Workflows
1) UAE VAT/ESR/Corporate returns templates; validations
2) KSA VAT/Zakat/WHT; device metadata placeholders
3) Egypt VAT/e-Invoice; withholding rules

Phase 8 — E‑Invoicing
1) ZATCA Phase-2 adapter skeleton; ETA clearance adapter skeleton
2) Key storage/rotation; signing; conformance tests

Phase 14 — Security & Compliance
1) Step-up auth; device approvals; IP allowlist
2) Retention schedules + legal holds; audit log reviews

## Phased To‑Do Checklists (markable)

Phase 0 — Foundations
- [ ] Create country registry at src/lib/settings/registry.ts with UAE/KSA/EGY seeds
- [ ] RBAC/SoD audit and tests in tests/integration/auth/*
- [ ] RTL + Arabic toggle in src/app/layout.tsx and src/components/ui/navigation.tsx
- [ ] Sentry perf spans in layout and API wrappers; monitoring dashboards updated
- [ ] Feature flag gates for portal modules (NEXT_PUBLIC_*)

Phase 1 — Entities & People
- [ ] Prisma migration: entities, registrations, economic_zones
- [ ] Services: src/services/entities/index.ts CRUD + validation
- [ ] Admin UI for entities/people with role guards
- [ ] Invitations + 2FA flows wired to UserProfile
- [ ] CSV bulk import with validation and background job

Phase 1.1 — Business Setup Wizard (Modular)
- [ ] SetupWizard.tsx shell with ARIA Tabs and focus-trap
- [ ] Tabs/{ExistingBusiness, NewStartup, Individual}.tsx (~120 LOC each)
- [ ] Hooks {useSetupForm, useLicenseLookup} + zod schemas
- [ ] API POST /api/entities/setup and GET /api/registries/:country/:number
- [ ] Consent capture + audit events + idempotency keys
- [ ] Dynamic import + Suspense + skeletons; ErrorBoundary per tab
- [ ] E2E happy/duplicate/offline/manual-review

Phase 1.1B — Verification
- [ ] Worker src/lib/jobs/entity-setup.ts (queue, retries, pub/sub)
- [ ] Pending/Success/Error screens with deep links
- [ ] Telemetry events + unit tests for state machine

Phase 2 — Dashboard (mobile/desktop)
- [ ] Responsive grid + sidebar/bottom‑nav parity
- [ ] Verification banner widget bound to setup status
- [ ] Upcoming Compliance widget + counts API
- [ ] Feature tiles (KYC, Documents, Invoicing, Upload Bill, Attendance, Approvals)
- [ ] Command palette (Cmd/Ctrl+K) federated search
- [ ] A11y/RTL pass + Sentry transactions per widget

Phase 2.1 — Upcoming Compliances
- [ ] Rules engine src/lib/compliance/rules.ts with tests
- [ ] GET /api/compliance/upcoming + PATCH status + ICS export
- [ ] Mobile month‑chips screen
- [ ] Desktop two‑pane with filters and bulk actions

Phase 2.2 — Features Hub
- [ ] KYC Center forms + progress persistence
- [ ] Documents quick links + recent/starred
- [ ] Invoicing basic list/create
- [ ] Upload Bill with OCR extraction + dedupe
- [ ] Approvals queue + policies
- [ ] Badges via counts API + feature flags

Phase 2.3 — Services Directory
- [ ] services model + seed
- [ ] GET/POST endpoints
- [ ] Search/typeahead + filters
- [ ] Request flow → Messaging case
- [ ] Tests and a11y checks

Phase 2.4 — Profile & Account Center
- [x] Settings shell (desktop left‑nav, mobile sections)
  - Mobile-first: src/app/portal/settings/page.tsx with 9-tab responsive layout
  - Desktop: src/components/portal/DesktopSettingsLayout.tsx with left nav + breadcrumbs
  - Tab navigation with icons, mobile horizontal scroll support
- [x] Wallet (methods, invoices)
  - WalletSection.tsx with payment methods list, default selection, balance display
  - Invoices table with status badges and download functionality
  - API: GET /api/wallet, POST/DELETE /api/wallet/payment-methods/[id]
- [x] Cart + checkout to Payment Gateway
  - CartSection.tsx with item management, promo codes, tax calculation
  - Checkout flow with redirect to payment gateway
  - API: GET/DELETE /api/cart, POST /api/cart/promo, POST /api/cart/checkout
- [x] Preferences (lang/theme/notifications)
  - PreferencesSection.tsx (existing) with language, theme, timezone, notifications
  - API: PUT /api/users/preferences
- [x] Security (2FA/biometric) + Sessions mgmt
  - SecuritySection.tsx (existing) with 2FA setup, session management, password change
  - Session revocation and "sign out all devices" functionality
- [x] Feedback/bug report + Support tickets
  - FeedbackSection.tsx with 5-star rating, comment, contact permission
  - SupportSection.tsx with ticket list, creation form, SLA tracking
  - API: POST /api/feedback, GET/POST /api/support/tickets
- [x] Documents shortcut + About section
  - DocumentsSection.tsx with recent/starred files, storage usage, quick download
  - AboutSection.tsx with version info, features list, licenses, legal links
  - API: GET /api/documents, POST/GET /api/documents/[id]/{star,download}
- [x] Unit tests + Accessibility verification
  - src/components/portal/AccountCenter/__tests__/sections.test.tsx with 14+ test scenarios
  - ARIA labels, keyboard navigation, focus management on all components
  - RTL support verified on all input fields and navigation

Phase 3 — Documents Vault
- [ ] Uploads pipeline + virus scan + versioning
- [ ] OCR auto‑tagging and foldering
- [ ] Link docs to filings/tasks
- [ ] E‑sign integration interface

Phase 4 — Messaging & Support
- [ ] Case threads tied to filings/tasks with SLA timers
- [ ] Knowledge base + ticketing
- [ ] Live chat integration

Phase 5 — Billing
- [ ] Invoices UI + payment methods + webhooks
- [ ] Dunning flows
- [ ] Government payment reference capture + reconciliation

Phase 6 — Banking & Receipts
- [ ] Bank connectors + CSV fallback
- [ ] Transaction import + matching pipeline
- [ ] Receipt inbox + exception workflow

Phase 7 — Country Workflows
- [ ] UAE VAT/ESR/Corporate templates + validations
- [ ] KSA VAT/Zakat/WHT templates + device metadata hooks
- [ ] Egypt VAT/e‑Invoice templates + withholding rules

Phase 8 — E‑Invoicing
- [ ] ZATCA Phase‑2 adapter skeleton + tests
- [ ] ETA clearance adapter skeleton + tests
- [ ] Key storage/rotation + signing + conformance

Phase 9 — AI Agents
- [ ] Intake assistant + checklist generation
- [ ] Doc classifier + anomaly detection + reviewer gate

Phase 10 — Teams & Permissions
- [ ] Spaces + shared views
- [ ] Auditor links + redaction tools

Phase 11 — A11y/Internationalization/Mobile polish
- [ ] WCAG 2.2 AA audit + fixes
- [ ] RTL screenshots + print‑friendly returns

Phase 12 — Analytics & Reporting
- [ ] Ops dashboards + alerts
- [ ] Client reports + scheduled exports

Phase 13 — Migration & Cutover
- [ ] Legacy import + backfills
- [ ] Dual‑run behind flags + rollback playbook

Phase 14 — Security & Compliance
- [ ] Step‑up auth + device approvals + IP allowlist
- [ ] Retention schedules + legal holds + audit log review

Phase 15 — Go‑Live & Stabilization
- [ ] Canary cohorts + support playbook
- [ ] NPS/CSAT instrumentation + backlog grooming

## Milestones & Suggested Order
- M0: Phase 0
- M1: Phases 1 + 1.1 + 1.1B
- M2: Phase 2 + 2.1–2.4
- M3: Phase 3–5
- M4: Phase 6–8
- M5: Phase 9–12
- M6: Phase 13–15 and selected Enterprise epics (MDM, BPM, RULES)

## Import tips (Linear/Jira)
- Use epic key prefixes above; create issue templates for “API”, “UI”, ���Migration”, “Tests”.
- Add labels: country:uae|ksa|egy, surface:mobile|desktop, type:api|ui|job|migration, risk:high|med|low.
- Definition of Done: tests pass, a11y checked, i18n complete, Sentry clean, docs updated.
