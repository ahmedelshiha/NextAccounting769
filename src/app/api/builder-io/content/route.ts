import { NextRequest, NextResponse } from 'next/server'
import { getBuilderConfig } from '@/lib/builder-io/config'

/**
 * API endpoint to fetch Builder.io content
 *
 * GET /api/builder-io/content?model=MODEL_NAME&space=SPACE_ID
 *
 * This endpoint proxies requests to Builder.io API to fetch model content.
 * All requests are cached for 5 minutes to reduce API calls.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const model = searchParams.get('model')
    const space = searchParams.get('space')

    if (!model || !space) {
      return NextResponse.json(
        { error: 'Missing required parameters: model and space' },
        { status: 400 }
      )
    }

    const config = getBuilderConfig()

    if (!config.isEnabled) {
      return NextResponse.json(
        { error: 'Builder.io is not configured' },
        { status: 503 }
      )
    }

    // Fetch from Builder.io API
    const response = await fetch(
      `https://cdn.builder.io/api/v3/content/${model}?apiKey=${config.apiKey}&space=${space}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error(`Builder.io API error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: 'Failed to fetch content from Builder.io' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Cache response for 5 minutes
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300'
      }
    })
  } catch (error) {
    console.error('Builder.io content endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
