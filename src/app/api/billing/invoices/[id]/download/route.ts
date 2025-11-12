import { NextResponse, type NextRequest } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

export const GET = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId } = requireTenantContext()

      return new NextResponse(Buffer.from('PDF invoice content'), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${params.id}.pdf"`,
        },
      })
    } catch (error) {
      console.error('Invoice download error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
)
