'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import SettingsShell, { SettingsSection, SettingsCard } from '@/components/admin/settings/SettingsShell'
import FavoriteToggle from '@/components/admin/settings/FavoriteToggle'
import PermissionGate from '@/components/PermissionGate'
import { PERMISSIONS } from '@/lib/permissions'
import Tabs from '@/components/admin/settings/Tabs'
import { AlertCircle, Globe, Zap, BarChart3, Lightbulb, Plus, Trash2, Edit2, Check, X, Eye, EyeOff, Star, Code2 } from 'lucide-react'
import { TextField, SelectField, Toggle } from '@/components/admin/settings/FormField'
import { toast } from 'sonner'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

const tabs = [
  { key: 'languages', label: 'Languages & Availability' },
  { key: 'organization', label: 'Organization Settings' },
  { key: 'user-preferences', label: 'User Language Control' },
  { key: 'regional', label: 'Regional Formats' },
  { key: 'integration', label: 'Translation Platforms' },
  { key: 'translations', label: 'Translation Dashboard' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'discovery', label: 'Key Discovery' },
  { key: 'heatmap', label: 'Activity Heatmap' },
]

interface LanguageRow {
  code: string
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  flag?: string
  bcp47Locale: string
  enabled: boolean
  featured?: boolean
  autoDetect?: boolean
}

interface OrganizationLocalizationSettings {
  defaultLanguage: string
  fallbackLanguage: string
  showLanguageSwitcher: boolean
  persistLanguagePreference: boolean
  autoDetectBrowserLanguage: boolean
  allowUserLanguageOverride: boolean
  enableRtlSupport: boolean
  missingTranslationBehavior: 'show-key' | 'show-fallback' | 'show-empty'
}

interface RegionalFormat {
  language: string
  dateFormat: string
  timeFormat: string
  currencyCode: string
  currencySymbol: string
  numberFormat: string
  decimalSeparator: string
  thousandsSeparator: string
}

interface CrowdinIntegration {
  projectId: string
  apiToken: string
  autoSyncDaily: boolean
  syncOnDeploy: boolean
  createPrs: boolean
}

export default function LocalizationContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('languages')

  // Core language management state
  const [languages, setLanguages] = useState<LanguageRow[]>([])
  const [newLang, setNewLang] = useState<LanguageRow>({
    code: '',
    name: '',
    nativeName: '',
    direction: 'ltr',
    flag: '🌐',
    bcp47Locale: '',
    enabled: true,
    featured: false,
  })
  const [editing, setEditing] = useState<Record<string, Partial<LanguageRow>>>({})

  // Organization settings state
  const [orgSettings, setOrgSettings] = useState<OrganizationLocalizationSettings>({
    defaultLanguage: 'en',
    fallbackLanguage: 'en',
    showLanguageSwitcher: true,
    persistLanguagePreference: true,
    autoDetectBrowserLanguage: true,
    allowUserLanguageOverride: true,
    enableRtlSupport: true,
    missingTranslationBehavior: 'show-fallback',
  })

  // Regional formats state
  const [regionalFormats, setRegionalFormats] = useState<Record<string, RegionalFormat>>({})
  const [regionalFormatsEdited, setRegionalFormatsEdited] = useState(false)

  // Crowdin integration state
  const [crowdinIntegration, setCrowdinIntegration] = useState<CrowdinIntegration>({
    projectId: '',
    apiToken: '',
    autoSyncDaily: true,
    syncOnDeploy: false,
    createPrs: true,
  })
  const [crowdinLoaded, setCrowdinLoaded] = useState(false)
  const [crowdinTestLoading, setCrowdinTestLoading] = useState(false)
  const [crowdinTestResult, setCrowdinTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Translation dashboard state
  const [status, setStatus] = useState<any>(null)
  const [missingKeys, setMissingKeys] = useState<any[]>([])
  const [recentKeys, setRecentKeys] = useState<any[]>([])

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [analyticsTrends, setAnalyticsTrends] = useState<any[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddLanguageForm, setShowAddLanguageForm] = useState(false)

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && tabs.some(tab => tab.key === t)) setActiveTab(t)
  }, [searchParams])

  useEffect(() => {
    // Load only essential data initially
    loadEssential()
  }, [])

  useEffect(() => {
    // Load tab-specific data when tab changes
    loadTabData()
  }, [activeTab])

  const loadEssential = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Load only essential data for initial page load
      await Promise.all([
        loadLanguages(),
        loadOrgSettings(),
      ])
    } catch (e) {
      console.error('Failed to load essential data:', e)
      setError('Failed to load localization settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTabData = useCallback(async () => {
    try {
      // Load tab-specific data on demand
      switch (activeTab) {
        case 'regional':
          if (Object.keys(regionalFormats).length === 0) {
            await loadRegionalFormats()
          }
          break
        case 'integration':
          if (!crowdinLoaded) {
            await loadCrowdinIntegration()
          }
          break
        case 'translations':
          if (!status) {
            await loadTranslationStatus()
          }
          break
        case 'analytics':
          if (!analyticsData) {
            await loadAnalytics()
          }
          break
      }
    } catch (e) {
      console.error('Failed to load tab data:', e)
    }
  }, [activeTab, regionalFormats, crowdinLoaded, status, analyticsData])

  async function loadLanguages() {
    try {
      const r = await fetch('/api/admin/languages')
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to load languages')
      setLanguages(d.data || [])
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e)
      console.error('Failed to load languages:', error)
      throw e
    }
  }

  async function loadOrgSettings() {
    try {
      const r = await fetch('/api/admin/org-settings/localization')
      if (r.ok) {
        const d = await r.json()
        setOrgSettings(prev => ({ ...prev, ...d.data }))
      }
    } catch (e) {
      console.error('Failed to load org settings:', e)
    }
  }

  async function loadRegionalFormats() {
    try {
      const r = await fetch('/api/admin/regional-formats')
      if (r.ok) {
        const d = await r.json()
        setRegionalFormats(d.data || {})
      }
    } catch (e) {
      console.error('Failed to load regional formats:', e)
    }
  }

  async function loadCrowdinIntegration() {
    try {
      const r = await fetch('/api/admin/crowdin-integration')
      if (r.ok) {
        const d = await r.json()
        if (d.data) {
          setCrowdinIntegration({
            projectId: d.data.projectId || '',
            apiToken: d.data.apiTokenMasked || '',
            autoSyncDaily: d.data.autoSyncDaily ?? true,
            syncOnDeploy: d.data.syncOnDeploy ?? false,
            createPrs: d.data.createPrs ?? true,
          })
        }
        setCrowdinLoaded(true)
      }
    } catch (e) {
      console.error('Failed to load Crowdin integration:', e)
      setCrowdinLoaded(true)
    }
  }

  async function loadTranslationStatus() {
    try {
      const r = await fetch('/api/admin/translations/status')
      if (r.ok) {
        const d = await r.json()
        setStatus(d)
        const rMissing = await fetch('/api/admin/translations/missing?limit=10')
        if (rMissing.ok) setMissingKeys((await rMissing.json()).data || [])
        const rRecent = await fetch('/api/admin/translations/recent?days=7&limit=10')
        if (rRecent.ok) setRecentKeys((await rRecent.json()).data || [])
      }
    } catch (e) {
      console.error('Failed to load translation status:', e)
    }
  }

  async function loadAnalytics() {
    try {
      setAnalyticsLoading(true)
      const r = await fetch('/api/admin/user-language-analytics')
      if (r.ok) {
        const d = await r.json()
        setAnalyticsData(d.data)
      }
    } catch (e) {
      console.error('Failed to load analytics:', e)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  async function saveOrgSettings() {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch('/api/admin/org-settings/localization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgSettings),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to save organization settings')
      toast.success('Organization settings saved')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e)
      setError(error || 'Failed to save organization settings')
      toast.error(error || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function saveRegionalFormats() {
    setSaving(true)
    setError(null)
    try {
      const promises = Object.entries(regionalFormats).map(([code, format]) =>
        fetch('/api/admin/regional-formats', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...format,
            language: code,
          }),
        })
      )

      const responses = await Promise.all(promises)
      for (const r of responses) {
        if (!r.ok) {
          const d = await r.json()
          throw new Error(d?.error || 'Failed to save regional formats')
        }
      }

      toast.success('Regional formats saved')
      setSaved(true)
      setRegionalFormatsEdited(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e)
      setError(error || 'Failed to save regional formats')
      toast.error(error || 'Failed to save formats')
    } finally {
      setSaving(false)
    }
  }

  async function saveCrowdinIntegration() {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch('/api/admin/crowdin-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crowdinIntegration),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to save Crowdin integration')
      toast.success('Crowdin integration saved')
      setSaved(true)
      await loadCrowdinIntegration()
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e)
      setError(error || 'Failed to save Crowdin integration')
      toast.error(error || 'Failed to save integration')
    } finally {
      setSaving(false)
    }
  }

  async function testCrowdinConnection() {
    setCrowdinTestLoading(true)
    setCrowdinTestResult(null)
    try {
      const r = await fetch('/api/admin/crowdin-integration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: crowdinIntegration.projectId,
          apiToken: crowdinIntegration.apiToken,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Connection test failed')
      setCrowdinTestResult({ success: true, message: 'Connection successful!' })
      toast.success('Crowdin connection test passed')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Connection test failed'
      setCrowdinTestResult({ success: false, message })
      toast.error(message)
    } finally {
      setCrowdinTestLoading(false)
    }
  }

  async function createLanguage() {
    setSaving(true)
    setError(null)
    try {
      const body = { ...newLang, code: newLang.code.toLowerCase() }
      const r = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to create language')
      setNewLang({
        code: '',
        name: '',
        nativeName: '',
        direction: 'ltr',
        flag: '🌐',
        bcp47Locale: '',
        enabled: true,
        featured: false,
      })
      setShowAddLanguageForm(false)
      await loadLanguages()
      toast.success('Language added successfully')
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e)
      setError(error || 'Failed to create language')
      toast.error(error || 'Failed to create language')
    } finally {
      setSaving(false)
    }
  }

  async function saveEdit(code: string) {
    const changes = editing[code]
    if (!changes) return
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to update language')
      setEditing(prev => {
        const next = { ...prev }
        delete next[code]
        return next
      })
      await loadLanguages()
      toast.success('Language updated')
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e)
      setError(error || 'Failed to update language')
      toast.error(error || 'Failed to update language')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(code: string) {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}/toggle`, {
        method: 'PATCH',
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Failed to toggle language')
      await loadLanguages()
      toast.success('Language status updated')
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e)
      setError(error)
      toast.error(error)
    } finally {
      setSaving(false)
    }
  }

  async function remove(code: string) {
    if (!confirm(`Delete language ${code}? This cannot be undone.`)) return
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/languages/${encodeURIComponent(code)}`, {
        method: 'DELETE',
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error((d as any)?.error || 'Failed to delete language')
      }
      await loadLanguages()
      toast.success('Language deleted')
    } catch (e: unknown) {
      setError(e?.message)
      toast.error(e?.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRegionalFormatChange = useCallback((code: string, format: RegionalFormat) => {
    setRegionalFormats(p => ({
      ...p,
      [code]: format,
    }))
    setRegionalFormatsEdited(true)
  }, [])

  const body = useMemo(() => {
    if (loading) return <div className="text-gray-600 py-8 text-center">Loading...</div>

    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ============ LANGUAGES & AVAILABILITY TAB ============ */}
        {activeTab === 'languages' && (
          <>
            <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
              {!showAddLanguageForm ? (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddLanguageForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Language
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border bg-white p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Language</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <TextField
                        label="Language Code"
                        value={newLang.code}
                        onChange={v => setNewLang(s => ({ ...s, code: v }))}
                        placeholder="e.g. fr"
                      />
                      <p className="text-xs text-gray-600 mt-1">2-3 letter language code (lowercase)</p>
                    </div>
                    <div>
                      <TextField
                        label="English Name"
                        value={newLang.name}
                        onChange={v => setNewLang(s => ({ ...s, name: v }))}
                        placeholder="e.g. French"
                      />
                      <p className="text-xs text-gray-600 mt-1">How this language appears in English</p>
                    </div>
                    <div>
                      <TextField
                        label="Native Name"
                        value={newLang.nativeName}
                        onChange={v => setNewLang(s => ({ ...s, nativeName: v }))}
                        placeholder="e.g. Fran��ais"
                      />
                      <p className="text-xs text-gray-600 mt-1">Language name in its native script</p>
                    </div>
                    <div>
                      <TextField
                        label="BCP47 Locale"
                        value={newLang.bcp47Locale}
                        onChange={v => setNewLang(s => ({ ...s, bcp47Locale: v }))}
                        placeholder="e.g. fr-FR"
                      />
                      <p className="text-xs text-gray-600 mt-1">For date/number formatting</p>
                    </div>
                    <div>
                      <SelectField
                        label="Text Direction"
                        value={newLang.direction}
                        onChange={v => setNewLang(s => ({ ...s, direction: v as 'ltr' | 'rtl' }))}
                        options={[
                          { value: 'ltr', label: 'Left-to-Right' },
                          { value: 'rtl', label: 'Right-to-Left' },
                        ]}
                      />
                    </div>
                    <div>
                      <TextField
                        label="Flag Emoji"
                        value={newLang.flag || ''}
                        onChange={v => setNewLang(s => ({ ...s, flag: v }))}
                        placeholder="e.g. 🇫🇷"
                      />
                      <p className="text-xs text-gray-600 mt-1">Max 10 characters</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setShowAddLanguageForm(false)
                        setNewLang({
                          code: '',
                          name: '',
                          nativeName: '',
                          direction: 'ltr',
                          flag: '🌐',
                          bcp47Locale: '',
                          enabled: true,
                          featured: false,
                        })
                      }}
                      className="px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createLanguage}
                      disabled={
                        saving ||
                        !newLang.code ||
                        !newLang.name ||
                        !newLang.nativeName ||
                        !newLang.bcp47Locale
                      }
                      className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {saving ? 'Adding...' : 'Add Language'}
                    </button>
                  </div>
                </div>
              )}
            </PermissionGate>

            <div className="rounded-lg border bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Language</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Direction</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Enabled</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Featured</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languages.map(lang => {
                      const edit = editing[lang.code] || {}
                      const isEditing = !!editing[lang.code]
                      return (
                        <tr key={lang.code} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{lang.flag || '🌐'}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{lang.name}</div>
                                <div className="text-xs text-gray-600">{lang.nativeName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-sm font-mono text-gray-600">{lang.code}</code>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {lang.direction.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                              <Toggle
                                label=""
                                value={lang.enabled}
                                onChange={() => toggle(lang.code)}
                              />
                            </PermissionGate>
                            <PermissionGate
                              permission={PERMISSIONS.LANGUAGES_MANAGE}
                              fallback={
                                <span className={`text-xs ${lang.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                                  {lang.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              }
                            >
                              <span />
                            </PermissionGate>
                          </td>
                          <td className="px-4 py-3">
                            {lang.featured ? (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            ) : (
                              <Star className="h-4 w-4 text-gray-300" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                              <button
                                onClick={() => remove(lang.code)}
                                disabled={saving || lang.code === 'en'}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </PermissionGate>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <SettingsCard className="bg-blue-50 border-blue-200">
              <div className="flex gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-900">Language Management Tips</p>
                  <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                    <li>English (en) cannot be deleted as it&apos;s the fallback language</li>
                    <li>Use 2-letter ISO 639-1 codes (en, fr, ar) or 3-letter codes (zho, jpn)</li>
                    <li>BCP47 locale is used for date/number formatting - include region code (e.g., en-US, en-GB)</li>
                    <li>Mark languages as &quot;Featured&quot; to highlight them in the language switcher</li>
                    <li>Enable/disable languages to control availability without deletion</li>
                  </ul>
                </div>
              </div>
            </SettingsCard>
          </>
        )}

        {/* ============ ORGANIZATION SETTINGS TAB ============ */}
        {activeTab === 'organization' && (
          <>
            <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
              <SettingsSection title="Default Language Settings" description="Configure organization-wide language defaults">
                <div className="space-y-4">
                  <div>
                    <SelectField
                      label="Default Language"
                      value={orgSettings.defaultLanguage}
                      onChange={v => setOrgSettings(s => ({ ...s, defaultLanguage: v }))}
                      options={languages.filter(l => l.enabled).map(l => ({
                        value: l.code,
                        label: `${l.name} (${l.nativeName})`,
                      }))}
                    />
                    <p className="text-xs text-gray-600 mt-1">Language shown to new users and guests</p>
                  </div>
                  <div>
                    <SelectField
                      label="Fallback Language"
                      value={orgSettings.fallbackLanguage}
                      onChange={v => setOrgSettings(s => ({ ...s, fallbackLanguage: v }))}
                      options={languages.filter(l => l.enabled).map(l => ({
                        value: l.code,
                        label: `${l.name} (${l.nativeName})`,
                      }))}
                    />
                    <p className="text-xs text-gray-600 mt-1">Language used when translation is missing</p>
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection title="User Language Control" description="Control how users interact with language settings">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-white p-4">
                    <label className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">Show Language Switcher</p>
                        <p className="text-sm text-gray-600">Display language selector in UI</p>
                      </div>
                      <Toggle
                        label=""
                        value={orgSettings.showLanguageSwitcher}
                        onChange={v => setOrgSettings(s => ({ ...s, showLanguageSwitcher: v }))}
                      />
                    </label>
                  </div>

                  <div className="rounded-lg border bg-white p-4">
                    <label className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">Persist Language Preference</p>
                        <p className="text-sm text-gray-600">Save user&apos;s language choice to database</p>
                      </div>
                      <Toggle
                        label=""
                        value={orgSettings.persistLanguagePreference}
                        onChange={v => setOrgSettings(s => ({ ...s, persistLanguagePreference: v }))}
                      />
                    </label>
                  </div>

                  <div className="rounded-lg border bg-white p-4">
                    <label className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">Auto-Detect Browser Language</p>
                        <p className="text-sm text-gray-600">Use browser language on first visit</p>
                      </div>
                      <Toggle
                        label=""
                        value={orgSettings.autoDetectBrowserLanguage}
                        onChange={v => setOrgSettings(s => ({ ...s, autoDetectBrowserLanguage: v }))}
                      />
                    </label>
                  </div>

                  <div className="rounded-lg border bg-white p-4">
                    <label className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">Allow Users to Override</p>
                        <p className="text-sm text-gray-600">Let users change their language preference</p>
                      </div>
                      <Toggle
                        label=""
                        value={orgSettings.allowUserLanguageOverride}
                        onChange={v => setOrgSettings(s => ({ ...s, allowUserLanguageOverride: v }))}
                      />
                    </label>
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection title="Internationalization" description="Advanced i18n settings">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-white p-4">
                    <label className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">Enable RTL Support</p>
                        <p className="text-sm text-gray-600">Automatically apply RTL styles for Arabic and Hebrew</p>
                      </div>
                      <Toggle
                        label=""
                        value={orgSettings.enableRtlSupport}
                        onChange={v => setOrgSettings(s => ({ ...s, enableRtlSupport: v }))}
                      />
                    </label>
                  </div>

                  <div>
                    <SelectField
                      label="Missing Translation Behavior"
                      value={orgSettings.missingTranslationBehavior}
                      onChange={v => setOrgSettings(s => ({ ...s, missingTranslationBehavior: v as any }))}
                      options={[
                        { value: 'show-key', label: 'Show translation key (e.g., hero.headline)' },
                        { value: 'show-fallback', label: 'Show fallback language translation' },
                        { value: 'show-empty', label: 'Show empty string' },
                      ]}
                    />
                    <p className="text-xs text-gray-600 mt-1">What to display when a translation is missing</p>
                  </div>
                </div>
              </SettingsSection>

              <div className="flex justify-end">
                <button
                  onClick={saveOrgSettings}
                  disabled={saving}
                  className="px-6 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </PermissionGate>
          </>
        )}

        {/* ============ USER PREFERENCES TAB ============ */}
        {activeTab === 'user-preferences' && (
          <>
            <SettingsSection title="User Language Preferences" description="Manage and monitor user language selections">
              <div className="rounded-lg border bg-white p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">–</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Languages in Use</p>
                    <p className="text-3xl font-bold text-gray-900">{languages.filter(l => l.enabled).length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-white overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-600">
                  <div className="col-span-5">Language</div>
                  <div className="col-span-4">Users</div>
                  <div className="col-span-3 text-right">Percentage</div>
                </div>
                <div>
                  {languages.map(lang => (
                    <div key={lang.code} className="grid grid-cols-12 gap-2 px-4 py-3 border-b last:border-b-0 items-center hover:bg-gray-50">
                      <div className="col-span-5">
                        <div className="flex items-center gap-2">
                          <span>{lang.flag || '🌐'}</span>
                          <span className="text-sm font-medium">{lang.name}</span>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <span className="text-sm text-gray-600">–</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-sm text-gray-600">–</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SettingsSection>
          </>
        )}

        {/* ============ REGIONAL FORMATS TAB ============ */}
        {activeTab === 'regional' && (
          <>
            <SettingsSection title="Regional Format Settings" description="Configure date, time, and number formats per language">
              <div className="space-y-4">
                {languages.filter(l => l.enabled).map(lang => (
                  <div key={lang.code} className="rounded-lg border bg-white p-4">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>{lang.flag || '🌐'}</span>
                      {lang.name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <TextField
                          label="Date Format"
                          value={regionalFormats[lang.code]?.dateFormat || 'MM/DD/YYYY'}
                          onChange={v => {
                            setRegionalFormats(p => ({
                              ...p,
                              [lang.code]: {
                                language: lang.code,
                                dateFormat: v,
                                timeFormat: p[lang.code]?.timeFormat || 'HH:MM AM',
                                currencyCode: p[lang.code]?.currencyCode || 'USD',
                                currencySymbol: p[lang.code]?.currencySymbol || '$',
                                numberFormat: p[lang.code]?.numberFormat || '#,##0.00',
                                decimalSeparator: p[lang.code]?.decimalSeparator || '.',
                                thousandsSeparator: p[lang.code]?.thousandsSeparator || ',',
                              },
                            }))
                            setRegionalFormatsEdited(true)
                          }}
                          placeholder="MM/DD/YYYY"
                        />
                        <p className="text-xs text-gray-600 mt-1">e.g., DD/MM/YYYY, YYYY-MM-DD</p>
                      </div>
                      <div>
                        <TextField
                          label="Time Format"
                          value={regionalFormats[lang.code]?.timeFormat || 'HH:MM AM'}
                          onChange={v => {
                            setRegionalFormats(p => ({
                              ...p,
                              [lang.code]: {
                                language: lang.code,
                                dateFormat: p[lang.code]?.dateFormat || 'MM/DD/YYYY',
                                timeFormat: v,
                                currencyCode: p[lang.code]?.currencyCode || 'USD',
                                currencySymbol: p[lang.code]?.currencySymbol || '$',
                                numberFormat: p[lang.code]?.numberFormat || '#,##0.00',
                                decimalSeparator: p[lang.code]?.decimalSeparator || '.',
                                thousandsSeparator: p[lang.code]?.thousandsSeparator || ',',
                              },
                            }))
                            setRegionalFormatsEdited(true)
                          }}
                          placeholder="HH:MM AM"
                        />
                        <p className="text-xs text-gray-600 mt-1">e.g., HH:MM, HH:MM AM</p>
                      </div>
                      <div>
                        <TextField
                          label="Currency Code"
                          value={regionalFormats[lang.code]?.currencyCode || 'USD'}
                          onChange={v => {
                            setRegionalFormats(p => ({
                              ...p,
                              [lang.code]: {
                                language: lang.code,
                                dateFormat: p[lang.code]?.dateFormat || 'MM/DD/YYYY',
                                timeFormat: p[lang.code]?.timeFormat || 'HH:MM AM',
                                currencyCode: v,
                                currencySymbol: p[lang.code]?.currencySymbol || '$',
                                numberFormat: p[lang.code]?.numberFormat || '#,##0.00',
                                decimalSeparator: p[lang.code]?.decimalSeparator || '.',
                                thousandsSeparator: p[lang.code]?.thousandsSeparator || ',',
                              },
                            }))
                            setRegionalFormatsEdited(true)
                          }}
                          placeholder="USD"
                        />
                        <p className="text-xs text-gray-600 mt-1">ISO 4217 code (max 3 chars)</p>
                      </div>
                      <div>
                        <TextField
                          label="Currency Symbol"
                          value={regionalFormats[lang.code]?.currencySymbol || '$'}
                          onChange={v => {
                            setRegionalFormats(p => ({
                              ...p,
                              [lang.code]: {
                                language: lang.code,
                                dateFormat: p[lang.code]?.dateFormat || 'MM/DD/YYYY',
                                timeFormat: p[lang.code]?.timeFormat || 'HH:MM AM',
                                currencyCode: p[lang.code]?.currencyCode || 'USD',
                                currencySymbol: v,
                                numberFormat: p[lang.code]?.numberFormat || '#,##0.00',
                                decimalSeparator: p[lang.code]?.decimalSeparator || '.',
                                thousandsSeparator: p[lang.code]?.thousandsSeparator || ',',
                              },
                            }))
                            setRegionalFormatsEdited(true)
                          }}
                          placeholder="$"
                        />
                        <p className="text-xs text-gray-600 mt-1">e.g., $, €, ₹, ﷼</p>
                      </div>
                      <div>
                        <TextField
                          label="Decimal Separator"
                          value={regionalFormats[lang.code]?.decimalSeparator || '.'}
                          onChange={v => {
                            setRegionalFormats(p => ({
                              ...p,
                              [lang.code]: {
                                language: lang.code,
                                dateFormat: p[lang.code]?.dateFormat || 'MM/DD/YYYY',
                                timeFormat: p[lang.code]?.timeFormat || 'HH:MM AM',
                                currencyCode: p[lang.code]?.currencyCode || 'USD',
                                currencySymbol: p[lang.code]?.currencySymbol || '$',
                                numberFormat: p[lang.code]?.numberFormat || '#,##0.00',
                                decimalSeparator: v,
                                thousandsSeparator: p[lang.code]?.thousandsSeparator || ',',
                              },
                            }))
                            setRegionalFormatsEdited(true)
                          }}
                          placeholder="."
                        />
                        <p className="text-xs text-gray-600 mt-1">Usually . or ,</p>
                      </div>
                      <div>
                        <TextField
                          label="Thousands Separator"
                          value={regionalFormats[lang.code]?.thousandsSeparator || ','}
                          onChange={v => {
                            setRegionalFormats(p => ({
                              ...p,
                              [lang.code]: {
                                language: lang.code,
                                dateFormat: p[lang.code]?.dateFormat || 'MM/DD/YYYY',
                                timeFormat: p[lang.code]?.timeFormat || 'HH:MM AM',
                                currencyCode: p[lang.code]?.currencyCode || 'USD',
                                currencySymbol: p[lang.code]?.currencySymbol || '$',
                                numberFormat: p[lang.code]?.numberFormat || '#,##0.00',
                                decimalSeparator: p[lang.code]?.decimalSeparator || '.',
                                thousandsSeparator: v,
                              },
                            }))
                            setRegionalFormatsEdited(true)
                          }}
                          placeholder=","
                        />
                        <p className="text-xs text-gray-600 mt-1">Usually , or .</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {regionalFormatsEdited && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={saveRegionalFormats}
                    disabled={saving}
                    className="px-6 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Save Regional Formats'}
                  </button>
                </div>
              )}
            </SettingsSection>
          </>
        )}

        {/* ============ INTEGRATION TAB ============ */}
        {activeTab === 'integration' && (
          <>
            <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
              <SettingsSection title="Translation Platform Integration" description="Connect to translation services">
                <div className="rounded-lg border bg-white p-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Crowdin Integration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <TextField
                        label="Project ID"
                        value={crowdinIntegration.projectId}
                        onChange={v => setCrowdinIntegration(s => ({ ...s, projectId: v }))}
                        placeholder="Your Crowdin project ID"
                      />
                      <p className="text-xs text-gray-600 mt-1">Found in Crowdin project settings</p>
                    </div>
                    <div>
                      <TextField
                        label="API Token"
                        value={crowdinIntegration.apiToken}
                        onChange={v => setCrowdinIntegration(s => ({ ...s, apiToken: v }))}
                        placeholder="Your Crowdin API token"
                        type="password"
                      />
                      <p className="text-xs text-gray-600 mt-1">Generate from Crowdin account settings</p>
                    </div>
                  </div>
                  {crowdinTestResult && (
                    <div className={`rounded-lg p-3 mb-4 ${crowdinTestResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                      <p className="text-sm">{crowdinTestResult.message}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={testCrowdinConnection}
                      disabled={!crowdinIntegration.projectId || !crowdinIntegration.apiToken || crowdinTestLoading || saving}
                      className="px-4 py-2 rounded-md text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {crowdinTestLoading ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={saveCrowdinIntegration}
                      disabled={!crowdinIntegration.projectId || !crowdinIntegration.apiToken || saving}
                      className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {saving ? 'Saving...' : 'Save Integration'}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border bg-blue-50 border-blue-200 p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Sync Options</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={crowdinIntegration.autoSyncDaily}
                        onChange={e => setCrowdinIntegration(s => ({ ...s, autoSyncDaily: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-blue-800">Auto-sync translations daily</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={crowdinIntegration.syncOnDeploy}
                        onChange={e => setCrowdinIntegration(s => ({ ...s, syncOnDeploy: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-blue-800">Sync on code deployment</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={crowdinIntegration.createPrs}
                        onChange={e => setCrowdinIntegration(s => ({ ...s, createPrs: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-blue-800">Create PRs for translations</span>
                    </label>
                  </div>
                </div>
              </SettingsSection>
            </PermissionGate>
          </>
        )}

        {/* ============ TRANSLATIONS TAB ============ */}
        {activeTab === 'translations' && status && (
          <>
            <SettingsSection title="Translation Coverage" description="Current translation status by language">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Total Keys</p>
                    <p className="text-3xl font-bold text-gray-900">{status.summary.totalKeys}</p>
                  </div>
                </SettingsCard>
                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">English</p>
                    <p className="text-3xl font-bold text-green-600">{status.summary.enCoveragePct}</p>
                  </div>
                </SettingsCard>
                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">العربية</p>
                    <p className="text-3xl font-bold">{status.summary.arCoveragePct}</p>
                  </div>
                </SettingsCard>
                <SettingsCard>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">हिन्दी</p>
                    <p className="text-3xl font-bold">{status.summary.hiCoveragePct}</p>
                  </div>
                </SettingsCard>
              </div>
            </SettingsSection>

            {missingKeys.length > 0 && (
              <SettingsSection title="Missing Translations" description={`${missingKeys.length} keys need attention`}>
                <div className="rounded-lg border bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Key</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">EN</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">AR</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">HI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingKeys.slice(0, 10).map((key, idx) => (
                        <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">{key.key}</td>
                          <td className="px-4 py-3 text-center">
                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {key.arTranslated ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {key.hiTranslated ? (
                              <Check className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SettingsSection>
            )}
          </>
        )}

        {/* ============ ANALYTICS TAB ============ */}
        {activeTab === 'analytics' && (
          <>
            <SettingsSection title="User Language Distribution" description="Current language preferences across your users">
              {analyticsLoading ? (
                <div className="rounded-lg border bg-white p-12 text-center">
                  <p className="text-gray-600">Loading analytics...</p>
                </div>
              ) : analyticsData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{analyticsData.totalUsers}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-sm font-medium text-gray-600">Languages in Use</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{analyticsData.languagesInUse.length}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <p className="text-sm font-medium text-gray-600">Most Used Language</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{analyticsData.mostUsedLanguage?.toUpperCase() || 'N/A'}</p>
                    </div>
                  </div>

                  {analyticsData.distribution && analyticsData.distribution.length > 0 && (
                    <div className="rounded-lg border bg-white p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Language Distribution</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="flex justify-center">
                          <div style={{ width: '300px', height: '300px' }}>
                            <Doughnut
                              data={{
                                labels: analyticsData.distribution.map((d: { language: string; count: number }) => {
                                  const lang = languages.find(l => l.code === d.language)
                                  return `${lang?.name || d.language} (${d.count})`
                                }),
                                datasets: [
                                  {
                                    data: analyticsData.distribution.map((d: { language: string; count: number }) => d.count),
                                    backgroundColor: [
                                      '#3b82f6',
                                      '#ef4444',
                                      '#10b981',
                                      '#f59e0b',
                                      '#8b5cf6',
                                      '#ec4899',
                                    ],
                                    borderColor: ['#ffffff'],
                                    borderWidth: 2,
                                  },
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: true,
                                plugins: {
                                  legend: {
                                    position: 'bottom' as const,
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          {analyticsData.distribution.map((item: { language: string; count: number }, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][idx % 6],
                                  }}
                                />
                                <span className="font-medium text-gray-900">
                                  {languages.find(l => l.code === item.language)?.name || item.language}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">{item.count} users</span>
                                <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.percentage}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border bg-white p-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No analytics data available</p>
                </div>
              )}
            </SettingsSection>
          </>
        )}

        {/* ============ DISCOVERY TAB ============ */}
        {activeTab === 'discovery' && (
          <>
            <SettingsSection title="Translation Key Discovery" description="Scan your codebase for all translation keys">
              <div className="space-y-4">
                <div className="rounded-lg border bg-blue-50 border-blue-200 p-6">
                  <div className="flex gap-4">
                    <Code2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">Automated Key Discovery</h4>
                      <p className="text-sm text-blue-800 mb-4">
                        Scan your codebase for all <code className="bg-blue-100 px-2 py-1 rounded">t(&apos;key&apos;)</code> calls to identify:
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 mb-4">
                        <li>Keys in code but missing from translation files</li>
                        <li>Orphaned keys in JSON files not used in code</li>
                        <li>Missing translations for Arabic and Hindi</li>
                        <li>Unused or deprecated translation keys</li>
                      </ul>
                      <PermissionGate permission={PERMISSIONS.LANGUAGES_MANAGE}>
                        <button className="px-6 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium">
                          Run Discovery Audit
                        </button>
                      </PermissionGate>
                    </div>
                  </div>
                </div>

                <SettingsCard className="border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Manual Audit</h4>
                  <p className="text-sm text-gray-600 mb-3">Run this command in your terminal:</p>
                  <code className="block bg-gray-900 text-gray-100 px-4 py-3 rounded font-mono text-sm overflow-x-auto">
                    npm run discover:keys
                  </code>
                  <p className="text-xs text-gray-600 mt-3">Output: <code className="text-gray-700 bg-gray-100 px-2 py-1 rounded">translation-key-audit.json</code></p>
                </SettingsCard>
              </div>
            </SettingsSection>
          </>
        )}
      </div>
    )
  }, [
    activeTab,
    loading,
    languages,
    newLang,
    editing,
    status,
    missingKeys,
    recentKeys,
    saving,
    error,
    orgSettings,
    regionalFormats,
    regionalFormatsEdited,
    crowdinIntegration,
    crowdinTestResult,
    crowdinTestLoading,
    showAddLanguageForm,
    analyticsData,
    analyticsLoading,
  ])

  return (
    <SettingsShell
      title="Localization & Language Control"
      description="Manage languages, translations, regional settings, and user language preferences"
      icon={Globe}
      showBackButton={true}
      saving={saving}
      saved={saved}
      actions={
        <FavoriteToggle
          settingKey="localization"
          route="/admin/settings/localization"
          label="Localization Settings"
        />
      }
      tabs={tabs}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      loading={loading}
    >
      {body}
    </SettingsShell>
  )
}
