import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { generateIntakeQuestions, validateIntakeResponses } from '@/lib/ai/intake-assistant'
import prisma from '@/lib/prisma'
import { z } from 'zod'

/**
 * GET /api/intake/questions
 * Retrieves intake questionnaire for client onboarding
 */
export const GET = withTenantContext(async (request: NextRequest) => {
    const { userId, tenantId } = requireTenantContext()

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientType = searchParams.get('clientType')
    const country = searchParams.get('country') || 'AE'

    const questions = generateIntakeQuestions(
      clientType as any,
      country
    )

    return NextResponse.json({
      success: true,
      data: {
        questions,
        totalQuestions: questions.length,
        estimatedTimeMinutes: Math.ceil(questions.length * 1.5),
      },
    })
  })

/**
 * POST /api/intake/responses
 * Saves intake questionnaire responses
 */
const SaveResponsesSchema = z.object({
  responses: z.record(z.string(), z.any()),
  clientType: z.string().optional(),
  country: z.string().default('AE'),
  entityName: z.string().optional(),
})

export const POST = withTenantContext(async (request: NextRequest) => {
    const { userId, tenantId } = requireTenantContext()

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const body = await request.json()
      const { responses, country, entityName } = SaveResponsesSchema.parse(body)

      // Get the questions to validate responses
      const questions = generateIntakeQuestions(responses.client_type, country)
      const validation = validateIntakeResponses(responses, questions)

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            errors: validation.errors,
          },
          { status: 400 }
        )
      }

      // Store responses in database (create custom model if needed)
      // For now, store in a JSON field on UserProfile or create IntakeResponse table
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { userProfile: true },
      })

      if (!user?.userProfile) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }

      // Update metadata with intake responses
      const updatedProfile = await prisma.userProfile.update({
        where: { userId },
        data: {
          metadata: {
            ...(user.userProfile.metadata as any || {}),
            intakeResponses: {
              responses,
              country,
              entityName,
              completedAt: new Date().toISOString(),
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          userId,
          completedAt: new Date(),
          nextSteps: [
            'Review generated compliance checklist',
            'Create business entity',
            'Upload required documents',
            'Configure bank connections',
          ],
        },
      })
    } catch (error) {
      console.error('Intake response save error:', error)
      return NextResponse.json(
        { error: 'Failed to save intake responses' },
        { status: 500 }
      )
  }
})
