'use client'

import { useState, useEffect, useCallback } from 'react'
import { FilterGroup, FilterCondition, QueryTemplate, BUILT_IN_TEMPLATES } from '../types/query-builder'
import { v4 as uuidv4 } from 'uuid'

const TEMPLATE_STORAGE_KEY = 'user-directory-query-templates'
const MAX_TEMPLATES = 50

/**
 * Hook for managing filter query templates
 * Supports save, load, delete, and sync with localStorage
 */
export function useFilterTemplates() {
  const [templates, setTemplates] = useState<QueryTemplate[]>(BUILT_IN_TEMPLATES)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load templates from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          const customTemplates = Array.isArray(parsed) ? parsed : []
          // Combine built-in + custom templates
          setTemplates([...BUILT_IN_TEMPLATES, ...customTemplates])
        } else {
          setTemplates(BUILT_IN_TEMPLATES)
        }
      }
      setIsLoaded(true)
    } catch (err) {
      console.error('Error loading templates:', err)
      setError('Failed to load templates')
      setTemplates(BUILT_IN_TEMPLATES)
      setIsLoaded(true)
    }
  }, [])

  // Save templates to localStorage
  const saveToStorage = useCallback((customTemplates: QueryTemplate[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(customTemplates))
      }
    } catch (err) {
      console.error('Error saving templates:', err)
      setError('Failed to save templates')
    }
  }, [])

  // Create a new template
  const createTemplate = useCallback((
    name: string,
    query: FilterGroup | FilterCondition,
    description?: string,
    category?: string
  ): QueryTemplate => {
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

    setTemplates(prev => {
      const customOnly = prev.filter(t => !t.isBuiltIn)
      if (customOnly.length >= MAX_TEMPLATES) {
        // Remove oldest custom template
        const sorted = customOnly.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        const filtered = sorted.slice(1)
        saveToStorage(filtered)
        return [...BUILT_IN_TEMPLATES, ...filtered, template]
      }
      const updated = [...prev, template]
      const customTemplates = updated.filter(t => !t.isBuiltIn)
      saveToStorage(customTemplates)
      return updated
    })

    return template
  }, [saveToStorage])

  // Update a template
  const updateTemplate = useCallback((
    id: string,
    updates: Partial<Omit<QueryTemplate, 'id' | 'isBuiltIn'>>
  ): QueryTemplate | null => {
    let updated: QueryTemplate | null = null

    setTemplates(prev => {
      const newTemplates = prev.map(t => {
        if (t.id === id && !t.isBuiltIn) {
          updated = { ...t, ...updates, updatedAt: new Date() }
          return updated
        }
        return t
      })
      const customTemplates = newTemplates.filter(t => !t.isBuiltIn)
      saveToStorage(customTemplates)
      return newTemplates
    })

    return updated
  }, [saveToStorage])

  // Delete a template
  const deleteTemplate = useCallback((id: string): boolean => {
    let deleted = false

    setTemplates(prev => {
      const filtered = prev.filter(t => {
        if (t.id === id && !t.isBuiltIn) {
          deleted = true
          return false
        }
        return true
      })
      if (deleted) {
        const customTemplates = filtered.filter(t => !t.isBuiltIn)
        saveToStorage(customTemplates)
      }
      return filtered
    })

    return deleted
  }, [saveToStorage])

  // Get a specific template
  const getTemplate = useCallback((id: string): QueryTemplate | undefined => {
    return templates.find(t => t.id === id)
  }, [templates])

  // Get all custom templates
  const getCustomTemplates = useCallback(() => {
    return templates.filter(t => !t.isBuiltIn)
  }, [templates])

  // Get all built-in templates
  const getBuiltInTemplates = useCallback(() => {
    return templates.filter(t => t.isBuiltIn)
  }, [templates])

  // Search templates by name
  const searchTemplates = useCallback((query: string) => {
    const q = query.toLowerCase()
    return templates.filter(t => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
  }, [templates])

  // Get templates by category
  const getTemplatesByCategory = useCallback((category: string) => {
    return templates.filter(t => t.category === category)
  }, [templates])

  // Clear all custom templates
  const clearCustomTemplates = useCallback(() => {
    setTemplates(BUILT_IN_TEMPLATES)
    saveToStorage([])
  }, [saveToStorage])

  // Export templates as JSON
  const exportTemplates = useCallback((asCustomOnly = true) => {
    const toExport = asCustomOnly ? getCustomTemplates() : templates
    return JSON.stringify(toExport, null, 2)
  }, [templates, getCustomTemplates])

  // Import templates from JSON
  const importTemplates = useCallback((jsonString: string, merge = true): boolean => {
    try {
      const imported = JSON.parse(jsonString)
      const validTemplates = Array.isArray(imported)
        ? imported.filter(t => t.name && t.query)
        : []

      setTemplates(prev => {
        let result = prev
        if (!merge) {
          result = BUILT_IN_TEMPLATES
        }

        const validImported = validTemplates.map(t => ({
          ...t,
          id: t.id || uuidv4(),
          isBuiltIn: false,
          createdAt: new Date(t.createdAt || new Date()),
          updatedAt: new Date(t.updatedAt || new Date())
        }))

        const combined = [...result, ...validImported]
        const customOnly = combined.filter(t => !t.isBuiltIn)

        // Enforce max template limit
        if (customOnly.length > MAX_TEMPLATES) {
          const sorted = customOnly.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          const trimmed = sorted.slice(0, MAX_TEMPLATES)
          saveToStorage(trimmed)
          return [...BUILT_IN_TEMPLATES, ...trimmed]
        }

        saveToStorage(customOnly)
        return combined
      })

      return true
    } catch (err) {
      console.error('Error importing templates:', err)
      setError('Invalid template format')
      return false
    }
  }, [saveToStorage])

  return {
    templates,
    isLoaded,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    getCustomTemplates,
    getBuiltInTemplates,
    searchTemplates,
    getTemplatesByCategory,
    clearCustomTemplates,
    exportTemplates,
    importTemplates,
    customTemplateCount: templates.filter(t => !t.isBuiltIn).length,
    hasMaxTemplates: templates.filter(t => !t.isBuiltIn).length >= MAX_TEMPLATES
  }
}
