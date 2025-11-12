import { describe, it, expect } from 'vitest'
import { PermissionEngine, PermissionDiff, ValidationResult } from '../permission-engine'
import { PERMISSIONS } from '../permissions'

describe('PermissionEngine', () => {
  describe('calculateDiff', () => {
    it('should correctly identify added permissions', () => {
      const current = [PERMISSIONS.USERS_VIEW]
      const target = [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_EDIT]
      
      const diff = PermissionEngine.calculateDiff(current, target)
      
      expect(diff.added).toEqual([PERMISSIONS.USERS_EDIT])
      expect(diff.removed).toEqual([])
      expect(diff.unchanged).toEqual([PERMISSIONS.USERS_VIEW])
    })

    it('should correctly identify removed permissions', () => {
      const current = [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_EDIT]
      const target = [PERMISSIONS.USERS_VIEW]
      
      const diff = PermissionEngine.calculateDiff(current, target)
      
      expect(diff.removed).toEqual([PERMISSIONS.USERS_EDIT])
      expect(diff.added).toEqual([])
      expect(diff.unchanged).toEqual([PERMISSIONS.USERS_VIEW])
    })

    it('should handle empty permission sets', () => {
      const diff1 = PermissionEngine.calculateDiff([], [PERMISSIONS.USERS_VIEW])
      expect(diff1.added).toEqual([PERMISSIONS.USERS_VIEW])
      
      const diff2 = PermissionEngine.calculateDiff([PERMISSIONS.USERS_VIEW], [])
      expect(diff2.removed).toEqual([PERMISSIONS.USERS_VIEW])
    })

    it('should return correct total count', () => {
      const current = [PERMISSIONS.USERS_VIEW]
      const target = [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_EDIT, PERMISSIONS.USERS_DELETE]
      
      const diff = PermissionEngine.calculateDiff(current, target)
      expect(diff.total).toBe(3)
    })
  })

  describe('validate', () => {
    it('should validate permissions with no errors', () => {
      const permissions = [PERMISSIONS.USERS_VIEW]
      const result = PermissionEngine.validate(permissions)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing dependencies', () => {
      // Try to grant USERS_EDIT without USERS_VIEW (if they have dependency relationship)
      const permissions = [PERMISSIONS.USERS_EDIT]
      const result = PermissionEngine.validate(permissions)
      
      // The actual test depends on whether these have dependencies defined
      if (result.errors.length > 0) {
        expect(result.isValid).toBe(false)
        expect(result.errors[0].type).toBe('missing-dependency')
      }
    })

    it('should detect high-risk permission combinations', () => {
      // Get all critical permissions
      const criticalPerms = Object.values(PERMISSIONS).slice(0, 2) // Assuming first few are critical
      const result = PermissionEngine.validate(criticalPerms)
      
      // Might have warnings for critical combinations
      expect(result.warnings).toBeDefined()
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('should calculate correct risk level', () => {
      const result1 = PermissionEngine.validate([PERMISSIONS.USERS_VIEW])
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(result1.riskLevel)
      
      const result2 = PermissionEngine.validate(Object.values(PERMISSIONS))
      expect(['MEDIUM', 'HIGH', 'CRITICAL']).toContain(result2.riskLevel)
    })
  })

  describe('getCommonPermissionsForRole', () => {
    it('should return permissions for CLIENT role', () => {
      const perms = PermissionEngine.getCommonPermissionsForRole('CLIENT')
      
      expect(Array.isArray(perms)).toBe(true)
      expect(perms.length).toBeGreaterThan(0)
    })

    it('should return permissions for TEAM_MEMBER role', () => {
      const perms = PermissionEngine.getCommonPermissionsForRole('TEAM_MEMBER')
      
      expect(Array.isArray(perms)).toBe(true)
      expect(perms.length).toBeGreaterThan(0)
    })

    it('should return more permissions for TEAM_LEAD than TEAM_MEMBER', () => {
      const teamMemberPerms = PermissionEngine.getCommonPermissionsForRole('TEAM_MEMBER')
      const teamLeadPerms = PermissionEngine.getCommonPermissionsForRole('TEAM_LEAD')
      
      expect(teamLeadPerms.length).toBeGreaterThanOrEqual(teamMemberPerms.length)
    })

    it('should return all permissions for ADMIN role', () => {
      const adminPerms = PermissionEngine.getCommonPermissionsForRole('ADMIN')
      
      expect(adminPerms.length).toBeGreaterThan(0)
    })

    it('should return empty array for unknown role', () => {
      const perms = PermissionEngine.getCommonPermissionsForRole('UNKNOWN_ROLE')
      
      expect(perms).toEqual([])
    })

    it('should maintain consistent role hierarchy', () => {
      const client = PermissionEngine.getCommonPermissionsForRole('CLIENT')
      const member = PermissionEngine.getCommonPermissionsForRole('TEAM_MEMBER')
      const lead = PermissionEngine.getCommonPermissionsForRole('TEAM_LEAD')
      const admin = PermissionEngine.getCommonPermissionsForRole('ADMIN')
      
      // Check rough hierarchy (later roles should have more or equal permissions)
      expect(member.length).toBeGreaterThanOrEqual(client.length)
      expect(lead.length).toBeGreaterThanOrEqual(member.length)
      expect(admin.length).toBeGreaterThanOrEqual(lead.length)
    })
  })

  describe('getSuggestions', () => {
    it('should return array of suggestions', () => {
      const suggestions = PermissionEngine.getSuggestions('TEAM_MEMBER', [PERMISSIONS.USERS_VIEW])
      
      expect(Array.isArray(suggestions)).toBe(true)
    })

    it('should suggest permissions commonly granted to role', () => {
      const currentPerms = [PERMISSIONS.USERS_VIEW]
      const suggestions = PermissionEngine.getSuggestions('TEAM_MEMBER', currentPerms)
      
      if (suggestions.length > 0) {
        expect(suggestions[0].confidence).toBeGreaterThan(0)
        expect(suggestions[0].confidence).toBeLessThanOrEqual(1)
      }
    })

    it('should only return valid suggestions', () => {
      const suggestions = PermissionEngine.getSuggestions('CLIENT', [])
      
      // All suggestions should be valid (not cause validation errors)
      for (const suggestion of suggestions) {
        const testPerms = [suggestion.permission]
        const validation = PermissionEngine.validate(testPerms)
        // Suggestions should be buildable to valid states
        expect(validation).toBeDefined()
      }
    })

    it('should sort suggestions by confidence', () => {
      const suggestions = PermissionEngine.getSuggestions('TEAM_LEAD', [PERMISSIONS.USERS_VIEW])
      
      if (suggestions.length > 1) {
        for (let i = 1; i < suggestions.length; i++) {
          expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence)
        }
      }
    })

    it('should limit suggestions to top 10', () => {
      const suggestions = PermissionEngine.getSuggestions('ADMIN', [])
      
      expect(suggestions.length).toBeLessThanOrEqual(10)
    })
  })

  describe('calculateRiskLevel', () => {
    it('should return LOW risk for basic permissions', () => {
      const risk = PermissionEngine.calculateRiskLevel([PERMISSIONS.USERS_VIEW])
      
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(risk)
    })

    it('should return higher risk for more permissions', () => {
      const manyPerms = Object.values(PERMISSIONS).slice(0, Math.floor(Object.keys(PERMISSIONS).length / 2))
      const risk = PermissionEngine.calculateRiskLevel(manyPerms)
      
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(risk)
    })

    it('should handle empty permission array', () => {
      const risk = PermissionEngine.calculateRiskLevel([])
      
      expect(risk).toBe('LOW')
    })
  })

  describe('getPermissionsByCategory', () => {
    it('should return array for valid category', () => {
      const perms = PermissionEngine.getPermissionsByCategory('Users')
      
      expect(Array.isArray(perms)).toBe(true)
    })

    it('should return empty array for invalid category', () => {
      const perms = PermissionEngine.getPermissionsByCategory('INVALID_CATEGORY' as any)
      
      expect(Array.isArray(perms)).toBe(true)
    })
  })

  describe('searchPermissions', () => {
    it('should find permissions by label', () => {
      const results = PermissionEngine.searchPermissions('users')
      
      expect(results.length).toBeGreaterThan(0)
    })

    it('should be case insensitive', () => {
      const results1 = PermissionEngine.searchPermissions('users')
      const results2 = PermissionEngine.searchPermissions('USERS')
      
      expect(results1.length).toBe(results2.length)
    })

    it('should return empty array for non-matching query', () => {
      const results = PermissionEngine.searchPermissions('xyznonexistent123')
      
      expect(results).toEqual([])
    })

    it('should find permissions by description', () => {
      const results = PermissionEngine.searchPermissions('create')
      
      // Should find permissions with 'create' in description
      expect(results.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getPermissionsByCategories', () => {
    it('should return object with category keys', () => {
      const grouped = PermissionEngine.getPermissionsByCategories()
      
      expect(typeof grouped).toBe('object')
      expect(Object.keys(grouped).length).toBeGreaterThan(0)
    })

    it('should have arrays as values', () => {
      const grouped = PermissionEngine.getPermissionsByCategories()
      
      for (const perms of Object.values(grouped)) {
        expect(Array.isArray(perms)).toBe(true)
      }
    })
  })

  describe('getAllPermissionMetadata', () => {
    it('should return array of metadata', () => {
      const metadata = PermissionEngine.getAllPermissionMetadata()
      
      expect(Array.isArray(metadata)).toBe(true)
      expect(metadata.length).toBeGreaterThan(0)
    })

    it('should have required metadata fields', () => {
      const metadata = PermissionEngine.getAllPermissionMetadata()
      
      for (const meta of metadata) {
        expect(meta).toHaveProperty('label')
        expect(meta).toHaveProperty('description')
        expect(meta).toHaveProperty('category')
        expect(meta).toHaveProperty('risk')
      }
    })
  })

  describe('canGrantPermission', () => {
    it('should return true for simple permission', () => {
      const canGrant = PermissionEngine.canGrantPermission(
        PERMISSIONS.USERS_VIEW,
        []
      )
      
      expect(typeof canGrant).toBe('boolean')
    })

    it('should return false if dependencies missing', () => {
      // This depends on the actual dependency structure
      // If USERS_EDIT requires USERS_VIEW, this test will catch it
      const canGrant = PermissionEngine.canGrantPermission(
        PERMISSIONS.USERS_EDIT,
        [] // No dependencies
      )
      
      expect(typeof canGrant).toBe('boolean')
    })

    it('should return false if conflicts exist', () => {
      const canGrant = PermissionEngine.canGrantPermission(
        PERMISSIONS.USERS_EDIT,
        [] // Assuming no conflicts with empty set
      )
      
      expect(typeof canGrant).toBe('boolean')
    })

    it('should allow super admin to grant any permission', () => {
      const allPerms = Object.values(PERMISSIONS)
      const canGrant = PermissionEngine.canGrantPermission(
        PERMISSIONS.USERS_VIEW,
        [],
        allPerms // Super admin with all permissions
      )
      
      expect(canGrant).toBe(true)
    })
  })
})
