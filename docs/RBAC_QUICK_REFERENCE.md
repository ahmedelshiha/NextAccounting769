# RBAC System - Quick Reference

**Issue:** SUPER_ADMIN user getting "Access Denied" (403) on admin dashboard

---

## Root Cause

API endpoint `/api/admin/stats/bookings` checks permissions but doesn't properly recognize SUPER_ADMIN status when passing context through API wrapper.

---

## Quick Fix (5 minutes)

**File:** `src/app/api/admin/stats/bookings/route.ts` (Line 20-23)

Change:
```typescript
if (!ctx.userId || !hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)) {
```

To:
```typescript
if (!ctx.userId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

const canAccess = ctx.isSuperAdmin || hasPermission(role, PERMISSIONS.ANALYTICS_VIEW)
if (!canAccess) {
```

**Why:** Uses `ctx.isSuperAdmin` flag which is properly set by API wrapper.

---

## Current System Structure

```
┌─────────────────────────────────────────────────────┐
│ Permission System (src/lib/permissions.ts)          │
├─────────────────────────────────────────────────────┤
│ ✅ Defines 100+ granular permissions                │
│ ✅ Maps roles to permissions                        │
│ ✅ SUPER_ADMIN has all permissions                  │
│ ❌ Hardcoded (not database-driven)                  │
│ ❌ No audit trail                                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ API Wrapper (src/lib/api-wrapper.ts)                │
├─────────────────────────────────────────────────────┤
│ ✅ Sets ctx.isSuperAdmin flag                       │
│ ✅ Extracts user role from session                  │
│ ❌ Some routes use requireSuperAdmin hardcoding     │
│ ❌ Inconsistent permission checking                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Frontend (PermissionGate, AdminSidebar)             │
├─────────────────────────────────────────────────────┤
│ ✅ Checks granular permissions                      │
│ ✅ Hides unauthorized pages                         │
│ ❌ No management UI for roles                       │
│ ❌ No control panel                                 │
└─────────────────────────────────────────────────────┘
```

---

## Permission Hierarchy

```
SUPER_ADMIN
  ├─ All permissions
  ├─ Can access all pages
  ├─ Can modify all settings
  └─ Can manage users & roles ❌ (NO UI YET)

ADMIN
  ├─ Most permissions
  ├─ Can access admin pages
  └─ Cannot modify system settings

TEAM_LEAD
  ├─ Team management permissions
  └─ Cannot access admin panel settings

TEAM_MEMBER
  └─ Limited to assigned tasks

STAFF
  └─ Limited permissions

CLIENT
  └─ Can only view their own data
```

---

## Issues Found

| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| SUPER_ADMIN blocked by 403 | 🔴 CRITICAL | `/api/admin/stats/bookings` | Use `ctx.isSuperAdmin` flag |
| Hardcoded role checks | 🟡 MEDIUM | Multiple API routes | Create auth-helpers.ts |
| No role management UI | 🟡 MEDIUM | Admin users page | Add role change modal |
| No control panel | 🟠 MEDIUM | Settings | New control-panel page |
| No audit trail | 🟠 MEDIUM | Entire system | Add audit logging |
| Hardcoded permissions | 🟢 LOW | permissions.ts | Future: database-driven |

---

## Files to Review

### Permission System
- **`src/lib/permissions.ts`** - Define roles and permissions
- **`src/lib/api-wrapper.ts`** - Verify context setup
- **`src/components/PermissionGate.tsx`** - Frontend permission check

### User Management
- **`src/app/admin/users/page.tsx`** - User list (no role management)
- **`src/app/admin/team/page.tsx`** - Team management (missing role controls)

### API Routes
- **`src/app/api/admin/stats/bookings/route.ts`** - Blocking 403
- **`src/app/api/admin/stats/users/route.ts`** - Same issue
- **`src/app/api/admin/bookings/stats/route.ts`** - Same issue

### Navigation
- **`src/components/admin/layout/AdminSidebar.tsx`** - Filters pages by permission

---

## Implementation Phases

### Phase 1: Emergency Fix (2 hours)
✅ Use `ctx.isSuperAdmin` flag in API checks  
✅ Fix blocking endpoints  
✅ Test SUPER_ADMIN access  

### Phase 2: Stabilize (4 hours)
✅ Create auth-helpers.ts utility  
✅ Audit all API routes  
✅ Apply consistent permission checks  

### Phase 3: Enhance (6 hours)
✅ Add role management UI  
✅ Create control panel page  
✅ Add audit logging  

### Phase 4: Polish (4 hours)
✅ Comprehensive documentation  
✅ User guides  
✅ Testing & verification  

---

## Success Criteria

- ✅ SUPER_ADMIN can access `/admin` dashboard
- ✅ No 403 errors for SUPER_ADMIN users
- ✅ Can assign roles to users through UI
- ✅ Control panel provides role/permission management
- ✅ Audit trail of all changes
- ✅ Consistent permission checking

---

## Next Steps

1. **Read detailed audit:** `docs/RBAC_SYSTEM_AUDIT_AND_ENHANCEMENT_PLAN.md`
2. **Read implementation guide:** `docs/RBAC_FIX_IMPLEMENTATION_GUIDE.md`
3. **Start with Phase 1:** Apply quick fix to `/api/admin/stats/bookings/route.ts`
4. **Test:** Verify SUPER_ADMIN access restored
5. **Continue with phases** as needed

---

## Key Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/permissions.ts` | Define roles & permissions | ✅ Working |
| `src/lib/api-wrapper.ts` | API context setup | ⚠️ Has issues |
| `src/components/PermissionGate.tsx` | Frontend permission check | ✅ Working |
| `src/app/admin/users/page.tsx` | User management | ⚠️ Missing role UI |
| `src/app/admin/team/page.tsx` | Team management | ⚠️ Missing role controls |
| `src/components/admin/layout/AdminSidebar.tsx` | Navigation filtering | ✅ Working |

---

## Document Reference

- **Full Audit:** `docs/RBAC_SYSTEM_AUDIT_AND_ENHANCEMENT_PLAN.md` (581 lines)
- **Implementation Guide:** `docs/RBAC_FIX_IMPLEMENTATION_GUIDE.md` (464 lines)
- **This Summary:** `docs/RBAC_QUICK_REFERENCE.md`

---

**Status:** ✅ Audit Complete - Ready for Implementation
