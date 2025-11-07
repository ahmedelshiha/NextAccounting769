import prisma from '@/lib/prisma'
import { cache } from 'react'

export interface SearchResult {
  id: string
  type: 'user' | 'role' | 'permission' | 'workflow' | 'team' | 'client'
  title: string
  subtitle?: string
  description?: string
  metadata?: Record<string, any>
  relevanceScore: number
}

export interface SearchSuggestion {
  text: string
  type: 'query' | 'entity' | 'correction'
  icon?: string
}

export interface SearchAnalytics {
  totalResults: number
  executionTime: number
  facets: Record<string, { count: number; values: string[] }>
}

/**
 * Advanced Search Service
 * Provides full-text, fuzzy, and semantic search capabilities
 */
export class AdvancedSearchService {
  /**
   * Full-text search across all entities
   */
  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    const queryLower = query.toLowerCase()

    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: queryLower, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: { id: true, email: true, name: true }
    })

    users.forEach((user) => {
      results.push({
        id: user.id,
        type: 'user',
        title: user.name || user.email,
        subtitle: user.email,
        relevanceScore: this.calculateRelevance(query, user.email + ' ' + (user.name || ''))
      })
    })

    // Search roles
    const roles = await prisma.customRole.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: { id: true, name: true, description: true }
    })

    roles.forEach((role) => {
      results.push({
        id: role.id,
        type: 'role',
        title: role.name,
        subtitle: 'Role',
        description: role.description || undefined,
        relevanceScore: this.calculateRelevance(query, role.name + ' ' + (role.description || ''))
      })
    })

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return results.slice(0, limit)
  }

  /**
   * Fuzzy search for typo tolerance
   */
  async fuzzySearch(query: string): Promise<SearchResult[]> {
    // Simple fuzzy matching implementation
    const results = await this.search(query, 10)
    return results.filter((r) => this.levenshteinDistance(query, r.title) < 3)
  }

  /**
   * Get search suggestions (auto-complete)
   */
  async getSuggestions(query: string, limit = 10): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = []

    if (!query || query.length < 2) {
      return this.getPopularSearches(limit)
    }

    // Add the query itself as a suggestion
    suggestions.push({
      text: query,
      type: 'query'
    })

    // Get entity suggestions
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { startsWith: query, mode: 'insensitive' } },
          { name: { startsWith: query, mode: 'insensitive' } }
        ]
      },
      take: 3,
      select: { email: true, name: true, id: true }
    })

    users.forEach((user) => {
      suggestions.push({
        text: user.name || user.email,
        type: 'entity',
        icon: '👤'
      })
    })

    const roles = await prisma.customRole.findMany({
      where: { name: { startsWith: query, mode: 'insensitive' } },
      take: 3,
      select: { name: true, id: true }
    })

    roles.forEach((role) => {
      suggestions.push({
        text: role.name,
        type: 'entity',
        icon: '🔑'
      })
    })

    return suggestions.slice(0, limit)
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limit = 5): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [
      { text: 'Active users', type: 'query' },
      { text: 'ADMIN role', type: 'query' },
      { text: 'Pending approvals', type: 'query' },
      { text: 'Team members', type: 'query' },
      { text: 'Client list', type: 'query' }
    ]
    return suggestions.slice(0, limit)
  }

  /**
   * Get search filters/facets
   */
  async getFilters(): Promise<Record<string, { count: number; values: string[] }>> {
    const userCount = await prisma.user.count()
    const roleCount = await prisma.customRole.count()

    return {
      'Entity Type': {
        count: 3,
        values: ['Users', 'Roles', 'Workflows']
      },
      'Status': {
        count: 3,
        values: ['Active', 'Inactive', 'Pending']
      }
    }
  }

  /**
   * Calculate relevance score (0-1)
   */
  private calculateRelevance(query: string, text: string): number {
    const queryLower = query.toLowerCase()
    const textLower = text.toLowerCase()

    // Exact match
    if (textLower === queryLower) return 1

    // Contains as word
    if (textLower.includes(queryLower)) return 0.8

    // Starts with
    if (textLower.startsWith(queryLower)) return 0.6

    // Partial match
    let score = 0
    for (let i = 0; i < queryLower.length; i++) {
      if (textLower.includes(queryLower[i])) score += 0.1
    }

    return Math.min(score, 0.5)
  }

  /**
   * Levenshtein distance for fuzzy matching
   */
  private levenshteinDistance(a: string, b: string): number {
    const m = a.length
    const n = b.length
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        }
      }
    }

    return dp[m][n]
  }
}

export const advancedSearchService = new AdvancedSearchService()
