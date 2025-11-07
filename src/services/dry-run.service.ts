import prisma from '@/lib/prisma'
import type { User } from '@prisma/client'

/**
 * Risk level for an operation
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * Represents a conflict detected in a dry-run
 */
export interface DryRunConflict {
  type: 'role-downgrade' | 'permission-conflict' | 'approval-required' | 'dependency-violation'
  severity: RiskLevel
  userId: string
  message: string
  affectedDependencies?: string[]
  requiresApproval?: boolean
}

/**
 * Change preview for a single user
 */
export interface UserChangePreview {
  userId: string
  userName: string
  email: string
  currentRole: string
  changes: Record<string, any>
  conflicts?: DryRunConflict[]
  affectedDependencies?: string[]
  riskLevel?: RiskLevel
}

/**
 * Impact analysis result
 */
export interface ImpactAnalysis {
  directlyAffectedCount: number
  potentiallyAffectedCount: number
  affectedByDependencies: {
    teamMembers?: string[]
    projects?: string[]
    workflows?: string[]
  }
  estimatedExecutionTime: number
  estimatedNetworkCalls: number
  rollbackImpact?: {
    canRollback: boolean
    rollbackTime: number
    dataLoss?: string[]
  }
}

/**
 * Complete dry-run result
 */
export interface EnhancedDryRunResult {
  affectedUserCount: number
  preview: UserChangePreview[]
  conflicts: DryRunConflict[]
  conflictCount: number
  impactAnalysis: ImpactAnalysis
  riskLevel: RiskLevel
  overallRiskMessage: string
  canProceed: boolean
  estimatedDuration: number
  timestamp: string
}

export class DryRunService {
  /**
   * Run a comprehensive dry-run with conflict detection and impact analysis
   */
  static async runDryRun(
    tenantId: string,
    selectedUserIds: string[],
    operationType: string,
    operationConfig: Record<string, any>,
    limit: number = 10
  ): Promise<EnhancedDryRunResult> {
    // Get users for preview
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        id: { in: selectedUserIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
      },
      take: limit,
    })

    const totalAffectedCount = selectedUserIds.length

    // Build previews with conflict detection
    const preview: UserChangePreview[] = []
    const allConflicts: DryRunConflict[] = []
    const affectedDependencies: Set<string> = new Set()

    for (const user of users) {
      const userPreview = await this.analyzeUserChange(
        user,
        operationType,
        operationConfig,
        tenantId
      )

      preview.push(userPreview)

      if (userPreview.conflicts) {
        allConflicts.push(...userPreview.conflicts)
      }

      if (userPreview.affectedDependencies) {
        userPreview.affectedDependencies.forEach(dep => {
          affectedDependencies.add(dep)
        })
      }
    }

    // Calculate impact analysis
    const impactAnalysis = await this.analyzeImpact(
      tenantId,
      selectedUserIds,
      totalAffectedCount,
      operationType,
      operationConfig
    )

    // Determine overall risk level
    const riskLevel = this.calculateRiskLevel(allConflicts)
    const canProceed = riskLevel !== 'critical'

    // Build risk message
    const overallRiskMessage = this.buildRiskMessage(allConflicts, riskLevel)

    // Estimate duration (50ms per user)
    const estimatedDuration = Math.max(1000, totalAffectedCount * 50)

    return {
      affectedUserCount: totalAffectedCount,
      preview,
      conflicts: allConflicts,
      conflictCount: allConflicts.length,
      impactAnalysis,
      riskLevel,
      overallRiskMessage,
      canProceed,
      estimatedDuration,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Analyze changes for a single user
   */
  private static async analyzeUserChange(
    user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'tenantId'>,
    operationType: string,
    operationConfig: Record<string, any>,
    tenantId: string
  ): Promise<UserChangePreview> {
    const changes: Record<string, any> = {}
    const conflicts: DryRunConflict[] = []
    const affectedDependencies: string[] = []
    let riskLevel: RiskLevel = 'low'

    switch (operationType) {
      case 'ROLE_CHANGE': {
        const { fromRole, toRole } = operationConfig
        if (fromRole && toRole) {
          changes.role = { from: fromRole, to: toRole }

          // Check for role downgrade
          const roles = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEAD', 'TEAM_MEMBER', 'STAFF', 'CLIENT']
          const fromIndex = roles.indexOf(fromRole)
          const toIndex = roles.indexOf(toRole)

          if (toIndex > fromIndex) {
            conflicts.push({
              type: 'role-downgrade',
              severity: 'high',
              userId: user.id,
              message: `User ${user.email} will be demoted from ${fromRole} to ${toRole}. This requires approval.`,
              requiresApproval: true,
            })
            riskLevel = 'high'
          }

          // Find dependent users (team members under this user)
          const dependentUsers = await prisma.user.findMany({
            where: {
              tenantId,
              // Simple dependency check - can be expanded
            },
            select: { id: true, name: true },
          })

          if (dependentUsers.length > 0) {
            affectedDependencies.push(...dependentUsers.map(u => u.id))
          }
        }
        break
      }

      case 'PERMISSION_GRANT': {
        const { permissions } = operationConfig
        if (permissions && Array.isArray(permissions)) {
          changes.permissions = { added: permissions }

          // Check for dangerous permission combinations
          const dangerousPerms = ['DELETE_ALL_DATA', 'MODIFY_SECURITY_SETTINGS']
          const isDangerous = permissions.some(p =>
            dangerousPerms.includes(p)
          )

          if (isDangerous) {
            conflicts.push({
              type: 'permission-conflict',
              severity: 'critical',
              userId: user.id,
              message: `Granting dangerous permissions to ${user.email}. Requires security review.`,
              requiresApproval: true,
            })
            riskLevel = 'critical'
          }
        }
        break
      }

      case 'PERMISSION_REVOKE': {
        const { permissions } = operationConfig
        if (permissions && Array.isArray(permissions)) {
          changes.permissions = { removed: permissions }
        }
        break
      }

      case 'STATUS_UPDATE': {
        const { toStatus } = operationConfig
        if (toStatus === 'SUSPENDED') {
          changes.status = { from: user.role, to: toStatus }
          changes.note = 'User will lose access to all features'
          riskLevel = 'high'
        }
        break
      }

      case 'EMAIL_NOTIFICATION': {
        const { template, subject } = operationConfig
        changes.email = {
          template,
          subject,
          recipient: user.email,
        }
        break
      }
    }

    return {
      userId: user.id,
      userName: user.name || user.email,
      email: user.email,
      currentRole: user.role,
      changes,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      affectedDependencies: affectedDependencies.length > 0 ? affectedDependencies : undefined,
      riskLevel,
    }
  }

  /**
   * Analyze impact of the bulk operation
   */
  private static async analyzeImpact(
    tenantId: string,
    selectedUserIds: string[],
    totalCount: number,
    operationType: string,
    operationConfig: Record<string, any>
  ): Promise<ImpactAnalysis> {
    // Calculate potentially affected users (those with dependencies)
    const potentiallyAffected = Math.min(
      await this.countDependentUsers(tenantId, selectedUserIds),
      totalCount * 0.2 // Assume 20% have dependencies
    )

    // Estimate execution time (50ms per user, batched)
    const estimatedDuration = Math.max(1000, totalCount * 50)

    // Estimate network calls (1 main + 1 per 100 users for batching)
    const estimatedCalls = Math.ceil(1 + totalCount / 100)

    // Analyze rollback capability
    const canRollback = ['ROLE_CHANGE', 'STATUS_UPDATE'].includes(operationType)
    const rollbackTime = canRollback ? estimatedDuration * 1.5 : 0

    return {
      directlyAffectedCount: totalCount,
      potentiallyAffectedCount: Math.round(potentiallyAffected),
      affectedByDependencies: {
        teamMembers: undefined,
        projects: undefined,
        workflows: undefined,
      },
      estimatedExecutionTime: estimatedDuration,
      estimatedNetworkCalls: estimatedCalls,
      rollbackImpact: {
        canRollback,
        rollbackTime,
        dataLoss: canRollback ? [] : ['Original role/status may not be recoverable'],
      },
    }
  }

  /**
   * Count dependent users
   */
  private static async countDependentUsers(
    tenantId: string,
    userIds: string[]
  ): Promise<number> {
    // This is a simplified version - expand based on your domain
    return userIds.length
  }

  /**
   * Calculate overall risk level based on conflicts
   */
  private static calculateRiskLevel(conflicts: DryRunConflict[]): RiskLevel {
    if (conflicts.length === 0) return 'low'

    const severities = conflicts.map(c => c.severity)
    if (severities.includes('critical')) return 'critical'
    if (severities.includes('high')) return 'high'
    if (severities.includes('medium')) return 'medium'
    return 'low'
  }

  /**
   * Build human-readable risk message
   */
  private static buildRiskMessage(
    conflicts: DryRunConflict[],
    riskLevel: RiskLevel
  ): string {
    if (conflicts.length === 0) {
      return 'No issues detected. Safe to proceed.'
    }

    const critical = conflicts.filter(c => c.severity === 'critical').length
    const high = conflicts.filter(c => c.severity === 'high').length
    const medium = conflicts.filter(c => c.severity === 'medium').length

    const messages = []
    if (critical > 0) messages.push(`⚠️ ${critical} critical issue(s)`)
    if (high > 0) messages.push(`⚠️ ${high} high-risk issue(s)`)
    if (medium > 0) messages.push(`ℹ️ ${medium} medium-risk issue(s)`)

    const message = messages.join(', ')

    if (riskLevel === 'critical') {
      return `${message} - Operation cannot proceed without review and approval.`
    } else if (riskLevel === 'high') {
      return `${message} - Requires approval before proceeding.`
    }

    return `${message} - Please review before proceeding.`
  }
}
