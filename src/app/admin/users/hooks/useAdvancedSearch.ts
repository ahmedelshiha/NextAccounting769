'use client'

import { useMemo } from 'react'
import { UserItem } from '../contexts/UserDataContext'

export type SearchOperator = 'contains' | 'exact' | 'startsWith' | 'endsWith' | 'emailDomain'

export interface ParsedSearchQuery {
  operator: SearchOperator
  searchTerm: string
  field?: string
}

/**
 * Parse search query for advanced operators
 * Supported operators:
 * - "term" - Default contains search
 * - "=term" - Exact match
 * - "^term" - Starts with
 * - "term$" - Ends with
 * - "@domain.com" - Email domain search
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = query.trim()

  if (!trimmed) {
    return { operator: 'contains', searchTerm: '' }
  }

  // Exact match: =term
  if (trimmed.startsWith('=')) {
    return {
      operator: 'exact',
      searchTerm: trimmed.slice(1).trim()
    }
  }

  // Starts with: ^term
  if (trimmed.startsWith('^')) {
    return {
      operator: 'startsWith',
      searchTerm: trimmed.slice(1).trim()
    }
  }

  // Ends with: term$
  if (trimmed.endsWith('$') && !trimmed.startsWith('term')) {
    return {
      operator: 'endsWith',
      searchTerm: trimmed.slice(0, -1).trim()
    }
  }

  // Email domain: @domain.com
  if (trimmed.startsWith('@')) {
    return {
      operator: 'emailDomain',
      searchTerm: trimmed.slice(1).trim(),
      field: 'email'
    }
  }

  // Default: contains
  return {
    operator: 'contains',
    searchTerm: trimmed
  }
}

/**
 * Apply parsed search query to users
 */
function applySearchOperator(
  users: UserItem[],
  query: ParsedSearchQuery,
  searchFields: string[] = ['name', 'email', 'phone', 'company']
): UserItem[] {
  const { operator, searchTerm, field } = query

  if (!searchTerm) {
    return users
  }

  const fieldsToSearch = field ? [field] : searchFields

  switch (operator) {
    case 'exact':
      return users.filter(user =>
        fieldsToSearch.some(f => {
          const value = getNestedValue(user, f)
          return value?.toLowerCase() === searchTerm.toLowerCase()
        })
      )

    case 'startsWith':
      return users.filter(user =>
        fieldsToSearch.some(f => {
          const value = getNestedValue(user, f)
          return value?.toLowerCase().startsWith(searchTerm.toLowerCase())
        })
      )

    case 'endsWith':
      return users.filter(user =>
        fieldsToSearch.some(f => {
          const value = getNestedValue(user, f)
          return value?.toLowerCase().endsWith(searchTerm.toLowerCase())
        })
      )

    case 'emailDomain':
      return users.filter(user => {
        const email = user.email?.toLowerCase() || ''
        return email.endsWith(`@${searchTerm.toLowerCase()}`)
      })

    case 'contains':
    default:
      return users.filter(user =>
        fieldsToSearch.some(f => {
          const value = getNestedValue(user, f)
          return value?.toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
  }
}

/**
 * Get nested property value from object
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path
    .split('.')
    .reduce((current, key) => current?.[key], obj as any)
    ?.toString()
}

/**
 * Hook for advanced search with operators
 */
export function useAdvancedSearch(
  users: UserItem[],
  searchQuery: string,
  searchFields: string[] = ['name', 'email', 'phone', 'company']
) {
  const parsedQuery = useMemo(() => parseSearchQuery(searchQuery), [searchQuery])

  const results = useMemo(() => {
    if (!searchQuery.trim()) {
      return users
    }

    return applySearchOperator(users, parsedQuery, searchFields)
  }, [users, parsedQuery, searchQuery, searchFields])

  return {
    results,
    parsedQuery,
    operatorUsed: parsedQuery.operator
  }
}

/**
 * Get search help text for display
 */
export function getSearchHelpText(): Array<{ operator: string; example: string; description: string }> {
  return [
    {
      operator: 'contains',
      example: 'john',
      description: 'Search for "john" anywhere in name, email, or phone'
    },
    {
      operator: 'exact',
      example: '=John Smith',
      description: 'Find exact match (case-insensitive)'
    },
    {
      operator: 'starts with',
      example: '^John',
      description: 'Find entries that start with "John"'
    },
    {
      operator: 'ends with',
      example: 'smith$',
      description: 'Find entries that end with "smith"'
    },
    {
      operator: 'email domain',
      example: '@gmail.com',
      description: 'Find users with specific email domain'
    }
  ]
}
