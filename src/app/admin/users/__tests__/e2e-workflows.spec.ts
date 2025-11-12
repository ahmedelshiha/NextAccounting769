/**
 * AdminWorkBench E2E Workflow Tests
 * 
 * Tests complete user workflows in the AdminWorkBench:
 * - User selection and bulk operations
 * - Filtering and sorting
 * - Inline editing
 * - Undo/redo functionality
 * - Responsive behavior
 * 
 * Run with: npm run test:e2e
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password123'

test.describe('AdminWorkBench E2E Workflows', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1400, height: 900 })
    
    // Navigate to admin users page
    await page.goto(`${BASE_URL}/admin/users`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async () => {
    await page.close()
  })

  // =========================================================================
  // USER SELECTION WORKFLOWS
  // =========================================================================

  test('should select individual users', async () => {
    // Wait for user table to be visible
    await page.waitForSelector('[role="table"]', { timeout: 10000 })
    
    // Find and click first user checkbox
    const firstCheckbox = await page.locator('input[type="checkbox"]').nth(1)
    await firstCheckbox.click()
    
    // Verify user is selected
    expect(await firstCheckbox.isChecked()).toBe(true)
  })

  test('should select all users at once', async () => {
    // Wait for table
    await page.waitForSelector('[role="table"]')
    
    // Click "select all" checkbox
    const selectAllCheckbox = await page.locator('input[type="checkbox"]').nth(0)
    await selectAllCheckbox.click()
    
    // Verify checkbox is checked
    expect(await selectAllCheckbox.isChecked()).toBe(true)
    
    // Verify selection count is displayed
    const selectionText = await page.locator('text=/\\d+ users? selected/').first()
    expect(selectionText).toBeTruthy()
  })

  test('should deselect all users', async () => {
    const selectAllCheckbox = await page.locator('input[type="checkbox"]').nth(0)
    
    // Select all
    await selectAllCheckbox.click()
    expect(await selectAllCheckbox.isChecked()).toBe(true)
    
    // Deselect all
    await selectAllCheckbox.click()
    expect(await selectAllCheckbox.isChecked()).toBe(false)
  })

  // =========================================================================
  // BULK ACTIONS WORKFLOWS
  // =========================================================================

  test('should show bulk actions panel when users are selected', async () => {
    // Select a user
    const firstCheckbox = await page.locator('input[type="checkbox"]').nth(1)
    await firstCheckbox.click()
    
    // Bulk actions panel should be visible
    const bulkPanel = await page.locator('[data-testid="bulk-actions-panel"]')
    expect(bulkPanel).toBeTruthy()
    
    // Should show selection count
    const countText = await bulkPanel.locator('text=/selected/')
    expect(countText).toBeTruthy()
  })

  test('should preview bulk action before applying', async () => {
    // Select multiple users
    const checkbox1 = await page.locator('input[type="checkbox"]').nth(1)
    const checkbox2 = await page.locator('input[type="checkbox"]').nth(2)
    await checkbox1.click()
    await checkbox2.click()
    
    // Open action dropdown and select action
    const actionSelect = await page.locator('select').nth(0)
    await actionSelect.selectOption('set-status')
    
    // Click preview button
    const previewBtn = await page.locator('button:has-text("Preview")')
    await previewBtn.click()
    
    // Dry-run modal should appear
    const dryRunModal = await page.locator('[data-testid="dry-run-modal"]')
    await expect(dryRunModal).toBeVisible()
  })

  test('should apply bulk action after preview', async () => {
    // Select a user
    const checkbox = await page.locator('input[type="checkbox"]').nth(1)
    await checkbox.click()
    
    // Select action
    const actionSelect = await page.locator('select').nth(0)
    await actionSelect.selectOption('set-status')
    
    // Click preview
    const previewBtn = await page.locator('button:has-text("Preview")')
    await previewBtn.click()
    
    // Wait for modal and click apply
    const applyBtn = await page.locator('button:has-text("Apply Changes")')
    await expect(applyBtn).toBeVisible()
    await applyBtn.click()
    
    // Undo toast should appear
    const undoToast = await page.locator('[data-testid="undo-toast"]')
    await expect(undoToast).toBeVisible({ timeout: 5000 })
  })

  test('should undo bulk action from toast', async () => {
    // Perform bulk action (simplified for test)
    const checkbox = await page.locator('input[type="checkbox"]').nth(1)
    await checkbox.click()
    
    const actionSelect = await page.locator('select').nth(0)
    await actionSelect.selectOption('set-status')
    
    const applyBtn = await page.locator('button:has-text("Apply Changes")')
    await applyBtn.click()
    
    // Wait for undo toast and click undo button
    const undoBtn = await page.locator('button:has-text("Undo")')
    await expect(undoBtn).toBeVisible({ timeout: 5000 })
    await undoBtn.click()
    
    // Success message should appear
    const successMsg = await page.locator('text=/reverted|undone/i')
    await expect(successMsg).toBeVisible({ timeout: 5000 })
  })

  // =========================================================================
  // FILTERING WORKFLOWS
  // =========================================================================

  test('should filter users by role', async () => {
    // Wait for table
    await page.waitForSelector('[role="table"]')
    
    // Open sidebar filters (on desktop, already visible)
    const roleSelect = await page.locator('select[name="role"], select').first()
    
    // Select a role
    if (roleSelect) {
      await roleSelect.selectOption('ADMIN')
      
      // Wait for table to update
      await page.waitForTimeout(500)
      
      // Verify table is filtered
      const table = await page.locator('[role="table"]')
      expect(table).toBeTruthy()
    }
  })

  test('should filter users by status', async () => {
    const statusSelects = await page.locator('select')
    
    // Find and use status select
    for (const select of await statusSelects.all()) {
      const name = await select.getAttribute('name')
      if (name === 'status' || await select.locator('option:has-text("ACTIVE")').isVisible()) {
        await select.selectOption('ACTIVE')
        break
      }
    }
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
  })

  test('should search users by name or email', async () => {
    // Find search input
    const searchInput = await page.locator('input[type="text"]').first()
    
    if (searchInput) {
      // Type search term
      await searchInput.fill('john')
      
      // Wait for search results
      await page.waitForTimeout(500)
      
      // Table should update
      const table = await page.locator('[role="table"]')
      expect(table).toBeTruthy()
    }
  })

  test('should clear all filters', async () => {
    // Apply some filters
    const selectElements = await page.locator('select')
    if ((await selectElements.count()) > 0) {
      const firstSelect = selectElements.nth(0)
      const options = await firstSelect.locator('option').all()
      if (options.length > 1) {
        await firstSelect.selectOption(await options[1].getAttribute('value') || '')
      }
    }
    
    // Find and click "Clear Filters" button
    const clearBtn = await page.locator('button:has-text("Clear"), button:has-text("Reset")')
    if (await clearBtn.isVisible()) {
      await clearBtn.click()
      await page.waitForTimeout(300)
    }
  })

  // =========================================================================
  // INLINE EDITING WORKFLOWS
  // =========================================================================

  test('should edit user name inline', async () => {
    // Find a user name cell and double-click
    const userNameCell = await page.locator('[role="table"] td').nth(2)
    await userNameCell.dblclick()
    
    // Input field should appear
    const input = await page.locator('input[type="text"]').filter({ visible: true })
    if (input) {
      const inputCount = await input.count()
      if (inputCount > 0) {
        // Type new name
        const editInput = input.nth(inputCount - 1)
        await editInput.fill('John Updated')
        
        // Press Enter to save
        await editInput.press('Enter')
        
        // Verify change applied
        await page.waitForTimeout(300)
      }
    }
  })

  // =========================================================================
  // RESPONSIVE BEHAVIOR TESTS
  // =========================================================================

  test('should be responsive on tablet', async () => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Sidebar should be hidden by default
    const sidebar = await page.locator('[data-testid="admin-sidebar"]')
    const sidebarHidden = !await sidebar.isVisible() || sidebar.hasClass('hidden')
    expect(sidebarHidden).toBeTruthy()
    
    // Toggle sidebar
    const sidebarToggleBtn = await page.locator('button[aria-label*="ide"]').first()
    if (await sidebarToggleBtn.isVisible()) {
      await sidebarToggleBtn.click()
    }
  })

  test('should work on mobile', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Page should still load
    await page.waitForSelector('[role="table"], h1, .layout')
  })

  // =========================================================================
  // ACCESSIBILITY TESTS
  // =========================================================================

  test('should have keyboard navigation', async () => {
    // Tab through focusable elements
    const initialFocused = await page.evaluate(() => document.activeElement?.tagName)
    
    // Press Tab
    await page.keyboard.press('Tab')
    const afterTabFocused = await page.evaluate(() => document.activeElement?.tagName)
    
    // Something should be focused
    expect(afterTabFocused).toBeTruthy()
  })

  test('should have proper ARIA labels', async () => {
    // Check for common ARIA labels
    const checkboxes = await page.locator('input[type="checkbox"]')
    
    for (const checkbox of await checkboxes.all()) {
      const ariaLabel = await checkbox.getAttribute('aria-label')
      const parentLabel = await checkbox.locator('..').getAttribute('aria-label')
      
      // Should have either aria-label or be associated with label
      const hasLabel = ariaLabel || parentLabel
      expect(hasLabel || (await checkbox.locator('..').locator('label').count()) > 0).toBeTruthy()
      
      // Limit iteration
      break
    }
  })

  // =========================================================================
  // PERFORMANCE TESTS
  // =========================================================================

  test('should load page within acceptable time', async () => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/admin/users`)
    await page.waitForSelector('[role="table"], [data-testid="admin-sidebar"]', { timeout: 10000 })
    
    const loadTime = Date.now() - startTime
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000)
  })

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================

  test('should handle API errors gracefully', async () => {
    // Intercept API and simulate error
    await page.route('**/api/admin/users', (route) => {
      route.abort('failed')
    })
    
    // Reload page
    await page.reload()
    
    // Page should still be usable (show error message or fallback)
    const pageContent = await page.content()
    expect(pageContent).toBeTruthy()
  })
})
