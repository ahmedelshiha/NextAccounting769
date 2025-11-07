import { notFound } from 'next/navigation'
import Image from 'next/image'
import prisma from '@/lib/prisma'

// Next may pass Promise-like params; accept any and resolve safely

export default async function PostPage({ params }: any) {
  const resolved = (await Promise.resolve(params)) as { slug?: string }
  const slug = String(resolved?.slug || '')

  // Fetch post directly from the database on the server to avoid making internal HTTP requests
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: { select: { id: true, name: true, image: true } } }
  })

  if (!post || !post.published) return notFound()

  // Increment views (best-effort, ignore errors)
  try {
    await prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } })
  } catch {
    // ignore
  }

  const contentHtml = post.content
    ? post.content
        .split('\n\n')
        .map((p: string) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
        .join('')
    : ''

  const displayDate = post.publishedAt ?? post.createdAt ?? new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <article className="bg-white rounded-lg shadow-sm p-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
            <div className="text-sm text-gray-500 flex items-center gap-4">
              <span>{post.author?.name || 'Author'}</span>
              <span>•</span>
              <span>{new Date(displayDate).toLocaleDateString()}</span>
              <span>•</span>
              <span>{post.readTime ? `${post.readTime} min read` : ''}</span>
            </div>
          </header>

          {post.coverImage && (
            <div className="mb-6">
              <Image src={post.coverImage} alt={post.title} width={1200} height={400} className="w-full h-64 object-cover rounded" />
            </div>
          )}

          <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </article>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: any) {
  const resolved = (await Promise.resolve(params)) as { slug?: string }
  const slug = String(resolved?.slug || '')
  const post = await prisma.post.findUnique({ where: { slug } })
  if (!post) return {}

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
  }
}
