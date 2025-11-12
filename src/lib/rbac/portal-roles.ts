/**
 * Client Portal RBAC System
 *
 * Defines roles, permissions, and segregation of duties (SoD) rules
 * for multi-tenant client portal access across UAE, KSA, Egypt
 */

import type { Prisma } from '@prisma/client'

export type PortalRole =
  | 'CLIENT_OWNER'
  | 'FINANCE_MANAGER'
  | 'ACCOUNTANT'
  | 'VIEWER'
  | 'AUDITOR'
  | 'ADVISOR'

export type PortalPermission =
  // Entity Management
  | 'entity.create'
  | 'entity.read'
  | 'entity.update'
  | 'entity.delete'
  | 'entity.archive'

  // People Management
  | 'people.create'
  | 'people.read'
  | 'people.update'
  | 'people.delete'
  | 'people.invite'
  | 'people.manage_roles'

  // Document Management
  | 'documents.upload'
  | 'documents.read'
  | 'documents.download'
  | 'documents.delete'
  | 'documents.share'
  | 'documents.esign'

  // Filing & Compliance
  | 'filings.create'
  | 'filings.read'
  | 'filings.update'
  | 'filings.submit'
  | 'filings.approve'
  | 'compliance.read'

  // Invoicing
  | 'invoices.create'
  | 'invoices.read'
  | 'invoices.update'
  | 'invoices.delete'
  | 'invoices.approve'
  | 'invoices.pay'

  // Payments
  | 'payments.create'
  | 'payments.read'
  | 'payments.approve'
  | 'payments.process'

  // Reports & Analytics
  | 'reports.view'
  | 'reports.export'
  | 'analytics.view'

  // Messaging & Support
  | 'messaging.read'
  | 'messaging.create'
  | 'support.access'

  // Team & Access
  | 'team.view'
  | 'team.manage'
  | 'audit_logs.view'
  | 'settings.view'
  | 'settings.edit'
  | 'settings.manage_users'

export interface PortalRoleDefinition {
  id: PortalRole
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  permissions: PortalPermission[]
  scope: 'ENTITY' | 'TENANT' // ENTITY = scoped to single entity, TENANT = across all entities
  level: number // 0=lowest, 5=highest for hierarchy
}

/**
 * Role Definitions with permissions
 */
export const PORTAL_ROLES: Record<PortalRole, PortalRoleDefinition> = {
  CLIENT_OWNER: {
    id: 'CLIENT_OWNER',
    name: 'Business Owner',
    nameAr: 'صاحب العمل',
    description: 'Full control over business account, entities, and team',
    descriptionAr: 'السيطرة الكاملة على حساب العمل والكيانات والفريق',
    level: 5,
    scope: 'TENANT',
    permissions: [
      // Full entity management
      'entity.create',
      'entity.read',
      'entity.update',
      'entity.delete',
      'entity.archive',

      // Full people management
      'people.create',
      'people.read',
      'people.update',
      'people.delete',
      'people.invite',
      'people.manage_roles',

      // Full document management
      'documents.upload',
      'documents.read',
      'documents.download',
      'documents.delete',
      'documents.share',
      'documents.esign',

      // Full filing control
      'filings.create',
      'filings.read',
      'filings.update',
      'filings.submit',
      'filings.approve',
      'compliance.read',

      // Full invoice control
      'invoices.create',
      'invoices.read',
      'invoices.update',
      'invoices.delete',
      'invoices.approve',
      'invoices.pay',

      // Full payment control
      'payments.create',
      'payments.read',
      'payments.approve',
      'payments.process',

      // Reports and analytics
      'reports.view',
      'reports.export',
      'analytics.view',

      // Messaging
      'messaging.read',
      'messaging.create',
      'support.access',

      // Team and access
      'team.view',
      'team.manage',
      'audit_logs.view',
      'settings.view',
      'settings.edit',
      'settings.manage_users',
    ],
  },

  FINANCE_MANAGER: {
    id: 'FINANCE_MANAGER',
    name: 'Finance Manager',
    nameAr: 'مدير المالية',
    description: 'Manages invoices, payments, and financial reporting',
    descriptionAr: 'يدير الفواتير والمدفوعات والتقارير المالية',
    level: 4,
    scope: 'ENTITY',
    permissions: [
      // Entity read-only
      'entity.read',

      // People read-only
      'people.read',

      // Documents for financial records
      'documents.upload',
      'documents.read',
      'documents.download',
      'documents.share',

      // Filing read + submit
      'filings.read',
      'filings.submit',
      'compliance.read',

      // Full invoice control
      'invoices.create',
      'invoices.read',
      'invoices.update',
      'invoices.approve',
      'invoices.pay',

      // Full payment control
      'payments.create',
      'payments.read',
      'payments.approve',
      'payments.process',

      // Reports
      'reports.view',
      'reports.export',
      'analytics.view',

      // Messaging
      'messaging.read',
      'messaging.create',

      // Limited team access
      'team.view',
      'settings.view',
    ],
  },

  ACCOUNTANT: {
    id: 'ACCOUNTANT',
    name: 'Accountant',
    nameAr: 'محاسب',
    description: 'Prepares filings, manages documents and evidence',
    descriptionAr: 'يعد الإقرارات الضريبية ويدير المستندات والأدلة',
    level: 3,
    scope: 'ENTITY',
    permissions: [
      // Entity read-only
      'entity.read',

      // People read-only
      'people.read',

      // Full document management
      'documents.upload',
      'documents.read',
      'documents.download',
      'documents.delete',
      'documents.share',
      'documents.esign',

      // Full filing control
      'filings.create',
      'filings.read',
      'filings.update',
      'filings.submit',
      'compliance.read',

      // Invoice read-only
      'invoices.read',

      // Payment read-only
      'payments.read',

      // Reports
      'reports.view',
      'reports.export',

      // Messaging
      'messaging.read',
      'messaging.create',

      // Settings read
      'settings.view',
    ],
  },

  VIEWER: {
    id: 'VIEWER',
    name: 'Viewer',
    nameAr: 'عارض',
    description: 'Read-only access to filings, documents, and reports',
    descriptionAr: 'إمكانية الوصول للقراءة فقط للإقرارات والمستندات والتقارير',
    level: 1,
    scope: 'ENTITY',
    permissions: [
      // Entity read-only
      'entity.read',

      // People read-only
      'people.read',

      // Document read-only
      'documents.read',
      'documents.download',

      // Filing read-only
      'filings.read',
      'compliance.read',

      // Invoice read-only
      'invoices.read',

      // Payment read-only
      'payments.read',

      // Reports read-only
      'reports.view',
      'analytics.view',

      // Messaging read
      'messaging.read',

      // Settings read
      'settings.view',
    ],
  },

  AUDITOR: {
    id: 'AUDITOR',
    name: 'External Auditor',
    nameAr: 'مدقق خارجي',
    description: 'Read-only access to all records with audit trail visibility',
    descriptionAr:
      'الوصول للقراءة فقط لجميع السجلات مع رؤية تتبع التدقيق',
    level: 2,
    scope: 'ENTITY',
    permissions: [
      // Read-only entity and people
      'entity.read',
      'people.read',

      // Read-only documents
      'documents.read',
      'documents.download',

      // Read-only filings
      'filings.read',
      'compliance.read',

      // Read-only invoices and payments
      'invoices.read',
      'payments.read',

      // Reports
      'reports.view',
      'analytics.view',

      // Audit trail
      'audit_logs.view',

      // Settings read (configuration review)
      'settings.view',
    ],
  },

  ADVISOR: {
    id: 'ADVISOR',
    name: 'Advisor',
    nameAr: 'مستشار',
    description: 'Limited access for external consultants and advisors',
    descriptionAr: 'الوصول المحدود للاستشاريين والمستشارين الخارجيين',
    level: 1,
    scope: 'ENTITY',
    permissions: [
      // Entity read-only
      'entity.read',

      // Document read + limited share
      'documents.read',
      'documents.download',
      'documents.share',

      // Filing read-only
      'filings.read',
      'compliance.read',

      // Messaging
      'messaging.read',
      'messaging.create',

      // Reports view
      'reports.view',
    ],
  },
}

/**
 * Segregation of Duties (SoD) Rules
 *
 * Defines conflicting roles/permissions that should not be held by same user
 * (e.g., preparer vs approver)
 */
export interface SoDRule {
  id: string
  description: string
  conflictingRoles?: PortalRole[]
  conflictingPermissions?: [PortalPermission, PortalPermission][]
  allowed?: boolean // false = not allowed, true = allowed
}

export const SEGREGATION_OF_DUTIES_RULES: SoDRule[] = [
  {
    id: 'sod-001',
    description:
      'Finance manager cannot both create and approve invoices/payments without oversight',
    conflictingPermissions: [
      ['invoices.create', 'invoices.approve'],
      ['payments.create', 'payments.approve'],
    ],
    allowed: false,
  },
  {
    id: 'sod-002',
    description:
      'Filing preparer (Accountant) should have different reviewer',
    conflictingPermissions: [['filings.create', 'filings.approve']],
    allowed: false,
  },
  {
    id: 'sod-003',
    description: 'People management (adding/removing users) requires owner approval',
    conflictingPermissions: [['people.invite', 'settings.manage_users']],
    allowed: true, // Allowed for CLIENT_OWNER or Finance Manager with owner oversight
  },
  {
    id: 'sod-004',
    description: 'Entity deletion requires owner confirmation',
    conflictingPermissions: [['entity.create', 'entity.delete']],
    allowed: true,
  },
  {
    id: 'sod-005',
    description: 'Document deletion by non-creator requires approval trail',
    conflictingPermissions: [['documents.upload', 'documents.delete']],
    allowed: true,
  },
]

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: PortalRole): PortalPermission[] {
  return PORTAL_ROLES[role]?.permissions || []
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: PortalRole,
  permission: PortalPermission
): boolean {
  const permissions = getRolePermissions(role)
  return permissions.includes(permission)
}

/**
 * Check if user has permission in context
 */
export function checkPermission(
  userRole: PortalRole,
  requiredPermission: PortalPermission,
  context?: {
    createdById?: string
    currentUserId?: string
    entityId?: string
    tenantId?: string
  }
): boolean {
  // Check basic permission
  if (!hasPermission(userRole, requiredPermission)) {
    return false
  }

  // Check ownership context for certain operations
  if (
    requiredPermission === 'documents.delete' &&
    context?.createdById &&
    context?.currentUserId &&
    context.createdById !== context.currentUserId
  ) {
    // Document deletion by non-creator requires ownership or admin role
    return userRole === 'CLIENT_OWNER' || userRole === 'FINANCE_MANAGER'
  }

  if (
    requiredPermission === 'entity.delete' &&
    userRole !== 'CLIENT_OWNER'
  ) {
    // Only client owner can delete entities
    return false
  }

  return true
}

/**
 * Validate segregation of duties for a user with given roles
 */
export function validateSoD(roles: PortalRole[]): {
  isValid: boolean
  violations: SoDRule[]
} {
  const violations: SoDRule[] = []

  // Get all permissions from all roles
  const allPermissions = new Set<PortalPermission>()
  roles.forEach((role) => {
    getRolePermissions(role).forEach((perm) => allPermissions.add(perm))
  })

  // Check each SoD rule
  SEGREGATION_OF_DUTIES_RULES.forEach((rule) => {
    // Check conflicting roles
    if (rule.conflictingRoles) {
      const hasConflict = rule.conflictingRoles.some((r) => roles.includes(r))
      if (!rule.allowed && hasConflict) {
        // Only add violation if not already added
        if (!violations.some((v) => v.id === rule.id)) {
          violations.push(rule)
        }
      }
    }

    // Check conflicting permissions
    if (rule.conflictingPermissions) {
      rule.conflictingPermissions.forEach(([perm1, perm2]) => {
        const hasBoth =
          allPermissions.has(perm1) && allPermissions.has(perm2)
        if (!rule.allowed && hasBoth) {
          // Only add violation if not already added
          if (!violations.some((v) => v.id === rule.id)) {
            violations.push(rule)
          }
        }
      })
    }
  })

  return {
    isValid: violations.length === 0,
    violations,
  }
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(role: PortalRole): number {
  return PORTAL_ROLES[role]?.level || 0
}

/**
 * Check if role can manage another role (based on hierarchy)
 */
export function canManageRole(
  managerRole: PortalRole,
  targetRole: PortalRole
): boolean {
  const managerLevel = getRoleLevel(managerRole)
  const targetLevel = getRoleLevel(targetRole)
  return managerLevel > targetLevel
}

/**
 * Get all roles that a given role can delegate to
 */
export function getDelegableRoles(role: PortalRole): PortalRole[] {
  const level = getRoleLevel(role)
  return Object.keys(PORTAL_ROLES).filter(
    (r) =>
      getRoleLevel(r as PortalRole) < level &&
      role !== ('VIEWER' as PortalRole) &&
      role !== ('AUDITOR' as PortalRole) &&
      role !== ('ADVISOR' as PortalRole)
  ) as PortalRole[]
}

export default PORTAL_ROLES
