import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import prisma from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
})

type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    logger.error('Error fetching user profile', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input = ProfileUpdateSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        name: input.name,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    logger.info('User profile updated', { userId: ctx.userId })

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    logger.error('Error updating user profile', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
