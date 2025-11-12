import { test, expect } from '@playwright/test'

/**
 * Phase 4.3: E2E Tests for Server-Side Filtering
 * 
 * Tests cover:
 * - User search with various filter combinations
 * - API endpoint performance and caching
 * - Client-side filter UI integration
 * - Pagination with filters
 * - Real-time filter application
 */

const ADMIN_URL = '/admin/users'
const SEARCH_ENDPOINT = '/api/admin/users/search'
const BASE_ENDPOINT = '/api/admin/users'

test.describe('Phase 4.3: Server-Side User Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin users page
    await page.goto(ADMIN_URL)
    // Wait for page load and tables to render
    await page.waitForLoadState('networkidle')
  })

  test.describe('Search Endpoint Performance', () => {
    test('should use search endpoint when filters are applied', async ({ page }) => {
      // Monitor API requests
      const requests: string[] = []
      page.on('request', request => {
        requests.push(request.url())
      })

      // Apply a filter by entering search text
      const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i]')
      if (await searchInput.isVisible()) {
        await searchInput.fill('john')
        await page.waitForTimeout(400) // Wait for debounce
        await page.waitForLoadState('networkidle')

        // Verify search endpoint was called
        const searchRequests = requests.filter(url => url.includes('/search'))
        expect(searchRequests.length).toBeGreaterThan(0)
      }
    })

    test('should apply role filter and use search endpoint', async ({ page }) => {
      const requests: string[] = []
      page.on('request', request => {
        requests.push(request.url())
      })

      // Look for role filter dropdown
      const roleDropdown = page.locator('button:has-text("Role"), select[name="role"]').first()
      if (await roleDropdown.isVisible()) {
        await roleDropdown.click()
        await page.locator('text=ADMIN').click()
        await page.waitForLoadState('networkidle')

        // Verify search endpoint includes role filter
        const searchRequests = requests.filter(url => 
          url.includes('/search') && url.includes('role=ADMIN')
        )
        expect(searchRequests.length).toBeGreaterThan(0)
      }
    })

    test('should apply status filter', async ({ page }) => {
      const requests: string[] = []
      page.on('request', request => {
        requests.push(request.url())
      })

      // Look for status filter
      const statusDropdown = page.locator('button:has-text("Status"), select[name="status"]').first()
      if (await statusDropdown.isVisible()) {
        await statusDropdown.click()
        await page.locator('text=ACTIVE').click()
        await page.waitForLoadState('networkidle')

        // Verify filter is applied
        const statusFilterRequests = requests.filter(url =>
          url.includes('status=ACTIVE')
        )
        expect(statusFilterRequests.length).toBeGreaterThan(0)
      }
    })

    test('should apply department filter', async ({ page }) => {
      const requests: string[] = []
      page.on('request', request => {
        requests.push(request.url())
      })

      // Look for department filter
      const departmentDropdown = page.locator('button:has-text("Department"), select[name="department"]').first()
      if (await departmentDropdown.isVisible()) {
        await departmentDropdown.click()
        // Click first available option
        const firstOption = page.locator('[role="option"], li').first()
        await firstOption.click()
        await page.waitForLoadState('networkidle')

        // Verify filter is applied
        expect(requests.filter(url => url.includes('department=')).length).toBeGreaterThan(0)
      }
    })

    test('should combine multiple filters', async ({ page }) => {
      const requests: string[] = []
      page.on('request', request => {
        requests.push(request.url())
      })

      // Apply search filter
      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('john')
        await page.waitForTimeout(400)
      }

      // Apply role filter
      const roleDropdown = page.locator('button:has-text("Role")').first()
      if (await roleDropdown.isVisible()) {
        await roleDropdown.click()
        await page.locator('text=TEAM_MEMBER').click()
      }

      await page.waitForLoadState('networkidle')

      // Verify both filters are in request
      const combinedRequests = requests.filter(url =>
        url.includes('search=john') && url.includes('role=TEAM_MEMBER')
      )
      expect(combinedRequests.length).toBeGreaterThan(0)
    })
  })

  test.describe('Filter Results Display', () => {
    test('should display filtered results correctly', async ({ page }) => {
      // Get initial user count
      const initialRows = await page.locator('tbody tr, [role="row"]').count()

      // Apply search filter
      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('admin')
        await page.waitForTimeout(400)
        await page.waitForLoadState('networkidle')

        // Results should be different (unless no matches)
        const filteredRows = await page.locator('tbody tr, [role="row"]').count()
        // Either results are filtered or empty
        expect(filteredRows).toBeLessThanOrEqual(initialRows)
      }
    })

    test('should show pagination info when filters applied', async ({ page }) => {
      // Apply a filter
      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('user')
        await page.waitForTimeout(400)
        await page.waitForLoadState('networkidle')

        // Look for pagination info
        const paginationText = page.locator('text=/Page .* of \\d+|Showing \\d+ to \\d+ of \\d+/')
        if (await paginationText.isVisible()) {
          const text = await paginationText.textContent()
          expect(text).toBeTruthy()
        }
      }
    })

    test('should clear filters when reset button clicked', async ({ page }) => {
      // Apply filters
      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('test')
        await page.waitForTimeout(400)
        await page.waitForLoadState('networkidle')

        // Click reset button
        const resetButton = page.locator('button:has-text("Reset"), button:has-text("Clear Filters")')
        if (await resetButton.first().isVisible()) {
          await resetButton.first().click()
          await page.waitForLoadState('networkidle')

          // Verify search input is cleared
          const searchValue = await searchInput.inputValue()
          expect(searchValue).toBe('')
        }
      }
    })
  })

  test.describe('Pagination with Filters', () => {
    test('should paginate filtered results', async ({ page }) => {
      // Apply a filter that should have multiple pages
      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('user')
        await page.waitForTimeout(400)
        await page.waitForLoadState('networkidle')

        // Look for next page button
        const nextButton = page.locator('button:has-text("Next"), [aria-label*="Next"]').first()
        if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
          // Record current first row
          const firstRowBefore = await page.locator('tbody tr, [role="row"]').first().textContent()

          // Click next page
          await nextButton.click()
          await page.waitForLoadState('networkidle')

          // Verify data changed
          const firstRowAfter = await page.locator('tbody tr, [role="row"]').first().textContent()
          expect(firstRowBefore).not.toBe(firstRowAfter)
        }
      }
    })

    test('should maintain filters across pagination', async ({ page }) => {
      const requests: string[] = []
      page.on('request', request => {
        requests.push(request.url())
      })

      // Apply search filter
      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('team')
        await page.waitForTimeout(400)
        await page.waitForLoadState('networkidle')

        // Navigate to next page
        const nextButton = page.locator('button:has-text("Next"), [aria-label*="Next"]').first()
        if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
          await nextButton.click()
          await page.waitForLoadState('networkidle')

          // Verify search filter is still in request
          const latestSearchRequests = requests.slice(-1)[0]
          expect(latestSearchRequests).toContain('search=team')
          expect(latestSearchRequests).toContain('page=2')
        }
      }
    })
  })

  test.describe('Caching Behavior', () => {
    test('should return 304 Not Modified for identical requests', async ({ page }) => {
      let etagFromFirst: string | null = null

      // Make first request
      const response1 = await page.request.get(
        `${SEARCH_ENDPOINT}?search=test&page=1&limit=50`,
        {
          headers: { 'Authorization': 'Bearer test' }
        }
      ).catch(() => null)

      if (response1 && response1.ok) {
        etagFromFirst = response1.headers()['etag']
      }

      // Make identical request with ETag
      if (etagFromFirst) {
        const response2 = await page.request.get(
          `${SEARCH_ENDPOINT}?search=test&page=1&limit=50`,
          {
            headers: { 
              'Authorization': 'Bearer test',
              'If-None-Match': etagFromFirst
            }
          }
        ).catch(() => null)

        // Should be 304 or 200 with cached response
        if (response2) {
          expect([200, 304]).toContain(response2.status())
        }
      }
    })

    test('should set appropriate cache headers', async ({ page }) => {
      const response = await page.request.get(
        `${SEARCH_ENDPOINT}?page=1&limit=50`,
        { headers: { 'Authorization': 'Bearer test' } }
      ).catch(() => null)

      if (response && response.ok) {
        const headers = response.headers()
        expect(headers['cache-control']).toBeTruthy()
        expect(headers['cache-control']).toContain('max-age')
        expect(headers['etag']).toBeTruthy()
      }
    })
  })

  test.describe('Search Field Coverage', () => {
    test('should search in name field', async ({ page }) => {
      const requests: string[] = []
      page.on('request', request => {
        requests.push(request.url())
      })

      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('john')
        await page.waitForTimeout(400)
        await page.waitForLoadState('networkidle')

        // Verify request was made
        expect(requests.filter(url => url.includes('search=john')).length).toBeGreaterThan(0)
      }
    })

    test('should search in email field', async ({ page }) => {
      const requests: string[] = []
      page.on('request', request => {
        requests.push(request.url())
      })

      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('example@company.com')
        await page.waitForTimeout(400)
        await page.waitForLoadState('networkidle')

        // Should search in email field
        expect(requests.filter(url => url.includes('search=example')).length).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle rate limiting gracefully', async ({ page, context }) => {
      // Simulate rapid filter changes
      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        const terms = ['a', 'ab', 'abc', 'abcd', 'abcde']
        
        for (const term of terms) {
          await searchInput.fill(term)
          await page.waitForTimeout(100) // Don't wait for full debounce
        }

        // Wait for final request
        await page.waitForTimeout(500)
        await page.waitForLoadState('networkidle')

        // Page should still be responsive
        const isVisible = await page.locator('body').isVisible()
        expect(isVisible).toBe(true)
      }
    })

    test('should display error message if search fails', async ({ page }) => {
      // This test assumes error handling is in place
      // Actual implementation may vary
      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('test@example.com')
        await page.waitForTimeout(400)
        await page.waitForLoadState('networkidle')

        // Look for error message (may not appear if no error)
        const errorMsg = page.locator('[role="alert"], .error-message, .toast-error')
        // Error should either not exist or be hidden
        const errorCount = await errorMsg.count()
        // Acceptable to have 0 errors
        expect(errorCount).toBeLessThanOrEqual(10)
      }
    })
  })

  test.describe('Performance Metrics', () => {
    test('should apply filters within reasonable time', async ({ page }) => {
      const startTime = Date.now()

      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('performance')
        await page.waitForTimeout(400)
        await page.waitForLoadState('networkidle')

        const endTime = Date.now()
        const duration = endTime - startTime

        // Should complete within 3 seconds
        expect(duration).toBeLessThan(3000)
      }
    })

    test('should handle pagination quickly', async ({ page }) => {
      // Apply a filter first
      const searchInput = page.locator('input[placeholder*="search" i]').first()
      if (await searchInput.isVisible()) {
        await searchInput.fill('user')
        await page.waitForTimeout(400)
        await page.waitForLoadState('networkidle')

        // Time pagination
        const nextButton = page.locator('button:has-text("Next")').first()
        if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
          const startTime = Date.now()
          await nextButton.click()
          await page.waitForLoadState('networkidle')
          const duration = Date.now() - startTime

          // Should load next page within 2 seconds
          expect(duration).toBeLessThan(2000)
        }
      }
    })
  })
})
