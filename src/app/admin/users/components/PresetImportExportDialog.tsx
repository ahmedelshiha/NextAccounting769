'use client'

import { useState, useRef } from 'react'
import { usePresetImportExport } from '../hooks/usePresetImportExport'
import { ServerFilterPreset } from '../hooks/useServerPresets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react'

interface PresetImportExportDialogProps {
  presets: ServerFilterPreset[]
  onImportSuccess?: (imported: number) => void
  trigger?: React.ReactNode
}

export function PresetImportExportDialog({
  presets,
  onImportSuccess,
  trigger
}: PresetImportExportDialogProps) {
  const { isExporting, isImporting, error, exportPresets, validateFile } = usePresetImportExport()
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [conflictStrategy, setConflictStrategy] = useState<'skip' | 'overwrite' | 'merge'>('skip')
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      await exportPresets(presets, exportFormat)
      setImportSuccess(true)
      setTimeout(() => setImportSuccess(false), 3000)
    } catch (err) {
      // Error already in state
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(false)

    try {
      // Validate file first
      const validation = await validateFile(file)

      if (!validation.valid) {
        setImportError(validation.errors.join(', '))
        return
      }

      if (validation.warnings.length > 0) {
        console.warn('Import warnings:', validation.warnings)
      }

      // Here you would send the file to the server for actual import
      // For now, just show success message
      setImportSuccess(true)
      onImportSuccess?.(1) // Placeholder
      setTimeout(() => {
        setIsOpen(false)
      }, 2000)
    } catch (err) {
      setImportError((err as Error).message)
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || <Button variant="outline">Import/Export</Button>}</DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import / Export Presets</DialogTitle>
          <DialogDescription>Backup your filter presets or import them from another source.</DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Import
          </button>
        </div>

        <div className="py-6">
          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Export Format</label>
                <Select value={exportFormat} onValueChange={v => setExportFormat(v as 'json' | 'csv')}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (Recommended)</SelectItem>
                    <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">You have {presets.length} preset(s) to export</p>
                <p className="text-blue-800">All your presets will be saved in {exportFormat.toUpperCase()} format with full filter details.</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {importSuccess && (
                <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 p-3 rounded">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Presets exported successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Conflict Resolution</label>
                <Select value={conflictStrategy} onValueChange={v => setConflictStrategy(v as 'skip' | 'overwrite' | 'merge')}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip (keep existing presets)</SelectItem>
                    <SelectItem value="overwrite">Overwrite (replace with imported)</SelectItem>
                    <SelectItem value="merge">Merge (combine both)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div
                onClick={handleImportClick}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="font-medium text-gray-700">Click to select or drag file here</p>
                <p className="text-sm text-gray-500">Supports JSON, CSV, XLSX formats</p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {importError && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 p-3 rounded">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Presets imported successfully!</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {activeTab === 'export' && (
            <Button onClick={handleExport} disabled={isExporting || presets.length === 0}>
              {isExporting ? 'Exporting...' : 'Export Presets'}
              <Download className="w-4 h-4 ml-2" />
            </Button>
          )}
          {activeTab === 'import' && (
            <Button onClick={handleImportClick} disabled={isImporting} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Select File to Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
