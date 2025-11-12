'use client'

import { useState, useCallback, useEffect } from 'react'
import { ExportSchedule, ScheduleFrequency, DayOfWeek } from '../utils/export-scheduler'

export interface UseExportSchedulerOptions {
  tenantId?: string
  userId?: string
  autoFetch?: boolean
}

/**
 * Hook for managing export schedules
 */
export function useExportScheduler(options: UseExportSchedulerOptions = {}) {
  const { autoFetch = true } = options

  const [schedules, setSchedules] = useState<ExportSchedule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  /**
   * Fetch all export schedules
   */
  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/users/exports/schedule', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.statusText}`)
      }

      const data = await response.json()
      setSchedules(data.schedules || [])
      setTotalCount(data.schedules?.length || 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch schedules'
      setError(message)
      console.error('Error fetching schedules:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Create a new export schedule
   */
  const createSchedule = useCallback(
    async (schedule: Omit<ExportSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setError(null)

        const response = await fetch('/api/admin/users/exports/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schedule)
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to create schedule: ${response.statusText}`)
        }

        const data = await response.json()
        setSchedules(prev => [data.schedule, ...prev])
        setTotalCount(prev => prev + 1)

        return { success: true, schedule: data.schedule }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create schedule'
        setError(message)
        return { success: false, error: message }
      }
    },
    []
  )

  /**
   * Update an existing export schedule
   */
  const updateSchedule = useCallback(
    async (id: string, updates: Partial<ExportSchedule>) => {
      try {
        setError(null)

        const response = await fetch(`/api/admin/users/exports/schedule/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to update schedule: ${response.statusText}`)
        }

        const data = await response.json()
        setSchedules(prev => prev.map(s => (s.id === id ? data.schedule : s)))

        return { success: true, schedule: data.schedule }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update schedule'
        setError(message)
        return { success: false, error: message }
      }
    },
    []
  )

  /**
   * Delete an export schedule
   */
  const deleteSchedule = useCallback(async (id: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/admin/users/exports/schedule/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to delete schedule: ${response.statusText}`)
      }

      setSchedules(prev => prev.filter(s => s.id !== id))
      setTotalCount(prev => prev - 1)

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete schedule'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Delete multiple schedules
   */
  const deleteSchedules = useCallback(async (ids: string[]) => {
    try {
      setError(null)

      const queryParams = new URLSearchParams()
      queryParams.set('ids', ids.join(','))

      const response = await fetch(`/api/admin/users/exports/schedule?${queryParams}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to delete schedules: ${response.statusText}`)
      }

      const data = await response.json()
      setSchedules(prev => prev.filter(s => !ids.includes(s.id)))
      setTotalCount(prev => prev - data.deletedCount)

      return { success: true, deletedCount: data.deletedCount }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete schedules'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Toggle schedule active status
   */
  const toggleScheduleActive = useCallback(async (id: string) => {
    const schedule = schedules.find(s => s.id === id)
    if (!schedule) return { success: false, error: 'Schedule not found' }

    return updateSchedule(id, { isActive: !schedule.isActive })
  }, [schedules, updateSchedule])

  /**
   * Get schedule by ID
   */
  const getSchedule = useCallback(
    (id: string) => {
      return schedules.find(s => s.id === id)
    },
    [schedules]
  )

  /**
   * Get active schedules
   */
  const getActiveSchedules = useCallback(() => {
    return schedules.filter(s => s.isActive)
  }, [schedules])

  /**
   * Get schedules by frequency
   */
  const getSchedulesByFrequency = useCallback(
    (frequency: ScheduleFrequency) => {
      return schedules.filter(s => s.frequency === frequency)
    },
    [schedules]
  )

  /**
   * Duplicate a schedule
   */
  const duplicateSchedule = useCallback(
    async (id: string, newName: string) => {
      const schedule = getSchedule(id)
      if (!schedule) {
        return { success: false, error: 'Schedule not found' }
      }

      const { id: _id, createdAt, updatedAt, ...scheduleData } = schedule
      return createSchedule({
        ...scheduleData,
        name: newName,
        isActive: false // Duplicates are inactive by default
      })
    },
    [getSchedule, createSchedule]
  )

  // Auto-fetch schedules on mount
  useEffect(() => {
    if (autoFetch) {
      fetchSchedules()
    }
  }, [autoFetch, fetchSchedules])

  return {
    // State
    schedules,
    isLoading,
    error,
    totalCount,

    // Actions
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    deleteSchedules,
    toggleScheduleActive,
    duplicateSchedule,

    // Queries
    getSchedule,
    getActiveSchedules,
    getSchedulesByFrequency
  }
}

/**
 * Hook for managing a single export schedule
 */
export function useSingleExportSchedule(id?: string) {
  const [schedule, setSchedule] = useState<ExportSchedule | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch a single schedule
   */
  const fetchSchedule = useCallback(async (scheduleId: string) => {
    if (!scheduleId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/users/exports/schedule/${scheduleId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch schedule: ${response.statusText}`)
      }

      const data = await response.json()
      setSchedule(data.schedule)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch schedule'
      setError(message)
      console.error('Error fetching schedule:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Update the schedule
   */
  const updateSchedule = useCallback(
    async (updates: Partial<ExportSchedule>) => {
      if (!schedule?.id) return { success: false, error: 'No schedule loaded' }

      try {
        setError(null)

        const response = await fetch(`/api/admin/users/exports/schedule/${schedule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Failed to update schedule: ${response.statusText}`)
        }

        const data = await response.json()
        setSchedule(data.schedule)

        return { success: true, schedule: data.schedule }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update schedule'
        setError(message)
        return { success: false, error: message }
      }
    },
    [schedule?.id]
  )

  /**
   * Delete the schedule
   */
  const deleteSchedule = useCallback(async () => {
    if (!schedule?.id) return { success: false, error: 'No schedule loaded' }

    try {
      setError(null)

      const response = await fetch(`/api/admin/users/exports/schedule/${schedule.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to delete schedule: ${response.statusText}`)
      }

      setSchedule(null)
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete schedule'
      setError(message)
      return { success: false, error: message }
    }
  }, [schedule?.id])

  // Fetch schedule on mount if id is provided
  useEffect(() => {
    if (id) {
      fetchSchedule(id)
    }
  }, [id, fetchSchedule])

  return {
    // State
    schedule,
    isLoading,
    error,

    // Actions
    fetchSchedule,
    updateSchedule,
    deleteSchedule
  }
}
