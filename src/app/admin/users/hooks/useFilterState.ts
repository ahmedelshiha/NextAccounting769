'use client'

import { useState, useCallback, useMemo } from 'react'
import { UserItem } from '../contexts/UserDataContext'
import { useFilterUsers } from './useFilterUsers'
import { useAdvancedSearch } from './useAdvancedSearch'
import { FilterGroup, FilterCondition } from '../types/query-builder'

export interface FilterState {
  search: string
  roles: string[]      // Multi-select: array of roles
  statuses: string[]   // Multi-select: array of statuses
  // Advanced query support for complex filters
  advancedQuery?: FilterGroup | FilterCondition
  // Legacy single-select support (deprecated)
  role?: string | null
  status?: string | null
}

export interface FilterStats {
  totalCount: number
  filteredCount: number
  isFiltered: boolean
}

export function useFilterState(users: UserItem[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    roles: [],
    statuses: []
  })

  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }, [])

  // Use advanced search to support operators (=, ^, $, @)
  const { results: advancedSearchResults } = useAdvancedSearch(
    users,
    filters.search,
    ['name', 'email', 'phone', 'company', 'department']
  )

  // Helper function to evaluate advanced query conditions
  const evaluateAdvancedQuery = useCallback((user: UserItem, query: FilterGroup | FilterCondition): boolean => {
    const evaluateCondition = (cond: FilterCondition): boolean => {
      const fieldValue = (user as any)[cond.field]
      const value = cond.value

      switch (cond.operator) {
        case 'equals':
          return String(fieldValue).toLowerCase() === String(value).toLowerCase()
        case 'notEquals':
          return String(fieldValue).toLowerCase() !== String(value).toLowerCase()
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
        case 'startsWith':
          return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
        case 'endsWith':
          return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
        case 'greaterThan':
          return Number(fieldValue) > Number(value)
        case 'lessThan':
          return Number(fieldValue) < Number(value)
        case 'between':
          if (!Array.isArray(value) || value.length !== 2) return true
          const [min, max] = value
          return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max)
        case 'in':
          if (Array.isArray(value)) {
            return value.some(v => String(fieldValue).toLowerCase() === String(v).toLowerCase())
          }
          return false
        case 'notIn':
          if (Array.isArray(value)) {
            return !value.some(v => String(fieldValue).toLowerCase() === String(v).toLowerCase())
          }
          return false
        case 'isEmpty':
          return !fieldValue || String(fieldValue).trim() === ''
        case 'isNotEmpty':
          return !!fieldValue && String(fieldValue).trim() !== ''
        default:
          return true
      }
    }

    const evaluateGroup = (group: FilterGroup): boolean => {
      const results = group.conditions.map(cond => {
        if ('conditions' in cond) {
          return evaluateGroup(cond as FilterGroup)
        }
        return evaluateCondition(cond as FilterCondition)
      })

      if (group.operator === 'AND') {
        return results.every(r => r)
      } else {
        return results.some(r => r)
      }
    }

    if ('conditions' in query) {
      return evaluateGroup(query as FilterGroup)
    } else {
      return evaluateCondition(query as FilterCondition)
    }
  }, [])

  // Memoized filtered results
  const filteredUsers = useMemo(() => {
    let result = advancedSearchResults

    // Apply advanced query filter if present
    if (filters.advancedQuery) {
      result = result.filter(user => evaluateAdvancedQuery(user, filters.advancedQuery!))
    }

    // Apply multi-select role filter (OR logic: match any selected role)
    if (filters.roles.length > 0) {
      result = result.filter(user => filters.roles.includes(user.role))
    }

    // Apply multi-select status filter (OR logic: match any selected status)
    if (filters.statuses.length > 0) {
      result = result.filter(user => {
        const userStatus = user.status || 'ACTIVE'
        return filters.statuses.includes(userStatus)
      })
    }

    // Sort by creation date
    result = result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return result
  }, [advancedSearchResults, filters.roles, filters.statuses, filters.advancedQuery, evaluateAdvancedQuery])

  const hasActiveFilters = !!(
    filters.search ||
    filters.roles.length > 0 ||
    filters.statuses.length > 0 ||
    filters.advancedQuery
  )

  const clearFilters = useCallback(() => {
    setFilters({ search: '', roles: [], statuses: [], advancedQuery: undefined })
  }, [])

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const stats: FilterStats = {
    totalCount: users.length,
    filteredCount: filteredUsers.length,
    isFiltered: hasActiveFilters
  }

  // Helper functions for multi-select operations
  const toggleRole = useCallback((role: string) => {
    setFilters(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }, [])

  const toggleStatus = useCallback((status: string) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }))
  }, [])

  const clearRoles = useCallback(() => {
    setFilters(prev => ({ ...prev, roles: [] }))
  }, [])

  const clearStatuses = useCallback(() => {
    setFilters(prev => ({ ...prev, statuses: [] }))
  }, [])

  return {
    filters,
    setFilters,
    updateFilter,
    filteredUsers,
    hasActiveFilters,
    clearFilters,
    // Multi-select helpers
    toggleRole,
    toggleStatus,
    clearRoles,
    clearStatuses,
    stats
  }
}
