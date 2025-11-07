# Admin Dashboard Structure Diagram (Mermaid)

Below is a Mermaid diagram that visualizes the primary layout, pages, components, stores, hooks, and data flows for the admin dashboard.

```mermaid
flowchart TD
  %% Layout stack
  subgraph LayoutStack[Admin Layout Stack]
    AL["📄 src/app/admin/layout.tsx\nAdminLayout (server)"]
    COL["🧩 src/components/admin/layout/ClientOnlyAdminLayout.tsx\nClientOnlyAdminLayout (client)"]
    ADL["���� src/components/admin/layout/AdminDashboardLayout.tsx\nAdminDashboardLayout"]
  end

  AL --> COL --> ADL

  %% Core layout children
  ADL --> Sidebar["🧩 AdminSidebar\nsrc/components/admin/layout/AdminSidebar.tsx"]
  ADL --> Header["🧩 AdminHeader\nsrc/components/admin/layout/AdminHeader.tsx"]
  ADL --> Footer["🧩 AdminFooter\nsrc/components/admin/layout/AdminFooter.tsx"]
  ADL --> EB["🧩 AdminErrorBoundary\nsrc/components/admin/layout/AdminErrorBoundary.tsx"]

  %% Pages (top-level)
  subgraph Pages[/admin/* routes]
    Overview["📄 /admin\nAdminOverview\nsrc/app/admin/page.tsx"]
    Analytics["📄 /admin/analytics\nsrc/app/admin/analytics/page.tsx"]
    Bookings["📄 /admin/bookings\nsrc/app/admin/bookings/page.tsx"]
    BookingsNew["📄 /admin/bookings/new\n.../new/page.tsx"]
    BookingId["📄 /admin/bookings/[id]\n.../[id]/page.tsx"]
    Services["📄 /admin/services\nsrc/app/admin/services/page.tsx"]
    ServiceId["📄 /admin/services/[id]\n.../[id]/page.tsx"]
    Tasks["📄 /admin/tasks\nsrc/app/admin/tasks/page.tsx"]
    ServiceRequests["📄 /admin/service-requests\n.../page.tsx"]
    Invoices["📄 /admin/invoices\nsrc/app/admin/invoices/page.tsx"]
    SettingsRoot["📄 /admin/settings\nsrc/app/admin/settings/page.tsx\n(SettingsOverview)"]
    SettingsGroup["📄 /admin/settings/*\nsrc/app/admin/settings/...
(uses SettingsShell)"]
    Team["📄 /admin/team\nsrc/app/admin/team/page.tsx"]
    Users["📄 /admin/users\nsrc/app/admin/users/page.tsx"]
  end

  %% Connect pages to layout
  ADL --> Pages
  ADL --> Overview
  ADL --> Analytics
  ADL --> Bookings
  ADL --> Services
  ADL --> Tasks
  ADL --> ServiceRequests
  ADL --> Invoices
  ADL --> SettingsRoot
  SettingsRoot --> SettingsGroup

  %% Component composition example
  Overview --> AnalyticsTemplate["🧩 AnalyticsPage Template\ncomponents/dashboard/templates/AnalyticsPage"]
  AnalyticsTemplate --> PerfCard["🧩 PerformanceMetricsCard\nsrc/components/admin/analytics/PerformanceMetricsCard.tsx"]
  AnalyticsTemplate --> Feed["🧩 IntelligentActivityFeed\ncomponents/dashboard/analytics/IntelligentActivityFeed"]

  %% Hooks & stores
  Sidebar --> AdminLayoutStore["🧠 AdminLayoutStore (Zustand)\nsrc/stores/adminLayoutStore.ts"]
  ADL --> AdminLayoutStore
  PerfCard --> usePerformanceAnalytics["⚙️ usePerformanceAnalytics\nsrc/hooks/admin/usePerformanceAnalytics.ts"]
  AdminLayoutStore -.-> localStorage["localStorage\n(admin:sidebar:width, admin:sidebar:collapsed, admin:sidebar:expanded)"]

  %% Data & realtime flow
  subgraph DataFlow[Data & Realtime]
    API["API /api/admin/* routes"]
    Realtime["RealtimeProvider / SSE / Websocket\nsrc/lib/realtime-*.ts"]
    useUnified["⚙️ useUnifiedData\nsrc/hooks/useUnifiedData.ts (SWR + revalidate) "]
  end

  API --> useUnified --> PerfCard
  API --> useUnified --> Sidebar
  Realtime --> useUnified
  Realtime --> AdminLayoutStore

  %% Permission gating and utilities
  PermissionGate["🧠 PermissionGate\ncomponents/PermissionGate.tsx"]
  Sidebar -->|gates items via| PermissionGate
  Pages -->|wraps protected pages| PermissionGate

  %% Notes and cross-cutting
  classDef note fill:#f9f,stroke:#333,stroke-width:1px
  Note1["🔁 Recommendation: centralize sidebar registry & normalize useUnifiedData keys"]:::note
  AdminLayoutStore --> Note1
  useUnified --> Note1

``` 

How do you want the diagram delivered next?
- I can embed this Mermaid diagram into a docs page (already created here) and also export a PNG/SVG snapshot via the running preview.
- Or I can add a generated Mermaid .mmd file and a rendered PNG in a PR.

Which option do you prefer? (PNG/SVG export, PR, or inline in repo docs)
