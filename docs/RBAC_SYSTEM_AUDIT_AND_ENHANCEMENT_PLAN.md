# RBAC System Audit and Enhancement Plan

**Date:** October 28, 2025  
**Status:** Audit Complete - Planning Phase  
**Issue:** SUPER_ADMIN user getting "Access Denied" (403 error) on dashboard pages  
**Priority:** High  

---

## Executive Summary

The current RBAC (Role-Based Access Control) system has a **disconnect** between backend API protection and frontend permission checks. While SUPER_ADMIN is theoretically supposed to have "full access," there are multiple points of failure:

1. ✅ **Permission System** is correctly configured (SUPER_ADMIN has all permissions)
2. ❌ **API Wrapper** enforces `requireSuperAdmin` checks on some routes (returns 403)
3. ❌ **PermissionGate** component properly checks permissions but affected by missing API access
4. ❌ **AdminSidebar** filters navigation by permissions (hides pages SUPER_ADMIN should see)
5. ❌ **No Control Panel** for super users to manage other users' roles and permissions

**Root Cause:** Backend API routes use `requireSuperAdmin` parameter which blocks access even when SUPER_ADMIN should have permissions via granular permission system.

---

## Current System Analysis

### 1. Permission System Architecture

**File:** `src/lib/permissions.ts`

**Current Implementation:**
- ✅ 100+ granular permissions defined (e.g., `PERMISSIONS.BOOKING_SETTINGS_EDIT`)
- ✅ ROLE_PERMISSIONS mapping for 5 roles: CLIENT, TEAM_MEMBER, TEAM_LEAD, ADMIN, SUPER_ADMIN
- ✅ hasPermission() function returns true for SUPER_ADMIN regardless of specific permission
- ✅ Proper type system for Permission type

**Strengths:**
```typescript
// SUPER_ADMIN always has access
SUPER_ADMIN: [...Object.values(PERMISSIONS)]

export function hasPermission(userRole: string | undefined | null, permission: Permission): boolean {
  if (!userRole) return false
  try {
    const roleNormalized = String(userRole).toUpperCase()
    if (roleNormalized === 'SUPER_ADMIN') return true  // ✅ Correct
  } catch {}
  const allowed = ROLE_PERMISSIONS[userRole]
  return Array.isArray(allowed) ? allowed.includes(permission) : false
}
```

**Issues:**
- Hardcoded role permissions (not database-driven, can't be customized per tenant)
- No audit logging of permission changes
- No fine-grained role management UI

### 2. API Wrapper Authorization

**File:** `src/lib/api-wrapper.ts`

**Problem Areas:**
```typescript
// Line 212-218: Hard-coded SUPER_ADMIN check
if (requireSuperAdmin && user.role !== 'SUPER_ADMIN') {
  return attachRequestId(
    NextResponse.json(
      { error: 'Forbidden', message: 'Super admin access required' },
      { status: 403 }
    )
  )
}
```

**Impact:**
- Routes that use `requireSuperAdmin: true` will reject ADMIN role users
- No fallback to granular permission checking
- Creates inconsistency: PermissionGate allows ADMIN, API rejects ADMIN

**Found Usage:**
- Various admin API routes check this flag
- Some routes probably use it when they shouldn't

### 3. Permission Gate Component

**File:** `src/components/PermissionGate.tsx`

**Current Implementation:**
```typescript
export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const perms = Array.isArray(permission) ? permission : [permission]
  const allowed = perms.some((p) => hasPermission(role, p))
  return allowed ? <>{children}</> : <>{fallback}</>
}
```

**Status:** ✅ Works correctly for permission checking

**Issues:**
- Only frontend check (doesn't prevent API calls)
- No logging or audit trail
- Fallback UI just hides content (no explanation to user)

### 4. Admin Sidebar Navigation

**File:** `src/components/admin/layout/AdminSidebar.tsx`

**Current Implementation:**
- Filters navigation items by permission using `hasPermission()`
- Respects `permission` property on navigation items
- Applies user's menu customization

**Issues:**
- Some pages might be hidden from SUPER_ADMIN if permission not set correctly on nav item
- No visual indicator for "access denied" vs "hidden by customization"
- Inconsistent with API permissions

### 5. Team/User Management

**Files:** 
- `src/app/admin/team/page.tsx` - Gated with PERMISSIONS.TEAM_VIEW
- `src/app/admin/users/page.tsx` - No explicit gate, uses `usePermissions()` check
- `src/components/admin/team-management` - Basic team member management (not found in search)

**Current Capabilities:**
- Team page can view team members
- Users page can view/manage users
- **Missing:** Role assignment modal/panel for SUPER_ADMIN to manage other users' roles
- **Missing:** Permission assignment UI for custom roles

---

## Problem Statement

### Scenario: SUPER_ADMIN Gets "Access Denied"

User logs in as SUPER_ADMIN → Navigates to `/admin/dashboard` → Receives 403 error

**Screenshot Analysis:**
- Shows "Access Denied" message
- "You do not have permission to view this dashboard"
- "Contact your administrator for access"

**Why This Happens:**

1. **Backend API Wrapper Issue:**
   - Some admin routes use `requireSuperAdmin: true`
   - SUPER_ADMIN user can't get a session with proper role verification
   - API returns 403 because user.role !== 'SUPER_ADMIN'

2. **Permission vs Role Mismatch:**
   - Frontend checks granular permissions (which SUPER_ADMIN has)
   - Backend checks role string (which might not be set correctly)
   - This creates inconsistency

3. **Missing Control Panel:**
   - SUPER_ADMIN can't assign roles to other users
   - Can't create custom role definitions
   - Can't manage granular permissions per user/role

---

## Existing Components Audit

### User Management Component
**File:** `src/app/admin/users/page.tsx`

**Current Features:**
- View user list with stats
- Search/filter users
- Display user roles (ADMIN, TEAM_MEMBER, TEAM_LEAD, STAFF, CLIENT)
- User detail dialogs
- Edit user information

**Missing:**
- ❌ Role assignment modal
- ❌ Permission assignment UI
- ❌ Bulk role changes
- ❌ Custom role definition
- ❌ Permission granularity controls

### Team Management Component
**File:** `src/app/admin/team/page.tsx`

**Current Features:**
- Team workload chart
- Team member management (imported from component)
- View team member assignments

**Missing:**
- ❌ Role management for team members
- ❌ Permission controls
- ❌ Availability scheduling (basic view exists)

### Permissions Page
**File:** `src/app/admin/permissions/`

**Current Features:**
- UserPermissionsInspector component (view current user permissions)
- RolePermissionsViewer component (view role-permission mapping)

**Missing:**
- ❌ Edit role definitions
- ❌ Create custom roles
- ❌ Assign permissions to roles
- ❌ Audit trail of permission changes

---

## Technical Debt & Issues Found

### 1. Role/Permission Separation
**Issue:** System mixes role-based (CLIENT, ADMIN) with permission-based (granular) approach
- API uses `requireSuperAdmin` which checks role
- Frontend uses `hasPermission()` which checks granular permissions
- These don't align

**Impact:** SUPER_ADMIN might be denied access even though they have all permissions

### 2. Hardcoded Role Permissions
**Issue:** ROLE_PERMISSIONS is hardcoded in code, not in database
- Can't be customized per tenant
- Requires code change to modify
- No audit trail

### 3. Missing API Documentation
**Issue:** No clear documentation of which API endpoints require what

### 4. Inconsistent Permission Checks
**Issue:** Some pages use PermissionGate, others don't
- Session page: `if (!['ADMIN','TEAM_LEAD','SUPER_ADMIN'].includes(role))`
- Posts page: `if (!['ADMIN', 'STAFF'].includes(String(ctx.role)))`
- Different patterns across codebase

### 5. No Role Management UI
**Issue:** No way for SUPER_ADMIN to manage roles and permissions
- Can't assign roles to users through UI
- Can't create custom roles
- Can't modify role permissions

---

## Enhancement Plan

### Phase 1: Fix SUPER_ADMIN Access (Immediate)

**Priority:** High  
**Estimated Time:** 2-3 hours

#### 1.1 Create SUPER_ADMIN Authorization Helper
```typescript
// src/lib/auth-helpers.ts
export function isSuperAdminOrHasPermission(
  userRole: string | undefined,
  permission: Permission
): boolean {
  if (userRole === 'SUPER_ADMIN') return true
  return hasPermission(userRole, permission)
}

export function isSuperAdminOrAdmin(userRole: string | undefined): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')
}
```

#### 1.2 Audit All API Routes
Find all routes using `requireSuperAdmin` and evaluate if they should:
- Use permission-based checking instead
- Have a fallback permission check
- Be SUPER_ADMIN only

**Affected Files:**
```
src/app/api/admin/**/*
- Check each route.ts for requireSuperAdmin: true
- Replace with appropriate permission checks
```

#### 1.3 Ensure Session Has Correct Role
**File:** `src/lib/auth.ts`
- Verify role is correctly set during login
- Add SUPER_ADMIN detection logic
- Ensure role persists in session

### Phase 2: Role Assignment Control Panel (Core Feature)

**Priority:** High  
**Estimated Time:** 4-6 hours

#### 2.1 Create Role Manager Modal Component
```typescript
// src/components/admin/settings/RoleManagerModal.tsx
export interface RoleManagerModalProps {
  userId: string
  userName: string
  currentRole: string
  onSave: (role: string) => Promise<void>
  onClose: () => void
}
```

**Features:**
- Display current role
- Show available roles (dropdown or radio group)
- Display permission changes
- Confirmation dialog before save
- Error handling

#### 2.2 Extend Users Page with Role Management
**File:** `src/app/admin/users/page.tsx`

**Add:**
- Role assignment button in user row
- Role change modal
- Bulk role assignment
- Audit log of role changes
- Visual indicator of user's current role

**Implementation:**
```typescript
// Add to AdminUsersPage
const [roleModalOpen, setRoleModalOpen] = useState(false)
const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)

const handleRoleChange = async (userId: string, newRole: string) => {
  // Call API
  await apiFetch(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role: newRole })
  })
  // Refresh user list
}
```

#### 2.3 Create Role Management API Endpoint
```typescript
// src/app/api/admin/users/[id]/role/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { role } = await request.json()
  
  // Require SUPER_ADMIN
  // Validate role
  // Update user in database
  // Log change in audit
  // Return updated user
}
```

### Phase 3: Enhanced Permissions Management (Advanced)

**Priority:** Medium  
**Estimated Time:** 6-8 hours

#### 3.1 Create Role Definition Manager
**Component:** `src/components/admin/settings/RoleDefinitionManager.tsx`

**Features:**
- View all roles and their permissions
- Create custom roles
- Edit role permissions
- Delete custom roles
- Clone existing roles

#### 3.2 Permission Assignment UI
**Component:** `src/components/admin/settings/PermissionAssignmentPanel.tsx`

**Features:**
- Tree view of permissions by category
- Checkbox to assign/revoke permissions
- Show current assignments
- Bulk permission management
- Clear permission descriptions

#### 3.3 Database Schema Updates
```prisma
// prisma/schema.prisma
model CustomRole {
  id          String    @id @default(cuid())
  tenantId    String
  name        String
  description String?
  permissions String[]  // JSON array of permission keys
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@unique([tenantId, name])
  @@index([tenantId])
}

model UserPermissionAudit {
  id          String    @id @default(cuid())
  userId      String
  changedBy   String    // SUPER_ADMIN who made change
  oldRole     String?
  newRole     String?
  permissions String[]  // Changed permissions
  reason      String?
  createdAt   DateTime  @default(now())
  
  @@index([userId])
  @@index([changedBy])
}
```

### Phase 4: Control Panel Settings

**Priority:** Medium  
**Estimated Time:** 3-4 hours

#### 4.1 Create Admin Control Panel Component
**File:** `src/app/admin/settings/control-panel/page.tsx`

**Sections:**
1. **Role Management**
   - Predefined roles (CLIENT, TEAM_MEMBER, etc.)
   - Custom roles
   - Permission assignments

2. **User Permissions**
   - List all users with their roles
   - Quick role change
   - Permission viewer

3. **Audit Log**
   - Show all role/permission changes
   - Filter by user, date, change type
   - Export audit data

4. **Settings**
   - Default role for new users
   - Disable specific roles
   - Permission defaults

#### 4.2 Create Control Panel Navigation Item
**Update:** `src/components/admin/layout/AdminSidebar.tsx`

Add to settings section:
```typescript
{
  name: 'Control Panel',
  href: '/admin/settings/control-panel',
  icon: SettingsIcon,
  permission: PERMISSIONS.SYSTEM_ADMIN_SETTINGS_EDIT
}
```

---

## Implementation Checklist

### ✅ Phase 1: Immediate Fix
- [ ] Create auth-helpers.ts with isSuperAdminOrHasPermission
- [ ] Audit all API routes for requireSuperAdmin usage
- [ ] Create comprehensive list of routes to fix
- [ ] Update API wrapper to use permission fallback
- [ ] Test SUPER_ADMIN access to all dashboard pages
- [ ] Verify session role is correctly set

### ✅ Phase 2: Role Management
- [ ] Create RoleManagerModal component
- [ ] Extend AdminUsersPage with role change UI
- [ ] Create /api/admin/users/[id]/role endpoint
- [ ] Add role change to user rows
- [ ] Implement error handling
- [ ] Add success notifications
- [ ] Test role changes persist

### ✅ Phase 3: Advanced Permissions
- [ ] Create RoleDefinitionManager component
- [ ] Create PermissionAssignmentPanel component
- [ ] Update database schema with CustomRole and audit tables
- [ ] Create API endpoints for custom role CRUD
- [ ] Implement permission cloning
- [ ] Add validation for permission dependencies

### ✅ Phase 4: Control Panel
- [ ] Create control panel page structure
- [ ] Implement role management section
- [ ] Implement user permissions section
- [ ] Implement audit log viewer
- [ ] Add control panel to navigation
- [ ] Create comprehensive role documentation
- [ ] Add help/tooltips for permissions

---

## File Structure (New Files to Create)

```
src/
├── components/
│   └── admin/
│       └── settings/
│           ├── RoleManagerModal.tsx          # Role assignment modal
│           ├── RoleDefinitionManager.tsx      # Custom role management
│           └── PermissionAssignmentPanel.tsx  # Permission UI
├── app/
│   └── admin/
│       ├── settings/
│       │   └── control-panel/
│       │       └── page.tsx                  # Main control panel
���       └── api/
│           └── admin/
│               ├── roles/
│               │   ├── route.ts              # CRUD roles
│               │   └── [id]/route.ts         # Role details
│               └── users/
│                   └── [id]/
│                       └── role/
│                           └── route.ts      # Role assignment API
└── lib/
    └── auth-helpers.ts                       # Authorization utilities
```

---

## Success Metrics

After implementation:
- ✅ SUPER_ADMIN can access all admin pages (403 errors gone)
- ✅ Can assign roles to users through UI
- ✅ Can create custom roles with granular permissions
- ✅ Audit trail of all role/permission changes
- ✅ Consistent permission checking (API + frontend)
- ✅ No hardcoded role checks in routes
- ✅ Clear error messages when access denied
- ✅ Full RBAC system documentation

---

## Risk Assessment

### Low Risk
- Adding new utility functions (auth-helpers)
- Creating new UI components (modals, panels)
- Adding new API endpoints

### Medium Risk
- Modifying API wrapper authorization logic (affects all routes)
- Database schema changes (requires migration)

### Mitigation Strategy
1. **Create feature flag** for new role management UI
2. **Backward compatibility** - keep existing permission system working
3. **Comprehensive testing** - unit + integration tests
4. **Gradual rollout** - test with admins first, then roll out to all users
5. **Clear documentation** - explain new system to users

---

## Timeline Estimate

| Phase | Task | Estimated Time |
|-------|------|-----------------|
| 1 | Fix SUPER_ADMIN access | 2-3 hours |
| 2 | Role management UI | 4-6 hours |
| 3 | Advanced permissions | 6-8 hours |
| 4 | Control panel | 3-4 hours |
| **Total** | **Complete system** | **15-21 hours** |

---

## Next Steps

1. ✅ **Complete this audit** (Done)
2. 🔄 **Implement Phase 1** - Fix SUPER_ADMIN access immediately
3. 📋 **Implement Phase 2** - Add role management UI
4. 🎯 **User acceptance testing** - Verify with stakeholders
5. 📚 **Documentation** - Create user guides and admin docs
6. 🚀 **Production rollout** - Deploy with monitoring

---

**Document Version:** 1.0  
**Last Updated:** October 28, 2025  
**Status:** Ready for Implementation
