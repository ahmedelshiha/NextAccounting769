import { useState, useCallback } from 'react'
import useSWR from 'swr'
import type { SearchResult, SearchSuggestion } from '@/services/advanced-search.service'

interface UseAdvancedSearchOptions {
  debounceMs?: number
  limit?: number
}

interface UseAdvancedSearchResult {
  query: string
  results: SearchResult[]
  suggestions: SearchSuggestion[]
  isLoading: boolean
  error?: Error
  search: (query: string) => Promise<void>
  reset: () => void
}

/**
 * Hook for advanced search functionality
 * Handles search queries, suggestions, and results
 */
export function useAdvancedSearch(options?: UseAdvancedSearchOptions): UseAdvancedSearchResult {
  const { debounceMs = 300, limit = 20 } = options || {}

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [error, setError] = useState<Error>()

  // Debounce the query
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery)
      setError(undefined)

      if (debounceMs > 0) {
        const timer = setTimeout(() => {
          setDebouncedQuery(newQuery)
        }, debounceMs)
        return () => clearTimeout(timer)
      } else {
        setDebouncedQuery(newQuery)
      }
    },
    [debounceMs]
  )

  // Fetch search results
  const { data: searchData, isLoading: isSearchLoading } = useSWR(
    debouncedQuery && debouncedQuery.length >= 2
      ? `/api/admin/search?q=${encodeURIComponent(debouncedQuery)}&limit=${limit}`
      : null,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to search')
      return response.json()
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000
    }
  )

  // Fetch suggestions
  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useSWR(
    debouncedQuery && debouncedQuery.length >= 2
      ? `/api/admin/search/suggestions?q=${encodeURIComponent(debouncedQuery)}&limit=10`
      : null,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch suggestions')
      return response.json()
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000
    }
  )

  const results = searchData?.results || []
  const suggestions = suggestionsData?.suggestions || []
  const isLoading = isSearchLoading || isSuggestionsLoading

  const search = useCallback(
    async (searchQuery: string) => {
      handleQueryChange(searchQuery)
    },
    [handleQueryChange]
  )

  const reset = useCallback(() => {
    setQuery('')
    setDebouncedQuery('')
    setError(undefined)
  }, [])

  return {
    query,
    results,
    suggestions,
    isLoading,
    error,
    search,
    reset
  }
}
