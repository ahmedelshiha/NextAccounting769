import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createListRoute,
  createDetailGetRoute,
  createDetailUpdateRoute,
  createDetailDeleteRoute,
  createCreateRoute,
  createCRUDRoute,
} from '../api-route-factory'
import { z } from 'zod'

// Mock auth middleware
vi.mock('@/lib/auth-middleware', () => ({
  withTenantAuth: (handler: any) => handler,
  withAdminAuth: (handler: any) => handler,
}))

// Mock respond utility
vi.mock('@/lib/api-response', () => ({
  respond: {
    ok: (data: any, meta?: any) => ({
      ok: () => true,
      json: () => ({ data, meta }),
    }),
    created: (data: any) => ({
      ok: () => true,
      json: () => ({ data }),
    }),
    notFound: () => ({
      ok: () => false,
      status: 404,
      json: () => ({ error: 'Not found' }),
    }),
    badRequest: (message: string) => ({
      ok: () => false,
      status: 400,
      json: () => ({ error: message }),
    }),
    serverError: (message: string) => ({
      ok: () => false,
      status: 500,
      json: () => ({ error: message }),
    }),
  },
}))

const mockSchema = z.object({
  name: z.string(),
  email: z.string().email(),
})

describe('API Route Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createListRoute', () => {
    it('fetches and returns list with pagination', async () => {
      const fetcher = vi.fn().mockResolvedValueOnce({
        data: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
        total: 50,
      })

      const handler = createListRoute(fetcher)

      const request = {
        url: 'http://localhost/api/items?limit=20&offset=0',
        tenantId: 'tenant-1',
      } as any

      const response = await handler(request)

      expect(fetcher).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
        limit: 20,
        offset: 0,
      }))
      expect(response.ok()).toBe(true)
    })

    it('handles default pagination', async () => {
      const fetcher = vi.fn().mockResolvedValueOnce({
        data: [{ id: '1' }],
        total: 1,
      })

      const handler = createListRoute(fetcher)

      const request = {
        url: 'http://localhost/api/items',
        tenantId: 'tenant-1',
      } as any

      await handler(request)

      expect(fetcher).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
        limit: 50,
        offset: 0,
      }))
    })

    it('enforces maximum limit of 100', async () => {
      const fetcher = vi.fn().mockResolvedValueOnce({
        data: [],
        total: 0,
      })

      const handler = createListRoute(fetcher)

      const request = {
        url: 'http://localhost/api/items?limit=500',
        tenantId: 'tenant-1',
      } as any

      await handler(request)

      expect(fetcher).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
        limit: 100,
      }))
    })

    it('passes filters with validation schema', async () => {
      const fetcher = vi.fn().mockResolvedValueOnce({
        data: [],
        total: 0,
      })

      const schema = z.object({
        active: z.boolean().optional(),
      })

      const handler = createListRoute(fetcher, schema)

      const request = {
        url: 'http://localhost/api/items?active=true',
        tenantId: 'tenant-1',
      } as any

      await handler(request)

      expect(fetcher).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
        active: true,
      }))
    })

    it('handles fetch errors gracefully', async () => {
      const fetcher = vi.fn().mockRejectedValueOnce(new Error('Database error'))

      const handler = createListRoute(fetcher)

      const request = {
        url: 'http://localhost/api/items',
        tenantId: 'tenant-1',
      } as any

      const response = await handler(request)

      expect(response.ok()).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('createDetailGetRoute', () => {
    it('fetches and returns single resource', async () => {
      const fetcher = vi.fn().mockResolvedValueOnce({
        id: '1',
        name: 'Item 1',
      })

      const handler = createDetailGetRoute(fetcher)

      const request = {
        url: 'http://localhost/api/items/1',
        tenantId: 'tenant-1',
      } as any

      const context = {
        params: { id: '1' },
      }

      const response = await handler(request, context)

      expect(fetcher).toHaveBeenCalledWith('1', 'tenant-1')
      expect(response.ok()).toBe(true)
    })

    it('returns 404 when resource not found', async () => {
      const fetcher = vi.fn().mockResolvedValueOnce(null)

      const handler = createDetailGetRoute(fetcher)

      const request = {
        url: 'http://localhost/api/items/1',
        tenantId: 'tenant-1',
      } as any

      const context = {
        params: { id: '1' },
      }

      const response = await handler(request, context)

      expect(response.ok()).toBe(false)
      expect(response.status).toBe(404)
    })

    it('returns 400 when ID is missing', async () => {
      const fetcher = vi.fn()

      const handler = createDetailGetRoute(fetcher)

      const request = {
        url: 'http://localhost/api/items',
        tenantId: 'tenant-1',
      } as any

      const context = {
        params: {},
      }

      const response = await handler(request, context)

      expect(response.ok()).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('createDetailUpdateRoute', () => {
    it('updates resource with validation', async () => {
      const updater = vi.fn().mockResolvedValueOnce({
        id: '1',
        name: 'Updated',
        email: 'updated@example.com',
      })

      const handler = createDetailUpdateRoute(updater, mockSchema)

      const request = {
        url: 'http://localhost/api/items/1',
        tenantId: 'tenant-1',
        json: async () => ({
          name: 'Updated',
          email: 'updated@example.com',
        }),
      } as any

      const context = {
        params: { id: '1' },
      }

      const response = await handler(request, context)

      expect(updater).toHaveBeenCalledWith(
        '1',
        'tenant-1',
        expect.objectContaining({
          name: 'Updated',
          email: 'updated@example.com',
        })
      )
      expect(response.ok()).toBe(true)
    })

    it('validates update data', async () => {
      const updater = vi.fn()

      const handler = createDetailUpdateRoute(updater, mockSchema)

      const request = {
        url: 'http://localhost/api/items/1',
        tenantId: 'tenant-1',
        json: async () => ({
          name: 'Updated',
          email: 'invalid-email',
        }),
      } as any

      const context = {
        params: { id: '1' },
      }

      const response = await handler(request, context)

      expect(response.ok()).toBe(false)
      expect(response.status).toBe(400)
      expect(updater).not.toHaveBeenCalled()
    })

    it('returns 404 when resource not found', async () => {
      const updater = vi.fn().mockRejectedValueOnce(
        new Error('Resource not found')
      )

      const handler = createDetailUpdateRoute(updater)

      const request = {
        url: 'http://localhost/api/items/1',
        tenantId: 'tenant-1',
        json: async () => ({ name: 'Updated' }),
      } as any

      const context = {
        params: { id: '1' },
      }

      const response = await handler(request, context)

      expect(response.ok()).toBe(false)
      expect(response.status).toBe(404)
    })
  })

  describe('createDetailDeleteRoute', () => {
    it('deletes resource', async () => {
      const deleter = vi.fn().mockResolvedValueOnce(undefined)

      const handler = createDetailDeleteRoute(deleter)

      const request = {
        url: 'http://localhost/api/items/1',
        tenantId: 'tenant-1',
      } as any

      const context = {
        params: { id: '1' },
      }

      const response = await handler(request, context)

      expect(deleter).toHaveBeenCalledWith('1', 'tenant-1')
      expect(response.ok()).toBe(true)
    })

    it('returns 404 when resource not found', async () => {
      const deleter = vi.fn().mockRejectedValueOnce(
        new Error('Resource does not exist')
      )

      const handler = createDetailDeleteRoute(deleter)

      const request = {
        url: 'http://localhost/api/items/1',
        tenantId: 'tenant-1',
      } as any

      const context = {
        params: { id: '1' },
      }

      const response = await handler(request, context)

      expect(response.ok()).toBe(false)
      expect(response.status).toBe(404)
    })
  })

  describe('createCreateRoute', () => {
    it('creates resource with validation', async () => {
      const creator = vi.fn().mockResolvedValueOnce({
        id: '1',
        name: 'New Item',
        email: 'new@example.com',
      })

      const handler = createCreateRoute(creator, mockSchema)

      const request = {
        url: 'http://localhost/api/items',
        tenantId: 'tenant-1',
        json: async () => ({
          name: 'New Item',
          email: 'new@example.com',
        }),
      } as any

      const response = await handler(request)

      expect(creator).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          name: 'New Item',
          email: 'new@example.com',
        })
      )
      expect(response.ok()).toBe(true)
    })

    it('validates create data', async () => {
      const creator = vi.fn()

      const handler = createCreateRoute(creator, mockSchema)

      const request = {
        url: 'http://localhost/api/items',
        tenantId: 'tenant-1',
        json: async () => ({
          name: 'New Item',
          email: 'invalid',
        }),
      } as any

      const response = await handler(request)

      expect(response.ok()).toBe(false)
      expect(response.status).toBe(400)
      expect(creator).not.toHaveBeenCalled()
    })

    it('handles creation errors', async () => {
      const creator = vi.fn().mockRejectedValueOnce(
        new Error('Duplicate key error')
      )

      const handler = createCreateRoute(creator)

      const request = {
        url: 'http://localhost/api/items',
        tenantId: 'tenant-1',
        json: async () => ({ name: 'Item' }),
      } as any

      const response = await handler(request)

      expect(response.ok()).toBe(false)
      expect(response.status).toBe(500)
    })
  })

  describe('createCRUDRoute', () => {
    it('creates routes with all CRUD operations', () => {
      const listFetcher = vi.fn().mockResolvedValueOnce({
        data: [],
        total: 0,
      })
      const creator = vi.fn()
      const detailFetcher = vi.fn()
      const updater = vi.fn()
      const deleter = vi.fn()

      const routes = createCRUDRoute({
        list: { fetcher: listFetcher },
        create: { creator },
        detail: { fetcher: detailFetcher, updater, deleter },
      })

      expect(routes.GET).toBeDefined()
      expect(routes.POST).toBeDefined()
      expect(routes.PUT).toBeDefined()
      expect(routes.DELETE).toBeDefined()
    })

    it('creates only configured routes', () => {
      const listFetcher = vi.fn().mockResolvedValueOnce({
        data: [],
        total: 0,
      })

      const routes = createCRUDRoute({
        list: { fetcher: listFetcher },
      })

      expect(routes.GET).toBeDefined()
      expect(routes.POST).toBeUndefined()
      expect(routes.PUT).toBeUndefined()
      expect(routes.DELETE).toBeUndefined()
    })
  })
})
