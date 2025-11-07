'use client'

import React, { useState, useCallback } from 'react'
import { PermissionTemplate } from '../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Copy, Trash2, Eye, Users } from 'lucide-react'
import { toast } from 'sonner'

interface PermissionTemplatesProps {
  templates: PermissionTemplate[]
  isLoading: boolean
  isSaving: boolean
  onUpdate: (templates: PermissionTemplate[]) => Promise<void>
}

const SYSTEM_TEMPLATES: PermissionTemplate[] = [
  {
    id: 'tpl_accounting_manager',
    name: 'Accounting Manager',
    description: 'Full accounting and financial management capabilities',
    category: 'role-based',
    permissions: [],
    usageCount: 0,
    lastUsedAt: null,
    createdBy: 'system',
    isActive: true,
    isSystem: true,
    suggestedRoles: ['ADMIN', 'TEAM_LEAD'],
    suggestedDepartments: ['Accounting']
  },
  {
    id: 'tpl_bookkeeper',
    name: 'Bookkeeper',
    description: 'Core bookkeeping and transaction entry',
    category: 'role-based',
    permissions: [],
    usageCount: 0,
    lastUsedAt: null,
    createdBy: 'system',
    isActive: true,
    isSystem: true,
    suggestedRoles: ['TEAM_MEMBER'],
    suggestedDepartments: ['Accounting']
  },
  {
    id: 'tpl_client_portal',
    name: 'Client Portal User',
    description: 'Limited access for client portal',
    category: 'role-based',
    permissions: [],
    usageCount: 0,
    lastUsedAt: null,
    createdBy: 'system',
    isActive: true,
    isSystem: true,
    suggestedRoles: ['CLIENT'],
    suggestedDepartments: []
  }
]

export function PermissionTemplates({
  templates,
  isLoading,
  isSaving,
  onUpdate
}: PermissionTemplatesProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const allTemplates = [...SYSTEM_TEMPLATES, ...templates]

  const handleCreateTemplate = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required')
      return
    }

    const newTemplate: PermissionTemplate = {
      id: `tpl_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      category: 'role-based',
      permissions: [],
      usageCount: 0,
      lastUsedAt: null,
      createdBy: 'admin',
      isActive: true,
      isSystem: false,
      suggestedRoles: [],
      suggestedDepartments: []
    }

    try {
      await onUpdate([...templates, newTemplate])
      setFormData({ name: '', description: '' })
      setIsCreateDialogOpen(false)
      toast.success('Template created successfully')
    } catch (error) {
      toast.error('Failed to create template')
    }
  }, [formData, templates, onUpdate])

  const handleCopyTemplate = useCallback(async (template: PermissionTemplate) => {
    const copiedTemplate: PermissionTemplate = {
      ...template,
      id: `tpl_${Date.now()}`,
      name: `${template.name} (Copy)`,
      isSystem: false,
      createdBy: 'admin',
      usageCount: 0,
      lastUsedAt: null
    }

    try {
      await onUpdate([...templates, copiedTemplate])
      toast.success('Template copied successfully')
    } catch (error) {
      toast.error('Failed to copy template')
    }
  }, [templates, onUpdate])

  const handleDeleteTemplate = useCallback(async () => {
    if (!templateToDelete) return

    try {
      const updatedTemplates = templates.filter(t => t.id !== templateToDelete)
      await onUpdate(updatedTemplates)
      setTemplateToDelete(null)
      toast.success('Template deleted successfully')
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }, [templateToDelete, templates, onUpdate])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Templates */}
      <Card>
        <CardHeader>
          <CardTitle>System Templates</CardTitle>
          <CardDescription>
            Pre-built templates optimized for common use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SYSTEM_TEMPLATES.map((template) => (
              <div key={template.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                  <Badge>System</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{template.permissions.length} permissions</span>
                  <span>{template.usageCount} users</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTemplate(template)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyTemplate(template)}
                    disabled={isSaving}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Templates</CardTitle>
              <CardDescription>
                Create custom permission templates for your organization
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={isSaving}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No custom templates yet. Create one or copy a system template.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                    {!template.isActive && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{template.permissions.length} permissions</span>
                    <span>{template.usageCount} users</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTemplateToDelete(template.id)}
                      disabled={isSaving || template.usageCount > 0}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Template</DialogTitle>
            <DialogDescription>
              Create a new permission template for quick assignment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tpl-name">Template Name</Label>
              <Input
                id="tpl-name"
                placeholder="e.g., Report Analyst, Finance Manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tpl-description">Description</Label>
              <Textarea
                id="tpl-description"
                placeholder="What permissions does this template grant?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={isSaving}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Category</p>
                  <p className="font-semibold capitalize">{selectedTemplate.category}</p>
                </div>
                <div>
                  <p className="text-gray-600">Users</p>
                  <p className="font-semibold">{selectedTemplate.usageCount}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Permissions ({selectedTemplate.permissions.length})</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedTemplate.permissions.length === 0 ? (
                    <p className="text-sm text-gray-500">No permissions assigned yet</p>
                  ) : (
                    selectedTemplate.permissions.map((perm) => (
                      <div key={perm.id} className="text-sm text-gray-600">
                        • {perm.name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedTemplate(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} disabled={isSaving}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
