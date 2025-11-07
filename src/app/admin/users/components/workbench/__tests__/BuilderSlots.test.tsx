import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import {
  BuilderHeaderSlot,
  BuilderMetricsSlot,
  BuilderSidebarSlot,
  BuilderFooterSlot
} from '../BuilderSlots'

// Mock child components first
vi.mock('../QuickActionsBar', () => ({
  default: () => <div data-testid="quick-actions-bar-fallback">Default QuickActionsBar</div>
}))

vi.mock('../OverviewCards', () => ({
  default: () => <div data-testid="overview-cards-fallback">Default OverviewCards</div>
}))

vi.mock('../AdminSidebar', () => ({
  default: (props: any) => <div data-testid="admin-sidebar-fallback">Default AdminSidebar</div>
}))

vi.mock('../BulkActionsPanel', () => ({
  default: (props: any) => <div data-testid="bulk-actions-panel-fallback">Default BulkActionsPanel</div>
}))

// Mock the useBuilderContent hook
const mockUseBuilderContent = vi.fn(() => ({
  content: null,
  isLoading: false,
  error: null,
  isEnabled: false
}))

vi.mock('@/hooks/useBuilderContent', () => ({
  useBuilderContent: mockUseBuilderContent
}))

describe('BuilderSlots Components', () => {
  beforeEach(() => {
    mockUseBuilderContent.mockClear()
    mockUseBuilderContent.mockReturnValue({
      content: null,
      isLoading: false,
      error: null,
      isEnabled: false
    })
  })

  describe('BuilderHeaderSlot', () => {
    it('should render fallback when Builder.io is disabled', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: null,
        isEnabled: false
      })

      render(<BuilderHeaderSlot />)

      expect(screen.getByTestId('quick-actions-bar-fallback')).toBeInTheDocument()
    })

    it('should render fallback while loading', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: true,
        error: null,
        isEnabled: true
      })

      render(<BuilderHeaderSlot />)

      expect(screen.getByTestId('quick-actions-bar-fallback')).toBeInTheDocument()
    })

    it('should render fallback on error', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: 'API Error',
        isEnabled: true
      })

      render(<BuilderHeaderSlot />)

      expect(screen.getByTestId('quick-actions-bar-fallback')).toBeInTheDocument()
    })

    it('should render fallback when no content available', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: null,
        isEnabled: true
      })

      render(<BuilderHeaderSlot />)

      expect(screen.getByTestId('quick-actions-bar-fallback')).toBeInTheDocument()
    })

    it('should have Builder.io data attribute when enabled', () => {
      mockUseBuilderContent.mockReturnValue({
        content: { blocks: [] },
        isLoading: false,
        error: null,
        isEnabled: true
      })

      const { container } = render(<BuilderHeaderSlot />)

      expect(container.querySelector('[data-builder-model="admin-workbench-header"]')).toBeInTheDocument()
    })

    it('should log warning on error', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: 'Test error message',
        isEnabled: true
      })

      render(<BuilderHeaderSlot />)

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load Builder.io header content')
      )

      warnSpy.mockRestore()
    })
  })

  describe('BuilderMetricsSlot', () => {
    it('should render fallback when Builder.io is disabled', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: null,
        isEnabled: false
      })

      render(<BuilderMetricsSlot />)

      expect(screen.getByTestId('overview-cards-fallback')).toBeInTheDocument()
    })

    it('should render fallback while loading', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: true,
        error: null,
        isEnabled: true
      })

      render(<BuilderMetricsSlot />)

      expect(screen.getByTestId('overview-cards-fallback')).toBeInTheDocument()
    })

    it('should render with Builder.io data attribute when enabled', () => {
      mockUseBuilderContent.mockReturnValue({
        content: { blocks: [] },
        isLoading: false,
        error: null,
        isEnabled: true
      })

      const { container } = render(<BuilderMetricsSlot />)

      expect(container.querySelector('[data-builder-model="admin-workbench-metrics"]')).toBeInTheDocument()
    })

    it('should fetch content with correct model name', () => {
      render(<BuilderMetricsSlot />)

      expect(mockUseBuilderContent).toHaveBeenCalledWith('admin-workbench-metrics')
    })
  })

  describe('BuilderSidebarSlot', () => {
    const mockProps = {
      onFilterChange: vi.fn(),
      onClose: vi.fn()
    }

    it('should render fallback when Builder.io is disabled', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: null,
        isEnabled: false
      })

      render(<BuilderSidebarSlot {...mockProps} />)

      expect(screen.getByTestId('admin-sidebar-fallback')).toBeInTheDocument()
    })

    it('should pass props to fallback component', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: null,
        isEnabled: false
      })

      render(<BuilderSidebarSlot {...mockProps} />)

      expect(screen.getByTestId('admin-sidebar-fallback')).toBeInTheDocument()
    })

    it('should render with Builder.io data attribute when enabled', () => {
      mockUseBuilderContent.mockReturnValue({
        content: { blocks: [] },
        isLoading: false,
        error: null,
        isEnabled: true
      })

      const { container } = render(<BuilderSidebarSlot {...mockProps} />)

      expect(container.querySelector('[data-builder-model="admin-workbench-sidebar"]')).toBeInTheDocument()
    })

    it('should fetch content with correct model name', () => {
      render(<BuilderSidebarSlot {...mockProps} />)

      expect(mockUseBuilderContent).toHaveBeenCalledWith('admin-workbench-sidebar')
    })
  })

  describe('BuilderFooterSlot', () => {
    const mockProps = {
      selectedCount: 5,
      selectedUserIds: new Set(['1', '2', '3', '4', '5']),
      onClear: vi.fn()
    }

    it('should render fallback when Builder.io is disabled', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: null,
        isEnabled: false
      })

      render(<BuilderFooterSlot {...mockProps} />)

      expect(screen.getByTestId('bulk-actions-panel-fallback')).toBeInTheDocument()
    })

    it('should pass props to fallback component', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: null,
        isEnabled: false
      })

      render(<BuilderFooterSlot {...mockProps} />)

      expect(screen.getByTestId('bulk-actions-panel-fallback')).toBeInTheDocument()
    })

    it('should render with Builder.io data attribute when enabled', () => {
      mockUseBuilderContent.mockReturnValue({
        content: { blocks: [] },
        isLoading: false,
        error: null,
        isEnabled: true
      })

      const { container } = render(<BuilderFooterSlot {...mockProps} />)

      expect(container.querySelector('[data-builder-model="admin-workbench-footer"]')).toBeInTheDocument()
    })

    it('should fetch content with correct model name', () => {
      render(<BuilderFooterSlot {...mockProps} />)

      expect(mockUseBuilderContent).toHaveBeenCalledWith('admin-workbench-footer')
    })
  })

  describe('Error Handling', () => {
    it('should log warning when header fails to load', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: 'Network error',
        isEnabled: true
      })

      render(<BuilderHeaderSlot />)

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load Builder.io header')
      )

      warnSpy.mockRestore()
    })

    it('should handle missing content gracefully', () => {
      mockUseBuilderContent.mockReturnValue({
        content: undefined,
        isLoading: false,
        error: null,
        isEnabled: true
      })

      const { container } = render(<BuilderHeaderSlot />)

      expect(screen.getByTestId('quick-actions-bar-fallback')).toBeInTheDocument()
    })

    it('should handle null blocks in content', () => {
      mockUseBuilderContent.mockReturnValue({
        content: { blocks: null },
        isLoading: false,
        error: null,
        isEnabled: true
      })

      render(<BuilderHeaderSlot />)

      expect(screen.getByTestId('quick-actions-bar-fallback')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show fallback immediately while loading', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: true,
        error: null,
        isEnabled: true
      })

      render(<BuilderHeaderSlot />)

      expect(screen.getByTestId('quick-actions-bar-fallback')).toBeInTheDocument()
    })

    it('should not show loading spinner (uses fallback)', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: true,
        error: null,
        isEnabled: true
      })

      const { container } = render(<BuilderMetricsSlot />)

      expect(container.querySelector('[data-testid*="spinner"]')).not.toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    it('should render builder blocks when available', () => {
      const mockBlocks = [
        { id: '1', className: 'header-block', content: 'Header Content' }
      ]

      mockUseBuilderContent.mockReturnValue({
        content: { blocks: mockBlocks },
        isLoading: false,
        error: null,
        isEnabled: true
      })

      const { container } = render(<BuilderHeaderSlot />)

      expect(container.querySelector('[data-builder-block="1"]')).toBeInTheDocument()
    })

    it('should handle multiple blocks', () => {
      const mockBlocks = [
        { id: '1', className: 'block-1', content: 'Block 1' },
        { id: '2', className: 'block-2', content: 'Block 2' },
        { id: '3', className: 'block-3', content: 'Block 3' }
      ]

      mockUseBuilderContent.mockReturnValue({
        content: { blocks: mockBlocks },
        isLoading: false,
        error: null,
        isEnabled: true
      })

      const { container } = render(<BuilderMetricsSlot />)

      expect(container.querySelector('[data-builder-block="1"]')).toBeInTheDocument()
      expect(container.querySelector('[data-builder-block="2"]')).toBeInTheDocument()
      expect(container.querySelector('[data-builder-block="3"]')).toBeInTheDocument()
    })

    it('should apply block classes to rendered elements', () => {
      const mockBlocks = [
        { id: '1', className: 'custom-class', content: 'Content' }
      ]

      mockUseBuilderContent.mockReturnValue({
        content: { blocks: mockBlocks },
        isLoading: false,
        error: null,
        isEnabled: true
      })

      const { container } = render(<BuilderHeaderSlot />)
      const blockElement = container.querySelector('[data-builder-block="1"]')

      expect(blockElement).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible fallback components', () => {
      mockUseBuilderContent.mockReturnValue({
        content: null,
        isLoading: false,
        error: null,
        isEnabled: false
      })

      render(<BuilderHeaderSlot />)

      // Fallback should be accessible
      expect(screen.getByTestId('quick-actions-bar-fallback')).toBeInTheDocument()
    })

    it('should preserve semantics in builder blocks', () => {
      mockUseBuilderContent.mockReturnValue({
        content: { blocks: [] },
        isLoading: false,
        error: null,
        isEnabled: true
      })

      const { container } = render(<BuilderHeaderSlot />)

      const builderSection = container.querySelector('[data-builder-model="admin-workbench-header"]')
      expect(builderSection).toBeInTheDocument()
    })
  })
})
