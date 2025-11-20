import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { getStripeClient } from '@/lib/payments/stripe-client'

const AddPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
  setAsDefault: z.boolean().default(false),
})

export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    // Fetch user's payment methods
    const paymentMethods = await prisma.userPaymentMethod.findMany({
      where: {
        userId: ctx.userId,
        tenantId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        type: true,
        isDefault: true,
        last4: true,
        brand: true,
        expiryMonth: true,
        expiryYear: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    await logAuditSafe({
      action: 'payment_methods:list',
      details: {
        count: paymentMethods.length,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        paymentMethods,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Payment methods list API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = AddPaymentMethodSchema.parse(body)

    // Verify payment method exists in Stripe
    let stripePaymentMethod: any
    try {
      const stripe = getStripeClient()
      stripePaymentMethod = await stripe.paymentMethods.retrieve(
        validated.paymentMethodId
      )
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      )
    }

    // Check for duplicate
    const existing = await prisma.userPaymentMethod.findFirst({
      where: {
        userId: ctx.userId,
        paymentMethodId: validated.paymentMethodId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This payment method is already saved' },
        { status: 409 }
      )
    }

    // If setting as default, unset previous default
    if (validated.setAsDefault) {
      await prisma.userPaymentMethod.updateMany({
        where: {
          userId: ctx.userId,
          tenantId,
          isDefault: true,
        },
        data: { isDefault: false },
      })
    }

    // Extract payment method details
    let last4 = ''
    let brand = ''
    let expiryMonth: number | undefined
    let expiryYear: number | undefined

    if (stripePaymentMethod.card) {
      last4 = stripePaymentMethod.card.last4
      brand = stripePaymentMethod.card.brand
      expiryMonth = stripePaymentMethod.card.exp_month
      expiryYear = stripePaymentMethod.card.exp_year
    } else if (stripePaymentMethod.us_bank_account) {
      last4 = stripePaymentMethod.us_bank_account.last4 ?? ''
      brand = 'bank_account'
    }

    // Save payment method
    const paymentMethod = await prisma.userPaymentMethod.create({
      data: {
        userId: ctx.userId,
        tenantId,
        paymentMethodId: validated.paymentMethodId,
        type: stripePaymentMethod.type,
        isDefault: validated.setAsDefault,
        last4,
        brand,
        expiryMonth,
        expiryYear,
        fingerprint: `${stripePaymentMethod.id}_${Date.now()}`.substring(0, 255),
      },
      select: {
        id: true,
        type: true,
        isDefault: true,
        last4: true,
        brand: true,
        expiryMonth: true,
        expiryYear: true,
        createdAt: true,
      },
    })

    await logAuditSafe({
      action: 'payment_methods:add',
      details: {
        paymentMethodId: validated.paymentMethodId,
        type: stripePaymentMethod.type,
        last4,
      },
    }).catch(() => {})

    return NextResponse.json(paymentMethod, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    console.error('Payment methods add API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
