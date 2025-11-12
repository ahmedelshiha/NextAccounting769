'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TextField, Toggle, NumberField, SelectField } from '@/components/admin/settings/FormField'
import { AlertCircle, Save, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { ClientManagementSettings } from '@/schemas/settings/client-management'

interface ClientEntitySettingsProps {
  isLoading?: boolean
  isSaving?: boolean
  onUpdate?: (settings: Partial<ClientManagementSettings>) => Promise<void>
}

const tabs = [
  { key: 'registration', label: 'Registration', icon: '📝' },
  { key: 'profiles', label: 'Profiles', icon: '👤' },
  { key: 'communication', label: 'Communication', icon: '💬' },
  { key: 'segmentation', label: 'Segmentation', icon: '🏷️' },
  { key: 'loyalty', label: 'Loyalty', icon: '⭐' },
  { key: 'portal', label: 'Portal', icon: '🌐' },
]

export function ClientEntitySettings({ isLoading = false, isSaving = false, onUpdate }: ClientEntitySettingsProps) {
  const [active, setActive] = useState<string>('registration')
  const [settings, setSettings] = useState<ClientManagementSettings | null>(null)
  const [pending, setPending] = useState<Partial<ClientManagementSettings>>({})
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const r = await fetch('/api/admin/client-settings', { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        setSettings(j)
      }
    } catch (e) {
      toast.error('Failed to load client settings')
    }
  }

  const onChange = (section: keyof ClientManagementSettings, key: string, value: any) => {
    setPending(p => ({ ...p, [section]: { ...(p as any)[section], [key]: value } }))
  }

  const onSave = async () => {
    if (!Object.keys(pending).length) return
    try {
      await onUpdate?.(pending)
      await loadSettings()
      setPending({})
      toast.success('Client settings saved')
    } catch (e) {
      toast.error('Failed to save client settings')
    }
  }

  const handleExport = async () => {
    try {
      const r = await fetch('/api/admin/client-settings/export')
      const d = await r.json()
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `client-settings-${new Date().toISOString().slice(0, 10)}.json`
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
      const res = await fetch('/api/admin/client-settings/import', {
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
      case 'registration':
        return (
          <section className="space-y-4">
            <Toggle
              label="Require Account"
              value={(pending.registration as any)?.requireAccount ?? settings.registration?.requireAccount ?? false}
              onChange={(v) => onChange('registration', 'requireAccount', v)}
            />
            <Toggle
              label="Email Verification"
              value={(pending.registration as any)?.emailVerification ?? settings.registration?.emailVerification ?? true}
              onChange={(v) => onChange('registration', 'emailVerification', v)}
            />
            <SelectField
              label="Duplicate Check"
              value={(pending.registration as any)?.duplicateCheck ?? settings.registration?.duplicateCheck ?? 'email'}
              onChange={(v) => onChange('registration', 'duplicateCheck', v)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'email', label: 'Email' },
                { value: 'email+phone', label: 'Email + Phone' },
              ]}
            />
            <Toggle
              label="Collect Address"
              value={(pending.registration as any)?.collectAddress ?? settings.registration?.collectAddress ?? false}
              onChange={(v) => onChange('registration', 'collectAddress', v)}
            />
          </section>
        )
      case 'profiles': {
        const fields = (pending.profiles as any)?.fields ?? settings.profiles?.fields ?? []
        return (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 font-medium">Custom Profile Fields</div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange('profiles', 'fields', [
                    ...fields,
                    { key: '', label: '', type: 'text', required: false, visibleInPortal: true, editableByClient: true },
                  ])
                }
              >
                Add Field
              </Button>
            </div>
            <div className="space-y-3">
              {fields.length === 0 && <div className="text-sm text-gray-500">No fields defined.</div>}
              {fields.map((f: any, i: number) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <TextField
                    label="Key"
                    value={f.key}
                    onChange={(v) => {
                      const next = [...fields]
                      next[i] = { ...f, key: v }
                      onChange('profiles', 'fields', next)
                    }}
                  />
                  <TextField
                    label="Label"
                    value={f.label}
                    onChange={(v) => {
                      const next = [...fields]
                      next[i] = { ...f, label: v }
                      onChange('profiles', 'fields', next)
                    }}
                  />
                  <SelectField
                    label="Type"
                    value={f.type}
                    onChange={(v) => {
                      const next = [...fields]
                      next[i] = { ...f, type: v }
                      onChange('profiles', 'fields', next)
                    }}
                    options={[
                      { value: 'text', label: 'Text' },
                      { value: 'email', label: 'Email' },
                      { value: 'phone', label: 'Phone' },
                      { value: 'date', label: 'Date' },
                      { value: 'number', label: 'Number' },
                    ]}
                  />
                  <div className="md:col-span-2 grid grid-cols-2 gap-3">
                    <Toggle
                      label="Required"
                      value={!!f.required}
                      onChange={(v) => {
                        const next = [...fields]
                        next[i] = { ...f, required: v }
                        onChange('profiles', 'fields', next)
                      }}
                    />
                    <Toggle
                      label="Portal"
                      value={!!f.visibleInPortal}
                      onChange={(v) => {
                        const next = [...fields]
                        next[i] = { ...f, visibleInPortal: v }
                        onChange('profiles', 'fields', next)
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      const next = fields.filter((_: any, idx: number) => idx !== i)
                      onChange('profiles', 'fields', next)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )
      }
      case 'communication':
        return (
          <section className="space-y-4">
            <Toggle
              label="Email Opt-in Default"
              value={(pending.communication as any)?.emailOptInDefault ?? settings.communication?.emailOptInDefault ?? true}
              onChange={(v) => onChange('communication', 'emailOptInDefault', v)}
            />
            <Toggle
              label="SMS Opt-in Default"
              value={(pending.communication as any)?.smsOptInDefault ?? settings.communication?.smsOptInDefault ?? false}
              onChange={(v) => onChange('communication', 'smsOptInDefault', v)}
            />
            <SelectField
              label="Preferred Channel"
              value={(pending.communication as any)?.preferredChannel ?? settings.communication?.preferredChannel ?? 'email'}
              onChange={(v) => onChange('communication', 'preferredChannel', v)}
              options={[
                { value: 'email', label: 'Email' },
                { value: 'sms', label: 'SMS' },
                { value: 'none', label: 'None' },
              ]}
            />
            <Toggle
              label="Marketing Opt-in Default"
              value={(pending.communication as any)?.marketingOptInDefault ?? settings.communication?.marketingOptInDefault ?? false}
              onChange={(v) => onChange('communication', 'marketingOptInDefault', v)}
            />
          </section>
        )
      case 'segmentation':
        return (
          <section className="space-y-4">
            <TextField
              label="Tags (comma-separated)"
              value={((pending.segmentation as any)?.tags ?? settings.segmentation?.tags ?? []).join(', ')}
              onChange={(v) => onChange('segmentation', 'tags', v.split(',').map((x) => x.trim()).filter(Boolean))}
            />
          </section>
        )
      case 'loyalty':
        return (
          <section className="space-y-4">
            <Toggle
              label="Enable Loyalty Program"
              value={(pending.loyalty as any)?.enabled ?? settings.loyalty?.enabled ?? false}
              onChange={(v) => onChange('loyalty', 'enabled', v)}
            />
            <NumberField
              label="Points per $1 Spent"
              value={(pending.loyalty as any)?.pointsPerDollar ?? settings.loyalty?.pointsPerDollar ?? 0}
              onChange={(v) => onChange('loyalty', 'pointsPerDollar', v)}
              min={0}
              max={100}
            />
          </section>
        )
      case 'portal':
        return (
          <section className="space-y-4">
            <Toggle
              label="Allow Document Upload"
              value={(pending.portal as any)?.allowDocumentUpload ?? settings.portal?.allowDocumentUpload ?? true}
              onChange={(v) => onChange('portal', 'allowDocumentUpload', v)}
            />
            <Toggle
              label="Allow Invoice View"
              value={(pending.portal as any)?.allowInvoiceView ?? settings.portal?.allowInvoiceView ?? true}
              onChange={(v) => onChange('portal', 'allowInvoiceView', v)}
            />
            <Toggle
              label="Allow Payment History"
              value={(pending.portal as any)?.allowPaymentHistory ?? settings.portal?.allowPaymentHistory ?? true}
              onChange={(v) => onChange('portal', 'allowPaymentHistory', v)}
            />
            <TextField
              label="Default Language"
              value={(pending.portal as any)?.language ?? settings.portal?.language ?? 'en'}
              onChange={(v) => onChange('portal', 'language', v)}
            />
            <TextField
              label="Default Timezone"
              value={(pending.portal as any)?.timezone ?? settings.portal?.timezone ?? 'UTC'}
              onChange={(v) => onChange('portal', 'timezone', v)}
            />
          </section>
        )
      default:
        return null
    }
  }, [active, pending, settings])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏢 Client Entity Settings
          </CardTitle>
          <CardDescription>Configure how clients behave in your system</CardDescription>
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
              <CardTitle>Import Client Settings</CardTitle>
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
