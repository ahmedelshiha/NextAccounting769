import {
  Permission,
  PERMISSIONS,
  PERMISSION_METADATA,
  PermissionMetadata,
  RiskLevel,
  PermissionCategory,
} from './permissions'

/**
 * Represents a diff between two permission sets
 */
export interface PermissionDiff {
  added: Permission[]
  removed: Permission[]
  unchanged: Permission[]
  total: number
}

/**
 * Validation error details
 */
export interface ValidationError {
  permission: Permission
  type: 'missing-dependency' | 'conflict' | 'high-risk' | 'constraint-violation'
  message: string
  severity: 'error' | 'warning'
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  permission: Permission
  type: 'conflict' | 'high-risk' | 'unusual-combination'
  message: string
  severity: 'warning'
}

/**
 * Result of permission validation
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  riskLevel: RiskLevel
}

/**
 * Permission suggestion details
 */
export interface PermissionSuggestion {
  permission: Permission
  reason: string
  confidence: number
  action: 'add' | 'remove'
}

/**
 * User context for suggestion generation
 */
export interface UserContext {
  department?: string
  team?: string
  recentAccess?: Permission[]
  jobTitle?: string
}

/**
 * Permission Engine - Core business logic for permission management
 */
export class PermissionEngine {
  /**
   * Calculate the difference between two permission sets
   */
  static calculateDiff(
    current: Permission[],
    target: Permission[]
  ): PermissionDiff {
    const currentSet = new Set(current)
    const targetSet = new Set(target)

    const added = target.filter(p => !currentSet.has(p))
    const removed = current.filter(p => !targetSet.has(p))
    const unchanged = current.filter(p => targetSet.has(p))

    return {
      added,
      removed,
      unchanged,
      total: target.length,
    }
  }

  /**
   * Validate a set of permissions for conflicts and dependencies
   */
  static validate(permissions: Permission[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    let maxRisk = RiskLevel.LOW

    const permissionSet = new Set(permissions)

    for (const permission of permissions) {
      const meta = PERMISSION_METADATA[permission]
      if (!meta) continue

      // Track maximum risk level
      const riskOrder = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]
      const currentRiskIndex = riskOrder.indexOf(meta.risk)
      const maxRiskIndex = riskOrder.indexOf(maxRisk)
      if (currentRiskIndex > maxRiskIndex) {
        maxRisk = meta.risk
      }

      // Check dependencies
      if (meta.dependencies && meta.dependencies.length > 0) {
        const missing = meta.dependencies.filter(dep => !permissionSet.has(dep))
        if (missing.length > 0) {
          errors.push({
            permission,
            type: 'missing-dependency',
            message: `Requires: ${missing
              .map(p => PERMISSION_METADATA[p]?.label || p)
              .join(', ')}`,
            severity: 'error',
          })
        }
      }

      // Check conflicts
      if (meta.conflicts && meta.conflicts.length > 0) {
        const conflicts = meta.conflicts.filter(conf => permissionSet.has(conf))
        if (conflicts.length > 0) {
          warnings.push({
            permission,
            type: 'conflict',
            message: `Conflicts with: ${conflicts
              .map(p => PERMISSION_METADATA[p]?.label || p)
              .join(', ')}`,
            severity: 'warning',
          })
        }
      }
    }

    // Check for critical high-risk combinations
    const criticalPerms = permissions.filter(
      p => PERMISSION_METADATA[p]?.risk === RiskLevel.CRITICAL
    )
    if (criticalPerms.length >= 2) {
      warnings.push({
        permission: criticalPerms[0],
        type: 'unusual-combination',
        message: `Granting multiple critical permissions. Ensure this is intentional.`,
        severity: 'warning',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskLevel: maxRisk,
    }
  }

  /**
   * Get common permissions for a specific role
   */
  static getCommonPermissionsForRole(role: string): Permission[] {
    // This would typically come from ROLE_PERMISSIONS, but we implement it
    // to work with the actual role definitions
    const roleMap: Record<string, Permission[]> = {
      CLIENT: [
        PERMISSIONS.SERVICE_REQUESTS_CREATE,
        PERMISSIONS.SERVICE_REQUESTS_READ_OWN,
        PERMISSIONS.TASKS_READ_ASSIGNED,
      ],
      TEAM_MEMBER: [
        PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
        PERMISSIONS.SERVICE_REQUESTS_UPDATE,
        PERMISSIONS.TASKS_CREATE,
        PERMISSIONS.TASKS_READ_ASSIGNED,
        PERMISSIONS.TASKS_UPDATE,
        PERMISSIONS.TEAM_VIEW,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.SERVICES_ANALYTICS,
        PERMISSIONS.SERVICES_EXPORT,
        PERMISSIONS.BOOKING_SETTINGS_VIEW,
        PERMISSIONS.ORG_SETTINGS_VIEW,
      ],
      TEAM_LEAD: [
        PERMISSIONS.SERVICE_REQUESTS_READ_ALL,
        PERMISSIONS.SERVICE_REQUESTS_UPDATE,
        PERMISSIONS.SERVICE_REQUESTS_ASSIGN,
        PERMISSIONS.TASKS_CREATE,
        PERMISSIONS.TASKS_READ_ALL,
        PERMISSIONS.TASKS_UPDATE,
        PERMISSIONS.TASKS_ASSIGN,
        PERMISSIONS.TEAM_VIEW,
        PERMISSIONS.TEAM_MANAGE,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.ANALYTICS_EXPORT,
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.SERVICES_ANALYTICS,
        PERMISSIONS.SERVICES_EXPORT,
        PERMISSIONS.BOOKING_SETTINGS_VIEW,
        PERMISSIONS.BOOKING_SETTINGS_EDIT,
        PERMISSIONS.BOOKING_SETTINGS_EXPORT,
        PERMISSIONS.ORG_SETTINGS_VIEW,
        PERMISSIONS.ORG_SETTINGS_EDIT,
        PERMISSIONS.ORG_SETTINGS_EXPORT,
        PERMISSIONS.FINANCIAL_SETTINGS_VIEW,
        PERMISSIONS.INTEGRATION_HUB_VIEW,
        PERMISSIONS.INTEGRATION_HUB_TEST,
      ],
      ADMIN: Object.values(PERMISSIONS),
      SUPER_ADMIN: Object.values(PERMISSIONS),
    }

    return roleMap[role] || []
  }

  /**
   * Get smart permission suggestions based on role and context
   */
  static getSuggestions(
    currentRole: string,
    currentPermissions: Permission[],
    context: UserContext = {}
  ): PermissionSuggestion[] {
    const suggestions: PermissionSuggestion[] = []
    const currentSet = new Set(currentPermissions)

    // 1. Role-based common patterns
    const commonForRole = this.getCommonPermissionsForRole(currentRole)
    const missing = commonForRole.filter(p => !currentSet.has(p))

    missing.forEach(permission => {
      const meta = PERMISSION_METADATA[permission]
      suggestions.push({
        permission,
        reason: `Commonly granted to ${currentRole} users`,
        confidence: 0.85,
        action: 'add',
      })
    })

    // 2. Resolve dependencies
    const allPermissions = Object.values(PERMISSIONS)
    allPermissions.forEach(permission => {
      if (!currentSet.has(permission)) {
        const meta = PERMISSION_METADATA[permission]
        if (meta?.dependencies) {
          // Check if all dependencies are already present
          const hasDependencies = meta.dependencies.every(dep => currentSet.has(dep))
          if (hasDependencies && !suggestions.some(s => s.permission === permission)) {
            suggestions.push({
              permission,
              reason: 'All dependencies are present',
              confidence: 0.7,
              action: 'add',
            })
          }
        }
      }
    })

    // 3. Remove suggestions for unused high-risk permissions
    const criticalPerms = currentPermissions.filter(
      p => PERMISSION_METADATA[p]?.risk === RiskLevel.CRITICAL
    )

    // Remove suggestions that would create conflicts
    const toRemove = suggestions.filter(s => {
      const meta = PERMISSION_METADATA[s.permission]
      return meta?.conflicts?.some(conf => currentSet.has(conf))
    })

    // Deduplicate and sort by confidence
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map(s => [s.permission, s])).values()
    ).sort((a, b) => b.confidence - a.confidence)

    // Filter out those that would fail validation
    const validSuggestions = uniqueSuggestions.filter(s => {
      let testPerms = [...currentPermissions]
      if (s.action === 'add' && !testPerms.includes(s.permission)) {
        testPerms.push(s.permission)
      } else if (s.action === 'remove') {
        testPerms = testPerms.filter(p => p !== s.permission)
      }
      const validation = this.validate(testPerms)
      return validation.isValid
    })

    return validSuggestions.slice(0, 10) // Return top 10
  }

  /**
   * Calculate risk level for a set of permissions
   */
  static calculateRiskLevel(permissions: Permission[]): RiskLevel {
    const riskOrder = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]
    let maxRisk = RiskLevel.LOW

    for (const permission of permissions) {
      const meta = PERMISSION_METADATA[permission]
      if (!meta) continue

      const currentIndex = riskOrder.indexOf(meta.risk)
      const maxIndex = riskOrder.indexOf(maxRisk)

      if (currentIndex > maxIndex) {
        maxRisk = meta.risk
      }
    }

    return maxRisk
  }

  /**
   * Get permissions by category
   */
  static getPermissionsByCategory(category: PermissionCategory): Permission[] {
    return Object.values(PERMISSIONS).filter(
      p => PERMISSION_METADATA[p]?.category === category
    )
  }

  /**
   * Search permissions by keyword
   */
  static searchPermissions(query: string): Permission[] {
    const q = query.toLowerCase()
    return Object.values(PERMISSIONS).filter(p => {
      const meta = PERMISSION_METADATA[p]
      return (
        meta.label.toLowerCase().includes(q) ||
        meta.description.toLowerCase().includes(q) ||
        meta.tags?.some(tag => tag.toLowerCase().includes(q)) ||
        p.toLowerCase().includes(q)
      )
    })
  }

  /**
   * Get all permissions grouped by category
   */
  static getPermissionsByCategories(): Record<PermissionCategory, Permission[]> {
    const grouped: Record<string, Permission[]> = {}

    Object.values(PERMISSIONS).forEach(permission => {
      const meta = PERMISSION_METADATA[permission]
      const category = meta.category
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(permission)
    })

    return grouped as Record<PermissionCategory, Permission[]>
  }

  /**
   * Get metadata for all permissions
   */
  static getAllPermissionMetadata(): PermissionMetadata[] {
    return Object.values(PERMISSIONS).map(p => PERMISSION_METADATA[p])
  }

  /**
   * Check if a permission can be granted
   */
  static canGrantPermission(
    permission: Permission,
    currentPermissions: Permission[],
    adminPermissions?: Permission[]
  ): boolean {
    // Super admin can grant anything (if adminPermissions include all)
    if (adminPermissions && adminPermissions.length === Object.keys(PERMISSIONS).length) {
      return true
    }

    // Check dependencies
    const meta = PERMISSION_METADATA[permission]
    if (meta?.dependencies) {
      const hasDependencies = meta.dependencies.every(dep => currentPermissions.includes(dep))
      if (!hasDependencies) {
        return false
      }
    }

    // Check conflicts
    if (meta?.conflicts) {
      const hasConflicts = meta.conflicts.some(conf => currentPermissions.includes(conf))
      if (hasConflicts) {
        return false
      }
    }

    return true
  }
}
