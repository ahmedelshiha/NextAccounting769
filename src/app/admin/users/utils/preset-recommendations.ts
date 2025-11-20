import { ServerFilterPreset } from '../hooks/useServerPresets'
import { FilterState } from '../hooks/useFilterState'

export interface FilterUsageData {
  filters: FilterState
  timestamp: number
  duration: number // milliseconds the filter was active
  resultCount?: number
}

export interface FilterCombination {
  filters: FilterState
  count: number
  lastUsed: number
  avgDuration: number
}

export interface PresetRecommendation {
  preset: ServerFilterPreset
  score: number
  reason: 'matching' | 'similar' | 'popular' | 'trending'
  confidence: number // 0-1
}

export interface RecommendationAnalysis {
  recommendations: PresetRecommendation[]
  analysisTime: number // milliseconds to analyze
  totalAnalyzed: number
}

/**
 * Calculate similarity between two filter states (0-1)
 */
export function calculateFilterSimilarity(filter1: FilterState, filter2: FilterState): number {
  const keys1 = new Set(Object.keys(filter1))
  const keys2 = new Set(Object.keys(filter2))

  // Find common keys
  const commonKeys = Array.from(keys1).filter(k => keys2.has(k))
  const allKeys = new Set([...keys1, ...keys2])

  if (allKeys.size === 0) return 0

  let matchCount = 0

  for (const key of commonKeys) {
    const v1 = (filter1 as any)[key]
    const v2 = (filter2 as any)[key]

    if (JSON.stringify(v1) === JSON.stringify(v2)) {
      matchCount++
    }
  }

  // Jaccard similarity for set-based comparison
  const intersection = commonKeys.length
  const union = allKeys.size

  // Combine key matching and value matching
  const keyScore = intersection / union
  const valueScore = matchCount / Math.max(commonKeys.length, 1)

  return (keyScore + valueScore) / 2
}

/**
 * Analyze filter combinations to find patterns
 */
export function analyzeCombinations(usageHistory: FilterUsageData[]): FilterCombination[] {
  const combinationMap = new Map<string, FilterCombination>()

  for (const usage of usageHistory) {
    const key = JSON.stringify(usage.filters)

    if (combinationMap.has(key)) {
      const existing = combinationMap.get(key)!
      existing.count++
      existing.lastUsed = Math.max(existing.lastUsed, usage.timestamp)
      existing.avgDuration = (existing.avgDuration * (existing.count - 1) + usage.duration) / existing.count
    } else {
      combinationMap.set(key, {
        filters: usage.filters,
        count: 1,
        lastUsed: usage.timestamp,
        avgDuration: usage.duration
      })
    }
  }

  // Sort by frequency and recency
  return Array.from(combinationMap.values()).sort((a, b) => {
    const freqDiff = b.count - a.count
    if (freqDiff !== 0) return freqDiff
    return b.lastUsed - a.lastUsed
  })
}

/**
 * Get preset recommendations based on current filters
 */
export function getRecommendations(
  currentFilters: FilterState,
  presets: ServerFilterPreset[],
  usageHistory: FilterUsageData[] = [],
  maxRecommendations: number = 5
): RecommendationAnalysis {
  const startTime = Date.now()
  const recommendations: PresetRecommendation[] = []

  // Analyze combinations if we have history
  const combinations = usageHistory.length > 0 ? analyzeCombinations(usageHistory) : []
  const frequentCombinations = new Set(combinations.slice(0, 10).map(c => JSON.stringify(c.filters)))

  for (const preset of presets) {
    let score = 0
    let reason: 'matching' | 'similar' | 'popular' | 'trending' = 'similar'
    let confidence = 0

    // Exact match
    if (JSON.stringify(preset.filters) === JSON.stringify(currentFilters)) {
      score = 100
      reason = 'matching'
      confidence = 1
    } else {
      // Calculate similarity
      const similarity = calculateFilterSimilarity(currentFilters, preset.filters)
      score = similarity * 80

      // Check if this is a popular combination
      const presetKey = JSON.stringify(preset.filters)
      if (frequentCombinations.has(presetKey)) {
        score += 10
        reason = 'popular'
        confidence = Math.min(1, similarity + 0.2)
      } else if (preset.usageCount > 5) {
        // Often-used presets get a boost
        score += 5
        confidence = Math.min(1, similarity + 0.1)
      } else {
        confidence = similarity
      }

      // Recency boost: recently used presets are more relevant
      if (preset.lastUsedAt) {
        const daysSinceUse = (Date.now() - new Date(preset.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceUse < 7) {
          score += 10
          reason = 'trending'
        }
      }

      // Pinned presets get a small boost
      if (preset.isPinned) {
        score += 5
      }
    }

    if (score > 0) {
      recommendations.push({
        preset,
        score,
        reason,
        confidence
      })
    }
  }

  // Sort by score and limit results
  const sorted = recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations)

  return {
    recommendations: sorted,
    analysisTime: Date.now() - startTime,
    totalAnalyzed: presets.length
  }
}

/**
 * Get trending presets based on usage patterns
 */
export function getTrendingPresets(
  presets: ServerFilterPreset[],
  usageHistory: FilterUsageData[] = [],
  timeWindow: number = 7 * 24 * 60 * 60 * 1000 // 7 days default
): PresetRecommendation[] {
  const now = Date.now()
  const recentUsage = usageHistory.filter(u => now - u.timestamp <= timeWindow)

  if (recentUsage.length === 0) {
    return presets
      .filter(p => p.isPinned)
      .sort((a, b) => (b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0) - (a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0))
      .slice(0, 5)
      .map(p => ({
        preset: p,
        score: 100,
        reason: 'popular',
        confidence: 0.8
      }))
  }

  // Analyze combinations in recent usage
  const combinations = analyzeCombinations(recentUsage)

  const recommendations: PresetRecommendation[] = []

  for (const combo of combinations.slice(0, 10)) {
    // Find matching preset
    const matchingPreset = presets.find(p => JSON.stringify(p.filters) === JSON.stringify(combo.filters))
    if (matchingPreset) {
      recommendations.push({
        preset: matchingPreset,
        score: Math.min(100, combo.count * 10),
        reason: 'trending',
        confidence: Math.min(1, combo.count / 10)
      })
    }
  }

  return recommendations.slice(0, 5)
}

/**
 * Get recommendations for a specific user role/department
 */
export function getContextualRecommendations(
  currentFilters: FilterState,
  presets: ServerFilterPreset[],
  userRole: string,
  userDepartment?: string,
  maxRecommendations: number = 5
): PresetRecommendation[] {
  const recommendations: PresetRecommendation[] = []

  for (const preset of presets) {
    // Check if preset description mentions role or department
    const description = (preset.description || '').toLowerCase()
    const name = (preset.name || '').toLowerCase()

    let relevanceScore = 0

    if (description.includes(userRole.toLowerCase()) || name.includes(userRole.toLowerCase())) {
      relevanceScore += 20
    }

    if (userDepartment && (description.includes(userDepartment.toLowerCase()) || name.includes(userDepartment.toLowerCase()))) {
      relevanceScore += 20
    }

    if (preset.isPinned) {
      relevanceScore += 10
    }

    if (preset.usageCount > 10) {
      relevanceScore += 10
    }

    if (relevanceScore > 0) {
      recommendations.push({
        preset,
        score: relevanceScore,
        reason: 'similar',
        confidence: Math.min(1, relevanceScore / 50)
      })
    }
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations)
}

/**
 * Machine learning-style similarity calculation
 * Takes into account preset usage patterns
 */
export function calculatePresetRelevance(
  targetPreset: ServerFilterPreset,
  currentFilters: FilterState,
  historicalPatterns: FilterCombination[] = []
): number {
  // Base similarity score
  const baseSimilarity = calculateFilterSimilarity(currentFilters, targetPreset.filters)

  // Boost for historical match
  let historicalBoost = 0
  for (const pattern of historicalPatterns) {
    if (JSON.stringify(pattern.filters) === JSON.stringify(targetPreset.filters)) {
      historicalBoost = Math.min(0.2, pattern.count / 100)
      break
    }
  }

  // Boost for usage
  const usageBoost = Math.min(0.1, targetPreset.usageCount / 100)

  // Boost for recency
  let recencyBoost = 0
  if (targetPreset.lastUsedAt) {
    const daysSinceUse = (Date.now() - new Date(targetPreset.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24)
    recencyBoost = Math.max(0, 0.2 - daysSinceUse * 0.01)
  }

  return Math.min(1, baseSimilarity + historicalBoost + usageBoost + recencyBoost)
}

/**
 * Find presets similar to another preset
 */
export function findSimilarPresets(
  targetPreset: ServerFilterPreset,
  allPresets: ServerFilterPreset[],
  maxResults: number = 5
): PresetRecommendation[] {
  const recommendations: PresetRecommendation[] = allPresets
    .filter(p => p.id !== targetPreset.id)
    .map((p): PresetRecommendation => ({
      preset: p,
      score: calculateFilterSimilarity(targetPreset.filters, p.filters) * 100,
      reason: 'similar',
      confidence: calculateFilterSimilarity(targetPreset.filters, p.filters)
    }))
    .filter(r => r.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)

  return recommendations
}
