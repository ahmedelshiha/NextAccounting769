# RBAC System Fix - Implementation Guide

**Date:** October 28, 2025  
**Priority:** 🔴 CRITICAL  
**Issue:** SUPER_ADMIN user receiving 403 "Access Denied" on admin dashboard  

---

## Root Cause Analysis

### Issue Identified
The admin dashboard (`/admin`) fails to load for SUPER_ADMIN users with 403 error.

**Why This Happens:**
1. Admin page fetches `/api/admin/stats/bookings`
2. API checks: `hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)`
3. `hasPermission()` function is correct and returns `true` for SUPER_ADMIN
4. **Problem:** The role being passed may be `null`, `undefined`, or not `'SUPER_ADMIN'` in the context

### Debug Log Shows
```
Forbidden access to /api/admin/stats/bookings
{ userId: ctx.userId, role, isSuperAdmin: ctx.isSuperAdmin }
```

This indicates:
- ✅ ctx.isSuperAdmin is being set correctly
- ❌ ctx.role might be undefined or incorrect

---

## Quick Fix (Immediate)

### Option A: Use isSuperAdmin Flag (RECOMMENDED)

**File:** `src/app/api/admin/stats/bookings/route.ts`

**Current Code (Line 20-23):**
```typescript
if (!ctx.userId || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
  console.warn('Forbidden access to /api/admin/stats/bookings', { userId: ctx.userId, role, isSuperAdmin: ctx.isSuperAdmin })
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Fixed Code:**
```typescript
if (!ctx.userId) {
  console.warn('Forbidden access to /api/admin/stats/bookings - no userId', { userId: ctx.userId })
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

const canAccess = ctx.isSuperAdmin || hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)
if (!canAccess) {
  console.warn('Forbidden access to /api/admin/stats/bookings', { userId: ctx.userId, role, isSuperAdmin: ctx.isSuperAdmin })
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Why This Works:**
- Uses `ctx.isSuperAdmin` flag (set by API wrapper)
- Falls back to granular permission check
- More explicit about SUPER_ADMIN bypass

---

## Comprehensive Fix Plan

### Phase 1: Create Authorization Helper (2 hours)

**File:** `src/lib/auth-helpers.ts` (NEW)

```typescript
import { hasPermission, PERMISSIONS, Permission } from '@/lib/permissions'

/**
 * Check if user has SUPER_ADMIN role OR specific permission
 * @param isSuperAdmin - ctx.isSuperAdmin flag from API wrapper
 * @param userRole - User's role from session
 * @param permission - Permission to check
 * @returns true if user is SUPER_ADMIN or has the permission
 */
export function hasAccessWithSuperAdminBypass(
  isSuperAdmin: boolean | undefined,
  userRole: string | undefined,
  permission: Permission
): boolean {
  if (isSuperAdmin) return true
  return hasPermission(userRole, permission)
}

/**
 * Check if user can access admin features
 * @param isSuperAdmin - Is super admin
 * @param userRole - User role
 * @returns true if user can access admin dashboard
 */
export function canAccessAdminDashboard(
  isSuperAdmin: boolean | undefined,
  userRole: string | undefined
): boolean {
  if (isSuperAdmin) return true
  return ['ADMIN', 'TEAM_LEAD', 'STAFF'].includes(userRole || '')
}

/**
 * Check if user can manage other users (assign roles, etc)
 */
export function canManageUsers(
  isSuperAdmin: boolean | undefined,
  userRole: string | undefined
): boolean {
  return isSuperAdmin === true  // Only SUPER_ADMIN
}
```

### Phase 2: Audit and Fix All API Routes (3-4 hours)

**Step 1: Find all routes with permission checks**

Run this grep to find all affected files:
```bash
grep -r "hasPermission\|requireSuperAdmin\|Forbidden" src/app/api --include="*.ts" | grep "403"
```

**Step 2: Categorize routes:**

**A. Routes that should allow SUPER_ADMIN (Use bypass flag)**
```
/api/admin/stats/*
/api/admin/bookings/*
/api/admin/services/*
/api/admin/audit-logs
/api/admin/analytics/*
/api/admin/permissions/*
```

**B. Routes that require SUPER_ADMIN only (strict)**
```
/api/admin/org-settings/*
/api/admin/system-settings
/api/admin/users/[id]/role  (NEW - for role assignment)
```

**Step 3: Apply fix pattern to each route**

Pattern: Replace hardcoded role checks with helper function

**Example Route Fix:**

**Before:**
```typescript
// src/app/api/admin/stats/users/route.ts
if (!ctx.userId || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**After:**
```typescript
import { hasAccessWithSuperAdminBypass } from '@/lib/auth-helpers'

if (!ctx.userId || !hasAccessWithSuperAdminBypass(ctx.isSuperAdmin, role, PERMISSIONS.ANALYTICS_VIEW)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Phase 3: Add Missing Endpoints (2-3 hours)

**New Endpoint: Role Management**

**File:** `src/app/api/admin/users/[id]/role/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'

const ALLOWED_ROLES = ['ADMIN', 'TEAM_MEMBER', 'TEAM_LEAD', 'STAFF', 'CLIENT']

export const PATCH = withTenantContext(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    
    // Only SUPER_ADMIN can assign roles
    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
    }

    const { role } = await request.json()
    
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true }
    })

    // TODO: Log to audit trail
    console.log(`User role changed: ${params.id} -> ${role} by ${ctx.userId}`)

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
})
```

### Phase 4: Update Frontend Components (2 hours)

**File:** `src/app/admin/users/page.tsx`

Add role management modal:

```typescript
// Add to component state
const [roleModalOpen, setRoleModalOpen] = useState(false)
const [selectedUserForRole, setSelectedUserForRole] = useState<UserItem | null>(null)

// Add handler
const handleChangeRole = async (newRole: string) => {
  if (!selectedUserForRole) return
  
  try {
    const res = await apiFetch(`/api/admin/users/${selectedUserForRole.id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole })
    })
    
    if (res.success) {
      setUsers(users.map(u => u.id === selectedUserForRole.id ? { ...u, role: newRole } : u))
      setRoleModalOpen(false)
      // Show success toast
    }
  } catch (error) {
    // Show error toast
    console.error('Failed to change role:', error)
  }
}

// Add button in user row
<Button
  size="sm"
  variant="outline"
  onClick={() => {
    setSelectedUserForRole(user)
    setRoleModalOpen(true)
  }}
>
  {user.role}
</Button>

// Add modal component
{roleModalOpen && selectedUserForRole && (
  <RoleChangeModal
    user={selectedUserForRole}
    onSave={handleChangeRole}
    onClose={() => setRoleModalOpen(false)}
  />
)}
```

### Phase 5: Create Control Panel Settings Page (2-3 hours)

**File:** `src/app/admin/settings/control-panel/page.tsx` (NEW)

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import StandardPage from '@/components/dashboard/templates/StandardPage'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Sections:
// 1. Role Management - List all roles, create custom roles
// 2. User Permissions - Assign roles to users
// 3. Audit Log - View permission changes
// 4. Settings - Configure default role, etc

export default function ControlPanelPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  
  // Only SUPER_ADMIN can access
  if (role !== 'SUPER_ADMIN') {
    return <div className="p-6">Access denied. Only super admins can access control panel.</div>
  }

  return (
    <PermissionGate permission={[PERMISSIONS.SYSTEM_ADMIN_SETTINGS_EDIT]} fallback={<div>Access denied</div>}>
      <StandardPage
        title="Control Panel"
        subtitle="Manage roles, permissions, and user access"
      >
        <Tabs defaultValue="roles" className="w-full">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="roles">
            {/* Role management component */}
          </TabsContent>
          
          <TabsContent value="users">
            {/* User permission management */}
          </TabsContent>
          
          <TabsContent value="audit">
            {/* Audit log viewer */}
          </TabsContent>
          
          <TabsContent value="settings">
            {/* Control panel settings */}
          </TabsContent>
        </Tabs>
      </StandardPage>
    </PermissionGate>
  )
}
```

---

## Testing Checklist

After applying fixes:

### 1. Test SUPER_ADMIN Access
- [ ] Login as SUPER_ADMIN
- [ ] Navigate to `/admin` dashboard
- [ ] Verify no 403 errors
- [ ] Check browser console for warnings
- [ ] Verify all KPI cards load

### 2. Test API Endpoints
- [ ] Call `/api/admin/stats/bookings` as SUPER_ADMIN
- [ ] Call `/api/admin/stats/users` as SUPER_ADMIN
- [ ] Call `/api/admin/services/stats` as SUPER_ADMIN
- [ ] Verify all return 200 with data

### 3. Test Permission Guards
- [ ] Login as ADMIN (non-super)
- [ ] Verify access to allowed pages
- [ ] Verify denied access to super-admin-only pages
- [ ] Verify permission error messages are clear

### 4. Test Role Management
- [ ] Login as SUPER_ADMIN
- [ ] Navigate to Users page
- [ ] Try to change a user's role
- [ ] Verify role change persists
- [ ] Verify audit log records change

### 5. Test Control Panel
- [ ] Navigate to `/admin/settings/control-panel`
- [ ] View role definitions
- [ ] View user permissions
- [ ] View audit log
- [ ] Test filters and search

---

## Deployment Steps

### Pre-Deployment
1. Create feature branch: `git checkout -b fix/super-admin-access`
2. Make changes in phases (commits)
3. Run tests locally
4. Get code review

### Deployment
1. Merge to staging
2. Test in staging environment
3. Get stakeholder approval
4. Merge to production
5. Monitor logs for 403 errors

### Post-Deployment
1. Verify SUPER_ADMIN access works
2. Check API logs for permission errors
3. Monitor for 403 errors in Sentry
4. Get feedback from users

---

## Expected Outcome

After all phases complete:

✅ SUPER_ADMIN users can access admin dashboard  
✅ All API routes properly verify SUPER_ADMIN status  
✅ No inconsistency between frontend and backend permission checks  
✅ SUPER_ADMIN can manage user roles through UI  
✅ Control panel provides comprehensive role/permission management  
✅ Audit trail tracks all permission changes  
✅ Clear error messages when access is denied  

---

## Files to Modify/Create

### Phase 1
- `src/lib/auth-helpers.ts` (NEW)

### Phase 2
- `src/app/api/admin/stats/bookings/route.ts` (MODIFY)
- `src/app/api/admin/stats/users/route.ts` (MODIFY)
- `src/app/api/admin/stats/bookings/route.ts` (MODIFY)
- ... and ~10-15 more API routes

### Phase 3
- `src/app/api/admin/users/[id]/role/route.ts` (NEW)
- `src/app/api/admin/users/[id]/role/audit/route.ts` (NEW - optional)

### Phase 4
- `src/app/admin/users/page.tsx` (MODIFY)
- `src/components/admin/settings/RoleChangeModal.tsx` (NEW)

### Phase 5
- `src/app/admin/settings/control-panel/page.tsx` (NEW)
- `src/components/admin/settings/RoleManager.tsx` (NEW)
- `src/components/admin/settings/UserPermissionManager.tsx` (NEW)
- `src/components/admin/settings/AuditLogViewer.tsx` (NEW)

---

## Estimated Timeline

| Phase | Duration |
|-------|----------|
| 1: Auth Helpers | 2 hours |
| 2: Audit & Fix API Routes | 3-4 hours |
| 3: New Endpoints | 2-3 hours |
| 4: Frontend Components | 2 hours |
| 5: Control Panel | 2-3 hours |
| Testing | 2 hours |
| Documentation | 1 hour |
| **TOTAL** | **16-20 hours** |

---

## References

- Main audit: `docs/RBAC_SYSTEM_AUDIT_AND_ENHANCEMENT_PLAN.md`
- Permission system: `src/lib/permissions.ts`
- API wrapper: `src/lib/api-wrapper.ts`
- Permission gate: `src/components/PermissionGate.tsx`

---

**Next Step:** Start with Phase 1 (Auth Helpers) - it's quick and provides foundation for all other phases.

