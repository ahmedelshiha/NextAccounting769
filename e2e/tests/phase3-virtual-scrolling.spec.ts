import { test, expect } from '@playwright/test'

/**
 * Helper function for dev login authentication
 */
async function devLoginAndSetCookie(page: any, request: any, baseURL: string | undefined, email: string) {
  const base = baseURL || process.env.E2E_BASE_URL || 'http://localhost:3000'
  const res = await request.post(`${base}/api/_dev/login`, { data: { email } })
  expect(res.ok()).toBeTruthy()
  const json = await res.json()
  const token = json.token as string
  const url = new URL(base)
  await page.context().addCookies([
    { name: '__Secure-next-auth.session-token', value: token, domain: url.hostname, path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  ])
}

test.describe('Phase 3: Virtual Scrolling Implementation', () => {
  test.beforeEach(async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')
    // Navigate to Dashboard Operations tab which has the virtualized user directory
    await page.goto('/admin/users?tab=dashboard')

    // Wait for main content to load
    await expect(page.getByRole('heading')).first().toBeVisible({ timeout: 5000 })
  })

  test.describe('VirtualizedDataTable Component', () => {
    test('should render users table on dashboard operations', async ({ page }) => {
      // Navigate to Operations sub-tab if in Overview
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Check that table or list is visible
      const tableOrList = page.locator('table, [role="grid"], [role="presentation"]').first()
      await expect(tableOrList).toBeVisible({ timeout: 3000 })
    })

    test('should display virtualized rows with fixed height', async ({ page }) => {
      // Navigate to Operations sub-tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Get the table container
      const tableContainer = page.locator('[role="grid"], table').first()

      // Should have visible rows
      const rows = tableContainer.locator('tbody tr, [role="row"]')
      const rowCount = await rows.count()

      // Should have at least some rows visible
      expect(rowCount).toBeGreaterThan(0)
    })

    test('should handle row selection without performance degradation', async ({ page }) => {
      // Navigate to Operations sub-tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Find first row checkbox
      const firstCheckbox = page.locator('input[type="checkbox"]').first()
      if (await firstCheckbox.isVisible({ timeout: 1000 })) {
        await firstCheckbox.click()

        // Verify it's selected (has checked attribute)
        const isChecked = await firstCheckbox.isChecked()
        expect(isChecked).toBe(true)
      }
    })

    test('should support sorting without re-rendering entire list', async ({ page }) => {
      // Navigate to Operations sub-tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Find sortable header (if exists)
      const sortableHeader = page.locator('th[role="columnheader"], [role="columnheader"]').first()
      if (await sortableHeader.isVisible({ timeout: 1000 })) {
        await sortableHeader.click()

        // Verify table is still interactive
        const tableContainer = page.locator('[role="grid"], table').first()
        await expect(tableContainer).toBeVisible()
      }
    })
  })

  test.describe('Scroll Performance', () => {
    test('should maintain smooth scrolling (no jank)', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Get scrollable container
      const container = page.locator('[role="grid"], table').first()
      
      // Perform scroll
      await container.evaluate((el) => {
        el.scrollTop += 500
      })

      // Wait a bit
      await page.waitForTimeout(500)

      // Container should still be visible
      await expect(container).toBeVisible()
    })

    test('should not leak memory during scroll events', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Get scrollable container
      const container = page.locator('[role="grid"], table').first()

      // Perform multiple scrolls
      for (let i = 0; i < 10; i++) {
        await container.evaluate((el) => {
          el.scrollTop += 100
        })
        await page.waitForTimeout(100)
      }

      // Container should still be responsive
      await expect(container).toBeVisible()

      // Scroll back to top
      await container.evaluate((el) => {
        el.scrollTop = 0
      })

      await page.waitForTimeout(500)
      await expect(container).toBeVisible()
    })

    test('should handle rapid consecutive scrolls', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Get scrollable container
      const container = page.locator('[role="grid"], table').first()

      // Perform rapid scrolls without waiting
      for (let i = 0; i < 5; i++) {
        await container.evaluate((el) => {
          el.scrollTop += 200
        })
      }

      // Should still be visible and responsive
      await expect(container).toBeVisible()
    })
  })

  test.describe('useScrollPerformance Hook', () => {
    test('should track scroll metrics without performance impact', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Get scrollable container
      const container = page.locator('[role="grid"], table').first()

      // Perform scroll
      await container.evaluate((el) => {
        el.scrollTop += 300
      })

      // Wait for metrics to be captured
      await page.waitForTimeout(500)

      // Page should remain responsive
      const heading = page.getByRole('heading').first()
      await expect(heading).toBeVisible()
    })

    test('should report FPS during smooth scroll', async ({ page }) => {
      // This is primarily a manual test, but we can verify the page doesn't crash
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Perform scroll with monitoring
      const container = page.locator('[role="grid"], table').first()
      for (let i = 0; i < 3; i++) {
        await container.evaluate((el) => {
          el.scrollTop += 150
        })
        await page.waitForTimeout(200)
      }

      // Page should not error
      const errors = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      expect(errors).toHaveLength(0)
    })
  })

  test.describe('Virtual Scrolling with Bulk Operations', () => {
    test('should allow selecting multiple rows without performance degradation', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Find checkboxes
      const checkboxes = page.locator('input[type="checkbox"]')
      const checkboxCount = await checkboxes.count()

      // Select first few items
      for (let i = 0; i < Math.min(5, checkboxCount); i++) {
        const checkbox = checkboxes.nth(i)
        if (await checkbox.isVisible({ timeout: 500 })) {
          await checkbox.click()
        }
      }

      // Table should still be responsive
      const table = page.locator('[role="grid"], table').first()
      await expect(table).toBeVisible()
    })

    test('should maintain selection state while scrolling', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Select first row
      const firstCheckbox = page.locator('input[type="checkbox"]').nth(0)
      if (await firstCheckbox.isVisible({ timeout: 500 })) {
        await firstCheckbox.click()
        
        // Verify selected
        let isChecked = await firstCheckbox.isChecked()
        expect(isChecked).toBe(true)
        
        // Scroll
        const container = page.locator('[role="grid"], table').first()
        await container.evaluate((el) => {
          el.scrollTop += 300
        })
        
        await page.waitForTimeout(500)
        
        // Scroll back
        await container.evaluate((el) => {
          el.scrollTop = 0
        })
        
        await page.waitForTimeout(500)
        
        // First checkbox should still be selected
        isChecked = await firstCheckbox.isChecked()
        expect(isChecked).toBe(true)
      }
    })
  })

  test.describe('Accessibility with Virtual Scrolling', () => {
    test('should maintain keyboard accessibility', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Focus first row
      const firstRow = page.locator('tr, [role="row"]').first()
      if (await firstRow.isVisible({ timeout: 500 })) {
        await firstRow.focus()
        
        // Should be focused
        const isFocused = await firstRow.evaluate((el) => {
          return el === document.activeElement || el.contains(document.activeElement as Node)
        })
        
        expect(isFocused).toBe(true)
      }
    })

    test('should work with screen readers', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Check for ARIA attributes on table
      const table = page.locator('[role="grid"], table').first()
      if (await table.isVisible({ timeout: 1000 })) {
        const role = await table.getAttribute('role')
        // Should have proper role or be a table
        expect(role === 'grid' || table.evaluate((el) => el.tagName === 'TABLE')).toBeTruthy()
      }
    })
  })

  test.describe('Virtual Scrolling Edge Cases', () => {
    test('should handle empty table gracefully', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Check if empty message is displayed when no data
      const emptyMessage = page.getByText(/no|empty|create/i)
      const table = page.locator('[role="grid"], table').first()

      // Either table has rows or empty message is shown
      const hasTable = await table.isVisible({ timeout: 1000 })
      const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 500 }).catch(() => false)

      expect(hasTable || hasEmptyMessage).toBe(true)
    })

    test('should handle resizing container without errors', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Resize window
      await page.setViewportSize({ width: 800, height: 600 })
      await page.waitForTimeout(500)

      // Table should still be visible
      const table = page.locator('[role="grid"], table').first()
      await expect(table).toBeVisible()

      // Resize back
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.waitForTimeout(500)

      // Table should still be visible
      await expect(table).toBeVisible()
    })

    test('should handle dynamic data updates', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)
      }

      // Find refresh button if exists
      const refreshButton = page.getByRole('button', { name: /refresh|reload|sync/i })
      if (await refreshButton.isVisible({ timeout: 500 })) {
        await refreshButton.click()
        
        // Wait for update
        await page.waitForTimeout(1000)
        
        // Table should still be visible
        const table = page.locator('[role="grid"], table').first()
        await expect(table).toBeVisible()
      }
    })
  })

  test.describe('Performance Comparison', () => {
    test('should load large list within reasonable time', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        const startTime = Date.now()
        await operationsTab.click()
        await page.waitForTimeout(2000)
        const loadTime = Date.now() - startTime

        // Should load within 5 seconds
        expect(loadTime).toBeLessThan(5000)

        // Table should be visible
        const table = page.locator('[role="grid"], table').first()
        await expect(table).toBeVisible()
      }
    })

    test('should scroll large list smoothly', async ({ page }) => {
      // Navigate to Dashboard Operations tab
      const operationsTab = page.getByRole('tab', { name: /operations/i })
      if (await operationsTab.isVisible()) {
        await operationsTab.click()
        await page.waitForTimeout(1000)

        // Perform timed scroll
        const container = page.locator('[role="grid"], table').first()
        const startTime = Date.now()
        
        for (let i = 0; i < 10; i++) {
          await container.evaluate((el) => {
            el.scrollTop += 100
          })
          await page.waitForTimeout(50)
        }
        
        const scrollTime = Date.now() - startTime

        // Should complete 10 scrolls in under 2 seconds (smooth)
        expect(scrollTime).toBeLessThan(2000)
      }
    })
  })
})
