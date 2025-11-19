# API Authentication & Authorization Middleware

**Location**: `src/lib/auth-middleware.ts`  
**Framework**: Next.js API Routes  
**Authentication**: NextAuth.js (with session-based auth)  

---

## Overview

The auth middleware provides four wrapper functions to easily secure API routes with authentication and authorization checks. Each middleware:

1. Validates the user's session
2. Fetches user data from the database
3. Attaches user context to the request
4. Enforces role/permission requirements
5. Handles tenant isolation

### Middleware Stack

| Middleware | Auth Required | Tenant Check | Permission Check | Use Case |
|-----------|---|---|---|---|
| **withAdminAuth** | ✅ Yes | ❌ No | Role-based | Admin operations |
| **withPermissionAuth** | ✅ Yes | ❌ No | Permission-based | Fine-grained control |
| **withTenantAuth** | ✅ Yes | ✅ Yes | Role-based | Multi-tenant APIs |
| **withPublicAuth** | ❌ No | ❌ No | None | Public APIs |

---

## Request Context

All authenticated requests receive a context object with user information:

```typescript
interface AuthenticatedRequest extends NextRequest {
  userId: string        // Unique user ID
  tenantId: string      // User's tenant/organization ID
  userRole: string      // User's role (ADMIN, CLIENT, TEAM_MEMBER, etc.)
  userEmail: string     // User's email address
}
```

Access this context inside your handler:

```typescript
export const GET = withAdminAuth(async (request) => {
  const userId = request.userId
  const tenantId = request.tenantId
  const userRole = request.userRole
  // ... use context
  return NextResponse.json({ ... })
})
```

---

## Middleware Types

### 1. withAdminAuth

Requires user to be authenticated and have one of the specified admin roles.

**Default roles**: `['ADMIN', 'SUPER_ADMIN']`

**Signature**:
```typescript
function withAdminAuth(
  handler: MiddlewareHandler,
  requiredRoles?: string[]
): NextResponse
```

**Usage**:
```typescript
// Basic: requires ADMIN or SUPER_ADMIN role
export const GET = withAdminAuth(async (request) => {
  return NextResponse.json({
    message: `Hello ${request.userEmail}`,
    tenantId: request.tenantId,
  })
})

// Custom roles: require specific role
export const POST = withAdminAuth(
  async (request) => {
    const data = await request.json()
    // Create new service
    return NextResponse.json({ success: true })
  },
  ['ADMIN', 'TEAM_LEAD']  // Custom required roles
)
```

**Errors**:
```
401 Unauthorized: No session found
401 Unauthorized: User not found in database
403 Forbidden: User role not in required roles
500 Internal server error
```

---

### 2. withPermissionAuth

Requires user to be authenticated and have specific permissions. More granular than role-based access.

**Signature**:
```typescript
function withPermissionAuth(
  handler: MiddlewareHandler,
  requiredPermissions?: string[]
): NextResponse
```

**Usage**:
```typescript
// No specific permissions required (any authenticated user)
export const GET = withPermissionAuth(async (request) => {
  return NextResponse.json({ user: request.userId })
})

// Require specific permissions
export const DELETE = withPermissionAuth(
  async (request) => {
    const { id } = await request.json()
    // Delete resource
    return NextResponse.json({ success: true })
  },
  ['admin:delete', 'resource:manage']  // Required permissions
)
```

**Permission Check Logic**:
- User must have **at least one** of the required permissions
- SUPER_ADMIN role always has all permissions (bypass check)
- Permissions come from `user.userPermissions` table

**Errors**:
```
401 Unauthorized: No session found
401 Unauthorized: User not found
403 Forbidden: Missing required permissions
500 Internal server error
```

---

### 3. withTenantAuth

Requires user to be authenticated and enforces tenant isolation. Prevents users from accessing other organizations' data.

**Signature**:
```typescript
function withTenantAuth(
  handler: MiddlewareHandler,
  requiredRoles?: string[]
): NextResponse
```

**Tenant ID Sources** (in order of precedence):
1. `x-tenant-id` HTTP header
2. `tenantId` query parameter

**Usage**:
```typescript
// Basic: any authenticated user in their tenant
export const GET = withTenantAuth(async (request) => {
  // request.tenantId is the user's tenant ID
  return NextResponse.json({
    tenantId: request.tenantId,
    userId: request.userId,
  })
})

// With specific roles
export const POST = withTenantAuth(
  async (request) => {
    const data = await request.json()
    // request.tenantId guarantees user has access to this tenant
    const result = await saveData(request.tenantId, data)
    return NextResponse.json(result)
  },
  ['ADMIN', 'TEAM_LEAD']
)
```

**Tenant Validation Logic**:
- User's session tenant ID must match the requested tenant ID
- Exception: SUPER_ADMIN can access any tenant
- Prevents horizontal privilege escalation

**Errors**:
```
400 Bad request: Tenant ID not provided in header or query
401 Unauthorized: No session found
401 Unauthorized: User not found
403 Forbidden: User cannot access this tenant
403 Forbidden: User role not in required roles
500 Internal server error
```

**Example with Query Parameter**:
```typescript
// Request: GET /api/data?tenantId=tenant-123
export const GET = withTenantAuth(async (request) => {
  // Automatically validated against request.tenantId from query
  return NextResponse.json({ tenantId: request.tenantId })
})
```

**Example with Header**:
```typescript
// Request with header: x-tenant-id: tenant-456
export const GET = withTenantAuth(async (request) => {
  // Automatically validated against request.tenantId from header
  return NextResponse.json({ tenantId: request.tenantId })
})
```

---

### 4. withPublicAuth

Allows public access without authentication. Optionally attaches user context if authenticated.

**Signature**:
```typescript
function withPublicAuth(handler: MiddlewareHandler): NextResponse
```

**Usage**:
```typescript
// Completely public endpoint
export const GET = withPublicAuth(async (request) => {
  return NextResponse.json({
    message: 'This is public',
    userId: request.userId || null,  // May be undefined
  })
})

// Public endpoint with optional user context
export const POST = withPublicAuth(async (request) => {
  const data = await request.json()
  
  // Optionally use user context if authenticated
  if (request.userId) {
    // Log action with user
    console.log(`User ${request.userId} did something`)
  } else {
    // Anonymous action
    console.log('Anonymous action')
  }
  
  return NextResponse.json({ success: true })
})
```

**Behavior**:
- No authentication required
- If user is authenticated, `userId`, `tenantId`, `userRole` are populated
- If user is not authenticated, these fields may be `undefined`
- Always succeeds (no 401/403 errors)

**Errors**:
```
500 Internal server error (only)
```

---

## Chaining Middleware

You can use middleware helpers with role/permission checks in sequence. However, they don't formally "chain"—you nest them:

```typescript
// NOT RECOMMENDED: Harder to read
export const POST = withAdminAuth(
  async (request) => {
    // Extra validation
    if (request.userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only SUPER_ADMIN can do this' },
        { status: 403 }
      )
    }
    // ... handle request
  },
  ['ADMIN', 'SUPER_ADMIN']
)
```

**BETTER**: Use direct role/permission checks for clarity:

```typescript
export const POST = withAdminAuth(async (request) => {
  // If we reach here, user is ADMIN or SUPER_ADMIN
  if (request.userRole !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Only SUPER_ADMIN can do this' },
      { status: 403 }
    )
  }
  // ... handle request
})
```

---

## Type Safety

Import the `AuthenticatedRequest` type for TypeScript support:

```typescript
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAdminAuth(async (request: AuthenticatedRequest) => {
  // TypeScript knows about userId, tenantId, userRole, userEmail
  const userId: string = request.userId  // ✅ No type errors
  
  return NextResponse.json({ userId })
})
```

---

## Error Handling

All middleware catch errors and return:
```json
{
  "error": "Internal server error",
  "status": 500
}
```

For auth-specific errors, check the HTTP status code:

| Status | Meaning | Action |
|--------|---------|--------|
| **401** | Unauthorized | User not authenticated or session invalid |
| **403** | Forbidden | User lacks required role/permission/tenant access |
| **400** | Bad Request | Missing required parameters |
| **500** | Server Error | Unexpected exception |

**Example Error Handling**:
```typescript
const response = await fetch('/api/admin/data')
if (response.status === 401) {
  // Redirect to login
  window.location.href = '/login'
} else if (response.status === 403) {
  // Show "Access Denied"
  showError('You do not have permission to access this resource')
} else if (!response.ok) {
  // Handle other errors
  const { error } = await response.json()
  console.error(error)
}
```

---

## Security Best Practices

1. **Always Validate Tenant ID**: Use `withTenantAuth` for any endpoint accessing user/client data
2. **Prefer Permission-Based**: Use `withPermissionAuth` over `withAdminAuth` for fine-grained control
3. **Check Role Explicitly**: If you need specific behavior per role, check `request.userRole` explicitly
4. **Validate Input**: Don't assume input is valid just because auth passed
5. **Log Access**: Consider logging sensitive operations for audit trails

**Example**:
```typescript
import { withTenantAuth } from '@/lib/auth-middleware'
import { logAudit } from '@/lib/audit'

export const DELETE = withTenantAuth(async (request) => {
  const { resourceId } = await request.json()
  
  // Validate resource belongs to user's tenant
  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      tenantId: request.tenantId,
    },
  })
  
  if (!resource) {
    return NextResponse.json(
      { error: 'Resource not found' },
      { status: 404 }
    )
  }
  
  // Delete and audit
  await prisma.resource.delete({ where: { id: resourceId } })
  await logAudit(request.userId, `Deleted resource: ${resourceId}`, request.tenantId)
  
  return NextResponse.json({ success: true })
})
```

---

## Common Patterns

### Pattern 1: Admin-Only Feature

```typescript
export const POST = withAdminAuth(
  async (request) => {
    const data = await request.json()
    // Only ADMIN and SUPER_ADMIN reach here
    return NextResponse.json(await createAdminResource(data))
  },
  ['ADMIN', 'SUPER_ADMIN']
)
```

### Pattern 2: Multi-Tenant API

```typescript
export const GET = withTenantAuth(async (request) => {
  // request.tenantId is already validated
  const data = await prisma.data.findMany({
    where: { tenantId: request.tenantId },
  })
  return NextResponse.json(data)
})
```

### Pattern 3: Permission-Based CRUD

```typescript
export const GET = withPermissionAuth(
  async (request) => {
    // READ permission
    return NextResponse.json(await fetchData())
  },
  ['resource:read']
)

export const POST = withPermissionAuth(
  async (request) => {
    // CREATE permission
    return NextResponse.json(await createData(await request.json()))
  },
  ['resource:create']
)

export const PUT = withPermissionAuth(
  async (request) => {
    // UPDATE permission
    return NextResponse.json(await updateData(await request.json()))
  },
  ['resource:update']
)

export const DELETE = withPermissionAuth(
  async (request) => {
    // DELETE permission
    return NextResponse.json(await deleteData(await request.json()))
  },
  ['resource:delete']
)
```

### Pattern 4: Public API with Optional Auth

```typescript
export const GET = withPublicAuth(async (request) => {
  const publicData = await fetchPublicData()
  
  if (request.userId) {
    // Add user-specific data if authenticated
    const userData = await fetchUserData(request.userId)
    return NextResponse.json({ ...publicData, user: userData })
  }
  
  return NextResponse.json(publicData)
})
```

---

## Testing

Mock `getServerSession` and `prisma.user.findUnique`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'
import { GET } from './route'

vi.mock('next-auth/next')
vi.mock('@/lib/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
  },
}))

describe('GET /api/admin/data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    
    const request = new Request('http://localhost/api/admin/data')
    const response = await GET(request as any)
    
    expect(response.status).toBe(401)
  })

  it('returns 403 if user is not admin', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-1' }
    } as any)
    
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'user-1',
      role: 'CLIENT',
      tenantId: 'tenant-1',
      email: 'user@example.com',
    })
    
    const request = new Request('http://localhost/api/admin/data')
    const response = await GET(request as any)
    
    expect(response.status).toBe(403)
  })

  it('returns 200 if user is admin', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'admin-1' }
    } as any)
    
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'admin-1',
      role: 'ADMIN',
      tenantId: 'tenant-1',
      email: 'admin@example.com',
    })
    
    const request = new Request('http://localhost/api/admin/data')
    const response = await GET(request as any)
    
    expect(response.status).toBe(200)
  })
})
```

---

## API Routes Using These Middlewares

### Admin Services

**File**: `src/app/api/admin/services/route.ts`

```typescript
import { withAdminAuth } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const GET = withAdminAuth(async (request) => {
  const services = await prisma.service.findMany({
    where: { tenantId: request.tenantId },
  })
  return NextResponse.json({ success: true, data: services })
})

export const POST = withAdminAuth(async (request) => {
  const data = await request.json()
  const service = await prisma.service.create({
    data: {
      ...data,
      tenantId: request.tenantId,
    },
  })
  return NextResponse.json({ success: true, data: service })
})
```

### Multi-Tenant User Data

**File**: `src/app/api/users/route.ts`

```typescript
import { withTenantAuth } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const GET = withTenantAuth(async (request) => {
  const users = await prisma.user.findMany({
    where: { tenantId: request.tenantId },
    select: { id: true, email: true, name: true, role: true },
  })
  return NextResponse.json({ success: true, data: users })
})
```

### Permission-Based Invoice Access

**File**: `src/app/api/invoices/route.ts`

```typescript
import { withPermissionAuth } from '@/lib/auth-middleware'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const GET = withPermissionAuth(
  async (request) => {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: request.tenantId },
    })
    return NextResponse.json({ success: true, data: invoices })
  },
  ['invoices:view']
)

export const POST = withPermissionAuth(
  async (request) => {
    const data = await request.json()
    const invoice = await prisma.invoice.create({
      data: { ...data, tenantId: request.tenantId },
    })
    return NextResponse.json({ success: true, data: invoice })
  },
  ['invoices:create']
)
```

---

## Troubleshooting

**Q: I'm getting 401 even though I'm logged in**

A: Check that:
- Session is valid in NextAuth
- User exists in database with correct ID
- Session user ID matches database user ID

**Q: I'm getting 403 even though I have the role**

A: Check that:
- Role name matches exactly (case-sensitive)
- You're passing the role to the middleware
- User role hasn't been changed in database

**Q: Tenant validation not working**

A: Check that:
- You're passing tenant ID in header (`x-tenant-id`) or query (`tenantId`)
- Tenant ID in request matches user's tenant ID
- You're using `withTenantAuth`, not `withAdminAuth`

**Q: How do I allow SUPER_ADMIN to bypass checks?**

A: All middleware functions automatically bypass role/tenant checks for SUPER_ADMIN.

---

## Related Documentation

- [API Response Contract](./RESPONSE_CONTRACT.md) - Standard response format
- [`src/lib/permissions.ts`](../../src/lib/permissions.ts) - Permission definitions
- [`src/lib/auth.ts`](../../src/lib/auth.ts) - NextAuth configuration
- [`src/lib/rbac.ts`](../../src/lib/rbac.ts) - RBAC utilities

---

**Version**: 1.0  
**Last Updated**: November 2024  
**Maintained By**: Development Team
