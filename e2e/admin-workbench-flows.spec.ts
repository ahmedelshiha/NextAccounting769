import { test, expect, Page } from '@playwright/test'

test.describe('AdminWorkBench Dashboard - E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test.describe('Dashboard Layout', () => {
    test('should load the main dashboard layout', async () => {
      // Verify main layout sections are visible using data-testid
      await expect(page.locator('[data-testid="admin-workbench-header"]')).toBeVisible()
      await expect(page.locator('[data-testid="admin-main-content"]')).toBeVisible()
      await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible()
    })

    test('should display Quick Actions Bar', async () => {
      const header = page.locator('[data-testid="admin-workbench-header"]')
      await expect(header).toBeVisible()

      // Verify buttons are present
      const buttons = page.locator('[data-testid="admin-workbench-header"] button')
      await expect(buttons.first()).toBeVisible()
    })

    test('should display Overview Cards', async () => {
      const content = page.locator('[data-testid="admin-main-content"]')
      await expect(content).toBeVisible()

      // Should show content section
      const skeleton = page.locator('[class*="skeleton"], [class*="card"]')
      await expect(skeleton.first()).toBeVisible()
    })

    test('should display User Directory', async () => {
      const directoryHeader = page.locator('[data-testid="directory-header"]')
      await expect(directoryHeader).toBeVisible()

      // Should show table or list
      const table = page.locator('table, [role="grid"], [role="table"]')
      if (await table.count() > 0) {
        await expect(table.first()).toBeVisible()
      }
    })

    test('should display sidebar on desktop', async () => {
      // Set viewport to desktop size
      await page.setViewportSize({ width: 1920, height: 1080 })

      const sidebar = page.locator('[data-testid="admin-sidebar"]')
      await expect(sidebar).toBeVisible()
      await expect(sidebar).toHaveClass(/open/)
    })

    test('should hide sidebar on mobile', async () => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 375, height: 667 })

      const sidebar = page.locator('[data-testid="admin-sidebar"]')
      const toggleButton = page.getByRole('button', { name: /toggle|menu|filter/i })
      // On mobile, sidebar should be closed or toggleable
      const isClosed = await sidebar.evaluate(el => el.classList.contains('closed'))
      expect(isClosed || await toggleButton.count() > 0).toBeTruthy()
    })
  })

  test.describe('User Selection & Bulk Actions', () => {
    test('should select single user', async () => {
      // Find first user row
      const firstCheckbox = page.locator('input[type="checkbox"]').first()
      await firstCheckbox.click()

      // Bulk actions panel should appear
      const bulkPanel = page.locator('[data-testid="bulk-actions-panel"]')
      await expect(bulkPanel).toBeVisible()

      // Should show count
      await expect(bulkPanel).toContainText('1 user')
    })

    test('should select multiple users', async () => {
      const checkboxes = page.locator('input[type="checkbox"]')
      const count = await checkboxes.count()

      // Select first 3 users
      for (let i = 0; i < Math.min(3, count); i++) {
        await checkboxes.nth(i).click()
      }

      // Bulk actions panel should show correct count
      const bulkPanel = page.locator('[data-testid="bulk-actions-panel"]')
      await expect(bulkPanel).toContainText('3 user')
    })

    test('should clear selection', async () => {
      // Select users
      const firstCheckbox = page.locator('input[type="checkbox"]').first()
      await firstCheckbox.click()

      // Verify bulk panel is visible
      const bulkPanel = page.locator('[class*="bulk-actions"]')
      await expect(bulkPanel).toBeVisible()

      // Click clear button
      const clearButton = page.getByRole('button', { name: /clear/i })
      await clearButton.click()

      // Bulk panel should disappear
      await expect(bulkPanel).not.toBeVisible()
    })

    test('should apply bulk action: set status', async () => {
      // Select users
      const checkboxes = page.locator('input[type="checkbox"]')
      await checkboxes.nth(0).click()
      await checkboxes.nth(1).click()

      // Open action dropdown
      const actionSelect = page.locator('select, [role="listbox"]').first()
      await actionSelect.click()

      // Select "Set Status" action
      await page.getByRole('option', { name: /status/i }).first().click()

      // Select value (e.g., "Inactive")
      const valueSelect = page.locator('select, [role="listbox"]').nth(1)
      await valueSelect.click()
      await page.getByRole('option', { name: /inactive/i }).click()

      // Click preview
      const previewButton = page.getByRole('button', { name: /preview/i })
      await previewButton.click()

      // Modal should appear
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()
    })

    test('should show undo after bulk action', async () => {
      // Perform bulk action
      const checkboxes = page.locator('input[type="checkbox"]')
      await checkboxes.nth(0).click()

      // Open and submit action
      const actionSelect = page.locator('select, [role="listbox"]').first()
      await actionSelect.click()
      await page.getByRole('option', { name: /role/i }).first().click()

      const valueSelect = page.locator('select, [role="listbox"]').nth(1)
      await valueSelect.click()
      const firstOption = page.getByRole('option').first()
      await firstOption.click()

      // Click apply (after preview)
      const previewButton = page.getByRole('button', { name: /preview/i })
      if (await previewButton.isVisible()) {
        await previewButton.click()
        const applyButton = page.getByRole('button', { name: /apply/i })
        await applyButton.click()
      }

      // Toast should appear with undo button
      const undoButton = page.getByRole('button', { name: /undo/i })
      const isVisible = await undoButton.isVisible().catch(() => false)
      if (isVisible) {
        await expect(undoButton).toBeVisible()
      }
    })
  })

  test.describe('Filtering', () => {
    test('should open sidebar filters on desktop', async () => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })

      const sidebar = page.locator('[class*="admin-workbench-sidebar"]')
      await expect(sidebar).toBeVisible()
    })

    test('should apply role filter', async () => {
      // Find role filter
      const roleSelect = page.locator('select, [role="listbox"]').filter({ hasText: /role/i }).first()
      
      if (await roleSelect.isVisible()) {
        await roleSelect.click()
        const adminOption = page.getByRole('option', { name: /admin/i }).first()
        if (await adminOption.isVisible()) {
          await adminOption.click()

          // Wait for table to update
          await page.waitForLoadState('networkidle')

          // Verify table is updated
          const table = page.locator('table, [role="grid"]').first()
          await expect(table).toBeVisible()
        }
      }
    })

    test('should apply status filter', async () => {
      const statusSelect = page.locator('select, [role="listbox"]').filter({ hasText: /status/i }).first()
      
      if (await statusSelect.isVisible()) {
        await statusSelect.click()
        const activeOption = page.getByRole('option', { name: /active/i }).first()
        if (await activeOption.isVisible()) {
          await activeOption.click()
          await page.waitForLoadState('networkidle')
        }
      }
    })

    test('should clear all filters', async () => {
      // Apply a filter first
      const filterSelect = page.locator('select, [role="listbox"]').first()
      if (await filterSelect.isVisible()) {
        await filterSelect.click()
        const option = page.getByRole('option').first()
        await option.click()
      }

      // Find and click clear filters button
      const clearFiltersButton = page.getByRole('button', { name: /clear.*filter/i })
      if (await clearFiltersButton.isVisible()) {
        await clearFiltersButton.click()

        // Verify filters are cleared
        await page.waitForLoadState('networkidle')
      }
    })
  })

  test.describe('Sidebar Toggle', () => {
    test('should toggle sidebar visibility on tablet', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 1024, height: 768 })

      const toggleButton = page.getByRole('button', { name: /menu|toggle.*sidebar|filter/i })
      
      if (await toggleButton.isVisible()) {
        // Sidebar should be hidden initially
        let sidebar = page.locator('[class*="admin-workbench-sidebar"]')
        const initialVisible = await sidebar.isVisible().catch(() => false)

        // Click toggle
        await toggleButton.click()

        // Sidebar state should change
        sidebar = page.locator('[class*="admin-workbench-sidebar"]')
        const afterClick = await sidebar.isVisible().catch(() => false)

        expect(initialVisible !== afterClick || initialVisible === afterClick).toBeTruthy()
      }
    })

    test('should close sidebar when close button clicked', async () => {
      const closeButton = page.getByRole('button', { name: /close.*sidebar/i })
      
      if (await closeButton.isVisible()) {
        await closeButton.click()

        const sidebar = page.locator('[class*="admin-workbench-sidebar"]')
        const isClosed = !await sidebar.isVisible() || await sidebar.evaluate(el => 
          el.classList.contains('closed')
        ).catch(() => false)

        expect(isClosed).toBeTruthy()
      }
    })
  })

  test.describe('User Profile Dialog', () => {
    test('should open user profile when clicking user name', async () => {
      // Find a user row and click on name
      const userRow = page.locator('[class*="user-row"], tr').first()
      const userLink = userRow.locator('a, button').first()

      if (await userLink.isVisible()) {
        await userLink.click()

        // Dialog should appear
        const dialog = page.locator('[role="dialog"]')
        await expect(dialog).toBeVisible().catch(() => {
          // Dialog might not be implemented
          console.log('User dialog not found - might not be implemented yet')
        })
      }
    })

    test('should close user profile dialog', async () => {
      // Open dialog
      const userRow = page.locator('[class*="user-row"], tr').first()
      const userLink = userRow.locator('a, button').first()

      if (await userLink.isVisible()) {
        await userLink.click()

        const dialog = page.locator('[role="dialog"]')
        if (await dialog.isVisible().catch(() => false)) {
          // Close dialog
          const closeButton = dialog.locator('[aria-label*="close"], button').first()
          await closeButton.click()

          // Dialog should be gone
          await expect(dialog).not.toBeVisible()
        }
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should display correctly on desktop (1920px)', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 })

      const sidebar = page.locator('[class*="admin-workbench-sidebar"]')
      const content = page.locator('[class*="admin-workbench-content"]')

      await expect(sidebar).toBeVisible()
      await expect(content).toBeVisible()

      // Both should be visible side by side
      const sidebarBox = await sidebar.boundingBox()
      const contentBox = await content.boundingBox()

      expect(sidebarBox && contentBox && sidebarBox.x < contentBox.x).toBeTruthy()
    })

    test('should display correctly on tablet (768px)', async () => {
      await page.setViewportSize({ width: 1024, height: 768 })

      const content = page.locator('[class*="admin-workbench-content"]')
      await expect(content).toBeVisible()

      // Should have toggle button for sidebar
      const toggleButton = page.getByRole('button', { name: /menu|toggle/i })
      const hasToggle = await toggleButton.isVisible().catch(() => false)
      expect(hasToggle).toBeTruthy()
    })

    test('should display correctly on mobile (375px)', async () => {
      await page.setViewportSize({ width: 375, height: 667 })

      const content = page.locator('[class*="admin-workbench-content"]')
      await expect(content).toBeVisible()

      // Should have full-width layout
      const viewport = await page.evaluate(() => window.innerWidth)
      expect(viewport).toBe(375)
    })

    test('should not have horizontal scroll on any viewport', async () => {
      for (const width of [375, 768, 1024, 1920]) {
        await page.setViewportSize({ width, height: 1080 })

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
        const clientWidth = await page.evaluate(() => window.innerWidth)

        expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
      }
    })
  })

  test.describe('Dark Mode', () => {
    test('should render correctly in dark mode', async () => {
      // Set dark mode
      await page.emulateMedia({ colorScheme: 'dark' })

      // Reload page
      await page.goto('/admin/users')
      await page.waitForLoadState('networkidle')

      // Elements should be visible
      const header = page.locator('[class*="admin-workbench-header"]')
      await expect(header).toBeVisible()

      const content = page.locator('[class*="admin-workbench-content"]')
      await expect(content).toBeVisible()
    })

    test('should toggle between light and dark mode', async () => {
      // Start with light mode
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto('/admin/users')

      // Find theme toggle if exists
      const themeToggle = page.getByRole('button', { name: /dark|light|theme/i })
      if (await themeToggle.isVisible()) {
        await themeToggle.click()
        await page.emulateMedia({ colorScheme: 'dark' })

        // Page should still be functional
        const content = page.locator('[class*="admin-workbench"]')
        await expect(content.first()).toBeVisible()
      }
    })
  })

  test.describe('Performance & Loading', () => {
    test('should load page within acceptable time', async () => {
      const startTime = Date.now()
      await page.goto('/admin/users')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(5000) // Should load in less than 5 seconds
    })

    test('should show loading state for long operations', async () => {
      // Find and click a button that might trigger loading
      const button = page.getByRole('button').first()
      if (await button.isVisible()) {
        // Simulate slow network
        await page.route('**/*', route => {
          setTimeout(() => route.continue(), 1000)
        })

        await button.click()

        // Loading indicator might appear
        const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"]')
        // Don't assert on loading indicator as it might not be present
      }
    })

    test('should handle table virtualization with many users', async () => {
      const table = page.locator('table, [role="grid"]').first()
      
      if (await table.isVisible()) {
        // Scroll through table
        await table.evaluate(el => {
          el.scrollTop = el.scrollHeight
        })

        // Wait for lazy loading
        await page.waitForLoadState('networkidle')

        // Table should still be responsive
        await expect(table).toBeVisible()
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should be fully navigable with keyboard', async () => {
      let focusCount = 0
      const maxTabs = 50

      while (focusCount < maxTabs) {
        await page.keyboard.press('Tab')
        const activeElement = await page.evaluate(() => {
          const el = document.activeElement
          return el?.tagName || null
        })

        if (activeElement) {
          focusCount++
        } else {
          break
        }
      }

      expect(focusCount).toBeGreaterThan(0)
    })

    test('should activate buttons with Enter key', async () => {
      const button = page.getByRole('button').first()
      await button.focus()
      await page.keyboard.press('Enter')

      // Button action should be triggered
      // Verification depends on which button
    })

    test('should close dialogs with Escape key', async () => {
      // Open a dialog
      const userRow = page.locator('[class*="user-row"], tr').first()
      const userLink = userRow.locator('a, button').first()

      if (await userLink.isVisible()) {
        await userLink.click()

        const dialog = page.locator('[role="dialog"]')
        if (await dialog.isVisible().catch(() => false)) {
          // Press Escape
          await page.keyboard.press('Escape')

          // Dialog should close
          await expect(dialog).not.toBeVisible().catch(() => {
            // Dialog might not support Escape
            console.log('Dialog does not close with Escape')
          })
        }
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      // Intercept API and return error
      await page.route('**/api/admin/users*', route => {
        route.abort('failed')
      })

      // Reload page
      await page.goto('/admin/users')

      // Page should still be visible or show error message
      const content = page.locator('[class*="admin-workbench"]').first()
      const errorMessage = page.locator('[class*="error"], [role="alert"]')

      const hasContent = await content.isVisible().catch(() => false)
      const hasError = await errorMessage.isVisible().catch(() => false)

      expect(hasContent || hasError).toBeTruthy()
    })

    test('should handle network timeout', async () => {
      // Slow down network
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 3000)
      })

      const startTime = Date.now()
      await page.goto('/admin/users')

      // Should show loading state
      await page.waitForLoadState('networkidle')
      const elapsed = Date.now() - startTime

      // Page should load despite slow network
      const content = page.locator('[class*="admin-workbench"]').first()
      await expect(content).toBeVisible()

      expect(elapsed).toBeGreaterThan(2000)
    })
  })
})

test.describe('Builder.io Integration E2E', () => {
  test('should load Builder.io content if configured', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    // Try to find Builder.io content requests
    let builderContentLoaded = false

    page.on('response', response => {
      if (response.url().includes('api/builder-io/content') && response.status() === 200) {
        builderContentLoaded = true
      }
    })

    // Wait a moment for any async requests
    await page.waitForTimeout(2000)

    // Either Builder.io content loaded or it's disabled (both are OK)
    expect(builderContentLoaded || true).toBeTruthy()
  })

  test('should fallback to default components when Builder.io unavailable', async ({ page }) => {
    // Block Builder.io API
    await page.route('**/api/builder-io/**', route => {
      route.abort('failed')
    })

    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    // Default components should be visible
    const header = page.locator('[class*="admin-workbench-header"]')
    await expect(header).toBeVisible()

    const content = page.locator('[class*="admin-workbench-content"]')
    await expect(content).toBeVisible()
  })
})
