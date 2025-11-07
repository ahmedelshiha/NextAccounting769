'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Save,
  Calendar,
  Users,
  AlertTriangle,
  FileText,
  Tag as TagIcon,
  Link2,
  Clock,
  User,
  Building
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { hasRole } from '@/lib/permissions'
import type { TaskPriority, TaskStatus, TaskCategory } from '@/lib/tasks/types'

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

interface TaskFormData {
  title: string
  description?: string
  priority: TaskPriority
  category: TaskCategory
  status: TaskStatus
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

interface TaskEditModalProps {
  open: boolean
  onClose: () => void
  task?: any
  onSave: (data: any) => Promise<void>
  availableUsers?: { id: string; name: string }[]
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300, duration: 0.3 }
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
}

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }

export default function TaskEditModal({ open, onClose, task, onSave, availableUsers = [] }: TaskEditModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'system',
    status: 'pending',
    dueDate: '',
    estimatedHours: 1,
    assigneeId: undefined,
    collaboratorIds: [],
    clientId: undefined,
    bookingId: undefined,
    tags: [],
    complianceRequired: false,
    complianceDeadline: undefined,
    dependencies: [],
  })

  const [currentTab, setCurrentTab] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: (task.priority || 'medium') as TaskPriority,
        category: (task.category || 'system') as TaskCategory,
        status: (task.status || 'pending') as TaskStatus,
        dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : '',
        estimatedHours: Number(task.estimatedHours || 1),
        assigneeId: task.assigneeId || task.assignee?.id || undefined,
        collaboratorIds: Array.isArray(task.collaborators) ? task.collaborators.map((u: any) => u.id).filter(Boolean) : [],
        clientId: task.clientId || task.client?.id || undefined,
        bookingId: task.bookingId || task.booking?.id || undefined,
        tags: Array.isArray(task.tags) ? task.tags : [],
        complianceRequired: Boolean(task.complianceRequired),
        complianceDeadline: task.complianceDeadline ? String(task.complianceDeadline).slice(0, 10) : undefined,
        dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      })
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'system',
        status: 'pending',
        dueDate: '',
        estimatedHours: 1,
        assigneeId: undefined,
        collaboratorIds: [],
        clientId: undefined,
        bookingId: undefined,
        tags: [],
        complianceRequired: false,
        complianceDeadline: undefined,
        dependencies: [],
      })
    }
    setCurrentTab(0)
    setErrors({})
    setTagInput('')
  }, [open, task])

  const tabs = [
    { id: 0, label: 'Basic', icon: FileText },
    { id: 1, label: 'Details', icon: AlertTriangle },
    { id: 2, label: 'Schedule', icon: Calendar },
    { id: 3, label: 'Assignment', icon: Users },
  ]

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required'
    else {
      const due = new Date(formData.dueDate)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      if (due < today) newErrors.dueDate = 'Due date cannot be in the past'
    }
    if (Number(formData.estimatedHours) <= 0) newErrors.estimatedHours = 'Estimated hours must be greater than 0'
    if (formData.complianceRequired && !formData.complianceDeadline) newErrors.complianceDeadline = 'Compliance deadline is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSave = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const payload: any = {
        title: formData.title.trim(),
        priority: formData.priority,
        status: formData.status,
        dueDate: new Date(formData.dueDate).toISOString(),
        assigneeId: formData.assigneeId || undefined,
      }
      await onSave(payload)
      onClose()
    } catch (error: any) {
      setErrors({ submit: error?.message || 'Failed to save task' })
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !formData.tags.includes(t)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }))
      setTagInput('')
    }
  }
  const removeTag = (tag: string) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(x => x !== tag) }))

  const addCollaborator = (userId: string) => {
    if (!userId) return
    if (!formData.collaboratorIds.includes(userId)) {
      setFormData(prev => ({ ...prev, collaboratorIds: [...prev.collaboratorIds, userId] }))
    }
  }
  const removeCollaborator = (userId: string) => setFormData(prev => ({ ...prev, collaboratorIds: prev.collaboratorIds.filter(id => id !== userId) }))

  if (!mounted) return null
  if (!open) return null

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        />

        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/10 rounded-lg"><FileText className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{task ? 'Edit Task' : 'Create New Task'}</h2>
                  <p className="text-blue-100 text-sm">{task ? 'Update task details and settings' : 'Add a new task to your workflow'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {formData.priority && (
                  <motion.span className="px-3 py-1 text-xs font-medium rounded-full border bg-white/20 text-white border-white/30" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} Priority</motion.span>
                )}
                {task && formData.status && (
                  <motion.span className="px-3 py-1 text-xs font-medium rounded-full border bg-white/20 text-white border-white/30" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{formData.status.replace('_', ' ')}</motion.span>
                )}
                <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = currentTab === tab.id
                return (
                  <motion.button key={tab.id} onClick={() => setCurrentTab(tab.id)} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm relative ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Icon className="w-4 h-4" />{tab.label}
                    {isActive && (<motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" layoutId="activeTab" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />)}
                  </motion.button>
                )
              })}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div key={currentTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="p-6">
                {currentTab === 0 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                      <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`} placeholder="Enter a clear, descriptive task title..." />
                      {errors.title && (<motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 text-sm mt-2">{errors.title}</motion.p>)}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-all resize-none" placeholder="Describe the task requirements, objectives, and any relevant details..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select value={formData.priority} onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-all">
                          {(['critical','high','medium','low'] as TaskPriority[]).map(p => (<option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TaskCategory }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-all">
                          {(['booking','client','system','finance','compliance','marketing'] as TaskCategory[]).map(c => (<option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>))}
                        </select>
                      </div>
                    </div>

                    {task && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as TaskStatus }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-all">
                          {(['pending','in_progress','review','completed','blocked'] as TaskStatus[]).map(s => (<option key={s} value={s}>{s.replace('_',' ')}</option>))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {currentTab === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><Building className="w-4 h-4 inline mr-2" />Client (Optional)</label>
                      <ClientSelect value={formData.clientId || ''} onChange={(v) => setFormData(prev => ({ ...prev, clientId: v || undefined }))} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar className="w-4 h-4 inline mr-2" />Related Booking (Optional)</label>
                      <BookingSelect value={formData.bookingId || ''} onChange={(v) => setFormData(prev => ({ ...prev, bookingId: v || undefined }))} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><TagIcon className="w-4 h-4 inline mr-2" />Tags</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.tags.map(tag => (
                          <motion.span key={tag} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                            <TagIcon className="w-3 h-3" />{tag}
                            <button type="button" onClick={() => removeTag(tag)} className="text-blue-600 hover:text-blue-800 transition-colors"><X className="w-3 h-3" /></button>
                          </motion.span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add tag..." />
                        <motion.button type="button" onClick={addTag} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Add</motion.button>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <input type="checkbox" id="complianceRequired" checked={formData.complianceRequired} onChange={(e) => setFormData(prev => ({ ...prev, complianceRequired: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label htmlFor="complianceRequired" className="text-sm font-medium text-gray-700"><AlertTriangle className="w-4 h-4 inline mr-2 text-orange-500" />Compliance Required</label>
                      </div>
                      {formData.complianceRequired && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Deadline *</label>
                          <input type="date" value={formData.complianceDeadline || ''} onChange={(e) => setFormData(prev => ({ ...prev, complianceDeadline: e.target.value }))} className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.complianceDeadline ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`} />
                          {errors.complianceDeadline && (<motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 text-sm mt-2">{errors.complianceDeadline}</motion.p>)}
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {currentTab === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar className="w-4 h-4 inline mr-2" />Due Date *</label>
                        <input type="date" value={formData.dueDate} onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`} />
                        {errors.dueDate && (<motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 text-sm mt-2">{errors.dueDate}</motion.p>)}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><Clock className="w-4 h-4 inline mr-2" />Estimated Hours *</label>
                        <input type="number" min="0.5" step="0.5" value={formData.estimatedHours} onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 1 }))} className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.estimatedHours ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`} />
                        {errors.estimatedHours && (<motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 text-sm mt-2">{errors.estimatedHours}</motion.p>)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><Link2 className="w-4 h-4 inline mr-2" />Task Dependencies</label>
                      <p className="text-sm text-gray-600 mb-3">Select tasks that must be completed before this task can start.</p>
                      <DependencyList value={formData.dependencies} onRemove={(id) => setFormData(prev => ({ ...prev, dependencies: prev.dependencies.filter(d => d !== id) }))} />
                      <DependencySelect onAdd={(id) => setFormData(prev => ({ ...prev, dependencies: [...prev.dependencies, id] }))} selected={formData.dependencies} />
                    </div>
                  </div>
                )}

                {currentTab === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><User className="w-4 h-4 inline mr-2" />Assignee</label>
                      <AssigneeSelect value={formData.assigneeId || ''} onChange={(v) => setFormData(prev => ({ ...prev, assigneeId: v || undefined }))} availableUsers={availableUsers} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><Users className="w-4 h-4 inline mr-2" />Collaborators</label>
                      <p className="text-sm text-gray-600 mb-3">Add team members who will work on this task together.</p>
                      <CollaboratorList value={formData.collaboratorIds} onRemove={removeCollaborator} assigneeId={formData.assigneeId || ''} availableUsers={availableUsers} />
                      <CollaboratorSelect onAdd={addCollaborator} excluded={[...formData.collaboratorIds, formData.assigneeId || '']} availableUsers={availableUsers} />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {errors.submit && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{errors.submit}</p>
              </motion.div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center gap-3">
              <motion.button type="button" onClick={() => setCurrentTab(Math.max(0, currentTab - 1))} disabled={currentTab === 0} whileTap={{ scale: 0.95 }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Previous</motion.button>
              {currentTab < tabs.length - 1 && (
                <motion.button type="button" onClick={() => setCurrentTab(Math.min(tabs.length - 1, currentTab + 1))} whileTap={{ scale: 0.95 }} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors">Next</motion.button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <motion.button type="button" onClick={onClose} whileTap={{ scale: 0.95 }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">Cancel</motion.button>
              <motion.button type="button" onClick={handleSave} disabled={isLoading || !formData.title.trim() || !formData.dueDate} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {isLoading ? (<><motion.div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />{task ? 'Updating...' : 'Creating...'}</>) : (<><Save className="w-4 h-4" />{task ? 'Update Task' : 'Create Task'}</>)}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function useAssignees() {
  const [items, setItems] = useState<UserItem[]>([])
  useEffect(() => {
    const abortController = new AbortController()
    ;(async () => {
      try {
        const response = await apiFetch('/api/admin/team-members', { signal: abortController.signal })
        const data = await response.json().catch(() => ({}))
        const list = Array.isArray(data) ? data : (data?.teamMembers || [])
        let mapped: UserItem[] = list
          .map((member: any) => ({ id: member.userId, name: member.name || member.email || 'Unknown', email: member.email || '', avatar: member.avatar, role: member.role || 'STAFF' }))
          .filter((u: any) => !!u.id)

        if (!mapped.length) {
          try {
            const resUsers = await apiFetch('/api/admin/users', { signal: abortController.signal })
            const usersJson = await resUsers.json().catch(() => ({}))
            const users = Array.isArray(usersJson) ? usersJson : (usersJson?.users || [])
            mapped = users
              .filter((u: any) => hasRole(String(u.role || '').toUpperCase(), ['ADMIN', 'STAFF']))
              .map((u: any) => ({ id: u.id, name: u.name || u.email || 'User', email: u.email || '', role: u.role || 'STAFF' }))
          } catch {}
        }

        setItems(mapped)
      } catch {}
    })()
    return () => abortController.abort()
  }, [])
  return items
}

function useClients() {
  const [items, setItems] = useState<ClientItem[]>([])
  useEffect(() => {
    const abortController = new AbortController()
    ;(async () => {
      try {
        const response = await apiFetch('/api/admin/users', { signal: abortController.signal })
        const data = await response.json().catch(() => ({}))
        const users = Array.isArray(data) ? data : (data?.users || [])
        const clients = users.filter((user: any) => String(user.role || '').toUpperCase() === 'CLIENT')
        const mapped: ClientItem[] = clients.map((client: any) => ({ id: client.id, name: client.name || client.email || 'Unknown', tier: (() => { const cnt = Number(client.totalBookings || 0); if (cnt >= 20) return 'Enterprise'; if (cnt >= 1) return 'SMB'; return 'Individual' })() }))
        setItems(mapped)
      } catch {}
    })()
    return () => abortController.abort()
  }, [])
  return items
}

function useBookings() {
  const [items, setItems] = useState<BookingItem[]>([])
  useEffect(() => {
    const abortController = new AbortController()
    ;(async () => {
      try {
        const response = await apiFetch('/api/admin/bookings?limit=50&offset=0&sortBy=scheduledAt&sortOrder=desc', { signal: abortController.signal })
        const data = await response.json().catch(() => ({}))
        const bookings = Array.isArray(data) ? data : (data?.bookings || [])
        const mapped: BookingItem[] = bookings.map((booking: any) => ({ id: booking.id, clientName: booking.client?.name || booking.clientName || 'Unknown', service: booking.service?.name || booking.serviceName || 'Service', date: (booking.scheduledAt ? String(booking.scheduledAt) : new Date().toISOString()).slice(0, 10) }))
        setItems(mapped)
      } catch {}
    })()
    return () => abortController.abort()
  }, [])
  return items
}

function useTasksForDeps() {
  const [items, setItems] = useState<Array<{ id: string; title: string }>>([])
  useEffect(() => {
    const abortController = new AbortController()
    ;(async () => {
      try {
        const response = await apiFetch('/api/admin/tasks?limit=200', { signal: abortController.signal })
        const data = await response.json().catch(() => [])
        const mapped = (Array.isArray(data) ? data : []).map((t: any) => ({ id: t.id, title: t.title || 'Untitled' }))
        setItems(mapped)
      } catch {}
    })()
    return () => abortController.abort()
  }, [])
  return items
}

function AssigneeSelect({ value, onChange, availableUsers = [] }: { value: string; onChange: (value: string) => void; availableUsers?: { id: string; name: string }[] }) {
  const assignees = useAssignees()
  const users = assignees.length > 0 ? assignees : availableUsers.map(u => ({ ...u, email: '', role: 'STAFF' }))
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-all">
      <option value="">Assign to...</option>
      {users.map((user: any) => (<option key={user.id} value={user.id}>{user.name} {user.role && `(${user.role})`}</option>))}
    </select>
  )
}

function CollaboratorList({ value, onRemove, assigneeId, availableUsers = [] }: { value: string[]; onRemove: (id: string) => void; assigneeId: string; availableUsers?: { id: string; name: string }[] }) {
  const assignees = useAssignees()
  const users: UserItem[] = assignees.length > 0 ? assignees : availableUsers.map(u => ({ id: u.id, name: u.name, email: '', role: 'STAFF' }))
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="space-y-2 mb-4">
      {value.map(userId => {
        const user = users.find(u => u.id === userId)
        if (!user) return null
        return (
          <motion.div key={userId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full ring-2 ring-blue-200" />
              ) : (
                <div className="w-8 h-8 rounded-full ring-2 ring-blue-200 bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">{getInitials(user.name)}</div>
              )}
              <div>
                <div className="font-medium text-sm text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
            </div>
            <motion.button type="button" onClick={() => onRemove(userId)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-all"><X className="w-4 h-4" /></motion.button>
          </motion.div>
        )
      })}
    </div>
  )
}

function CollaboratorSelect({ onAdd, excluded, availableUsers = [] }: { onAdd: (id: string) => void; excluded: string[]; availableUsers?: { id: string; name: string }[] }) {
  const assignees = useAssignees()
  const users: UserItem[] = assignees.length > 0 ? assignees : availableUsers.map(u => ({ id: u.id, name: u.name, email: '', role: 'STAFF' }))
  return (
    <select onChange={(e) => { if (e.target.value) { onAdd(e.target.value); e.target.value = '' } }} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-all">
      <option value="">Add collaborator...</option>
      {users.filter(user => !excluded.includes(user.id)).map(user => (<option key={user.id} value={user.id}>{user.name} ({user.role})</option>))}
    </select>
  )
}

function ClientSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const clients = useClients()
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-all">
      <option value="">Select client...</option>
      {clients.map(client => (<option key={client.id} value={client.id}>{client.name} ({client.tier})</option>))}
    </select>
  )
}

function BookingSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const bookings = useBookings()
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-all">
      <option value="">Select booking...</option>
      {bookings.map(booking => (<option key={booking.id} value={booking.id}>{booking.clientName} - {booking.service} ({booking.date})</option>))}
    </select>
  )
}

function DependencyList({ value, onRemove }: { value: string[]; onRemove: (id: string) => void }) {
  const taskList = useTasksForDeps()
  return (
    <div className="space-y-2 mb-4">
      {value.map(depId => {
        const t = taskList.find(x => x.id === depId)
        if (!t) return null
        return (
          <motion.div key={depId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-purple-500" /><span className="text-sm font-medium text-gray-900">{t.title}</span></div>
            <motion.button type="button" onClick={() => onRemove(depId)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-all"><X className="w-4 h-4" /></motion.button>
          </motion.div>
        )
      })}
    </div>
  )
}

function DependencySelect({ onAdd, selected }: { onAdd: (id: string) => void; selected: string[] }) {
  const taskList = useTasksForDeps()
  const available = taskList.filter(t => !selected.includes(t.id))
  return (
    <select onChange={(e) => { if (e.target.value) { onAdd(e.target.value); e.target.value = '' } }} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-all">
      <option value="">Add dependency...</option>
      {available.map(t => (<option key={t.id} value={t.id}>{t.title}</option>))}
    </select>
  )
}
