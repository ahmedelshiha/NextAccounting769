import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth-middleware'
import { advancedSearchService } from '@/services/advanced-search.service'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    if (!query || query.length < 2) {
      const suggestions = await advancedSearchService.getPopularSearches(10)
      return NextResponse.json({ suggestions })
    }

    const [results, suggestions] = await Promise.all([
      advancedSearchService.search(query, limit),
      advancedSearchService.getSuggestions(query, 10)
    ])

    return NextResponse.json({
      results,
      suggestions,
      totalResults: results.length
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
})

export const revalidate = 60
