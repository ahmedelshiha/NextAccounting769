'use client'

import { useState, useCallback, useMemo } from 'react'
import { useNLPParser, useNLPQueryHistory } from './useNLPParser'
import { FilterState } from './useFilterState'
import { parseNaturalLanguageQuery, explainQuery } from '../utils/nlp-filter-parser'

export interface AISearchState {
  isEnabled: boolean
  query: string
  suggestion: string | null
  selectedSuggestion: string | null
}

export interface UseAISearchOptions {
  enableLocalStorage?: boolean
  maxHistory?: number
  storageKey?: string
}

export interface UseAISearchResult {
  state: AISearchState
  setQuery: (query: string) => void
  setSuggestion: (suggestion: string | null) => void
  applySuggestion: (suggestion: string) => void
  toggleAISearch: () => void
  clearSearch: () => void
  history: string[]
  clearHistory: () => void
  getExplanation: () => string
  isValidQuery: boolean
  confidence: number
}

/**
 * Comprehensive AI Search hook
 * Manages AI-powered natural language queries with suggestions
 */
export function useAISearch(
  onFiltersChange?: (filters: Partial<FilterState>) => void,
  options: UseAISearchOptions = {}
): UseAISearchResult {
  const { enableLocalStorage = true, maxHistory = 30, storageKey = 'ai-search-state' } = options

  // Initialize from localStorage
  const [state, setState] = useState<AISearchState>(() => {
    if (!enableLocalStorage) {
      return {
        isEnabled: true,
        query: '',
        suggestion: null,
        selectedSuggestion: null
      }
    }

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {
      // Ignore localStorage errors
    }

    return {
      isEnabled: true,
      query: '',
      suggestion: null,
      selectedSuggestion: null
    }
  })

  // Use NLP parser for the current query
  const { parsed, confidence, explanation, applyFilters, clearQuery: nlpClearQuery } =
    useNLPParser(onFiltersChange, { minConfidence: 0.2 })

  // Use NLP query history
  const { history, addQuery, clearHistory } = useNLPQueryHistory(maxHistory)

  // Validate query
  const isValidQuery = useMemo(() => {
    return state.query.trim().length > 0 && confidence >= 0.2
  }, [state.query, confidence])

  // Update NLP parser when query changes
  const setQuery = useCallback(
    (query: string) => {
      setState(prev => {
        const newState = {
          ...prev,
          query,
          suggestion: null,
          selectedSuggestion: null
        }
        if (enableLocalStorage) {
          localStorage.setItem(storageKey, JSON.stringify(newState))
        }
        return newState
      })
    },
    [enableLocalStorage, storageKey]
  )

  // Set suggestion
  const setSuggestion = useCallback(
    (suggestion: string | null) => {
      setState(prev => ({
        ...prev,
        suggestion
      }))
    },
    []
  )

  // Apply a suggestion
  const applySuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion)
      setState(prev => ({
        ...prev,
        selectedSuggestion: suggestion
      }))
    },
    [setQuery]
  )

  // Toggle AI search
  const toggleAISearch = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        isEnabled: !prev.isEnabled
      }
      if (enableLocalStorage) {
        localStorage.setItem(storageKey, JSON.stringify(newState))
      }
      return newState
    })
  }, [enableLocalStorage, storageKey])

  // Clear search
  const clearSearch = useCallback(() => {
    nlpClearQuery()
    setState(prev => ({
      ...prev,
      query: '',
      suggestion: null,
      selectedSuggestion: null
    }))
  }, [nlpClearQuery])

  // Get explanation
  const getExplanation = useCallback(() => {
    if (!state.query) return ''
    return explainQuery(state.query)
  }, [state.query])

  return {
    state,
    setQuery,
    setSuggestion,
    applySuggestion,
    toggleAISearch,
    clearSearch,
    history,
    clearHistory,
    getExplanation,
    isValidQuery,
    confidence
  }
}

/**
 * Hook for managing AI search suggestions
 */
export function useAISearchSuggestions(query: string, maxSuggestions: number = 5) {
  const parsed = useMemo(() => {
    return parseNaturalLanguageQuery(query)
  }, [query])

  return useMemo(() => {
    if (!query.trim()) {
      return {
        suggestions: [],
        confidence: 0,
        explanation: ''
      }
    }

    return {
      suggestions: parsed.suggestions.slice(0, maxSuggestions),
      confidence: parsed.confidence,
      explanation: explainQuery(query),
      matchedPatterns: parsed.matchedPatterns
    }
  }, [parsed, query, maxSuggestions])
}

/**
 * Hook for AI search analytics
 */
export function useAISearchAnalytics() {
  const [stats, setStats] = useState({
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageConfidence: 0,
    commonPatterns: new Map<string, number>()
  })

  const recordQuery = useCallback((query: string, confidence: number, success: boolean) => {
    setStats(prev => {
      const newTotal = prev.totalQueries + 1
      const newSuccessful = success ? prev.successfulQueries + 1 : prev.successfulQueries
      const newFailed = !success ? prev.failedQueries + 1 : prev.failedQueries

      const parsed = parseNaturalLanguageQuery(query)
      const newPatterns = new Map(prev.commonPatterns)
      parsed.matchedPatterns.forEach(pattern => {
        newPatterns.set(pattern, (newPatterns.get(pattern) || 0) + 1)
      })

      return {
        totalQueries: newTotal,
        successfulQueries: newSuccessful,
        failedQueries: newFailed,
        averageConfidence:
          (prev.averageConfidence * prev.totalQueries + confidence) / newTotal,
        commonPatterns: newPatterns
      }
    })
  }, [])

  const getReport = useCallback(() => {
    return {
      ...stats,
      successRate:
        stats.totalQueries > 0
          ? (stats.successfulQueries / stats.totalQueries) * 100
          : 0,
      topPatterns: Array.from(stats.commonPatterns.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([pattern, count]) => ({ pattern, count }))
    }
  }, [stats])

  return { recordQuery, getReport, stats }
}
