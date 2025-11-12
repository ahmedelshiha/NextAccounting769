import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { Prisma, PostStatus, PostPriority } from '@prisma/client'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import { requireTenantContext } from '@/lib/tenant-utils'
import { getTenantFromRequest, tenantFilter } from '@/lib/tenant'
import { hasRole } from '@/lib/permissions'

// GET /api/posts/[slug] - Get post by slug
export const GET = withTenantContext(async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
  try {
    const { slug } = await context.params

    const tenantId = getTenantFromRequest(request as any)
    const where: Prisma.PostWhereInput = { slug, ...(tenantFilter(tenantId) as any) }

    const role = tenantContext.getContextOrNull()?.role ?? null
    if (!role || !hasRole(role, ['ADMIN', 'STAFF'])) {
      where.published = true
    }

    const post = await prisma.post.findFirst({
      where,
      include: { author: { select: { id: true, name: true, image: true } } },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}, { requireAuth: false })

// PUT /api/posts/[slug] - Update post (admin/staff only)
export const PUT = withTenantContext(async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
  try {
    const ctx = requireTenantContext()
    if (!hasRole(String(ctx.role || ''), ['ADMIN', 'STAFF'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await context.params
    const body = await request.json()

    const {
      title,
      content,
      excerpt,
      published,
      featured,
      coverImage,
      seoTitle,
      seoDescription,
      tags,
      readTime,
      status,
      archived,
      scheduledAt,
      priority,
      category,
      reviewRequired,
      isCompliant,
      approvedBy,
      version,
      shares,
      comments,
    } = body

    const tenantId = getTenantFromRequest(request as any)
    const existingPost = await prisma.post.findFirst({ where: { slug, ...(tenantFilter(tenantId) as any) } })
    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const updateData: Prisma.PostUpdateInput = {} as Prisma.PostUpdateInput

    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (published !== undefined) {
      updateData.published = published
      if (published && !existingPost.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    if (featured !== undefined) updateData.featured = featured
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription
    if (tags !== undefined) updateData.tags = tags
    if (readTime !== undefined) updateData.readTime = readTime ? parseInt(readTime) : null

    if (status !== undefined) updateData.status = (typeof status === 'string' ? (status.toUpperCase() as PostStatus) : (status as PostStatus))
    if (archived !== undefined) updateData.archived = archived
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (priority !== undefined) updateData.priority = (typeof priority === 'string' ? (priority.toUpperCase() as PostPriority) : (priority as PostPriority))
    if (category !== undefined) updateData.category = category
    if (reviewRequired !== undefined) updateData.reviewRequired = reviewRequired
    if (isCompliant !== undefined) updateData.isCompliant = isCompliant
    if (approvedBy !== undefined) updateData.approvedBy = approvedBy
    if (version !== undefined) updateData.version = version
    if (shares !== undefined) updateData.shares = shares
    if (comments !== undefined) updateData.comments = comments

    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : status
    if (normalizedStatus === 'PUBLISHED' && !existingPost.publishedAt) {
      updateData.publishedAt = new Date()
      updateData.published = true
    }

    const post = await prisma.post.update({
      where: { id: existingPost.id },
      data: updateData,
      include: { author: { select: { id: true, name: true, image: true } } },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}, { allowedRoles: ['ADMIN', 'STAFF'] })

// DELETE /api/posts/[slug] - Delete post (admin only)
export const DELETE = withTenantContext(async (request: NextRequest, context: { params: Promise<{ slug: string }> }) => {
  try {
    const ctx = requireTenantContext()
    if (String(ctx.role || '') !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await context.params
    const tenantId = getTenantFromRequest(request as any)
    const existing = await prisma.post.findFirst({ where: { slug, ...(tenantFilter(tenantId) as any) } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    await prisma.post.delete({ where: { id: existing.id } })
    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}, { allowedRoles: ['ADMIN'] })
