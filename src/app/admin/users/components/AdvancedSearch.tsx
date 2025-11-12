'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, X, TrendingUp, Users, Lock, Workflow } from 'lucide-react'
import type { SearchResult, SearchSuggestion } from '@/services/advanced-search.service'

interface AdvancedSearchProps {
  onResultSelect?: (result: SearchResult) => void
}

export function AdvancedSearch({ onResultSelect }: AdvancedSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([])
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=10`
      )
      if (!response.ok) throw new Error('Failed to fetch suggestions')

      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch search results
  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      )
      if (!response.ok) throw new Error('Failed to fetch results')

      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    fetchSuggestions(value)
    if (value.length >= 2) {
      fetchResults(value)
    }
  }

  // Handle search submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    if (query.length >= 2) {
      fetchResults(query)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setShowSuggestions(false)
    fetchResults(suggestion.text)
  }

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Group results by type
  const groupedResults = {
    users: results.filter((r) => r.type === 'user'),
    roles: results.filter((r) => r.type === 'role'),
    workflows: results.filter((r) => r.type === 'workflow'),
    others: results.filter((r) => !['user', 'role', 'workflow'].includes(r.type))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />
      case 'role':
        return <Lock className="w-4 h-4" />
      case 'workflow':
        return <Workflow className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Search Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Search className="w-8 h-8" />
          Universal Search
        </h1>
        <p className="text-muted-foreground">
          Search across users, roles, workflows, and more with full-text and fuzzy search
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search users, roles, workflows... (e.g., john@example.com role:ADMIN status:active)"
              value={query}
              onChange={handleInputChange}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              className="pl-10 pr-10 py-2"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setResults([])
                  setSuggestions([])
                  searchInputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-2"
              >
                {suggestion.icon && <span>{suggestion.icon}</span>}
                <span className="flex-1">{suggestion.text}</span>
                {suggestion.type === 'correction' && (
                  <Badge variant="outline" className="text-xs">
                    Did you mean?
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isLoading && query.length >= 2 && results.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No results found for &quot;{query}&quot;</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try different keywords or use filters
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <Tabs defaultValue="all" className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({results.length})</TabsTrigger>
            {groupedResults.users.length > 0 && (
              <TabsTrigger value="users">Users ({groupedResults.users.length})</TabsTrigger>
            )}
            {groupedResults.roles.length > 0 && (
              <TabsTrigger value="roles">Roles ({groupedResults.roles.length})</TabsTrigger>
            )}
            {groupedResults.workflows.length > 0 && (
              <TabsTrigger value="workflows">Workflows ({groupedResults.workflows.length})</TabsTrigger>
            )}
          </TabsList>

          {/* All Results */}
          <TabsContent value="all" className="space-y-2">
            {results.map((result) => (
              <SearchResultItem
                key={`${result.type}-${result.id}`}
                result={result}
                onSelect={onResultSelect}
              />
            ))}
          </TabsContent>

          {/* Users */}
          {groupedResults.users.length > 0 && (
            <TabsContent value="users" className="space-y-2">
              {groupedResults.users.map((result) => (
                <SearchResultItem
                  key={`${result.type}-${result.id}`}
                  result={result}
                  onSelect={onResultSelect}
                />
              ))}
            </TabsContent>
          )}

          {/* Roles */}
          {groupedResults.roles.length > 0 && (
            <TabsContent value="roles" className="space-y-2">
              {groupedResults.roles.map((result) => (
                <SearchResultItem
                  key={`${result.type}-${result.id}`}
                  result={result}
                  onSelect={onResultSelect}
                />
              ))}
            </TabsContent>
          )}

          {/* Workflows */}
          {groupedResults.workflows.length > 0 && (
            <TabsContent value="workflows" className="space-y-2">
              {groupedResults.workflows.map((result) => (
                <SearchResultItem
                  key={`${result.type}-${result.id}`}
                  result={result}
                  onSelect={onResultSelect}
                />
              ))}
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Initial State - Popular Searches */}
      {!isLoading && query.length === 0 && results.length === 0 && suggestions.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Popular Searches
            </CardTitle>
            <CardDescription>Get started with these popular searches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: 'Active users', icon: '👥' },
              { text: 'ADMIN role', icon: '🔐' },
              { text: 'Pending approvals', icon: '⏳' },
              { text: 'Recent workflows', icon: '⚙️' }
            ].map((item) => (
              <button
                key={item.text}
                onClick={() => {
                  setQuery(item.text)
                  fetchResults(item.text)
                }}
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 border transition-colors"
              >
                <span className="mr-2">{item.icon}</span>
                {item.text}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Search Result Item Component
 */
function SearchResultItem({
  result,
  onSelect
}: {
  result: SearchResult
  onSelect?: (result: SearchResult) => void
}) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-5 h-5 text-blue-500" />
      case 'role':
        return <Lock className="w-5 h-5 text-purple-500" />
      case 'workflow':
        return <Workflow className="w-5 h-5 text-green-500" />
      default:
        return <Search className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <button
      onClick={() => onSelect?.(result)}
      className="w-full text-left p-4 rounded-lg border hover:bg-gray-50 hover:border-primary transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="mt-1">{getTypeIcon(result.type)}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{result.title}</h3>
          {result.subtitle && <p className="text-sm text-muted-foreground">{result.subtitle}</p>}
          {result.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
          )}
        </div>
        <div className="text-right">
          <Badge variant="outline" className="text-xs">
            {Math.round(result.relevanceScore * 100)}% match
          </Badge>
        </div>
      </div>
    </button>
  )
}
