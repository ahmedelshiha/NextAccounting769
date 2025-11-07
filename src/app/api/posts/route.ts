import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Prisma, PostStatus, PostPriority } from '@prisma/client'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import { requireTenantContext } from '@/lib/tenant-utils'
import { getTenantFromRequest, tenantFilter, isMultiTenancyEnabled } from '@/lib/tenant'
import { hasRole } from '@/lib/permissions'

// GET /api/posts - Get blog posts
export const GET = withTenantContext(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')
    const featured = searchParams.get('featured')
    const tag = searchParams.get('tag')
    const limit = searchParams.get('limit')
    const skip = searchParams.get('skip')

    const where: Prisma.PostWhereInput = {}

    // Apply tenant hint only when applicable (helper returns {} when disabled)
    const tenantId = getTenantFromRequest(request as any)
    Object.assign(where, tenantFilter(tenantId) as any)

    // Determine role from tenant context when available
    const role = tenantContext.getContextOrNull()?.role ?? null
    if (!role || !hasRole(role, ['ADMIN', 'STAFF'])) {
      where.published = true
    } else if (published !== null) {
      where.published = published === 'true'
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (tag) {
      where.tags = { has: tag }
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: [
        { featured: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}, { requireAuth: false })

// POST /api/posts - Create a new blog post (admin/staff only)
export const POST = withTenantContext(async (request: NextRequest) => {
  try {
    const ctx = requireTenantContext()
    if (!hasRole(String(ctx.role || ''), ['ADMIN', 'STAFF'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const {
      title,
      slug,
      content,
      excerpt,
      published = false,
      featured = false,
      coverImage,
      seoTitle,
      seoDescription,
      tags = [],
      readTime,
      // Advanced fields (optional on create)
      status,
      archived = false,
      scheduledAt,
      priority,
      category,
      reviewRequired = false,
      isCompliant = true,
      approvedBy,
      version,
      shares,
      comments,
    } = body

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists (optionally scoped by tenant if applicable)
    const existingPost = await prisma.post.findUnique({ where: { slug } })
    if (existingPost) {
      return NextResponse.json(
        { error: 'Post with this slug already exists' },
        { status: 400 }
      )
    }

    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : undefined
    let finalStatus: PostStatus = (normalizedStatus as PostStatus) || (published ? 'PUBLISHED' : (scheduledAt ? 'SCHEDULED' : 'DRAFT'))
    if (archived) finalStatus = 'ARCHIVED'

    const createData: Prisma.PostUncheckedCreateInput = {
      title,
      slug,
      content,
      excerpt,
      published,
      featured,
      coverImage,
      seoTitle,
      seoDescription,
      tags,
      readTime: readTime ? parseInt(readTime) : null,
      authorId: String(ctx.userId ?? ''),
      publishedAt: published || finalStatus === 'PUBLISHED' ? new Date() : null,
      status: finalStatus,
      archived,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      priority: typeof priority === 'string' ? (priority.toUpperCase() as PostPriority) : (priority as PostPriority | undefined),
      category: category ?? null,
      reviewRequired,
      isCompliant,
      approvedBy: approvedBy ?? null,
      version: typeof version === 'number' ? version : undefined,
      shares: typeof shares === 'number' ? shares : undefined,
      comments: typeof comments === 'number' ? comments : undefined,
    }

    // For tenant-scoped deployments, attach tenantId from verified context
    if (isMultiTenancyEnabled() && (createData as any).tenantId == null) {
      // Only set if Post model supports tenantId in current schema
      try {
        ;(createData as any).tenantId = (ctx as any).tenantId
      } catch {}
    }

    const post = await prisma.post.create({
      data: createData,
      include: { author: { select: { id: true, name: true, image: true } } },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}, { allowedRoles: ['ADMIN', 'STAFF'] })
