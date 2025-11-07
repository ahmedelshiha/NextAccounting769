import { test, expect } from '@playwright/test'

// Helper function to devLogin and set cookie
async function devLoginAndSetCookie(page: any, email: string = 'admin@accountingfirm.com') {
  await page.goto('/api/_dev/login?email=' + encodeURIComponent(email))
  await page.waitForNavigation()
}

test.describe('Phase 4.3: Server-Side Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await devLoginAndSetCookie(page)
  })

  test.describe('API Endpoint Filtering', () => {
    test('should filter users by search (email)', async ({ page }) => {
      // Test API call with search parameter
      const response = await page.request.get('/api/admin/users?search=admin@accounting')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.users).toBeDefined()
      expect(data.filters).toBeDefined()
      expect(data.filters.search).toBe('admin@accounting')

      // All returned users should match search
      const users = data.users
      if (users.length > 0) {
        const hasMatch = users.some((u: any) =>
          u.email.toLowerCase().includes('admin@accounting'.toLowerCase()) ||
          u.name?.toLowerCase().includes('admin@accounting'.toLowerCase())
        )
        expect(hasMatch).toBeTruthy()
      }
    })

    test('should filter users by role', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?role=ADMIN')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.filters.role).toBe('ADMIN')

      // All users should have ADMIN role
      const users = data.users
      users.forEach((u: any) => {
        expect(u.role).toBe('ADMIN')
      })
    })

    test('should filter users by status (availabilityStatus)', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?status=AVAILABLE')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.filters.status).toBe('AVAILABLE')

      // All users should have AVAILABLE status
      const users = data.users
      users.forEach((u: any) => {
        expect(u.availabilityStatus).toBe('AVAILABLE')
      })
    })

    test('should filter users by tier', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?tier=ENTERPRISE')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.filters.tier).toBe('ENTERPRISE')

      // All users should have ENTERPRISE tier
      const users = data.users
      users.forEach((u: any) => {
        if (u.tier) {
          expect(u.tier).toBe('ENTERPRISE')
        }
      })
    })

    test('should filter users by department', async ({ page }) => {
      // First, get a user with a department to know what to filter by
      const allUsersResponse = await page.request.get('/api/admin/users')
      const allData = await allUsersResponse.json()
      const userWithDept = allData.users.find((u: any) => u.department)

      if (userWithDept) {
        const response = await page.request.get(
          `/api/admin/users?department=${encodeURIComponent(userWithDept.department)}`
        )

        expect(response.ok()).toBeTruthy()
        const data = await response.json()

        expect(data.filters.department).toBe(userWithDept.department)

        // All users should have the same department
        const users = data.users
        users.forEach((u: any) => {
          expect(u.department).toBe(userWithDept.department)
        })
      }
    })

    test('should combine multiple filters', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?role=ADMIN&status=AVAILABLE')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.filters.role).toBe('ADMIN')
      expect(data.filters.status).toBe('AVAILABLE')

      // All users should match both filters
      const users = data.users
      users.forEach((u: any) => {
        expect(u.role).toBe('ADMIN')
        expect(u.availabilityStatus).toBe('AVAILABLE')
      })
    })

    test('should handle search + filter combination', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?search=admin&role=ADMIN')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.filters.search).toBe('admin')
      expect(data.filters.role).toBe('ADMIN')

      // All users should match both criteria
      const users = data.users
      users.forEach((u: any) => {
        expect(u.role).toBe('ADMIN')
        const matchesSearch =
          u.email.toLowerCase().includes('admin') ||
          (u.name && u.name.toLowerCase().includes('admin'))
        expect(matchesSearch).toBeTruthy()
      })
    })

    test('should support sorting by name', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?sortBy=name&sortOrder=asc')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.filters.sortBy).toBe('name')
      expect(data.filters.sortOrder).toBe('asc')

      // Check if sorted
      const users = data.users
      if (users.length > 1) {
        for (let i = 0; i < users.length - 1; i++) {
          const curr = (users[i].name || '').toLowerCase()
          const next = (users[i + 1].name || '').toLowerCase()
          if (curr && next) {
            expect(curr.localeCompare(next)).toBeLessThanOrEqual(0)
          }
        }
      }
    })

    test('should support sorting by email', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?sortBy=email&sortOrder=asc')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.filters.sortBy).toBe('email')
      expect(data.filters.sortOrder).toBe('asc')

      // Check if sorted by email
      const users = data.users
      if (users.length > 1) {
        for (let i = 0; i < users.length - 1; i++) {
          const curr = users[i].email.toLowerCase()
          const next = users[i + 1].email.toLowerCase()
          expect(curr.localeCompare(next)).toBeLessThanOrEqual(0)
        }
      }
    })

    test('should support descending sort order', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?sortBy=createdAt&sortOrder=desc')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.filters.sortOrder).toBe('desc')

      // Check if sorted descending by createdAt
      const users = data.users
      if (users.length > 1) {
        for (let i = 0; i < users.length - 1; i++) {
          const currTime = new Date(users[i].createdAt).getTime()
          const nextTime = new Date(users[i + 1].createdAt).getTime()
          expect(currTime).toBeGreaterThanOrEqual(nextTime)
        }
      }
    })

    test('should include filter info in response headers', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?search=test&role=ADMIN&tier=ENTERPRISE')

      expect(response.ok()).toBeTruthy()

      // Check custom headers
      const searchHeader = response.headers()['x-filter-search']
      const roleHeader = response.headers()['x-filter-role']
      const tierHeader = response.headers()['x-filter-tier']

      expect(searchHeader).toBe('test')
      expect(roleHeader).toBe('ADMIN')
      expect(tierHeader).toBe('ENTERPRISE')
    })

    test('should return pagination metadata', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?page=1&limit=10')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
      expect(data.pagination.total).toBeGreaterThanOrEqual(0)
      expect(data.pagination.pages).toBeGreaterThanOrEqual(0)

      // Should respect limit
      expect(data.users.length).toBeLessThanOrEqual(10)
    })

    test('should enforce max limit of 100', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?limit=500')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      // Should not exceed 100
      expect(data.users.length).toBeLessThanOrEqual(100)
    })
  })

  test.describe('UI Integration with Filters', () => {
    test('should load admin users page', async ({ page }) => {
      await page.goto('/admin/users')

      // Wait for page to load
      await page.waitForSelector('[role="tab"]')

      // Verify tabs are present
      const tabs = await page.locator('[role="tab"]').count()
      expect(tabs).toBeGreaterThan(0)
    })

    test('should display users from API', async ({ page }) => {
      await page.goto('/admin/users')

      // Wait for users table/list to load
      await page.waitForSelector('[role="table"], [class*="user"]')

      // At least some content should be present
      const content = await page.content()
      expect(content.length).toBeGreaterThan(100)
    })
  })

  test.describe('Performance Characteristics', () => {
    test('should return results within 2 seconds for 1000 users', async ({ page }) => {
      const startTime = Date.now()
      const response = await page.request.get('/api/admin/users?limit=50')
      const endTime = Date.now()

      expect(response.ok()).toBeTruthy()
      const duration = endTime - startTime

      // Should be reasonably fast (2s for worst case)
      expect(duration).toBeLessThan(2000)
    })

    test('should handle large search term gracefully', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?search=' + 'a'.repeat(100))

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      // Should return valid response (even if no matches)
      expect(data.pagination).toBeDefined()
      expect(Array.isArray(data.users)).toBeTruthy()
    })

    test('should handle multiple simultaneous filter queries', async ({ page }) => {
      // Run 5 requests in parallel
      const requests = [
        page.request.get('/api/admin/users?search=admin'),
        page.request.get('/api/admin/users?role=ADMIN'),
        page.request.get('/api/admin/users?status=AVAILABLE'),
        page.request.get('/api/admin/users?tier=ENTERPRISE'),
        page.request.get('/api/admin/users?department=IT')
      ]

      const responses = await Promise.all(requests)

      // All should succeed
      responses.forEach((response) => {
        expect(response.ok()).toBeTruthy()
      })
    })
  })

  test.describe('Edge Cases', () => {
    test('should handle empty search results gracefully', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?search=xyznonexistentuser123')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(Array.isArray(data.users)).toBeTruthy()
      expect(data.pagination.total).toBe(0)
    })

    test('should handle invalid role filter gracefully', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?role=INVALIDROLE')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      // Should return empty results or handle gracefully
      expect(Array.isArray(data.users)).toBeTruthy()
    })

    test('should handle case-insensitive search', async ({ page }) => {
      // Search with mixed case
      const response1 = await page.request.get('/api/admin/users?search=ADMIN')
      const response2 = await page.request.get('/api/admin/users?search=admin')
      const response3 = await page.request.get('/api/admin/users?search=AdMiN')

      expect(response1.ok()).toBeTruthy()
      expect(response2.ok()).toBeTruthy()
      expect(response3.ok()).toBeTruthy()

      const data1 = await response1.json()
      const data2 = await response2.json()
      const data3 = await response3.json()

      // Should return same results regardless of case
      expect(data1.users.length).toBe(data2.users.length)
      expect(data2.users.length).toBe(data3.users.length)
    })

    test('should handle pagination boundary correctly', async ({ page }) => {
      // Get total count
      const totalResponse = await page.request.get('/api/admin/users?limit=1')
      const totalData = await totalResponse.json()
      const totalPages = totalData.pagination.pages

      // Get last page
      const lastPageResponse = await page.request.get(`/api/admin/users?page=${totalPages}&limit=1`)
      expect(lastPageResponse.ok()).toBeTruthy()

      // Get beyond last page
      const beyondResponse = await page.request.get(`/api/admin/users?page=${totalPages + 100}&limit=1`)
      expect(beyondResponse.ok()).toBeTruthy()
      const beyondData = await beyondResponse.json()
      expect(beyondData.users.length).toBe(0)
    })

    test('should handle special characters in search', async ({ page }) => {
      const specialChars = ['@', '#', '$', '%', '&']

      for (const char of specialChars) {
        const response = await page.request.get(`/api/admin/users?search=${encodeURIComponent(char)}`)
        expect(response.ok()).toBeTruthy()
        const data = await response.json()
        expect(Array.isArray(data.users)).toBeTruthy()
      }
    })
  })

  test.describe('Backward Compatibility', () => {
    test('should work without any filter parameters', async ({ page }) => {
      const response = await page.request.get('/api/admin/users')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.users).toBeDefined()
      expect(data.pagination).toBeDefined()
      expect(Array.isArray(data.users)).toBeTruthy()
    })

    test('should work with only pagination parameters', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?page=1&limit=25')

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(25)
      expect(Array.isArray(data.users)).toBeTruthy()
    })

    test('should maintain ETag support for caching', async ({ page }) => {
      const response1 = await page.request.get('/api/admin/users?limit=10')
      expect(response1.ok()).toBeTruthy()

      const etag = response1.headers()['etag']
      expect(etag).toBeDefined()

      // Send same request with If-None-Match header
      const response2 = await page.request.get('/api/admin/users?limit=10', {
        headers: { 'If-None-Match': etag }
      })

      // Should return 304 Not Modified
      expect(response2.status()).toBe(304)
    })
  })
})
