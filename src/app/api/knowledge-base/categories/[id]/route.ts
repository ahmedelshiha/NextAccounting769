import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  order: z.number().optional(),
  published: z.boolean().optional(),
})

type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>

export const GET = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params

    // Fetch category with article count
    const category = await prisma.knowledgeBaseCategory.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        order: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { articles: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        ...category,
        articleCount: category._count.articles,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Knowledge Base category detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params
    const body = await request.json()
    const validated = UpdateCategorySchema.parse(body)

    // Verify category exists and belongs to tenant
    const category = await prisma.knowledgeBaseCategory.findFirst({
      where: { id, tenantId },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Update category
    const updatedCategory = await prisma.knowledgeBaseCategory.update({
      where: { id },
      data: validated,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        order: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await logAuditSafe({
      action: 'knowledge_base:category:update',
      details: {
        categoryId: id,
        name: updatedCategory.name,
        changes: Object.keys(validated),
      },
    }).catch(() => {})

    return NextResponse.json(updatedCategory, { status: 200 })
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

    console.error('Knowledge Base category update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const DELETE = withTenantContext(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const ctx = requireTenantContext()

    if (!ctx?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ctx.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })
    }

    const { id } = params

    // Verify category exists and belongs to tenant
    const category = await prisma.knowledgeBaseCategory.findFirst({
      where: { id, tenantId },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if category has articles
    const articleCount = await prisma.knowledgeBaseArticle.count({
      where: { categoryId: id },
    })

    if (articleCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with articles. Please move or delete articles first.',
        },
        { status: 409 }
      )
    }

    // Delete category
    await prisma.knowledgeBaseCategory.delete({
      where: { id },
    })

    await logAuditSafe({
      action: 'knowledge_base:category:delete',
      details: {
        categoryId: id,
        name: category.name,
      },
    }).catch(() => {})

    return NextResponse.json(
      { success: true, message: 'Category deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Knowledge Base category delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
