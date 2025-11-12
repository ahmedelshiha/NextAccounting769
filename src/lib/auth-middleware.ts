import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * User context attached to request
 */
export interface AuthenticatedRequest extends NextRequest {
  userId: string
  tenantId: string
  userRole: string
  userEmail: string
}

/**
 * Middleware response type
 */
type MiddlewareHandler = (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>

/**
 * Role type
 */
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'STAFF' | 'CLIENT'

/**
 * Wraps an API handler with admin authentication check
 * 
 * @param handler - The API route handler to wrap
 * @param requiredRoles - Optional array of required roles (defaults to ['ADMIN', 'SUPER_ADMIN'])
 * @returns Wrapped handler with authentication
 * 
 * @example
 * export const POST = withAdminAuth(async (request) => {
 *   // request has userId, tenantId, userRole, userEmail available
 *   const data = await request.json()
 *   // ... handle request
 *   return NextResponse.json({ success: true })
 * })
 */
export function withAdminAuth(
  handler: MiddlewareHandler,
  requiredRoles: UserRole[] = ['ADMIN', 'SUPER_ADMIN']
) {
  return async (request: NextRequest, context?: any) => {
    try {
      // Get session
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized: No session found' },
          { status: 401 }
        )
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          tenantId: true,
          role: true,
          email: true,
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized: User not found' },
          { status: 401 }
        )
      }

      // Check role authorization
      if (!requiredRoles.includes(user.role as UserRole)) {
        return NextResponse.json(
          {
            error: `Forbidden: Requires one of ${requiredRoles.join(', ')} role`,
            requiredRoles,
            userRole: user.role,
          },
          { status: 403 }
        )
      }

      // Attach user context to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.userId = user.id
      authenticatedRequest.tenantId = user.tenantId
      authenticatedRequest.userRole = user.role
      authenticatedRequest.userEmail = user.email

      // Call the actual handler
      return await handler(authenticatedRequest, context)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Wraps an API handler with permission-based authentication check
 * 
 * @param handler - The API route handler to wrap
 * @param requiredPermissions - Array of required permissions
 * @returns Wrapped handler with authentication and permission check
 */
export function withPermissionAuth(
  handler: MiddlewareHandler,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest, context?: any) => {
    try {
      // Get session
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized: No session found' },
          { status: 401 }
        )
      }

      // Get user from database with permissions
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          tenantId: true,
          role: true,
          email: true,
          userPermissions: {
            select: {
              permission: true,
            },
          },
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized: User not found' },
          { status: 401 }
        )
      }

      // Check permissions if required
      if (requiredPermissions.length > 0) {
        const userPermissions = user.userPermissions.map(p => p.permission)
        const hasRequiredPermission = requiredPermissions.some(p => 
          userPermissions.includes(p) || user.role === 'SUPER_ADMIN'
        )

        if (!hasRequiredPermission) {
          return NextResponse.json(
            {
              error: 'Forbidden: Missing required permissions',
              requiredPermissions,
            },
            { status: 403 }
          )
        }
      }

      // Attach user context to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.userId = user.id
      authenticatedRequest.tenantId = user.tenantId
      authenticatedRequest.userRole = user.role
      authenticatedRequest.userEmail = user.email

      // Call the actual handler
      return await handler(authenticatedRequest, context)
    } catch (error) {
      console.error('Permission auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Wraps an API handler with tenant isolation check
 * Ensures user can only access their own tenant's data
 * 
 * @param handler - The API route handler to wrap
 * @param requiredRoles - Optional array of required roles
 * @returns Wrapped handler with tenant isolation
 */
export function withTenantAuth(
  handler: MiddlewareHandler,
  requiredRoles: UserRole[] = []
) {
  return async (request: NextRequest, context?: any) => {
    try {
      // Get session
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized: No session found' },
          { status: 401 }
        )
      }

      // Get tenant ID from request
      const tenantIdHeader = request.headers.get('x-tenant-id')
      const url = new URL(request.url)
      const tenantIdQuery = url.searchParams.get('tenantId')
      const requestedTenantId = tenantIdHeader || tenantIdQuery

      if (!requestedTenantId) {
        return NextResponse.json(
          { error: 'Bad request: Tenant ID required' },
          { status: 400 }
        )
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          tenantId: true,
          role: true,
          email: true,
        },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized: User not found' },
          { status: 401 }
        )
      }

      // Check tenant isolation (except for SUPER_ADMIN)
      if (user.role !== 'SUPER_ADMIN' && user.tenantId !== requestedTenantId) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot access other tenant data' },
          { status: 403 }
        )
      }

      // Check role authorization if specified
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRole)) {
        return NextResponse.json(
          {
            error: `Forbidden: Requires one of ${requiredRoles.join(', ')} role`,
            requiredRoles,
            userRole: user.role,
          },
          { status: 403 }
        )
      }

      // Attach user context to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.userId = user.id
      authenticatedRequest.tenantId = user.tenantId
      authenticatedRequest.userRole = user.role
      authenticatedRequest.userEmail = user.email

      // Call the actual handler
      return await handler(authenticatedRequest, context)
    } catch (error) {
      console.error('Tenant auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Wraps an API handler with public access (no auth required)
 * Useful for public APIs that may optionally have user context
 * 
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler
 */
export function withPublicAuth(handler: MiddlewareHandler) {
  return async (request: NextRequest, context?: any) => {
    try {
      // Try to get session, but don't fail if not found
      const session = await getServerSession(authOptions)

      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            tenantId: true,
            role: true,
            email: true,
          },
        })

        if (user) {
          // Attach user context if authenticated
          const authenticatedRequest = request as AuthenticatedRequest
          authenticatedRequest.userId = user.id
          authenticatedRequest.tenantId = user.tenantId
          authenticatedRequest.userRole = user.role
          authenticatedRequest.userEmail = user.email
        }
      }

      // Call handler regardless of auth status
      return await handler(request as AuthenticatedRequest, context)
    } catch (error) {
      console.error('Public auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}
