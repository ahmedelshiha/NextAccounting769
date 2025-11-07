"use client"
'use client'
import React, { useState, useEffect } from 'react'
import {
  Users,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Save,
  X,
  UserPlus,
  Mail,
  Phone,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  Plus
} from 'lucide-react'

const defaultStats = { totalBookings: 0, completedBookings: 0, averageRating: 0, totalRatings: 0, revenueGenerated: 0, utilizationRate: 0 }
const defaultWorkingHours = { start: '09:00', end: '17:00', timezone: 'Africa/Cairo', days: ['Monday','Tuesday','Wednesday','Thursday','Friday'] }

// Types
interface TeamMember {
  id: string
  userId?: string | null
  name: string
  email: string
  role: string
  department: 'tax' | 'audit' | 'consulting' | 'bookkeeping' | 'advisory' | 'admin'
  status: 'active' | 'inactive' | 'on_leave' | 'busy'
  phone?: string
  title: string
  certifications: string[]
  specialties: string[]
  experienceYears: number
  hourlyRate?: number
  workingHours: { start: string; end: string; timezone: string; days: string[] }
  isAvailable: boolean
  availabilityNotes?: string
  stats: { totalBookings: number; completedBookings: number; averageRating: number; totalRatings: number; revenueGenerated: number; utilizationRate: number }
  canManageBookings: boolean
  canViewAllClients: boolean
  notificationSettings: { email: boolean; sms: boolean; inApp: boolean }
  joinDate: string
  lastActive: string
  notes?: string
}

const departmentOptions = [
  { value: 'tax', label: 'Tax Services', color: 'bg-green-100 text-green-800' },
  { value: 'audit', label: 'Audit', color: 'bg-blue-100 text-blue-800' },
  { value: 'consulting', label: 'Consulting', color: 'bg-purple-100 text-purple-800' },
  { value: 'bookkeeping', label: 'Bookkeeping', color: 'bg-orange-100 text-orange-800' },
  { value: 'advisory', label: 'Advisory', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'admin', label: 'Administration', color: 'bg-muted text-muted-foreground' }
] as const

function TeamMemberCard({ member, onEdit, onDelete, onToggleStatus, onViewDetails }: {
  member: TeamMember
  onEdit: (m: TeamMember) => void
  onDelete: (id: string) => void
  onToggleStatus: (m: TeamMember) => void
  onViewDetails: (m: TeamMember) => void
}) {
  const getDepartmentColor = (dept: TeamMember['department']) => {
    const option = departmentOptions.find((opt) => opt.value === dept)
    return option?.color || 'bg-muted text-muted-foreground'
  }
  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'busy': return 'text-yellow-600 bg-yellow-50'
      case 'on_leave': return 'text-blue-600 bg-blue-50'
      case 'inactive': return 'text-muted-foreground bg-gray-50'
      default: return 'text-muted-foreground bg-gray-50'
    }
  }
  const s = member.stats || defaultStats
  const utilizationColor = s.utilizationRate >= 85 ? 'text-green-600' : s.utilizationRate >= 70 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-lg">
              {member.name.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(member.department)}`}>
                {departmentOptions.find((d) => d.value === member.department)?.label}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                {member.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => onViewDetails(member)} className="p-2 text-gray-400 hover:text-muted-foreground rounded-lg hover:bg-muted" aria-label="View details">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => onEdit(member)} className="p-2 text-gray-400 hover:text-muted-foreground rounded-lg hover:bg-muted" aria-label="Edit">
            <Edit className="h-4 w-4" />
          </button>
          <div className="relative group">
            <button className="p-2 text-gray-400 hover:text-muted-foreground rounded-lg hover:bg-muted" aria-haspopup>
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <div className="absolute right-0 top-8 w-56 bg-card rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button onClick={() => onToggleStatus(member)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                {member.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {member.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
              </button>
              <button onClick={() => {
                if (!member.userId) { alert('This team member is not linked to a user account and cannot be assigned tasks. Edit member and set a User.'); return }
                const title = prompt('Task title', `Follow up: ${member.name}`)
                if (!title) return
                const due = prompt('Due date (YYYY-MM-DD)', new Date().toISOString().slice(0,10))
                const priority = prompt('Priority (LOW|MEDIUM|HIGH)', 'MEDIUM')
                ;(async () => {
                  try {
                    const res = await fetch('/api/admin/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, priority: (priority || 'MEDIUM').toUpperCase(), status: 'OPEN', dueAt: due ? new Date(due).toISOString() : null, assigneeId: member.userId }) })
                    if (res.ok) alert('Task created and assigned')
                    else alert('Failed to create task')
                  } catch { alert('Failed to create task') }
                })()
              }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Task for Member
              </button>
              <button onClick={() => onDelete(member.id)} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Remove Member
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Mail className="h-4 w-4 mr-2" />
          {member.email}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Phone className="h-4 w-4 mr-2" />
          {member.phone || 'Not provided'}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Utilization Rate:</span>
          <span className={`font-medium ${utilizationColor}`}>{s.utilizationRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`${s.utilizationRate >= 85 ? 'bg-green-500' : s.utilizationRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'} h-2 rounded-full transition-all`} style={{ width: `${s.utilizationRate}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground mb-4">
        <div>
          <div className="font-medium text-foreground">{s.totalBookings}</div>
          <div>Bookings</div>
        </div>
        <div>
          <div className="font-medium text-foreground flex items-center justify-center gap-1">
            {s.averageRating}
            <Star className="h-3 w-3 text-yellow-500" />
          </div>
          <div>Rating</div>
        </div>
        <div>
          <div className="font-medium text-foreground">${(s.revenueGenerated / 1000).toFixed(0)}k</div>
          <div>Revenue</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {(member.workingHours || defaultWorkingHours).start} - {(member.workingHours || defaultWorkingHours).end}
        </div>
        <div className="flex flex-wrap gap-1">
          {(member.specialties || []).slice(0, 2).map((sp, idx) => (
            <span key={idx} className="inline-block bg-muted text-muted-foreground px-2 py-1 rounded text-xs">{sp}</span>
          ))}
          {(member.specialties || []).length > 2 && (
            <span className="inline-block bg-muted text-muted-foreground px-2 py-1 rounded text-xs">+{(member.specialties || []).length - 2} more</span>
          )}
        </div>
      </div>
    </div>
  )
}

function TeamMemberForm({ member, onSave, onCancel }: {
  member: TeamMember | null
  onSave: (data: Partial<TeamMember>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<TeamMember>>(() => {
    if (member) return { ...member }
    return {
      role: 'TEAM_MEMBER',
      department: 'tax',
      title: '',
      specialties: [],
      certifications: [],
      experienceYears: 0,
      workingHours: { start: '09:00', end: '17:00', timezone: 'Africa/Cairo', days: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
      canManageBookings: false,
      canViewAllClients: false,
      notificationSettings: { email: true, sms: false, inApp: true }
    } as Partial<TeamMember>
  })
  const [activeTab, setActiveTab] = useState<'basic'|'professional'|'schedule'|'permissions'>('basic')

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData) }
  const toggleSpecialty = (specialty: string) => setFormData((p) => ({ ...p, specialties: (p.specialties || []).includes(specialty) ? (p.specialties || []).filter((s) => s !== specialty) : ([...(p.specialties || []), specialty]) }))
  const toggleCertification = (cert: string) => setFormData((p) => ({ ...p, certifications: (p.certifications || []).includes(cert) ? (p.certifications || []).filter((c) => c !== cert) : ([...(p.certifications || []), cert]) }))
  const toggleWorkingDay = (day: string) => setFormData((p) => ({ ...p, workingHours: { ...(p.workingHours as TeamMember['workingHours']), days: (p.workingHours?.days || []).includes(day) ? (p.workingHours?.days || []).filter((d) => d !== day) : ([...(p.workingHours?.days || []), day]) } }))

  const specialtiesList = ['Corporate Tax','Individual Tax','International Tax','Tax Planning','VAT','Payroll Tax','Financial Audit','Internal Audit','Compliance Review','Risk Assessment','Forensic Audit','Business Strategy','Financial Planning','Growth Advisory','Process Optimization','Bookkeeping','Accounts Payable','Accounts Receivable','Financial Reporting','Wealth Management','Investment Advisory','Estate Planning','Retirement Planning']
  const certificationsList = ['CPA','CIA','CMA','CFA','EA','MBA','ACCA','Tax Specialist','Audit Specialist','Business Strategy Cert','Financial Planning Cert']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">{member ? 'Edit Team Member' : 'Add Team Member'}</h2>
            <button onClick={onCancel} className="p-2 hover:bg-muted rounded-lg" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex space-x-1 mt-4 bg-muted rounded-lg p-1">
            {([
              { key: 'basic', label: 'Basic Info' },
              { key: 'professional', label: 'Professional' },
              { key: 'schedule', label: 'Schedule' },
              { key: 'permissions', label: 'Permissions' }
            ] as const).map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-2 text-sm rounded-md transition-colors ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{tab.label}</button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name *</label>
                    <input required type="text" value={formData.name || ''} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address *</label>
                    <input required type="email" value={formData.email || ''} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Phone Number</label>
                    <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Role *</label>
                    <select value={formData.role || 'TEAM_MEMBER'} onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="TEAM_MEMBER">Team Member</option>
                      <option value="TEAM_LEAD">Team Lead</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Department *</label>
                    <select value={formData.department || 'tax'} onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value as TeamMember['department'] }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      {departmentOptions.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Job Title *</label>
                    <input required type="text" value={formData.title || ''} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., Senior Tax Advisor" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Notes</label>
                  <textarea value={formData.notes || ''} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Additional notes about this team member..." />
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Years of Experience</label>
                    <input type="number" min={0} max={50} value={formData.experienceYears || 0} onChange={(e) => setFormData((p) => ({ ...p, experienceYears: parseInt(e.target.value) || 0 }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Hourly Rate ($)</label>
                    <input type="number" min={0} step={0.01} value={formData.hourlyRate || ''} onChange={(e) => setFormData((p) => ({ ...p, hourlyRate: parseFloat(e.target.value) || undefined }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Specialties</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
                    {specialtiesList.map((s) => (
                      <label key={s} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={(formData.specialties || []).includes(s)} onChange={() => toggleSpecialty(s)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-muted-foreground">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Certifications</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-border rounded-lg p-3">
                    {certificationsList.map((c) => (
                      <label key={c} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={(formData.certifications || []).includes(c)} onChange={() => toggleCertification(c)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-muted-foreground">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Start Time</label>
                    <input type="time" value={formData.workingHours?.start || '09:00'} onChange={(e) => setFormData((p) => ({ ...p, workingHours: { ...(p.workingHours as TeamMember['workingHours']), start: e.target.value } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">End Time</label>
                    <input type="time" value={formData.workingHours?.end || '17:00'} onChange={(e) => setFormData((p) => ({ ...p, workingHours: { ...(p.workingHours as TeamMember['workingHours']), end: e.target.value } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Timezone</label>
                    <select value={formData.workingHours?.timezone || 'Africa/Cairo'} onChange={(e) => setFormData((p) => ({ ...p, workingHours: { ...(p.workingHours as TeamMember['workingHours']), timezone: e.target.value } }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="Africa/Cairo">Cairo (GMT+2)</option>
                      <option value="Europe/London">London (GMT+0)</option>
                      <option value="America/New_York">New York (GMT-5)</option>
                      <option value="Asia/Dubai">Dubai (GMT+4)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day) => (
                      <label key={day} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={(formData.workingHours?.days || []).includes(day)} onChange={() => toggleWorkingDay(day)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-muted-foreground">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Manage Bookings</h3>
                      <p className="text-xs text-muted-foreground">Can create, edit, and manage client bookings</p>
                    </div>
                    <input type="checkbox" checked={!!formData.canManageBookings} onChange={(e) => setFormData((p) => ({ ...p, canManageBookings: e.target.checked }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">View All Clients</h3>
                      <p className="text-xs text-muted-foreground">Can access and view information for all clients</p>
                    </div>
                    <input type="checkbox" checked={!!formData.canViewAllClients} onChange={(e) => setFormData((p) => ({ ...p, canViewAllClients: e.target.checked }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Notification Preferences</h3>
                  <div className="space-y-3">
                    {([
                      { key: 'email', label: 'Email Notifications', desc: 'Booking updates, reminders, and alerts' },
                      { key: 'sms', label: 'SMS Notifications', desc: 'Urgent alerts and reminders via text' },
                      { key: 'inApp', label: 'In-App Notifications', desc: 'Dashboard alerts and system updates' }
                    ] as const).map((opt) => (
                      <div key={opt.key} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-muted-foreground">{opt.label}</span>
                          <p className="text-xs text-gray-500">{opt.desc}</p>
                        </div>
                        <input type="checkbox" checked={Boolean(formData.notificationSettings?.[opt.key])} onChange={(e) => setFormData((p) => ({ ...p, notificationSettings: { ...(p.notificationSettings || { email: true, sms: false, inApp: true }), [opt.key]: e.target.checked } }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-border p-6 bg-gray-50 flex justify-end space-x-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-muted-foreground border border-gray-300 rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><Save className="h-4 w-4" />{member ? 'Update Member' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TeamMemberDetails({ member, onClose, onEdit }: { member: TeamMember | null; onClose: () => void; onEdit: (m: TeamMember) => void }) {
  if (!member) return null
  const s = member.stats || defaultStats
  const wh = member.workingHours || defaultWorkingHours
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">{member.name.split(' ').map((n) => n[0]).join('')}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{member.name}</h2>
                <p className="text-muted-foreground">{member.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${member.department === 'tax' ? 'bg-green-100 text-green-800' : member.department === 'audit' ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-foreground'}`}>{member.department}</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${member.status === 'active' ? 'text-green-600 bg-green-50' : member.status === 'busy' ? 'text-yellow-600 bg-yellow-50' : member.status === 'on_leave' ? 'text-blue-600 bg-blue-50' : 'text-muted-foreground bg-gray-50'}`}>{member.status.replace('_',' ')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => onEdit(member)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"><Edit className="h-4 w-4" />Edit</button>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3"><Mail className="h-5 w-5 text-gray-400" /><div><div className="text-sm text-muted-foreground">Email</div><div className="font-medium">{member.email}</div></div></div>
                <div className="flex items-center space-x-3"><Phone className="h-5 w-5 text-gray-400" /><div><div className="text-sm text-muted-foreground">Phone</div><div className="font-medium">{member.phone || 'Not provided'}</div></div></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center"><div className="text-2xl font-bold text-foreground">{s.totalBookings}</div><div className="text-sm text-muted-foreground">Total Bookings</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-green-600">{s.completedBookings}</div><div className="text-sm text-muted-foreground">Completed</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">{s.averageRating}<Star className="h-5 w-5" /></div><div className="text-sm text-muted-foreground">Avg Rating</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-blue-600">${(s.revenueGenerated / 1000).toFixed(0)}k</div><div className="text-sm text-muted-foreground">Revenue</div></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Utilization Rate</span>
                  <span className={`text-sm font-bold ${s.utilizationRate >= 85 ? 'text-green-600' : s.utilizationRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{s.utilizationRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3"><div className={`${s.utilizationRate >= 85 ? 'bg-green-500' : s.utilizationRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'} h-3 rounded-full transition-all`} style={{ width: `${s.utilizationRate}%` }} /></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-3">Schedule & Availability</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3"><Clock className="h-5 w-5 text-gray-400" /><div><div className="text-sm text-muted-foreground">Working Hours</div><div className="font-medium">{wh.start} - {wh.end} ({wh.timezone})</div></div></div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Working Days</div>
                  <div className="flex flex-wrap gap-2">
                    {wh.days.map((day, idx) => (<span key={idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{day}</span>))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TeamManagement({ hideHeader = false }: { hideHeader?: boolean }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TeamMember['status']>('all')
  const [departmentFilter, setDepartmentFilter] = useState<'all' | TeamMember['department']>('all')
  const [skillFilter, setSkillFilter] = useState<string>('all')
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null)

  useEffect(() => {
    const loadMembers = async () => {
      try {
        // Load core team members via service
        const { TeamMemberService } = await import('@/services/team-member.service')
        const svc = new TeamMemberService()
        const members = await svc.list()

        // Load availability metrics (availabilityPercentage per member)
        const availabilityById: Record<string, number> = {}
        try {
          const availRes = await fetch('/api/admin/team-management/availability', { cache: 'no-store' })
          const availJson = await availRes.json().catch(() => ({} as any))
          const list = Array.isArray(availJson?.data) ? availJson.data : []
          for (const it of list) {
            availabilityById[String(it.id || it.memberId || it.userId || '')] = Number(it.availabilityPercentage || 0)
          }
        } catch {}

        // Load unique skills to power filter
        try {
          const skillsRes = await fetch('/api/admin/team-management/skills', { cache: 'no-store' })
          const skillsJson = await skillsRes.json().catch(() => ({} as any))
          const skills = Array.isArray(skillsJson?.data?.skills) ? skillsJson.data.skills : []
          setAvailableSkills(skills)
        } catch {}

        setTeamMembers(members.map((m: any) => ({
          id: String(m.id ?? m.userId ?? m.email ?? m.name ?? Math.random().toString(36).slice(2)),
          userId: m.userId ?? null,
          name: m.name ?? '',
          email: m.email ?? '',
          role: m.role ?? 'TEAM_MEMBER',
          department: m.department ?? 'tax',
          status: m.status ?? 'active',
          phone: m.phone ?? '',
          title: m.title ?? '',
          certifications: Array.isArray(m.certifications) ? m.certifications : [],
          specialties: Array.isArray(m.specialties) ? m.specialties : [],
          experienceYears: Number.isFinite(m.experienceYears) ? m.experienceYears : 0,
          hourlyRate: typeof m.hourlyRate === 'number' ? m.hourlyRate : undefined,
          workingHours: m.workingHours && m.workingHours.start && m.workingHours.end && m.workingHours.timezone && Array.isArray(m.workingHours.days) ? m.workingHours : defaultWorkingHours,
          isAvailable: Boolean(m.isAvailable),
          availabilityNotes: m.availabilityNotes ?? '',
          stats: m.stats && typeof m.stats === 'object' ? {
            totalBookings: Number.isFinite(m.stats.totalBookings) ? m.stats.totalBookings : 0,
            completedBookings: Number.isFinite(m.stats.completedBookings) ? m.stats.completedBookings : 0,
            averageRating: Number.isFinite(m.stats.averageRating) ? m.stats.averageRating : 0,
            totalRatings: Number.isFinite(m.stats.totalRatings) ? m.stats.totalRatings : 0,
            revenueGenerated: Number.isFinite(m.stats.revenueGenerated) ? m.stats.revenueGenerated : 0,
            // Prefer availability-derived utilization when present
            utilizationRate: Number.isFinite(availabilityById[String(m.id)]) ? Math.max(0, Math.min(100, 100 - availabilityById[String(m.id)])) : (Number.isFinite(m.stats.utilizationRate) ? m.stats.utilizationRate : 0)
          } : (Number.isFinite(availabilityById[String(m.id)]) ? { ...defaultStats, utilizationRate: Math.max(0, Math.min(100, 100 - availabilityById[String(m.id)])) } : defaultStats),
          canManageBookings: Boolean(m.canManageBookings),
          canViewAllClients: Boolean(m.canViewAllClients),
          notificationSettings: m.notificationSettings && typeof m.notificationSettings === 'object' ? {
            email: Boolean(m.notificationSettings.email),
            sms: Boolean(m.notificationSettings.sms),
            inApp: Boolean(m.notificationSettings.inApp)
          } : { email: true, sms: false, inApp: true },
          joinDate: m.joinDate ?? new Date().toISOString(),
          lastActive: m.lastActive ?? new Date().toISOString(),
          notes: m.notes ?? ''
        } as TeamMember)))
      } catch (err) {
        console.error('Failed to load team members', err)
      }
    }
    loadMembers()
  }, [])

  const filteredMembers = teamMembers.filter((m) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = (m.name || '').toLowerCase().includes(term) || (m.email || '').toLowerCase().includes(term) || (m.title || '').toLowerCase().includes(term)
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
    const matchesDepartment = departmentFilter === 'all' || m.department === departmentFilter
    const matchesSkill = skillFilter === 'all' || (m.specialties || []).includes(skillFilter)
    return matchesSearch && matchesStatus && matchesDepartment && matchesSkill
  })

  const handleSave = async (data: Partial<TeamMember>) => {
    setLoading(true)
    try {
      const { TeamMemberService } = await import('@/services/team-member.service')
      const svc = new TeamMemberService()
      if (editingMember) {
        const updated = await svc.update(editingMember.id, data as any)
        if (!updated) throw new Error('Failed to update')
        setTeamMembers((prev) => prev.map((m) => (m.id === editingMember.id ? updated : m)))
      } else {
        const created = await svc.create(data as any)
        if (!created) throw new Error('Failed to create')
        setTeamMembers((prev) => [...prev, created])
      }
      setShowForm(false)
      setEditingMember(null)
    } catch {
      alert('Failed to save team member')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    setLoading(true)
    try {
      const { TeamMemberService } = await import('@/services/team-member.service')
      const svc = new TeamMemberService()
      const ok = await svc.remove(id)
      if (!ok) throw new Error('Failed to delete')
      setTeamMembers((prev) => prev.filter((m) => m.id !== id))
    } catch {
      alert('Failed to remove team member')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (member: TeamMember) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active'
    const { TeamMemberService } = await import('@/services/team-member.service')
    const svc = new TeamMemberService()
    const updated = await svc.toggleStatus(member.id, newStatus)
    if (updated) {
      setTeamMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, status: newStatus, isAvailable: newStatus === 'active' } : m)))
    }
  }

  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter((m) => m.status === 'active').length,
    busy: teamMembers.filter((m) => m.status === 'busy').length,
    avgUtilization: teamMembers.length ? Math.round(teamMembers.reduce((acc, m) => acc + (m.stats?.utilizationRate ?? 0), 0) / teamMembers.length) : 0,
    totalRevenue: teamMembers.reduce((acc, m) => acc + (m.stats?.revenueGenerated ?? 0), 0)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
            <p className="text-muted-foreground">Manage team members and their assignments</p>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Team Member
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-lg border"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Members</p><p className="text-2xl font-bold text-foreground">{stats.total}</p></div><Users className="h-8 w-8 text-blue-500" /></div></div>
        <div className="bg-card p-4 rounded-lg border"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-green-600">{stats.active}</p></div><CheckCircle className="h-8 w-8 text-green-500" /></div></div>
        <div className="bg-card p-4 rounded-lg border"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Busy</p><p className="text-2xl font-bold text-yellow-600">{stats.busy}</p></div><Clock className="h-8 w-8 text-yellow-500" /></div></div>
        <div className="bg-card p-4 rounded-lg border"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Avg Utilization</p><p className="text-2xl font-bold text-purple-600">{stats.avgUtilization}%</p></div><Calendar className="h-8 w-8 text-purple-500" /></div></div>
        <div className="bg-card p-4 rounded-lg border"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold text-green-600">${(stats.totalRevenue / 1000).toFixed(0)}k</p></div><Star className="h-8 w-8 text-green-500" /></div></div>
      </div>

      <div className="bg-card p-4 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search team members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | TeamMember['status'])} className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="busy">Busy</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value as 'all' | TeamMember['department'])} className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Departments</option>
            {departmentOptions.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
          </select>
          <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Skills</option>
            {availableSkills.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <TeamMemberCard key={member.id} member={member} onEdit={(m) => { setEditingMember(m); setShowForm(true) }} onDelete={handleDelete} onToggleStatus={handleToggleStatus} onViewDetails={setViewingMember} />
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No team members found</h3>
          <p className="text-muted-foreground mb-4">{searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first team member'}</p>
          {!searchTerm && statusFilter === 'all' && departmentFilter === 'all' && (
            <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Add First Team Member</button>
          )}
        </div>
      )}

      {showForm && (
        <TeamMemberForm member={editingMember} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingMember(null) }} />
      )}

      {viewingMember && (
        <TeamMemberDetails member={viewingMember} onClose={() => setViewingMember(null)} onEdit={(m) => { setViewingMember(null); setEditingMember(m); setShowForm(true) }} />
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-card rounded-lg p-6 flex items-center space-x-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span className="text-foreground">Processing...</span></div></div>
      )}
    </div>
  )
}
