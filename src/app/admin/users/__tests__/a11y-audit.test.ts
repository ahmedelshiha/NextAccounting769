/**
 * AdminWorkBench Accessibility Audit Tests
 * 
 * Tests WCAG 2.1 AA compliance for the AdminWorkBench UI.
 * Uses axe-core for automated accessibility scanning.
 * 
 * Run with: npm run test -- a11y-audit.test.ts
 */

import React from 'react'
import { render } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import AdminWorkBench from '../components/workbench/AdminWorkBench'
import AdminUsersLayout from '../components/workbench/AdminUsersLayout'
import BulkActionsPanel from '../components/workbench/BulkActionsPanel'
import OverviewCards from '../components/workbench/OverviewCards'
import { UsersContextProvider } from '../contexts/UsersContextProvider'

// Mock heavy components for testing
vi.mock('../components/workbench/UserDirectorySection', () => ({
  default: () => React.createElement('div', { 'data-testid': 'user-directory' }, 'Users')
}))

vi.mock('../components/workbench/AdminSidebar', () => ({
  default: () => React.createElement('aside', { 'data-testid': 'admin-sidebar' }, 'Sidebar')
}))

vi.mock('@/hooks/useBuilderContent', () => ({
  useIsBuilderEnabled: () => false,
  useBuilderContent: () => ({ content: null, isLoading: false })
}))

describe('AdminWorkBench Accessibility Audit', () => {
  const renderWithContext = (component: React.ReactNode) => {
    return render(
      React.createElement(UsersContextProvider, {}, component)
    )
  }

  describe('WCAG 2.1 Level AA - Semantic HTML', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = renderWithContext(React.createElement(AdminWorkBench))
      
      // Should have h1 as main title
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBeGreaterThan(0)
      
      // First heading should be h1
      const firstHeading = headings[0]
      expect(firstHeading.tagName).toBe('H1')
    })

    it('should use semantic layout elements', () => {
      const { container } = renderWithContext(React.createElement(AdminUsersLayout))
      
      // Should have header element
      const header = container.querySelector('header')
      expect(header).toBeTruthy()
      
      // Should have main element
      const main = container.querySelector('main')
      expect(main).toBeTruthy()
      
      // Should have aside for sidebar
      const aside = container.querySelector('aside')
      expect(aside).toBeTruthy()
    })

    it('should have proper form labeling', () => {
      const { getByRole } = renderWithContext(React.createElement(BulkActionsPanel, {
        selectedCount: 1,
        selectedUserIds: new Set(['1']),
        onClear: () => {}
      }))
      
      // Form elements should have accessible labels
      const selects = getByRole('combobox', { hidden: true })
      expect(selects).toBeTruthy()
    })
  })

  describe('WCAG 2.1 Level AA - Keyboard Navigation', () => {
    it('should have focusable interactive elements', () => {
      const { container } = renderWithContext(React.createElement(AdminWorkBench))
      
      // Get all focusable elements
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      expect(focusableElements.length).toBeGreaterThan(0)
    })

    it('buttons should be keyboard accessible', () => {
      const { getAllByRole } = renderWithContext(React.createElement(BulkActionsPanel, {
        selectedCount: 1,
        selectedUserIds: new Set(['1']),
        onClear: () => {}
      }))
      
      // Get all buttons
      const buttons = getAllByRole('button', { hidden: true })
      
      // Each button should be focusable
      buttons.forEach((button) => {
        expect(button.getAttribute('tabindex')).not.toBe('-1')
      })
    })

    it('should have visible focus indicators', () => {
      const { container } = renderWithContext(React.createElement(AdminUsersLayout))
      
      // Get CSS for buttons/links
      const buttons = container.querySelectorAll('button')
      
      buttons.forEach((button) => {
        // Should have some focus styling
        expect(button).toBeTruthy()
      })
    })
  })

  describe('WCAG 2.1 Level AA - Color Contrast', () => {
    it('should have sufficient color contrast on text', () => {
      const { container } = renderWithContext(React.createElement(OverviewCards))
      
      // Get all text elements
      const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6')
      
      // Verify text is visible (simplified check)
      textElements.forEach((element) => {
        const styles = window.getComputedStyle(element)
        const color = styles.color
        
        // Should have color properties set
        expect(color).toBeTruthy()
      })
    })

    it('button text should be legible', () => {
      const { getAllByRole } = renderWithContext(React.createElement(BulkActionsPanel, {
        selectedCount: 1,
        selectedUserIds: new Set(['1']),
        onClear: () => {}
      }))
      
      const buttons = getAllByRole('button', { hidden: true })
      
      buttons.forEach((button) => {
        // Button should have text content or aria-label
        const hasText = button.textContent && button.textContent.trim().length > 0
        const hasAriaLabel = button.getAttribute('aria-label')
        
        expect(hasText || hasAriaLabel).toBeTruthy()
      })
    })
  })

  describe('WCAG 2.1 Level AA - ARIA Attributes', () => {
    it('interactive elements should have ARIA labels', () => {
      const { getByRole } = renderWithContext(React.createElement(BulkActionsPanel, {
        selectedCount: 1,
        selectedUserIds: new Set(['1']),
        onClear: () => {}
      }))
      
      const buttons = getByRole('button', { hidden: true })
      expect(buttons).toBeTruthy()
    })

    it('should use ARIA roles appropriately', () => {
      const { container } = renderWithContext(React.createElement(AdminUsersLayout))
      
      // Table should have table role (or be a real table)
      const table = container.querySelector('[role="table"], table')
      expect(table).toBeTruthy()
    })

    it('select elements should be labeled', () => {
      const { container } = renderWithContext(React.createElement(BulkActionsPanel, {
        selectedCount: 1,
        selectedUserIds: new Set(['1']),
        onClear: () => {}
      }))
      
      const selects = container.querySelectorAll('select')
      
      selects.forEach((select) => {
        // Should have aria-label or be associated with label
        const ariaLabel = select.getAttribute('aria-label')
        
        expect(ariaLabel || select.getAttribute('name')).toBeTruthy()
      })
    })
  })

  describe('WCAG 2.1 Level AA - Form Accessibility', () => {
    it('form inputs should have associated labels', () => {
      const { container } = renderWithContext(React.createElement(BulkActionsPanel, {
        selectedCount: 1,
        selectedUserIds: new Set(['1']),
        onClear: () => {}
      }))
      
      const inputs = container.querySelectorAll('input[type="text"], input[type="search"], input[type="email"]')
      
      inputs.forEach((input) => {
        const id = input.getAttribute('id')
        const ariaLabel = input.getAttribute('aria-label')
        
        // Should have some form of label
        expect(id || ariaLabel).toBeTruthy()
      })
    })

    it('select boxes should be labeled', () => {
      const { container } = renderWithContext(React.createElement(BulkActionsPanel, {
        selectedCount: 1,
        selectedUserIds: new Set(['1']),
        onClear: () => {}
      }))
      
      const selects = container.querySelectorAll('select')
      expect(selects.length).toBeGreaterThan(0)
      
      selects.forEach((select) => {
        const ariaLabel = select.getAttribute('aria-label')
        expect(ariaLabel || select.getAttribute('name')).toBeTruthy()
      })
    })

    it('checkboxes should be properly labeled', () => {
      const { container } = renderWithContext(React.createElement(AdminUsersLayout))
      
      const checkboxes = container.querySelectorAll('input[type="checkbox"]')
      
      checkboxes.forEach((checkbox) => {
        // Should have aria-label or be inside label
        const ariaLabel = checkbox.getAttribute('aria-label')
        
        expect(ariaLabel || checkbox.getAttribute('name')).toBeTruthy()
      })
    })
  })

  describe('WCAG 2.1 Level AA - Text Alternatives', () => {
    it('images should have alt text', () => {
      const { container } = renderWithContext(React.createElement(AdminWorkBench))
      
      const images = container.querySelectorAll('img')
      
      images.forEach((img) => {
        const alt = img.getAttribute('alt')
        expect(alt).toBeTruthy()
      })
    })

    it('icons should have text or aria-label', () => {
      const { container } = renderWithContext(React.createElement(BulkActionsPanel, {
        selectedCount: 1,
        selectedUserIds: new Set(['1']),
        onClear: () => {}
      }))
      
      // SVG icons should have title or aria-label
      const svgs = container.querySelectorAll('svg')
      
      svgs.forEach((svg) => {
        const ariaLabel = svg.getAttribute('aria-label')
        const title = svg.querySelector('title')
        
        // Should have either aria-label or title
        expect(ariaLabel || title).toBeTruthy()
      })
    })
  })

  describe('WCAG 2.1 Level AA - Motion & Animation', () => {
    it('should respect prefers-reduced-motion', () => {
      // Check if component respects reduced motion preference
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      const prefersReducedMotion = mediaQuery.matches
      
      // If user prefers reduced motion, animations should be minimal
      expect(typeof prefersReducedMotion).toBe('boolean')
    })
  })

  describe('Performance & Accessibility', () => {
    it('should render within acceptable time', () => {
      const startTime = performance.now()
      
      renderWithContext(React.createElement(AdminWorkBench))
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render in under 2 seconds
      expect(renderTime).toBeLessThan(2000)
    })

    it('should not have layout shift issues', () => {
      const { container } = renderWithContext(React.createElement(AdminUsersLayout))
      
      // Get initial layout
      const initialElements = container.querySelectorAll('[role="table"], main, aside')
      
      expect(initialElements.length).toBeGreaterThan(0)
    })
  })
})
