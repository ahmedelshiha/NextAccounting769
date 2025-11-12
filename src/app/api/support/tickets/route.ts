import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tickets = [
      {
        id: 'tkt_1',
        ticketNumber: 'TK-2024-001',
        subject: 'VAT return filing issue',
        status: 'resolved' as const,
        priority: 'high' as const,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        sla: 'Resolved',
      },
      {
        id: 'tkt_2',
        ticketNumber: 'TK-2024-002',
        subject: 'Registration document upload error',
        status: 'in-progress' as const,
        priority: 'medium' as const,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        sla: 'Response due in 4 hours',
      },
    ]

    return NextResponse.json({
      tickets,
      total: tickets.length,
    })
  } catch (error) {
    console.error('Support tickets API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, description } = await request.json()

    if (!subject || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const ticket = {
      id: `tkt_${Date.now()}`,
      ticketNumber: `TK-${new Date().getFullYear()}-${Math.floor(Math.random() * 999)}`,
      subject,
      status: 'open' as const,
      priority: 'medium' as const,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      sla: 'Response expected in 24 hours',
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
