'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Suggestion } from '../hooks/useSearchSuggestions'

export interface SearchSuggestionsDropdownProps {
  suggestions: Suggestion[]
  isLoading: boolean
  isOpen: boolean
  onSelectSuggestion: (suggestion: Suggestion) => void
  searchQuery: string
  className?: string
}

const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  domain: 'Domain',
  phone: 'Phone',
  company: 'Company',
  department: 'Department'
}

const SUGGESTION_TYPE_COLORS: Record<string, string> = {
  name: 'bg-blue-50 border-blue-200',
  email: 'bg-green-50 border-green-200',
  domain: 'bg-green-50 border-green-200',
  phone: 'bg-purple-50 border-purple-200',
  company: 'bg-orange-50 border-orange-200',
  department: 'bg-indigo-50 border-indigo-200'
}

const SUGGESTION_TYPE_BADGES: Record<string, string> = {
  name: 'bg-blue-100 text-blue-700',
  email: 'bg-green-100 text-green-700',
  domain: 'bg-green-100 text-green-700',
  phone: 'bg-purple-100 text-purple-700',
  company: 'bg-orange-100 text-orange-700',
  department: 'bg-indigo-100 text-indigo-700'
}

export function SearchSuggestionsDropdown({
  suggestions,
  isLoading,
  isOpen,
  onSelectSuggestion,
  searchQuery,
  className = ''
}: SearchSuggestionsDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const suggestionsRef = useRef<(HTMLButtonElement | null)[]>([])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(-1)
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onSelectSuggestion(suggestions[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setSelectedIndex(-1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, suggestions, selectedIndex, onSelectSuggestion])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current[selectedIndex]) {
      suggestionsRef.current[selectedIndex]?.scrollIntoView({
        block: 'nearest'
      })
    }
  }, [selectedIndex])

  if (!isOpen || !searchQuery) {
    return null
  }

  return (
    <div
      className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto ${className}`}
      role="listbox"
      aria-label="Search suggestions"
    >
      {isLoading && suggestions.length === 0 && (
        <div className="px-4 py-3 text-sm text-gray-500 text-center">
          Loading suggestions...
        </div>
      )}

      {!isLoading && suggestions.length === 0 && (
        <div className="px-4 py-3 text-sm text-gray-500 text-center">
          No suggestions found
        </div>
      )}

      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.id}
          ref={el => {
            suggestionsRef.current[index] = el
          }}
          onClick={() => onSelectSuggestion(suggestion)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between gap-2 ${
            selectedIndex === index ? 'bg-blue-50' : ''
          }`}
          role="option"
          aria-selected={selectedIndex === index}
          type="button"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900 truncate">
                {suggestion.highlighted ? (
                  <span
                    dangerouslySetInnerHTML={{ __html: suggestion.highlighted }}
                  />
                ) : (
                  suggestion.text
                )}
              </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                  SUGGESTION_TYPE_BADGES[suggestion.type]
                }`}
              >
                {SUGGESTION_TYPE_LABELS[suggestion.type]}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {suggestion.frequency} match{suggestion.frequency !== 1 ? 'es' : ''}
            </div>
          </div>
        </button>
      ))}

      {suggestions.length > 0 && (
        <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
          ↑ ↓ to navigate • Enter to select • Esc to close
        </div>
      )}
    </div>
  )
}
