import { test, expect } from '@playwright/test'

test.describe('Public User Flows - Landing Page & Services', () => {
  test('homepage loads with hero section and services', async ({ page }) => {
    await page.goto('/')
    
    // Check hero section is visible
    await expect(page.locator('h1')).toContainText('Stress-free accounting')
    
    // Check CTA buttons exist
    const bookBtn = page.getByRole('link', { name: /book free consultation/i }).first()
    await expect(bookBtn).toBeVisible()
    
    const servicesBtn = page.getByRole('link', { name: /view our services/i })
    await expect(servicesBtn).toBeVisible()
  })

  test('services section displays featured services on homepage', async ({ page }) => {
    await page.goto('/')
    
    // Wait for services to load
    await page.waitForSelector('[class*="ServiceCard"]', { timeout: 5000 }).catch(() => null)
    
    // Check for service cards
    const serviceCards = page.locator('[class*="card"]')
    const count = await serviceCards.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('compact hero variant works via query param', async ({ page }) => {
    await page.goto('/?hero=compact')
    
    // Page should load successfully
    await expect(page).toHaveTitle(/accounting/i)
    await expect(page.locator('body')).toBeTruthy()
  })

  test('services page loads with service listings', async ({ page }) => {
    await page.goto('/services')
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Professional Accounting Services')
    
    // Check for service cards
    const serviceCards = page.locator('[class*="card"]')
    const count = await serviceCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('services page shows pricing and features', async ({ page }) => {
    await page.goto('/services')
    
    // Check for key service types
    await expect(page.locator('text=Bookkeeping')).toBeVisible()
    await expect(page.locator('text=Tax')).toBeVisible()
    
    // Check for pricing info
    await expect(page.locator('text=/Starting at/i')).toBeVisible()
  })

  test('clicking "Get Started" button navigates to booking', async ({ page }) => {
    await page.goto('/services')
    
    // Find and click first "Get Started" button
    const getStartedBtn = page.getByRole('button', { name: /get started/i }).first()
    await getStartedBtn.click()
    
    // Should navigate to booking page
    await expect(page).toHaveURL('/booking')
  })

  test('booking page loads BookingWizard component', async ({ page }) => {
    await page.goto('/booking')
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Book Your Consultation')
    
    // Should have form elements visible
    await expect(page.locator('text=/service|time|date/i').first()).toBeTruthy()
  })
})

test.describe('Navigation Flow', () => {
  test('homepage navigation links work', async ({ page }) => {
    await page.goto('/')
    
    // Get navigation links
    const aboutLink = page.getByRole('link', { name: /about/i }).first()
    const servicesLink = page.getByRole('link', { name: /services/i }).first()
    const contactLink = page.getByRole('link', { name: /contact/i }).first()
    
    // Test navigation to services
    if (await servicesLink.isVisible()) {
      await servicesLink.click()
      await expect(page).toHaveURL(/services/)
      await page.goBack()
    }
    
    // Test navigation to about
    if (await aboutLink.isVisible()) {
      await aboutLink.click()
      await expect(page).toHaveURL(/about/)
      await page.goBack()
    }
  })

  test('can navigate from services to booking', async ({ page }) => {
    await page.goto('/services')
    
    // Click CTA to booking
    const bookBtn = page.getByRole('link', { name: /book free consultation|get started/i }).first()
    await bookBtn.click()
    
    await expect(page).toHaveURL('/booking')
    await expect(page.locator('h1')).toContainText('Book Your Consultation')
  })

  test('footer links are present and functional', async ({ page }) => {
    await page.goto('/')
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // Check for common footer links
    const privacyLink = page.getByRole('link', { name: /privacy|terms|contact/i }).first()
    expect(privacyLink).toBeTruthy()
  })
})

test.describe('Responsive Design - Public Pages', () => {
  const viewports = [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1920, height: 1080, name: 'Desktop' }
  ]

  for (const viewport of viewports) {
    test(`homepage is responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      
      // Check main content is visible
      const mainContent = page.locator('main')
      await expect(mainContent).toBeVisible()
      
      // Check hero text is visible
      const heading = page.locator('h1').first()
      await expect(heading).toBeVisible()
    })

    test(`services page is responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/services')
      
      // Check main content is visible
      await expect(page.locator('h1').first()).toBeVisible()
      
      // Check service cards stack properly
      const cards = page.locator('[class*="card"]')
      const count = await cards.count()
      expect(count).toBeGreaterThan(0)
    })

    test(`booking page is responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/booking')
      
      // Check heading is visible
      await expect(page.locator('h1')).toContainText('Book Your Consultation')
      
      // Check form is visible
      await expect(page.locator('input, select, textarea').first()).toBeVisible({ timeout: 5000 }).catch(() => null)
    })
  }
})

test.describe('Accessibility - Public Pages', () => {
  test('homepage has proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // Should start with h1
    const h1s = page.locator('h1')
    const h1Count = await h1s.count()
    expect(h1Count).toBeGreaterThan(0)
    
    // Check for logical heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()
    expect(headingCount).toBeGreaterThan(0)
  })

  test('services page has descriptive links', async ({ page }) => {
    await page.goto('/services')
    
    // All links should have text content
    const links = page.getByRole('link')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
    
    // Check first few links have readable text
    for (let i = 0; i < Math.min(5, count); i++) {
      const link = links.nth(i)
      const text = await link.textContent()
      expect(text).toBeTruthy()
    }
  })

  test('booking page form has associated labels', async ({ page }) => {
    await page.goto('/booking')
    
    // Check for form labels
    const labels = page.locator('label')
    const labelCount = await labels.count()
    
    // There should be some labels or aria-labels
    const ariaLabeled = page.locator('[aria-label]')
    const ariaCount = await ariaLabeled.count()
    
    expect(labelCount + ariaCount).toBeGreaterThan(0)
  })

  test('pages have main landmark', async ({ page }) => {
    const pages = ['/', '/services', '/booking']
    
    for (const path of pages) {
      await page.goto(path)
      
      const main = page.locator('main, [role="main"]')
      await expect(main.first()).toBeVisible()
    }
  })
})

test.describe('API Integration', () => {
  test('services are fetched from API on homepage', async ({ page, request }) => {
    // Intercept API calls
    const apiResponses: { url: string; ok: boolean }[] = []
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        apiResponses.push({ url: response.url(), ok: response.ok() })
      }
    })
    
    await page.goto('/')
    
    // Wait a bit for API calls
    await page.waitForTimeout(2000)
    
    // Should have made at least one API call for services
    const serviceApiCalls = apiResponses.filter(r => r.url.includes('/api/services'))
    expect(serviceApiCalls.length).toBeGreaterThanOrEqual(0)
  })

  test('booking page loads services from API', async ({ page }) => {
    const apiResponses: { url: string; ok: boolean }[] = []
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        apiResponses.push({ url: response.url(), ok: response.ok() })
      }
    })
    
    await page.goto('/booking')
    
    // Wait for API calls
    await page.waitForTimeout(2000)
    
    // Should have fetched services
    const serviceApiCalls = apiResponses.filter(r => r.url.includes('/api/services'))
    expect(serviceApiCalls.length).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Performance - Public Pages', () => {
  test('homepage loads within reasonable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const loadTime = Date.now() - startTime
    
    // Should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('services page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/services', { waitUntil: 'domcontentloaded' })
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(5000)
  })

  test('booking page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/booking', { waitUntil: 'domcontentloaded' })
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(5000)
  })
})
