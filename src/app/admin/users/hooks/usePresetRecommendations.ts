'use client'

import { useState, useCallback, useEffect } from 'react'
import { ServerFilterPreset } from './useServerPresets'
import { FilterState } from './useFilterState'
import {
  getRecommendations,
  getTrendingPresets,
  getContextualRecommendations,
  findSimilarPresets,
  FilterUsageData,
  PresetRecommendation,
  RecommendationAnalysis
} from '../utils/preset-recommendations'

const STORAGE_KEY = 'preset-usage-history'
const MAX_HISTORY = 100

export interface UsePresetRecommendationsResult {
  recommendations: PresetRecommendation[]
  trendingPresets: PresetRecommendation[]
  isAnalyzing: boolean
  recordUsage: (filters: FilterState, resultCount?: number) => void
  analyzeCurrentFilters: (filters: FilterState, presets: ServerFilterPreset[]) => void
  getTrendingForUser: (presets: ServerFilterPreset[]) => PresetRecommendation[]
  getContextual: (filters: FilterState, presets: ServerFilterPreset[], role: string, dept?: string) => PresetRecommendation[]
  findSimilar: (targetPreset: ServerFilterPreset, allPresets: ServerFilterPreset[]) => PresetRecommendation[]
  clearHistory: () => void
}

/**
 * Hook for smart preset recommendations based on usage patterns
 */
export function usePresetRecommendations(): UsePresetRecommendationsResult {
  const [recommendations, setRecommendations] = useState<PresetRecommendation[]>([])
  const [trendingPresets, setTrendingPresets] = useState<PresetRecommendation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [usageHistory, setUsageHistory] = useState<FilterUsageData[]>([])

  // Load usage history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as FilterUsageData[]
        setUsageHistory(parsed)
      }
    } catch (error) {
      console.warn('Failed to load usage history:', error)
    }
  }, [])

  // Save usage history to localStorage
  const saveHistory = useCallback((history: FilterUsageData[]) => {
    try {
      // Keep only recent history to avoid bloat
      const limited = history.slice(-MAX_HISTORY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
    } catch (error) {
      console.warn('Failed to save usage history:', error)
    }
  }, [])

  // Record when a filter is used
  const recordUsage = useCallback(
    (filters: FilterState, resultCount?: number) => {
      const newUsage: FilterUsageData = {
        filters,
        timestamp: Date.now(),
        duration: 0, // Would be updated when filter is changed
        resultCount
      }

      setUsageHistory(prev => {
        const updated = [...prev, newUsage]
        saveHistory(updated)
        return updated
      })
    },
    [saveHistory]
  )

  // Analyze current filters and get recommendations
  const analyzeCurrentFilters = useCallback((filters: FilterState, presets: ServerFilterPreset[]) => {
    setIsAnalyzing(true)

    try {
      const analysis = getRecommendations(filters, presets, usageHistory, 5)
      setRecommendations(analysis.recommendations)
    } catch (error) {
      console.error('Failed to analyze filters:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [usageHistory])

  // Get trending presets
  const getTrendingForUser = useCallback(
    (presets: ServerFilterPreset[]): PresetRecommendation[] => {
      try {
        const trending = getTrendingPresets(presets, usageHistory)
        setTrendingPresets(trending)
        return trending
      } catch (error) {
        console.error('Failed to get trending presets:', error)
        return []
      }
    },
    [usageHistory]
  )

  // Get contextual recommendations (by role/department)
  const getContextual = useCallback(
    (filters: FilterState, presets: ServerFilterPreset[], role: string, dept?: string): PresetRecommendation[] => {
      try {
        return getContextualRecommendations(filters, presets, role, dept, 5)
      } catch (error) {
        console.error('Failed to get contextual recommendations:', error)
        return []
      }
    },
    []
  )

  // Find similar presets
  const findSimilar = useCallback((targetPreset: ServerFilterPreset, allPresets: ServerFilterPreset[]): PresetRecommendation[] => {
    try {
      return findSimilarPresets(targetPreset, allPresets, 5)
    } catch (error) {
      console.error('Failed to find similar presets:', error)
      return []
    }
  }, [])

  // Clear usage history
  const clearHistory = useCallback(() => {
    setUsageHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear history:', error)
    }
  }, [])

  return {
    recommendations,
    trendingPresets,
    isAnalyzing,
    recordUsage,
    analyzeCurrentFilters,
    getTrendingForUser,
    getContextual,
    findSimilar,
    clearHistory
  }
}
