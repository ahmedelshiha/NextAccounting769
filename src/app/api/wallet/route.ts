import { NextRequest, NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId } = requireTenantContext()

      const paymentMethods = [
        {
          id: 'pm_1',
          type: 'card' as const,
          lastDigits: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'pm_2',
          type: 'card' as const,
          lastDigits: '5555',
          brand: 'Mastercard',
          expiryMonth: 6,
          expiryYear: 2026,
          isDefault: false,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]

      const invoices = [
        {
          id: 'inv_1',
          invoiceNumber: 'INV-2024-001',
          amount: 299.99,
          currency: 'USD',
          status: 'paid' as const,
          dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Professional Plan - Monthly',
        },
        {
          id: 'inv_2',
          invoiceNumber: 'INV-2024-002',
          amount: 149.99,
          currency: 'USD',
          status: 'pending' as const,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Professional Plan - Monthly',
        },
      ]

      return NextResponse.json({
        paymentMethods,
        invoices,
        balance: 2500.0,
        currency: 'USD',
      })
    } catch (error) {
      console.error('Wallet API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);
