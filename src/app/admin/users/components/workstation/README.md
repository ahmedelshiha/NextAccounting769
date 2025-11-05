# Workstation Components

This directory contains the redesigned admin users dashboard, implementing an Oracle Fusion-inspired 3-column workstation layout.

## Architecture

```
WorkstationLayout (Main Container)
├── WorkstationSidebar (Left, 280px fixed)
├── WorkstationMainContent (Center, flexible)
└── WorkstationInsightsPanel (Right, 300px fixed)
```

## Components

### WorkstationLayout
Main container component that sets up the 3-column grid layout with responsive breakpoints.

**Props:**
- `sidebar: ReactNode` - Content for left sidebar
- `main: ReactNode` - Content for main area
- `insights: ReactNode` - Content for insights panel
- `sidebarWidth?: number` - Custom sidebar width (default: 280px)
- `insightsPanelWidth?: number` - Custom insights width (default: 300px)

**Responsive Behavior:**
- Desktop (≥1400px): Full 3-column layout
- Tablet (768px-1399px): Sidebar as drawer, main + insights
- Mobile (<768px): Sidebar as drawer, main fullwidth, insights hidden

### WorkstationSidebar
Left sidebar containing quick stats, saved views, and filters.

**Sections:**
1. Quick Stats - Real-time statistics cards
2. Saved Views - Filter preset buttons
3. Filters - Advanced filter controls
4. Footer - Reset filters button

### WorkstationMainContent
Main working area with user management controls and directory table.

**Sections:**
1. Quick Actions - Add, Import, Export, Refresh buttons
2. Metrics - Overview cards (Total, Pending, In Progress, Due)
3. User Directory - Searchable user table with virtual scrolling
4. Pagination - Page controls

### WorkstationInsightsPanel
Right panel with analytics and recommendations (collapsible).

**Sections:**
1. User Growth - Line chart
2. Role Distribution - Pie/donut chart
3. Department Distribution - Bar chart
4. Recommended Actions - Action cards (scrollable)

## Styling

### CSS Files
- `workstation-layout.css` - Grid layout and responsive styles
- `workstation-styles.css` - Component-specific styles

### CSS Variables Used
- `--background` - Page background
- `--card` - Card/panel background
- `--border` - Border color
- `--foreground` - Text color
- `--muted` - Muted background
- `--muted-foreground` - Muted text
- `--radius-md` - Border radius

### Responsive Breakpoints (via CSS)
```css
Desktop: 1400px+
Tablet: 768px - 1399px
Mobile: < 768px
```

## State Management

### WorkstationContext
Centralized state for the entire workstation layout.

**State:**
- `sidebarOpen: boolean` - Sidebar visibility (drawer on mobile)
- `insightsPanelOpen: boolean` - Insights panel visibility
- `filters: UserFilters` - Active filters
- `quickStats: QuickStatsData` - Real-time statistics
- `selectedUserIds: Set<string>` - Selected users for bulk actions
- `bulkActionType: string` - Current bulk action
- `bulkActionValue: string` - Bulk action parameter value

**Methods:**
- `setSidebarOpen(open: boolean)`
- `setInsightsPanelOpen(open: boolean)`
- `setFilters(filters: UserFilters)`
- `refreshQuickStats(): Promise<void>`
- `setSelectedUserIds(ids: Set<string>)`
- `applyBulkAction(): Promise<void>`

### Using the Context

```typescript
import { useContext } from 'react'
import { WorkstationContext } from '../contexts/WorkstationContext'

export function MyComponent() {
  const { sidebarOpen, setSidebarOpen, filters } = useContext(WorkstationContext)
  
  return (
    <button onClick={() => setSidebarOpen(!sidebarOpen)}>
      Toggle Sidebar
    </button>
  )
}
```

Or use the custom hook:

```typescript
import { useWorkstationLayout } from '../hooks/useWorkstationLayout'

export function MyComponent() {
  const { sidebarOpen, setSidebarOpen, isDesktop } = useWorkstationLayout()
  
  return (
    <div>
      {isDesktop && <p>Desktop view</p>}
    </div>
  )
}
```

## Integration Points

### Existing Components to Integrate

**Phase 1.2 - Sidebar:**
- `QuickStatsCard` - Real-time stats display
- `SavedViewsButtons` - Filter presets
- `AdvancedUserFilters` - Filter controls

**Phase 1.3 - Main Content:**
- `QuickActionsBar` - Action buttons
- `OperationsOverviewCards` - Metrics cards
- `UsersTable` - User list with virtual scrolling
- `BulkActionsPanel` - Bulk operation controls

**Phase 1.4 - Insights Panel:**
- `AnalyticsCharts` - (lazy loaded) Charts and graphs
- `RecommendedActionsPanel` - Action recommendations

### Data Flow

```
WorkstationProvider
├── WorkstationLayout
│   ├── WorkstationSidebar
│   │   ├── QuickStatsCard (useWorkstationLayout)
│   │   ├── SavedViewsButtons (useWorkstationLayout)
│   │   └── AdvancedUserFilters (useWorkstationLayout)
│   ├── WorkstationMainContent
│   │   ├── QuickActionsBar (useWorkstationLayout)
│   │   ├── OperationsOverviewCards (useWorkstationLayout)
│   │   └── UsersTable (useWorkstationLayout)
│   └── WorkstationInsightsPanel
│       ├── AnalyticsCharts (lazy loaded)
│       └── RecommendedActionsPanel (useWorkstationLayout)
```

## Testing

### Test Files
- `__tests__/WorkstationLayout.test.tsx` - Layout component tests
- `__tests__/WorkstationSidebar.test.tsx` - Sidebar tests
- `__tests__/integration.test.tsx` - Integration tests

### Running Tests

```bash
# Run all workstation tests
pnpm test src/app/admin/users/components/workstation

# Run specific test file
pnpm test WorkstationLayout.test.tsx

# Run with coverage
pnpm test -- --coverage workstation
```

### Test Coverage Goals
- Unit tests: 80%+ coverage per component
- Integration tests: Critical user flows
- E2E tests: Complete user journeys

## Performance Considerations

### Lazy Loading
- `AnalyticsCharts` - Lazy loaded with Suspense fallback
- Insights panel content loads on demand

### Memoization
- All components wrapped with `React.memo()` to prevent unnecessary re-renders
- Custom hooks implement proper dependency arrays

### Virtual Scrolling
- `UsersTable` uses React Window for handling 1000+ users without performance impact
- Row height: 48px

### Caching
- Quick stats cached with 1-minute dedupe, 5-minute throttle
- URL-based filter persistence for instant restoration

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- Tab: Navigate between sections
- Arrow keys: Navigate within tables and lists
- Escape: Close sidebar drawer (mobile)
- Enter: Activate buttons and links

### Screen Reader
- Semantic HTML structure (nav, main, aside)
- ARIA labels on interactive elements
- Live regions for stats updates

### Focus Management
- Focus trap in sidebar drawer (mobile)
- Visible focus indicators on all interactive elements
- Skip to main content link

### Color & Contrast
- Text contrast ratio: 4.5:1 minimum
- No information conveyed by color alone
- Supports high contrast mode

## Feature Flags

The workstation is controlled by environment variables:

```bash
# Enable the workstation redesign
NEXT_PUBLIC_WORKSTATION_ENABLED=true

# Enable detailed logging
WORKSTATION_LOGGING_ENABLED=true

# Enable performance tracking
WORKSTATION_PERF_TRACKING=true
```

## Browser Support

- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+
- Mobile Safari (iOS 17+)
- Chrome Mobile (Android)

## Development Phases

- **Phase 1** ✅: Foundation - Layout and responsive design
- **Phase 2**: Integration - Component composition and state
- **Phase 3**: Insights - Analytics and charts
- **Phase 4**: Polish - Mobile UX, accessibility, performance
- **Phase 5**: Testing - Unit, integration, E2E tests
- **Phase 6**: Deployment - Feature flag and gradual rollout

## Related Documentation

- [Implementation Roadmap](../../../docs/ADMIN_USERS_WORKSTATION_IMPLEMENTATION_ROADMAP.md)
- [Design Specification](../../../docs/ADMIN_USERS_SINGLE_PAGE_WORKSTATION_REDESIGN.md)
- [Quick Start Guide](../../../docs/ADMIN_USERS_WORKSTATION_QUICK_START.md)
- [Audit Summary](../../../docs/ADMIN_USERS_AUDIT_SUMMARY.md)
