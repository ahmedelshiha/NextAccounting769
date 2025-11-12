'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { FilterState } from './useFilterState'

export interface ServerFilterPreset {
  id: string
  name: string
  description?: string
  filters: FilterState
  createdAt: string
  updatedAt: string
  isPinned: boolean
  usageCount: number
  lastUsedAt?: string
}

export interface UseServerPresetsResult {
  presets: ServerFilterPreset[]
  isLoading: boolean
  isOnline: boolean
  error: string | null
  createPreset: (name: string, filters: FilterState, description?: string) => Promise<ServerFilterPreset>
  updatePreset: (id: string, updates: Partial<Omit<ServerFilterPreset, 'id' | 'createdAt'>>) => Promise<ServerFilterPreset>
  deletePreset: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<ServerFilterPreset>
  trackPresetUsage: (id: string) => Promise<void>
  getPreset: (id: string) => ServerFilterPreset | undefined
  getPinnedPresets: () => ServerFilterPreset[]
  getAllPresets: () => ServerFilterPreset[]
  refreshPresets: () => Promise<void>
  syncWithServer: () => Promise<void>
}

const STORAGE_KEY = 'user-directory-filter-presets-server'
const SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes
const RETRY_DELAY = 1000 // 1 second
const MAX_RETRIES = 3

/**
 * Hook to manage filter presets with server storage and offline fallback
 * Syncs presets between server and localStorage for offline support
 * Automatically retries failed operations with exponential backoff
 */
export function useServerPresets(): UseServerPresetsResult {
  const [presets, setPresets] = useState<ServerFilterPreset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Detect online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load presets from server or fallback to localStorage
  const loadPresets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users/presets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch presets: ${response.statusText}`)
      }

      const data = await response.json()
      const fetchedPresets = data.presets || []

      setPresets(fetchedPresets)
      // Sync to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedPresets))
      } catch (e) {
        console.warn('Failed to save presets to localStorage:', e)
      }
    } catch (err) {
      console.warn('Failed to load presets from server, falling back to localStorage:', err)
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved) as ServerFilterPreset[]
          setPresets(parsed)
        }
      } catch (e) {
        console.error('Failed to load presets from localStorage:', e)
        setError('Failed to load presets. Please try again.')
        setPresets([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load and periodic sync
  useEffect(() => {
    loadPresets()

    // Set up periodic sync when online
    if (isOnline) {
      syncTimeoutRef.current = setInterval(loadPresets, SYNC_INTERVAL)
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current)
      }
    }
  }, [loadPresets, isOnline])

  // Retry with exponential backoff
  const executeWithRetry = useCallback(
    async <T,>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
      let lastError: Error | null = null

      for (let i = 0; i < retries; i++) {
        try {
          return await fn()
        } catch (err) {
          lastError = err as Error
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, i)))
          }
        }
      }

      throw lastError || new Error('Operation failed after retries')
    },
    []
  )

  // Create a new preset
  const createPreset = useCallback(
    async (name: string, filters: FilterState, description?: string): Promise<ServerFilterPreset> => {
      setError(null)

      const newPreset = {
        id: `local-${Date.now()}`,
        name,
        description,
        filters,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: false,
        usageCount: 0
      }

      // Optimistic update
      setPresets(prev => [newPreset, ...prev])

      if (!isOnline) {
        // Offline: store locally
        try {
          const updated = [newPreset, ...presets]
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          return newPreset
        } catch (e) {
          const err = 'Failed to save preset offline'
          setError(err)
          throw new Error(err)
        }
      }

      try {
        const response = await executeWithRetry(async () => {
          const res = await fetch('/api/admin/users/presets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, filters })
          })

          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Failed to create preset')
          }

          return res.json()
        })

        const created = response as ServerFilterPreset
        setPresets(prev => [created, ...prev.filter(p => p.id !== newPreset.id)])
        localStorage.setItem(STORAGE_KEY, JSON.stringify([created, ...presets.filter(p => p.id !== newPreset.id)]))

        return created
      } catch (err) {
        setError((err as Error).message)
        // Keep local copy for offline
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([newPreset, ...presets]))
        } catch (e) {
          console.warn('Failed to save to localStorage:', e)
        }
        throw err
      }
    },
    [presets, isOnline, executeWithRetry]
  )

  // Update a preset
  const updatePreset = useCallback(
    async (id: string, updates: Partial<Omit<ServerFilterPreset, 'id' | 'createdAt'>>): Promise<ServerFilterPreset> => {
      setError(null)

      const existingPreset = presets.find(p => p.id === id)
      if (!existingPreset) {
        throw new Error('Preset not found')
      }

      const updated = { ...existingPreset, ...updates, updatedAt: new Date().toISOString() }

      // Optimistic update
      setPresets(prev => prev.map(p => (p.id === id ? updated : p)))

      if (!isOnline) {
        try {
          const newList = presets.map(p => (p.id === id ? updated : p))
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newList))
          return updated
        } catch (e) {
          const err = 'Failed to update preset offline'
          setError(err)
          throw new Error(err)
        }
      }

      try {
        const response = await executeWithRetry(async () => {
          const res = await fetch(`/api/admin/users/presets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          })

          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Failed to update preset')
          }

          return res.json()
        })

        const result = response as ServerFilterPreset
        setPresets(prev => prev.map(p => (p.id === id ? result : p)))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.map(p => (p.id === id ? result : p))))

        return result
      } catch (err) {
        setError((err as Error).message)
        // Revert optimistic update on error
        setPresets(prev => prev.map(p => (p.id === id ? existingPreset : p)))
        throw err
      }
    },
    [presets, isOnline, executeWithRetry]
  )

  // Delete a preset
  const deletePreset = useCallback(
    async (id: string): Promise<void> => {
      setError(null)

      const existingPresets = presets
      const filtered = presets.filter(p => p.id !== id)

      // Optimistic update
      setPresets(filtered)

      if (!isOnline) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
          return
        } catch (e) {
          const err = 'Failed to delete preset offline'
          setError(err)
          throw new Error(err)
        }
      }

      try {
        await executeWithRetry(async () => {
          const res = await fetch(`/api/admin/users/presets/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          })

          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Failed to delete preset')
          }
        })

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      } catch (err) {
        setError((err as Error).message)
        // Revert optimistic update
        setPresets(existingPresets)
        throw err
      }
    },
    [presets, isOnline, executeWithRetry]
  )

  // Toggle pin status
  const togglePin = useCallback(
    async (id: string): Promise<ServerFilterPreset> => {
      const preset = presets.find(p => p.id === id)
      if (!preset) {
        throw new Error('Preset not found')
      }

      return updatePreset(id, { isPinned: !preset.isPinned })
    },
    [presets, updatePreset]
  )

  // Track preset usage (call when preset is applied)
  const trackPresetUsage = useCallback(
    async (id: string): Promise<void> => {
      if (!isOnline) return // Skip tracking when offline

      try {
        const response = await fetch(`/api/admin/users/presets/${id}/use`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const data = await response.json()
          // Update local copy with new usage count
          setPresets(prev =>
            prev.map(p =>
              p.id === id
                ? {
                    ...p,
                    usageCount: data.usageCount,
                    lastUsedAt: data.lastUsedAt
                  }
                : p
            )
          )
        }
      } catch (err) {
        console.warn('Failed to track preset usage:', err)
        // Don't throw - usage tracking is not critical
      }
    },
    [isOnline]
  )

  // Get single preset by id
  const getPreset = useCallback(
    (id: string): ServerFilterPreset | undefined => {
      return presets.find(p => p.id === id)
    },
    [presets]
  )

  // Get pinned presets
  const getPinnedPresets = useCallback(() => {
    return presets
      .filter(p => p.isPinned)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [presets])

  // Get all presets sorted by update date
  const getAllPresets = useCallback(() => {
    return [...presets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [presets])

  // Manually refresh presets from server
  const refreshPresets = useCallback(async () => {
    await loadPresets()
  }, [loadPresets])

  // Manual sync with server (used for conflict resolution)
  const syncWithServer = useCallback(async () => {
    if (!isOnline) {
      setError('Cannot sync while offline')
      return
    }

    setError(null)

    try {
      // Fetch latest from server
      await loadPresets()
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }, [isOnline, loadPresets])

  return {
    presets,
    isLoading,
    isOnline,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    togglePin,
    trackPresetUsage,
    getPreset,
    getPinnedPresets,
    getAllPresets,
    refreshPresets,
    syncWithServer
  }
}
