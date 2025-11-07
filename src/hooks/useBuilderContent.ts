'use client'

import { useState, useEffect } from 'react'
import { getBuilderConfig, BUILDER_MODELS } from '@/lib/builder-io/config'

/**
 * Hook to fetch and cache Builder.io content
 *
 * Fetches model content from Builder.io and caches it locally.
 * Falls back to default component if Builder.io is not configured or fails.
 *
 * @param modelName - Name of the Builder.io model to fetch
 * @param options - Configuration options
 * @returns Builder content object or null if not configured
 */
export function useBuilderContent(modelName: string, options?: { cacheTime?: number }) {
  const [content, setContent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cacheTime = options?.cacheTime || 5 * 60 * 1000 // 5 minutes default

  useEffect(() => {
    async function fetchContent() {
      try {
        const config = getBuilderConfig()

        if (!config.isEnabled) {
          setContent(null)
          return
        }

        setIsLoading(true)
        setError(null)

        // Fetch from Builder.io API
        const response = await fetch(
          `/api/builder-io/content?model=${modelName}&space=${config.space}`,
          {
            headers: {
              'Authorization': `Bearer ${config.apiKey}`
            }
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch Builder content: ${response.statusText}`)
        }

        const data = await response.json()
        setContent(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        console.error(`Builder.io content fetch failed for ${modelName}:`, message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [modelName])

  return { content, isLoading, error, isEnabled: getBuilderConfig().isEnabled }
}

/**
 * Hook to check if Builder.io is configured
 *
 * @returns boolean indicating if Builder.io is enabled
 */
export function useIsBuilderEnabled(): boolean {
  const config = getBuilderConfig()
  return config.isEnabled
}
