import Link from 'next/link'
import { ArrowRight, Calendar, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | null
  createdAt: Date
  readTime: number | null
  tags: string[]
  author: { name: string | null; image: string | null } | null
}

export default function BlogCard({ post }: { post: BlogPost }) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
  }

  return (
    <Card role="article" aria-labelledby={`post-${post.id}-title`} className="article-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg overflow-hidden">
      <div className="article-visual h-40 bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
        <div className="article-visual__overlay absolute inset-0 bg-blue-600 opacity-10 transition-opacity"></div>
        <div className="article-tags absolute bottom-4 left-4">
          {(post.tags || []).slice(0, 2).map((tag) => (
            <span key={tag} className="tag-pill inline-block bg-white/90 text-blue-600 px-2 py-1 rounded text-xs font-medium mr-2">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle id={`post-${post.id}-title`} className="text-xl font-semibold text-gray-900 transition-colors line-clamp-2">
          <Link href={`/blog/${post.slug}`} className="hover:text-blue-600">{post.title}</Link>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <CardDescription className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">{post.excerpt}</CardDescription>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            </div>
            {post.readTime && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{post.readTime} min read</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="author-avatar__wrapper w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-sm text-gray-700">{post.author?.name || 'Author'}</span>
          </div>

          <Button variant="ghost" size="sm" className="read-more-btn transition-colors p-0 hover:text-blue-600" asChild>
            <Link href={`/blog/${post.slug}`} aria-label={`Read more: ${post.title}`}>
              Read More
              <ArrowRight className="ml-1 h-3 w-3 transition-transform" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
