import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PermissionEngine, ValidationError } from '@/lib/permission-engine'
import { PERMISSIONS, getRolePermissions, Permission, hasRole } from '@/lib/permissions'

/**
 * Request body for batch permission update
 */
interface BatchPermissionRequest {
  targetUserIds: string[]
  roleChange?: {
    from: string
    to: string
  }
  permissionChanges?: {
    added: Permission[]
    removed: Permission[]
  }
  reason?: string
  dryRun?: boolean
}

/**
 * Impact analysis for a single user
 */
interface UserImpact {
  userId: string
  email: string
  currentRole: string
  newRole?: string
  permissionsAdded: Permission[]
  permissionsRemoved: Permission[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  conflicts: string[]
}

/**
 * Response type for batch permission update
 */
interface BatchPermissionResponse {
  success: boolean
  preview?: boolean
  results?: Array<{ userId: string; success: boolean; error?: string }>
  changes?: {
    added: number
    removed: number
  }
  warnings?: Array<{ message: string }>
  conflicts?: Array<{ message: string }>
  impactAnalysis?: {
    totalUsersAffected: number
    riskBreakdown: {
      critical: number
      high: number
      medium: number
      low: number
    }
    userImpacts: UserImpact[]
    summary: string
  }
  message?: string
  error?: string
  details?: ValidationError[]
}

/**
 * Analyze potential conflicts when removing permissions
 */
function analyzeRemovalConflicts(
  removedPermissions: Permission[],
  remainingPermissions: Permission[]
): string[] {
  const conflicts: string[] = []

  // Check for permission dependencies (if permission X requires Y, but we're removing Y)
  for (const removed of removedPermissions) {
    // Common dependency patterns to check
    const dependencyMap: Record<string, string[]> = {
      'users.manage': ['users.view'],
      'users.view': [],
      'roles.manage': ['roles.view'],
      'roles.view': [],
      'permissions.manage': [],
    }

    // Check if any remaining permissions depend on the removed one
    for (const remaining of remainingPermissions) {
      const deps = dependencyMap[remaining]
      if (deps && deps.includes(removed)) {
        conflicts.push(
          `Removing '${removed}' may break '${remaining}' which depends on it`
        )
      }
    }
  }

  return [...new Set(conflicts)] // Remove duplicates
}

/**
 * Determine risk level for permission changes
 */
function calculateRiskLevel(
  roleChange?: { from: string; to: string },
  permissionsAdded?: Permission[],
  permissionsRemoved?: Permission[]
): 'low' | 'medium' | 'high' | 'critical' {
  let riskScore = 0

  // Role changes have inherent risk
  if (roleChange) {
    if (['ADMIN', 'SUPER_ADMIN'].includes(roleChange.to)) {
      riskScore += 50 // Critical risk for admin roles
    } else if (['TEAM_LEAD'].includes(roleChange.to)) {
      riskScore += 20 // Medium risk for lead roles
    }
  }

  // Adding many permissions increases risk
  const addedCount = permissionsAdded?.length || 0
  riskScore += addedCount * 5

  // Removing permissions has lower risk but still counts
  const removedCount = permissionsRemoved?.length || 0
  riskScore += removedCount * 2

  // Determine risk level
  if (riskScore >= 50) return 'critical'
  if (riskScore >= 30) return 'high'
  if (riskScore >= 10) return 'medium'
  return 'low'
}

/**
 * POST /api/admin/permissions/batch
 *
 * Update permissions for one or multiple users
 * Supports dry-run mode for previewing changes with full conflict detection
 */
export async function POST(request: NextRequest): Promise<NextResponse<BatchPermissionResponse>> {
  try {
    // Get session/user info from request (implementation depends on your auth system)
    // For now, we'll assume it's available in request headers or context
    const userId = request.headers.get('x-user-id')
    const tenantId = request.headers.get('x-tenant-id')
    
    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Verify user is admin/super_admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, tenantId: true },
    })

    if (!user || !hasRole(user.role, ['ADMIN','SUPER_ADMIN'])) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can modify permissions', success: false },
        { status: 403 }
      )
    }

    // Parse request body
    const body = (await request.json()) as BatchPermissionRequest
    const {
      targetUserIds,
      roleChange,
      permissionChanges,
      reason,
      dryRun = false,
    } = body

    // Validate input
    if (!targetUserIds || targetUserIds.length === 0) {
      return NextResponse.json(
        {
          error: 'targetUserIds is required and cannot be empty',
          success: false,
        },
        { status: 400 }
      )
    }

    // Get target users
    const targetUsers = await prisma.user.findMany({
      where: {
        id: { in: targetUserIds },
        tenantId: tenantId,
      },
      select: {
        id: true,
        role: true,
        email: true,
      },
    })

    if (targetUsers.length !== targetUserIds.length) {
      return NextResponse.json(
        {
          error: `Some users not found. Expected ${targetUserIds.length}, found ${targetUsers.length}`,
          success: false,
        },
        { status: 404 }
      )
    }

    // Check for permission escalation
    const adminPermissions = getRolePermissions(user.role)
    if (permissionChanges?.added) {
      if (!hasRole(user.role, ['SUPER_ADMIN'])) {
        const unauthorized = permissionChanges.added.filter(
          p => !adminPermissions.includes(p as any)
        )
        if (unauthorized.length > 0) {
          return NextResponse.json(
            {
              error: `Cannot grant permissions you don't have: ${unauthorized.join(', ')}`,
              success: false,
            },
            { status: 403 }
          )
        }
      }
    }

    // Calculate proposed permissions for validation
    const updatedUserPermissions: Record<string, Permission[]> = {}
    const userRoleChanges: Record<string, string> = {}

    for (const targetUser of targetUsers) {
      const newRole = roleChange?.to || targetUser.role
      let newPermissions = roleChange?.to
        ? getRolePermissions(newRole)
        : getRolePermissions(targetUser.role)

      if (permissionChanges?.added) {
        newPermissions = [...new Set([...newPermissions, ...permissionChanges.added])]
      }
      if (permissionChanges?.removed) {
        newPermissions = newPermissions.filter(p => !permissionChanges.removed.includes(p))
      }

      updatedUserPermissions[targetUser.id] = newPermissions
      userRoleChanges[targetUser.id] = newRole
    }

    // Validate all changes
    const validationErrors: ValidationError[] = []
    for (const [userId, perms] of Object.entries(updatedUserPermissions)) {
      const result = PermissionEngine.validate(perms as any)
      if (!result.isValid) {
        validationErrors.push(...result.errors)
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          success: false,
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    // In dry-run mode, return comprehensive impact analysis
    if (dryRun) {
      // Build detailed impact analysis for each user
      const userImpacts: UserImpact[] = []
      const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 }

      for (const targetUser of targetUsers) {
        const newPermissions = updatedUserPermissions[targetUser.id]
        const oldPermissions = roleChange
          ? getRolePermissions(roleChange.from)
          : getRolePermissions(targetUser.role)

        const addedPerms = permissionChanges?.added || []
        const removedPerms = permissionChanges?.removed || []

        // Check for conflicts when removing permissions
        const removalConflicts = analyzeRemovalConflicts(removedPerms, newPermissions)

        // Calculate risk level
        const riskLevel = calculateRiskLevel(roleChange, addedPerms, removedPerms)
        riskCounts[riskLevel]++

        userImpacts.push({
          userId: targetUser.id,
          email: targetUser.email,
          currentRole: targetUser.role,
          newRole: roleChange?.to,
          permissionsAdded: addedPerms,
          permissionsRemoved: removedPerms,
          riskLevel,
          conflicts: removalConflicts,
        })
      }

      // Build warning messages
      const warnings: Array<{ message: string }> = []

      // Add validation errors as warnings
      warnings.push(...validationErrors.map(e => ({ message: e.message })))

      // Add risk warnings
      if (riskCounts.critical > 0) {
        warnings.push({
          message: `${riskCounts.critical} user(s) will receive CRITICAL risk changes (e.g., admin role assignment)`,
        })
      }
      if (riskCounts.high > 0) {
        warnings.push({
          message: `${riskCounts.high} user(s) will receive HIGH risk changes`,
        })
      }

      // Add conflict warnings
      const allConflicts = userImpacts
        .flatMap(impact => impact.conflicts)
        .filter((v, i, a) => a.indexOf(v) === i) // unique

      return NextResponse.json({
        success: true,
        preview: true,
        changes: {
          added: permissionChanges?.added?.length || 0,
          removed: permissionChanges?.removed?.length || 0,
        },
        warnings,
        conflicts: allConflicts.map(msg => ({ message: msg })),
        impactAnalysis: {
          totalUsersAffected: targetUsers.length,
          riskBreakdown: riskCounts,
          userImpacts,
          summary: `Affecting ${targetUsers.length} user(s): ${riskCounts.critical} critical, ${riskCounts.high} high, ${riskCounts.medium} medium, ${riskCounts.low} low risk changes`,
        },
      })
    }

    // Apply changes in transaction
    const results = await prisma.$transaction(async (tx) => {
      const updateResults = []

      for (const targetUser of targetUsers) {
        try {
          // Update role if changed
          if (roleChange) {
            await tx.user.update({
              where: { id: targetUser.id },
              data: { role: roleChange.to as any },
            })
          }

          // Create audit log entry
          const newPermissions = updatedUserPermissions[targetUser.id]
          const oldPermissions = roleChange
            ? getRolePermissions(roleChange.from)
            : getRolePermissions(targetUser.role)

          const addedPerms = newPermissions.filter(p => !oldPermissions.includes(p))
          const removedPerms = oldPermissions.filter(p => !newPermissions.includes(p))

          await tx.permissionAudit.create({
            data: {
              tenantId: tenantId,
              userId: targetUser.id,
              changedBy: userId,
              oldRole: roleChange?.from,
              newRole: roleChange?.to,
              permissionsAdded: addedPerms,
              permissionsRemoved: removedPerms,
              reason: reason || null,
              metadata: {
                bulkOperation: targetUserIds.length > 1,
                bulkSize: targetUserIds.length,
              },
            },
          })

          updateResults.push({
            userId: targetUser.id,
            success: true,
          })
        } catch (error) {
          updateResults.push({
            userId: targetUser.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return updateResults
    })

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: failedCount === 0,
      results,
      message: `Updated ${successCount} user(s) successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
    })
  } catch (error) {
    console.error('[permissions/batch] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false,
      },
      { status: 500 }
    )
  }
}
