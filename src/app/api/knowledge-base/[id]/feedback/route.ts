import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'

const FeedbackSchema = z.object({
  type: z.enum(['helpful', 'not_helpful']),
})

export const POST = withTenantContext(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const { userId, tenantId } = requireTenantContext()
      const { id } = params

      if (!id || !tenantId) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
      }

      const body = await request.json()
      const validated = FeedbackSchema.parse(body)

      const article = await prisma.knowledgeBaseArticle.findFirst({
        where: { id, tenantId },
      })

      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }

      if (validated.type === 'helpful') {
        await prisma.knowledgeBaseArticle.update({
          where: { id },
          data: { helpfulCount: { increment: 1 } },
        })
      } else {
        await prisma.knowledgeBaseArticle.update({
          where: { id },
          data: { notHelpfulCount: { increment: 1 } },
        })
      }

      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request body', details: error.issues }, { status: 400 })
      }
      console.error('KB feedback API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  },
  { requireAuth: true }
);
