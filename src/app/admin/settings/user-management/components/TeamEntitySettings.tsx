'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TextField, Toggle, NumberField, SelectField } from '@/components/admin/settings/FormField'
import { Save, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { TeamSettings } from '@/schemas/settings/team-management'

interface TeamEntitySettingsProps {
  isLoading?: boolean
  isSaving?: boolean
  onUpdate?: (settings: Partial<TeamSettings>) => Promise<void>
}

const tabs = [
  { key: 'structure', label: 'Structure', icon: '🏗️' },
  { key: 'availability', label: 'Availability', icon: '⏰' },
  { key: 'skills', label: 'Skills', icon: '🎯' },
  { key: 'workload', label: 'Workload', icon: '📊' },
  { key: 'performance', label: 'Performance', icon: '📈' },
]

export function TeamEntitySettings({ isLoading = false, isSaving = false, onUpdate }: TeamEntitySettingsProps) {
  const [active, setActive] = useState<string>('structure')
  const [settings, setSettings] = useState<TeamSettings | null>(null)
  const [pending, setPending] = useState<Record<string, any>>({})
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const r = await fetch('/api/admin/team-settings', { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        setSettings(j)
      }
    } catch (e) {
      toast.error('Failed to load team settings')
    }
  }

  const onChange = (section: string, key: string, value: any) => {
    setPending((p) => ({ ...p, [section]: { ...(p as any)[section], [key]: value } }))
  }

  const onSave = async () => {
    if (!Object.keys(pending).length) return
    try {
      await onUpdate?.(pending)
      await loadSettings()
      setPending({})
      toast.success('Team settings saved')
    } catch (e) {
      toast.error('Failed to save team settings')
    }
  }

  const handleExport = async () => {
    try {
      const r = await fetch('/api/admin/team-settings/export')
      const d = await r.json()
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `team-settings-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Settings exported')
    } catch (e) {
      toast.error('Failed to export settings')
    }
  }

  const handleImport = async () => {
    if (!importData) return
    try {
      const res = await fetch('/api/admin/team-settings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData),
      })
      if (res.ok) {
        await loadSettings()
        setShowImport(false)
        toast.success('Settings imported')
      }
    } catch (e) {
      toast.error('Failed to import settings')
    }
  }

  const body = useMemo(() => {
    if (!settings) return <div className="text-gray-600">Loading...</div>
    switch (active) {
      case 'structure': {
        const units = (pending.structure as any)?.orgUnits ?? settings.structure?.orgUnits ?? []
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 font-medium">Organization Units</div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const next = [...units, { id: undefined, name: 'New Unit', parentId: null, leadUserId: null }]
                  onChange('structure', 'orgUnits', next)
                }}
              >
                Add Unit
              </Button>
            </div>
            <div className="space-y-3">
              {units.map((u: any, i: number) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <TextField
                    label="Name"
                    value={u.name || ''}
                    onChange={(v) => {
                      const next = [...units]
                      next[i] = { ...u, name: v }
                      onChange('structure', 'orgUnits', next)
                    }}
                  />
                  <TextField
                    label="Lead User ID"
                    value={u.leadUserId || ''}
                    onChange={(v) => {
                      const next = [...units]
                      next[i] = { ...u, leadUserId: v }
                      onChange('structure', 'orgUnits', next)
                    }}
                  />
                  <div className="col-span-1 md:col-span-1" />
                  <div className="col-span-1 md:col-span-1" />
                  <div className="col-span-1 md:col-span-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      const next = units.filter((_: any, idx: number) => idx !== i)
                      onChange('structure', 'orgUnits', next)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'availability': {
        const av = (pending.availability as any) ?? settings.availability ?? {}
        return (
          <div className="space-y-4">
            <Toggle
              label="Allow Flexible Hours"
              value={av.allowFlexibleHours ?? false}
              onChange={(v) => onChange('availability', 'allowFlexibleHours', v)}
            />
            <NumberField
              label="Minimum Hours Notice"
              value={av.minimumHoursNotice ?? 24}
              onChange={(v) => onChange('availability', 'minimumHoursNotice', v)}
              min={0}
              max={168}
            />
            <TextField
              label="Default Timezone"
              value={av.defaultWorkingHours?.timezone ?? 'UTC'}
              onChange={(v) => onChange('availability', 'defaultWorkingHours', { ...(av.defaultWorkingHours || {}), timezone: v })}
            />
          </div>
        )
      }
      case 'skills': {
        const skills = (pending.skills as any)?.skills ?? settings.skills?.skills ?? []
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 font-medium">Team Skills</div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const next = [...skills, { key: '', name: 'New Skill', weight: 50 }]
                  onChange('skills', 'skills', next)
                }}
              >
                Add Skill
              </Button>
            </div>
            <div className="space-y-3">
              {skills.map((s: any, i: number) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <TextField
                    label="Key"
                    value={s.key || ''}
                    onChange={(v) => {
                      const next = [...skills]
                      next[i] = { ...s, key: v }
                      onChange('skills', 'skills', next)
                    }}
                  />
                  <TextField
                    label="Name"
                    value={s.name || ''}
                    onChange={(v) => {
                      const next = [...skills]
                      next[i] = { ...s, name: v }
                      onChange('skills', 'skills', next)
                    }}
                  />
                  <NumberField
                    label="Weight"
                    value={s.weight ?? 50}
                    onChange={(v) => {
                      const next = [...skills]
                      next[i] = { ...s, weight: v }
                      onChange('skills', 'skills', next)
                    }}
                    min={0}
                    max={100}
                  />
                  <div className="md:col-span-1" />
                  <div className="md:col-span-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      const next = skills.filter((_: any, idx: number) => idx !== i)
                      onChange('skills', 'skills', next)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'workload': {
        const w = (pending.workload as any) ?? settings.workload ?? {}
        return (
          <div className="space-y-4">
            <SelectField
              label="Auto-assign Strategy"
              value={w.autoAssignStrategy ?? 'ROUND_ROBIN'}
              onChange={(v) => onChange('workload', 'autoAssignStrategy', v)}
              options={[
                { value: 'ROUND_ROBIN', label: 'Round Robin' },
                { value: 'LEAST_WORKLOAD', label: 'Least Workload' },
                { value: 'SKILL_MATCH', label: 'Skill Match' },
                { value: 'MANUAL', label: 'Manual' },
              ]}
            />
            <NumberField
              label="Max Concurrent Assignments"
              value={w.maxConcurrentAssignments ?? 5}
              onChange={(v) => onChange('workload', 'maxConcurrentAssignments', v)}
              min={1}
              max={100}
            />
            <Toggle
              label="Consider Team Availability"
              value={w.considerAvailability ?? true}
              onChange={(v) => onChange('workload', 'considerAvailability', v)}
            />
          </div>
        )
      }
      case 'performance': {
        const p = (pending.performance as any) ?? settings.performance ?? {}
        return (
          <div className="space-y-4">
            <Toggle
              label="Enable Performance Metrics"
              value={p.enableMetrics ?? true}
              onChange={(v) => onChange('performance', 'enableMetrics', v)}
            />
            <NumberField
              label="Metrics Window (days)"
              value={p.metricsWindowDays ?? 30}
              onChange={(v) => onChange('performance', 'metricsWindowDays', v)}
              min={1}
              max={365}
            />
          </div>
        )
      }
      default:
        return null
    }
  }, [active, pending, settings])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👥 Team Entity Settings
          </CardTitle>
          <CardDescription>Configure how team members and teams operate in your system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex gap-2 overflow-x-auto" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={active === tab.key}
                    onClick={() => setActive(tab.key)}
                    className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                      active === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="bg-gray-50 rounded-lg p-6">{body}</div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
              <Button onClick={onSave} disabled={isSaving || Object.keys(pending).length === 0}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>Import Team Settings</CardTitle>
              <CardDescription>Upload a previously exported settings JSON file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const text = await file.text()
                      setImportData(JSON.parse(text))
                    } catch {
                      toast.error('Invalid JSON file')
                      setImportData(null)
                    }
                  }}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowImport(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={!importData}>
                    Import
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
