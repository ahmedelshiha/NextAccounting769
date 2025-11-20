import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const UpdatePaymentMethodSchema = z.object({
  setAsDefault: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export const PATCH = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()
      const { id } = params
      const body = await request.json()
      const validated = UpdatePaymentMethodSchema.parse(body)

      const paymentMethod = await prisma.userPaymentMethod.findFirst({
        where: { id, userId: userId!, tenantId: tenantId! },
      })

      if (!paymentMethod) {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
      }

      if (validated.setAsDefault) {
        await prisma.userPaymentMethod.updateMany({
          where: { userId: userId!, tenantId: tenantId!, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        })
      }

      const updated = await prisma.userPaymentMethod.update({
        where: { id },
        data: {
          ...(validated.setAsDefault !== undefined && { isDefault: validated.setAsDefault }),
          ...(validated.status !== undefined && { status: validated.status }),
        },
      })

      await logAuditSafe({
        action: 'payment_methods:update',
        details: { paymentMethodId: id, updates: Object.keys(validated) },
      }).catch(() => {})

      return NextResponse.json(updated, { status: 200 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', details: error.issues }, { status: 400 })
      }
      console.error('Payment method update API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);

export const DELETE = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()
      const { id } = params

      const paymentMethod = await prisma.userPaymentMethod.findFirst({
        where: { id, userId: userId!, tenantId: tenantId! },
      })

      if (!paymentMethod) {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
      }

      await prisma.userPaymentMethod.update({
        where: { id },
        data: { status: 'INACTIVE' },
      })

      await logAuditSafe({
        action: 'payment_methods:delete',
        details: { paymentMethodId: id },
      }).catch(() => {})

      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
      console.error('Payment method delete API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);
