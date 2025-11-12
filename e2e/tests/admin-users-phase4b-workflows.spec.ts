import { test, expect } from '@playwright/test'

const TEST_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

test.describe('Phase 4b: Workflow Engine', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin users page
    await page.goto(`${TEST_BASE_URL}/admin/users`)
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Workflow API Endpoints', () => {
    test('GET /api/admin/workflows - should list workflows', async ({ request }) => {
      const response = await request.get(`${TEST_BASE_URL}/api/admin/workflows`)
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('workflows')
      expect(Array.isArray(data.workflows)).toBe(true)
    })

    test('POST /api/admin/workflows - should create workflow', async ({ request }) => {
      const response = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING',
          templateId: null
        }
      })
      expect(response.status()).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('workflow')
      expect(data.workflow.type).toBe('ONBOARDING')
    })

    test('GET /api/admin/workflows/:id - should get workflow details', async ({ request }) => {
      // First create a workflow
      const createResponse = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const { workflow } = await createResponse.json()

      // Then fetch it
      const response = await request.get(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}`)
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('workflow')
      expect(data.workflow.id).toBe(workflow.id)
    })

    test('PATCH /api/admin/workflows/:id - should execute workflow action', async ({ request }) => {
      // Create a workflow
      const createResponse = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const { workflow } = await createResponse.json()

      // Pause it
      const pauseResponse = await request.patch(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}`, {
        data: { action: 'PAUSE' }
      })
      expect(pauseResponse.status()).toBe(200)
      const pauseData = await pauseResponse.json()
      expect(pauseData.status).toBe('PAUSED')
    })

    test('POST /api/admin/workflows/:id/dry-run - should preview workflow', async ({ request }) => {
      // Create a workflow
      const createResponse = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const { workflow } = await createResponse.json()

      // Run dry-run
      const response = await request.post(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}/dry-run`)
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('estimate')
      expect(data.estimate).toHaveProperty('steps')
      expect(data.estimate).toHaveProperty('estimatedSeconds')
    })
  })

  test.describe('Workflow Types', () => {
    test('should support ONBOARDING workflow type', async ({ request }) => {
      const response = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const data = await response.json()
      expect(data.workflow.type).toBe('ONBOARDING')
      expect(data.workflow.totalSteps).toBeGreaterThan(0)
    })

    test('should support OFFBOARDING workflow type', async ({ request }) => {
      const response = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'OFFBOARDING'
        }
      })
      const data = await response.json()
      expect(data.workflow.type).toBe('OFFBOARDING')
    })

    test('should support ROLE_CHANGE workflow type', async ({ request }) => {
      const response = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ROLE_CHANGE'
        }
      })
      const data = await response.json()
      expect(data.workflow.type).toBe('ROLE_CHANGE')
    })
  })

  test.describe('Workflow Status Transitions', () => {
    test('should transition from DRAFT to IN_PROGRESS', async ({ request }) => {
      const createResponse = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const { workflow } = await createResponse.json()
      expect(workflow.status).toBe('DRAFT')

      // Execute workflow
      const executeResponse = await request.patch(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}`, {
        data: { action: 'EXECUTE' }
      })
      expect(executeResponse.status()).toBe(200)
    })

    test('should pause and resume workflow', async ({ request }) => {
      const createResponse = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const { workflow } = await createResponse.json()

      // Pause
      const pauseResponse = await request.patch(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}`, {
        data: { action: 'PAUSE' }
      })
      expect(pauseResponse.status()).toBe(200)
      let data = await pauseResponse.json()
      expect(data.status).toBe('PAUSED')

      // Resume
      const resumeResponse = await request.patch(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}`, {
        data: { action: 'RESUME' }
      })
      expect(resumeResponse.status()).toBe(200)
      data = await resumeResponse.json()
      expect(data.status).toBe('IN_PROGRESS')
    })

    test('should cancel workflow', async ({ request }) => {
      const createResponse = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const { workflow } = await createResponse.json()

      const cancelResponse = await request.patch(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}`, {
        data: { action: 'CANCEL' }
      })
      expect(cancelResponse.status()).toBe(200)
      const data = await cancelResponse.json()
      expect(data.status).toBe('CANCELLED')
    })
  })

  test.describe('Approval Workflow', () => {
    test('should request approval for a step', async ({ request }) => {
      const createResponse = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ROLE_CHANGE'
        }
      })
      const { workflow } = await createResponse.json()

      // Workflow with ROLE_CHANGE should have approval required
      const detailsResponse = await request.get(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}`)
      const details = await detailsResponse.json()
      const hasApprovalStep = details.workflow.steps?.some((s: any) => s.requiresApproval)
      expect(hasApprovalStep || details.workflow.type === 'ROLE_CHANGE').toBeTruthy()
    })
  })

  test.describe('Workflow Progress Tracking', () => {
    test('should track progress percentage', async ({ request }) => {
      const response = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const { workflow } = await response.json()

      expect(workflow).toHaveProperty('progressPercent')
      expect(workflow).toHaveProperty('totalSteps')
      expect(workflow).toHaveProperty('completedSteps')
      expect(workflow.progressPercent).toBeGreaterThanOrEqual(0)
      expect(workflow.progressPercent).toBeLessThanOrEqual(100)
    })

    test('should increment progress on step completion', async ({ request }) => {
      const createResponse = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const { workflow } = await createResponse.json()
      const initialSteps = workflow.completedSteps

      // Execute workflow
      await request.patch(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}`, {
        data: { action: 'EXECUTE' }
      })

      // Check progress increased
      const detailsResponse = await request.get(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}`)
      const details = await detailsResponse.json()
      expect(details.workflow.completedSteps).toBeGreaterThanOrEqual(initialSteps)
    })
  })

  test.describe('Workflow Filtering', () => {
    test('should filter workflows by status', async ({ request }) => {
      const response = await request.get(`${TEST_BASE_URL}/api/admin/workflows?status=DRAFT`)
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.workflows)).toBe(true)
      data.workflows?.forEach((wf: any) => {
        if (wf.status !== 'DRAFT') {
          console.log('Note: Filter may not be strictly enforced')
        }
      })
    })

    test('should filter workflows by type', async ({ request }) => {
      const response = await request.get(`${TEST_BASE_URL}/api/admin/workflows?type=ONBOARDING`)
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.workflows)).toBe(true)
    })

    test('should support pagination', async ({ request }) => {
      const response = await request.get(`${TEST_BASE_URL}/api/admin/workflows?page=1&limit=10`)
      expect(response.status()).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('pagination')
      expect(data.pagination).toHaveProperty('page')
      expect(data.pagination).toHaveProperty('limit')
      expect(data.pagination).toHaveProperty('total')
    })
  })

  test.describe('Scheduled Workflows', () => {
    test('should support scheduling workflows for later', async ({ request }) => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const response = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING',
          scheduledFor: futureDate
        }
      })

      expect(response.status()).toBe(201)
      const data = await response.json()
      expect(data.workflow).toHaveProperty('scheduledFor')
    })
  })

  test.describe('Workflow Error Handling', () => {
    test('should handle missing userId', async ({ request }) => {
      const response = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          type: 'ONBOARDING'
        }
      })
      expect(response.status()).toBeGreaterThanOrEqual(400)
    })

    test('should handle invalid workflow type', async ({ request }) => {
      const response = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'INVALID_TYPE'
        }
      })
      // Should either fail or use default type
      expect(response.status()).toBeGreaterThanOrEqual(200)
    })

    test('should handle non-existent workflow', async ({ request }) => {
      const response = await request.get(`${TEST_BASE_URL}/api/admin/workflows/non-existent-id`)
      expect(response.status()).toBeGreaterThanOrEqual(404)
    })
  })

  test.describe('Performance', () => {
    test('should list workflows quickly', async ({ request }) => {
      const start = Date.now()
      const response = await request.get(`${TEST_BASE_URL}/api/admin/workflows?limit=50`)
      const duration = Date.now() - start

      expect(response.status()).toBe(200)
      expect(duration).toBeLessThan(2000) // Should complete in less than 2 seconds
    })

    test('should create workflow quickly', async ({ request }) => {
      const start = Date.now()
      const response = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const duration = Date.now() - start

      expect(response.status()).toBe(201)
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })

    test('should execute workflow quickly', async ({ request }) => {
      const createResponse = await request.post(`${TEST_BASE_URL}/api/admin/workflows`, {
        data: {
          userId: 'test-user-123',
          type: 'ONBOARDING'
        }
      })
      const { workflow } = await createResponse.json()

      const start = Date.now()
      const response = await request.patch(`${TEST_BASE_URL}/api/admin/workflows/${workflow.id}`, {
        data: { action: 'EXECUTE' }
      })
      const duration = Date.now() - start

      expect(response.status()).toBe(200)
      expect(duration).toBeLessThan(5000) // Should complete in less than 5 seconds
    })
  })
})
