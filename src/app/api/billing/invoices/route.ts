import { NextResponse, type NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId } = requireTenantContext()

      const invoices = [
        {
          id: 'inv_1',
          invoiceNumber: 'INV-2024-001',
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 299.99,
          status: 'paid' as const,
          currency: 'USD',
          pdfUrl: '/api/billing/invoices/inv_1/download',
        },
        {
          id: 'inv_2',
          invoiceNumber: 'INV-2024-002',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 299.99,
          status: 'paid' as const,
          currency: 'USD',
          pdfUrl: '/api/billing/invoices/inv_2/download',
        },
        {
          id: 'inv_3',
          invoiceNumber: 'INV-2024-003',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 149.99,
          status: 'pending' as const,
          currency: 'USD',
          pdfUrl: '/api/billing/invoices/inv_3/download',
        },
        {
          id: 'inv_4',
          invoiceNumber: 'INV-2024-004',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 99.99,
          status: 'overdue' as const,
          currency: 'USD',
          pdfUrl: '/api/billing/invoices/inv_4/download',
        },
      ]

      return NextResponse.json({
        invoices,
        total: invoices.length,
      })
    } catch (error) {
      console.error('Billing API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
)
