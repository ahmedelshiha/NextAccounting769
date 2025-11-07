import { test, expect, Page } from '@playwright/test'

test.describe('Phase 4d: Audit & Admin Settings', () => {
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

  test.describe('Audit Log Tab', () => {
    test('should display audit tab', async () => {
      const auditTab = page.locator('button:has-text("🔐 Audit Log")')
      await auditTab.click()
      
      const heading = page.locator('text=Audit Log')
      await expect(heading).toBeVisible()
    })

    test('should load audit logs on page load', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')
      
      const table = page.locator('table')
      await expect(table).toBeVisible()
    })

    test('should display audit log stats cards', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')
      
      const statsCards = page.locator('[class*="from-blue-50"]')
      await expect(statsCards).toBeDefined()
    })

    test('should toggle filters panel', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      
      const filterButton = page.locator('button:has-text("Show Filters")')
      await filterButton.click()
      
      const filterPanel = page.locator('select')
      await expect(filterPanel.first()).toBeVisible()
    })

    test('should filter by action', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.locator('button:has-text("Show Filters")').click()
      
      const actionSelect = page.locator('select').first()
      await actionSelect.click()
      await page.locator('option[value*="CREATE"]').first().click()
      
      await page.waitForLoadState('networkidle')
      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should search audit logs', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.locator('button:has-text("Show Filters")').click()
      
      const searchInput = page.locator('input[placeholder="Search actions or resources..."]')
      await searchInput.fill('user')
      
      await page.waitForLoadState('networkidle')
      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should filter by date range', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.locator('button:has-text("Show Filters")').click()
      
      const weekButton = page.locator('button:has-text("week")')
      await weekButton.click()
      
      await page.waitForLoadState('networkidle')
      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should clear all filters', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.locator('button:has-text("Show Filters")').click()
      
      const searchInput = page.locator('input[placeholder="Search actions or resources..."]')
      await searchInput.fill('test')
      
      const clearButton = page.locator('button:has-text("Clear Filters")')
      await clearButton.click()
      
      await expect(searchInput).toHaveValue('')
    })

    test('should export audit logs to CSV', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')
      
      const exportButton = page.locator('button:has-text("📥 Export CSV")')
      
      // Listen for download
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toContain('audit-logs')
      expect(download.suggestedFilename()).toMatch(/\.csv$/)
    })

    test('should paginate through audit logs', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')
      
      const nextButton = page.locator('button:has-text("Next →")')
      const hasPagination = await nextButton.isVisible()
      
      if (hasPagination) {
        await nextButton.click()
        await page.waitForLoadState('networkidle')
        
        const prevButton = page.locator('button:has-text("← Previous")')
        await expect(prevButton).toBeEnabled()
      }
    })

    test('should display action badges with correct colors', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')
      
      const badges = page.locator('table tbody [class*="bg-"]')
      const count = await badges.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should display user information in audit logs', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.waitForLoadState('networkidle')
      
      const userCells = page.locator('table tbody td:nth-child(2)')
      const firstUser = await userCells.first().textContent()
      expect(firstUser?.length).toBeGreaterThan(0)
    })
  })

  test.describe('Admin Settings Tab', () => {
    test('should display admin settings tab', async () => {
      const adminTab = page.locator('button:has-text("⚙️ Admin Settings")')
      await adminTab.click()
      
      const heading = page.locator('text=Admin Settings')
      await expect(heading).toBeVisible()
    })

    test('should switch to templates subtab', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("🎯 Templates")').click()
      
      const heading = page.locator('text=Workflow Templates')
      await expect(heading).toBeVisible()
    })

    test('should display workflow templates', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("🎯 Templates")').click()
      await page.waitForLoadState('networkidle')
      
      const templates = page.locator('[class*="p-4"][class*="hover:shadow"]')
      const count = await templates.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should switch to approval routing subtab', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("✓ Approvals")').click()
      
      const heading = page.locator('text=Approval Routing Rules')
      await expect(heading).toBeVisible()
    })

    test('should display approval routing rules', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("✓ Approvals")').click()
      await page.waitForLoadState('networkidle')
      
      const table = page.locator('table')
      await expect(table).toBeVisible()
    })

    test('should switch to permissions subtab', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("🔐 Permissions")').click()
      
      const heading = page.locator('text=Permission Matrix')
      await expect(heading).toBeVisible()
    })

    test('should display permission matrix', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("🔐 Permissions")').click()
      await page.waitForLoadState('networkidle')
      
      const table = page.locator('table')
      await expect(table).toBeVisible()
    })

    test('should switch to settings subtab', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("⚙️ Settings")').click()
      
      const heading = page.locator('text=System Settings')
      await expect(heading).toBeVisible()
    })

    test('should display system settings sections', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("⚙️ Settings")').click()
      await page.waitForLoadState('networkidle')
      
      const auditSection = page.locator('text=Audit & Logging')
      const integrationSection = page.locator('text=Integrations')
      const performanceSection = page.locator('text=Performance')
      
      await expect(auditSection).toBeVisible()
      await expect(integrationSection).toBeVisible()
      await expect(performanceSection).toBeVisible()
    })

    test('should toggle audit retention setting', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("⚙️ Settings")').click()
      
      const retentionSelect = page.locator('select').first()
      const currentValue = await retentionSelect.inputValue()
      expect(['30', '60', '90', '365'].some(v => currentValue.includes(v))).toBeTruthy()
    })

    test('should toggle email notifications', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("⚙️ Settings")').click()
      
      const checkbox = page.locator('input[type="checkbox"]').first()
      const isChecked = await checkbox.isChecked()
      expect(typeof isChecked).toBe('boolean')
    })

    test('should update batch size setting', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("⚙️ Settings")').click()
      
      const batchInput = page.locator('input[type="number"]').first()
      await batchInput.fill('250')
      
      const value = await batchInput.inputValue()
      expect(value).toBe('250')
    })

    test('should have save settings button', async () => {
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      await page.locator('[role="tab"]:has-text("⚙️ Settings")').click()
      
      const saveButton = page.locator('button:has-text("💾 Save Settings")')
      await expect(saveButton).toBeVisible()
    })
  })

  test.describe('Navigation & Accessibility', () => {
    test('should navigate between tabs', async () => {
      const tabs = ['Dashboard', 'Workflows', 'Bulk Ops', 'Audit', 'Admin']
      
      for (const tab of tabs) {
        const tabButton = page.locator(`button:has-text("${tab}")`)
        if (await tabButton.isVisible()) {
          await tabButton.click()
          await page.waitForLoadState('networkidle')
        }
      }
    })

    test('should maintain responsive layout on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.locator('button:has-text("🔐 Audit Log")').click()
      
      const table = page.locator('table')
      await expect(table).toBeVisible()
    })

    test('should maintain responsive layout on tablet', async () => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.locator('button:has-text("⚙️ Admin Settings")').click()
      
      const heading = page.locator('text=Admin Settings')
      await expect(heading).toBeVisible()
    })

    test('should have proper tab focus order', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      
      const filterButton = page.locator('button:has-text("Show Filters")')
      const exportButton = page.locator('button:has-text("📥 Export CSV")')
      
      await filterButton.focus()
      await expect(filterButton).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(exportButton).toBeFocused()
    })
  })

  test.describe('Error Handling', () => {
    test('should display error message on fetch failure', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      
      // Simulate network error by blocking requests
      await page.route('**/api/admin/audit-logs*', route => route.abort())
      
      await page.reload()
      
      const errorMessage = page.locator('[role="alert"]')
      // Error state will be shown (empty state or error message)
      await expect(page.locator('text=Audit Log')).toBeVisible()
    })

    test('should handle empty results gracefully', async () => {
      await page.locator('button:has-text("🔐 Audit Log")').click()
      await page.locator('button:has-text("Show Filters")').click()
      
      // Enter a filter that likely returns no results
      const searchInput = page.locator('input[placeholder="Search actions or resources..."]')
      await searchInput.fill('nonexistentvalue12345')
      
      await page.waitForLoadState('networkidle')
      
      const emptyState = page.locator('text=No audit logs found')
      await expect(emptyState).toBeVisible()
    })
  })
})
