import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    const documents = [
      {
        id: 'doc_1',
        name: 'VAT Return - January 2024.pdf',
        type: 'pdf',
        size: 1024000,
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isStarred: true,
        category: 'VAT Return',
      },
      {
        id: 'doc_2',
        name: 'Bank Statement - Accounts.xlsx',
        type: 'xlsx',
        size: 2048000,
        uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        isStarred: false,
        category: 'Bank Statement',
      },
      {
        id: 'doc_3',
        name: 'Trade License Copy.pdf',
        type: 'pdf',
        size: 512000,
        uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        isStarred: true,
        category: 'Registration',
      },
    ].slice(0, limit)

    return NextResponse.json({
      documents,
      total: documents.length,
    })
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
