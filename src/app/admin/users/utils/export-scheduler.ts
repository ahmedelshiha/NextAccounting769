/**
 * Export Scheduler: Manage scheduled and recurring exports
 */

export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf'
export type ScheduleFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface ExportSchedule {
  id: string
  name: string
  description?: string
  frequency: ScheduleFrequency
  format: ExportFormat
  recipients: string[]
  dayOfWeek?: DayOfWeek // For weekly exports
  dayOfMonth?: number // For monthly/quarterly/yearly (1-31)
  time?: string // HH:mm format
  includeAttachment?: boolean
  includeInlinePreview?: boolean
  emailSubject?: string
  emailBody?: string
  createdAt: string
  updatedAt: string
  lastExecutedAt?: string
  nextExecutedAt?: string
  isActive: boolean
  filterPresetId?: string // Optional: specific filter preset to export
}

export interface ExportExecution {
  id: string
  scheduleId: string
  executedAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  recipientCount: number
  recordCount: number
  fileSizeBytes?: number
  errorMessage?: string
  deliveryStatus?: Record<string, 'sent' | 'bounced' | 'failed'>
}

export interface ScheduledExportResult {
  success: boolean
  scheduleId?: string
  error?: string
  executionId?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[] // e.g., ['{export_date}', '{record_count}', '{recipient_name}']
  createdAt: string
  updatedAt: string
}

/**
 * Validate export schedule configuration
 */
export function validateSchedule(schedule: Partial<ExportSchedule>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!schedule.name || schedule.name.trim().length === 0) {
    errors.push('Schedule name is required')
  }

  if (!schedule.frequency || !['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].includes(schedule.frequency)) {
    errors.push('Invalid frequency. Must be daily, weekly, biweekly, monthly, quarterly, or yearly.')
  }

  if (!schedule.format || !['csv', 'xlsx', 'json', 'pdf'].includes(schedule.format)) {
    errors.push('Invalid format. Must be csv, xlsx, json, or pdf.')
  }

  if (!schedule.recipients || schedule.recipients.length === 0) {
    errors.push('At least one recipient email is required')
  }

  if (schedule.recipients && schedule.recipients.some(email => !isValidEmail(email))) {
    errors.push('One or more recipient email addresses are invalid')
  }

  if (schedule.dayOfMonth && (schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31)) {
    errors.push('Day of month must be between 1 and 31')
  }

  if (schedule.time && !isValidTime(schedule.time)) {
    errors.push('Invalid time format. Use HH:mm (24-hour format)')
  }

  if (schedule.frequency === 'weekly' && !schedule.dayOfWeek) {
    errors.push('Day of week is required for weekly schedules')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate time format (HH:mm)
 */
export function isValidTime(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

/**
 * Calculate next execution time based on schedule
 */
export function calculateNextExecutionTime(schedule: ExportSchedule): Date {
  const now = new Date()
  const [hours, minutes] = (schedule.time || '09:00').split(':').map(Number)

  let nextExecution = new Date(now)
  nextExecution.setHours(hours, minutes, 0, 0)

  // If time has already passed today, move to next occurrence
  if (nextExecution <= now) {
    nextExecution.setDate(nextExecution.getDate() + 1)
  }

  switch (schedule.frequency) {
    case 'daily':
      if (nextExecution <= now) {
        nextExecution.setDate(nextExecution.getDate() + 1)
      }
      break

    case 'weekly':
      const dayOfWeekIndex = getDayOfWeekIndex(schedule.dayOfWeek || 'monday')
      const currentDayIndex = nextExecution.getDay()
      let daysUntilTarget = dayOfWeekIndex - currentDayIndex

      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextExecution <= now)) {
        daysUntilTarget += 7
      }

      nextExecution.setDate(nextExecution.getDate() + daysUntilTarget)
      break

    case 'biweekly':
      nextExecution.setDate(nextExecution.getDate() + 14)
      break

    case 'monthly':
      const targetDay = schedule.dayOfMonth || 1
      nextExecution.setDate(targetDay)

      if (nextExecution <= now) {
        nextExecution.setMonth(nextExecution.getMonth() + 1)
        nextExecution.setDate(targetDay)
      }
      break

    case 'quarterly':
      nextExecution.setMonth(nextExecution.getMonth() + 3)
      if (schedule.dayOfMonth) {
        nextExecution.setDate(schedule.dayOfMonth)
      }
      break

    case 'yearly':
      nextExecution.setFullYear(nextExecution.getFullYear() + 1)
      if (schedule.dayOfMonth) {
        nextExecution.setDate(schedule.dayOfMonth)
      }
      break
  }

  return nextExecution
}

/**
 * Get day of week index (0-6, Sunday-Saturday)
 */
function getDayOfWeekIndex(day: DayOfWeek): number {
  const days: Record<DayOfWeek, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  }
  return days[day]
}

/**
 * Check if schedule should execute now
 */
export function shouldExecuteNow(
  schedule: ExportSchedule,
  lastExecutedAt?: string
): boolean {
  if (!schedule.isActive) return false

  const now = new Date()
  const [scheduleHours, scheduleMinutes] = (schedule.time || '09:00').split(':').map(Number)

  // Check if current time matches schedule time (within 5-minute window)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const scheduleMinutesOfDay = scheduleHours * 60 + scheduleMinutes

  if (Math.abs(currentMinutes - scheduleMinutesOfDay) > 5) {
    return false
  }

  // Check if already executed today/this cycle
  if (lastExecutedAt) {
    const lastExecution = new Date(lastExecutedAt)
    const daysSinceExecution = Math.floor(
      (now.getTime() - lastExecution.getTime()) / (1000 * 60 * 60 * 24)
    )

    switch (schedule.frequency) {
      case 'daily':
        return daysSinceExecution >= 1
      case 'weekly':
        return daysSinceExecution >= 7
      case 'biweekly':
        return daysSinceExecution >= 14
      case 'monthly':
        return daysSinceExecution >= 30
      case 'quarterly':
        return daysSinceExecution >= 90
      case 'yearly':
        return daysSinceExecution >= 365
      default:
        return false
    }
  }

  return true
}

/**
 * Format schedule frequency as human-readable string
 */
export function formatFrequency(frequency: ScheduleFrequency, dayOfWeek?: DayOfWeek, dayOfMonth?: number): string {
  switch (frequency) {
    case 'daily':
      return 'Daily'
    case 'weekly':
      return `Weekly on ${dayOfWeek ? capitalizeFirst(dayOfWeek) : 'Monday'}`
    case 'biweekly':
      return 'Every 2 weeks'
    case 'monthly':
      return `Monthly on day ${dayOfMonth || 1}`
    case 'quarterly':
      return 'Quarterly'
    case 'yearly':
      return 'Yearly'
    default:
      return frequency
  }
}

/**
 * Generate email subject from template
 */
export function generateEmailSubject(template: string, variables: Record<string, string>): string {
  let subject = template
  Object.entries(variables).forEach(([key, value]) => {
    subject = subject.replace(`{${key}}`, value)
  })
  return subject
}

/**
 * Generate email body from template
 */
export function generateEmailBody(template: string, variables: Record<string, string>): string {
  let body = template
  Object.entries(variables).forEach(([key, value]) => {
    body = body.replace(`{${key}}`, value)
  })
  return body
}

/**
 * Create default email template
 */
export function createDefaultEmailTemplate(frequency: ScheduleFrequency): EmailTemplate {
  const templates: Record<ScheduleFrequency, EmailTemplate> = {
    daily: {
      id: 'default-daily',
      name: 'Daily Export',
      subject: 'Daily User Directory Export - {export_date}',
      body: `
Hello,

Please find attached your daily user directory export for {export_date}.

Export Details:
- Total Records: {record_count}
- Format: {export_format}
- Generated At: {export_time}

Best regards,
Accounting Firm Team
      `.trim(),
      variables: ['export_date', 'record_count', 'export_format', 'export_time'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    weekly: {
      id: 'default-weekly',
      name: 'Weekly Export',
      subject: 'Weekly User Directory Export - Week of {export_date}',
      body: `
Hello,

Please find attached your weekly user directory export for the week of {export_date}.

Export Details:
- Total Records: {record_count}
- Format: {export_format}
- Generated At: {export_time}

Best regards,
Accounting Firm Team
      `.trim(),
      variables: ['export_date', 'record_count', 'export_format', 'export_time'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    biweekly: {
      id: 'default-biweekly',
      name: 'Biweekly Export',
      subject: 'Biweekly User Directory Export - {export_date}',
      body: `
Hello,

Please find attached your biweekly user directory export for {export_date}.

Export Details:
- Total Records: {record_count}
- Format: {export_format}
- Generated At: {export_time}

Best regards,
Accounting Firm Team
      `.trim(),
      variables: ['export_date', 'record_count', 'export_format', 'export_time'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    monthly: {
      id: 'default-monthly',
      name: 'Monthly Export',
      subject: 'Monthly User Directory Export - {export_month}',
      body: `
Hello,

Please find attached your monthly user directory export for {export_month}.

Export Details:
- Total Records: {record_count}
- Format: {export_format}
- Generated At: {export_time}

Monthly Statistics:
- Active Users: {active_count}
- Inactive Users: {inactive_count}
- Suspended Users: {suspended_count}

Best regards,
Accounting Firm Team
      `.trim(),
      variables: ['export_month', 'record_count', 'export_format', 'export_time', 'active_count', 'inactive_count', 'suspended_count'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    quarterly: {
      id: 'default-quarterly',
      name: 'Quarterly Export',
      subject: 'Quarterly User Directory Export - {export_quarter}',
      body: `
Hello,

Please find attached your quarterly user directory export for {export_quarter}.

Export Details:
- Total Records: {record_count}
- Format: {export_format}
- Generated At: {export_time}

Quarterly Summary:
- Total Users: {record_count}
- New Users This Quarter: {new_user_count}
- Active Users: {active_count}

Best regards,
Accounting Firm Team
      `.trim(),
      variables: ['export_quarter', 'record_count', 'export_format', 'export_time', 'new_user_count', 'active_count'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    yearly: {
      id: 'default-yearly',
      name: 'Yearly Export',
      subject: 'Annual User Directory Export - {export_year}',
      body: `
Hello,

Please find attached your annual user directory export for {export_year}.

Export Details:
- Total Records: {record_count}
- Format: {export_format}
- Generated At: {export_time}

Annual Summary:
- Total Users: {record_count}
- New Users: {new_user_count}
- Active Users: {active_count}
- Suspended Users: {suspended_count}

Best regards,
Accounting Firm Team
      `.trim(),
      variables: ['export_year', 'record_count', 'export_format', 'export_time', 'new_user_count', 'active_count', 'suspended_count'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  return templates[frequency] || templates.monthly
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Generate cron expression from schedule
 * Useful for server-side scheduling with node-cron or similar
 */
export function generateCronExpression(schedule: ExportSchedule): string {
  const [hours, minutes] = (schedule.time || '09:00').split(':')

  switch (schedule.frequency) {
    case 'daily':
      return `${minutes} ${hours} * * *` // minute hour * * *
    case 'weekly':
      const dayIndex = getDayOfWeekIndex(schedule.dayOfWeek || 'monday')
      return `${minutes} ${hours} * * ${dayIndex}`
    case 'biweekly':
      // Cron doesn't support biweekly directly, return monthly approximation
      return `${minutes} ${hours} 1,15 * *`
    case 'monthly':
      const dayOfMonth = schedule.dayOfMonth || 1
      return `${minutes} ${hours} ${dayOfMonth} * *`
    case 'quarterly':
      return `${minutes} ${hours} ${schedule.dayOfMonth || 1} 1,4,7,10 *`
    case 'yearly':
      return `${minutes} ${hours} ${schedule.dayOfMonth || 1} 1 *` // Always January
    default:
      return `${minutes} ${hours} * * *`
  }
}

/**
 * Calculate when schedule was last executed
 */
export function calculateLastExecutionTime(schedule: ExportSchedule, referenceDate?: Date): Date {
  const ref = referenceDate || new Date()
  const [hours, minutes] = (schedule.time || '09:00').split(':').map(Number)

  let lastExecution = new Date(ref)
  lastExecution.setHours(hours, minutes, 0, 0)

  // If execution time hasn't passed today yet, go back one cycle
  if (lastExecution > ref) {
    lastExecution.setDate(lastExecution.getDate() - 1)
  }

  switch (schedule.frequency) {
    case 'daily':
      break // Already set to today's execution time
    case 'weekly':
      const dayOfWeekIndex = getDayOfWeekIndex(schedule.dayOfWeek || 'monday')
      const currentDayIndex = lastExecution.getDay()
      let daysBack = currentDayIndex - dayOfWeekIndex

      if (daysBack < 0) {
        daysBack += 7
      }

      lastExecution.setDate(lastExecution.getDate() - daysBack)
      break
    case 'biweekly':
      lastExecution.setDate(lastExecution.getDate() - 14)
      break
    case 'monthly':
      const targetDay = schedule.dayOfMonth || 1
      if (lastExecution.getDate() < targetDay) {
        lastExecution.setMonth(lastExecution.getMonth() - 1)
      }
      lastExecution.setDate(targetDay)
      break
    case 'quarterly':
      lastExecution.setMonth(lastExecution.getMonth() - 3)
      if (schedule.dayOfMonth) {
        lastExecution.setDate(schedule.dayOfMonth)
      }
      break
    case 'yearly':
      lastExecution.setFullYear(lastExecution.getFullYear() - 1)
      if (schedule.dayOfMonth) {
        lastExecution.setDate(schedule.dayOfMonth)
      }
      break
  }

  return lastExecution
}
