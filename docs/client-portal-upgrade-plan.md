# Client Portal Upgrade Plan (UAE • KSA • Egypt)

A comprehensive, phased implementation plan to upgrade the client portal for a multi-country tax platform. The plan aligns features visible in the reference UI with the needs of a tax-filing product and adapts them to regulatory requirements of UAE, KSA, and Egypt.

---

## 1) Snapshot: What the reference UI conveys and how it maps to a tax portal

Key elements observed in the provided screenshot and recommended mapping:

- Left sidebar menu (Messaging, Current Account, Payment Gateway, Corporate Cards, Connected Banking, Trademark, Documents)
  - Messaging → Secure in-portal conversations, cases, and task threads per filing period.
  - Current Account / Connected Banking → Bank feeds for reconciliation and cash/expense evidence supporting returns (read-only). Regional support for local banks.
  - Payment Gateway → Client invoices, online payments for firm fees; links to government payment references (FTA/ZATCA/ETA portals) when applicable.
  - Corporate Cards → Receipts inbox; OCR to tag VAT or deductible categories; optional.
  - Trademark → Replace with “Registrations & Certificates” (TRN, ZATCA e-invoice device IDs, ETA profile, ESR submissions, commercial registration documents).
  - Documents → Source-of-truth document vault with folders by Entity→Year→Tax Type.

- Top navigation (Dashboard, Accounts, Updates, Teams, AI Agents, Billing, Support)
  - Dashboard → Filing calendar, upcoming/overdue actionables, return status widgets.
  - Accounts → Entities & People; client teams and permissions.
  - Updates → Compliance alerts (rate changes, schema changes like ZATCA Phase-2, ETA updates), and product release notes.
  - Teams → Client-side user management (owners, finance, auditor access). 
  - AI Agents → Assisted intake, doc classification, compliance Q&A, checklist generation.
  - Billing → Firm billing and client invoices, payment methods, credit balance.
  - Support → Knowledge base, tickets, SLA status, live chat.

- Center content (Entities/People tabs, empty state, search, new buttons)
  - Entities ↔ client companies; People ↔ individual taxpayers and authorized users.
  - Deep search across entities, returns, invoices, docs.
  - “+” actions to add Entity/Person; smart templates by country.

- Right panel (Business Actionables → Upcoming/Renewals)
  - Filing deadlines and renewals: VAT returns, Corporate Tax, Zakat (KSA), ESR (UAE), Withholding Tax (KSA), E-invoice device renewals (KSA), activity renewals (Egypt: e-invoicing profile/ETA obligations).

- Other elements: Dark theme, notifications, quick sign out, privacy badge, chat bubble
  - Maintain dark theme with accessible color contrast. Notifications unify portal, email, and WhatsApp/SMS (opt-in).

---

## 2) Product Goals

- Single portal for clients across UAE, KSA, Egypt to manage tax obligations, returns, payments, and compliance artifacts.
- Reduce back-and-forth via messaging, structured tasks, and automated intake.
- Provide audit-ready, immutable records (docs, approvals, timelines).
- Minimize regional friction with country-specific automations and checklists.

---

## 3) Regulatory Landscape (country highlights)

- UAE
  - VAT (FTA): 5% VAT returns, refund claims, voluntary disclosures, ESR notifications/reports, Corporate Tax (9% effective now) returns.
  - TRN validation, FTA e-Services flows (link-out for payment/submission with tracked references).
- KSA
  - ZATCA VAT (15%), Zakat (for certain entities), Withholding Tax, e-Invoicing (Phase-2, integration compliance: reporting/clearance, device and CSR/CRT management), e-archiving requirements.
- Egypt
  - ETA VAT and e-Invoicing clearance, e-Receipt for B2C, withholding/stamp where applicable; identity and certificate management.

Implications: separate templates, calendars, validations, and evidentiary document sets per country; configurable per entity.

---

## 4) Information Architecture

- Tenancy
  - Tenant = client group; Entity = legal company or individual taxpayer; People = users or directors; Advisors = firm users.
- Primary Objects
  - Entity profiles: country, registrations (TRN/ZATCA/ETA), activity, fiscal calendar.
  - Filing cycles: VAT, Corporate Tax, Zakat, ESR, WHT, e-Invoice obligations.
  - Documents: categories (invoices, bank statements, contracts, payroll, fixed assets, tax adjustments), retention rules.
  - Tasks & checklists: per filing period, per obligation.
  - Payments & invoices: firm invoices, official references, reconciliation.
  - Messages & tickets: case threads tied to returns and tasks.
  - Banking connections: read-only transactions, statement fetch, receipts OCR pipeline.
  - Notifications: digest, deadline alerts, missing-evidence reminders.

---

## 5) Phased Implementation Plan

Each phase includes objectives, key tasks, acceptance criteria, and dependencies. Use feature flags for safe rollout. Adopt a country-by-country vertical slice approach when needed.

### Phase 0 — Foundations (Architecture, Security, Localization)
- Objectives
  - Harden multi-tenancy; enforce RLS; country-aware settings; Arabic/English i18n; timezones; currencies; dark/light modes.
- Key Tasks
  - RBAC: roles (Client Owner, Finance, Viewer, Auditor, Advisor), scoped to Tenant/Entity.
  - Country config registry (UAE/KSA/EGY) with obligations, calendars, forms, validation rules.
  - Activity log + audit trails; data retention policies by country.
  - Observability: Sentry, performance metrics, structured logs, alerting.
- Acceptance
  - All pages respect tenant + role scoping; language toggle; unit/integration tests for RLS and RBAC.

### Phase 1 — Entities & People (replaces Entities/People tabs)
- Tasks
  - Entity creation wizard per country (collect TRN/TIN, registration certificates, fiscal year, VAT status).
  - People management with invitations and 2FA; role assignment; KYC verification.
  - Search across entities and people; bulk import.
- Acceptance
  - Create/edit/archive entities; invite users; permission matrix enforced.

### Phase 1.1 — Business Account Setup Wizard (Modal)
- Purpose
  - Allow clients to create a business account from a focused modal, matching the reference UI: two tabs (Existing Entity Setup, New Entity Setup), country flag indicator, license-number driven verification, consent checkbox, prominent primary CTA, support partner label, and chat link.
- UX Requirements
  - Modal overlay with focus trap, ESC to close, and ARIA roles (dialog, aria-labelledby/aria-describedby). Keyboard-only and screen-reader friendly. Persist dark theme.
  - Tabs: "Existing Entity Setup" (search/verify existing registrations and auto-link) and "New Entity Setup" (create new entity with license details).
  - Fields (UAE default): License Number, Business Name, Economic Department/Free Zone (select), TRN (optional at creation), Legal Form (LLC, Sole Establishment, etc.), Incorporation Date, Attachments (trade license PDF/JPG, certificate). Terms consent checkbox with link to agreement. CTA text: "Set up Business".
  - Helpers: country switcher (UAE/KSA/EGY), inline validation messages, empty-state copy on mismatch, support partner label, live chat link.
- Regional Variants
  - UAE: Validate DED/Free-zone license, TRN format (15 digits), ESR applicability flag, Corporate Tax applicability.
  - KSA: CR Number, VAT Registration Number, optional Zakat flag; no e-invoice device at setup; city/region selector.
  - Egypt: Tax ID (TIN), ETA profile number, activity code (GPC/industry), e-Invoicing obligation flag.
- Validation & Integrations
  - Real-time license lookup adapters (pluggable): UAE (DED + major free zones), KSA (MC / CR), Egypt (GAFI/ETA where permitted). Fallback to manual verification workflow.
  - TRN/VAT/TIN checksum validation, name similarity (Levenshtein) with license record; duplicate-entity prevention and merge suggestion.
  - File uploads scanned for malware; OCR to prefill Business Name and number.
- Data Model Additions
  - entity_licenses(id, entity_id, country, authority, license_number, legal_form, issued_at, expires_at, economic_zone_id, status, metadata).
  - entity_registrations(id, entity_id, type[TRN/ZATCA/ETA/WHT/ZAKAT], value, verified_at, source, status).
  - economic_zones(id, country, name, authority_code, city, metadata).
  - consents(id, subject_type, subject_id, type[terms|privacy|service], version, accepted_by, accepted_at, ip, user_agent).
  - verification_attempts(id, type[license|tax_id], value, country, status, result, attempted_by, attempted_at, correlation_id).
- API Design
  - POST /api/entities/setup (idempotent with Idempotency-Key header). Payload: country, tab, license_number, business_name, economic_zone_id, legal_form, registrations[], attachments[], consent_version.
  - GET /api/registries/:country/license/:number → normalized license record; cache with TTL and ETag; rate limiting.
  - POST /api/consents → record explicit consent with IP/UA; linked to entity/user.
  - Emits audit events: entity.setup.requested, entity.setup.verified, entity.setup.completed, entity.setup.failed.
- Security & Privacy
  - RLS on all tables by tenant/entity; encrypted columns for IDs/certificates; redact PII in logs.
  - Virus scan on uploads; content-type verification; size limits; signed URLs; temporary storage before verification.
- Error States
  - License not found, registry unavailable, duplicate entity, invalid consent; present fallback: “Continue with manual review” opening a case in Messaging.
  - Show support partner block and Chat CTA on repeat failures.
- Acceptance Criteria
  - End-to-end setup succeeds for happy-path in UAE/KSA/EGY; duplicate protection; consent captured with timestamp/IP/UA; audit events present.
  - Accessibility verified (tab order, labels, contrast); localized AR/EN content; RTL layout correct.
- Telemetry
  - Funnel metrics: view → submit → verified → completed; reason codes for drop-offs; time-to-completion; registry latency.
- Testing
  - Unit tests for validators; contract tests for adapters; E2E flows: existing vs new entity, duplicate, offline registry, manual review route.

### Phase 1.1A — Business Account Setup Wizard (Mobile screens)
- Observed UI (from images)
  - Header with Back button, title “Business Setup”, profile/avatar.
  - Global search bar (placeholder: “Search Services”).
  - Segmented tabs: Existing Business | New Startup | Individual.
  - Form fields: License Number, Business (name), Department (select with dropdown: e.g., Abu Dhabi Airports Free Zone, Abu Dhabi Department of Economic Development, Abu Dhabi Global Market).
  - Consent: “I agree to … License agreement” with hyperlink.
  - Primary CTA: Swipe to Setup — rightward swipeable pill/gradient button with arrow.
- UX/Behavior
  - Form validation: required Business and Department; Existing Business requires License Number. License supports alphanumeric (e.g., CR124686P). Inline errors below inputs.
  - Department dropdown searchable, virtualized list; options sourced from economic_zones table filtered by country/emirate.
  - “Existing Business” → attempt license lookup; prefill Business/Department; allow manual override with change log entry.
  - “New Startup” → hide License Number; show Proposed Name, Emirate/Zone; optional name reservation step; create entity in Draft state.
  - “Individual” → Emirates ID/TIN input, DOB; create individual taxpayer entity with minimal fields.
  - Swipe-to-setup: track drag width; enable only when form valid and consent checked; haptic on threshold; cancel if released before threshold; loading state after trigger; prevent double submit via idempotency key.
- Accessibility & i18n
  - 44px+ touch targets; semantic labels; focus order aligns top-to-bottom; talkback announcements for tab changes and validation; supports RTL Arabic with mirrored swipe (right-to-left → swipe left to confirm) based on locale.
- Telemetry
  - Events: setup.view, tab.change, license.lookup.start/success/fail, dept.search, consent.toggle, swipe.start/complete/cancel, setup.submit/success/error; durations and error codes.
- Error states
  - License not found, registry rate-limited, name mismatch >20% distance, duplicate entity; provide “Continue with manual review” CTA.
- API usage
  - Reuse POST /api/entities/setup, GET /api/registries/:country/license/:number, POST /api/consents. Attach user locale and device to payload.
- Testing
  - Unit: validators (CR/ID formats), swipe reducer; Integration: tab flows; E2E: happy path and offline registry; RTL snapshots.

### Phase 1.1B — Business Verification (post “Swipe to Setup”)
- Observed UI
  - Title: “Business Verification”; large success icon; celebratory copy; primary CTA: “Continue”.
- Flow & States
  - Immediately after swipe: create setup job with idempotency key and return entity_setup_id. Show Pending screen, then Success/Error.
  - Pending: spinner + copy “Verifying your license and details (≈ <5 min). We’ll notify you when done.” Offer “Continue in background”.
  - Success: screen per image; CTA routes to Entity Overview with checklist and actionables.
  - Error: friendly failure screen with reason code (not found/duplicate/rate-limited) and CTAs: Try again, Manual Review (opens Messaging case), Contact Support.
- Backend
  - Queue job: verify license/registrations, OCR attachments, create entity, record consent, emit audit events.
  - Webhooks/adapters for registries with exponential backoff. Persist verification_attempts.
  - Real-time status via Postgres NOTIFY or Redis pub/sub; fallback to polling (2s → 5s backoff, cap 60s).
- Telemetry & Copy
  - Events: setup.status.pending/success/error, time_to_verify, registry.latency, retries, error_code.
  - Localized AR/EN strings; tone concise; number/date formatting per locale.
- Security & Compliance
  - Do not expose PII in toasts/logs; mask license numbers; encrypt identifiers at rest.
- Acceptance Criteria
  - Success screen appears only after persisted entity + audit log; deep-link works; reconnection resumes last state; RTL layout validated.

### Phase 2 — Dashboard & Actionables (right panel)

Mobile and Desktop dashboards deliver identical functions with layout-specific adaptations.

- Mobile main dashboard (from screenshot)
  - Header: country flag + time-based greeting, entity name, hamburger menu, overflow menu, notifications.
  - Global search: "Search Services" across tasks, filings, invoices, docs, help.
  - Verification banner: status card with icon, copy about ~12h verification, entity name, pill “Pending Verification”. Tap → setup status details.
  - Upcoming Compliance: next deadline card (e.g., VAT Return & Payment – Monthly – date) with deep-link to period checklist.
  - Features grid: KYC, Documents, Invoicing, Upload Bill, Attendance, Approvals. Each opens its module with badges for pending items.
  - Bottom nav: Home, Updates, Services, My Team. Persistent; shows unread indicators.
  - Interactions: pull-to-refresh; offline banner; skeleton loaders; swipe back; Arabic RTL support.

- Desktop main dashboard (same functions)
  - Layout: top header + left sidebar (replaces bottom nav) with the same tabs: Home, Updates, Services, My Team; quick entity switcher and country flag in header.
  - Content grid: 12-column responsive grid. Left: Verification banner and Upcoming Compliance; Right: Actionables (overdue/soon), Recent Messages, and Quick Upload.
  - Features grid appears as cards with descriptions and counts; keyboard shortcuts (e.g., “U” for Upload Bill).
  - Search bar in header with command palette (Cmd/Ctrl+K) and scoped search by entity.
  - Widgets parity: same URLs/permissions as mobile; no feature divergence.

- Data & states
  - Verification status from entity_setup job; Upcoming Compliance from obligations and FilingPeriods; feature tiles show counts (pending KYC steps, documents to review, invoices due, approvals pending).
  - Empty states with clear CTAs; error toasts mapped to retries; background sync updates badges.

- Telemetry
  - dashboard.view, widget.click, search.open/submit, compliance.card.open, feature.tile.open, bottom_nav.click/side_nav.click; device_type dimension.

- Accessibility & performance
  - ARIA landmarks/labels; focus-visible outlines; 60fps scroll; image/icon lazy loading; localization AR/EN;
  - Breakpoints: mobile <640px, tablet 641–1024px, desktop ≥1024px with 3-column layout.

### Phase 2.1 — Upcoming Compliances (List & Detail)
- Observed UI (from image)
  - Screen title: “Upcoming Compliances”. Month chips (e.g., December 2025, November 2025).
  - Cards grouped by month; left circular day badge (e.g., 31, 28); title and description: ESR Report, UBO Register Submission/Update, VAT Return & Payment (Monthly) with guidance lines.
- Domain mapping
  - UAE examples: ESR annual within 12 months of FY-end (if relevant activity), UBO update within 15 days of changes + annual confirm by 31 Dec, VAT return+payment due 28 days after month-end.
  - KSA/Egypt equivalents populated from country registry (Zakat/WHT, ETA VAT, etc.).
- Data model & computation
  - obligations(id, entity_id, type, country, frequency, rule_config, active)
  - filing_periods(id, obligation_id, period_start, period_end, due_at, status[upcoming|overdue|filed|waived], computed_fields)
  - rules engine computes due_at per country: e.g., VAT monthly → end_of_month(period)+28d (UAE), ESR → fy_end+12m, UBO → change_date+15d with annual 31-Dec reminder.
- API
  - GET /api/compliance/upcoming?entity_id=… → groups by month, returns cards with id, title, desc, due_day, due_at, priority, country.
  - PATCH /api/filing-periods/:id {status, assignee_id, snooze_until}.
  - POST /api/ics/:id to export ICS; deep link to detail.
- UX (mobile)
  - Sticky month chips; infinite scroll by date; tap card → detail page with checklist, docs, and actions (Assign, Add evidence, Mark as submitted, Record payment reference, Export ICS, Open messaging thread).
  - Empty state when no items in next 90 days; filter by obligation type; search.
- UX (desktop)
  - Two-pane: left filters (type, country, status, period), center list, right detail panel with activity and attachments.
  - Bulk select to assign/snooze/mark submitted; keyboard shortcuts (A assign, S snooze, M mark submitted).
- Notifications & reminders
  - Reminder schedule: T-14, T-7, T-3, T-1 days; escalate if unacknowledged; WhatsApp/SMS/email opt-in.
- Telemetry
  - compliance.view, month_chip.click, card.open, action.assign/snooze/mark, ics.export; dimensions: country, obligation_type.
- Acceptance criteria
  - Correct due dates per rules; timezone-safe; status transitions auditable; RTL and AR/EN localized strings; accessibility roles/lists correct.

### Phase 2.2 — Features Hub (KYC, Documents, Invoicing, Upload Bill, Attendance, Approvals)
- Tiles & badges
  - Each tile shows a count/badge (e.g., KYC steps pending, new docs, invoices due, approvals waiting). Long-press opens quick actions on mobile; right-click menus on desktop.
- KYC Center
  - Steps: identity, address, beneficial owners, TRN/registrations, risk questionnaire, documents. Versioned forms per country; audit trail of changes; auto-save drafts.
  - API: GET/PUT /api/kyc/:entity; POST /api/kyc/:entity/documents; status rollups exposed to dashboard.
- Documents Quick Access
  - Shortcuts to recent uploads and starred folders; global search across filename, tags, OCR text; scan-to-upload via mobile camera.
- Invoicing
  - Create/send invoices; track statuses (draft/sent/paid/overdue); accept card/bank; store official payment references; KSA/Egypt e-invoice conformity flags.
- Upload Bill
  - Camera/gallery import → OCR → vendor/date/amount/VAT extraction; duplicate detection; post to accounting queue with category suggestions.
- Approvals
  - Unified queue for invoices, bills, payments, returns, document approvals. Policies per amount/role; sequential or parallel routes; escalation with SLAs.
- Attendance (optional module)
  - Simple time punches and leave requests if HR add-on enabled; otherwise tile hidden via feature flag.
- Telemetry & a11y
  - feature_tile.view/click, quick_action.use; all tiles keyboard-focusable and announced with counts.

### Phase 2.3 — Services Directory (Search Services)
- Purpose
  - Central catalog of firm services (VAT filing, corporate tax, ESR, UBO updates, bookkeeping, advisory) with request/activate flows.
- UX
  - Search bar with typeahead; category filters; service cards with price/unit, SLAs, prerequisites, and CTA (Request/Activate/Contact).
  - Mobile: bottom sheet filters; Desktop: left filter rail + grid; deep links from compliance cards.
- Data & APIs
  - services(id, name, country_scope, pricing, prerequisites, feature_flag, description).
  - GET /api/services?country=…; POST /api/services/:id/request to open a scoped case in Messaging with templated intake checklist.
- Acceptance
  - Service availability respects country/role/feature flags; request opens a prefilled case; analytics capture search queries and conversion.

### Desktop Parity for Sections
- Left sidebar replaces bottom navigation; persistent search in header; keyboard shortcuts; multi-select/bulk actions for Documents, Invoicing, Approvals, and Services.

### Phase 2.4 — Profile & Account Center (Mobile and Desktop)
- Observed mobile UI
  - Avatar, full name, email; grouped sections: Account (Wallet, Cart, Documents, Rating, Logout) and More (About, Report Bugs, Support); App version at footer; back and overflow icons.
- Core features
  - Profile overview: name, email, phone, roles; edit with validations; selfie/avatar upload with cropping; audit trail of changes.
  - Wallet: list payment methods, default card, firm invoices, receipts; add/remove methods; show credits/balance if applicable.
  - Cart: pending service purchases/quotes; taxes, promo codes; checkout to Payment Gateway.
  - Documents: shortcut to user’s personal folder and entity-scoped docs; recent items and starred.
  - Rating & Feedback: NPS/CSAT with free-text; follow-up contact permission; optional store rating deep link.
  - Logout: one-tap logout + “Log out of all devices” (session revoke).
  - About: app info, licenses, changelog; Terms/Privacy links.
  - Report Bugs: create support ticket with logs/metadata (device, version); attach screenshots; consent checkbox.
  - Support: open live chat, phone/email options, ticket history; SLA and priority tagging.
  - Preferences: language (EN/AR with RTL), theme (light/dark/system), time zone, notification channels (email/SMS/WhatsApp/push), data-export request.
  - Security: 2FA management (TOTP/SMS), biometric login toggle (mobile), session/device list with revoke, IP allowlist if org-enabled.
- Desktop parity
  - Dedicated Settings app with left nav: Profile, Security, Wallet, Cart, Documents, Notifications, Support, About.
  - Right pane shows forms/cards; breadcrumbs; keyboard navigable; modals for destructive actions.
- Data model & APIs
  - users(id, name, email, phone, avatar_url, locale, timezone), user_preferences(theme, notifications, language), sessions(id, device, ip, last_seen), support_tickets(id, type[bug|question], severity, status), feedback(id, score, comment, channel), payment_methods, invoices, cart_items.
  - GET/PUT /api/users/me; PUT /api/users/me/preferences; GET/DELETE /api/sessions; POST /api/support/tickets; POST /api/feedback; payments and invoices via existing billing endpoints.
- Security & compliance
  - RLS by user/tenant; encrypt sensitive fields; redact PII in logs; rate-limit support/feedback endpoints; export/delete per GDPR.
- Telemetry
  - profile.view, wallet.open, cart.checkout.start/success, documents.quick_open, feedback.submit, bug.report.submit, logout.all_devices, preference.change, security.2fa.enable/disable.
- Accessibility & UX
  - Large touch targets on mobile (≥44px); clear labels; focus order logical; error summaries; RTL mirrored layouts.
- Acceptance criteria
  - All actions persist and reflect across devices; session revocation effective immediately; AR/EN localized; desktop and mobile achieve feature parity.
- Tasks
  - Action center with upcoming/overdue filings, renewals, and required evidence.
  - Calendar view per entity/country; ICS export and WhatsApp/SMS/email reminders (opt-in).
  - Empty states and “next-best-action” guidance.
- Acceptance
  - Accurate deadlines by country; SLA timers on tasks; notification dispatch tested.

### Phase 3 — Documents Vault
- Tasks
  - Entity→Year→Tax Type foldering; drag-drop; OCR + auto-tag; versioning; e-sign; immutable audit log.
  - Templates: bank statements, purchase/sales, payroll, fixed assets, adjustments.
  - Link docs to tasks and return line items; deduplication; virus scanning.
- Acceptance
  - All uploads virus-scanned; >95% OCR accuracy benchmark on test set; auditable trails.

### Phase 4 — Messaging & Support (left “Messaging”, top “Support”)
- Tasks
  - Case-based messaging tied to returns/tasks; canned replies; SLA timers.
  - Knowledge base; ticketing; live chat; multilingual macros.
- Acceptance
  - All messages immutable and exportable; SLA dashboards.

### Phase 5 — Payments & Billing (left “Payment Gateway”, top “Billing”)
- Tasks
  - Firm invoices; cards/bank transfer; partial payments; refunds; dunning.
  - Store official references to FTA/ZATCA/ETA payments (link-out); reconcile against filings.
- Acceptance
  - PCI-compliant processor; invoices mapped to tasks/returns; ledger reconciliation.

### Phase 6 — Connected Banking & Receipts (left “Connected Banking/Corporate Cards”)
- Tasks
  - Aggregator integrations for UAE/KSA/EGY banks (read-only). CSV fallback.
  - Receipt inbox with mobile capture; vendor/VAT extraction; match to transactions.
- Acceptance
  - 90% auto-match rate on controlled dataset; manual workflows for exceptions.

### Phase 7 — Tax Filing Workflows (country-specific)
- UAE
  - VAT returns, refund claims, voluntary disclosures, Corporate Tax returns; ESR notifications/reports.
  - Validations: TRN, reverse-charge, exempt/zero-rated mapping, rate changes.
- KSA
  - VAT returns, Zakat computations, WHT calculations; e-invoice compliance artifacts.
  - ZATCA metadata capture (device IDs, certificates), return working papers.
- Egypt
  - ETA VAT return and clearance statuses; e-Invoice/e-Receipt references; withholding/stamp logic where applicable.
- Acceptance
  - End-to-end flow: intake checklist → doc evidence → computations → review/approve → payment reference → archive.

### Phase 8 — E‑Invoicing Integrations (KSA & Egypt)
- Tasks
  - KSA ZATCA Phase-2 APIs: CSR/CRT, clearance/reporting, e-archiving schema.
  - Egypt ETA clearance: document signing, statuses, error handling.
- Acceptance
  - Conformance tests pass; per-entity keys rotation; tamper-proof storage.

### Phase 9 — AI Agents (top nav)
- Tasks
  - Intake assistant: find missing docs; create checklists; answer compliance questions with citations.
  - Document classification and anomaly detection (VAT outliers, WHT edge cases).
- Acceptance
  - Human-in-the-loop approvals; drift monitoring; prompt/response logging without PII leakage.

### Phase 10 — Teams & Permissions (top nav "Teams")
- Tasks
  - Team spaces, shared views, read-only auditor links, masked-doc view.
- Acceptance
  - External auditor access is time-bound and read-only; redaction tools available.

### Phase 11 — Accessibility, Internationalization, Mobile
- Tasks
  - Full WCAG 2.2 AA, Arabic RTL layouts, responsive components, print-friendly returns.
- Acceptance
  - Axe clean runs; manual test scripts; RTL screenshots.

### Phase 12 — Analytics, SLAs, and Reporting
- Tasks
  - Operational dashboards: cycle-time, first-time-right, reminders efficacy.
  - Client reports: tax paid/collected, VAT position, Zakat/WHT summaries.
- Acceptance
  - SLOs defined; alerts wired; self-serve client reports.

### Phase 13 — Migration & Cutover
- Tasks
  - Data model migration; import legacy entities/docs; backfill registrations and calendars.
  - Dual-run with feature flags; rollback playbook.
- Acceptance
  - Reconciled counts; dry run success; <0.1% critical discrepancies.

### Phase 14 — Security & Compliance
- Tasks
  - 2FA/Step-up auth, IP allowlists, device approvals, encryption at rest, key rotation.
  - Country-specific data retention; SAR/erasure; detailed audit logs.
- Acceptance
  - Pen test issues remediated; DPA/ToS updates; incident response drills.

### Phase 15 — Go-Live & Post-Launch
- Tasks
  - Canary cohorts; support playbook; NPS + CSAT instrumentation; backlog grooming.
- Acceptance
  - KPI thresholds met; stabilization complete.

---

## 5A) Enterprise Architecture Addendum (Oracle Fusion / SAP–inspired)

This addendum elevates the portal to enterprise-grade parity with Oracle Fusion/SAP patterns while fitting our Next.js + Postgres stack.

- Master Data Management (MDM)
  - Domains: Parties (customers/suppliers/owners), Products/Services, TaxCodes, Units of Measure, BankAccounts, Branches/Locations, Chart-of-Categories for VAT mapping.
  - Golden-record with survivorship rules, duplicate detection, merge/unmerge audit, soft-delete with end-dating, versioned attributes.
  - Country overlays for attributes (e.g., TRN formats, activity codes), with governance workflows for critical changes.

- Workflow/BPM and Approval Matrix
  - State machines for Entities, KYC, Documents, Invoices, Bills, Returns, Payments.
  - Dynamic approvers by policy: role, amount thresholds, obligation type, country, SoD checks. Parallel/serial, delegation, vacation rules, escalations with SLAs.
  - Evidence bundles auto-attached to approvals (who/what/when/why) for audit.

- Policy/Rules Engine
  - Decision tables for: VAT rates/exemptions, ESR relevancy, UBO triggers, WHT applicability, filing calendar exceptions.
  - Rules stored as versioned JSON with testing harness and rollback. Admin UI to simulate decisions on sample data; every evaluation emits an auditable trace.

- Integration Hub (iPaaS-lite)
  - Connectors: Email inbox to Documents, SFTP, Webhooks, WhatsApp/SMS, ERP (generic CSV/JSON adapters), Government APIs (FTA, ZATCA, ETA), Payment processors.
  - Patterns: scheduled pulls, webhooks, idempotent writes, retry with backoff, DLQ + replay, schema validation, correlation IDs.
  - Monitoring: per-connector metrics, circuit breakers, tenant-level quotas and rate limits.

- Data Platform & Analytics
  - Operational store → warehouse (star schemas for filings, invoices, payments, documents, tasks). Slowly changing dimensions for entities and registrations.
  - Pre-built dashboards: compliance timeliness, VAT position, Zakat/WHT rollups, workload, SLA adherence. Export to CSV/PDF, scheduled email.
  - Data access governed via row/column policies; PII masking in BI extracts.

- IAM & Security (Enterprise)
  - SSO (SAML/OIDC), SCIM provisioning, step-up auth, device posture signals, session anomaly detection.
  - ABAC: policies on attributes (country, entity risk, data sensitivity). SoD libraries to prevent conflicting role assignments.
  - Key rotation, envelope encryption for credentials/certificates.

- GRC & Records Management
  - Retention schedules by artifact type/country, legal holds, e-discovery exports, immutable logs (hash chains), configurable data residency.

- Resilience & Performance
  - SLOs: availability 99.9%, p95 <250ms for reads, <800ms for critical writes. RTO ≤ 30m, RPO ≤ 5m.
  - Backups + PITR, regional failover design (optional), graceful degradation, feature kill switches.

- Globalization & Configuration
  - Multi-currency with FX rates source, fiscal calendars per country, localized number/date/dir (RTL), weekend patterns.

- Release & Change Management
  - Environments (dev/stage/prod), feature flag lifecycle, migration playbooks, change approvals with CAB logs, canary + phased rollouts.

- Testing Strategy (Enterprise)
  - Unit/integration/contract tests for adapters; synthetic monitoring; soak/load tests on filing spikes; chaos drills on registry outages.

- Deliverables
  - Data dictionary, event catalog, approval matrices, rules catalog, sequence diagrams, RACI for operations, runbooks per integration.

## 5B) Current App Inventory & Function Map (from code audit)

Routes (selected)
- Public: /, /about, /services, /blog, /contact, /login, /register, /forgot-password, /reset-password, /status, /sentry-example-page
- Portal: /portal, /portal/bookings, /portal/service-requests, /portal/settings, /portal/expenses/scan
- Admin: /admin with pages for analytics, audits, availability, bookings(+id/new), calendar, chat, clients, compliance, expenses, integrations, invoices(+sequences), monitoring, notifications, payments, perf-metrics, permissions, posts, profile, reminders, reports, security, service-requests(+id/new/edit/list), services(+id/list), settings (company, financial, integrations, languages, localization, security, system, tasks, team, timezones, user-management), shortcuts, tasks(+list/new), taxes, team, users(+list), workflows

API (major groups; many endpoints exist under src/app/api/...)
- Auth: next-auth, register, mfa enroll/verify/disable; user verification
- Public/Portal: posts, services(+slug), pricing, currencies, contact, newsletter, portal bookings/chat/realtime/service-requests, uploads
- Admin: analytics, audit-logs, availability-slots, booking-settings/bookings, bulk-operations, calendar, chat, client/communication/currencies/financial/security/settings, cron-telemetry, export, health/perf metrics, integrations, invoices(+pay), languages, menu customization, org-settings, permissions, realtime, regional-formats, reports, roles, search, sidebar-preferences, system/timezones/thresholds/updates, tasks(+templates/analytics/export/stream), team-management(+assignments/skills/workload), translations(analytics/discover/missing/priority/timeline), uploads quarantine, users(+stats/search/presets/activity/permissions/exports), workflows(+templates/ops/dry-run/simulate)
- Utilities: analytics/track, cron jobs, currencies/convert, expenses/ingest, payments (checkout/webhook/cod), security health/events, builder-io content

Services layer (src/services)
- Settings: admin/client/communication/cron-telemetry/financial/integration/security/services/system/team/user-management, booking-settings
- Domain: services.service, team-member.service, dashboard-metrics, approval-manager, notification-manager, audit-log/logging, bulk-operations, recommendation-engine, workflow builder/designer/executor, entity-relationship

Libraries (src/lib)
- Auth/RLS/tenant: auth, prisma-rls/tenant-guard, tenant-context/cookie, rbac/permission-engine
- Internationalization: i18n, server translations, language-registry
- Security: csrf, rate-limit, ip-allowlist/hash, step-up, mfa
- Integrations: payments/stripe, cache/redis, uploads-provider, builder-io config
- Compliance/Tasks: settings/registry, tasks adapters/utils, booking availability/pricing, cron schedulers (exchange/payments/reminders/rescan)
- Observability: sentry helpers, performance metrics, optimizations, query monitor

Components (selected)
- Portal: financial-dashboard, secure-document-upload, LiveChatWidget, OfflineQueueInspector
- Admin: extensive dashboards, analytics, settings shells, tables, forms, layout system
- UI kit: button, card, dialog, dropdown, select, tabs, etc.

Ops
- Netlify Functions: cron-payments-reconcile, cron-reminders, cron-translation-metrics, health-monitor, run-tenant-migrations, seed-tenant-defaults
- Scripts: RLS setup/rollout, migrations/seed utilities, admin-setup scripts, diagnostics (inspect/check/list), i18n tooling

Alignment
- The existing structure supports our modular plan: we will add portal/business-setup wizard, compliance widgets, and services directory on top of this foundation, reusing services, lib settings/registry, and UI kit.

## 6) Technical Blueprint

- Stack alignment
  - Next.js (already in repo) with API routes; Neon Postgres; Upstash Redis cache; Sentry.
  - Server-side validation layer per country; feature flags for phased enablement.
- Data model (high level)
  - Tenants, Entities, People, Registrations (TRN/ZATCA/ETA), Obligations, FilingPeriods, Tasks, Documents, Messages, Invoices, Payments, BankConnections, Transactions, EInvoiceDevices (KSA), Certificates (EGY), AuditLogs, Notifications.
- Integrations
  - Government: FTA (UAE, link-out + reference capture), ZATCA (KSA), ETA (Egypt).
  - Banking aggregators (region providers or Plaid-alternatives); storage with virus scanning; OCR.
  - Payments: Stripe-like processor for firm invoices; webhook verification and reconciliation.
- Security
  - RLS, encrypted fields (keys, certs), scoped API tokens per entity; end-to-end audit.

---

## 7) Acceptance Criteria (cross-cutting)

- Every client activity is traceable to a tenant/entity and appears in audit logs.
- All deadlines reflect correct regional calendars and daylight rules.
- Multilingual UI (Arabic/English) end-to-end including PDFs and emails.
- 99th percentile p95 < 400ms for portal core actions; Sentry error budget respected.

---

## 8) Success Metrics

- 50% reduction in time-to-complete VAT return (median) after rollout.
- 80%+ of required evidence auto-detected or proactively requested pre-review.
- <2% overdue filings among active clients with notifications enabled.
- NPS ≥ 45; CSAT ≥ 4.6/5 for support tickets.

---

## 9) Risks & Mitigations

- Government API volatility → Versioned adapters; automated contract tests; feature flags.
- Bank aggregation gaps → CSV fallback + manual workflows.
- Data privacy across countries → Residency-aware storage options; configurable retention.
- AI hallucinations → Guardrails, retrieval with citations, reviewer gates.

---

## 10) Timeline (indicative)

- Q1: Phases 0–2
- Q2: Phases 3–6
- Q3: Phases 7–9
- Q4: Phases 10–15 and global hardening

---

## 11) Backlog / Nice-to-Have

- Mobile receipts app; auto-categorization tuned for local merchants.
- Supplier portal for VAT-compliant invoice uploads.
- Partner APIs for accountants and ERPs.

---

## 12) MCP Integrations to consider

Use the platform’s MCP connectors to accelerate setup. You can connect integrations from the MCP popover.

- Supabase — authentication and database primitives; real-time subscriptions.
- Neon — serverless Postgres for data storage.
- Netlify — hosting/CDN for static assets or marketing site.
- Zapier — automate reminders, move docs across apps.
- Figma — design-to-code; accelerate RTL/Arabic UI work.
- Builder CMS — public content and help center management.
- Linear — convert this plan into tickets; track delivery.
- Notion — documentation hub synced with portal knowledge base.
- Sentry — production monitoring and error tracking.
- Context7 — up-to-date framework docs during development.
- Semgrep — security scanning and CI enforcement.
- Stripe — billing and payments for firm invoices.
- Prisma Postgres — schema and ORM management backed by Postgres.

---

## 13) Next Steps

- Approve scope and priorities per country.
- Create tickets per phase and enable feature flags.
- Prepare design sprint for Dashboard, Entities/People, and Documents.
- Begin Phase 0 technical hardening and i18n/RTL.
