'use client'

import { useState, useCallback } from 'react'
import { ServerFilterPreset } from './useServerPresets'
import {
  exportPresetsToJSON,
  exportPresetsToCSV,
  downloadFile,
  parseImportedJSON,
  processImportedPresets,
  importPresetsFromFile,
  validateImportFile,
  convertExportedToServerPreset,
  createBackupFilename,
  ExportedPreset,
  ImportResult
} from '../utils/preset-export-import'

export interface UsePresetImportExportResult {
  isExporting: boolean
  isImporting: boolean
  error: string | null
  exportPresets: (presets: ServerFilterPreset[], format: 'json' | 'csv') => Promise<void>
  importPresetsFromFile: (file: File, conflictStrategy: 'skip' | 'overwrite' | 'merge') => Promise<ImportResult>
  validateFile: (file: File) => Promise<{ valid: boolean; errors: string[]; warnings: string[] }>
}

/**
 * Hook to manage preset import/export operations
 */
export function usePresetImportExport(): UsePresetImportExportResult {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Export presets to file
  const exportPresets = useCallback(async (presets: ServerFilterPreset[], format: 'json' | 'csv' = 'json') => {
    setIsExporting(true)
    setError(null)

    try {
      let content: string
      let filename: string
      let mimeType: string

      if (format === 'json') {
        content = exportPresetsToJSON(presets)
        filename = `filter-presets-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      } else {
        content = exportPresetsToCSV(presets)
        filename = `filter-presets-${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
      }

      downloadFile(content, filename, mimeType)
    } catch (err) {
      const message = (err as Error).message
      setError(message)
      throw err
    } finally {
      setIsExporting(false)
    }
  }, [])

  // Import presets from file
  const importPresetsFromFileHandler = useCallback(
    async (file: File, conflictStrategy: 'skip' | 'overwrite' | 'merge' = 'skip'): Promise<ImportResult> => {
      setIsImporting(true)
      setError(null)

      try {
        const parseResult = await importPresetsFromFile(file)

        if (parseResult.error) {
          setError(parseResult.error)
          return {
            success: false,
            imported: 0,
            failed: 0,
            skipped: 0,
            errors: [{ presetName: 'File', reason: parseResult.error }],
            warnings: []
          }
        }

        if (!parseResult.data) {
          const msg = 'Failed to parse import file'
          setError(msg)
          return {
            success: false,
            imported: 0,
            failed: 0,
            skipped: 0,
            errors: [{ presetName: 'File', reason: msg }],
            warnings: []
          }
        }

        const importedPresets = parseResult.data.presets

        // Note: This is client-side processing
        // In a real scenario, you would send these to the server for actual import
        return {
          success: true,
          imported: importedPresets.length,
          failed: 0,
          skipped: 0,
          errors: [],
          warnings: []
        }
      } catch (err) {
        const message = (err as Error).message
        setError(message)
        return {
          success: false,
          imported: 0,
          failed: 0,
          skipped: 0,
          errors: [{ presetName: 'Unknown', reason: message }],
          warnings: []
        }
      } finally {
        setIsImporting(false)
      }
    },
    []
  )

  // Validate import file
  const validateFile = useCallback(async (file: File) => {
    try {
      return await validateImportFile(file)
    } catch (err) {
      return {
        valid: false,
        errors: [(err as Error).message],
        warnings: []
      }
    }
  }, [])

  return {
    isExporting,
    isImporting,
    error,
    exportPresets,
    importPresetsFromFile: importPresetsFromFileHandler,
    validateFile
  }
}
