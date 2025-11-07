import { vi, beforeEach } from 'vitest'
import * as React from 'react'
import fs from 'fs'

// Extend expect with DOM matchers
import '@testing-library/jest-dom'

// Ensure NEXTAUTH_SECRET for tenant cookie signing in tests
if (!process.env.NEXTAUTH_SECRET) process.env.NEXTAUTH_SECRET = 'test-secret'
// Ensure admin auth token for integration tests
if (!process.env.ADMIN_AUTH_TOKEN) process.env.ADMIN_AUTH_TOKEN = 'test-admin-token'

// Expose React globally for tests that perform SSR renders and rely on React being available
;(globalThis as any).React = React

// Expose fs helpers globally for tests that call readFileSync/writeFileSync without importing
;(globalThis as any).readFileSync = fs.readFileSync
;(globalThis as any).writeFileSync = fs.writeFileSync
;(globalThis as any).existsSync = fs.existsSync

// Default mocks to avoid Next.js headers() runtime issues in tests
const defaultSession = {
  user: {
    id: 'test-user',
    role: 'ADMIN',
    email: 'test@example.com',
    name: 'Test User',
    tenantId: 'test-tenant',
    tenantSlug: 'test-tenant-slug',
    tenantRole: 'OWNER',
    availableTenants: [{ id: 'test-tenant', slug: 'test-tenant-slug', name: 'Test Tenant', role: 'OWNER' }],
  },
}
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => defaultSession),
  // other exports if needed
}))

// Import centralized test setup that registers tenants and performs global cleanup
import './tests/testSetup'
vi.mock('next-auth/next', () => {
  const fn = vi.fn(async (...args: any[]) => {
    try {
      const na = await import('next-auth')
      if (na && typeof (na as any).getServerSession === 'function') {
        return (na as any).getServerSession(...args)
      }
    } catch (err) {
      // fall through
    }
    return defaultSession
  })
  return { getServerSession: fn }
})
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: defaultSession, status: 'authenticated' }),
  signOut: vi.fn()
}))
vi.mock('next-auth/jwt', () => {
  const encode = vi.fn(async ({ token }: { token?: Record<string, unknown> }) =>
    Buffer.from(JSON.stringify(token ?? {}), 'utf-8').toString('base64url')
  )
  const decode = vi.fn(async ({ token }: { token?: string }) => {
    try {
      const raw = Buffer.from(String(token ?? ''), 'base64url').toString('utf-8')
      return JSON.parse(raw)
    } catch {
      return null
    }
  })
  return {
    getToken: vi.fn(async () => null),
    encode,
    decode,
  }
})

// Provide a minimal Prisma namespace for tests importing { Prisma } without generated client
vi.mock('@prisma/client', () => ({
  Prisma: {
    DbNull: null,
    NullTypes: { DbNull: null },
  },
}))

// Global Next.js navigation mocks for component tests
vi.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  // Server-side redirect helper used in app routers
  redirect: vi.fn(),
}))

// Provide safe defaults for rate limiting in tests while preserving actual exports
vi.mock('@/lib/rate-limit', async () => {
  const actual: any = await vi.importActual('@/lib/rate-limit').catch(() => ({}))
  const applyRateLimit = vi.fn(async (_key: string, limit = 20, windowMs = 60_000) => ({
    allowed: true,
    backend: 'memory',
    count: 0,
    limit,
    remaining: limit,
    resetAt: Date.now() + windowMs,
  }))
  const rateLimitAsync = vi.fn(async () => true)
  const getClientIp = (_req: Request) => 'test'
  return { ...actual, applyRateLimit, rateLimitAsync, getClientIp }
})

// Ensure tests use the mock Prisma client to avoid hard DB dependencies
if (!process.env.PRISMA_MOCK) process.env.PRISMA_MOCK = 'true'

// Provide a safe default proxy for '@/lib/prisma' so tests that import prisma do not crash when DB is not configured
vi.mock('@/lib/prisma', async () => {
  try {
    // Prefer the project-level mock implementation so tests can manipulate mock behavior
    const mockMod = await import('./__mocks__/prisma')
    // Export as default to match prisma default export
    return { default: mockMod.default }
  } catch (err) {
    const handler: ProxyHandler<any> = {
      get(_t, prop) {
        // return a model proxy which returns noop async functions for common methods
        if (typeof prop === 'string') {
          const modelProxy = new Proxy({}, {
            get() {
              return async (..._args: any[]) => {
                // default safe responses
                return null
              }
            }
          })
          return modelProxy
        }
        return undefined
      }
    }
    return { default: new Proxy({}, handler) }
  }
})

// Provide a lightweight mock for '@/lib/auth' so tests that mock other auth modules still function
vi.mock('@/lib/auth', async () => {
  let actual: any = {}
  try {
    actual = await vi.importActual('@/lib/auth')
  } catch (err) {
    // If importing the real module fails (e.g. DB/env side-effects), fall back to a minimal shape
    actual = {}
  }
  return {
    // Preserve actual exports when available (authOptions, helpers) so tests that import authOptions get the real callbacks
    ...actual,
    // Ensure getSessionOrBypass exists and delegates to next-auth mock when present
    getSessionOrBypass: async () => {
      try {
        // Prefer 'next-auth' mock when tests call vi.doMock('next-auth')
        try {
          const modA = await import('next-auth')
          if (modA && typeof modA.getServerSession === 'function') {
            const res = await modA.getServerSession()
            // Debug output to diagnose why some tests see no session
             
            console.log('[vitest.setup] getSessionOrBypass -> next-auth.getServerSession returned:', res)
            return res
          }
        } catch (err) {
           
          console.log('[vitest.setup] import next-auth failed', err && (err as any).message)
        }
        // Some tests or code import 'next-auth/next'
        try {
          const modB = await import('next-auth/next')
          if (modB && typeof modB.getServerSession === 'function') {
            const res = await modB.getServerSession()
             
            console.log('[vitest.setup] getSessionOrBypass -> next-auth/next.getServerSession returned:', res)
            return res
          }
        } catch (err) {
           
          console.log('[vitest.setup] import next-auth/next failed', err && (err as any).message)
        }
      } catch (err) {
         
        console.log('[vitest.setup] getSessionOrBypass unexpected error', err && (err as any).message)
      }
      return null
    },
  }
})

// Reset mocks between tests and expose mock helpers
try {
  const { resetPrismaMock, mockPrisma } = await import('./__mocks__/prisma')
  // Reset prisma mock before each test to ensure isolated behavior
  beforeEach(async () => {
    try { resetPrismaMock() } catch {}
    try { vi.resetAllMocks() } catch {}
    try { const rl = await import('@/lib/rate-limit'); (rl as any)._resetRateLimitBucketsForTests?.() } catch {}
  })
  // Expose helper on globalThis for tests to use programmatically
  ;(globalThis as any).prismaMock = mockPrisma
  // Also expose `prisma` globally for fixtures that reference it by name
  try {
    ;(globalThis as any).prisma = mockPrisma
  } catch (e) {}
} catch (err) {
  // ignore if mocks not available
}

// Mock tenant utilities to provide tenant context for tests
vi.mock('@/lib/tenant', async () => {
  return {
    getTenantFromRequest: (req?: any) => {
      try {
        if (!req) return 'test-tenant'
        // NextRequest-like header accessor
        const headerGet = req && req.headers && typeof req.headers.get === 'function' ? req.headers.get.bind(req.headers) : null
        const candidate = headerGet ? headerGet('x-tenant-id') || headerGet('x-tenant') : (req && (req['x-tenant-id'] || req['x-tenant']))
        return candidate || 'test-tenant'
      } catch {
        return 'test-tenant'
      }
    },
    isMultiTenancyEnabled: () => true,
    tenantContext: {
      getContextOrNull: () => ({ tenantId: 'test-tenant' }),
      runWithTenant: async (tId: string, fn: any) => fn(),
    },
  }
})

// Mock tenant-context used by RLS helpers
vi.mock('@/lib/tenant-context', async () => {
  let currentContext: any = { tenantId: 'test-tenant', userId: 'test-user' }

  const tenantContext = {
    run: (ctx: any, cb: any) => {
      const prev = currentContext
      currentContext = ctx
      try {
        const result = cb()
        if (result && typeof result.then === 'function') {
          return result.finally(() => { currentContext = prev })
        }
        currentContext = prev
        return result
      } catch (err) {
        currentContext = prev
        throw err
      }
    },
    getContextOrNull: () => currentContext,
    getTenantId: () => currentContext?.tenantId ?? null,
    runWithTenant: async (t: string, fn: any) => {
      return tenantContext.run({ tenantId: t, timestamp: new Date() }, fn)
    },
    hasContext: () => currentContext !== null,
    requireTenantId: () => {
      if (!currentContext || !currentContext.tenantId) throw new Error('Tenant context is missing tenant identifier')
      return currentContext.tenantId
    },
    // test helpers
    _setContext: (ctx: any) => { currentContext = ctx },
    _clearContext: () => { currentContext = null },
  }

  // expose test helpers globally so tests can manipulate context directly
  try { (globalThis as any).__testTenantContext = { set: tenantContext._setContext, clear: tenantContext._clearContext } } catch {}

  return { tenantContext }
})

// Mock tenant-utils requireTenantContext used across API routes
// Use state management to allow per-test customization (especially for auth tests)
const tenantUtilsState = { userId: 'test-user', role: 'ADMIN', tenantId: 'test-tenant' }
;(globalThis as any).__tenantUtilsState = tenantUtilsState

vi.mock('@/lib/tenant-utils', async () => {
  // try to use tenant-context mock to derive a dynamic requireTenantContext
  let tcMod: any = null
  try {
    tcMod = await import('@/lib/tenant-context').catch(() => null)
  } catch {}

  return {
    requireTenantContext: () => {
      try {
        const ctx = tcMod?.tenantContext?.getContextOrNull ? tcMod.tenantContext.getContextOrNull() : null
        const state = (globalThis as any).__tenantUtilsState || tenantUtilsState
        return {
          userId: ctx?.userId ?? state.userId,
          tenantId: ctx?.tenantId ?? state.tenantId,
          userEmail: 'test@example.com',
          userName: 'Test User',
          role: ctx?.role ?? state.role,
          isSuperAdmin: ctx?.isSuperAdmin ?? true,
        }
      } catch {
        const state = (globalThis as any).__tenantUtilsState || tenantUtilsState
        return { userId: state.userId, tenantId: state.tenantId, userEmail: 'test@example.com', userName: 'Test User', role: state.role, isSuperAdmin: true }
      }
    },
    getTenantFilter: (_field = 'tenantId') => {
      try {
        const state = (globalThis as any).__tenantUtilsState || tenantUtilsState
        const contextTenantId = tcMod?.tenantContext?.getContextOrNull ? tcMod.tenantContext.getContextOrNull()?.tenantId : null
        return { tenantId: contextTenantId ?? state.tenantId }
      } catch {
        const state = (globalThis as any).__tenantUtilsState || tenantUtilsState
        return { tenantId: state.tenantId }
      }
    },
  }
})

// Ensure permissions module exports exist for tests that partially mock it
vi.mock('@/lib/permissions', async () => {
  try {
    const actual = await vi.importActual('@/lib/permissions')
    return { ...(actual as any) }
  } catch (err) {
    // Fallback minimal permissions export to keep tests stable when importing the real module
    const PERMISSIONS = {
      SERVICE_REQUESTS_CREATE: 'service_requests.create',
      SERVICE_REQUESTS_READ_ALL: 'service_requests.read.all',
      SERVICE_REQUESTS_READ_OWN: 'service_requests.read.own',
      SERVICE_REQUESTS_UPDATE: 'service_requests.update',
      SERVICE_REQUESTS_DELETE: 'service_requests.delete',
      SERVICE_REQUESTS_ASSIGN: 'service_requests.assign',
      INTEGRATION_HUB_EDIT: 'integration.settings.edit',
      INTEGRATION_HUB_TEST: 'integration.settings.test',
      INTEGRATION_HUB_SECRETS_WRITE: 'integration.settings.secrets.write',
      // Add other commonly used permissions as permissive defaults
      ANALYTICS_VIEW: 'analytics.view',
      SERVICES_VIEW: 'services.view',
      SERVICES_EDIT: 'services.edit',
      BOOKING_SETTINGS_VIEW: 'booking.settings.view',
      ORG_SETTINGS_VIEW: 'org.settings.view',
    } as const

    const ROLE_PERMISSIONS: Record<string, any[]> = {
      CLIENT: [PERMISSIONS.SERVICE_REQUESTS_CREATE, PERMISSIONS.SERVICE_REQUESTS_READ_OWN],
      TEAM_MEMBER: [PERMISSIONS.SERVICE_REQUESTS_READ_ALL],
      TEAM_LEAD: [PERMISSIONS.SERVICE_REQUESTS_READ_ALL, PERMISSIONS.INTEGRATION_HUB_TEST],
      ADMIN: Object.values(PERMISSIONS),
      SUPER_ADMIN: Object.values(PERMISSIONS),
    }

    function hasPermission(userRole: string | undefined | null, permission: string) {
      if (!userRole) return false
      const allowed = ROLE_PERMISSIONS[userRole]
      return Array.isArray(allowed) ? allowed.includes(permission) : false
    }

    function checkPermissions(userRole: string | undefined | null, required: string[]) {
      return required.every(p => hasPermission(userRole, p))
    }

    function getRolePermissions(userRole: string | undefined | null) {
      if (!userRole) return []
      return ROLE_PERMISSIONS[userRole] ?? []
    }

    function hasRole(userRole: string | undefined | null, allowedRoles: readonly string[]) {
      if (!userRole || !allowedRoles) return false
      return allowedRoles.includes(userRole)
    }

    return {
      PERMISSIONS,
      ROLE_PERMISSIONS,
      hasPermission,
      checkPermissions,
      getRolePermissions,
      hasRole,
    }
  }
})

// Polyfill Web APIs (Blob, File, URL) for jsdom/Node test environments
// Create a blob storage for mock URLs
const testBlobStore = new Map<string, any>()
let blobIdCounter = 0

// Ensure Blob exists and works properly
if (typeof (globalThis as any).Blob === 'undefined' || !((globalThis as any).Blob && typeof (globalThis as any).Blob === 'function')) {
  class NodeBlob {
    parts: any[]
    mimeType: string
    constructor(parts: any[] = [], options: any = {}) {
      this.parts = parts
      this.mimeType = options.type || 'application/octet-stream'
    }
    get type() { return this.mimeType }
    async text() { return this.parts.map(p => String(p)).join('') }
    async arrayBuffer() { return Buffer.from(await this.text()) }
    slice(start?: number, end?: number, contentType?: string) {
      const sliced = this.parts.slice(start, end)
      return new NodeBlob(sliced, { type: contentType || this.mimeType })
    }
  }
  ;(globalThis as any).Blob = NodeBlob as any
}

// Ensure URL.createObjectURL and URL.revokeObjectURL exist
try {
  if (!((globalThis as any).URL && typeof (globalThis as any).URL.createObjectURL === 'function')) {
    if (typeof (globalThis as any).URL !== 'function') {
      // URL doesn't exist, create a minimal one
      ;(globalThis as any).URL = class {
        constructor(public href: string) {}
      }
    }
    // Add createObjectURL to URL
    ;(globalThis as any).URL.createObjectURL = (blob: any) => {
      const id = `blob:mock-${++blobIdCounter}`
      testBlobStore.set(id, blob)
      return id
    }
    ;(globalThis as any).URL.revokeObjectURL = (url: string) => {
      testBlobStore.delete(url)
    }
  }
} catch (err) {
  // Fallback
  try {
    if (!(globalThis as any).URL) {
      ;(globalThis as any).URL = {}
    }
    if (typeof (globalThis as any).URL.createObjectURL !== 'function') {
      ;(globalThis as any).URL.createObjectURL = (blob: any) => {
        const id = `blob:mock-${++blobIdCounter}`
        testBlobStore.set(id, blob)
        return id
      }
    }
    if (typeof (globalThis as any).URL.revokeObjectURL !== 'function') {
      ;(globalThis as any).URL.revokeObjectURL = (url: string) => {
        testBlobStore.delete(url)
      }
    }
  } catch {}
}

// Stub HTMLAnchorElement.prototype.click to prevent navigation in tests
if (typeof (globalThis as any).HTMLAnchorElement !== 'undefined' && typeof (globalThis as any).HTMLAnchorElement.prototype.click !== 'function') {
  ;(globalThis as any).HTMLAnchorElement.prototype.click = function() {
    // Stub: don't actually navigate in tests
  }
}

// Polyfill Web File in Node test env

// Mock Stripe package for tests that import 'stripe' to avoid network calls
try {
  vi.mock('stripe', () => {
    class MockStripe {
      constructor(_key?: string) {}
      checkout = {
        sessions: {
          create: async (opts: any) => ({ id: `cs_${Math.random().toString(36).slice(2)}`, url: 'https://checkout.example.com', ...opts }),
        },
      }
      webhooks = {
        constructEvent: (_payload: any, _sig: any, _secret: any) => ({ id: `evt_${Math.random().toString(36).slice(2)}`, type: 'checkout.session.completed' }),
      }
    }
    return { default: MockStripe }
  })
} catch {}

// Mock offline queue/backlog helpers used in tests
try {
  const chatBacklogStore: Record<string, any[]> = {}
  vi.mock('@/lib/chat-backlog', () => ({
    enqueue: async (tenantId: string, msg: any) => {
      const key = tenantId || 'default'
      chatBacklogStore[key] = chatBacklogStore[key] || []
      chatBacklogStore[key].push(msg)
      return true
    },
    list: (tenantId?: string, limit = 50) => (chatBacklogStore[tenantId || 'default'] || []).slice(-limit),
    _debug_store: chatBacklogStore,
  }))
} catch {}

// Provide a safe default partial mock for rate-limit to ensure applyRateLimit exists in all tests
// Polyfill Web File in Node test env
if (typeof (globalThis as any).File === 'undefined') {
  class NodeFile extends Blob {
    name: string
    lastModified: number
    constructor(chunks: any[], name: string, options?: any) {
      super(chunks, options)
      this.name = name
      this.lastModified = Date.now()
    }
  }
  ;(globalThis as any).File = NodeFile as any
}

// Provide a safe default partial mock for rate-limit to ensure applyRateLimit exists in all tests
vi.mock('@/lib/rate-limit', async () => {
  try {
    const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit')
    return {
      ...actual,
      // Stable IP in tests
      getClientIp: vi.fn(() => '127.0.0.1'),
      // Async helpers default to allowed; individual tests can override
      rateLimitAsync: vi.fn(async () => true),
      applyRateLimit: vi.fn(async () => ({ allowed: true, backend: 'memory', count: 1, limit: 1, remaining: 0, resetAt: Date.now() + 1000 })),
    }
  } catch {
    return {
      getClientIp: vi.fn(() => '127.0.0.1'),
      rateLimit: vi.fn(() => true),
      rateLimitAsync: vi.fn(async () => true),
      applyRateLimit: vi.fn(async () => ({ allowed: true, backend: 'memory', count: 1, limit: 1, remaining: 0, resetAt: Date.now() + 1000 })),
    }
  }
})
