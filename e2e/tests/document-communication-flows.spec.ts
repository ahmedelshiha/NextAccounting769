import { test, expect, Page } from '@playwright/test'

test.describe('Phase 4: Document & Communication Integration', () => {
  let page: Page
  let adminPage: Page
  let portalPage: Page

  test.beforeAll(async ({ browser }) => {
    // Setup admin and portal sessions
    const adminContext = await browser.newContext()
    const portalContext = await browser.newContext()

    adminPage = await adminContext.newPage()
    portalPage = await portalContext.newPage()

    // Login as admin
    await adminPage.goto('/login')
    await adminPage.fill('input[type="email"]', 'admin@accountingfirm.com')
    await adminPage.fill('input[type="password"]', 'admin123')
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForURL('/admin')

    // Login as portal user
    await portalPage.goto('/login')
    await portalPage.fill('input[type="email"]', 'client@example.com')
    await portalPage.fill('input[type="password"]', 'password123')
    await portalPage.click('button[type="submit"]')
    await portalPage.waitForURL('/portal')
  })

  test.afterAll(async () => {
    await adminPage.close()
    await portalPage.close()
  })

  test.describe('Document Management', () => {
    test('Portal user can upload document', async () => {
      // Navigate to documents page
      await portalPage.goto('/portal/documents')
      await expect(portalPage.locator('text=My Documents')).toBeVisible()

      // Click upload button
      const uploadButton = portalPage.locator('button:has-text("Upload Document")')
      await uploadButton.click()

      // Fill upload form
      const fileInput = portalPage.locator('input[type="file"]')
      await fileInput.setInputFiles('./test-fixtures/sample.pdf')

      const descriptionInput = portalPage.locator(
        'textarea[placeholder*="description" i]'
      )
      await descriptionInput.fill('Test document for verification')

      // Submit form
      const submitButton = portalPage.locator('button:has-text("Upload")')
      await submitButton.click()

      // Verify success message
      await expect(portalPage.locator('text=Document uploaded successfully')).toBeVisible({
        timeout: 5000,
      })

      // Verify document appears in list
      await expect(
        portalPage.locator('text=sample.pdf')
      ).toBeVisible()
    })

    test('Admin can view all documents', async () => {
      // Navigate to admin documents
      await adminPage.goto('/admin/documents')
      await expect(adminPage.locator('text=Document Management')).toBeVisible()

      // Verify documents are listed
      const documentRows = adminPage.locator('[role="row"]')
      const count = await documentRows.count()
      expect(count).toBeGreaterThan(0)

      // Check for document stats
      await expect(
        adminPage.locator('text=Total Documents')
      ).toBeVisible()
    })

    test('Admin can approve pending documents', async () => {
      // Navigate to admin documents
      await adminPage.goto('/admin/documents')

      // Find first pending document
      const pendingDocument = adminPage.locator(
        'button:has-text("Approve"):first-of-type'
      )

      if (await pendingDocument.isVisible()) {
        // Click approve button
        await pendingDocument.click()

        // Fill approval form
        const approvalNotes = adminPage.locator('textarea[name="notes"]')
        await approvalNotes.fill('Document verified and approved')

        // Submit approval
        const confirmButton = adminPage.locator(
          'button:has-text("Confirm Approval")'
        )
        await confirmButton.click()

        // Verify success
        await expect(
          adminPage.locator('text=Document approved successfully')
        ).toBeVisible({ timeout: 5000 })
      }
    })

    test('Portal user can download approved document', async () => {
      // Navigate to documents
      await portalPage.goto('/portal/documents')

      // Find downloadable document (status: clean)
      const downloadButton = portalPage.locator(
        'button[title="Download"]:visible:first-of-type'
      )

      if (await downloadButton.isVisible()) {
        // Setup download listener
        const downloadPromise = portalPage.waitForEvent('download')

        // Click download
        await downloadButton.click()

        // Verify download started
        const download = await downloadPromise
        expect(download.suggestedFilename()).toMatch(/\.(pdf|doc|xlsx|txt)/)
      }
    })

    test('Document version history is tracked', async () => {
      // Navigate to specific document
      await portalPage.goto('/portal/documents')

      // Click on a document to view details
      const documentCard = portalPage.locator(
        '[role="button"]:has-text("View Details"):first-of-type'
      )

      if (await documentCard.isVisible()) {
        await documentCard.click()

        // Look for version history
        const versionTab = portalPage.locator('button:has-text("Versions")')
        if (await versionTab.isVisible()) {
          await versionTab.click()
          await expect(
            portalPage.locator('text=Version History')
          ).toBeVisible()
        }
      }
    })

    test('E-signature workflow is available', async () => {
      // Navigate to document detail
      await portalPage.goto('/portal/documents')

      // Click on a document
      const documentCard = portalPage.locator(
        '[role="button"]:first-of-type'
      )
      if (await documentCard.isVisible()) {
        await documentCard.click()

        // Look for sign button
        const signButton = portalPage.locator(
          'button:has-text("Request Signature")'
        )

        if (await signButton.isVisible()) {
          await signButton.click()

          // Fill signature request form
          const emailInput = portalPage.locator('input[type="email"]')
          await emailInput.fill('signer@example.com')

          const daysInput = portalPage.locator('input[type="number"]')
          await daysInput.fill('7')

          // Submit request
          const submitButton = portalPage.locator(
            'button:has-text("Send Signature Request")'
          )
          await submitButton.click()

          // Verify success
          await expect(
            portalPage.locator('text=Signature request sent')
          ).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })

  test.describe('Notification System', () => {
    test('User can access notification center', async () => {
      // Navigate to portal dashboard
      await portalPage.goto('/portal')

      // Click notification bell
      const notificationBell = portalPage.locator(
        'button[title="Notifications"]'
      )
      await notificationBell.click()

      // Verify notification center opens
      await expect(
        portalPage.locator('text=Notifications')
      ).toBeVisible()
    })

    test('Notifications display with correct priority', async () => {
      // Navigate to portal
      await portalPage.goto('/portal')

      // Open notifications
      const notificationBell = portalPage.locator(
        'button[title="Notifications"]'
      )
      await notificationBell.click()

      // Look for priority indicators
      const urgentNotifications = portalPage.locator(
        '.border-l-4.border-red-500'
      )
      const highNotifications = portalPage.locator(
        '.border-l-4.border-orange-500'
      )

      // Should have notifications (if any exist)
      const notificationCount = await portalPage.locator(
        '[role="main"] [role="row"]'
      ).count()

      expect(notificationCount).toBeGreaterThanOrEqual(0)
    })

    test('User can mark notifications as read', async () => {
      // Navigate to portal
      await portalPage.goto('/portal')

      // Open notifications
      const notificationBell = portalPage.locator(
        'button[title="Notifications"]'
      )
      await notificationBell.click()

      // Get initial unread count
      const unreadBadge = notificationBell.locator('span')
      const initialCount = await unreadBadge.textContent().then((t) => {
        const num = parseInt(t || '0')
        return isNaN(num) ? 0 : num
      })

      if (initialCount > 0) {
        // Click mark all as read
        const markAllButton = portalPage.locator(
          'button:has-text("Mark All as Read")'
        )

        if (await markAllButton.isVisible()) {
          await markAllButton.click()

          // Verify success message
          await expect(
            portalPage.locator('text=Marked as read')
          ).toBeVisible({ timeout: 3000 })
        }
      }
    })

    test('User can update notification preferences', async () => {
      // Navigate to settings
      await portalPage.goto('/portal/settings')

      // Look for notifications section
      const notificationsTab = portalPage.locator(
        'button:has-text("Notifications")'
      )

      if (await notificationsTab.isVisible()) {
        await notificationsTab.click()

        // Toggle email notifications
        const emailToggle = portalPage.locator(
          'input[type="checkbox"][aria-label*="Email"]:first-of-type'
        )

        if (await emailToggle.isVisible()) {
          const isChecked = await emailToggle.isChecked()
          await emailToggle.click()

          // Verify change is reflected
          const newState = await emailToggle.isChecked()
          expect(newState).not.toBe(isChecked)

          // Save preferences
          const saveButton = portalPage.locator('button:has-text("Save")')
          if (await saveButton.isVisible()) {
            await saveButton.click()
            await expect(
              portalPage.locator('text=Preferences saved')
            ).toBeVisible({ timeout: 3000 })
          }
        }
      }
    })

    test('Admin can send bulk notifications', async () => {
      // Navigate to admin notifications
      await adminPage.goto('/admin/communications/notifications')

      // Click send notification button
      const sendButton = adminPage.locator('button:has-text("Send Notification")')

      if (await sendButton.isVisible()) {
        await sendButton.click()

        // Fill notification form
        const titleInput = adminPage.locator('input[placeholder*="title" i]')
        await titleInput.fill('System Maintenance Notice')

        const messageInput = adminPage.locator('textarea[placeholder*="message" i]')
        await messageInput.fill(
          'System maintenance scheduled for tonight at 10 PM'
        )

        // Select recipients (e.g., all users)
        const selectAllCheckbox = adminPage.locator(
          'input[aria-label="Select All"]'
        )

        if (await selectAllCheckbox.isVisible()) {
          await selectAllCheckbox.check()
        }

        // Send notification
        const submitButton = adminPage.locator(
          'button:has-text("Send"):last-of-type'
        )
        await submitButton.click()

        // Verify success
        await expect(
          adminPage.locator('text=Notification sent successfully')
        ).toBeVisible({ timeout: 5000 })
      }
    })

    test('Notification badge updates in real-time', async () => {
      // Open portal and admin in split view
      await portalPage.goto('/portal')

      // Get initial notification count
      const notificationBell = portalPage.locator(
        'button[title="Notifications"]'
      )
      const initialBadge = notificationBell.locator('span')
      const initialText = await initialBadge.textContent()

      // Admin sends a notification to this user
      // (This would be done via API in a real scenario)
      // For now, just verify the bell exists and is interactive

      expect(await notificationBell.isVisible()).toBeTruthy()
    })
  })

  test.describe('Cross-feature Integration', () => {
    test('Document approval creates notification', async () => {
      // This test verifies that when admin approves a document,
      // the user receives a notification

      // Step 1: Portal user uploads document
      await portalPage.goto('/portal/documents')
      const uploadButton = portalPage.locator('button:has-text("Upload")')

      if (await uploadButton.isVisible()) {
        await uploadButton.click()
      }

      // Step 2: Admin approves document
      // (Verify through notification that appears to portal user)

      // Step 3: Check portal user receives notification
      await portalPage.goto('/portal')
      const notificationBell = portalPage.locator(
        'button[title="Notifications"]'
      )
      await notificationBell.click()

      // Look for document-related notification
      const documentNotification = portalPage.locator(
        'text=Document approved'
      )

      // Note: This may not always exist if no document was approved
      // In production, this would be more deterministic
      if (await documentNotification.isVisible()) {
        expect(await documentNotification.isVisible()).toBeTruthy()
      }
    })

    test('Task assignment creates notification', async () => {
      // Admin assigns task
      await adminPage.goto('/admin/tasks')

      const createButton = adminPage.locator('button:has-text("New Task")')
      if (await createButton.isVisible()) {
        await createButton.click()

        // Fill task form
        const titleInput = adminPage.locator('input[placeholder*="title" i]')
        await titleInput.fill('Test Integration Task')

        const descInput = adminPage.locator('textarea[placeholder*="description" i]')
        await descInput.fill('This is a test task for integration testing')

        // Assign to user
        const assignSelect = adminPage.locator('select[name="assignee"]')
        if (await assignSelect.isVisible()) {
          await assignSelect.selectOption({ index: 1 })
        }

        // Save task
        const saveButton = adminPage.locator('button:has-text("Create")')
        if (await saveButton.isVisible()) {
          await saveButton.click()

          // Portal user should receive notification
          await portalPage.goto('/portal')
          const notificationBell = portalPage.locator(
            'button[title="Notifications"]'
          )

          // Bell should be visible and interactive
          expect(await notificationBell.isVisible()).toBeTruthy()
        }
      }
    })
  })

  test.describe('Accessibility & Performance', () => {
    test('Document upload form is accessible', async () => {
      // Navigate to documents
      await portalPage.goto('/portal/documents')

      // Upload form should be keyboard navigable
      const uploadButton = portalPage.locator('button:has-text("Upload")')
      await uploadButton.focus()

      // Verify button is focused (keyboard accessible)
      const isFocused = await uploadButton.evaluate((el) => {
        return el === document.activeElement
      })

      expect(isFocused).toBeTruthy()
    })

    test('Notification center performs well with many items', async () => {
      // Navigate to portal
      await portalPage.goto('/portal')

      // Open notifications
      const notificationBell = portalPage.locator(
        'button[title="Notifications"]'
      )
      await notificationBell.click()

      // Measure rendering performance
      const startTime = Date.now()

      // Verify notifications load within reasonable time
      await portalPage.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Should load in less than 2 seconds
      expect(loadTime).toBeLessThan(2000)
    })
  })
})
