# AdminWorkBench Quick Start Guide

## ⚡ Enable the New Dashboard (30 seconds)

### Step 1: Set Environment Variable
```bash
NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=true
```

### Step 2: Restart Dev Server
```bash
npm run dev
# or
yarn dev
```

### Step 3: Navigate to Admin Users
Visit: `http://localhost:3000/admin/users`

**Result:** You should see the new AdminWorkBench UI instead of the legacy dashboard.

---

## 🎛️ Feature Flag Controls

### Enable for All Users (100% Rollout)
```bash
NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=true
NEXT_PUBLIC_ADMIN_WORKBENCH_ROLLOUT_PERCENTAGE=100
```

### Canary Rollout (10% of Users)
```bash
NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=true
NEXT_PUBLIC_ADMIN_WORKBENCH_ROLLOUT_PERCENTAGE=10
```

### Beta Testers Only
```bash
NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=true
NEXT_PUBLIC_ADMIN_WORKBENCH_BETA_TESTERS=user-id-1,user-id-2,user-id-3
```

### Admin Users Only
```bash
NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=true
NEXT_PUBLIC_ADMIN_WORKBENCH_TARGET_USERS=ADMIN
```

### Disable (Rollback)
```bash
NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=false
```

---

## 🧪 Testing the UI

### Test Feature Flag Switching
1. Enable feature flag
2. Visit `/admin/users` → See new UI
3. Disable feature flag (set to `false`)
4. Refresh page → See old UI
5. No code restart needed (depends on env reload)

### Test User Selection
1. Click checkboxes to select users
2. See count in Directory Header
3. See bulk actions panel appear at bottom
4. Click "Clear" to deselect

### Test Filters
1. Open sidebar (visible on desktop, button on mobile)
2. Select a Role filter
3. See user table update instantly
4. Try other filters (Status, Department, Date Range)
5. Click "Clear Filters" to reset

### Test Bulk Actions
1. Select 1+ users
2. Choose action type (Set Status, Set Role, etc.)
3. Choose action value
4. Click "Preview" to see what will change
5. Click "Apply Changes" (or "Cancel" from modal)
6. See success toast with undo button
7. Click "Undo" to revert changes

---

## 📱 Testing Responsive Design

### Desktop (≥1400px)
- Sidebar always visible on left
- 3-column layout: sidebar | main | gap
- Full functionality

### Tablet (768-1399px)
- Sidebar hidden by default
- Toggle button visible in header
- Drawer sidebar slides from left
- Single-column main content

### Mobile (<768px)
- Sidebar hidden by default
- Small toggle button in header
- Full-width content
- Modal sidebar drawer
- Touch-friendly buttons

**Test on:** DevTools responsive mode (F12 → Toggle device toolbar)

---

## 🌙 Test Dark Mode

### In DevTools (Chrome/Firefox)
1. Open DevTools (F12)
2. Go to: Rendering → Emulate CSS media feature `prefers-color-scheme`
3. Select "dark"
4. See dark mode applied
5. Components adapt automatically

---

## 🐛 Common Issues & Solutions

### Issue: Feature flag not working
**Solution:** 
- Ensure env var is set: `NEXT_PUBLIC_ADMIN_WORKBENCH_ENABLED=true`
- Restart dev server (npm run dev)
- Check browser console for errors

### Issue: Old UI still showing
**Solution:**
- Feature flag might be disabled
- User might be outside rollout percentage
- Clear browser cache
- Try incognito/private window

### Issue: Bulk actions not working
**Solution:**
- API endpoints might not be implemented
- Check network tab in DevTools
- See if `/api/admin/users/bulk-action` exists
- Currently uses mock data

### Issue: Filters not working
**Solution:**
- Filters only modify local table state
- Refresh page to see all users again
- Check if users match filter criteria

---

## 📚 Component Quick Reference

### Main Layout
```tsx
import AdminWorkBench from '@/app/admin/users/components/workbench/AdminWorkBench'
// Renders full responsive dashboard
```

### Just the Feature Flag Wrapper
```tsx
import ExecutiveDashboardTabWrapper from '@/app/admin/users/components/ExecutiveDashboardTabWrapper'
// Routes between old/new UI based on flag
```

### Standalone Sidebar
```tsx
import AdminSidebar from '@/app/admin/users/components/workbench/AdminSidebar'
<AdminSidebar onFilterChange={(filters) => console.log(filters)} />
```

### Bulk Actions
```tsx
import BulkActionsPanel from '@/app/admin/users/components/workbench/BulkActionsPanel'
<BulkActionsPanel 
  selectedCount={5} 
  selectedUserIds={new Set(['1','2','3','4','5'])}
  onClear={() => console.log('cleared')}
/>
```

---

## 🔌 Using Data Hooks

### Fetch Users with Filtering
```tsx
import { useUsers } from '@/app/admin/users/components/workbench/hooks'

export function UsersList() {
  const { data, isLoading, error } = useUsers({ 
    role: 'ADMIN',
    limit: 100
  })
  
  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {data?.users.map(u => <div key={u.id}>{u.name}</div>)}
    </div>
  )
}
```

### Fetch Dashboard Stats
```tsx
import { useStats } from '@/app/admin/users/components/workbench/hooks'

export function Dashboard() {
  const { data: stats, isLoading } = useStats()
  
  return (
    <div>
      <p>Active Users: {stats?.activeUsers}</p>
      <p>Pending: {stats?.pendingApprovals}</p>
    </div>
  )
}
```

### Apply Bulk Action
```tsx
import { useBulkAction } from '@/app/admin/users/components/workbench/hooks'

export function BulkUpdate() {
  const bulkAction = useBulkAction()
  
  const handleApply = async () => {
    await bulkAction.mutateAsync({
      userIds: ['1', '2', '3'],
      action: 'set-status',
      value: 'INACTIVE'
    })
  }
  
  return <button onClick={handleApply}>Apply</button>
}
```

---

## 🔍 Debugging Tips

### Check Feature Flag Status
```javascript
// In browser console
const { isAdminWorkBenchEnabled } = await import('@/lib/admin/featureFlags')
console.log(isAdminWorkBenchEnabled())
```

### View Component Props
```tsx
// Each component has TypeScript interfaces at the top
// Click on component name in IDE → Go to Definition (F12)
// See full prop types and descriptions
```

### Network Debugging
1. Open DevTools → Network tab
2. Filter by `Fetch/XHR`
3. Watch API calls: `/api/admin/users`, `/api/admin/users/stats`, etc.
4. Click request → Response tab to see data

### Performance Debugging
1. DevTools → Performance tab
2. Click record, interact with dashboard, stop
3. Look for long tasks, main thread blocking
4. Virtual scroller should handle large lists efficiently

---

## 📋 Testing Checklist

Before deploying, test:

- [ ] Feature flag wrapper shows correct UI
- [ ] Single user selection works
- [ ] Multi-user selection works
- [ ] Clear selection works
- [ ] Bulk action dropdown opens
- [ ] Action value updates based on type
- [ ] Preview modal shows action summary
- [ ] Apply/Cancel buttons in modal work
- [ ] Undo toast appears after apply
- [ ] Undo functionality works
- [ ] Role filter narrows user list
- [ ] Status filter narrows user list
- [ ] Department filter works
- [ ] Date range filter works
- [ ] Clear filters button works
- [ ] Responsive on desktop (1920px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on mobile (375px)
- [ ] Dark mode renders correctly
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes

---

## 📞 Need Help?

### Documentation
- Full Details: [`docs/ADMIN_WORKBENCH_IMPLEMENTATION_SUMMARY.md`](./ADMIN_WORKBENCH_IMPLEMENTATION_SUMMARY.md)
- Progress Report: [`docs/ADMIN_WORKBENCH_PHASE_1_5_PROGRESS.md`](./ADMIN_WORKBENCH_PHASE_1_5_PROGRESS.md)
- Roadmap: [`docs/ADMIN_USERS_WORKBENCH_TRANSFORMATION_ROADMAP.md`](./ADMIN_USERS_WORKBENCH_TRANSFORMATION_ROADMAP.md)

### Component Source Files
- All components in: `src/app/admin/users/components/workbench/`
- Each file has JSDoc comments explaining purpose
- TypeScript interfaces document all props

### Questions?
1. Check component TypeScript interfaces
2. Look at how similar components are used
3. Refer to existing ExecutiveDashboardTab for patterns
4. Review React Query hooks documentation

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Ready for Testing & Deployment
