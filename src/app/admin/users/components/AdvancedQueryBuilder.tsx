'use client'

import React, { useState } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Zap, Save, BookOpen } from 'lucide-react'
import {
  FilterCondition,
  FilterGroup,
  QueryTemplate,
  FIELD_METADATA,
  OPERATOR_METADATA,
  FilterField,
  FilterOperator,
  LogicalOperator
} from '../types/query-builder'
import { useQueryBuilder } from '../hooks/useQueryBuilder'

interface AdvancedQueryBuilderProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onApplyQuery?: (query: FilterGroup | FilterCondition) => void
}

/**
 * AdvancedQueryBuilder Component
 * Provides a visual interface for building complex filter queries
 * Supports AND/OR logic, nested groups, and multiple operators
 * Enhanced with larger dialog and improved Oracle Fusion styling
 */
export function AdvancedQueryBuilder({
  isOpen,
  onOpenChange,
  onApplyQuery
}: AdvancedQueryBuilderProps) {
  const [open, setOpen] = useState(isOpen ?? false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')

  const queryBuilder = useQueryBuilder()
  const { query, addCondition: addConditionHook, removeCondition, updateCondition, saveAsTemplate, loadTemplate, deleteTemplate, templates, builtInTemplates, customTemplates } = queryBuilder

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const handleApplyQuery = () => {
    onApplyQuery?.(query)
    handleOpenChange(false)
  }

  const handleSaveTemplate = () => {
    if (templateName.trim()) {
      saveAsTemplate(templateName, templateDescription)
      setTemplateName('')
      setTemplateDescription('')
      setShowTemplateDialog(false)
    }
  }

  // Add condition handler - works for both single conditions and groups
  const handleAddCondition = () => {
    const id = isGroup ? (query as FilterGroup).id : (query as FilterCondition).id
    addConditionHook(id)
  }

  const isGroup = 'conditions' in query

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 hover:bg-slate-100">
          <Zap className="w-4 h-4" />
          Advanced Query
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4 shrink-0">
          <DialogTitle className="text-2xl font-bold text-gray-900">Advanced Query Builder</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-gray-600">
            Build complex filter queries with AND/OR logic and multiple operators
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-6 p-6">
          {/* Left: Query Builder */}
          <div className="col-span-2 space-y-5">
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 py-4">
                <CardTitle className="text-lg font-semibold text-slate-900">Filter Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {isGroup ? (
                  <QueryGroupRenderer
                    group={query as FilterGroup}
                    onAddCondition={addConditionHook}
                    onRemoveCondition={removeCondition}
                    onUpdateCondition={updateCondition}
                  />
                ) : (
                  <QueryConditionRenderer
                    condition={query as FilterCondition}
                    onRemove={() => removeCondition(query.id)}
                    onUpdate={(updates) => updateCondition(query.id, updates)}
                  />
                )}

                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCondition}
                    className="gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Condition
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleApplyQuery} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                Apply Query
              </Button>
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="hover:bg-slate-100 border-slate-300">
                Cancel
              </Button>
            </div>
          </div>

          {/* Right: Templates & Save Options */}
          <div className="space-y-5">
            {/* Save as Template */}
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 py-4">
                <CardTitle className="text-lg font-semibold text-slate-900">Save Query</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {showTemplateDialog ? (
                  <div className="space-y-3">
                    <Input
                      placeholder="Template name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="text-sm border-slate-200 focus:border-blue-500"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      className="text-sm border-slate-200 focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveTemplate} className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowTemplateDialog(false)}
                        className="hover:bg-slate-100"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowTemplateDialog(true)}
                    className="w-full gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                  >
                    <Save className="w-4 h-4" />
                    Save as Template
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Built-in Templates */}
            {builtInTemplates.length > 0 && (
              <Card className="border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 py-4">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Built-in Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {builtInTemplates.map((template) => (
                      <Button
                        key={template.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => loadTemplate(template.id)}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Custom Templates */}
            {customTemplates.length > 0 && (
              <Card className="border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 py-4">
                  <CardTitle className="text-lg font-semibold text-slate-900">My Templates</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {customTemplates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-slate-50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 justify-start text-sm hover:bg-slate-100 hover:text-slate-900"
                          onClick={() => loadTemplate(template.id)}
                        >
                          {template.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Renders a single filter condition with field, operator, and value inputs
 */
interface QueryConditionRendererProps {
  condition: FilterCondition
  onRemove: () => void
  onUpdate: (updates: Partial<FilterCondition>) => void
}

function QueryConditionRenderer({
  condition,
  onRemove,
  onUpdate
}: QueryConditionRendererProps) {
  const fieldMeta = FIELD_METADATA[condition.field]
  const operatorMeta = OPERATOR_METADATA[condition.operator]

  return (
    <div className="flex items-end gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium text-slate-700">Field</label>
        <Select value={condition.field} onValueChange={(value) => onUpdate({ field: value as FilterField })}>
          <SelectTrigger className="h-9 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FIELD_METADATA).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium text-slate-700">Operator</label>
        <Select value={condition.operator} onValueChange={(value) => onUpdate({ operator: value as FilterOperator })}>
          <SelectTrigger className="h-9 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fieldMeta.operators.map((op) => {
              const opMeta = OPERATOR_METADATA[op]
              return (
                <SelectItem key={op} value={op}>
                  {opMeta.label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {operatorMeta.requiresValue !== false && (
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-slate-700">Value</label>
          <Input
            type="text"
            placeholder="Enter value"
            value={String(condition.value || '')}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="h-9 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
        title="Remove condition"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

/**
 * Renders a group of conditions with AND/OR toggle
 */
interface QueryGroupRendererProps {
  group: FilterGroup
  onAddCondition: (groupId: string) => void
  onRemoveCondition: (id: string) => void
  onUpdateCondition: (id: string, updates: Partial<FilterCondition>) => void
}

function QueryGroupRenderer({
  group,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition
}: QueryGroupRendererProps) {
  return (
    <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 font-semibold">
            {group.operator}
          </Badge>
          <span className="text-sm font-medium text-slate-600">
            {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {group.conditions.map((condition, index) => (
          <div key={condition.id}>
            {index > 0 && (
              <div className="text-sm font-semibold text-slate-600 py-2 px-3 text-center bg-white rounded border border-slate-200 my-1">
                {group.operator}
              </div>
            )}
            {('conditions' in condition) ? (
              <QueryGroupRenderer
                group={condition}
                onAddCondition={onAddCondition}
                onRemoveCondition={onRemoveCondition}
                onUpdateCondition={onUpdateCondition}
              />
            ) : (
              <QueryConditionRenderer
                condition={condition}
                onRemove={() => onRemoveCondition(condition.id)}
                onUpdate={(updates) => onUpdateCondition(condition.id, updates)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
