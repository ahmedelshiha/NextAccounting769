import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { logAuditSafe } from '@/lib/observability-helpers'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const ArticleFilterSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  published: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'viewCount', 'helpfulCount']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  tag: z.string().optional(),
})

const CreateArticleSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(5).max(500),
  content: z.string().min(20),
  excerpt: z.string().max(1000).optional(),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  relatedArticleIds: z.array(z.string()).default([]),
})

type CreateArticleInput = z.infer<typeof CreateArticleSchema>

export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId, tenantId } = requireTenantContext()

      if (!userId || !tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Parse filters
      const queryParams = Object.fromEntries(request.nextUrl.searchParams)
      const filters = ArticleFilterSchema.parse(queryParams)

      // Build where clause
      const where: any = { tenantId }

      if (filters.categoryId) {
        where.categoryId = filters.categoryId
      }

      if (filters.published !== undefined) {
        where.published = filters.published
      }

      if (filters.featured !== undefined) {
        where.featured = filters.featured
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } },
          { excerpt: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      if (filters.tag) {
        where.tags = {
          has: filters.tag,
        }
      }

      // Count total
      const total = await prisma.knowledgeBaseArticle.count({ where })

      // Fetch articles
      const articles = await prisma.knowledgeBaseArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          published: true,
          featured: true,
          viewCount: true,
          helpfulCount: true,
          notHelpfulCount: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          author: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: {
          [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
        },
        take: filters.limit,
        skip: filters.offset,
      })

      await logAuditSafe({
        action: 'knowledge_base:articles:list',
        details: {
          count: articles.length,
          total,
          filters: {
            search: filters.search ? true : false,
            categoryId: filters.categoryId || undefined,
            published: filters.published || undefined,
          },
        },
      }).catch(() => {})

      return NextResponse.json(
        {
          articles,
          pagination: {
            total,
            limit: filters.limit,
            offset: filters.offset,
            hasMore: (filters.offset ?? 0) + (filters.limit ?? 0) < total,
          },
        },
        { status: 200 }
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: error.issues,
          },
          { status: 400 }
        )
      }

      console.error('Knowledge Base list API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);

export const POST = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId, tenantId } = requireTenantContext()

      if (!userId || !tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await request.json()
      const validated = CreateArticleSchema.parse(body)

      // Verify category exists and belongs to tenant
      const category = await prisma.knowledgeBaseCategory.findFirst({
        where: {
          id: validated.categoryId,
          tenantId,
        },
      })

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }

      // Generate slug from title
      const slug = validated.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // Check for duplicate slug
      const existing = await prisma.knowledgeBaseArticle.findFirst({
        where: {
          tenantId,
          slug,
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'An article with this title already exists' },
          { status: 409 }
        )
      }

      // Create article
      const article = await prisma.knowledgeBaseArticle.create({
        data: {
          ...validated,
          slug,
          tenantId,
          authorId: userId,
          publishedAt: validated.published ? new Date() : null,
        },
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
        action: 'knowledge_base:article:create',
        details: {
          articleId: article.id,
          title: article.title,
          categoryId: article.categoryId,
          published: article.published,
        },
      }).catch(() => {})

      return NextResponse.json(article, { status: 201 })
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

      console.error('Knowledge Base create API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);
