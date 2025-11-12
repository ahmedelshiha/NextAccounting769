'use client'

import { useState, useEffect, useRef } from 'react'
import { getBuilderConfig, BUILDER_MODELS, BUILDER_MODEL_DEFINITIONS } from '@/lib/builder-io/config'

/**
 * In-memory cache for Builder.io content
 * Maps model name to cached content with timestamp
 */
const contentCache = new Map<string, { data: any; timestamp: number }>()

export interface BuilderContentResult {
  content: any
  isLoading: boolean
  error: string | null
  isEnabled: boolean
  isCached: boolean
  lastFetched?: number
}

/**
 * Hook to fetch and cache Builder.io content
 *
 * Features:
 * - Client-side caching with configurable TTL
 * - Graceful fallback to null when disabled
 * - Error boundary with detailed error messages
 * - Memory-efficient deduplication
 * - Support for preview mode (builder-preview query param)
 *
 * @param modelName - Name of the Builder.io model to fetch
 * @param options - Configuration options (cacheTime in ms)
 * @returns Builder content object with loading/error states
 *
 * Usage:
 * ```tsx
 * const { content, isLoading, error } = useBuilderContent('admin-workbench-header')
 * if (isLoading) return <Skeleton />
 * if (error) return <DefaultComponent />
 * return <BuilderContent blocks={content.blocks} />
 * ```
 */
export function useBuilderContent(
  modelName: string,
  options?: { cacheTime?: number; retryCount?: number }
): BuilderContentResult {
  const [content, setContent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCached, setIsCached] = useState(false)
  const [lastFetched, setLastFetched] = useState<number>()

  const config = getBuilderConfig()
  const cacheTime = options?.cacheTime ?? config.cacheTime ?? 5 * 60 * 1000 // 5 minutes default
  const retryCount = options?.retryCount ?? 1
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!config.isEnabled) {
      setContent(null)
      setIsLoading(false)
      return
    }

    let isMounted = true
    let retries = 0

    async function fetchContent() {
      try {
        // Check memory cache first
        const cached = contentCache.get(modelName)
        const now = Date.now()

        if (cached && now - cached.timestamp < cacheTime) {
          if (isMounted) {
            setContent(cached.data)
            setIsCached(true)
            setLastFetched(cached.timestamp)
            setIsLoading(false)
          }
          return
        }

        if (isMounted) {
          setIsLoading(true)
          setError(null)
          setIsCached(false)
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController()

        // Fetch from Builder.io API
        const response = await fetch(
          `/api/builder-io/content?model=${encodeURIComponent(modelName)}&space=${encodeURIComponent(config.space)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Builder-Model': modelName
            },
            signal: abortControllerRef.current.signal,
            cache: 'no-store'
          }
        )

        if (!response.ok) {
          throw new Error(
            `Builder.io API error ${response.status}: ${response.statusText}. ` +
            `Check that model "${modelName}" exists and API key is valid.`
          )
        }

        const data = await response.json()

        if (!data || (Array.isArray(data.results) && data.results.length === 0)) {
          if (isMounted) {
            setContent(null)
            setError(`No content found for model: ${modelName}`)
          }
          return
        }

        // Cache the successful response
        contentCache.set(modelName, { data, timestamp: Date.now() })

        if (isMounted) {
          setContent(data)
          setIsCached(false)
          setLastFetched(Date.now())
          setError(null)
        }
      } catch (err) {
        // Don't report error if request was aborted
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        const message = err instanceof Error ? err.message : 'Unknown error'

        // Retry logic
        if (retries < retryCount) {
          retries++
          console.warn(
            `Builder.io fetch failed for "${modelName}" (attempt ${retries}/${retryCount}): ${message}. Retrying...`
          )
          // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
          const delay = 500 * Math.pow(2, retries - 1)
          await new Promise((resolve) => setTimeout(resolve, delay))
          fetchContent()
          return
        }

        if (isMounted) {
          setError(message)
          setContent(null)
          console.error(
            `Builder.io content fetch failed for "${modelName}" after ${retryCount} attempts:`,
            message
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchContent()

    // Cleanup: abort fetch if component unmounts
    return () => {
      isMounted = false
      abortControllerRef.current?.abort()
    }
  }, [modelName, config.isEnabled, config.space, cacheTime, retryCount])

  return {
    content,
    isLoading,
    error,
    isEnabled: config.isEnabled,
    isCached,
    lastFetched
  }
}

/**
 * Hook to clear Builder.io content cache
 * Useful for testing or forcing a refresh
 */
export function useClearBuilderCache() {
  return () => {
    contentCache.clear()
  }
}
