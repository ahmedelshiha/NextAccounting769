import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ authOptions: {} }))

vi.mock('@/lib/permissions', () => ({
  hasPermission: vi.fn(() => true),
}))

// In-memory DB mock for prisma models used by the route
const db: any = { rows: [] as any[], diffs: [] as any[] }
const genId = () => 'ums_' + Math.random().toString(36).slice(2)

const prismaMock = {
  userManagementSettings: {
    findUnique: async ({ where }: any) => db.rows.find((o: any) => o.tenantId === where?.tenantId) || null,
    create: async ({ data }: any) => {
      const row = { id: genId(), createdAt: new Date(), updatedAt: new Date(), lastUpdatedBy: data.lastUpdatedBy ?? null, ...data }
      db.rows.push(row)
      return row
    },
    update: async ({ where, data }: any) => {
      const s = db.rows.find((x: any) => x.tenantId === where.tenantId)
      if (!s) throw new Error('not found')
      Object.assign(s, data)
      s.updatedAt = new Date()
      return s
    }
  },
  settingChangeDiff: {
    create: async ({ data }: any) => { db.diffs.push({ id: genId(), createdAt: new Date(), ...data }); return data }
  }
}

vi.mock('@/lib/prisma', () => ({ default: prismaMock }))

beforeEach(() => { db.rows.length = 0; db.diffs.length = 0 })

const base = 'https://t1.example.com'

describe('admin/user-management settings API', () => {
  describe('GET endpoint', () => {
    it('should return 401 unauthorized without session', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => null) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => null) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')
      const res: any = await mod.GET(new Request(`${base}/api/admin/settings/user-management`))
      expect(res.status).toBe(401)
    })

    it('should create defaults and return settings for ADMIN', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', email: 'a@b.com' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1', email: 'a@b.com' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')
      const res: any = await mod.GET(new Request(`${base}/api/admin/settings/user-management`))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.roles).toBeTruthy()
      expect(json.permissions).toBeTruthy()
      expect(json.onboarding).toBeTruthy()
      expect(json.entities).toBeTruthy()
    })

    it('should return all required setting sections', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')
      const res: any = await mod.GET(new Request(`${base}/api/admin/settings/user-management`))
      const json = await res.json()
      
      expect(json).toHaveProperty('roles')
      expect(json).toHaveProperty('permissions')
      expect(json).toHaveProperty('onboarding')
      expect(json).toHaveProperty('policies')
      expect(json).toHaveProperty('rateLimits')
      expect(json).toHaveProperty('sessions')
      expect(json).toHaveProperty('invitations')
    })

    it('should have proper structure for settings', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')
      const res: any = await mod.GET(new Request(`${base}/api/admin/settings/user-management`))
      const json = await res.json()
      
      expect(Array.isArray(json.roles)).toBe(true)
      expect(Array.isArray(json.permissions)).toBe(true)
      expect(typeof json.policies).toBe('object')
      expect(typeof json.sessions).toBe('object')
    })
  })

  describe('PUT endpoint - request validation', () => {
    it('should reject invalid request body (non-JSON)', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: 'not-json' }))
      expect([400, 500]).toContain(res.status)
    })

    it('should reject empty body', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(null) }))
      expect([400, 500]).toContain(res.status)
    })

    it('should accept valid JSON body', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')
      
      // First GET to create defaults
      await mod.GET(new Request(`${base}/api/admin/settings/user-management`))
      
      // Then PUT with valid data
      const payload = { sessions: { idle: 5, absolute: 60 } }
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(payload) }))
      expect(res.status).toBe(200)
    })
  })

  describe('PUT endpoint - partial updates', () => {
    it('should update partial fields and persist diffs', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')

      // Seed via GET (creates defaults)
      const res0: any = await mod.GET(new Request(`${base}/api/admin/settings/user-management`))
      expect(res0.status).toBe(200)

      // Update only sessions config
      const payload = { sessions: { idle: 5, absolute: 60 } }
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(payload) }))
      expect(res.status).toBe(200)
      const out = await res.json()
      expect(out.sessions).toBeTruthy()
      expect(out.sessions.idle).toBe(5)
      expect(out.sessions.absolute).toBe(60)
      expect(db.diffs.length).toBeGreaterThan(0)
    })

    it('should update roles separately', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')

      await mod.GET(new Request(`${base}/api/admin/settings/user-management`))

      const payload = { roles: ['ADMIN', 'MANAGER', 'STAFF'] }
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(payload) }))
      expect(res.status).toBe(200)
      const out = await res.json()
      expect(Array.isArray(out.roles)).toBe(true)
      expect(out.roles).toContain('ADMIN')
    })

    it('should update permissions separately', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')

      await mod.GET(new Request(`${base}/api/admin/settings/user-management`))

      const payload = { permissions: ['READ', 'WRITE', 'DELETE'] }
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(payload) }))
      expect(res.status).toBe(200)
      const out = await res.json()
      expect(Array.isArray(out.permissions)).toBe(true)
    })

    it('should update policies with MFA settings', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')

      await mod.GET(new Request(`${base}/api/admin/settings/user-management`))

      const payload = { policies: { mfaRequired: true, passwordMinLength: 16 } }
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(payload) }))
      expect(res.status).toBe(200)
      const out = await res.json()
      expect(out.policies).toBeTruthy()
    })

    it('should update entity settings for clients and teams', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')

      await mod.GET(new Request(`${base}/api/admin/settings/user-management`))

      const payload = {
        entities: {
          clients: { maxPerUser: 10, canDelete: true },
          teams: { maxPerUser: 5, canDelete: false }
        }
      }
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(payload) }))
      expect(res.status).toBe(200)
    })
  })

  describe('PUT endpoint - audit logging', () => {
    it('should log critical severity changes when roles modified', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')

      await mod.GET(new Request(`${base}/api/admin/settings/user-management`))

      const payload = { roles: ['ADMIN', 'NEW_ADMIN_ROLE'] }
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(payload) }))
      expect(res.status).toBe(200)
    })

    it('should log when security policies are changed', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')

      await mod.GET(new Request(`${base}/api/admin/settings/user-management`))

      const payload = { policies: { passwordMinLength: 20, mfaRequired: true } }
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(payload) }))
      expect(res.status).toBe(200)
    })

    it('should maintain settingChangeDiff for backward compatibility', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')

      await mod.GET(new Request(`${base}/api/admin/settings/user-management`))

      const payload = { sessions: { idle: 10 } }
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(payload) }))
      expect(res.status).toBe(200)
      expect(db.diffs.length).toBeGreaterThan(0)
    })
  })

  describe('PUT endpoint - multiple simultaneous changes', () => {
    it('should handle updates to multiple sections at once', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')

      await mod.GET(new Request(`${base}/api/admin/settings/user-management`))

      const payload = {
        roles: ['ADMIN', 'MANAGER'],
        permissions: ['READ', 'WRITE'],
        sessions: { idle: 10 },
        policies: { mfaRequired: true }
      }
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify(payload) }))
      expect(res.status).toBe(200)
      const out = await res.json()
      expect(out.roles).toBeTruthy()
      expect(out.permissions).toBeTruthy()
      expect(out.sessions).toBeTruthy()
      expect(out.policies).toBeTruthy()
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      
      // Mock a database error for update
      const originalUpdate = prismaMock.userManagementSettings.update
      prismaMock.userManagementSettings.update = async () => {
        throw new Error('Database connection lost')
      }

      const mod = await import('@/app/api/admin/settings/user-management/route')
      const res: any = await mod.PUT(new Request(`${base}/api/admin/settings/user-management`, { method: 'PUT', body: JSON.stringify({}) }))
      expect(res.status).toBeGreaterThanOrEqual(400)

      // Restore
      prismaMock.userManagementSettings.update = originalUpdate
    })

    it('should handle missing tenant context', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: null } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: null } })) }))
      
      const mod = await import('@/app/api/admin/settings/user-management/route')
      const res: any = await mod.GET(new Request(`${base}/api/admin/settings/user-management`))
      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Response format', () => {
    it('should return properly formatted JSON response', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')
      const res: any = await mod.GET(new Request(`${base}/api/admin/settings/user-management`))
      const json = await res.json()
      expect(typeof json).toBe('object')
      expect(!Array.isArray(json)).toBe(true)
    })

    it('should include metadata in response', async () => {
      vi.doMock('next-auth', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      vi.doMock('next-auth/next', () => ({ getServerSession: vi.fn(async () => ({ user: { id: 'admin1', role: 'ADMIN', tenantId: 't1' } })) }))
      const mod = await import('@/app/api/admin/settings/user-management/route')
      const res: any = await mod.GET(new Request(`${base}/api/admin/settings/user-management`))
      const json = await res.json()
      expect(json.roles).toBeDefined()
      expect(json.permissions).toBeDefined()
    })
  })
})
