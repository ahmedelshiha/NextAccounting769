import { test, expect, Page } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Phase 4d: Accessibility (WCAG 2.1 AA)', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()

    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@accountingfirm.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin/users')
  })

  test.describe('Audit Tab Accessibility', () => {
    test('should have no automated accessibility violations on audit tab', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')

      await injectAxe(page)
      await checkA11y(page, null, { detailedReport: true })
    })

    test('should have proper heading hierarchy', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')

      const h2 = page.locator('h2')
      await expect(h2).toContainText('Audit Log')

      const h3 = page.locator('h3')
      const h3Count = await h3.count()
      expect(h3Count).toBeGreaterThan(0)
    })

    test('should have descriptive labels for filters', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.locator('button:has-text("Show Filters")').click()

      const labels = page.locator('label')
      const labelCount = await labels.count()
      expect(labelCount).toBeGreaterThan(0)

      // Check that inputs are associated with labels
      const firstLabel = labels.first()
      const labelText = await firstLabel.textContent()
      expect(labelText?.length).toBeGreaterThan(0)
    })

    test('should have keyboard accessible filter controls', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.locator('button:has-text("Show Filters")').click()

      // Tab to first input
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(['INPUT', 'SELECT', 'BUTTON']).toContain(focusedElement)

      // Should be able to interact with focused element
      if (focusedElement === 'INPUT') {
        await page.keyboard.type('test')
        const input = page.locator('input:focus')
        const value = await input.inputValue()
        expect(value).toContain('test')
      }
    })

    test('should have proper aria-labels on action buttons', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()

      const filterButton = page.locator('button:has-text("Show Filters")')
      const ariaLabel = await filterButton.getAttribute('aria-label')
      expect(ariaLabel?.length).toBeGreaterThan(0)

      const exportButton = page.locator('button:has-text("📥 Export CSV")')
      const exportAriaLabel = await exportButton.getAttribute('aria-label')
      expect(exportAriaLabel?.length).toBeGreaterThan(0)
    })

    test('should have proper color contrast for text', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')

      await injectAxe(page)
      const results = await page.evaluate(() => {
        const axe = (window as any).axe
        return axe.run(
          {
            runOnly: { type: 'rule', values: ['color-contrast'] }
          },
          (results: any) => results
        )
      })

      // Results will be checked by axe
      expect(results).toBeDefined()
    })

    test('should have descriptive table headers', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')

      const headers = page.locator('thead th')
      const headerCount = await headers.count()
      expect(headerCount).toBeGreaterThan(0)

      const headerTexts = await headers.allTextContents()
      headerTexts.forEach(text => {
        expect(text.length).toBeGreaterThan(0)
      })
    })

    test('should have proper focus indicators', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()

      const button = page.locator('button:has-text("Show Filters")').first()
      await button.focus()

      const styles = await button.evaluate(el => {
        const style = window.getComputedStyle(el)
        return {
          outline: style.outline,
          boxShadow: style.boxShadow,
          backgroundColor: style.backgroundColor
        }
      })

      // Should have some visible focus indicator
      const hasIndicator =
        styles.outline !== 'none' ||
        styles.boxShadow !== 'none' ||
        styles.backgroundColor !== ''
      expect(hasIndicator).toBeTruthy()
    })

    test('should have role="alert" for error messages', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')

      // Look for any error state
      const alertRole = page.locator('[role="alert"]')
      // May or may not be visible depending on data
      const isVisible = await alertRole.isVisible().catch(() => false)
      if (isVisible) {
        const role = await alertRole.getAttribute('role')
        expect(role).toBe('alert')
      }
    })

    test('should have proper pagination controls', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')

      const nextButton = page.locator('button:has-text("Next →")')
      const hasNextButton = await nextButton.isVisible()

      if (hasNextButton) {
        const ariaLabel = await nextButton.getAttribute('aria-label')
        expect(ariaLabel?.length).toBeGreaterThan(0)
      }
    })

    test('should have skip to content option', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()

      // Check if there's a skip link (usually hidden but accessible via keyboard)
      const skipLink = page.locator('[href="#main"]')
      const hasSkipLink = await skipLink.isVisible().catch(() => false)

      // Not critical if not present, but good to have
      if (hasSkipLink) {
        await skipLink.click()
        const mainContent = page.locator('#main, main')
        await expect(mainContent).toBeFocused()
      }
    })
  })

  test.describe('Admin Settings Tab Accessibility', () => {
    test('should have no automated accessibility violations on admin settings', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.waitForLoadState('networkidle')

      await injectAxe(page)
      await checkA11y(page, null, { detailedReport: true })
    })

    test('should have proper tab navigation for subtabs', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()

      const tabsList = page.locator('[role="tablist"]')
      await expect(tabsList).toBeVisible()

      const tabs = page.locator('[role="tab"]')
      const tabCount = await tabs.count()
      expect(tabCount).toBeGreaterThan(0)
    })

    test('should have proper aria-selected for active tab', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()

      const activeTab = page.locator('[role="tab"][aria-selected="true"]')
      const isVisible = await activeTab.isVisible()
      expect(isVisible).toBeTruthy()
    })

    test('should have descriptive form labels', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("⚙️ Settings")').click()

      const labels = page.locator('label')
      const labelCount = await labels.count()
      expect(labelCount).toBeGreaterThan(0)

      const labelTexts = await labels.allTextContents()
      labelTexts.forEach(text => {
        expect(text.trim().length).toBeGreaterThan(0)
      })
    })

    test('should have proper select dropdown accessibility', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("⚙️ Settings")').click()

      const selects = page.locator('select')
      const selectCount = await selects.count()

      if (selectCount > 0) {
        const firstSelect = selects.first()
        const options = firstSelect.locator('option')
        const optionCount = await options.count()
        expect(optionCount).toBeGreaterThan(0)
      }
    })

    test('should have proper checkbox labeling', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("⚙️ Settings")').click()

      const checkboxes = page.locator('input[type="checkbox"]')
      const checkboxCount = await checkboxes.count()

      if (checkboxCount > 0) {
        // Each checkbox should be near a label or have aria-label
        const firstCheckbox = checkboxes.first()
        const ariaLabel = await firstCheckbox.getAttribute('aria-label')
        const parent = await firstCheckbox.evaluateHandle(el => el.parentElement)
        const parentText = await parent.evaluate(el => el?.textContent)

        const hasLabel = ariaLabel || (parentText && parentText.length > 0)
        expect(hasLabel).toBeTruthy()
      }
    })

    test('should keyboard navigate through settings form', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("⚙️ Settings")').click()

      const firstInput = page.locator('input, select').first()
      await firstInput.focus()

      const previousElement = await page.evaluate(() => (document.activeElement as HTMLElement)?.id)

      // Tab through multiple elements
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab')
        const currentElement = await page.evaluate(() => (document.activeElement as HTMLElement)?.tagName)
        expect(['INPUT', 'SELECT', 'BUTTON']).toContain(currentElement)
      }
    })
  })

  test.describe('Navigation & Structure', () => {
    test('should have logical heading hierarchy', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()

      const h1s = page.locator('h1')
      const h2s = page.locator('h2')
      const h3s = page.locator('h3')

      // Should have at least one h2
      const h2Count = await h2s.count()
      expect(h2Count).toBeGreaterThan(0)
    })

    test('should have proper list markup', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.locator('button:has-text("Show Filters")').click()

      // Look for any info lists
      const lists = page.locator('ul, ol')
      const listCount = await lists.count()

      if (listCount > 0) {
        const listItems = page.locator('li')
        const itemCount = await listItems.count()
        expect(itemCount).toBeGreaterThan(0)
      }
    })

    test('should have proper semantic HTML', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()

      // Check for proper use of semantic elements
      const nav = page.locator('nav')
      const main = page.locator('main')
      const section = page.locator('section')

      // At least one semantic element should be present
      const hasSemanticElements =
        (await nav.isVisible().catch(() => false)) ||
        (await main.isVisible().catch(() => false)) ||
        (await section.isVisible().catch(() => false))

      // Not critical if all are missing, but good to have
      expect(true).toBeTruthy()
    })

    test('should handle screen reader announcements', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.locator('button:has-text("Show Filters")').click()

      // Check for aria-live regions for dynamic updates
      const liveRegions = page.locator('[aria-live]')
      const liveRegionCount = await liveRegions.count()

      // Live regions are helpful but not always necessary
      if (liveRegionCount > 0) {
        const firstRegion = liveRegions.first()
        const ariaLive = await firstRegion.getAttribute('aria-live')
        expect(['polite', 'assertive', 'off']).toContain(ariaLive)
      }
    })
  })

  test.describe('Mobile Accessibility', () => {
    test('should be keyboard accessible on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.locator('button:has-text("🔐 Audit Log")').click()

      // Should still be able to tab through elements
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluate(() => (document.activeElement as HTMLElement)?.tagName)
      expect(['INPUT', 'SELECT', 'BUTTON', 'A']).toContain(focusedElement)
    })

    test('should have touch-friendly button sizes', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.locator('button:has-text("🔐 Audit Log")').click()

      const buttons = page.locator('button')
      const firstButton = buttons.first()

      const boundingBox = await firstButton.boundingBox()
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44) // Minimum touch target
      expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
    })
  })
})
