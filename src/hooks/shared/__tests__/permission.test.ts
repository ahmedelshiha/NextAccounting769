import { renderHook } from '@testing-library/react'
import { useCanAction } from '../useCanAction'
import { useUserRole } from '../useUserRole'
import { useTenant, type TenantInfo } from '../useTenant'
import { useCurrentUser, type CurrentUser } from '../useCurrentUser'
import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/permissions'
import { vi } from 'vitest'

vi.mock('next-auth/react')
vi.mock('@/lib/permissions')

describe('Permission & Session Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCanAction', () => {
    it('returns false if not authenticated', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useCanAction('service', 'view'))

      expect(result.current).toBe(false)
    })

    it('returns true when user has permission', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: { id: '1', role: 'ADMIN', email: 'admin@example.com' },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      vi.mocked(hasPermission).mockReturnValueOnce(true)

      const { result } = renderHook(() => useCanAction('service', 'create'))

      expect(result.current).toBe(true)
    })

    it('returns false when user lacks permission', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: { id: '1', role: 'CLIENT', email: 'user@example.com' },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      vi.mocked(hasPermission).mockReturnValueOnce(false)

      const { result } = renderHook(() => useCanAction('service', 'delete'))

      expect(result.current).toBe(false)
    })
  })

  describe('useUserRole', () => {
    it('returns null if not authenticated', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useUserRole())

      expect(result.current).toBeNull()
    })

    it('returns user role', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: { role: 'ADMIN', email: 'admin@example.com' },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useUserRole())

      expect(result.current).toBe('ADMIN')
    })

    it('converts STAFF role to TEAM_MEMBER', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: { role: 'STAFF', email: 'staff@example.com' },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useUserRole())

      expect(result.current).toBe('TEAM_MEMBER')
    })

    it('returns CLIENT role', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: { role: 'CLIENT', email: 'client@example.com' },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useUserRole())

      expect(result.current).toBe('CLIENT')
    })
  })

  describe('useTenant', () => {
    it('returns null if not authenticated', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useTenant())

      expect(result.current).toBeNull()
    })

    it('returns null if user has no tenantId', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: { id: '1', role: 'CLIENT', email: 'user@example.com' },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useTenant())

      expect(result.current).toBeNull()
    })

    it('returns tenant information', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: {
            id: '1',
            tenantId: 'tenant-123',
            tenantName: 'Acme Corp',
            tenantSlug: 'acme',
            email: 'user@example.com',
          },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useTenant())

      expect(result.current).toEqual({
        id: 'tenant-123',
        name: 'Acme Corp',
        slug: 'acme',
        features: undefined,
      })
    })

    it('parses tenant features from JSON', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: {
            id: '1',
            tenantId: 'tenant-123',
            tenantFeatures: '["feature1","feature2"]',
            email: 'user@example.com',
          },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useTenant())

      expect(result.current?.features).toEqual(['feature1', 'feature2'])
    })
  })

  describe('useCurrentUser', () => {
    it('returns null if not authenticated', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current).toBeNull()
    })

    it('returns current user data', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: {
            id: '1',
            email: 'john@example.com',
            name: 'John Doe',
            role: 'ADMIN',
            tenantId: 'tenant-123',
          },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current).toEqual({
        id: '1',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'ADMIN',
        tenantId: 'tenant-123',
        image: undefined,
      })
    })

    it('includes user image if available', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: {
            id: '1',
            email: 'jane@example.com',
            name: 'Jane Doe',
            image: 'https://example.com/avatar.jpg',
            role: 'CLIENT',
          },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current?.image).toBe('https://example.com/avatar.jpg')
    })

    it('converts STAFF role to TEAM_MEMBER', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: {
            id: '1',
            email: 'staff@example.com',
            role: 'STAFF',
          },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current?.role).toBe('TEAM_MEMBER')
    })

    it('defaults to CLIENT role if not specified', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: {
            id: '1',
            email: 'user@example.com',
            // No role specified
          },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current?.role).toBe('CLIENT')
    })

    it('handles missing user properties gracefully', () => {
      vi.mocked(useSession).mockReturnValueOnce({
        data: {
          user: {
            // Minimal user object
            id: '1',
          },
        },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      const { result } = renderHook(() => useCurrentUser())

      expect(result.current).toEqual({
        id: '1',
        email: '',
        name: undefined,
        image: undefined,
        role: 'CLIENT',
        tenantId: undefined,
      })
    })
  })
})
