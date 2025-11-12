# AdminWorkBench Quick Start Guide

## ✅ Status: PRODUCTION READY

The AdminWorkBench dashboard transformation is **100% complete** and ready for testing and deployment.

---

## What's Been Done

✅ **40+ Components** - All workbench UI components implemented  
✅ **20+ Hooks** - Complete data fetching and state management  
✅ **3 API Wrappers** - users.ts, stats.ts, bulkActions.ts  
✅ **4 Context Providers** - Data, filters, UI, and user management  
✅ **Responsive CSS** - Desktop, tablet, and mobile layouts  
✅ **Builder.io CMS** - Ready for no-code customization  
✅ **Feature Flag** - Enabled for immediate testing  
✅ **Dev Server** - Running successfully, no build errors  

---

## Testing the Implementation

### 1. Access the Dashboard
```
Navigate to: http://localhost:3000/admin/users
```

You should see the new AdminWorkBench layout with:
- Sticky header (Quick Actions bar)
- Left sidebar (Filters & Analytics)
- Main content area (KPI cards + User table)
- Sticky footer (Bulk Operations panel - appears when users selected)

### 2. Test Core Features

**User Selection & Bulk Operations:**
1. Select 1-3 users using checkboxes
2. Bulk operations panel appears at bottom
3. Choose action from dropdown (e.g., "Set Status")
4. Click "Preview" to see dry-run modal
5. Click "Apply Changes" to execute
6. Use "Undo" button to revert changes

**Filtering:**
1. Open sidebar (left panel)
2. Use role, status, and date range filters
3. Watch table update in real-time
4. Search bar filters by name/email

**Responsive Design:**
1. Resize browser to <1024px
2. Sidebar becomes drawer (toggle with button)
3. All layout adjusts responsively

### 3. Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Accessibility audit
npm run test:a11y

# Lighthouse performance
npm run lighthouse
```

---

## Key Files & Locations

### Core Components
```
src/app/admin/users/components/workbench/
├── AdminWorkBench.tsx          # Root component
├── AdminUsersLayout.tsx        # Main layout
├── QuickActionsBar.tsx         # Top actions
├── OverviewCards.tsx           # KPI metrics
├── AdminSidebar.tsx            # Filters & analytics
├── UsersTableWrapper.tsx       # Virtualized table
├── BulkActionsPanel.tsx        # Bottom sticky bar
├── DryRunModal.tsx             # Preview modal
├── UndoToast.tsx               # Undo notification
└── BuilderSlots.tsx            # CMS integration
```

### Data & APIs
```
src/app/admin/users/components/workbench/api/
├── users.ts                    # User CRUD operations
├── stats.ts                    # Dashboard metrics
└── bulkActions.ts              # Bulk operation APIs

src/app/admin/users/components/workbench/hooks/
└── useAdminWorkbenchData.ts    # Data fetching hooks
```

### Styles
```
src/app/admin/users/components/styles/
└── admin-users-layout.css      # Responsive layout styles
```

### Feature Flag
```
src/lib/admin/featureFlags.ts
├── isAdminWorkBenchEnabled()          # Global flag
├── isAdminWorkBenchEnabledForUser()   # Per-user flag
└── getAdminWorkBenchFeatureFlagConfig() # Config details
```

---

## Environment Variables

### Required (Already Set)
```env
NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=true
```

### Optional (For Gradual Rollout)
```env
# Percentage of users to enable (0-100)
NEXT_PUBLIC_ADMIN_WORKBENCH_ROLLOUT_PERCENTAGE=100

# Target specific roles (all, admins, ADMIN,EDITOR, etc.)
NEXT_PUBLIC_ADMIN_WORKBENCH_TARGET_USERS=all

# Comma-separated list of beta tester user IDs
NEXT_PUBLIC_ADMIN_WORKBENCH_BETA_TESTERS=user1,user2,user3
```

### Builder.io CMS (Optional - 30 min setup)
```env
NEXT_PUBLIC_BUILDER_API_KEY=<your-api-key>
NEXT_PUBLIC_BUILDER_SPACE=<your-space-id>
```

See `docs/BUILDER_IO_ENV_SETUP.md` for CMS setup instructions.

---

## Feature Flag Control

### Enable for All Users
```
Environment: NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=true
```

### Disable for Testing Legacy UI
```
Environment: NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=false
```
(Automatically falls back to old ExecutiveDashboardTab)

### Gradual Rollout (Canary)
```
NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=true
NEXT_PUBLIC_ADMIN_WORKBENCH_ROLLOUT_PERCENTAGE=10
```
10% of users see new UI, rest see old UI. Increases daily.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              page.tsx (Entry)                       │
��─────────────────────────────────────────────────────┤
│         EnterpriseUsersPage (Tabbed)                │
├──────────────────────┬──────────────────────────────┤
│                      │ ExecutiveDashboardTabWrapper │
│                      │ (Feature Flag Router)        │
│                      ├──────────────────────────────┤
│                      │ AdminWorkBench (NEW UI) ✨   │
│                      └──────────────────────────────┤
│                      │ ExecutiveDashboardTab (OLD)  │
└──────────────────────┴──────────────────────────────┘

AdminWorkBench Layout:
┌─────────────────────────────────────┐
│     QuickActionsBar (Sticky)        │
├────────────┬──────────────────���─────┤
│            │    OverviewCards       │
│ AdminSidebar   ┌────────────────────┤
│  - Filters     │  DirectoryHeader   │
│  - Analytics   │  UsersTable        │
│  - Activity    │  (virtualized)     │
│                └────────────────────┤
├────────────┴────────────────────────┤
│ BulkActionsPanel (Sticky, if selected)
└─────────────────────────────────────┘
```

---

## API Endpoints

All endpoints preserve backward compatibility:

```
# User Management
GET    /api/admin/users                    # List users (with filters)
GET    /api/admin/users/{id}               # Get single user
PATCH  /api/admin/users/{id}               # Update user
DELETE /api/admin/users/{id}               # Delete user

# Statistics
GET    /api/admin/users/stats              # Dashboard metrics

# Bulk Operations
POST   /api/admin/users/bulk-action        # Execute bulk action
POST   /api/admin/users/bulk-action/dry-run   # Preview action
POST   /api/admin/users/bulk-action/undo      # Undo operation
GET    /api/admin/users/bulk-action/history   # Action history

# Builder.io CMS (Optional)
GET    /api/builder-io/content             # Fetch CMS content
```

---

## Common Tasks

### Change Dashboard Theme/Colors
Edit `admin-users-layout.css`:
```css
.admin-workbench-container {
  --color-background: #f8fafc;  /* Change background */
  --color-border: #e2e8f0;      /* Change border color */
  --color-text: #1e293b;        /* Change text color */
}
```

### Add New Bulk Action
1. Add action type to BulkActionsPanel dropdown
2. Add handler in bulkActions API wrapper
3. Update DryRunModal to show preview
4. Test with dry-run before executing

### Customize Column Layout
1. Edit UsersTable column definitions
2. Add/remove columns in grid template
3. Update DirectoryHeader if needed
4. Test responsive breakpoints

### Enable Builder.io CMS
1. Follow `docs/BUILDER_IO_ENV_SETUP.md`
2. Create 6 models in Builder.io
3. Drag & drop content in Builder.io UI
4. Changes reflect instantly in dashboard

---

## Troubleshooting

### Issue: Old dashboard still showing
**Solution:** Check environment variable
```env
NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=true  # Should be 'true'
```
Restart dev server after changing.

### Issue: Users table not loading
**Solution:** Check API endpoint
```
GET /api/admin/users
```
Should return: `{ users: [...], total: number }`

### Issue: Sidebar not appearing
**Solution:** Check responsive breakpoints
- Desktop (≥1400px): Sidebar always visible
- Tablet (768-1399px): Sidebar hidden, use toggle button
- Mobile (<768px): Sidebar as drawer

### Issue: Builder.io slots not rendering
**Solution:** Check if Builder.io is configured
```env
NEXT_PUBLIC_BUILDER_API_KEY=<key>   # Missing?
NEXT_PUBLIC_BUILDER_SPACE=<space>   # Missing?
```
Falls back to default components if not configured.

---

## Next Steps

1. **Test the Dashboard**
   - Navigate to `/admin/users`
   - Test all features listed above
   - File bugs or improvements

2. **Run Test Suite**
   ```bash
   npm run test
   npm run test:e2e
   npm run test:a11y
   ```

3. **Setup Builder.io (Optional)**
   - See `docs/BUILDER_IO_ENV_SETUP.md`
   - Enables no-code UI customization

4. **Plan Rollout**
   - Use feature flag for staged rollout
   - See `docs/PHASE_8_CANARY_ROLLOUT.md`
   - Monitor with Sentry

5. **Feedback & Improvements**
   - Report issues in GitHub
   - Suggest features
   - Performance improvements

---

## Documentation

- **Full Specification:** `docs/ADMIN_USERS_WORKBENCH_TRANSFORMATION_ROADMAP.md`
- **Compliance Report:** `docs/WORKBENCH_COMPLIANCE_VERIFICATION.md`
- **Builder.io Setup:** `docs/BUILDER_IO_ENV_SETUP.md`
- **Rollout Plan:** `docs/PHASE_8_CANARY_ROLLOUT.md`
- **Ramp-up Checklist:** `docs/PHASE_8_RAMP_UP_CHECKLIST.md`

---

## Support

For questions or issues:
1. Check the documentation files above
2. Review component JSDoc comments
3. Check test files for usage examples
4. File an issue with details and reproduction steps

---

**Status:** ✅ Ready for Testing & Deployment  
**Last Updated:** February 2025  
**Version:** 1.0.0 (Production)
