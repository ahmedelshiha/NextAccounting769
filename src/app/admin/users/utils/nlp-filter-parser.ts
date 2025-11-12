/**
 * NLP Filter Parser
 * Converts natural language queries to filter states
 * Examples:
 *   "active admins" → { role: 'ADMIN', status: 'ACTIVE' }
 *   "inactive team members" → { role: 'TEAM_MEMBER', status: 'INACTIVE' }
 *   "john in sales" → { search: 'john', department: 'sales' }
 */

import { FilterState } from '../hooks/useFilterState'

export interface ParsedQuery {
  text: string
  confidence: number
  filters: Partial<FilterState>
  suggestions: string[]
  matchedPatterns: string[]
}

/**
 * Role keywords mapping
 */
const ROLE_KEYWORDS: Record<string, string> = {
  'admin': 'ADMIN',
  'administrator': 'ADMIN',
  'admins': 'ADMIN',
  'lead': 'TEAM_LEAD',
  'team lead': 'TEAM_LEAD',
  'team-lead': 'TEAM_LEAD',
  'leader': 'TEAM_LEAD',
  'member': 'TEAM_MEMBER',
  'team member': 'TEAM_MEMBER',
  'team-member': 'TEAM_MEMBER',
  'members': 'TEAM_MEMBER',
  'staff': 'STAFF',
  'employee': 'STAFF',
  'employees': 'STAFF',
  'client': 'CLIENT',
  'clients': 'CLIENT',
  'customer': 'CLIENT',
  'customers': 'CLIENT',
  'viewer': 'VIEWER',
  'view-only': 'VIEWER'
}

/**
 * Status keywords mapping
 */
const STATUS_KEYWORDS: Record<string, string> = {
  'active': 'ACTIVE',
  'enabled': 'ACTIVE',
  'available': 'ACTIVE',
  'working': 'ACTIVE',
  'online': 'ACTIVE',
  'inactive': 'INACTIVE',
  'disabled': 'INACTIVE',
  'offline': 'INACTIVE',
  'unavailable': 'INACTIVE',
  'away': 'INACTIVE',
  'suspended': 'SUSPENDED',
  'blocked': 'SUSPENDED',
  'deactivated': 'SUSPENDED'
}

/**
 * Department keywords (flexible matching)
 */
const DEPARTMENT_KEYWORDS = [
  'sales',
  'engineering',
  'marketing',
  'hr',
  'human resources',
  'finance',
  'accounting',
  'operations',
  'support',
  'customer service',
  'devops',
  'product',
  'legal',
  'compliance'
]

/**
 * Tokenize query into words
 */
function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(token => token.length > 0)
}

/**
 * Find role in tokens
 */
function extractRole(tokens: string[]): { role: string | null; index: number; keyword: string } {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const role = ROLE_KEYWORDS[token]
    if (role) {
      return { role, index: i, keyword: token }
    }

    // Check multi-word roles (e.g., "team member", "team-member")
    if (i < tokens.length - 1) {
      const twoWord = `${token} ${tokens[i + 1]}`
      const twoWordRole = ROLE_KEYWORDS[twoWord]
      if (twoWordRole) {
        return { role: twoWordRole, index: i, keyword: twoWord }
      }
    }
  }
  return { role: null, index: -1, keyword: '' }
}

/**
 * Find status in tokens
 */
function extractStatus(tokens: string[]): { status: string | null; index: number; keyword: string } {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const status = STATUS_KEYWORDS[token]
    if (status) {
      return { status, index: i, keyword: token }
    }
  }
  return { status: null, index: -1, keyword: '' }
}

/**
 * Find department in tokens
 */
function extractDepartment(tokens: string[]): { department: string | null; index: number; keyword: string } {
  // Check for exact matches first
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (DEPARTMENT_KEYWORDS.includes(token)) {
      return { department: token, index: i, keyword: token }
    }

    // Check two-word departments
    if (i < tokens.length - 1) {
      const twoWord = `${token} ${tokens[i + 1]}`
      if (DEPARTMENT_KEYWORDS.includes(twoWord)) {
        return { department: twoWord, index: i, keyword: twoWord }
      }
    }
  }

  // Check for prefix match (e.g., "eng" → "engineering")
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const match = DEPARTMENT_KEYWORDS.find(dept =>
      dept.startsWith(token) && token.length >= 3
    )
    if (match) {
      return { department: match, index: i, keyword: token }
    }
  }

  return { department: null, index: -1, keyword: '' }
}

/**
 * Extract remaining search terms (names, emails, etc.)
 */
function extractSearchTerms(
  tokens: string[],
  skipIndices: Set<number>
): string[] {
  return tokens
    .map((token, index) => ({ token, index }))
    .filter(({ index }) => !skipIndices.has(index))
    .map(({ token }) => token)
}

/**
 * Calculate confidence score
 */
function calculateConfidence(
  hasRole: boolean,
  hasStatus: boolean,
  hasDepartment: boolean,
  hasSearch: boolean,
  tokenCount: number
): number {
  let score = 0.0

  // Base score for matched filters
  if (hasRole) score += 0.3
  if (hasStatus) score += 0.3
  if (hasDepartment) score += 0.2
  if (hasSearch) score += 0.2

  // Bonus for multiple matched filters
  const filterCount = [hasRole, hasStatus, hasDepartment, hasSearch].filter(Boolean).length
  if (filterCount > 1) {
    score += (filterCount - 1) * 0.1
  }

  // Adjust for token clarity
  if (tokenCount >= 2 && tokenCount <= 4) {
    score = Math.min(1.0, score + 0.1) // Clear query
  } else if (tokenCount > 4) {
    score = Math.max(0.0, score - 0.1) // Ambiguous query
  }

  return Math.min(1.0, Math.max(0.0, score))
}

/**
 * Parse natural language query into filter state
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const originalQuery = query
  const tokens = tokenize(query)

  if (tokens.length === 0) {
    return {
      text: originalQuery,
      confidence: 0,
      filters: {},
      suggestions: [],
      matchedPatterns: []
    }
  }

  const matchedPatterns: string[] = []
  const skipIndices = new Set<number>()

  // Extract role
  const { role, index: roleIndex, keyword: roleKeyword } = extractRole(tokens)
  if (role) {
    matchedPatterns.push(`role:${role}`)
    skipIndices.add(roleIndex)
    // Add next token if it was a multi-word role
    if (roleKeyword.includes(' ')) {
      skipIndices.add(roleIndex + 1)
    }
  }

  // Extract status
  const { status, index: statusIndex, keyword: statusKeyword } = extractStatus(tokens)
  if (status) {
    matchedPatterns.push(`status:${status}`)
    skipIndices.add(statusIndex)
  }

  // Extract department
  const { department, index: departmentIndex, keyword: departmentKeyword } = extractDepartment(tokens)
  if (department) {
    matchedPatterns.push(`department:${department}`)
    skipIndices.add(departmentIndex)
    // Add next token if it was a multi-word department
    if (departmentKeyword.includes(' ')) {
      skipIndices.add(departmentIndex + 1)
    }
  }

  // Extract search terms (names, emails, etc.)
  const searchTerms = extractSearchTerms(tokens, skipIndices)
  const search = searchTerms.join(' ')

  // Build filter state
  const filters: Partial<FilterState> = {}
  if (role) filters.role = role
  if (status) filters.status = status
  if (search) filters.search = search

  // Calculate confidence
  const confidence = calculateConfidence(
    !!role,
    !!status,
    !!department,
    !!search,
    tokens.length
  )

  // Generate suggestions for common queries
  const suggestions = generateSuggestions(query, tokens, { role, status, department })

  return {
    text: originalQuery,
    confidence,
    filters,
    suggestions,
    matchedPatterns
  }
}

/**
 * Generate suggestions for the query
 */
function generateSuggestions(
  query: string,
  tokens: string[],
  extracted: { role: string | null; status: string | null; department: string | null }
): string[] {
  const suggestions: string[] = []

  // If user said "inactive" but didn't specify role, suggest combinations
  if (extracted.status === 'INACTIVE' && !extracted.role) {
    suggestions.push('inactive admins')
    suggestions.push('inactive team members')
    suggestions.push('inactive staff')
  }

  // If user said a role but didn't specify status, suggest combinations
  if (extracted.role && !extracted.status) {
    suggestions.push(`active ${Object.entries(ROLE_KEYWORDS).find(([, v]) => v === extracted.role)?.[0]}s`)
    suggestions.push(`inactive ${Object.entries(ROLE_KEYWORDS).find(([, v]) => v === extracted.role)?.[0]}s`)
  }

  // If department mentioned, suggest with roles
  if (extracted.department) {
    suggestions.push(`admins in ${extracted.department}`)
    suggestions.push(`team members in ${extracted.department}`)
  }

  // Suggest clearing filters
  if (tokens.length > 0) {
    suggestions.push('clear filters')
  }

  return suggestions.slice(0, 3) // Return top 3 suggestions
}

/**
 * Check if two queries are similar
 */
export function querySimilarity(query1: string, query2: string): number {
  const tokens1 = new Set(tokenize(query1))
  const tokens2 = new Set(tokenize(query2))

  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)))
  const union = new Set([...tokens1, ...tokens2])

  if (union.size === 0) return 0
  return intersection.size / union.size
}

/**
 * Suggest related queries based on current query
 */
export function suggestRelatedQueries(query: string): string[] {
  const parsed = parseNaturalLanguageQuery(query)
  const suggestions: string[] = []

  // Generate variations
  const tokens = tokenize(query)
  
  if (tokens.length >= 2) {
    // Reverse order
    suggestions.push(tokens.reverse().join(' '))
  }

  // Add role variations
  Object.entries(ROLE_KEYWORDS).forEach(([keyword, role]) => {
    if (!query.toLowerCase().includes(keyword)) {
      suggestions.push(`${query} ${keyword}`)
    }
  })

  // Add status variations
  Object.entries(STATUS_KEYWORDS).forEach(([keyword, status]) => {
    if (!query.toLowerCase().includes(keyword)) {
      suggestions.push(`${keyword} ${query}`)
    }
  })

  return suggestions.filter(q => q !== query).slice(0, 5)
}

/**
 * Explain what a query means
 */
export function explainQuery(query: string): string {
  const parsed = parseNaturalLanguageQuery(query)

  if (parsed.matchedPatterns.length === 0) {
    return 'Search for users containing these terms'
  }

  const explanations: string[] = []

  if (parsed.matchedPatterns.some(p => p.startsWith('role:'))) {
    const role = parsed.matchedPatterns.find(p => p.startsWith('role:'))?.split(':')?.[1]
    explanations.push(`users with role "${role}"`)
  }

  if (parsed.matchedPatterns.some(p => p.startsWith('status:'))) {
    const status = parsed.matchedPatterns.find(p => p.startsWith('status:'))?.split(':')?.[1]
    explanations.push(`status is "${status}"`)
  }

  if (parsed.matchedPatterns.some(p => p.startsWith('department:'))) {
    const dept = parsed.matchedPatterns.find(p => p.startsWith('department:'))?.split(':')?.[1]
    explanations.push(`in department "${dept}"`)
  }

  if (parsed.filters.search) {
    explanations.push(`containing "${parsed.filters.search}"`)
  }

  if (explanations.length === 0) {
    return 'Search for users'
  }

  return explanations.join(' and ')
}
