'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, X, HelpCircle, ArrowRight } from 'lucide-react'
import { useNLPParser, useSimilarQueries, useNLPQueryHistory } from '../hooks/useNLPParser'
import { FilterState } from '../hooks/useFilterState'

export interface AISearchBarProps {
  onFiltersChange: (filters: Partial<FilterState>) => void
  onClearFilters?: () => void
  placeholder?: string
  className?: string
  showExplanation?: boolean
  showSuggestions?: boolean
}

/**
 * AISearchBar component for natural language filter queries
 * Example queries:
 *   "active admins"
 *   "inactive team members in sales"
 *   "john in marketing"
 */
export function AISearchBar({
  onFiltersChange,
  onClearFilters,
  placeholder = 'Search naturally: "active admins", "inactive team members", "john in sales"...',
  className = '',
  showExplanation = true,
  showSuggestions = true
}: AISearchBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { query, setQuery, parsed, confidence, explanation, relatedQueries, applyFilters, clearQuery } =
    useNLPParser(onFiltersChange, { minConfidence: 0.2 })

  const { history, addQuery } = useNLPQueryHistory(20)
  const similarQueries = useSimilarQueries(query, history)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
  }

  const handleApplyQuery = () => {
    if (query.trim()) {
      applyFilters(parsed.filters)
      addQuery(query)
      setIsOpen(false)
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
  }

  const handleSelectHistory = (historyQuery: string) => {
    setQuery(historyQuery)
  }

  const handleClear = () => {
    clearQuery()
    if (onClearFilters) {
      onClearFilters()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Main Input */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
            <Sparkles size={18} />
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="pl-10 pr-10"
            aria-label="Natural language filter search"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
              type="button"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <Button
          onClick={handleApplyQuery}
          disabled={!query.trim() || confidence < 0.2}
          size="sm"
          variant="default"
          className="whitespace-nowrap"
          aria-label="Apply natural language filters"
        >
          <Sparkles size={16} className="mr-1" />
          Apply
        </Button>

        <Button
          onClick={() => setShowHelp(!showHelp)}
          size="sm"
          variant="ghost"
          className="w-10 h-10 p-0"
          aria-label="Show help"
        >
          <HelpCircle size={18} />
        </Button>
      </div>

      {/* Help Text */}
      {showHelp && (
        <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-900">
          <p className="font-semibold mb-2">Natural Language Filter Examples:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><code className="bg-blue-100 px-1 rounded">&quot;active admins&quot;</code> - Find active administrators</li>
            <li><code className="bg-blue-100 px-1 rounded">&quot;inactive team members&quot;</code> - Find inactive team members</li>
            <li><code className="bg-blue-100 px-1 rounded">&quot;john in sales&quot;</code> - Find John in sales department</li>
            <li><code className="bg-blue-100 px-1 rounded">&quot;marketing staff&quot;</code> - Find staff in marketing</li>
          </ul>
        </div>
      )}

      {/* Explanation */}
      {showExplanation && query && explanation && (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-900 flex items-start gap-2">
          <ArrowRight size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            This will search for <strong>{explanation}</strong>
          </span>
        </div>
      )}

      {/* Confidence Indicator */}
      {query && (
        <div className="mb-2 flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${
                confidence >= 0.7
                  ? 'bg-green-500'
                  : confidence >= 0.4
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 w-12">
            {Math.round(confidence * 100)}%
          </span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
          role="listbox"
        >
          {/* Parsed Filters Display */}
          {query && parsed.matchedPatterns.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-100 bg-blue-50">
              <p className="text-xs font-semibold text-blue-900 mb-1">Detected Filters:</p>
              <div className="flex flex-wrap gap-1">
                {parsed.matchedPatterns.map((pattern, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-1 bg-blue-200 text-blue-900 text-xs rounded"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Queries */}
          {showSuggestions && query && relatedQueries.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">
                Try These:
              </div>
              {relatedQueries.map((relatedQuery, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestion(relatedQuery)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 border-b border-gray-100 transition-colors"
                  type="button"
                  role="option"
                  aria-selected="false"
                >
                  <Sparkles size={14} className="inline mr-2 text-blue-600" />
                  {relatedQuery}
                </button>
              ))}
            </>
          )}

          {/* History */}
          {showSuggestions && !query && history.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">
                Recent Searches:
              </div>
              {history.slice(0, 5).map((historyQuery, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectHistory(historyQuery)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 transition-colors text-gray-700"
                  type="button"
                  role="option"
                  aria-selected="false"
                >
                  {historyQuery}
                </button>
              ))}
            </>
          )}

          {/* Empty State */}
          {!query && history.length === 0 && (
            <div className="px-4 py-4 text-sm text-gray-500 text-center">
              <p className="font-medium mb-2">Try natural language queries:</p>
              <ul className="space-y-1 text-xs">
                <li>&quot;active admins&quot;</li>
                <li>&quot;inactive team members&quot;</li>
                <li>&quot;john in sales&quot;</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Mini version of AI Search for compact spaces
 */
export function AISearchBarMini({
  onFiltersChange,
  className = ''
}: Pick<AISearchBarProps, 'onFiltersChange' | 'className'>) {
  return (
    <AISearchBar
      onFiltersChange={onFiltersChange}
      placeholder='e.g., "active admins"'
      className={className}
      showExplanation={false}
      showSuggestions={false}
    />
  )
}
