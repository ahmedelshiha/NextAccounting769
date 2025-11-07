'use client'

import React from 'react'
import { Sparkles, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Permission,
  PERMISSION_METADATA,
} from '@/lib/permissions'
import {
  PermissionSuggestion,
} from '@/lib/permission-engine'

export interface SmartSuggestionsPanelProps {
  suggestions: PermissionSuggestion[]
  onApply: (suggestion: PermissionSuggestion) => void
  onDismiss: (suggestion: PermissionSuggestion) => void
  onApplyAll?: () => void
}

export default function SmartSuggestionsPanel({
  suggestions,
  onApply,
  onDismiss,
  onApplyAll,
}: SmartSuggestionsPanelProps) {
  if (!suggestions || suggestions.length === 0) {
    return null
  }

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Smart Suggestions</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Based on analysis of similar users and access patterns
      </p>

      <div className="space-y-2 mb-3">
        {suggestions.map((suggestion, index) => (
          <SuggestionCard
            key={`${suggestion.permission}-${index}`}
            suggestion={suggestion}
            onApply={() => onApply(suggestion)}
            onDismiss={() => onDismiss(suggestion)}
          />
        ))}
      </div>

      {onApplyAll && (
        <Button
          variant="default"
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={onApplyAll}
        >
          Apply All Suggestions ({suggestions.length})
        </Button>
      )}
    </div>
  )
}

interface SuggestionCardProps {
  suggestion: PermissionSuggestion
  onApply: () => void
  onDismiss: () => void
}

function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
}: SuggestionCardProps) {
  const meta = PERMISSION_METADATA[suggestion.permission]
  if (!meta) return null

  return (
    <div className="bg-white p-3 rounded-md border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900">
            {meta.label}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {suggestion.reason}
          </p>
        </div>

        <ConfidenceBadge confidence={suggestion.confidence} />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          className="flex-1 h-8 bg-green-600 hover:bg-green-700"
          onClick={onApply}
        >
          <Check className="w-3 h-3 mr-1" />
          Add
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          onClick={onDismiss}
          title="Dismiss this suggestion"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

interface ConfidenceBadgeProps {
  confidence: number
}

function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100)
  
  let variant: 'default' | 'secondary' | 'outline' | 'destructive' = 'secondary'
  if (confidence >= 0.9) {
    variant = 'default'
  } else if (confidence >= 0.7) {
    variant = 'secondary'
  } else {
    variant = 'outline'
  }

  return (
    <Badge variant={variant} className="text-xs whitespace-nowrap ml-2">
      {percentage}% confident
    </Badge>
  )
}
