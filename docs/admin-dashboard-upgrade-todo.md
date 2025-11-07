# NextAccounting Admin Dashboard Upgrade TODO

## Guideline Alignment Overview
- [ ] Follow `docs/NextAccounting Admin Dashboard.md` §1–§15 for architectural, UX, performance, security, and accessibility directives.
- [ ] Apply `docs/NextAccounting Admin Dashboard Moderniza.md` Phase plans (Foundation, Experience Modernization, Personalization, Hardening) when sequencing deliverables.
- [ ] Cross-reference `docs/admin-dashboard-structure-audit.md` route/component inventory to validate coverage and avoid regressions.

## 1. Program Charter & Guardrails
- [ ] Confirm modernization goals align with QuickBooks, Notion, and Linear UX benchmarks defined in `docs/NextAccounting Admin Dashboard.md` §1.3 and `docs/NextAccounting Admin Dashboard Moderniza.md` Executive Summary.
- [ ] Confirm modernization goals align with QuickBooks, Notion, and Linear UX benchmarks.
- [ ] Lock success metrics: ≥20% bundle reduction, Lighthouse ≥90 Performance/Accessibility/Best Practices, WCAG 2.1 AA compliance, P99 API latency < 400 ms.
- [ ] Define release cadence (10-week roadmap) and checkpoint demos at end of each phase.
- [ ] Publish communication plan covering engineering, design, QA, support, and stakeholder updates.
- [ ] Establish rollback strategy and dependency freeze windows for risky rollouts.

## 2. Discovery & Planning (Week 0)
- [ ] Audit current Admin KPIs (usage analytics, hot routes, pain points) to prioritize navigation placement.
- [ ] Validate feature inventory against `docs/NextAccounting Admin Dashboard.md` and `docs/NextAccounting Admin Dashboard Moderniza.md` to ensure no scope gaps.
- [ ] Inventory all admin routes (per `docs/admin-dashboard-structure-audit.md`) and map each to navigation IDs.
- [ ] Confirm backend readiness for new aggregate endpoints, menu customization tables, and health checks.
- [ ] Prepare design references and component specs for QuickBooks-inspired patterns (sidebar, footer, dropdowns).

## 3. Phase 1 – Foundation & Cleanup (Weeks 1–2)
### 3.1 Environment & Tooling
- [ ] Create dedicated feature branch and upgrade pipeline automation.
- [ ] Install required dependencies (`@dnd-kit/*`, Radix primitives, `react-hotkeys-hook`, testing libraries, accessibility tooling).
- [ ] Update package scripts for targeted unit, integration, e2e, and accessibility test runs.
- [ ] Mirror `docs/NextAccounting Admin Dashboard Moderniza.md` Task 1.1 environment checklist to ensure parity.

### 3.2 Legacy Layout Removal
- [ ] Locate and remove `app/admin/layout-nuclear.tsx` and `app/admin/page-nuclear.tsx` plus any residual imports.
- [ ] Replace legacy references with canonical layout exports.
- [ ] Verify build after removal and run smoke tests on `/admin/*` routes.
- [ ] Satisfy architecture clean-up goals from `docs/NextAccounting Admin Dashboard.md` §3.1 and Moderniza Task 1.2.

### 3.3 Navigation Registry Consolidation
- [ ] Implement `src/lib/admin/navigation-registry.ts` with full section/item metadata (labels, icons, permissions, badges, keywords, descriptions).
- [ ] Remove hardcoded arrays from `AdminSidebar`, breadcrumbs, search, and any duplicated navigation definitions.
- [ ] Ensure registry eliminates stale entries (e.g., remove Invoices “Templates” link) and normalizes URLs.
- [ ] Add Jest/Vitest coverage for item lookup, permission filtering, search, breadcrumbs, favorites, and recent history utilities.
- [ ] Align navigation model with consolidation requirements in `docs/NextAccounting Admin Dashboard.md` §3.2–§3.3 and Moderniza Task 1.3.

### 3.4 Layout Store Unification
- [ ] Consolidate `adminLayoutStore`, `adminLayoutStoreHydrationSafe`, and `adminLayoutStoreSSRSafe` into a single Zustand store (`src/stores/admin/layout.store.ts`).
- [ ] Preserve persisted keys (sidebar width, collapsed state, expanded groups, favorites, recent items) with hydration guards.
- [ ] Refactor selectors (`useSidebarState`, `useNavigationState`, `useUIState`, etc.) to prevent unnecessary re-renders.
- [ ] Delete obsolete store files and update all imports across components/pages/tests.
- [ ] Execute per state management guidance in `docs/NextAccounting Admin Dashboard.md` §3.3 Problem 3 and Moderniza Task 1.4.

### 3.5 Layout Architecture Refactor
- [ ] Rebuild admin layout flow: `app/admin/layout.tsx` (server auth) → `AdminLayoutClient` → `AdminLayoutShell`.
- [ ] Introduce `AdminLayoutProvider` (for session, responsive state, data providers) and `AdminLayoutSkeleton` for suspense fallbacks.
- [ ] Remove `ClientOnlyAdminLayout` and `AdminDashboardLayoutLazy` once shell is in place.
- [ ] Resolve existing hydration mismatches (localStorage access, responsive detection, persisted stores).
- [ ] Match unified architecture blueprint in `docs/NextAccounting Admin Dashboard.md` §3.1 Problem 1–2 and Moderniza Task 1.5.

### 3.6 Data Model & API Preparation
- [ ] Add Prisma models for `MenuCustomization`, `NavigationFavorite`, `UserPreferences`, and `AuditLog` per modernization spec.
- [ ] Create migration scripts and update Prisma Client.
- [ ] Define seed scripts or defaults for menu customization and preferences.
- [ ] Document schema changes and coordinate with DBA/ops teams.
- [ ] Trace requirements to `docs/NextAccounting Admin Dashboard.md` §3.3 and Moderniza Task 1.6.

## 4. Phase 2 – Experience Modernization (Weeks 3–5)
### 4.1 Collapsible & Resizable Sidebar
- [ ] Build QuickBooks-inspired sidebar structure with dedicated subcomponents (`SidebarHeader`, `SidebarNav`, `SidebarFooter`, `SidebarResizer`).
- [ ] Support modes: expanded, collapsed, mobile overlay, and resizable desktop widths (160 – 420 px).
- [ ] Persist sidebar width/collapse settings and sync with keyboard shortcuts (`mod+b`, `mod+[`, `mod+]`).
- [ ] Add responsive breakpoints using `useResponsive` and ensure smooth transitions.
- [ ] Provide accessible labels, focus management, and tooltips for collapsed items.
- [ ] Deliver design and behavior parity with `docs/NextAccounting Admin Dashboard.md` §4.1 and Moderniza Task 2.1.

### 4.2 Navigation Enhancements
- [ ] Integrate registry-driven rendering with permission-aware sections and dynamic badges.
- [ ] Implement drag-and-drop favorites/reordering hooks to feed customization workflows.
- [ ] Ensure breadcrumbs, quick search, and recently visited panels all source from registry utilities.
- [ ] Mirror interaction patterns described in `docs/NextAccounting Admin Dashboard.md` §3.2��§3.3 and Moderniza Task 2.2.

### 4.3 Header & User Profile Experience
- [ ] Replace legacy “Preview Admin” header content with breadcrumbs, global actions, tenant switcher, notifications, and new profile dropdown.
- [ ] Implement `UserProfileDropdown` with avatar fallbacks, role labels, account/setting shortcuts, theme switcher, status indicator, and sign-out.
- [ ] Add status presence tracking (`online`, `away`, `busy`) tied to user activity.
- [ ] Ensure keyboard navigation and ARIA roles for dropdown interactions.
- [ ] Implement per `docs/NextAccounting Admin Dashboard.md` §4.2 directives and Moderniza Task 2.4.

### 4.4 Footer & System Health Surface
- [ ] Create `/api/admin/system/health` endpoint checking database latency and future subsystems.
- [ ] Build responsive footer with product info, system status pill, quick links, version metadata, and copyright.
- [ ] Poll health endpoint every 60 s with graceful degradation handling.
- [ ] Match health visibility expectations in `docs/NextAccounting Admin Dashboard.md` §4.4 and Moderniza Task 2.5.

### 4.5 Admin Data Provider & Fetch Optimization
- [ ] Replace scattered `useUnifiedData` calls with `AdminDataProvider` aggregating stats via `/api/admin/stats/overview`.
- [ ] Ensure SWR deduplication, refresh intervals, and real-time hooks reduce redundant network calls by ≥60%.
- [ ] Update dashboards, sidebar badges, and analytics widgets to consume provider hooks (`useAdminStats`, `useAdminCounts`).
- [ ] Follow shared data flow recommendations in `docs/NextAccounting Admin Dashboard.md` §3.3 Data Fetching Optimization and Moderniza Task 2.5.

### 4.6 Settings Drawer & Quick Actions
- [ ] Design and implement global settings drawer accessible from header/footer, surfacing Favorites, Recently Updated, keyboard shortcuts, and command palette entry points.
- [ ] Integrate registry metadata to populate drawer sections and maintain consistency with sidebar customization.
- [ ] Ensure parity with quick-command vision outlined in `docs/NextAccounting Admin Dashboard.md` §4.6 and Moderniza Phase 2 scope.

## 5. Phase 3 – Personalization & Advanced Features (Weeks 6–8)
### 5.1 Menu Customization Workflow
- [ ] Implement backend APIs (`GET/PUT/DELETE /api/admin/menu/customization`) with Zod validation and permission checks.
- [ ] Build `MenuCustomizationModal` using `@dnd-kit` sortable lists for section/item ordering and visibility toggles.
- [ ] Persist customizations per user, broadcast updates (`window.dispatchEvent('menu:updated')`), and sync sidebar state on changes.
- [ ] Provide “Reset to default” pathway and optimistic UI feedback via toast notifications.
- [ ] Adhere to personalization plan in `docs/NextAccounting Admin Dashboard.md` §4.1 Sidebar Customization (Opportunity Areas) and Moderniza Task 3.1–3.2.

### 5.2 Favorites & Recently Visited
- [ ] Store favorites/recent routes in `NavigationFavorite` table plus local cache fallback for quick reads.
- [ ] Surface favorites in sidebar footer and command palette.
- [ ] Track recently visited items (max 10) with storage reconciliation between server and client.
- [ ] Implement per personalization directives in `docs/NextAccounting Admin Dashboard.md` §2.5 and Moderniza Task 3.1.

### 5.3 Settings Experience Expansion
- [ ] Audit `SETTINGS_REGISTRY` to cover all settings pages and ensure metadata completeness (icon, description, keywords).
- [ ] Add missing panels highlighted in structure audit: Audit Logs, MFA management, Rate Limiting, Sentry integration toggles, Reminder concurrency controls.
- [ ] Enhance `SettingsShell` with global search shortcut, save state indicators, and export/import controls leveraging existing API routes.
- [ ] Align with modernization blueprint in `docs/NextAccounting Admin Dashboard.md` §5 and Moderniza Task 3.3.

### 5.4 Real-Time & Notifications Refinement
- [ ] Limit SSE/WebSocket subscriptions to relevant modules via scoped `RealtimeProvider` contexts.
- [ ] Convert heavy real-time features (e.g., chat, tasks) to lazy-loaded modules using dynamic imports.
- [ ] Ensure badge counts and notifications respect customization visibility and permission scopes.
- [ ] Follow performance guidance in `docs/NextAccounting Admin Dashboard.md` §2.4–§3.3 and Moderniza Task 3.4.

## 6. Phase 4 – Performance, Accessibility, & Hardening (Weeks 9–10)
### 6.1 Performance Optimization
- [ ] Tree-shake Lucide icons (use explicit imports) and split vendor bundle where possible.
- [ ] Introduce route-level code splitting for analytics/tasks heavy components.
- [ ] Defer non-critical scripts (e.g., monitoring widgets) and enable React Suspense boundaries.
- [ ] Measure bundle size before/after to confirm ≥20% reduction.
- [ ] Satisfy performance goals from `docs/NextAccounting Admin Dashboard.md` §2.5 and Moderniza Phase 4 objectives.

### 6.2 Accessibility & Internationalization
- [ ] Run axe and manual audits to achieve WCAG 2.1 AA (focus traps, contrast, keyboard flows, aria labels).
- [ ] Ensure RTL support for localized layouts, particularly in sidebar and header components.
- [ ] Update locale files for new strings (en, ar, hi) and provide keys for customization UI.
- [ ] Meet accessibility parameters listed in `docs/NextAccounting Admin Dashboard.md` §11 and Moderniza Phase 4 checklist.

### 6.3 Security & Compliance
- [ ] Enforce permission checks on all new APIs (aggregation, menu customization, health checks).
- [ ] Add audit logging for menu changes, personalization updates, and critical admin actions.
- [ ] Review CSP and Sentry configurations to include new endpoints/components.
- [ ] Validate persistence layer sanitization (menu customization JSON) and rate-limit endpoints where appropriate.
- [ ] Implement per security directives in `docs/NextAccounting Admin Dashboard.md` §10 and Moderniza Phase 4.

### 6.4 Testing & QA Strategy
- [ ] Expand unit tests for layout store, navigation registry, data provider, and menu customization workflows.
- [ ] Add Playwright e2e coverage for critical admin paths (sidebar interactions, customization modal, profile dropdown, settings drawer, responsive breakpoints).
- [ ] Integrate accessibility checks (`@axe-core/playwright`) into CI.
- [ ] Implement regression tests for permission-based navigation and localization toggles.
- [ ] Follow testing strategy outlined in `docs/NextAccounting Admin Dashboard.md` §8 and Moderniza Phase 4 guidance.

### 6.5 Deployment & Migration
- [ ] Produce migration guide outlining rollout steps, fallback toggles, and support playbook.
- [ ] Schedule staged deployment (internal beta → pilot tenants → full rollout) with telemetry monitoring.
- [ ] Update documentation (`docs/NextAccounting Admin Dashboard*.md`) to reflect final architecture and user workflows.
- [ ] Capture post-launch metrics and compare against success criteria.
- [ ] Execute per migration instructions in `docs/NextAccounting Admin Dashboard.md` §13–§14 and Moderniza Phase 4 deliverables.

## 7. Cross-Cutting Workstreams
- [ ] Maintain design tokens and existing visual styles while introducing new patterns (no regressions in color/shape).
- [ ] Coordinate content updates for help docs and in-app onboarding.
- [ ] Align analytics tracking with new navigation paths and UI elements.
- [ ] Ensure support and success teams receive enablement materials before public rollout.
- [ ] Cross-verify with cross-functional guidelines in `docs/NextAccounting Admin Dashboard.md` §1.4, §7, and Moderniza cross-stream notes.

## 8. Tracking & Reporting
- [ ] Use this TODO as the canonical implementation checklist; update statuses at least twice per week.
- [ ] Log notable decisions, scope changes, and risks in project tracker.
- [ ] Highlight blockers needing stakeholder input (dependencies, backend readiness, design feedback).
- [ ] Archive artifacts (wireframes, diagrams, benchmarks) in project knowledge base upon completion.
- [ ] Reflect reporting cadence defined in `docs/NextAccounting Admin Dashboard.md` §1.4 Timeline & Budget and Moderniza project governance.
