import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Search, TrendingUp, FileText, Calculator } from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export const revalidate = 60

type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt?: string
  content?: string
  coverImage?: string
  author?: { name?: string; image?: string }
  publishedAt?: string | Date
  readTime?: number
  tags: string[]
  featured?: boolean
  views?: number
}

export default async function BlogPage() {
  let featuredPost: BlogPost | null = null
  let recentPosts: BlogPost[] = []

  const hasDb = !!process.env.NETLIFY_DATABASE_URL || (process.env.NODE_ENV === 'production' && !process.env.CI)

  if (hasDb) {
    try {
      const [featured, recents] = await Promise.all([
        prisma.post.findFirst({
          where: { published: true, featured: true },
          include: { author: { select: { name: true, image: true } } },
          orderBy: { publishedAt: 'desc' },
        }),
        prisma.post.findMany({
          where: { published: true },
          include: { author: { select: { name: true, image: true } } },
          orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
          take: 6,
        }),
      ])

      featuredPost = (featured ?? null) as unknown as BlogPost | null
      recentPosts = recents as unknown as BlogPost[]

      if (!featuredPost && recentPosts.length > 0) featuredPost = recentPosts[0]
    } catch (error) {
      console.error('Error fetching posts for blog page:', error)
    }
  } else {
    featuredPost = {
      id: '1',
      slug: '2024-tax-planning-strategies-for-small-businesses',
      title: '2024 Tax Planning Strategies for Small Businesses',
      excerpt: 'Discover essential tax planning strategies that can help your small business save money and stay compliant in 2024. Learn about new deductions, credits, and planning opportunities.',
      content: '',
      coverImage: '/api/placeholder/800/400',
      author: { name: 'Sarah Johnson' },
      publishedAt: '2024-01-15',
      readTime: 8,
      tags: ['Tax Planning', 'Small Business', 'Strategy'],
      featured: true,
      views: 1250
    }

    recentPosts = [
      { id: '2', slug: 'understanding-quickbooks-a-complete-guide-for-beginners', title: 'Understanding QuickBooks: A Complete Guide for Beginners', excerpt: 'Master the basics of QuickBooks with our comprehensive guide. Learn how to set up your account, manage transactions, and generate reports.', author: { name: 'Emily Rodriguez' }, publishedAt: '2024-01-10', readTime: 6, tags: ['QuickBooks', 'Bookkeeping', 'Tutorial'], views: 890 },
      { id: '3', slug: 'year-end-financial-checklist-for-business-owners', title: 'Year-End Financial Checklist for Business Owners', excerpt: 'Ensure your business is ready for year-end with this comprehensive financial checklist. Don\'t miss important deadlines and opportunities.', author: { name: 'Michael Chen' }, publishedAt: '2024-01-05', readTime: 5, tags: ['Year-End', 'Checklist', 'Business'], views: 1100 },
      { id: '4', slug: 'benefits-of-outsourcing-payroll-management', title: 'The Benefits of Outsourcing Your Payroll Management', excerpt: 'Learn why many businesses are choosing to outsource their payroll and how it can save time, reduce errors, and ensure compliance.', author: { name: 'Sarah Johnson' }, publishedAt: '2024-01-01', readTime: 7, tags: ['Payroll', 'Outsourcing', 'Business'], views: 750 },
      { id: '5', slug: 'cash-flow-management-tips-for-growing-businesses', title: 'Cash Flow Management Tips for Growing Businesses', excerpt: 'Effective cash flow management is crucial for business growth. Discover proven strategies to improve your cash flow and financial stability.', author: { name: 'Emily Rodriguez' }, publishedAt: '2023-12-28', readTime: 6, tags: ['Cash Flow', 'Growth', 'Finance'], views: 920 },
      { id: '6', slug: 'common-accounting-mistakes-and-how-to-avoid-them', title: 'Common Accounting Mistakes and How to Avoid Them', excerpt: 'Avoid costly accounting mistakes with our expert guide. Learn about the most common errors and how to prevent them in your business.', author: { name: 'Michael Chen' }, publishedAt: '2023-12-25', readTime: 5, tags: ['Accounting', 'Mistakes', 'Tips'], views: 680 }
    ]
  }

  const categories = [
    { name: 'Tax Planning', count: 12, icon: Calculator },
    { name: 'Bookkeeping', count: 8, icon: FileText },
    { name: 'Business Growth', count: 6, icon: TrendingUp },
    { name: 'Compliance', count: 4, icon: FileText }
  ]

  const popularTags = [
    'Tax Planning', 'Small Business', 'QuickBooks', 'Payroll', 'Cash Flow',
    'Year-End', 'Compliance', 'Bookkeeping', 'Growth', 'Strategy'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Accounting Insights & Tips
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Stay informed with the latest accounting news, tax updates, and business 
              financial strategies from our expert team.
            </p>
            <div className="mt-8 max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Article</h2>
              <Card className="overflow-hidden">
                <div className="aspect-video bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <FileText className="h-16 w-16 text-white" />
                </div>
{featuredPost && (
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{featuredPost?.author?.name || 'Author'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{featuredPost?.publishedAt ? new Date(featuredPost.publishedAt as unknown as string | Date).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{featuredPost?.readTime ?? 0} min read</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {featuredPost?.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {featuredPost?.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {featuredPost?.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button asChild>
                      <Link href={`/blog/${featuredPost?.slug}`}>Read More</Link>
                    </Button>
                  </div>
                </CardContent>
              )}
              </Card>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentPosts.map((post) => (
                  <Card key={post.slug} className="h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{post.author?.name || 'Author'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{post.publishedAt ? new Date(post.publishedAt as unknown as string | Date).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg leading-tight">
                        <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                          {post.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4 text-sm">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime} min</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-8">
                <Button variant="outline" size="lg">
                  Load More Articles
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const IconComponent = category.icon
                    return (
                      <Link
                        key={category.name}
                        href={`/blog/category/${category.name.toLowerCase().replace(' ', '-')}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-700">{category.name}</span>
                        </div>
                        <Badge variant="secondary">{category.count}</Badge>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle>Stay Updated</CardTitle>
                <p className="text-sm text-gray-600">
                  Get the latest accounting tips and insights delivered to your inbox.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                  />
                  <Button className="w-full">
                    Subscribe
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Popular</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPosts.slice(0, 3).map((post, index) => (
                    <div key={post.slug} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                        >
                          {post.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          {post.views} views
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Need Professional Accounting Help?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Our expert team is ready to help you with all your accounting needs
          </p>
          <div className="mt-8">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact">Get Free Consultation</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export const metadata = {
  title: 'Blog - Accounting Tips & Insights | Accounting Firm',
  description: 'Stay informed with the latest accounting news, tax updates, and business financial strategies from our expert CPA team.',
  keywords: 'accounting blog, tax tips, bookkeeping advice, business finance, CPA insights, financial planning',
}
