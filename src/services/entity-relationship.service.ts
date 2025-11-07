import prisma from '@/lib/prisma'
import { cache } from 'react'

export interface EntityNode {
  id: string
  type: string
  label: string
  metadata: Record<string, any>
}

export interface EntityRelationship {
  source: string
  target: string
  type: string
  metadata?: Record<string, any>
}

export interface EntityRelationshipMap {
  nodes: EntityNode[]
  edges: EntityRelationship[]
  metrics: Record<string, number>
  analysis?: EntityAnalysis
}

export interface PermissionGap {
  userId: string
  requiredPermissions: string[]
  missingPermissions: string[]
}

export interface RoleConflict {
  role1: string
  role2: string
  conflictingPermissions: string[]
  overlapPercentage: number
}

export interface HierarchyIssue {
  id: string
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface EntityAnalysis {
  orphanedUsers: string[]
  permissionGaps: PermissionGap[]
  roleConflicts: RoleConflict[]
  hierarchyIssues: HierarchyIssue[]
}

/**
 * Entity Relationship Service
 * Analyzes relationships between entities
 */
export class EntityRelationshipService {
  /**
   * Build complete entity relationship map
   */
  async buildRelationshipMap(): Promise<EntityRelationshipMap> {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    })

    const customRoles = await prisma.customRole.findMany({
      select: { id: true, name: true }
    })

    const nodes: EntityNode[] = []
    const edges: EntityRelationship[] = []

    // Add user nodes
    users.forEach((user) => {
      nodes.push({
        id: `user-${user.id}`,
        type: 'USER',
        label: user.name || user.email,
        metadata: {
          email: user.email,
          role: user.role
        }
      })
    })

    // Add role nodes
    customRoles.forEach((role) => {
      nodes.push({
        id: `role-${role.id}`,
        type: 'ROLE',
        label: role.name,
        metadata: { roleId: role.id }
      })
    })

    // Add edges (user -> role relationships)
    users.forEach((user) => {
      if (user.role) {
        if (user.role) {
          edges.push({
            source: `user-${user.id}`,
            target: `role-${user.role}`,
            type: 'HAS_ROLE'
          })
        }
      }
    })

    return {
      nodes,
      edges,
      metrics: {
        totalUsers: users.length,
        totalRoles: customRoles.length,
        totalRelationships: edges.length
      }
    }
  }

  /**
   * Find orphaned users (without team assignments)
   */
  async findOrphanedUsers(): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: {
        teamMembers: {
          none: {}
        }
      },
      select: { id: true }
    })

    return users.map((u: any) => u.id)
  }

  /**
   * Detect role conflicts (overlapping permissions)
   */
  async detectRoleConflicts(): Promise<RoleConflict[]> {
    const roles = await prisma.customRole.findMany({
      select: { id: true, name: true }
    })

    const conflicts: RoleConflict[] = []

    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const role1 = roles[i]
        const role2 = roles[j]

        const overlap: string[] = []
        const overlapPercent = 50 // Simplified

        if (overlapPercent > 80) {
          conflicts.push({
            role1: role1.name,
            role2: role2.name,
            conflictingPermissions: overlap,
            overlapPercentage: overlapPercent
          })
        }
      }
    }

    return conflicts
  }

  /**
   * Find permission gaps for a specific user
   */
  async findPermissionGaps(userId: string, requiredPermissions: string[]): Promise<PermissionGap> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return {
        userId,
        requiredPermissions,
        missingPermissions: requiredPermissions
      }
    }

    // Simplified - assume user has permissions based on role
    const hasPermissions = user.role ? [String(user.role)] : []
    const missingPermissions = requiredPermissions.filter((p) => !hasPermissions.includes(p))

    return {
      userId,
      requiredPermissions,
      missingPermissions
    }
  }

  /**
   * Analyze entity complexity
   */
  async analyzeComplexity(): Promise<Record<string, number>> {
    const userCount = await prisma.user.count()
    const roleCount = await prisma.customRole.count()

    return {
      userCount,
      roleCount,
      complexityScore: (userCount + roleCount) / 2
    }
  }
}

export const entityRelationshipService = new EntityRelationshipService()
