import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, User } from 'lucide-react'
import type { Prisma } from '@prisma/client'

export const revalidate = 60

interface Props {
  params: { slug: string }
}

function mapCategoryToTag(slug: string): { label: string; tag: string | null } {
  switch (slug) {
    case 'tax-planning':
      return { label: 'Tax Planning', tag: 'tax' }
    case 'bookkeeping':
      return { label: 'Bookkeeping', tag: 'bookkeeping' }
    case 'business-growth':
      return { label: 'Business Growth', tag: 'financial-management' }
    case 'compliance':
      return { label: 'Compliance', tag: 'compliance' }
    default:
      return { label: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), tag: null }
  }
}

import prisma from '@/lib/prisma'

export default async function CategoryPage({ params }: any) {
  const { slug } = (await Promise.resolve(params)) as { slug?: string }
  const { label, tag } = mapCategoryToTag(slug ?? '')

  let posts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: string | Date | null
    createdAt: string | Date
    readTime: number | null
    tags: string[]
    author: { name: string | null; image: string | null } | null
  }> = []

  try {
    const where: Prisma.PostWhereInput = { published: true }
    if (tag) where.tags = { has: tag }
    posts = await prisma.post.findMany({ where, include: { author: { select: { name: true, image: true } } }, orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }], take: 24 }) as unknown as typeof posts
  } catch {
    // ignore
  }

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{label}</h1>
          <p className="text-gray-600 mt-2">Articles related to {label.toLowerCase()}.</p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center text-gray-600">No articles found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-600 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                  <div className="absolute bottom-4 left-4">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="inline-block bg-white/90 text-blue-600 px-2 py-1 rounded text-xs font-medium mr-2">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </CardDescription>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                      {post.readTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{post.readTime} min</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Badge variant="secondary">
            <Link href="/blog">← Back to Blog</Link>
          </Badge>
        </div>
      </div>
    </section>
  )
}
