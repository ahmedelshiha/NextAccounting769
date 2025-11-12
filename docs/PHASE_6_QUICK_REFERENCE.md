# Phase 6: Builder.io CMS - Quick Reference

**Status:** ✅ Code complete | ⏳ Awaiting manual setup

---

## One-Page Summary

| Aspect | Details |
|--------|---------|
| **Purpose** | Let admins customize AdminWorkBench UI without code |
| **Technology** | Builder.io headless CMS + React hooks + API endpoint |
| **Implementation** | 5 editable slots (header, metrics, sidebar, footer, main) |
| **Status** | Code complete, ready for manual CMS setup |
| **Setup Time** | ~30 minutes (one-time) |
| **Code Files** | 7 files (2 new, 5 enhanced) |
| **Tests** | 12 test cases implemented |
| **Docs** | 571 lines (3 guides) |

---

## Quick Setup (30 minutes)

```bash
# 1. Create Builder.io account (5 min)
→ https://builder.io/account/register

# 2. Get credentials (2 min)
→ Settings > API Keys
→ Copy: Public API Key, Space ID

# 3. Set environment variables (2 min)
NEXT_PUBLIC_BUILDER_API_KEY=sk_...
NEXT_PUBLIC_BUILDER_SPACE=...

# 4. Restart dev server
npm run dev

# 5. Create 5 models in Builder.io (10 min)
- admin-workbench-header
- admin-workbench-metrics
- admin-workbench-sidebar
- admin-workbench-footer
- admin-workbench-main-content

# 6. Test (5 min)
→ Visit /admin/users
→ Check Network tab for Builder API calls
→ Verify content loads or falls back gracefully
```

---

## File Quick Reference

```
Core Implementation:
├── src/lib/builder-io/config.ts          # Configuration & models
├── src/hooks/useBuilderContent.ts        # Main hook (fetch + cache)
├── src/hooks/useIsBuilderEnabled.ts      # Enable check
├── src/app/api/builder-io/content/route.ts  # API endpoint
└── src/app/admin/users/components/workbench/
    ├── BuilderSlots.tsx                  # 5 CMS slots
    └── __tests__/BuilderIntegration.test.tsx

Documentation:
├── docs/PHASE_6_BUILDER_IO_CMS_INTEGRATION.md  # Complete guide (475 lines)
├── docs/BUILDER_IO_ENV_SETUP.md                # Setup guide (96 lines)
├── docs/PHASE_6_COMPLETION_SUMMARY.md          # Completion report
└── docs/PHASE_6_QUICK_REFERENCE.md             # This file
```

---

## 5 Editable Slots

```typescript
// Header (quick actions)
<BuilderHeaderSlot />
└─ QuickActionsBar (fallback)

// Metrics (KPI cards)
<BuilderMetricsSlot />
└─ OverviewCards (fallback)

// Sidebar (filters + analytics)
<BuilderSidebarSlot onFilterChange={...} />
└─ AdminSidebar (fallback)

// Footer (bulk operations)
<BuilderFooterSlot selectedCount={...} />
└─ BulkActionsPanel (fallback)

// Main (content area)
<BuilderMainSlot />
└─ null (optional)
```

---

## Environment Variables

```bash
# REQUIRED
NEXT_PUBLIC_BUILDER_API_KEY=sk_your_public_key
NEXT_PUBLIC_BUILDER_SPACE=your_space_id

# OPTIONAL
NEXT_PUBLIC_BUILDER_ENABLED=true                    # default: true if keys present
NEXT_PUBLIC_BUILDER_CACHE_TIME=300000               # default: 5 minutes
BUILDER_PRIVATE_API_KEY=sk_your_private_key         # for server-side
```

---

## API Endpoints

```bash
# Content fetching
GET /api/builder-io/content?model=MODEL_NAME&space=SPACE_ID

# Response
{ results: [...] }
```

---

## Testing

```bash
# Run integration tests
npm run test src/app/admin/users/components/workbench/__tests__/BuilderIntegration.test.tsx

# Test cases:
# ✓ Configuration (4 cases)
# ✓ useBuilderContent hook (4 cases)
# ✓ Builder slots (3 cases)
# ✓ Cache management (1 case)
```

---

## Common Tasks

### Hide a KPI Card
1. Log in to Builder.io
2. Open `admin-workbench-metrics` model
3. Toggle `showCostPerUserCard` OFF
4. Publish
5. Refresh `/admin/users` (wait 5 sec for cache)

### Add Custom Action Button
1. Open `admin-workbench-header` model
2. Add to `customActions` list:
   ```json
   {
     "label": "Generate Report",
     "icon": "report",
     "action": "generate-report"
   }
   ```
3. Publish

### Test Different Layouts
1. Create Entry A: 5-column grid
2. Create Entry B: 3-column carousel
3. Use Builder's A/B testing
4. Publish winning version

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| "Builder disabled" | Env vars set? Restart server? |
| "Failed to fetch" | API key valid? Space ID correct? |
| Content not appear | Published in Builder? Cache expired (5min)? |
| Network errors | Check Network tab `/api/builder-io/content` |
| Need to refresh | Set `CACHE_TIME=0` for dev (ignores cache) |

---

## How It Works (30-second version)

```
1. Admin publishes content in Builder.io
                  ↓
2. User visits /admin/users
                  ↓
3. useBuilderContent() hook fetches from Builder.io
                  ↓
4. Content cached for 5 minutes
                  ↓
5. BuilderSlots render CMS content
                  ↓
6. If CMS fails → Fallback component renders (no breakage)
```

---

## Success Criteria

After setup, you should see:

- [x] Admin dashboard loads normally
- [x] Network tab shows `/api/builder-io/content` requests
- [x] Builder API returns `{ results: [...] }`
- [x] Console has no "Builder.io disabled" warnings
- [x] Can toggle features on/off in Builder.io
- [x] Changes appear in dashboard instantly (or after 5 min cache)

---

## Next Phase (Phase 7-8)

- Phase 7: Testing & QA
  - Run full test suite
  - Accessibility audit
  - Performance testing
  - Load testing

- Phase 8: Monitoring & Rollout
  - Set up Sentry monitoring
  - Create rollout plan (canary)
  - Document rollback

---

## Quick Links

| Resource | URL |
|----------|-----|
| Builder.io Account | https://builder.io/account/settings |
| API Keys | https://builder.io/account/settings (→ API Keys) |
| Documentation | https://www.builder.io/c/docs |
| API Reference | https://www.builder.io/c/docs/apis |
| Setup Guide | See `docs/BUILDER_IO_ENV_SETUP.md` |
| Full Guide | See `docs/PHASE_6_BUILDER_IO_CMS_INTEGRATION.md` |

---

## Status Indicators

```
Code Implementation: ✅ COMPLETE
  ├─ Config: ✅
  ├─ Hooks: ✅
  ├─ Slots: ✅
  ├─ API Endpoint: ✅
  └─ Tests: ✅

Manual Setup: ⏳ PENDING (required)
  ├─ Create Builder account: ⏳
  ├─ Get API credentials: ⏳
  ├─ Set env variables: ⏳
  ├─ Create models: ⏳
  └─ Test integration: ⏳

Phase 6: ✅ CODE READY
Phase 7: ⏳ TESTING (next)
Phase 8: ⏳ ROLLOUT (after Phase 7)
```

---

## One-Liner Commands

```bash
# Check if Builder is enabled
echo $NEXT_PUBLIC_BUILDER_API_KEY

# Test API connection
curl "http://localhost:3000/api/builder-io/content?model=admin-workbench-header&space=$NEXT_PUBLIC_BUILDER_SPACE"

# Clear cache (development)
npm run dev -- --env NEXT_PUBLIC_BUILDER_CACHE_TIME=0

# Run tests
npm run test -- BuilderIntegration.test.tsx
```

---

**Phase 6 Complete** ✨ — Ready for Phase 7
