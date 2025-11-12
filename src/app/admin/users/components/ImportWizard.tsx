'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ImportWizardProps {
  onImportComplete?: (results: ImportResults) => void
}

interface ImportResults {
  totalRows: number
  successfulRows: number
  failedRows: number
  errors: ImportError[]
  warnings: string[]
}

interface ImportError {
  row: number
  field: string
  message: string
  value?: any
}

interface FieldMapping {
  sourceColumn: string
  targetField: string
  transformation?: string
  required: boolean
}

const SUPPORTED_FORMATS = ['CSV', 'Excel', 'JSON', 'XML']

const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  { sourceColumn: 'email', targetField: 'email', required: true },
  { sourceColumn: 'first_name', targetField: 'firstName', required: true },
  { sourceColumn: 'last_name', targetField: 'lastName', required: false },
  { sourceColumn: 'role', targetField: 'role', transformation: 'role_mapping', required: false },
  { sourceColumn: 'status', targetField: 'status', required: false }
]

export function ImportWizard({ onImportComplete }: ImportWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [selectedFormat, setSelectedFormat] = useState<string>('CSV')
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>(DEFAULT_FIELD_MAPPINGS)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ImportResults | null>(null)
  const [dryRunMode, setDryRunMode] = useState(true)

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setFileContent(content)
      parsePreview(content)
    }
    reader.readAsText(selectedFile)
  }

  // Parse file preview
  const parsePreview = (content: string) => {
    try {
      let data: any[] = []

      if (selectedFormat === 'CSV') {
        const lines = content.split('\n').slice(0, 6) // First 5 data rows
        const headers = lines[0].split(',').map((h) => h.trim())
        data = lines.slice(1).map((line) => {
          const values = line.split(',')
          const obj: Record<string, string> = {}
          headers.forEach((header, index) => {
            obj[header] = values[index]?.trim() || ''
          })
          return obj
        })
      } else if (selectedFormat === 'JSON') {
        data = JSON.parse(content).slice(0, 5)
      }

      setPreviewData(data)
    } catch (error) {
      setValidationErrors([
        {
          row: 0,
          field: 'file',
          message: `Failed to parse ${selectedFormat} file`
        }
      ])
    }
  }

  // Validate data
  const validateData = () => {
    const errors: ImportError[] = []
    let rowNumber = 2 // Start from row 2 (after header)

    previewData.forEach((row) => {
      fieldMappings.forEach((mapping) => {
        const value = row[mapping.sourceColumn]

        if (mapping.required && !value) {
          errors.push({
            row: rowNumber,
            field: mapping.targetField,
            message: `${mapping.targetField} is required`,
            value
          })
        }

        // Email validation
        if (
          mapping.targetField === 'email' &&
          value &&
          !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        ) {
          errors.push({
            row: rowNumber,
            field: mapping.targetField,
            message: 'Invalid email format',
            value
          })
        }
      })

      rowNumber++
    })

    setValidationErrors(errors)
    return errors.length === 0
  }

  // Simulate import
  const handleDryRun = async () => {
    if (!validateData()) {
      return
    }

    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      const successCount = previewData.length - validationErrors.length
      setResults({
        totalRows: previewData.length,
        successfulRows: successCount,
        failedRows: validationErrors.length,
        errors: validationErrors,
        warnings: ['3 duplicate emails found', '2 invalid roles will be set to MEMBER']
      })

      setStep(4)
    } finally {
      setIsProcessing(false)
    }
  }

  // Execute import
  const handleExecuteImport = async () => {
    setIsProcessing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

      const successCount = previewData.length - validationErrors.length
      const finalResults: ImportResults = {
        totalRows: previewData.length,
        successfulRows: successCount,
        failedRows: validationErrors.length,
        errors: validationErrors,
        warnings: []
      }

      setResults(finalResults)
      onImportComplete?.(finalResults)
      setStep(5)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Upload className="w-8 h-8" />
          Import Data
        </h1>
        <p className="text-muted-foreground">
          Import users and data from CSV, Excel, JSON, or XML files
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {[
          { num: 1, label: 'Format' },
          { num: 2, label: 'Upload' },
          { num: 3, label: 'Map Fields' },
          { num: 4, label: 'Preview' },
          { num: 5, label: 'Complete' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= s.num
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </div>
            <span className="text-sm font-medium">{s.label}</span>
            {s.num < 5 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Format */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Import Format</CardTitle>
            <CardDescription>Choose the file format you want to import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {SUPPORTED_FORMATS.map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedFormat === format
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">{format}</div>
                  <div className="text-sm text-muted-foreground">
                    {format === 'CSV' && 'Comma-separated values'}
                    {format === 'Excel' && 'Microsoft Excel (.xlsx)'}
                    {format === 'JSON' && 'JavaScript Object Notation'}
                    {format === 'XML' && 'Extensible Markup Language'}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(2)} className="ml-auto">
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload File */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload {selectedFormat} File</CardTitle>
            <CardDescription>Select a {selectedFormat} file from your computer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                accept={selectedFormat === 'CSV' ? '.csv' : '.xlsx,.json,.xml'}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div className="font-semibold">Drop file here or click to select</div>
                <div className="text-sm text-muted-foreground">
                  Maximum file size: 10 MB
                </div>
              </label>
            </div>

            {file && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  File &quot;{file.name}&quot; selected ({(file.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!file} className="ml-auto">
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Map Fields */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Map Fields</CardTitle>
            <CardDescription>Map source columns to destination fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {fieldMappings.map((mapping, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-3 items-center p-3 border rounded-lg"
                >
                  <div>
                    <label className="text-sm font-medium">Source Column</label>
                    <Input
                      value={mapping.sourceColumn}
                      onChange={(e) => {
                        const newMappings = [...fieldMappings]
                        newMappings[index].sourceColumn = e.target.value
                        setFieldMappings(newMappings)
                      }}
                      placeholder="Column name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Field</label>
                    <Input
                      value={mapping.targetField}
                      onChange={(e) => {
                        const newMappings = [...fieldMappings]
                        newMappings[index].targetField = e.target.value
                        setFieldMappings(newMappings)
                      }}
                      placeholder="Field name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Required</label>
                    <input
                      type="checkbox"
                      checked={mapping.required}
                      onChange={(e) => {
                        const newMappings = [...fieldMappings]
                        newMappings[index].required = e.target.checked
                        setFieldMappings(newMappings)
                      }}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full" size="sm">
              + Add Mapping
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="ml-auto">
                Preview <Eye className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Preview & Validation */}
      {step === 4 && (
        <Tabs defaultValue="preview" className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="validation">
              Validation ({validationErrors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>First 5 rows of imported data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {fieldMappings.map((m) => (
                          <th key={m.targetField} className="text-left py-2 px-3 font-medium">
                            {m.targetField}
                            {m.required && <span className="text-red-500">*</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          {fieldMappings.map((m) => (
                            <td
                              key={`${idx}-${m.targetField}`}
                              className="py-2 px-3 text-muted-foreground"
                            >
                              {row[m.sourceColumn] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle>Validation Results</CardTitle>
                <CardDescription>
                  {validationErrors.length === 0
                    ? 'All rows valid'
                    : `${validationErrors.length} error(s) found`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {validationErrors.length === 0 ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      All rows passed validation
                    </AlertDescription>
                  </Alert>
                ) : (
                  validationErrors.map((error, idx) => (
                    <Alert key={idx} className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        Row {error.row}, {error.field}: {error.message}
                      </AlertDescription>
                    </Alert>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dry-run"
                checked={dryRunMode}
                onChange={(e) => setDryRunMode(e.target.checked)}
              />
              <label htmlFor="dry-run" className="text-sm font-medium">
                Dry-run mode (preview without making changes)
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                onClick={handleDryRun}
                disabled={isProcessing || validationErrors.length > 0}
                className="ml-auto"
              >
                {isProcessing ? 'Running...' : 'Run Dry Test'}
              </Button>
              <Button
                onClick={handleExecuteImport}
                disabled={isProcessing || validationErrors.length > 0}
              >
                {isProcessing ? 'Importing...' : 'Execute Import'}
              </Button>
            </div>
          </div>
        </Tabs>
      )}

      {/* Step 5: Complete */}
      {step === 5 && results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.failedRows === 0 ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Import Completed Successfully
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                  Import Completed with Warnings
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-blue-50">
                <div className="text-3xl font-bold text-blue-600">{results.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50">
                <div className="text-3xl font-bold text-green-600">{results.successfulRows}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50">
                <div className="text-3xl font-bold text-red-600">{results.failedRows}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            {results.warnings.length > 0 && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <ul className="list-disc list-inside space-y-1">
                    {results.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                Import Another File
              </Button>
              <Button onClick={() => window.location.href = '/admin/users'} className="w-full">
                View Imported Users
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
