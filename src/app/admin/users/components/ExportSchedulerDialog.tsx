'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Mail, Calendar, Settings, Trash2, Copy, Edit2, MoreHorizontal, ToggleRight } from 'lucide-react'
import { useExportScheduler } from '../hooks/useExportScheduler'
import type { ExportSchedule } from '../utils/export-scheduler'
import {
  calculateNextExecutionTime,
  formatFrequency,
  validateSchedule,
  createDefaultEmailTemplate,
  generateEmailSubject,
  generateEmailBody,
  ExportFormat,
  ScheduleFrequency,
  DayOfWeek
} from '../utils/export-scheduler'

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
]

const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV (Comma-separated)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'json', label: 'JSON' },
  { value: 'pdf', label: 'PDF' }
]

const FREQUENCIES: { value: ScheduleFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
]

interface ExportSchedulerDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingSchedule?: ExportSchedule | null
}

/**
 * Export Scheduler Dialog Component
 * Allows users to create, edit, and manage export schedules
 */
export function ExportSchedulerDialog({
  isOpen,
  onOpenChange,
  editingSchedule
}: ExportSchedulerDialogProps) {
  const { createSchedule, updateSchedule, schedules } = useExportScheduler({ autoFetch: false })

  // Form state
  const [name, setName] = useState(editingSchedule?.name || '')
  const [description, setDescription] = useState(editingSchedule?.description || '')
  const [frequency, setFrequency] = useState<ScheduleFrequency>(editingSchedule?.frequency as ScheduleFrequency || 'weekly')
  const [format, setFormat] = useState<ExportFormat>(editingSchedule?.format as ExportFormat || 'xlsx')
  const [recipients, setRecipients] = useState<string>(editingSchedule?.recipients.join(', ') || '')
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(editingSchedule?.dayOfWeek as DayOfWeek || 'monday')
  const [dayOfMonth, setDayOfMonth] = useState(editingSchedule?.dayOfMonth?.toString() || '1')
  const [time, setTime] = useState(editingSchedule?.time || '09:00')
  const [includeAttachment, setIncludeAttachment] = useState(editingSchedule?.includeAttachment ?? true)
  const [customEmail, setCustomEmail] = useState(false)
  const [emailSubject, setEmailSubject] = useState(editingSchedule?.emailSubject || '')
  const [emailBody, setEmailBody] = useState(editingSchedule?.emailBody || '')
  const [isActive, setIsActive] = useState(editingSchedule?.isActive ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate next execution time
  const nextExecutionTime = useMemo(() => {
    const formData: Partial<ExportSchedule> = {
      frequency,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' || frequency === 'quarterly' || frequency === 'yearly' ? parseInt(dayOfMonth) : undefined,
      time
    } as any

    try {
      return calculateNextExecutionTime(formData as ExportSchedule)
    } catch {
      return null
    }
  }, [frequency, dayOfWeek, dayOfMonth, time])

  // Load default email template
  const defaultTemplate = useMemo(() => {
    return createDefaultEmailTemplate(frequency)
  }, [frequency])

  // Handle email template change
  const handleUseDefaultTemplate = () => {
    setEmailSubject(defaultTemplate.subject)
    setEmailBody(defaultTemplate.body)
    setCustomEmail(false)
  }

  // Parse recipients
  const recipientList = recipients
    .split(',')
    .map(r => r.trim())
    .filter(r => r.length > 0)

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Schedule name is required'
    }

    if (recipientList.length === 0) {
      newErrors.recipients = 'At least one recipient is required'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipientList.filter(email => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      newErrors.recipients = `Invalid email addresses: ${invalidEmails.join(', ')}`
    }

    if (frequency === 'monthly' && (parseInt(dayOfMonth) < 1 || parseInt(dayOfMonth) > 31)) {
      newErrors.dayOfMonth = 'Day must be between 1 and 31'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    const scheduleData = {
      name,
      description: description || undefined,
      frequency,
      format,
      recipients: recipientList,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
      dayOfMonth: ['monthly', 'quarterly', 'yearly'].includes(frequency) ? parseInt(dayOfMonth) : undefined,
      time,
      emailSubject: customEmail ? emailSubject : undefined,
      emailBody: customEmail ? emailBody : undefined,
      isActive
    }

    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, scheduleData)
      } else {
        await createSchedule(scheduleData as any)
      }

      // Reset form
      setName('')
      setDescription('')
      setFrequency('weekly')
      setFormat('xlsx')
      setRecipients('')
      setDayOfWeek('monday')
      setDayOfMonth('1')
      setTime('09:00')
      setCustomEmail(false)
      setEmailSubject('')
      setEmailBody('')
      setIsActive(true)
      setErrors({})

      onOpenChange(false)
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save schedule'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingSchedule ? 'Edit Export Schedule' : 'Create Export Schedule'}</DialogTitle>
          <DialogDescription>
            Set up automated exports to be sent to team members on a recurring schedule
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Basic Information
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Schedule Name *</label>
              <Input
                placeholder="e.g., Weekly Team Report"
                value={name}
                onChange={e => setName(e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Optional description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency *</label>
                <Select value={frequency} onValueChange={value => setFrequency(value as ScheduleFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(freq => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format *</label>
                <Select value={format} onValueChange={value => setFormat(value as ExportFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_FORMATS.map(fmt => (
                      <SelectItem key={fmt.value} value={fmt.value}>
                        {fmt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {frequency === 'weekly' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Day of Week</label>
                  <Select value={dayOfWeek} onValueChange={value => setDayOfWeek(value as DayOfWeek)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {['monthly', 'quarterly', 'yearly'].includes(frequency) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Day of Month</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={e => setDayOfMonth(e.target.value)}
                    className={errors.dayOfMonth ? 'border-red-500' : ''}
                  />
                  {errors.dayOfMonth && <p className="text-xs text-red-500">{errors.dayOfMonth}</p>}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Time of Day</label>
                <Input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>

            {nextExecutionTime && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    Next export: <strong>{nextExecutionTime.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Recipients */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Recipients
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Addresses * (comma-separated)</label>
              <textarea
                placeholder="user1@example.com, user2@example.com"
                value={recipients}
                onChange={e => setRecipients(e.target.value)}
                className={`w-full p-2 border rounded-lg text-sm font-mono ${errors.recipients ? 'border-red-500' : ''}`}
                rows={3}
              />
              {errors.recipients && <p className="text-xs text-red-500">{errors.recipients}</p>}
              <p className="text-xs text-gray-500">
                {recipientList.length > 0 && `${recipientList.length} recipient(s)`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="attachment"
                checked={includeAttachment}
                onCheckedChange={checked => setIncludeAttachment(checked as boolean)}
              />
              <label htmlFor="attachment" className="text-sm cursor-pointer">
                Include file attachment in email
              </label>
            </div>
          </div>

          {/* Email Template */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Email Template</h3>

            <Tabs value={customEmail ? 'custom' : 'default'} onValueChange={v => setCustomEmail(v === 'custom')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="default">Default Template</TabsTrigger>
                <TabsTrigger value="custom">Custom Template</TabsTrigger>
              </TabsList>

              <TabsContent value="default" className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseDefaultTemplate}
                  className="w-full"
                >
                  Use Default Template
                </Button>
                <Card className="p-3 bg-gray-50">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Subject:</span>
                      <p className="text-gray-600 text-xs mt-1">{defaultTemplate.subject}</p>
                    </div>
                    <div>
                      <span className="font-medium">Body preview:</span>
                      <p className="text-gray-600 text-xs mt-1 whitespace-pre-wrap line-clamp-3">
                        {defaultTemplate.body}
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="custom" className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Subject</label>
                  <Input
                    placeholder="Export Report - {export_date}"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Available variables: {'{export_date}, {record_count}, {export_format}'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Body</label>
                  <textarea
                    placeholder="Hello,\n\nPlease find attached your export..."
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm font-mono"
                    rows={5}
                  />
                  <p className="text-xs text-gray-500">
                    Available variables: {'{export_date}, {record_count}, {export_format}, {export_time}'}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={isActive}
              onCheckedChange={checked => setIsActive(checked as boolean)}
            />
            <label htmlFor="active" className="text-sm cursor-pointer">
              Active (Schedule will run when enabled)
            </label>
          </div>

          {/* Error message */}
          {errors.submit && <div className="p-3 bg-red-50 rounded-lg text-sm text-red-900">{errors.submit}</div>}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Export Schedules Management Panel Component
 */
export function ExportSchedulesPanel() {
  const { schedules, isLoading, deleteSchedule, toggleScheduleActive, duplicateSchedule } = useExportScheduler()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ExportSchedule | null>(null)

  const handleEdit = (schedule: ExportSchedule) => {
    setEditingSchedule(schedule)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      await deleteSchedule(id)
    }
  }

  const handleDuplicate = async (schedule: ExportSchedule) => {
    await duplicateSchedule(schedule.id, `${schedule.name} (Copy)`)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSchedule(null)
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading schedules...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Export Schedules ({schedules.length})</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingSchedule(null)
            setIsDialogOpen(true)
          }}
        >
          + New Schedule
        </Button>
      </div>

      {schedules.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <p>No export schedules yet</p>
          <p className="text-sm">Create one to set up automated exports</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map(schedule => (
            <Card key={schedule.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{schedule.name}</h4>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                      {schedule.format.toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {formatFrequency(schedule.frequency, schedule.dayOfWeek as DayOfWeek, schedule.dayOfMonth)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{schedule.recipients.join(', ')}</p>
                  <p className="text-xs text-gray-500">
                    {schedule.nextExecutedAt && `Next: ${new Date(schedule.nextExecutedAt).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleScheduleActive(schedule.id)}
                    title={schedule.isActive ? 'Disable' : 'Enable'}
                  >
                    <ToggleRight className={`w-4 h-4 ${schedule.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(schedule)}
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDuplicate(schedule)}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(schedule.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ExportSchedulerDialog
        isOpen={isDialogOpen}
        onOpenChange={handleCloseDialog}
        editingSchedule={editingSchedule}
      />
    </div>
  )
}
