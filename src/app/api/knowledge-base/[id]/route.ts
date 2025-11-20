import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const UpdateArticleSchema = z.object({
  title: z.string().min(5).max(500).optional(),
  content: z.string().min(20).optional(),
  excerpt: z.string().max(1000).optional().nullable(),
  categoryId: z.string().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  relatedArticleIds: z.array(z.string()).optional(),
})

type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>

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

    // Fetch article
    const article = await prisma.knowledgeBaseArticle.findFirst({
      where: { id, tenantId },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        author: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Increment view count
    await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(article, { status: 200 })
  } catch (error) {
    console.error('Knowledge Base detail API error:', error)
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
    const validated = UpdateArticleSchema.parse(body)

    // Verify article exists and belongs to tenant
    const article = await prisma.knowledgeBaseArticle.findFirst({
      where: { id, tenantId },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // If category is being changed, verify it exists
    if (validated.categoryId) {
      const category = await prisma.knowledgeBaseCategory.findFirst({
        where: {
          id: validated.categoryId,
          tenantId,
        },
      })

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
    }

    // Update article
    const updateData: any = {
      ...validated,
      publishedAt:
        validated.published && !article.publishedAt ? new Date() : article.publishedAt,
    }

    const updatedArticle = await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        author: {
          select: { id: true, email: true, name: true },
        },
      },
    })

    await logAuditSafe({
      action: 'knowledge_base:article:update',
      details: {
        articleId: id,
        title: updatedArticle.title,
        changes: Object.keys(validated),
      },
    }).catch(() => {})

    return NextResponse.json(updatedArticle, { status: 200 })
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

    console.error('Knowledge Base update API error:', error)
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

    // Verify article exists and belongs to tenant
    const article = await prisma.knowledgeBaseArticle.findFirst({
      where: { id, tenantId },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Delete article
    await prisma.knowledgeBaseArticle.delete({
      where: { id },
    })

    await logAuditSafe({
      action: 'knowledge_base:article:delete',
      details: {
        articleId: id,
        title: article.title,
      },
    }).catch(() => {})

    return NextResponse.json(
      { success: true, message: 'Article deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Knowledge Base delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
