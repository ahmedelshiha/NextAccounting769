'use client'

import { useState, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  FilterCondition,
  FilterGroup,
  QueryTemplate,
  BUILT_IN_TEMPLATES,
  FilterField,
  FilterOperator,
  LogicalOperator
} from '../types/query-builder'
import { UserItem } from '../contexts/UserDataContext'

/**
 * Hook for managing advanced query builder state and operations
 */
// Helper function to create empty condition
function createEmptyConditionHelper(): FilterCondition {
  return {
    id: uuidv4(),
    field: 'name',
    operator: 'contains',
    value: ''
  }
}

// Helper function to create empty group
function createEmptyGroupHelper(operator: LogicalOperator = 'AND'): FilterGroup {
  return {
    id: uuidv4(),
    conditions: [createEmptyConditionHelper()],
    operator
  }
}

export function useQueryBuilder(initialQuery?: FilterGroup | FilterCondition) {
  const [query, setQuery] = useState<FilterGroup | FilterCondition>(
    initialQuery || createEmptyConditionHelper()
  )
  const [templates, setTemplates] = useState<QueryTemplate[]>(BUILT_IN_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Create a new empty condition
  const createEmptyCondition = useCallback((): FilterCondition => {
    return createEmptyConditionHelper()
  }, [])

  // Create a new empty group
  const createEmptyGroup = useCallback((operator: LogicalOperator = 'AND'): FilterGroup => {
    return createEmptyGroupHelper(operator)
  }, [])

  // Add a new condition to a group
  const addCondition = useCallback((groupId: string) => {
    const updateQueryRecursive = (q: FilterGroup | FilterCondition): FilterGroup | FilterCondition => {
      if ('conditions' in q) {
        // It's a group
        if (q.id === groupId) {
          return {
            ...q,
            conditions: [...q.conditions, createEmptyCondition()]
          }
        }
        return {
          ...q,
          conditions: q.conditions.map(updateQueryRecursive)
        }
      } else {
        // It's a single condition
        // If the groupId matches this condition's ID, convert to group
        if (q.id === groupId) {
          return {
            id: q.id,
            operator: 'AND' as LogicalOperator,
            conditions: [q, createEmptyCondition()]
          }
        }
      }
      return q
    }

    setQuery(updateQueryRecursive(query))
  }, [query, createEmptyCondition])

  // Remove a condition or group by ID
  const removeCondition = useCallback((id: string) => {
    const removeRecursive = (q: FilterGroup | FilterCondition): FilterGroup | FilterCondition | null => {
      if (!('conditions' in q)) {
        return q.id === id ? null : q
      }

      const filtered = q.conditions
        .map(removeRecursive)
        .filter((c): c is FilterGroup | FilterCondition => c !== null)

      if (filtered.length === 0) {
        return null
      }

      return {
        ...q,
        conditions: filtered
      }
    }

    const result = removeRecursive(query)
    if (result) {
      setQuery(result)
    }
  }, [query])

  // Update a condition's field, operator, or value
  const updateCondition = useCallback((
    id: string,
    updates: Partial<FilterCondition>
  ) => {
    const updateRecursive = (q: FilterGroup | FilterCondition): FilterGroup | FilterCondition => {
      if ('conditions' in q) {
        return {
          ...q,
          conditions: q.conditions.map(updateRecursive)
        }
      }
      if (q.id === id) {
        return { ...q, ...updates }
      }
      return q
    }

    setQuery(updateRecursive(query))
  }, [query])

  // Convert query to filter state for API/display
  const queryToFilterState = useCallback(() => {
    const filters: Record<string, any> = {
      search: '',
      roles: [],
      statuses: [],
      advanced: query
    }

    const extractSimpleFilters = (q: FilterGroup | FilterCondition) => {
      if ('conditions' in q) {
        q.conditions.forEach(extractSimpleFilters)
      } else {
        // Map advanced query to simple filters where possible
        if (q.field === 'role' && q.operator === 'equals' && typeof q.value === 'string') {
          filters.roles.push(q.value)
        } else if (q.field === 'status' && q.operator === 'equals' && typeof q.value === 'string') {
          filters.statuses.push(q.value)
        } else if (q.field === 'name' && q.operator === 'contains' && typeof q.value === 'string') {
          filters.search = q.value
        }
      }
    }

    extractSimpleFilters(query)
    return filters
  }, [query])

  // Apply query to users list
  const applyQueryToUsers = useCallback((users: UserItem[]): UserItem[] => {
    const evaluateCondition = (user: UserItem, condition: FilterCondition): boolean => {
      const fieldValue = (user as any)[condition.field]
      const value = condition.value

      switch (condition.operator) {
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

    const evaluateGroup = (user: UserItem, group: FilterGroup): boolean => {
      const results = group.conditions.map(cond => {
        if ('conditions' in cond) {
          return evaluateGroup(user, cond)
        }
        return evaluateCondition(user, cond)
      })

      if (group.operator === 'AND') {
        return results.every(r => r)
      } else {
        return results.some(r => r)
      }
    }

    if ('conditions' in query) {
      return users.filter(user => evaluateGroup(user, query as FilterGroup))
    } else {
      return users.filter(user => evaluateCondition(user, query as FilterCondition))
    }
  }, [query])

  // Save current query as template
  const saveAsTemplate = useCallback((name: string, description?: string, category?: string) => {
    const template: QueryTemplate = {
      id: uuidv4(),
      name,
      description,
      category,
      query,
      createdAt: new Date(),
      updatedAt: new Date(),
      isBuiltIn: false
    }

    setTemplates(prev => [...prev, template])
    return template
  }, [query])

  // Load template
  const loadTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setQuery(template.query)
      setSelectedTemplate(templateId)
      return template
    }
  }, [templates])

  // Delete custom template (built-in templates cannot be deleted)
  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null)
    }
  }, [selectedTemplate])

  // Get templates (custom + built-in)
  const customTemplates = useMemo(() => templates.filter(t => !t.isBuiltIn), [templates])
  const builtInTemplates = useMemo(() => templates.filter(t => t.isBuiltIn), [templates])
  const allTemplates = useMemo(() => templates, [templates])

  // Reset to empty query
  const reset = useCallback(() => {
    setQuery(createEmptyCondition())
    setSelectedTemplate(null)
  }, [createEmptyCondition])

  return {
    query,
    setQuery,
    createEmptyCondition,
    createEmptyGroup,
    addCondition,
    removeCondition,
    updateCondition,
    queryToFilterState,
    applyQueryToUsers,
    saveAsTemplate,
    loadTemplate,
    deleteTemplate,
    templates: allTemplates,
    customTemplates,
    builtInTemplates,
    selectedTemplate,
    reset,
    isComplex: 'conditions' in query && query.conditions.length > 1
  }
}
