'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { UserItem } from '../contexts/UserDataContext'

export interface Suggestion {
  id: string
  text: string
  type: 'name' | 'email' | 'domain' | 'phone' | 'company' | 'department'
  frequency: number
  score?: number
  highlighted?: string
}

/**
 * Extracts email domain from email address
 */
function getEmailDomain(email: string): string {
  const parts = email.split('@')
  return parts.length > 1 ? parts[1] : ''
}

/**
 * Extracts terms from user data
 */
function extractTermsFromUsers(users: UserItem[]): Map<string, Suggestion> {
  const termsMap = new Map<string, Suggestion>()

  users.forEach(user => {
    // Extract name parts
    if (user.name) {
      const nameParts = user.name
        .toLowerCase()
        .split(/\s+/)
        .filter(part => part.length > 0)

      nameParts.forEach(part => {
        const key = `name:${part}`
        const existing = termsMap.get(key)
        termsMap.set(key, {
          id: key,
          text: part,
          type: 'name',
          frequency: (existing?.frequency || 0) + 1
        })
      })
    }

    // Extract email (full)
    if (user.email) {
      const email = user.email.toLowerCase()
      const key = `email:${email}`
      const existing = termsMap.get(key)
      termsMap.set(key, {
        id: key,
        text: email,
        type: 'email',
        frequency: (existing?.frequency || 0) + 1
      })

      // Extract domain
      const domain = getEmailDomain(email)
      if (domain) {
        const domainKey = `domain:${domain}`
        const existingDomain = termsMap.get(domainKey)
        termsMap.set(domainKey, {
          id: domainKey,
          text: `@${domain}`,
          type: 'domain',
          frequency: (existingDomain?.frequency || 0) + 1
        })
      }
    }

    // Extract phone
    if (user.phone) {
      const phone = user.phone.toLowerCase()
      const key = `phone:${phone}`
      const existing = termsMap.get(key)
      termsMap.set(key, {
        id: key,
        text: phone,
        type: 'phone',
        frequency: (existing?.frequency || 0) + 1
      })
    }

    // Extract company
    if (user.company) {
      const company = user.company.toLowerCase()
      const key = `company:${company}`
      const existing = termsMap.get(key)
      termsMap.set(key, {
        id: key,
        text: company,
        type: 'company',
        frequency: (existing?.frequency || 0) + 1
      })
    }

    // Extract department
    if (user.department) {
      const department = user.department.toLowerCase()
      const key = `department:${department}`
      const existing = termsMap.get(key)
      termsMap.set(key, {
        id: key,
        text: department,
        type: 'department',
        frequency: (existing?.frequency || 0) + 1
      })
    }
  })

  return termsMap
}

/**
 * Ranks suggestions based on frequency and relevance
 */
function rankSuggestions(
  suggestions: Suggestion[],
  query: string
): Suggestion[] {
  const queryLower = query.toLowerCase()

  return suggestions
    .map(suggestion => {
      const textLower = suggestion.text.toLowerCase()
      let score = suggestion.frequency * 10

      // Boost exact matches
      if (textLower === queryLower) {
        score += 1000
      }
      // Boost starts-with matches
      else if (textLower.startsWith(queryLower)) {
        score += 500
      }
      // Regular contains match
      else if (textLower.includes(queryLower)) {
        score += 100
      }

      return { ...suggestion, score }
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
}

/**
 * Highlights matching text in suggestion
 */
function highlightMatch(text: string, query: string): string {
  if (!query) return text

  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * Hook to generate search suggestions from user data
 */
export function useSearchSuggestions(
  users: UserItem[],
  searchQuery: string,
  maxSuggestions: number = 5
) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Memoize extracted terms
  const extractedTerms = useMemo(
    () => extractTermsFromUsers(users),
    [users]
  )

  // Debounced suggestion generation
  const generateSuggestions = useCallback((query: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!query.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Debounce by 300ms
    debounceTimerRef.current = setTimeout(() => {
      const allTerms = Array.from(extractedTerms.values())

      // Filter matching terms
      const matchingSuggestions = allTerms.filter(term => {
        const textLower = term.text.toLowerCase()
        const queryLower = query.toLowerCase()
        return textLower.includes(queryLower)
      })

      // Rank and limit suggestions
      const ranked = rankSuggestions(matchingSuggestions, query)
      const topSuggestions = ranked.slice(0, maxSuggestions).map(suggestion => ({
        ...suggestion,
        highlighted: highlightMatch(suggestion.text, query)
      }))

      setSuggestions(topSuggestions)
      setIsLoading(false)
    }, 300)
  }, [extractedTerms, maxSuggestions])

  // Update suggestions when search query changes
  useEffect(() => {
    generateSuggestions(searchQuery)

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, generateSuggestions])

  return {
    suggestions,
    isLoading
  }
}
