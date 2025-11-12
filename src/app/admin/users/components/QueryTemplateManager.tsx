'use client'

import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MoreHorizontal,
  Download,
  Upload,
  Trash2,
  Copy,
  Eye,
  Settings
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useFilterTemplates } from '../hooks/useFilterTemplates'
import { QueryTemplate } from '../types/query-builder'
import { toast } from 'sonner'

interface QueryTemplateManagerProps {
  onLoadTemplate?: (template: QueryTemplate) => void
}

/**
 * QueryTemplateManager Component
 * Provides UI for managing filter query templates
 * Features: view, delete, export, import, search
 */
export function QueryTemplateManager({ onLoadTemplate }: QueryTemplateManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    templates,
    isLoaded,
    createTemplate,
    deleteTemplate,
    exportTemplates,
    importTemplates,
    getCustomTemplates,
    getBuiltInTemplates,
    searchTemplates
  } = useFilterTemplates()

  const customTemplates = getCustomTemplates()
  const builtInTemplates = getBuiltInTemplates()
  const filteredTemplates = searchQuery ? searchTemplates(searchQuery) : templates

  const handleExport = () => {
    try {
      const json = exportTemplates(true)
      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json))
      element.setAttribute('download', `query-templates-${new Date().toISOString().split('T')[0]}.json`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      toast.success('Templates exported successfully')
    } catch (err) {
      toast.error('Failed to export templates')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const success = importTemplates(content, true)
        if (success) {
          toast.success('Templates imported successfully')
          setSearchQuery('')
        } else {
          toast.error('Failed to import templates')
        }
      } catch (err) {
        toast.error('Invalid template file format')
      }
    }
    reader.readAsText(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteTemplate = (id: string) => {
    const success = deleteTemplate(id)
    if (success) {
      toast.success('Template deleted')
      setDeleteConfirm(null)
    }
  }

  if (!isLoaded) {
    return <Button variant="outline" disabled>Loading...</Button>
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Manage Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Query Template Manager</DialogTitle>
          <DialogDescription>
            Save, load, and manage your filter query templates
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="my-templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-templates">
              My Templates ({customTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="built-in">
              Built-in ({builtInTemplates.length})
            </TabsTrigger>
          </TabsList>

          {/* My Templates Tab */}
          <TabsContent value="my-templates" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button onClick={handleImportClick} variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </div>

            {customTemplates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-slate-500">
                    No custom templates yet. Create one by saving your current query!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="h-96 border rounded-lg overflow-y-auto">
                <div className="space-y-2 p-4">
                  {filteredTemplates
                    .filter(t => !t.isBuiltIn)
                    .map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onLoad={() => {
                          onLoadTemplate?.(template)
                          setIsOpen(false)
                        }}
                        onDelete={() => setDeleteConfirm(template.id)}
                      />
                    ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Built-in Templates Tab */}
          <TabsContent value="built-in" className="space-y-4">
            <Input
              placeholder="Search built-in templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="h-96 border rounded-lg overflow-y-auto">
              <div className="space-y-2 p-4">
                {filteredTemplates
                  .filter(t => t.isBuiltIn)
                  .map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onLoad={() => {
                        onLoadTemplate?.(template)
                        setIsOpen(false)
                      }}
                      onDelete={undefined}
                    />
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The template will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteTemplate(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

/**
 * Individual template card component
 */
interface TemplateCardProps {
  template: QueryTemplate
  onLoad: () => void
  onDelete?: () => void
}

function TemplateCard({ template, onLoad, onDelete }: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">{template.name}</CardTitle>
              {template.category && (
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              )}
            </div>
            {template.description && (
              <CardDescription className="text-xs mt-1">
                {template.description}
              </CardDescription>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Updated {new Date(template.updatedAt).toLocaleDateString()}
            </p>
          </div>

          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowPreview(!showPreview)} className="gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLoad} className="gap-2">
                  <Copy className="w-4 h-4" />
                  Load
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      {showPreview && (
        <CardContent className="pt-0">
          <div className="bg-slate-50 p-2 rounded text-xs font-mono overflow-auto max-h-32">
            <pre>{JSON.stringify(template.query, null, 2)}</pre>
          </div>
        </CardContent>
      )}

      <CardContent className="pb-3">
        <Button onClick={onLoad} size="sm" className="w-full">
          Load Template
        </Button>
      </CardContent>
    </Card>
  )
}
