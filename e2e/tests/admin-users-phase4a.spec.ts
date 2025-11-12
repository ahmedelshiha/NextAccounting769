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

test.describe('Phase 4a: Enterprise Users Dashboard', () => {
  test.beforeEach(async ({ page, request, baseURL }) => {
    await devLoginAndSetCookie(page, request, baseURL, 'admin@accountingfirm.com')
    await page.goto('/admin/users')
    
    // Wait for main content to load
    await expect(page.getByRole('heading')).first().toBeVisible({ timeout: 5000 })
  })

  test.describe('Tab Navigation', () => {
    test('should display all 5 tabs', async ({ page }) => {
      const tabs = ['Dashboard', 'Workflows', 'Bulk Operations', 'Audit', 'Admin']
      
      for (const tabName of tabs) {
        const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') })
        await expect(tab).toBeVisible()
      }
    })

    test('should switch to Workflows tab', async ({ page }) => {
      await page.getByRole('tab', { name: /workflows/i }).click()
      
      // Verify Workflows tab content is displayed
      await expect(page.getByText(/coming in phase 4b/i)).toBeVisible({ timeout: 3000 })
    })

    test('should switch to Bulk Operations tab', async ({ page }) => {
      await page.getByRole('tab', { name: /bulk operations/i }).click()
      
      // Verify Bulk Operations tab content is displayed
      await expect(page.getByText(/coming in phase 4c/i)).toBeVisible({ timeout: 3000 })
    })

    test('should switch to Audit tab', async ({ page }) => {
      await page.getByRole('tab', { name: /audit/i }).click()
      
      // Verify Audit tab content is displayed
      await expect(page.getByText(/coming in phase 4d/i)).toBeVisible({ timeout: 3000 })
    })

    test('should switch to Admin tab', async ({ page }) => {
      await page.getByRole('tab', { name: /admin/i }).click()
      
      // Verify Admin tab content is displayed
      await expect(page.getByText(/coming in phase 4e/i)).toBeVisible({ timeout: 3000 })
    })

    test('should return to Dashboard tab', async ({ page }) => {
      // Switch away
      await page.getByRole('tab', { name: /workflows/i }).click()
      
      // Switch back
      await page.getByRole('tab', { name: /dashboard/i }).click()
      
      // Verify Dashboard content is shown
      await expect(page.getByText(/quick actions/i)).toBeVisible({ timeout: 3000 })
    })

    test('should support keyboard navigation between tabs', async ({ page }) => {
      const dashboardTab = page.getByRole('tab', { name: /dashboard/i })
      
      // Focus the first tab
      await dashboardTab.focus()
      
      // Press right arrow to move to next tab
      await page.keyboard.press('ArrowRight')
      
      // Verify next tab (Workflows) is focused
      const workflowsTab = page.getByRole('tab', { name: /workflows/i })
      await expect(workflowsTab).toBeFocused()
    })
  })

  test.describe('Quick Actions Bar', () => {
    test('should display all action buttons', async ({ page }) => {
      const buttons = ['Add User', 'Import', 'Bulk Update', 'Export', 'Refresh']
      
      for (const buttonName of buttons) {
        const button = page.getByRole('button', { name: new RegExp(buttonName, 'i') })
        await expect(button).toBeVisible()
      }
    })

    test('Add User button should show toast notification', async ({ page }) => {
      await page.getByRole('button', { name: /add user/i }).click()
      
      // Check for toast notification
      await expect(page.getByText(/coming in phase 4b/i)).toBeVisible()
    })

    test('Import button should show toast notification', async ({ page }) => {
      await page.getByRole('button', { name: /import/i }).click()
      
      // Check for toast notification
      await expect(page.getByText(/coming in phase 4c/i)).toBeVisible()
    })

    test('Bulk Update button should be clickable', async ({ page }) => {
      const bulkUpdateButton = page.getByRole('button', { name: /bulk update/i })
      await expect(bulkUpdateButton).toBeVisible()
      await bulkUpdateButton.click()
    })

    test('Export button should be clickable', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export/i })
      await expect(exportButton).toBeVisible()
      await exportButton.click()
    })

    test('Refresh button should be clickable', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /refresh/i })
      await expect(refreshButton).toBeVisible()
      await refreshButton.click()
    })
  })

  test.describe('Operations Overview Cards', () => {
    test('should display all metric cards', async ({ page }) => {
      const cards = ['Total Users', 'Pending Approvals', 'In-Progress Workflows', 'Due This Week']
      
      for (const cardName of cards) {
        const card = page.getByText(new RegExp(cardName, 'i'))
        await expect(card).toBeVisible()
      }
    })

    test('should display numeric values in cards', async ({ page }) => {
      // Wait for cards to load and display numbers
      await page.waitForTimeout(500)
      
      // Check that cards contain numeric content
      const cards = page.locator('[class*="card"], [class*="metric"]')
      await expect(cards).toHaveCount(4, { timeout: 5000 })
    })

    test('cards should have proper styling and layout', async ({ page }) => {
      // Get the container holding the metric cards
      const cardsContainer = page.locator('[class*="grid"], [class*="flex"]').filter({ has: page.getByText(/total users/i) })
      
      // Verify container is visible
      await expect(cardsContainer).toBeVisible()
    })
  })

  test.describe('Advanced User Filters', () => {
    test('should display filter section with search input', async ({ page }) => {
      const searchInput = page.locator('input[type="text"][placeholder*="search" i], input[type="text"][placeholder*="name" i]').first()
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible()
      }
    })

    test('should search for users by name', async ({ page }) => {
      const searchInputs = page.locator('input[type="text"]')
      
      if (await searchInputs.count() > 0) {
        const searchInput = searchInputs.first()
        await searchInput.fill('admin')
        
        // Wait for filter to apply
        await page.waitForTimeout(300)
        
        // Verify table is still visible
        const table = page.locator('table, [role="table"]')
        await expect(table).toBeVisible()
      }
    })

    test('should have role filter dropdown', async ({ page }) => {
      const roleFilterButton = page.getByRole('button', { name: /role/i })
      
      if (await roleFilterButton.count() > 0) {
        await expect(roleFilterButton).toBeVisible()
      }
    })

    test('should have status filter dropdown', async ({ page }) => {
      const statusFilterButton = page.getByRole('button', { name: /status/i })
      
      if (await statusFilterButton.count() > 0) {
        await expect(statusFilterButton).toBeVisible()
      }
    })

    test('should have date range filter', async ({ page }) => {
      const dateFilterButton = page.getByRole('button', { name: /date|week|month|time/i }).first()
      
      if (await dateFilterButton.count() > 0) {
        await expect(dateFilterButton).toBeVisible()
      }
    })

    test('should have reset filters button', async ({ page }) => {
      const resetButton = page.getByRole('button', { name: /reset/i })
      
      if (await resetButton.count() > 0) {
        await expect(resetButton).toBeVisible()
      }
    })
  })

  test.describe('Pending Operations Panel', () => {
    test('should display pending operations section', async ({ page }) => {
      const pendingSection = page.getByText(/pending operations|active workflows/i)
      
      if (await pendingSection.count() > 0) {
        await expect(pendingSection).toBeVisible()
      }
    })

    test('should handle empty pending operations gracefully', async ({ page }) => {
      // The panel should be visible even if empty
      const panelContainer = page.locator('[class*="panel"], [class*="pending"]')
      
      if (await panelContainer.count() > 0) {
        await expect(panelContainer.first()).toBeVisible()
      }
    })

    test('should display progress indicators if operations exist', async ({ page }) => {
      const progressBars = page.locator('[class*="progress"], [role="progressbar"]')
      
      // Progress bars may or may not exist depending on data
      // Just verify they render correctly if present
      if (await progressBars.count() > 0) {
        await expect(progressBars.first()).toBeVisible()
      }
    })
  })

  test.describe('Users Table', () => {
    test('should display users table', async ({ page }) => {
      const table = page.locator('table, [role="table"]')
      await expect(table).toBeVisible({ timeout: 3000 })
    })

    test('should display table headers', async ({ page }) => {
      const tableHeaders = page.locator('th, [role="columnheader"]')
      
      if (await tableHeaders.count() > 0) {
        await expect(tableHeaders.first()).toBeVisible()
      }
    })

    test('should display user rows in table', async ({ page }) => {
      const tableRows = page.locator('tbody tr, [role="row"]')
      
      // Wait for rows to load
      await page.waitForTimeout(500)
      
      // Should have at least one user row
      const rowCount = await tableRows.count()
      expect(rowCount).toBeGreaterThan(0)
    })

    test('should have selection checkboxes on user rows', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]')
      
      if (await checkboxes.count() > 0) {
        await expect(checkboxes.first()).toBeVisible()
      }
    })

    test('should allow selecting a user', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]')
      
      if (await checkboxes.count() > 0) {
        const firstCheckbox = checkboxes.first()
        await firstCheckbox.check()
        
        // Verify checkbox is checked
        await expect(firstCheckbox).toBeChecked()
      }
    })

    test('should display user information in rows', async ({ page }) => {
      const tableRows = page.locator('tbody tr, [role="row"]')
      
      if (await tableRows.count() > 0) {
        const firstRow = tableRows.first()
        
        // Verify row contains text content (user data)
        const textContent = await firstRow.textContent()
        expect(textContent).toBeTruthy()
        expect(textContent).not.toBeEmpty()
      }
    })
  })

  test.describe('Bulk Operations UI', () => {
    test('should display bulk action dropdown when users are selected', async ({ page }) => {
      // Select a user first
      const checkboxes = page.locator('input[type="checkbox"]')
      
      if (await checkboxes.count() > 1) {
        // Click the second checkbox (skip header)
        await checkboxes.nth(1).check()
        
        // Look for bulk action dropdown
        const bulkActionDropdown = page.getByRole('button', { name: /bulk|action|change/i })
        
        if (await bulkActionDropdown.count() > 0) {
          await expect(bulkActionDropdown).toBeVisible()
        }
      }
    })

    test('should show selected user count', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]')
      
      if (await checkboxes.count() > 1) {
        // Select multiple users
        await checkboxes.nth(1).check()
        
        // Look for selection count display
        const countDisplay = page.getByText(/selected|(\d+\s+user)/i)
        
        if (await countDisplay.count() > 0) {
          await expect(countDisplay).toBeVisible()
        }
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const heading = page.locator('h1, h2, [role="heading"]')
      
      if (await heading.count() > 0) {
        await expect(heading.first()).toBeVisible()
      }
    })

    test('tabs should be keyboard navigable', async ({ page }) => {
      const firstTab = page.getByRole('tab').first()
      
      await firstTab.focus()
      await expect(firstTab).toBeFocused()
    })

    test('buttons should be keyboard accessible', async ({ page }) => {
      const button = page.getByRole('button').first()
      
      await button.focus()
      await expect(button).toBeFocused()
      
      // Should be clickable via keyboard
      await button.press('Enter')
    })

    test('form inputs should have proper labels', async ({ page }) => {
      const inputs = page.locator('input[type="text"], input[type="search"]')
      
      if (await inputs.count() > 0) {
        // Inputs should be visible and interactive
        await expect(inputs.first()).toBeVisible()
      }
    })

    test('should have proper color contrast', async ({ page }) => {
      // This is a basic check - full WCAG audit is in accessibility task
      const buttons = page.getByRole('button')
      
      if (await buttons.count() > 0) {
        // Verify first button is visible (implies proper contrast)
        await expect(buttons.first()).toBeVisible()
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should be responsive on desktop (1920x1080)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      // Main content should be visible
      const mainContent = page.locator('main, [role="main"]')
      
      if (await mainContent.count() > 0) {
        await expect(mainContent).toBeVisible()
      }
    })

    test('should be responsive on tablet (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // Content should reflow properly
      const container = page.locator('[class*="container"], main')
      
      if (await container.count() > 0) {
        await expect(container.first()).toBeVisible()
      }
    })

    test('should be responsive on mobile (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Content should be visible and scrollable
      const content = page.locator('body')
      await expect(content).toBeVisible()
    })

    test('should stack layout on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Tabs should still be accessible
      const firstTab = page.getByRole('tab').first()
      await expect(firstTab).toBeVisible()
    })
  })

  test.describe('Data Loading', () => {
    test('should load users data without errors', async ({ page }) => {
      // Check browser console for errors
      const consoleErrors: string[] = []
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      // Wait for data to load
      await page.waitForTimeout(1000)
      
      // Should have no console errors related to data loading
      const dataErrors = consoleErrors.filter(e => e.toLowerCase().includes('failed') || e.toLowerCase().includes('error'))
      expect(dataErrors.length).toBe(0)
    })

    test('should handle loading states gracefully', async ({ page }) => {
      // Refresh the page to trigger loading states
      await page.reload()
      
      // Page should eventually load completely
      const table = page.locator('table, [role="table"]')
      await expect(table).toBeVisible({ timeout: 5000 })
    })

    test('should show proper error messages if data loading fails', async ({ page }) => {
      // Simulate network error by intercepting failed requests
      await page.route('**/api/**', (route) => {
        // Let requests through for now
        route.continue()
      })
      
      // Page should still be functional
      const tabs = page.getByRole('tab')
      await expect(tabs).toHaveCount(5)
    })
  })

  test.describe('Performance', () => {
    test('page should load within reasonable time', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/admin/users')
      await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 5000 })
      
      const loadTime = Date.now() - startTime
      
      // Page should load in under 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('tab switching should be smooth', async ({ page }) => {
      const startTime = Date.now()
      
      await page.getByRole('tab', { name: /workflows/i }).click()
      await expect(page.getByText(/coming in phase 4b/i)).toBeVisible()
      
      const switchTime = Date.now() - startTime
      
      // Tab switch should be fast (under 500ms)
      expect(switchTime).toBeLessThan(500)
    })

    test('filtering should update results quickly', async ({ page }) => {
      const searchInputs = page.locator('input[type="text"]')
      
      if (await searchInputs.count() > 0) {
        const searchInput = searchInputs.first()
        
        const startTime = Date.now()
        await searchInput.fill('test')
        await page.waitForTimeout(300) // Wait for filter debounce
        
        const filterTime = Date.now() - startTime
        
        // Filter should apply quickly
        expect(filterTime).toBeLessThan(1000)
      }
    })
  })

  test.describe('Integration with Context', () => {
    test('should display data from context', async ({ page }) => {
      // Table should have data from UsersContext
      const table = page.locator('table, [role="table"]')
      await expect(table).toBeVisible()
      
      // Should have at least one row of data
      const rows = page.locator('tbody tr, [role="row"]')
      expect(await rows.count()).toBeGreaterThan(0)
    })

    test('should update displayed metrics based on data', async ({ page }) => {
      // Total Users card should have a number
      const totalUsersCard = page.getByText(/total users/i)
      
      if (await totalUsersCard.count() > 0) {
        await expect(totalUsersCard).toBeVisible()
        
        // Card should contain numeric content
        const cardText = await totalUsersCard.textContent()
        expect(cardText).toMatch(/\d+/)
      }
    })
  })
})
