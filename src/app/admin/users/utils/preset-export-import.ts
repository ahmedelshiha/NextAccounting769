import { ServerFilterPreset } from '../hooks/useServerPresets'

export interface ExportedPresets {
  version: string
  exportDate: string
  presets: ExportedPreset[]
  metadata?: {
    appVersion?: string
    tenantId?: string
    userId?: string
    totalCount?: number
  }
}

export interface ExportedPreset {
  id: string
  name: string
  description?: string
  filters: any
  isPinned: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  skipped: number
  errors: ImportError[]
  warnings: ImportWarning[]
}

export interface ImportError {
  presetName: string
  reason: string
}

export interface ImportWarning {
  presetName: string
  message: string
}

// Current version for exported presets
const EXPORT_VERSION = '1.0'

/**
 * Export presets to JSON format
 */
export function exportPresetsToJSON(presets: ServerFilterPreset[], tenantId?: string, userId?: string): string {
  const exported: ExportedPresets = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    presets: presets.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      filters: p.filters,
      isPinned: p.isPinned,
      usageCount: p.usageCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    })),
    metadata: {
      appVersion: 'v2.0',
      tenantId,
      userId,
      totalCount: presets.length
    }
  }

  return JSON.stringify(exported, null, 2)
}

/**
 * Export presets to CSV format
 */
export function exportPresetsToCSV(presets: ServerFilterPreset[]): string {
  const headers = ['Name', 'Description', 'Pinned', 'Usage Count', 'Created', 'Updated']
  const rows = presets.map(p => [
    escapeCSV(p.name),
    escapeCSV(p.description || ''),
    p.isPinned ? 'Yes' : 'No',
    p.usageCount.toString(),
    new Date(p.createdAt).toLocaleDateString(),
    new Date(p.updatedAt).toLocaleDateString()
  ])

  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')

  return csvContent
}

/**
 * Export presets to XLSX (as CSV for now - proper XLSX would need external library)
 */
export function exportPresetsToXLSX(presets: ServerFilterPreset[]): string {
  // For now, return CSV format which can be imported into Excel
  return exportPresetsToCSV(presets)
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string): string {
  if (!value) return '""'
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Validate exported preset data
 */
export function validateExportedPreset(preset: any): { valid: boolean; error?: string } {
  if (!preset.name || typeof preset.name !== 'string') {
    return { valid: false, error: 'Missing or invalid preset name' }
  }

  if (!preset.filters || typeof preset.filters !== 'object') {
    return { valid: false, error: 'Missing or invalid filters object' }
  }

  if (typeof preset.isPinned !== 'boolean') {
    return { valid: false, error: 'Invalid isPinned field (must be boolean)' }
  }

  if (typeof preset.usageCount !== 'number') {
    return { valid: false, error: 'Invalid usageCount field (must be number)' }
  }

  if (!preset.createdAt || isNaN(Date.parse(preset.createdAt))) {
    return { valid: false, error: 'Invalid createdAt date' }
  }

  if (!preset.updatedAt || isNaN(Date.parse(preset.updatedAt))) {
    return { valid: false, error: 'Invalid updatedAt date' }
  }

  return { valid: true }
}

/**
 * Parse and validate imported JSON presets
 */
export function parseImportedJSON(jsonString: string): { data: ExportedPresets | null; error?: string } {
  try {
    const data = JSON.parse(jsonString) as ExportedPresets

    // Validate structure
    if (!data.version || !Array.isArray(data.presets)) {
      return { data: null, error: 'Invalid export format: missing version or presets array' }
    }

    // Check version compatibility
    if (!data.version.startsWith('1.')) {
      return { data: null, error: `Unsupported export version: ${data.version}` }
    }

    // Validate presets
    const invalidPresets = data.presets.filter(p => {
      const validation = validateExportedPreset(p)
      return !validation.valid
    })

    if (invalidPresets.length === data.presets.length) {
      return { data: null, error: 'All presets in the file are invalid' }
    }

    return { data }
  } catch (err) {
    return { data: null, error: `Failed to parse JSON: ${(err as Error).message}` }
  }
}

/**
 * Process imported presets with conflict resolution
 */
export function processImportedPresets(
  importedPresets: ExportedPreset[],
  existingPresets: ServerFilterPreset[],
  conflictStrategy: 'skip' | 'overwrite' | 'merge' = 'skip'
): {
  toImport: ExportedPreset[]
  conflicts: string[]
  warnings: ImportWarning[]
} {
  const existingNames = new Set(existingPresets.map(p => p.name))
  const toImport: ExportedPreset[] = []
  const conflicts: string[] = []
  const warnings: ImportWarning[] = []

  for (const preset of importedPresets) {
    // Validate preset structure
    const validation = validateExportedPreset(preset)
    if (!validation.valid) {
      warnings.push({
        presetName: preset.name || 'Unknown',
        message: validation.error || 'Invalid preset'
      })
      continue
    }

    // Check for conflicts
    if (existingNames.has(preset.name)) {
      conflicts.push(preset.name)

      switch (conflictStrategy) {
        case 'overwrite':
          toImport.push(preset)
          break
        case 'merge':
          // For merge, keep existing but warn
          warnings.push({
            presetName: preset.name,
            message: 'A preset with this name already exists. Skipping to avoid overwriting.'
          })
          break
        case 'skip':
        default:
          warnings.push({
            presetName: preset.name,
            message: 'A preset with this name already exists. Skipped.'
          })
      }
    } else {
      toImport.push(preset)
    }
  }

  return { toImport, conflicts, warnings }
}

/**
 * Import presets from file
 */
export async function importPresetsFromFile(
  file: File
): Promise<{
  data: ExportedPresets | null
  error?: string
}> {
  try {
    const text = await file.text()

    // Detect file type by extension
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'json') {
      return parseImportedJSON(text)
    } else if (extension === 'csv' || extension === 'xlsx') {
      // For CSV, we would need a CSV parser - return error for now
      return {
        data: null,
        error: 'CSV/XLSX import not yet implemented. Please use JSON export format.'
      }
    } else {
      // Try JSON parsing anyway
      return parseImportedJSON(text)
    }
  } catch (err) {
    return {
      data: null,
      error: `Failed to read file: ${(err as Error).message}`
    }
  }
}

/**
 * Convert exported preset to server preset format
 */
export function convertExportedToServerPreset(exported: ExportedPreset): Omit<ServerFilterPreset, 'id'> {
  return {
    name: exported.name,
    description: exported.description,
    filters: exported.filters,
    isPinned: exported.isPinned,
    usageCount: 0, // Reset usage count on import
    lastUsedAt: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Create a backup of all presets
 */
export function createBackupFilename(): string {
  const date = new Date()
  const timestamp = date.toISOString().replace(/[:.]/g, '-').split('T')[0]
  return `filter-presets-backup-${timestamp}.json`
}

/**
 * Validate import file
 */
export async function validateImportFile(file: File): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    errors.push('File size exceeds 5MB limit')
  }

  // Check file type
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['json', 'csv', 'xlsx'].includes(extension || '')) {
    errors.push('Invalid file format. Supported: JSON, CSV, XLSX')
  }

  // Try to parse the file
  if (extension === 'json') {
    const parseResult = await importPresetsFromFile(file)
    if (parseResult.error) {
      errors.push(parseResult.error)
    } else if (!parseResult.data) {
      errors.push('Failed to parse JSON file')
    } else if (parseResult.data.presets.length === 0) {
      warnings.push('No presets found in the file')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
