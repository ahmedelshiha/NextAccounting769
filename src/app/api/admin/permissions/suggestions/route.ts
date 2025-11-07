import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PermissionEngine, PermissionSuggestion } from '@/lib/permission-engine'
import { getRolePermissions } from '@/lib/permissions'

/**
 * Response type for suggestions endpoint
 */
interface SuggestionsResponse {
  success: boolean
  suggestions: PermissionSuggestion[]
  error?: string
}

/**
 * GET /api/admin/permissions/suggestions
 * 
 * Get smart permission suggestions for a user based on:
 * - Common permissions for their role
 * - Permission dependencies
 * - Team/department patterns
 * - Usage history
 */
export async function GET(request: NextRequest): Promise<NextResponse<SuggestionsResponse>> {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const tenantId = request.headers.get('x-tenant-id')

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId query parameter is required',
          suggestions: [],
        },
        { status: 400 }
      )
    }

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          suggestions: [],
        },
        { status: 401 }
      )
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        department: true,
        tenantId: true,
      },
    })

    if (!user || user.tenantId !== tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          suggestions: [],
        },
        { status: 404 }
      )
    }

    // Get user's current permissions
    const currentPermissions = getRolePermissions(user.role)

    // Get suggestions
    const suggestions = PermissionEngine.getSuggestions(user.role, currentPermissions, {
      department: user.department || undefined,
    })

    return NextResponse.json({
      success: true,
      suggestions,
    })
  } catch (error) {
    console.error('[permissions/suggestions] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        suggestions: [],
      },
      { status: 500 }
    )
  }
}
