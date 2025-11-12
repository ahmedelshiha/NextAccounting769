# Phase 6: Builder.io CMS Integration - Complete Guide

**Status:** ✅ **IMPLEMENTATION COMPLETE** (Code-only setup, ready for manual Builder.io configuration)  
**Last Updated:** February 2025  
**Effort:** 2 days of development

---

## 📋 Overview

Phase 6 enables **non-technical admins** to customize the AdminWorkBench dashboard UI **without code changes** using Builder.io's visual CMS.

### What This Enables

| Feature | Before (Code Required) | After (CMS) |
|---------|----------------------|-----------|
| Hide KPI card | Edit code + deploy | Click toggle in CMS |
| Reorder metrics | Refactor components | Drag/drop in CMS |
| Change button labels | Update source code | Edit text in CMS |
| Add custom actions | Write new components | Add in CMS builder |
| A/B test layouts | Create feature branches | Create variants in CMS |
| Instant rollback | Revert git commit | Revert version in CMS |

---

## 🎯 What's Been Implemented

### ✅ Code Implementations

1. **Builder.io Configuration** (`src/lib/builder-io/config.ts`)
   - 5 editable model definitions (header, metrics, sidebar, footer, main)
   - Environment variable support
   - Graceful fallback mechanism
   - Cache configuration (5 min default)

2. **useBuilderContent Hook** (`src/hooks/useBuilderContent.ts`)
   - Content fetching with automatic retry logic
   - In-memory caching with configurable TTL
   - Error handling and fallback
   - Request deduplication
   - Abort controller for cleanup

3. **Builder Slots** (`src/app/admin/users/components/workbench/BuilderSlots.tsx`)
   - `BuilderHeaderSlot` - Quick actions bar
   - `BuilderMetricsSlot` - KPI cards grid
   - `BuilderSidebarSlot` - Analytics & filters
   - `BuilderFooterSlot` - Bulk operations panel
   - `BuilderMainSlot` - Main content area

4. **API Endpoint** (`src/app/api/builder-io/content/route.ts`)
   - Proxies requests to Builder.io API
   - Implements 5-minute caching
   - Error handling and validation

5. **Integration Tests** (`src/app/admin/users/components/workbench/__tests__/BuilderIntegration.test.tsx`)
   - Configuration tests
   - Hook behavior tests
   - Slot fallback tests
   - Cache management tests

6. **Hooks Export** (`src/hooks/useIsBuilderEnabled.ts`)
   - Simple hook to check if Builder is enabled

---

## 🔧 Manual Setup Required (One-Time)

### Step 1: Create Builder.io Account

1. Go to [https://builder.io](https://builder.io)
2. Click **"Sign Up Free"**
3. Choose **"Visual CMS"** plan
4. Complete registration
5. Verify email

### Step 2: Get API Credentials

1. Log in to [Builder.io Dashboard](https://builder.io/account/settings)
2. Navigate to **Settings** → **API Keys**
3. Copy your **Public API Key**
4. Copy your **Space ID** (shown in URL as `?spaceId=SPACE_ID`)
5. Optionally: Generate **Private API Key** for server-side operations

### Step 3: Set Environment Variables

Add to `.env.local` (development) or deployment platform (production):

```bash
# Required
NEXT_PUBLIC_BUILDER_API_KEY=your_public_api_key_here
NEXT_PUBLIC_BUILDER_SPACE=your_space_id_here

# Optional
NEXT_PUBLIC_BUILDER_ENABLED=true          # Default: true if keys present
NEXT_PUBLIC_BUILDER_CACHE_TIME=300000     # Cache duration in ms (default: 5 min)
BUILDER_PRIVATE_API_KEY=your_private_key  # For server-side operations
```

### Step 4: Create Content Models (in Builder.io)

#### Model 1: Admin Workbench Header
```
Name: admin-workbench-header
Description: Header section with quick actions
Fields:
  - showAddUserButton (boolean, default: true)
  - showImportButton (boolean, default: true)
  - showExportButton (boolean, default: true)
  - showRefreshButton (boolean, default: true)
  - showAuditTrailButton (boolean, default: true)
  - customActions (list of objects)
```

#### Model 2: Admin Workbench Metrics
```
Name: admin-workbench-metrics
Description: KPI metrics cards grid
Fields:
  - showActiveUsersCard (boolean, default: true)
  - showPendingApprovalsCard (boolean, default: true)
  - showWorkflowsCard (boolean, default: true)
  - showSystemHealthCard (boolean, default: true)
  - showCostPerUserCard (boolean, default: true)
  - cardLayout (enum: grid|carousel|list, default: grid)
  - columnCount (number, 1-5, default: 5)
```

#### Model 3: Admin Workbench Sidebar
```
Name: admin-workbench-sidebar
Description: Sidebar with filters and analytics
Fields:
  - showAnalyticsSection (boolean, default: true)
  - showRoleDistributionChart (boolean, default: true)
  - showUserGrowthChart (boolean, default: true)
  - showFiltersSection (boolean, default: true)
  - showRoleFilter (boolean, default: true)
  - showStatusFilter (boolean, default: true)
  - showDateRangeFilter (boolean, default: true)
  - showRecentActivitySection (boolean, default: true)
  - recentActivityItemCount (number, 1-50, default: 10)
```

#### Model 4: Admin Workbench Footer
```
Name: admin-workbench-footer
Description: Bulk operations panel
Fields:
  - showBulkActionsPanel (boolean, default: true)
  - bulkActions (list of objects)
  - showPreviewButton (boolean, default: true)
  - showApplyButton (boolean, default: true)
  - showUndoCapability (boolean, default: true)
```

#### Model 5: Admin Workbench Main
```
Name: admin-workbench-main-content
Description: Main content area with user directory
Fields:
  - showDirectoryHeader (boolean, default: true)
  - showUserTable (boolean, default: true)
  - tableColumnCount (number, 2-10, default: 6)
  - enableInlineEdit (boolean, default: true)
  - rowsPerPage (number, 10-500, default: 100)
```

### Step 5: Create Preview Entries (Optional)

For each model, create a preview entry to test:

1. In Builder.io Editor, click **"New"**
2. Select the model (e.g., "admin-workbench-header")
3. Configure fields (or leave as defaults)
4. Click **"Publish"**
5. Access preview at: `http://localhost:3000/admin/users?builder-preview=header`

---

## 🚀 Usage: How Admins Use the CMS

### Scenario 1: Hide the "Cost Per User" KPI Card

1. Log in to Builder.io Dashboard
2. Open **admin-workbench-metrics** model
3. Find the published entry (or create new)
4. Toggle **showCostPerUserCard** to **OFF**
5. Click **"Publish"**
6. Refresh your admin dashboard
7. "Cost Per User" card is now hidden ✨

### Scenario 2: Add Custom Action Button

1. Open **admin-workbench-header** model
2. In the **customActions** list, add new item:
   ```json
   {
     "label": "Generate Report",
     "icon": "report",
     "action": "generate-report"
   }
   ```
3. Click **"Publish"**
4. New button appears in header instantly

### Scenario 3: Test Different Metrics Layouts

1. Create two versions in Builder.io:
   - **Version A:** 5-column grid (desktop)
   - **Version B:** 3-column carousel (mobile)
2. Set different **cardLayout** and **columnCount** values
3. Use Builder's A/B testing feature to run experiments
4. Analyze engagement metrics
5. Publish winning version

---

## 🔌 How The Integration Works

### Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│ AdminUsersLayout.tsx                                         │
│ (Main component)                                             │
└────────┬─────────────────────────────────────────────────────┘
         │
         ├──────────────────┐
         │                  │
    ┌────▼────┐       ┌─────▼──────┐
    │ Is CMS   │       │ Has        │
    │ Enabled? │─NO──▶ │ Fallback   │
    └────┬─────┘       │ Component  │
         │ YES         └────────────┘
         │
    ┌────▼─────────────────────────┐
    │ BuilderXxxSlot.tsx            │
    │ (e.g., BuilderMetricsSlot)    │
    └────┬───────────────────────────┘
         │
    ┌────▼─────────────────────────┐
    │ useBuilderContent()           │
    │ - Fetch from Builder.io       │
    │ - Cache for 5 minutes         │
    │ - Handle errors               │
    └────┬────────────────��──────────┘
         │
    ┌────▼─────────────────────────┐
    │ API: /api/builder-io/content  │
    │ (Proxies to Builder.io API)   │
    └────┬───────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │ Builder.io API                │
    │ Returns: { results: [...] }   │
    └───────────────────────────────┘
```

### Example: Admin renders metrics with CMS

```typescript
// AdminUsersLayout.tsx
export default function AdminUsersLayout() {
  const isBuilderEnabled = useIsBuilderEnabled()

  return (
    <main>
      {/* If CMS enabled: render CMS content. Otherwise: render OverviewCards */}
      {isBuilderEnabled ? <BuilderMetricsSlot /> : <OverviewCards />}
    </main>
  )
}

// BuilderMetricsSlot.tsx
export function BuilderMetricsSlot() {
  const { content, isLoading, error } = useBuilderContent(
    'admin-workbench-metrics'
  )

  // Fallback to default if CMS fails
  if (!content || error) {
    return <OverviewCards />
  }

  // Render CMS content with fallback component
  return (
    <div data-testid="builder-metrics-slot">
      {content.blocks ? renderBuilderBlocks(content.blocks) : <OverviewCards />}
    </div>
  )
}
```

---

## 🧪 Testing The Integration

### Manual Testing Checklist

- [ ] **Test 1: Builder Disabled**
  - Remove `NEXT_PUBLIC_BUILDER_API_KEY` from env
  - Restart dev server
  - Verify default components render (not CMS)
  - ✅ Expected: QuickActionsBar, OverviewCards, etc. appear

- [ ] **Test 2: Builder Enabled**
  - Add valid API key and space ID
  - Restart dev server
  - Check browser console for fetch calls to `/api/builder-io/content`
  - ✅ Expected: Requests to Builder.io API succeed

- [ ] **Test 3: CMS Content Loads**
  - Create entry in Builder.io for `admin-workbench-header`
  - Publish entry
  - Visit `/admin/users`
  - Check Network tab for Builder API response
  - ✅ Expected: Content loads and renders

- [ ] **Test 4: Fallback on Error**
  - Make API key invalid
  - Restart server
  - Visit `/admin/users`
  - ✅ Expected: Default components render (fallback works)

- [ ] **Test 5: Caching Works**
  - Visit `/admin/users`
  - Check Network tab (1 request to Builder API)
  - Refresh page
  - ✅ Expected: No new request (cached for 5 min)

### Automated Tests

```bash
# Run Builder.io integration tests
npm run test src/app/admin/users/components/workbench/__tests__/BuilderIntegration.test.tsx

# Expected output:
# ✓ Configuration tests (4)
# ✓ useBuilderContent Hook tests (4)
# ✓ Builder Slots tests (3)
# ✓ Cache Management tests (1)
```

---

## 📊 Environment Variables Reference

| Variable | Required | Type | Default | Description |
|----------|----------|------|---------|-------------|
| `NEXT_PUBLIC_BUILDER_API_KEY` | ✅ | string | - | Public API key from Builder.io dashboard |
| `NEXT_PUBLIC_BUILDER_SPACE` | ✅ | string | - | Space ID from Builder.io account |
| `NEXT_PUBLIC_BUILDER_ENABLED` | ❌ | boolean | `true` if keys present | Enable/disable CMS (for testing) |
| `NEXT_PUBLIC_BUILDER_CACHE_TIME` | ❌ | number | `300000` | Cache duration in milliseconds (5 min default) |
| `BUILDER_PRIVATE_API_KEY` | ❌ | string | - | Private key for server-side operations |

---

## 🛠️ File Structure

```
src/
├── lib/builder-io/
│   └── config.ts                          # Configuration & models
├── hooks/
│   ├── useBuilderContent.ts               # Main CMS hook
│   └── useIsBuilderEnabled.ts             # Check if CMS is enabled
├── app/api/builder-io/content/
│   └── route.ts                           # API endpoint
└── app/admin/users/
    └── components/workbench/
        ├── BuilderSlots.tsx               # 5 CMS slots
        └── __tests__/
            └── BuilderIntegration.test.tsx # Integration tests
```

---

## 🚨 Troubleshooting

### Issue: "Builder.io is not configured"

**Cause:** Missing or invalid environment variables

**Solution:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_BUILDER_API_KEY
echo $NEXT_PUBLIC_BUILDER_SPACE

# If empty, add to .env.local
NEXT_PUBLIC_BUILDER_API_KEY=sk_...
NEXT_PUBLIC_BUILDER_SPACE=...

# Restart dev server
npm run dev
```

### Issue: "Failed to fetch Builder content"

**Cause:** Invalid API key or Space ID

**Solution:**
1. Log in to [Builder.io Dashboard](https://builder.io/account/settings)
2. Navigate to **Settings** → **API Keys**
3. Verify API key is correct (should start with `sk_`)
4. Verify Space ID matches your space
5. Check that model exists in Builder.io (or create it)

### Issue: Content doesn't appear, but no errors

**Cause:** No published content in Builder.io

**Solution:**
1. Go to Builder.io Editor
2. Create/edit entry for the model
3. Click **"Publish"**
4. Wait 5 seconds (cache refresh)
5. Refresh your admin dashboard

### Issue: Changes don't appear immediately

**Cause:** Content is cached for 5 minutes

**Solution:**
- Use `useClearBuilderCache()` hook to force refresh
- Or wait 5 minutes for cache to expire
- Or set `NEXT_PUBLIC_BUILDER_CACHE_TIME=0` for development

---

## 🔄 Next Steps (Phase 7-8)

### Phase 7: Testing & QA
- [ ] Run full E2E test suite
- [ ] Verify accessibility compliance (WCAG 2.1 AA)
- [ ] Performance audit (LCP < 2.0s)
- [ ] Load testing with 10k+ users

### Phase 8: Monitoring & Rollout
- [ ] Set up Sentry monitoring for Builder.io errors
- [ ] Create rollout plan (canary: 10% → 25% → 50% → 100%)
- [ ] Document rollback procedure
- [ ] Create admin guide for using CMS

---

## 📚 Resources

- **Builder.io Docs:** https://www.builder.io/c/docs
- **API Reference:** https://www.builder.io/c/docs/apis
- **Visual Editor Guide:** https://www.builder.io/c/docs/guides/page-editor
- **Content Models:** https://www.builder.io/c/docs/guides/content-models

---

## ✅ Phase 6 Completion Checklist

- [x] Create Builder.io configuration module
- [x] Implement useBuilderContent hook with caching
- [x] Create 5 Builder.io slots (header, metrics, sidebar, footer, main)
- [x] Build API endpoint for content fetching
- [x] Add integration tests
- [x] Export useIsBuilderEnabled hook
- [x] Create comprehensive documentation
- [ ] (Manual) Create Builder.io account
- [ ] (Manual) Set environment variables
- [ ] (Manual) Create 5 content models in Builder.io
- [ ] (Manual) Create preview entries
- [ ] (Manual) Test CMS integration

---

**Phase 6 Status:** ✅ **CODE COMPLETE**  
**Ready for:** Manual Builder.io setup + Phase 7 (Testing & QA)
