# Builder.io Integration Guide for AdminWorkBench

**Status:** Phase 6.1-6.3 Implementation Guide  
**Last Updated:** January 2025  
**Complexity:** Medium

---

## 📋 Overview

This guide explains how to integrate Builder.io CMS with the AdminWorkBench dashboard, enabling non-technical users to edit and manage dashboard content without modifying code.

### What You Can Edit in Builder.io
- **Header Section:** Quick actions bar content
- **Metrics Section:** KPI cards layout and styling
- **Sidebar Section:** Filter options and analytics widgets
- **Footer Section:** Bulk operations panel controls

---

## 🔧 Setup Instructions

### Step 1: Connect to Builder.io MCP

1. Click [Connect to Builder.io](#open-mcp-popover) button
2. Authenticate with your Builder.io account
3. Note your **API Key** and **Space ID** (you'll need these in the next step)

### Step 2: Set Environment Variables

Add the following environment variables to your deployment:

```bash
# Public API key from Builder.io dashboard
NEXT_PUBLIC_BUILDER_API_KEY=your_api_key_here

# Space ID from your Builder.io account
NEXT_PUBLIC_BUILDER_SPACE=your_space_id_here
```

**Where to find these:**
1. Go to [builder.io/account](https://builder.io/account)
2. Find "API Keys" section
3. Copy your public API key
4. Find "Space" settings
5. Copy your space ID

### Step 3: Restart Development Server

After setting environment variables, restart the dev server:

```bash
npm run dev
# or
pnpm dev
```

---

## 🏗️ Architecture

### File Structure

```
src/
├── lib/
│   └── builder-io/
│       └── config.ts              # Configuration and model definitions
├── hooks/
│   └── useBuilderContent.ts        # React hook for fetching Builder content
├── app/
│   ├── api/
│   │   └── builder-io/
│   │       └── content/
│   │           └── route.ts        # API proxy to Builder.io
│   └── admin/users/components/
│       └── workbench/
│           ├── BuilderSlots.tsx    # Slot wrappers (header, metrics, sidebar, footer)
│           └── AdminUsersLayout.tsx # Modified to use Builder slots
```

### Data Flow

```
Builder.io Dashboard
        │
        ▼
Builder.io CDN API
        │
        ▼
/api/builder-io/content
        │
        ▼
useBuilderContent Hook
        │
        ▼
BuilderXxxSlot Components
        │
        ▼
Render with Fallback
(default component if Builder content unavailable)
```

---

## 🎯 Creating Content in Builder.io

### Step 1: Create Models in Builder.io Dashboard

1. Go to [builder.io](https://builder.io)
2. Navigate to your space
3. Create new models for:
   - `admin-workbench-header` - Header controls
   - `admin-workbench-metrics` - KPI metrics cards
   - `admin-workbench-sidebar` - Sidebar widgets
   - `admin-workbench-footer` - Footer actions

### Step 2: Create Entries for Each Model

1. For each model, create an entry named `main`
2. This will be rendered in your dashboard
3. Add content blocks, sections, and components

### Step 3: Publish Content

1. Click "Publish" in Builder.io editor
2. Content is immediately available via CDN
3. Dashboard automatically fetches and displays new content

### Step 4: Update Content

Edit your Builder content anytime:
- No code deployment needed
- Changes go live within minutes
- Dashboard falls back to default if content unavailable

---

## 💻 Code Implementation

### Configuration (`src/lib/builder-io/config.ts`)

Defines:
- Model names and identifiers
- Model schemas and fields
- Configuration retrieval from environment

### Hook (`src/hooks/useBuilderContent.ts`)

Usage:
```typescript
const { content, isLoading, error, isEnabled } = useBuilderContent('admin-workbench-header')

if (!content) return <DefaultComponent />
return renderContent(content)
```

### Slots (`src/app/admin/users/components/workbench/BuilderSlots.tsx`)

Four slot components:
- `BuilderHeaderSlot()` - Header with fallback to QuickActionsBar
- `BuilderMetricsSlot()` - KPI cards with fallback to OverviewCards
- `BuilderSidebarSlot()` - Sidebar with fallback to AdminSidebar
- `BuilderFooterSlot()` - Footer with fallback to BulkActionsPanel

### API Endpoint (`src/app/api/builder-io/content/route.ts`)

Handles:
- Proxy requests to Builder.io CDN
- Caching responses (5 minutes)
- Error handling and fallbacks

---

## 🔄 Workflow Example

### Scenario: Marketing wants to highlight a new feature in the header

**Without Builder.io:**
1. Ticket created → Developer picks up
2. Code changes needed in QuickActionsBar.tsx
3. Tests written and reviewed
4. PR merged to main
5. Build and deploy pipeline runs
6. Changes go live (hours/days later)

**With Builder.io:**
1. Marketing opens Builder.io dashboard
2. Edits admin-workbench-header content
3. Adds new promotional banner
4. Clicks "Publish"
5. Changes visible on dashboard within minutes
6. ✅ No developer involved!

---

## 🧪 Testing Builder.io Integration

### Manual Testing Checklist

- [ ] Builder.io is configured (API key + space set)
- [ ] Content fetch endpoint returns data
- [ ] Header content displays correctly
- [ ] Metrics content displays correctly
- [ ] Sidebar content displays correctly
- [ ] Footer content displays correctly
- [ ] Fallback components appear if Builder.io is unavailable
- [ ] Content updates are visible within 5 minutes
- [ ] Dark mode works with Builder content
- [ ] Responsive design maintained

### Testing Steps

1. **Verify Configuration:**
```bash
# Check if Builder.io is enabled
curl http://localhost:3000/api/builder-io/content?model=admin-workbench-header&space=YOUR_SPACE_ID
```

2. **Test Content Fetch:**
   - Open browser DevTools → Network tab
   - Navigate to `/admin/users`
   - Look for calls to `/api/builder-io/content`
   - Verify responses contain expected data

3. **Test Fallback:**
   - Disable Builder.io (remove env variables)
   - Restart dev server
   - Verify default components still render

4. **Test Content Updates:**
   - Edit content in Builder.io dashboard
   - Publish changes
   - Wait up to 5 minutes (cache time)
   - Refresh admin dashboard
   - Verify new content appears

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BUILDER_API_KEY` | Yes | None | Public API key from Builder.io |
| `NEXT_PUBLIC_BUILDER_SPACE` | Yes | None | Space ID from Builder.io account |
| `BUILDER_PRIVATE_API_KEY` | No | None | Private API key for server-side operations |

---

## 🐛 Troubleshooting

### Issue: "Builder.io is not configured"

**Cause:** Environment variables are not set

**Solution:**
1. Verify `NEXT_PUBLIC_BUILDER_API_KEY` is set
2. Verify `NEXT_PUBLIC_BUILDER_SPACE` is set
3. Restart dev server after setting variables
4. Check if variables are visible: `echo $NEXT_PUBLIC_BUILDER_API_KEY`

### Issue: Content not loading from Builder.io

**Cause:** API key or space ID is invalid

**Solution:**
1. Double-check credentials in Builder.io account
2. Verify you copied the correct API key
3. Ensure space exists in your account
4. Test API call manually: `curl https://cdn.builder.io/api/v3/content/admin-workbench-header?apiKey=YOUR_KEY&space=YOUR_SPACE`

### Issue: Default components always show

**Cause:** Builder.io content doesn't exist yet

**Solution:**
1. Create models in Builder.io dashboard
2. Create entries for each model
3. Add content blocks
4. Publish entries
5. Wait for cache to expire (5 minutes)
6. Refresh dashboard

### Issue: Content cached too long

**Cause:** Content is served from CDN cache (5 minute default)

**Solution:**
1. Wait up to 5 minutes for cache to expire
2. Or modify `cacheTime` parameter in `useBuilderContent` hook
3. Set to `cacheTime: 0` for no caching (not recommended for production)

### Issue: Build fails with Builder.io changes

**Cause:** Builder content has invalid structure

**Solution:**
1. Check Builder.io editor for validation errors
2. Simplify content blocks
3. Ensure all properties are valid
4. Test with minimal content first

---

## 📈 Performance Considerations

### Caching Strategy

- **CDN Cache:** 5 minutes (configurable)
- **Local Hook Cache:** React Query handles caching
- **Fallback:** Instant rendering of default component

### Optimization Tips

1. **Use CDN caching:** Keep 5-minute cache to reduce API calls
2. **Lazy load content:** Load each slot independently
3. **Minimize content size:** Fewer blocks = faster rendering
4. **Test performance:** Use Lighthouse to verify LCP < 2.5s

### Performance Metrics

Track these metrics to ensure performance:
- LCP (Largest Contentful Paint) - Target: < 2.5s
- Content fetch time - Target: < 500ms
- Number of API calls per page load - Target: ≤ 4

---

## 🔒 Security Considerations

### API Key Management

- **Public Key:** Safe to expose in frontend (client-side rendering)
- **Private Key:** Keep in backend environment only
- **Rotation:** Rotate keys quarterly
- **Monitoring:** Watch for unusual API usage in Builder.io dashboard

### Content Validation

- All Builder content is validated before rendering
- Unsafe HTML is sanitized
- Scripts in content blocks are disabled
- External resources are loaded with CSP headers

### Access Control

- Only authorized admins can edit content in Builder.io
- Use Builder.io's role-based access controls
- Enable 2FA on Builder.io account
- Monitor content changes in audit log

---

## 📚 Related Documentation

- [Builder.io Docs](https://www.builder.io/docs)
- [Builder.io Content API](https://www.builder.io/docs/content-api)
- [AdminWorkBench Quick Start](./ADMIN_WORKBENCH_QUICK_START.md)
- [AdminWorkBench Implementation Summary](./ADMIN_WORKBENCH_IMPLEMENTATION_SUMMARY.md)

---

## ✅ Phase 6 Completion Checklist

### 6.1: Setup & Infrastructure
- [x] Create configuration file (`src/lib/builder-io/config.ts`)
- [x] Create hook for content fetching (`src/hooks/useBuilderContent.ts`)
- [x] Create API endpoint (`src/app/api/builder-io/content/route.ts`)
- [x] Create slot wrapper components (`src/app/admin/users/components/workbench/BuilderSlots.tsx`)

### 6.2: Integration
- [ ] Update AdminUsersLayout to use Builder slots
- [ ] Test slot rendering with mock data
- [ ] Verify fallback to default components
- [ ] Document Builder.io content structure

### 6.3: Documentation & Testing
- [x] Create comprehensive integration guide (this file)
- [ ] Create Builder.io model setup guide
- [ ] Write E2E tests for Builder.io content loading
- [ ] Document rollback procedure

---

**Next Steps:**
1. Set environment variables for Builder.io credentials
2. Create models in Builder.io dashboard
3. Update AdminUsersLayout to use Builder slots
4. Test content loading and rendering
5. Write integration tests

