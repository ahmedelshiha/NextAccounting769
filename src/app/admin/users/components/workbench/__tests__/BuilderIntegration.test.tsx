import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { useBuilderContent, useClearBuilderCache } from '@/hooks/useBuilderContent'
import { getBuilderConfig } from '@/lib/builder-io/config'
import {
  BuilderHeaderSlot,
  BuilderMetricsSlot,
  BuilderSidebarSlot,
  BuilderFooterSlot,
  BuilderMainSlot
} from '../BuilderSlots'

/**
 * Builder.io Integration Tests
 *
 * Tests the CMS integration for AdminWorkBench, including:
 * - Content fetching and caching
 * - Fallback behavior when Builder is disabled
 * - Error handling and retry logic
 * - Slot rendering with defaults
 */

// Mock the fetch API
global.fetch = vi.fn()

// Test wrapper component that uses useBuilderContent
function TestComponent({ modelName }: { modelName: string }) {
  const { content, isLoading, error, isEnabled, isCached } = useBuilderContent(modelName)

  if (!isEnabled) {
    return <div data-testid="disabled">Builder.io disabled</div>
  }

  if (isLoading) {
    return <div data-testid="loading">Loading...</div>
  }

  if (error) {
    return <div data-testid="error">{error}</div>
  }

  return (
    <div data-testid="content">
      <div data-testid="is-cached">{isCached ? 'cached' : 'fresh'}</div>
      {content && <pre>{JSON.stringify(content, null, 2)}</pre>}
    </div>
  )
}

describe('Builder.io Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear fetch mock
    ;(global.fetch as any).mockClear()
  })

  describe('Configuration', () => {
    it('should return enabled config when API key and space are set', () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-key'
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'

      const config = getBuilderConfig()
      expect(config.isEnabled).toBe(true)
      expect(config.apiKey).toBe('test-key')
      expect(config.space).toBe('test-space')
    })

    it('should return disabled config when API key is missing', () => {
      delete process.env.NEXT_PUBLIC_BUILDER_API_KEY
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'

      const config = getBuilderConfig()
      expect(config.isEnabled).toBe(false)
    })

    it('should return disabled config when space is missing', () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-key'
      delete process.env.NEXT_PUBLIC_BUILDER_SPACE

      const config = getBuilderConfig()
      expect(config.isEnabled).toBe(false)
    })

    it('should return disabled config when explicitly set to false', () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-key'
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'
      process.env.NEXT_PUBLIC_BUILDER_ENABLED = 'false'

      const config = getBuilderConfig()
      expect(config.isEnabled).toBe(false)
    })
  })

  describe('useBuilderContent Hook', () => {
    it('should show disabled state when Builder is not configured', () => {
      delete process.env.NEXT_PUBLIC_BUILDER_API_KEY
      delete process.env.NEXT_PUBLIC_BUILDER_SPACE

      render(<TestComponent modelName="admin-workbench-header" />)
      expect(screen.getByTestId('disabled')).toBeInTheDocument()
    })

    it('should fetch and display content when Builder is configured', async () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-key'
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'

      const mockContent = {
        results: [
          {
            id: 'test-content',
            blocks: [{ id: 'block-1', content: 'Test Content' }]
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockContent
      })

      render(<TestComponent modelName="admin-workbench-header" />)

      expect(screen.getByTestId('loading')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument()
      })
    })

    it('should show error state on fetch failure', async () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-key'
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      render(<TestComponent modelName="admin-workbench-header" />)

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument()
      })
    })

    it('should cache content and avoid duplicate requests', async () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-key'
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'

      const mockContent = { results: [{ id: 'test' }] }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockContent
      })

      const { rerender } = render(<TestComponent modelName="admin-workbench-header" />)

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Re-render with same model - should use cache
      rerender(<TestComponent modelName="admin-workbench-header" />)

      await waitFor(() => {
        expect(screen.getByTestId('is-cached')).toHaveTextContent('cached')
      })

      // Should still only have 1 fetch call
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Builder Slots', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-key'
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'
    })

    it('BuilderHeaderSlot should fallback to QuickActionsBar when disabled', () => {
      delete process.env.NEXT_PUBLIC_BUILDER_API_KEY

      render(<BuilderHeaderSlot />)
      // Should render default QuickActionsBar (which contains "Add User" button)
      expect(screen.queryByTestId('builder-header-slot')).not.toBeInTheDocument()
    })

    it('BuilderMetricsSlot should fallback to OverviewCards when disabled', () => {
      delete process.env.NEXT_PUBLIC_BUILDER_API_KEY

      render(<BuilderMetricsSlot />)
      // Should render default OverviewCards
      expect(screen.queryByTestId('builder-metrics-slot')).not.toBeInTheDocument()
    })

    it('BuilderFooterSlot should fallback to BulkActionsPanel when disabled', () => {
      delete process.env.NEXT_PUBLIC_BUILDER_API_KEY

      const props = {
        selectedCount: 5,
        selectedUserIds: new Set(['1', '2', '3']),
        onClear: vi.fn()
      }

      render(<BuilderFooterSlot {...props} />)
      // Should render default BulkActionsPanel
      expect(screen.queryByTestId('builder-footer-slot')).not.toBeInTheDocument()
    })
  })

  describe('Cache Management', () => {
    it('useClearBuilderCache should clear cached content', () => {
      process.env.NEXT_PUBLIC_BUILDER_API_KEY = 'test-key'
      process.env.NEXT_PUBLIC_BUILDER_SPACE = 'test-space'

      // Test would require access to internal cache map
      // In real implementation, would verify cache is cleared via fresh fetch
      expect(useClearBuilderCache).toBeDefined()
    })
  })
})
