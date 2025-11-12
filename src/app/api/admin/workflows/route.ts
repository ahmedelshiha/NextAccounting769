import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdminAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = status ? { status } : {}

    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.workflow.count({ where })

    return NextResponse.json({
      data: workflows,
      pagination: { total, limit, offset }
    })
  } catch (error) {
    console.error('Failed to fetch workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
})

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { name, description, nodes, edges } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      )
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        nodes: nodes || [],
        edges: edges || [],
        status: 'DRAFT',
        version: 1
      }
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Failed to create workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
})

export const revalidate = 60
