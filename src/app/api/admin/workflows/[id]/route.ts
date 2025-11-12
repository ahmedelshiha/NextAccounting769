import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withAdminAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: AuthenticatedRequest, context: any) => {
  try {
    const { id } = context?.params || {}

    const workflow = await prisma.workflow.findUnique({
      where: { id }
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Failed to fetch workflow:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
})

export const PUT = withAdminAuth(async (req: AuthenticatedRequest, context: any) => {
  try {
    const { id } = context?.params || {}
    const body = await req.json()
    const { name, description, nodes, edges, status } = body

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(nodes && { nodes }),
        ...(edges && { edges }),
        ...(status && { status }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Failed to update workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
})

export const DELETE = withAdminAuth(async (req: AuthenticatedRequest, context: any) => {
  try {
    const { id } = context?.params || {}

    await prisma.workflow.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete workflow:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
})

export const revalidate = 60
