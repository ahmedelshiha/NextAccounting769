'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  parseNaturalLanguageQuery,
  querySimilarity,
  suggestRelatedQueries,
  explainQuery,
  ParsedQuery
} from '../utils/nlp-filter-parser'
import { FilterState } from './useFilterState'

export interface UseNLPParserOptions {
  debounceMs?: number
  maxSuggestions?: number
  minConfidence?: number
}

export interface UseNLPParserResult {
  query: string
  setQuery: (query: string) => void
  parsed: ParsedQuery
  confidence: number
  filters: Partial<FilterState>
  explanation: string
  relatedQueries: string[]
  applyFilters: (filters: Partial<FilterState>) => void
  clearQuery: () => void
}

/**
 * Hook for NLP query parsing and filter extraction
 * Converts natural language queries to filter states
 */
export function useNLPParser(
  onFiltersChange?: (filters: Partial<FilterState>) => void,
  options: UseNLPParserOptions = {}
): UseNLPParserResult {
  const {
    debounceMs = 300,
    maxSuggestions = 3,
    minConfidence = 0.3
  } = options

  const [query, setQueryState] = useState('')
  const [cachedParsed, setCachedParsed] = useState<ParsedQuery | null>(null)

  // Parse the query
  const parsed = useMemo(() => {
    if (!query) {
      return {
        text: '',
        confidence: 0,
        filters: {},
        suggestions: [],
        matchedPatterns: []
      }
    }

    const result = parseNaturalLanguageQuery(query)
    setCachedParsed(result)
    return result
  }, [query])

  // Generate explanation
  const explanation = useMemo(() => {
    if (!query) return ''
    return explainQuery(query)
  }, [query])

  // Generate related queries
  const relatedQueries = useMemo(() => {
    if (!query || parsed.confidence < minConfidence) {
      return []
    }
    return suggestRelatedQueries(query).slice(0, maxSuggestions)
  }, [query, parsed.confidence, maxSuggestions, minConfidence])

  // Update query with debouncing
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)
  }, [])

  // Apply extracted filters
  const applyFilters = useCallback((filters: Partial<FilterState>) => {
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }, [onFiltersChange])

  // Clear the query
  const clearQuery = useCallback(() => {
    setQueryState('')
  }, [])

  return {
    query,
    setQuery,
    parsed,
    confidence: parsed.confidence,
    filters: parsed.filters,
    explanation,
    relatedQueries,
    applyFilters,
    clearQuery
  }
}

/**
 * Hook to find similar previously used queries
 */
export function useSimilarQueries(
  currentQuery: string,
  previousQueries: string[] = []
) {
  return useMemo(() => {
    if (!currentQuery || previousQueries.length === 0) {
      return []
    }

    return previousQueries
      .map(prevQuery => ({
        query: prevQuery,
        similarity: querySimilarity(currentQuery, prevQuery)
      }))
      .filter(({ similarity }) => similarity > 0.3)
      .sort(({ similarity: a }, { similarity: b }) => b - a)
      .slice(0, 5)
      .map(({ query }) => query)
  }, [currentQuery, previousQueries])
}

/**
 * Hook to track NLP query history
 */
export function useNLPQueryHistory(maxItems: number = 20) {
  const [history, setHistory] = useState<string[]>([])

  const addQuery = useCallback((query: string) => {
    if (!query.trim()) return

    setHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(q => q !== query)
      // Add to beginning and limit size
      return [query, ...filtered].slice(0, maxItems)
    })
  }, [maxItems])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return {
    history,
    addQuery,
    clearHistory
  }
}
