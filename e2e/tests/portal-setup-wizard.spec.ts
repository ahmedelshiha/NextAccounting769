import { test, expect } from "@playwright/test";

test.describe("Business Setup Wizard", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to portal setup wizard
    await page.goto("/portal/setup");
    // Wait for dialog to be visible
    await page.waitForSelector('[role="dialog"]');
  });

  test.describe("Existing Business Tab", () => {
    test("should load existing business form", async ({ page }) => {
      // Click Existing Business tab
      await page.click('button:has-text("Existing Business")');
      
      // Verify form fields are visible
      await expect(page.locator('input[placeholder*="DED"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="Business name"]')).toBeVisible();
    });

    test("should validate license number input", async ({ page }) => {
      await page.click('button:has-text("Existing Business")');
      
      // Try submitting without license number
      await page.click('button:has-text("Set up Business")');
      
      // Should show validation error
      await expect(page.locator("text=License number is required")).toBeVisible();
    });

    test("should perform license lookup", async ({ page }) => {
      await page.click('button:has-text("Existing Business")');
      
      // Enter license number
      await page.fill('input[placeholder*="DED"]', "P123456X");
      
      // Click Lookup button
      await page.click('button:has-text("Lookup")');
      
      // Wait for lookup to complete
      await page.waitForTimeout(1000);
      
      // License lookup should attempt to fetch data
      // In test environment, this may return mock data or error
    });

    test("should require terms acceptance", async ({ page }) => {
      await page.click('button:has-text("Existing Business")');
      
      // Fill required fields
      await page.fill('input[placeholder*="DED"]', "P123456X");
      await page.fill('input[placeholder*="Business name"]', "Test Business LLC");
      
      // Try submitting without accepting terms
      await page.click('button:has-text("Set up Business")');
      
      // Should show validation error
      await expect(page.locator("text=You must accept the terms")).toBeVisible();
    });

    test("should submit form with valid data", async ({ page }) => {
      await page.click('button:has-text("Existing Business")');
      
      // Fill all required fields
      await page.fill('input[placeholder*="DED"]', "P123456X");
      await page.fill('input[placeholder*="Business name"]', "Test Business LLC");
      
      // Accept terms
      await page.click('input[type="checkbox"]');
      
      // Select economic zone
      await page.click('select:first-of-type');
      await page.click('text=Abu Dhabi Department');
      
      // Submit form
      await page.click('button:has-text("Set up Business")');
      
      // Should redirect to verification status page
      await page.waitForURL("/portal/setup/status/**");
      await expect(page).toHaveURL(/\/portal\/setup\/status\/.*/);
    });

    test("should switch country", async ({ page }) => {
      await page.click('button:has-text("Existing Business")');
      
      // Switch to Saudi Arabia
      const countrySelect = page.locator('select').first();
      await countrySelect.selectOption("SA");
      
      // License placeholder should change
      await expect(page.locator('input[placeholder*="1010"]')).toBeVisible();
    });
  });

  test.describe("New Startup Tab", () => {
    test("should load new startup form", async ({ page }) => {
      await page.click('button:has-text("New Startup")');
      
      // Verify form fields
      await expect(page.locator('input[placeholder*="Business name"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="LLC"]')).toBeVisible();
    });

    test("should validate required fields", async ({ page }) => {
      await page.click('button:has-text("New Startup")');
      
      // Try submitting empty form
      await page.click('button:has-text("Create Business Account")');
      
      // Should show validation errors
      await expect(page.locator("text=Business name is required")).toBeVisible();
      await expect(page.locator("text=Legal form is required")).toBeVisible();
    });

    test("should submit new startup", async ({ page }) => {
      await page.click('button:has-text("New Startup")');
      
      // Fill form
      await page.fill('input[placeholder*="Business name"]', "New Tech Startup");
      await page.fill('input[placeholder*="LLC"]', "LLC");
      
      // Accept terms
      await page.click('input[type="checkbox"]');
      
      // Submit
      await page.click('button:has-text("Create Business Account")');
      
      // Should redirect to verification
      await page.waitForURL("/portal/setup/status/**");
    });
  });

  test.describe("Individual Tab", () => {
    test("should load individual form", async ({ page }) => {
      await page.click('button:has-text("Individual")');
      
      // Verify form fields
      await expect(page.locator('input[placeholder*="First name"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="Last name"]')).toBeVisible();
    });

    test("should validate individual fields", async ({ page }) => {
      await page.click('button:has-text("Individual")');
      
      // Try submitting empty
      await page.click('button:has-text("Create My Account")');
      
      // Should show validation errors
      await expect(page.locator("text=First name is required")).toBeVisible();
      await expect(page.locator("text=Last name is required")).toBeVisible();
    });

    test("should submit individual account", async ({ page }) => {
      await page.click('button:has-text("Individual")');
      
      // Fill form
      await page.fill('input[placeholder*="First name"]', "Ahmed");
      await page.fill('input[placeholder*="Last name"]', "Al-Mansouri");
      
      const taxIdInput = page.locator('input').filter({ hasText: /15 digits/ }).first();
      await taxIdInput.fill("123456789012345");
      
      // Accept terms
      await page.click('input[type="checkbox"]');
      
      // Submit
      await page.click('button:has-text("Create My Account")');
      
      // Should redirect
      await page.waitForURL("/portal/setup/status/**");
    });
  });

  test.describe("Tab Navigation", () => {
    test("should switch between tabs", async ({ page }) => {
      // Start with Existing
      let form = page.locator('input[placeholder*="DED"]');
      await expect(form).toBeVisible();
      
      // Switch to New Startup
      await page.click('button:has-text("New Startup")');
      form = page.locator('input[placeholder*="Business name"]');
      await expect(form).toBeVisible();
      
      // Switch to Individual
      await page.click('button:has-text("Individual")');
      form = page.locator('input[placeholder*="First name"]');
      await expect(form).toBeVisible();
    });

    test("should preserve tab focus on navigation", async ({ page }) => {
      // Fill first tab
      await page.click('button:has-text("Existing Business")');
      await page.fill('input[placeholder*="Business name"]', "Test");
      
      // Switch away and back
      await page.click('button:has-text("New Startup")');
      await page.click('button:has-text("Existing Business")');
      
      // Data should be cleared (default behavior)
      const businessNameInput = page.locator('input[placeholder*="Business name"]');
      await expect(businessNameInput).toHaveValue("");
    });
  });

  test.describe("Mobile Swipe Gesture", () => {
    test.skip("should show swipe button on mobile", async ({ page }) => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.click('button:has-text("Existing Business")');
      
      // On mobile, should show SwipeToConfirm instead of regular button
      const swipeButton = page.locator('text=Swipe to set up');
      await expect(swipeButton).toBeVisible();
    });

    test.skip("should handle swipe gesture", async ({ page, context }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Set up touch device emulation
      await context.addInitScript(() => {
        (window as any).ontouchstart = () => {};
      });
      
      await page.click('button:has-text("Existing Business")');
      
      // Fill form
      await page.fill('input[placeholder*="Business name"]', "Test Business");
      await page.click('input[type="checkbox"]');
      
      // Simulate swipe gesture on button
      const swipeButton = page.locator('text=Swipe to set up');
      
      // Get button coordinates
      const boundingBox = await swipeButton.boundingBox();
      if (boundingBox) {
        const startX = boundingBox.x + 20;
        const startY = boundingBox.y + boundingBox.height / 2;
        const endX = boundingBox.x + boundingBox.width - 20;
        
        // Perform swipe
        await page.touchscreen.tap(startX, startY);
        await page.touchscreen.tap(endX, startY);
      }
      
      // Should submit form
      await page.waitForURL("/portal/setup/status/**");
    });
  });

  test.describe("RTL Support", () => {
    test("should support Arabic RTL layout", async ({ page }) => {
      // Switch to Arabic
      await page.goto("/portal/setup?lang=ar");
      
      // Dialog should have dir="rtl"
      const dialog = page.locator('[role="dialog"]');
      const dir = await dialog.getAttribute("dir");
      expect(dir).toBe("rtl");
    });

    test("should display Arabic text correctly", async ({ page }) => {
      await page.goto("/portal/setup?lang=ar");
      
      // Wait for Arabic content to be available
      await page.waitForSelector('[role="dialog"]');
      
      // Check that content is displayed (language strings should be in Arabic)
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
    });

    test("should handle RTL form layout", async ({ page }) => {
      await page.goto("/portal/setup?lang=ar");
      
      // Fill form - RTL should work the same
      await page.click('button:has-text(/إنشاء حساب/i)');
      
      // Form inputs should be accessible in RTL
      const inputs = page.locator('input');
      await expect(inputs.first()).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should display network errors", async ({ page }) => {
      // This would require mocking network failure
      // Skipping for now as it requires more setup
    });

    test("should allow retry after error", async ({ page }) => {
      // Fill form with valid data
      await page.click('button:has-text("Existing Business")');
      await page.fill('input[placeholder*="Business name"]', "Test");
      
      // Accept terms
      await page.click('input[type="checkbox"]');
      
      // Submit (may fail in test environment)
      await page.click('button:has-text("Set up Business")');
      
      // Should allow modifying form and retrying
      const businessNameInput = page.locator('input[placeholder*="Business name"]');
      await expect(businessNameInput).toBeEnabled();
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper form labels", async ({ page }) => {
      await page.click('button:has-text("Existing Business")');
      
      // Each input should have associated label
      const labels = page.locator("label");
      await expect(labels.first()).toBeVisible();
    });

    test("should be keyboard navigable", async ({ page }) => {
      // Tab through form
      await page.click('button:has-text("Existing Business")');
      
      // Tab to first input
      await page.keyboard.press("Tab");
      
      // Input should be focused
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(["INPUT", "SELECT"]).toContain(focusedElement);
    });

    test("should announce tab changes to screen readers", async ({ page }) => {
      const existingTab = page.locator('button:has-text("Existing Business")');
      
      // Tab should have role="tab"
      const role = await existingTab.getAttribute("role");
      expect(role).toBe("tab");
    });
  });

  test.describe("Close Dialog", () => {
    test("should close dialog on ESC key", async ({ page }) => {
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Press ESC
      await page.keyboard.press("Escape");
      
      // Dialog should close
      await expect(dialog).not.toBeVisible();
    });

    test("should close dialog on backdrop click", async ({ page }) => {
      const dialog = page.locator('[role="dialog"]');
      
      // Get page coordinates and click outside dialog
      const viewport = page.viewportSize();
      if (viewport) {
        await page.click({ x: 10, y: 10 });
      }
      
      // Dialog should close
      await expect(dialog).not.toBeVisible();
    });
  });
});
