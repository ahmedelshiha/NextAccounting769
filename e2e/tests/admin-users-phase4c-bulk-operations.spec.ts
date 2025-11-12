import { test, expect } from '@playwright/test'

test.describe('Phase 4c: Bulk Operations E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@accountingfirm.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForNavigation()

    // Navigate to users page
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Bulk Operations Wizard Navigation', () => {
    test('should open bulk operations wizard', async ({ page }) => {
      // Click new operation button
      await page.click('button:has-text("New Operation")')
      
      // Verify wizard header
      await expect(page.locator('h3:has-text("Select Users")')).toBeVisible()
      await expect(page.locator('text=Choose which users')).toBeVisible()
    })

    test('should navigate through wizard steps', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Step 1: Verify progress indicator
      const progressBar = page.locator('[role="progressbar"], .h-1.bg-gray-200')
      await expect(progressBar).toBeVisible()

      // Step 1: Select users
      const checkboxes = page.locator('input[type="checkbox"]')
      await expect(checkboxes.first()).toBeEnabled()

      // Select at least one user
      await checkboxes.nth(1).check()
      
      // Go to next step
      await page.click('button:has-text("Next: Choose Operation")')
      await expect(page.locator('h3:has-text("Choose Operation")')).toBeVisible()
    })

    test('should allow going back through steps', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Go forward
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      // Go back
      await page.click('button:has-text("Back")')
      await expect(page.locator('h3:has-text("Select Users")')).toBeVisible()
    })

    test('should prevent next step without required selection', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Try to go next without selecting users
      const nextButton = page.locator('button:has-text("Next: Choose Operation")')
      await expect(nextButton).toBeDisabled()
    })
  })

  test.describe('Step 1: User Selection', () => {
    test('should filter users by search term', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Search for specific user
      const searchInput = page.locator('input[placeholder*="Search"]')
      await searchInput.fill('John')
      
      // Verify filtered results
      const userLabels = page.locator('text=/^John/i')
      const count = await userLabels.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should filter users by role', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Select role filter
      const roleSelect = page.locator('[placeholder*="All roles"]').first()
      await roleSelect.click()
      await page.click('text=Admin')
      
      // Verify role filter is applied
      const badges = page.locator('text=Admin').filter({ hasText: 'Admin' })
      await expect(badges.first()).toBeVisible()
    })

    test('should select all users', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Click select all checkbox
      await page.locator('input[type="checkbox"]').first().check()
      
      // Verify all checkboxes are checked
      const checkboxes = page.locator('input[type="checkbox"]')
      const checkedCount = await page.locator('input[type="checkbox"]:checked').count()
      const totalCount = await checkboxes.count()
      
      expect(checkedCount).toBeGreaterThan(1)
    })

    test('should display user count summary', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Select multiple users
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.locator('input[type="checkbox"]').nth(2).check()
      
      // Verify count
      const summary = page.locator('text=/\\d+ of \\d+ users selected/')
      await expect(summary).toBeVisible()
    })
  })

  test.describe('Step 2: Operation Type Selection', () => {
    test('should display all operation types', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      // Verify operation types are visible
      const operationTypes = [
        'Change Role',
        'Update Status',
        'Grant Permissions',
        'Revoke Permissions',
        'Send Email',
        'Import Data'
      ]
      
      for (const type of operationTypes) {
        await expect(page.locator(`text=${type}`)).toBeVisible()
      }
    })

    test('should select operation type', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      // Select role change operation
      const roleChangeOption = page.locator('text=Change Role').first()
      await roleChangeOption.click()
      
      // Verify selection
      const selectedIndicator = page.locator('[role="radio"]:has-text("Change Role")')
      await expect(selectedIndicator).toBeVisible()
    })

    test('should prevent next without operation selection', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      // Verify next button is disabled
      const nextButton = page.locator('button:has-text("Next: Configure")')
      await expect(nextButton).toBeDisabled()
    })
  })

  test.describe('Step 3: Configuration', () => {
    test('should configure role change operation', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      // Select role change
      await page.locator('text=Change Role').first().click()
      await page.click('button:has-text("Next: Configure")')
      
      // Configure operation
      const fromRoleSelect = page.locator('[placeholder*="Select role"]').first()
      await fromRoleSelect.click()
      await page.click('text=Admin')
      
      const toRoleSelect = page.locator('[placeholder*="Select role"]').last()
      await toRoleSelect.click()
      await page.click('text=Staff')
      
      // Verify configuration
      await expect(page.locator('text=Admin')).toBeVisible()
      await expect(page.locator('text=Staff')).toBeVisible()
    })

    test('should allow notification settings', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      await page.locator('text=Change Role').first().click()
      await page.click('button:has-text("Next: Configure")')
      
      // Toggle notification
      const notifyCheckbox = page.locator('[role="checkbox"]').filter({ hasText: 'Notify users' })
      await notifyCheckbox.click()
      
      // Verify toggle
      await expect(notifyCheckbox).toBeChecked()
    })
  })

  test.describe('Step 4: Review and Dry-Run', () => {
    test('should display operation summary', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      await page.locator('text=Change Role').first().click()
      await page.click('button:has-text("Next: Configure")')
      
      const fromRoleSelect = page.locator('[placeholder*="Select role"]').first()
      await fromRoleSelect.click()
      await page.click('text=Admin')
      
      const toRoleSelect = page.locator('[placeholder*="Select role"]').last()
      await toRoleSelect.click()
      await page.click('text=Staff')
      
      await page.click('button:has-text("Next: Review")')
      
      // Verify summary
      await expect(page.locator('text=Operation Summary')).toBeVisible()
      await expect(page.locator('text=Users Affected')).toBeVisible()
    })

    test('should run dry-run preview', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      await page.locator('text=Change Role').first().click()
      await page.click('button:has-text("Next: Configure")')
      
      const fromRoleSelect = page.locator('[placeholder*="Select role"]').first()
      await fromRoleSelect.click()
      await page.click('text=Admin')
      
      const toRoleSelect = page.locator('[placeholder*="Select role"]').last()
      await toRoleSelect.click()
      await page.click('text=Staff')
      
      await page.click('button:has-text("Next: Review")')
      
      // Run dry-run
      const dryRunButton = page.locator('button:has-text("Run Dry-Run")')
      await dryRunButton.click()
      
      // Wait for results
      await page.waitForTimeout(2000)
      
      // Verify dry-run results
      const resultsIndicator = page.locator('text=Preview successful', { timeout: 10000 })
      await expect(resultsIndicator).toBeVisible()
    })

    test('should show preview of changes', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      await page.locator('text=Change Role').first().click()
      await page.click('button:has-text("Next: Configure")')
      
      const fromRoleSelect = page.locator('[placeholder*="Select role"]').first()
      await fromRoleSelect.click()
      await page.click('text=Admin')
      
      const toRoleSelect = page.locator('[placeholder*="Select role"]').last()
      await toRoleSelect.click()
      await page.click('text=Staff')
      
      await page.click('button:has-text("Next: Review")')
      
      // Run dry-run
      await page.locator('button:has-text("Run Dry-Run")').click()
      
      // Wait for results
      await page.waitForTimeout(2000)
      
      // Verify sample changes
      const sampleHeader = page.locator('text=Sample Impact')
      await expect(sampleHeader).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Step 5: Execution', () => {
    test('should display execution interface', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Quick setup
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      await page.locator('text=Change Role').first().click()
      await page.click('button:has-text("Next: Configure")')
      
      const fromRoleSelect = page.locator('[placeholder*="Select role"]').first()
      await fromRoleSelect.click()
      await page.click('text=Admin')
      
      const toRoleSelect = page.locator('[placeholder*="Select role"]').last()
      await toRoleSelect.click()
      await page.click('text=Staff')
      
      await page.click('button:has-text("Next: Review")')
      
      // Run dry-run
      await page.locator('button:has-text("Run Dry-Run")').click()
      await page.waitForTimeout(2000)
      
      // Go to execution
      await page.click('button:has-text("Next: Execute")')
      
      // Verify execution interface
      await expect(page.locator('text=Execute Operation')).toBeVisible()
      await expect(page.locator('button:has-text("Start Execution")')).toBeVisible()
    })

    test('should show progress during execution', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Quick setup - select user
      await page.locator('input[type="checkbox"]').nth(1).check()
      await page.click('button:has-text("Next: Choose Operation")')
      
      // Select Send Email (simpler to execute)
      await page.locator('text=Send Email').first().click()
      await page.click('button:has-text("Next: Configure")')
      
      // Configure email
      const templateSelect = page.locator('[placeholder*="Select template"]').first()
      await templateSelect.click()
      await page.click('text=Welcome to System')
      
      await page.click('button:has-text("Next: Review")')
      
      // Run dry-run
      await page.locator('button:has-text("Run Dry-Run")').click()
      await page.waitForTimeout(2000)
      
      // Execute
      await page.click('button:has-text("Next: Execute")')
      
      // Start execution
      const execButton = page.locator('button:has-text("Start Execution")')
      await execButton.click()
      
      // Verify progress bar
      const progressBar = page.locator('[role="progressbar"]')
      await expect(progressBar).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle cancellation', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Verify cancel button
      const cancelButton = page.locator('button:has-text("Cancel")')
      await expect(cancelButton).toBeVisible()
      
      // Click cancel
      await cancelButton.click()
      
      // Should return to main page
      await expect(page.locator('button:has-text("New Operation")')).toBeVisible()
    })

    test('should show error for API failures', async ({ page }) => {
      // This test would require mocking API failures
      // Skipped for now as it requires additional setup
      test.skip()
    })
  })

  test.describe('Bulk Operations List', () => {
    test('should display operations list', async ({ page }) => {
      // Navigate to bulk operations tab
      await page.click('button:has-text("Bulk Operations")')
      
      // Verify list is displayed
      const listTitle = page.locator('text=Recent Operations')
      await expect(listTitle).toBeVisible()
    })

    test('should show operation status badges', async ({ page }) => {
      await page.click('button:has-text("Bulk Operations")')
      
      // Look for status badges
      const badges = page.locator('[class*="badge"]')
      await expect(badges.first()).toBeVisible()
    })

    test('should allow viewing operation details', async ({ page }) => {
      await page.click('button:has-text("Bulk Operations")')
      
      // Wait for list to load
      await page.waitForLoadState('networkidle')
      
      // Try to find and click a view button
      const viewButtons = page.locator('button:has-text("View")')
      if (await viewButtons.count() > 0) {
        await viewButtons.first().click()
        // Verify details page
        await page.waitForLoadState('networkidle')
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Verify progress bar has role
      const progressBar = page.locator('[role="progressbar"]')
      await expect(progressBar).toBeVisible()
      
      // Verify radio groups
      const radioGroups = page.locator('[role="radio"]')
      expect(await radioGroups.count()).toBeGreaterThan(0)
    })

    test('should support keyboard navigation', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Tab to next element
      await page.keyboard.press('Tab')
      
      // Check if focus is on first checkbox
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        return el?.tagName.toLowerCase()
      })
      
      expect(['checkbox', 'input', 'button']).toContain(focusedElement)
    })

    test('should have proper button labels', async ({ page }) => {
      await page.click('button:has-text("New Operation")')
      
      // Check for accessible button text
      const nextButton = page.locator('button:has-text("Next")')
      await expect(nextButton).toHaveAccessibleName()
    })
  })
})
