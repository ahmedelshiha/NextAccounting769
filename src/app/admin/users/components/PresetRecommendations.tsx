'use client'

import { useEffect } from 'react'
import { usePresetRecommendations } from '../hooks/usePresetRecommendations'
import { ServerFilterPreset } from '../hooks/useServerPresets'
import { FilterState } from '../hooks/useFilterState'
import { Button } from '@/components/ui/button'
import { Lightbulb, TrendingUp, Users } from 'lucide-react'

interface PresetRecommendationsProps {
  currentFilters: FilterState
  presets: ServerFilterPreset[]
  onSelectPreset: (preset: ServerFilterPreset) => void
  userRole?: string
  userDepartment?: string
}

export function PresetRecommendations({
  currentFilters,
  presets,
  onSelectPreset,
  userRole,
  userDepartment
}: PresetRecommendationsProps) {
  const {
    recommendations,
    trendingPresets,
    isAnalyzing,
    analyzeCurrentFilters,
    getTrendingForUser,
    getContextual
  } = usePresetRecommendations()

  // Analyze filters when they change
  useEffect(() => {
    analyzeCurrentFilters(currentFilters, presets)
  }, [currentFilters, presets, analyzeCurrentFilters])

  // Get trending presets on mount
  useEffect(() => {
    getTrendingForUser(presets)
  }, [presets, getTrendingForUser])

  const contextualRecs = userRole ? getContextual(currentFilters, presets, userRole, userDepartment) : []

  if (recommendations.length === 0 && trendingPresets.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-blue-900">Recommended for You</h3>
          </div>

          <div className="space-y-2">
            {recommendations.slice(0, 3).map(rec => (
              <div key={rec.preset.id} className="flex items-center justify-between bg-white p-2 rounded border border-blue-100 hover:border-blue-300">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-700 truncate">{rec.preset.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {rec.reason}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(rec.confidence * 100)}% match
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectPreset(rec.preset)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                >
                  Use
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Presets */}
      {trendingPresets.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-sm text-amber-900">Trending This Week</h3>
          </div>

          <div className="space-y-2">
            {trendingPresets.slice(0, 3).map(trend => (
              <div key={trend.preset.id} className="flex items-center justify-between bg-white p-2 rounded border border-amber-100 hover:border-amber-300">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-700 truncate">{trend.preset.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Used {trend.preset.usageCount} times • Last used{' '}
                    {trend.preset.lastUsedAt
                      ? Math.round((Date.now() - new Date(trend.preset.lastUsedAt).getTime()) / (1000 * 60 * 60)) + 'h ago'
                      : 'never'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectPreset(trend.preset)}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                >
                  Use
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contextual Recommendations */}
      {contextualRecs.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-sm text-green-900">For Your Role</h3>
          </div>

          <div className="space-y-2">
            {contextualRecs.slice(0, 3).map(rec => (
              <div key={rec.preset.id} className="flex items-center justify-between bg-white p-2 rounded border border-green-100 hover:border-green-300">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-700 truncate">{rec.preset.name}</p>
                  {rec.preset.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{rec.preset.description}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectPreset(rec.preset)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                >
                  Use
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
