'use client'

import { useState, useCallback, useEffect } from 'react'
import { Report, ReportSection, ReportTemplate, DEFAULT_REPORT_TEMPLATES } from '../types/report-builder'
import { validateReportConfig, exportReportToJSON, importReportFromJSON } from '../utils/report-builder'

interface UseReportBuilderOptions {
  initialReport?: Report
  autoFetch?: boolean
}

/**
 * Hook for managing report builder state and operations
 */
export function useReportBuilder(options: UseReportBuilderOptions = {}) {
  const { initialReport, autoFetch = true } = options

  const [report, setReport] = useState<Report | null>(initialReport || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [templates, setTemplates] = useState<ReportTemplate[]>(Object.values(DEFAULT_REPORT_TEMPLATES))

  /**
   * Create a new report
   */
  const createReport = useCallback((name: string, description?: string) => {
    const newReport: Report = {
      id: crypto.randomUUID(),
      tenantId: '',
      userId: '',
      name,
      description,
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setReport(newReport)
    setIsDirty(true)
    setError(null)

    return newReport
  }, [])

  /**
   * Load a template into current report
   */
  const loadTemplate = useCallback((template: ReportTemplate) => {
    if (!report) return

    const updatedReport: Report = {
      ...report,
      sections: template.sections,
      updatedAt: new Date().toISOString()
    }

    setReport(updatedReport)
    setIsDirty(true)
    setError(null)
  }, [report])

  /**
   * Update report metadata
   */
  const updateReportMetadata = useCallback(
    (updates: Partial<Report>) => {
      if (!report) return

      const updatedReport: Report = {
        ...report,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      setReport(updatedReport)
      setIsDirty(true)
      setError(null)
    },
    [report]
  )

  /**
   * Add a new section to the report
   */
  const addSection = useCallback(
    (section: Omit<ReportSection, 'id' | 'order'>) => {
      if (!report) return

      const newSection: ReportSection = {
        ...section,
        id: crypto.randomUUID(),
        order: report.sections.length
      }

      const updatedReport: Report = {
        ...report,
        sections: [...report.sections, newSection],
        updatedAt: new Date().toISOString()
      }

      setReport(updatedReport)
      setIsDirty(true)
      setError(null)

      return newSection
    },
    [report]
  )

  /**
   * Update an existing section
   */
  const updateSection = useCallback(
    (sectionId: string, updates: Partial<ReportSection>) => {
      if (!report) return

      const updatedReport: Report = {
        ...report,
        sections: report.sections.map(section =>
          section.id === sectionId ? { ...section, ...updates } : section
        ),
        updatedAt: new Date().toISOString()
      }

      setReport(updatedReport)
      setIsDirty(true)
      setError(null)
    },
    [report]
  )

  /**
   * Remove a section from the report
   */
  const removeSection = useCallback(
    (sectionId: string) => {
      if (!report) return

      const updatedReport: Report = {
        ...report,
        sections: report.sections.filter(s => s.id !== sectionId),
        updatedAt: new Date().toISOString()
      }

      setReport(updatedReport)
      setIsDirty(true)
      setError(null)
    },
    [report]
  )

  /**
   * Reorder sections
   */
  const reorderSections = useCallback(
    (sectionIds: string[]) => {
      if (!report) return

      const sectionMap = new Map(report.sections.map(s => [s.id, s]))
      const orderedSections = sectionIds
        .map(id => sectionMap.get(id))
        .filter((s) => s !== undefined) as ReportSection[]

      // Update order property
      orderedSections.forEach((section, index) => {
        section.order = index
      })

      const updatedReport: Report = {
        ...report,
        sections: orderedSections,
        updatedAt: new Date().toISOString()
      }

      setReport(updatedReport)
      setIsDirty(true)
      setError(null)
    },
    [report]
  )

  /**
   * Save report (would call API)
   */
  const saveReport = useCallback(async () => {
    if (!report) return { success: false, error: 'No report loaded' }

    // Validate
    const validation = validateReportConfig(report)
    if (!validation.valid) {
      const message = validation.errors.join(', ')
      setError(message)
      return { success: false, error: message }
    }

    setIsSaving(true)
    setError(null)

    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 500))

      const updatedReport: Report = {
        ...report,
        updatedAt: new Date().toISOString()
      }

      setReport(updatedReport)
      setIsDirty(false)

      return { success: true, report: updatedReport }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save report'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsSaving(false)
    }
  }, [report])

  /**
   * Export report as JSON
   */
  const exportAsJSON = useCallback(() => {
    if (!report) return { success: false, error: 'No report loaded' }

    try {
      const json = exportReportToJSON(report)
      const filename = `report-${report.name.replace(/\s+/g, '-')}-${Date.now()}.json`

      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { success: true, filename }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export report'
      setError(message)
      return { success: false, error: message }
    }
  }, [report])

  /**
   * Import report from JSON file
   */
  const importFromJSON = useCallback(async (file: File) => {
    try {
      const text = await file.text()
      const result = importReportFromJSON(text)

      if (result.error) {
        setError(result.error)
        return { success: false, error: result.error }
      }

      setReport(result.report || null)
      setIsDirty(true)
      setError(null)

      return { success: true, report: result.report }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import report'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Generate report (preview/download)
   */
  const generateReport = useCallback(async (format: 'pdf' | 'xlsx' | 'csv' = 'pdf') => {
    if (!report) return { success: false, error: 'No report loaded' }

    const validation = validateReportConfig(report)
    if (!validation.valid) {
      const message = validation.errors.join(', ')
      setError(message)
      return { success: false, error: message }
    }

    setIsLoading(true)
    setError(null)

    try {
      // In a real implementation, this would call an API endpoint to generate
      // the report and return a download URL
      const response = await fetch(`/api/admin/reports/${report.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.downloadUrl) {
        // Download the file
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = `${report.name}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      return { success: true, executionId: data.executionId }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }, [report])

  /**
   * Reset to default state
   */
  const reset = useCallback(() => {
    setReport(null)
    setError(null)
    setIsDirty(false)
    setIsLoading(false)
    setIsSaving(false)
  }, [])

  /**
   * Get templates
   */
  const getTemplates = useCallback(() => {
    return templates
  }, [templates])

  /**
   * Get template by ID
   */
  const getTemplateById = useCallback(
    (id: string) => {
      return templates.find(t => t.id === id)
    },
    [templates]
  )

  // Load initial data if provided
  useEffect(() => {
    if (initialReport && autoFetch) {
      setReport(initialReport)
    }
  }, [initialReport, autoFetch])

  return {
    // State
    report,
    isLoading,
    isSaving,
    error,
    isDirty,
    templates,

    // Report operations
    createReport,
    loadTemplate,
    updateReportMetadata,
    addSection,
    updateSection,
    removeSection,
    reorderSections,
    saveReport,
    generateReport,
    reset,

    // Import/Export
    exportAsJSON,
    importFromJSON,

    // Template operations
    getTemplates,
    getTemplateById
  }
}

/**
 * Hook for loading a specific report
 */
export function useSingleReport(reportId?: string) {
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async (id: string) => {
    if (!id) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/reports/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`)
      }

      const data = await response.json()
      setReport(data.report)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch report'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (reportId) {
      fetchReport(reportId)
    }
  }, [reportId, fetchReport])

  return {
    report,
    isLoading,
    error,
    fetchReport
  }
}
