import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { z } from 'zod'

/**
 * POST /api/team-spaces
 * Create a new team space
 */
const CreateSpaceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['TEAM', 'PROJECT', 'AUDIT', 'FILING', 'CLIENT_PORTAL']),
  visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).default('PRIVATE'),
  redactionSettings: z.object({
    enabled: z.boolean().optional(),
    redactedFields: z.array(z.string()).optional(),
    redactedForRoles: z.array(z.string()).optional(),
  }).optional(),
})

export const POST = withTenantContext(async (request: NextRequest) => {
    const { userId, tenantId } = requireTenantContext()

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const body = await request.json()
      const { name, description, type, visibility, redactionSettings } = CreateSpaceSchema.parse(body)

      // Create space in database (would need TeamSpace model in Prisma)
      // For now, return mock response
      const space = {
        id: Math.random().toString(36).substr(2, 9),
        tenantId,
        name,
        description,
        type,
        visibility,
        ownerId: userId,
        members: [{
          userId,
          role: 'OWNER',
          addedAt: new Date(),
          addedBy: userId,
        }],
        redactionSettings,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return NextResponse.json({
        success: true,
        data: space,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: error.issues },
          { status: 400 }
        )
      }
      console.error('Space creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create team space' },
        { status: 500 }
      )
    }
  })

/**
 * GET /api/team-spaces
 * List team spaces for user
 */
export const GET = withTenantContext(async (request: NextRequest) => {
    const { userId, tenantId } = requireTenantContext()

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type')
      const limit = parseInt(searchParams.get('limit') || '20', 10)
      const offset = parseInt(searchParams.get('offset') || '0', 10)

      // Mock: Return sample spaces
      const spaces = [
        {
          id: 'space-1',
          tenantId,
          name: 'Finance Team',
          type: 'TEAM',
          visibility: 'TEAM',
          ownerId: userId,
          memberCount: 3,
          createdAt: new Date(),
        },
        {
          id: 'space-2',
          tenantId,
          name: 'Annual Audit 2024',
          type: 'AUDIT',
          visibility: 'PRIVATE',
          ownerId: userId,
          memberCount: 2,
          createdAt: new Date(),
        },
      ].filter(s => !type || s.type === type)

      return NextResponse.json({
        success: true,
        data: {
          spaces: spaces.slice(offset, offset + limit),
          total: spaces.length,
          limit,
          offset,
        },
      })
    } catch (error) {
      console.error('Space list error:', error)
      return NextResponse.json(
        { error: 'Failed to list team spaces' },
        { status: 500 }
      )
    }
  })
