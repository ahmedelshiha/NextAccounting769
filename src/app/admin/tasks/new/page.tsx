'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, Calendar, Users, AlertTriangle, FileText, Tag, Link2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { hasRole } from '@/lib/permissions'

// Types matching the provided UI
interface UserItem {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

interface ClientItem {
  id: string
  name: string
  tier: 'Enterprise' | 'SMB' | 'Individual'
}

interface BookingItem {
  id: string
  clientName: string
  service: string
  date: string
}

type TaskPriorityUi = 'Critical' | 'High' | 'Medium' | 'Low'
type TaskCategoryUi = 'Tax Preparation' | 'Audit' | 'Consultation' | 'Bookkeeping' | 'Compliance' | 'General'

interface CreateTaskData {
  title: string
  description: string
  priority: TaskPriorityUi
  category: TaskCategoryUi
  dueDate: string
  estimatedHours: number
  assigneeId?: string
  collaboratorIds: string[]
  clientId?: string
  bookingId?: string
  tags: string[]
  complianceRequired: boolean
  complianceDeadline?: string
  dependencies: string[]
}

interface TaskCreationPageProps {
  onSave?: (task: CreateTaskData) => Promise<void>
  onCancel?: () => void
  availableUsers?: UserItem[]
  clients?: ClientItem[]
  bookings?: BookingItem[]
  existingTasks?: Array<{ id: string; title: string }>
}

const priorityColors: Record<TaskPriorityUi, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-green-100 text-green-800 border-green-200',
}

function CreateTaskPage({
  onSave,
  onCancel,
  availableUsers = [],
  clients = [],
  bookings = [],
  existingTasks = [],
}: TaskCreationPageProps) {
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'General',
    dueDate: '',
    estimatedHours: 1,
    assigneeId: '',
    collaboratorIds: [],
    clientId: '',
    bookingId: '',
    tags: [],
    complianceRequired: false,
    complianceDeadline: '',
    dependencies: [],
  })

  const [currentTab, setCurrentTab] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState('')

  const tabs = [
    { id: 0, label: 'Basic Info', icon: FileText },
    { id: 1, label: 'Details', icon: AlertTriangle },
    { id: 2, label: 'Schedule', icon: Calendar },
    { id: 3, label: 'Assignment', icon: Users },
  ]

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Task title is required'
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required'
    else {
      const dueDate = new Date(formData.dueDate)
      const today = new Date(); today.setHours(0,0,0,0)
      if (dueDate < today) newErrors.dueDate = 'Due date cannot be in the past'
    }
    if (formData.estimatedHours <= 0) newErrors.estimatedHours = 'Estimated hours must be greater than 0'
    if (formData.complianceRequired && !formData.complianceDeadline) newErrors.complianceDeadline = 'Compliance deadline is required when compliance is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isSubmitDisabled = isLoading || !formData.title.trim() || !formData.dueDate || formData.estimatedHours <= 0 || (formData.complianceRequired && !formData.complianceDeadline)

  const handleSave = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    try {
      if (onSave) await onSave(formData)
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save task. Please try again.' })
    } finally { setIsLoading(false) }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !formData.tags.includes(t)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }))
      setTagInput('')
    }
  }
  const removeTag = (tag: string) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  const addCollaborator = (userId: string) => {
    if (!formData.collaboratorIds.includes(userId)) setFormData(prev => ({ ...prev, collaboratorIds: [...prev.collaboratorIds, userId] }))
  }
  const removeCollaborator = (userId: string) => setFormData(prev => ({ ...prev, collaboratorIds: prev.collaboratorIds.filter(id => id !== userId) }))
  const addDependency = (taskId: string) => {
    if (!formData.dependencies.includes(taskId)) setFormData(prev => ({ ...prev, dependencies: [...prev.dependencies, taskId] }))
  }
  const removeDependency = (taskId: string) => setFormData(prev => ({ ...prev, dependencies: prev.dependencies.filter(id => id !== taskId) }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={onCancel} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Create New Task</h1>
                <p className="text-sm text-gray-600">Add a new task to your workflow</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {formData.priority && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${priorityColors[formData.priority]}`}>
                  {formData.priority} Priority
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button key={tab.id} onClick={() => setCurrentTab(tab.id)} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${currentTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {currentTab === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} aria-invalid={!!errors.title} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'}`} placeholder="Enter task title..." />
                  {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe the task requirements, objectives, and any relevant details..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriorityUi }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {(['Critical','High','Medium','Low'] as TaskPriorityUi[]).map(p => (<option key={p} value={p}>{p}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TaskCategoryUi }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {(['Tax Preparation','Audit','Consultation','Bookkeeping','Compliance','General'] as TaskCategoryUi[]).map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client (Optional)</label>
                  <ClientSelect value={formData.clientId || ''} onChange={(v) => setFormData(prev => ({ ...prev, clientId: v }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Related Booking (Optional)</label>
                  <BookingSelect value={formData.bookingId || ''} onChange={(v) => setFormData(prev => ({ ...prev, bookingId: v }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                        <Tag className="w-3 h-3" />{tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-blue-600 hover:text-blue-800"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add tag..." />
                    <button type="button" onClick={addTag} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Add</button>
                  </div>
                </div>
                <div className="border-t pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <input type="checkbox" id="complianceRequired" checked={formData.complianceRequired} onChange={(e) => setFormData(prev => ({ ...prev, complianceRequired: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <label htmlFor="complianceRequired" className="text-sm font-medium text-gray-700">Compliance Required</label>
                  </div>
                  {formData.complianceRequired && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Deadline *</label>
                      <input type="date" value={formData.complianceDeadline || ''} onChange={(e) => setFormData(prev => ({ ...prev, complianceDeadline: e.target.value }))} aria-invalid={!!errors.complianceDeadline} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.complianceDeadline ? 'border-red-300' : 'border-gray-300'}`} />
                      {errors.complianceDeadline && <p className="text-red-600 text-sm mt-1">{errors.complianceDeadline}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentTab === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                    <input type="date" value={formData.dueDate} onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} aria-invalid={!!errors.dueDate} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.dueDate ? 'border-red-300' : 'border-gray-300'}`} />
                    {errors.dueDate && <p className="text-red-600 text-sm mt-1">{errors.dueDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Hours *</label>
                    <input type="number" min="0.5" step="0.5" value={formData.estimatedHours} onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 1 }))} aria-invalid={!!errors.estimatedHours} className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.estimatedHours ? 'border-red-300' : 'border-gray-300'}`} />
                    {errors.estimatedHours && <p className="text-red-600 text-sm mt-1">{errors.estimatedHours}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Dependencies</label>
                  <p className="text-sm text-gray-600 mb-3">Select tasks that must be completed before this task can start.</p>
                  <DependencyList value={formData.dependencies} onRemove={removeDependency} />
                  <DependencySelect onAdd={(id) => addDependency(id)} selected={formData.dependencies} />
                </div>
              </div>
            )}

            {currentTab === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                  <AssigneeSelect value={formData.assigneeId || ''} onChange={(v) => setFormData(prev => ({ ...prev, assigneeId: v }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Collaborators</label>
                  <p className="text-sm text-gray-600 mb-3">Add team members who will work on this task together.</p>
                  <CollaboratorList value={formData.collaboratorIds} onRemove={removeCollaborator} assigneeId={formData.assigneeId || ''} />
                  <CollaboratorSelect onAdd={(id) => addCollaborator(id)} excluded={[...formData.collaboratorIds, formData.assigneeId || '']} />
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-800 text-sm">{errors.submit}</p></div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setCurrentTab(Math.max(0, currentTab - 1))} disabled={currentTab === 0} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              {currentTab < tabs.length - 1 ? (
                <button type="button" onClick={() => setCurrentTab(Math.min(tabs.length - 1, currentTab + 1))} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600">Next</button>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={handleSave} disabled={isSubmitDisabled} className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>) : (<><Save className="w-4 h-4" />Create Task</>)}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Data hooks and small components backed by real APIs
function useAssignees() {
  const [items, setItems] = useState<UserItem[]>([])
  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await apiFetch('/api/admin/team-members', { signal: ac.signal })
        const data = await res.json().catch(() => ({}))
        const list = Array.isArray(data) ? data : (data?.teamMembers || [])
        let mapped: UserItem[] = list
          .map((m: any) => ({ id: m.userId, name: m.name || m.email || 'Unknown', email: m.email || '', role: m.role || 'STAFF' }))
          .filter((u: any) => !!u.id)

        // Client-side fallback: if no team members are linked to users, derive from users endpoint
        if (!mapped.length) {
          try {
            const resUsers = await apiFetch('/api/admin/users', { signal: ac.signal })
            const usersJson = await resUsers.json().catch(() => ({}))
            const users = Array.isArray(usersJson) ? usersJson : (usersJson?.users || [])
            mapped = users
              .filter((u: any) => hasRole(String(u.role || '').toUpperCase(), ['ADMIN', 'STAFF']))
              .map((u: any) => ({ id: u.id, name: u.name || u.email || 'User', email: u.email || '', role: u.role || 'STAFF' }))
          } catch { /* ignore */ }
        }

        setItems(mapped)
      } catch { /* ignore */ }
    })()
    return () => ac.abort()
  }, [])
  return items
}

function useClients() {
  const [items, setItems] = useState<ClientItem[]>([])
  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await apiFetch('/api/admin/users', { signal: ac.signal })
        const data = await res.json().catch(() => ({}))
        const users = Array.isArray(data) ? data : (data?.users || [])
        const clients = users.filter((u: any) => (u.role || '').toUpperCase() === 'CLIENT')
        const mapped: ClientItem[] = clients.map((c: any) => ({
          id: c.id,
          name: c.name || c.email || 'Unknown',
          tier: (() => { const n = Number(c.totalBookings || 0); if (n >= 20) return 'Enterprise'; if (n >= 1) return 'SMB'; return 'Individual' })(),
        }))
        setItems(mapped)
      } catch { /* ignore */ }
    })()
    return () => ac.abort()
  }, [])
  return items
}

function useBookings() {
  const [items, setItems] = useState<BookingItem[]>([])
  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await apiFetch('/api/admin/bookings?limit=50&offset=0&sortBy=scheduledAt&sortOrder=desc', { signal: ac.signal })
        const data = await res.json().catch(() => ({}))
        const bookings = Array.isArray(data) ? data : (data?.bookings || [])
        const mapped: BookingItem[] = bookings.map((b: any) => ({
          id: b.id,
          clientName: b.client?.name || b.clientName || 'Unknown',
          service: b.service?.name || b.serviceName || 'Service',
          date: (b.scheduledAt ? String(b.scheduledAt) : new Date().toISOString()).slice(0,10),
        }))
        setItems(mapped)
      } catch { /* ignore */ }
    })()
    return () => ac.abort()
  }, [])
  return items
}

function useTasksForDeps() {
  const [items, setItems] = useState<Array<{ id: string; title: string }>>([])
  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await apiFetch('/api/admin/tasks?limit=200', { signal: ac.signal })
        const data = await res.json().catch(() => [])
        const mapped = (Array.isArray(data) ? data : []).map((t: any) => ({ id: t.id, title: t.title || 'Untitled' }))
        setItems(mapped)
      } catch { /* ignore */ }
    })()
    return () => ac.abort()
  }, [])
  return items
}

function AssigneeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const assignees = useAssignees()
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">Assign to...</option>
      {assignees.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
    </select>
  )
}

function CollaboratorList({ value, onRemove, assigneeId }: { value: string[]; onRemove: (id: string) => void; assigneeId: string }) {
  const users = useAssignees()
  return (
    <div className="space-y-2 mb-3">
      {value.map(userId => {
        const user = users.find(u => u.id === userId)
        return user ? (
          <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <img src={user.avatar || '/api/placeholder/32/32'} alt={user.name} className="w-8 h-8 rounded-full" />
              <div>
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
            </div>
            <button type="button" onClick={() => onRemove(userId)} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
          </div>
        ) : null
      })}
    </div>
  )
}

function CollaboratorSelect({ onAdd, excluded }: { onAdd: (id: string) => void; excluded: string[] }) {
  const users = useAssignees()
  return (
    <select onChange={(e) => { if (e.target.value) { onAdd(e.target.value); e.target.value = '' } }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">Add collaborator...</option>
      {users.filter(u => !excluded.includes(u.id)).map(u => (<option key={u.id} value={u.id}>{u.name} ({u.role})</option>))}
    </select>
  )
}

function ClientSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const clients = useClients()
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">Select client...</option>
      {clients.map(c => (<option key={c.id} value={c.id}>{c.name} ({c.tier})</option>))}
    </select>
  )
}

function BookingSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const bookings = useBookings()
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">Select booking...</option>
      {bookings.map(b => (<option key={b.id} value={b.id}>{b.clientName} - {b.service} ({b.date})</option>))}
    </select>
  )
}

function DependencyList({ value, onRemove }: { value: string[]; onRemove: (id: string) => void }) {
  const taskList = useTasksForDeps()
  return (
    <div className="space-y-2">
      {value.map(depId => {
        const task = taskList.find(t => t.id === depId)
        return task ? (
          <div key={depId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-gray-500" /><span className="text-sm">{task.title}</span></div>
            <button type="button" onClick={() => onRemove(depId)} className="text-red-600 hover:text-red-800"><X className="w-4 h-4" /></button>
          </div>
        ) : null
      })}
    </div>
  )
}

function DependencySelect({ onAdd, selected }: { onAdd: (id: string) => void; selected: string[] }) {
  const taskList = useTasksForDeps()
  const options = useMemo(() => taskList.filter(t => !selected.includes(t.id)), [taskList, selected])
  return (
    <select onChange={(e) => { if (e.target.value) { onAdd(e.target.value); e.target.value = '' } }} className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">Add dependency...</option>
      {options.map(task => (<option key={task.id} value={task.id}>{task.title}</option>))}
    </select>
  )
}

function mapUiPriorityToDb(p: TaskPriorityUi): 'LOW' | 'MEDIUM' | 'HIGH' {
  const v = String(p).toLowerCase()
  if (v === 'low') return 'LOW'
  if (v === 'medium') return 'MEDIUM'
  return 'HIGH' // treat High/Critical as HIGH
}

import { TaskProvider, useTasks } from '../providers/TaskProvider'

function NewTaskInner() {
  const router = useRouter()
  const { createTask, error: providerError } = useTasks()

  const onCancel = () => { try { router.push('/admin/tasks') } catch {} }

  const onSave = async (task: CreateTaskData) => {
    const result = await createTask({
      title: task.title,
      priority: (() => { const p = String(task.priority).toLowerCase(); if (p === 'low') return 'low'; if (p === 'high' || p === 'critical') return 'high'; return 'medium' })(),
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
      assigneeId: task.assigneeId || undefined,
    })
    if (!result) throw new Error(providerError || 'Failed to create')
    try { router.push('/admin/tasks') } catch {}
  }

  return <CreateTaskPage onSave={onSave} onCancel={onCancel} />
}

export default function AdminNewTaskPage() {
  return (
    <TaskProvider>
      <NewTaskInner />
    </TaskProvider>
  )
}
