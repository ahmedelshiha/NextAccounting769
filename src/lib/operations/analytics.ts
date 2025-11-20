import { z } from 'zod'

/**
 * Operations Analytics Service
 * Provides dashboards, alerts, and scheduled exports for business metrics
 */

export const MetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  timestamp: z.date(),
  tags: z.record(z.string(), z.any()).optional(),
})

export const DashboardSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  widgets: z.array(z.object({
    id: z.string(),
    type: z.enum(['KPI', 'CHART', 'TABLE', 'TIMELINE', 'GAUGE']),
    metric: z.string(),
    title: z.string(),
    config: z.record(z.string(), z.any()).optional(),
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const SLASchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  serviceType: z.string(),
  metrics: z.array(z.object({
    name: z.string(),
    target: z.number(),
    unit: z.string(),
    period: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']),
  })),
  alertThresholds: z.object({
    warning: z.number(),
    critical: z.number(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const ReportScheduleSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  recipients: z.array(z.string().email()),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'EMAIL_DIGEST']),
  metrics: z.array(z.string()),
  lastRunAt: z.date().optional(),
  nextRunAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Metric = z.infer<typeof MetricSchema>
export type Dashboard = z.infer<typeof DashboardSchema>
export type SLA = z.infer<typeof SLASchema>
export type ReportSchedule = z.infer<typeof ReportScheduleSchema>

/**
 * Key Performance Indicators (KPIs) for different entities
 */
export const KPI_DEFINITIONS = {
  ENTITY_SETUP: {
    completed: 'Entities with complete setup',
    pending_verification: 'Entities pending verification',
    avg_setup_time_days: 'Average days to complete entity setup',
    verification_success_rate: 'Percentage of entities successfully verified',
  },
  COMPLIANCE: {
    upcoming_filings: 'Filings due within 30 days',
    overdue_filings: 'Filings past due date',
    filing_accuracy_rate: 'Percentage of filings accepted on first submission',
    avg_filing_time_hours: 'Average hours to prepare filing',
  },
  INVOICING: {
    total_invoiced: 'Total amount invoiced (currency)',
    paid_invoices: 'Number of paid invoices',
    outstanding_balance: 'Total unpaid invoice amount',
    payment_collection_rate: 'Percentage of invoices paid',
    avg_days_to_payment: 'Average days from invoice to payment',
  },
  SUPPORT: {
    total_tickets: 'Total support tickets',
    open_tickets: 'Currently open tickets',
    avg_resolution_time_hours: 'Average hours to resolve ticket',
    customer_satisfaction: 'Average customer satisfaction rating (1-5)',
    first_response_time_minutes: 'Average minutes to first response',
  },
  TEAM: {
    total_users: 'Total registered users',
    active_users: 'Users active in last 30 days',
    role_distribution: 'Breakdown of users by role',
    avg_session_duration_minutes: 'Average session duration',
  },
}

/**
 * Calculates entity setup KPIs
 */
export function calculateEntitySetupKPIs(stats: {
  total: number
  completed: number
  pending: number
  verified: number
  failed: number
  avgSetupDays: number
}): Record<string, number | string> {
  return {
    total_entities: stats.total,
    completed_setup: stats.completed,
    pending_verification: stats.pending,
    verified_entities: stats.verified,
    failed_setups: stats.failed,
    completion_rate: Math.round((stats.completed / stats.total) * 100),
    verification_success_rate: Math.round((stats.verified / stats.completed) * 100),
    avg_setup_time_days: Math.round(stats.avgSetupDays * 10) / 10,
  }
}

/**
 * Calculates compliance filing KPIs
 */
export function calculateComplianceKPIs(stats: {
  totalObligations: number
  upcoming30Days: number
  overdue: number
  accepted: number
  rejected: number
  avgPreparationHours: number
}): Record<string, number | string> {
  const total = stats.accepted + stats.rejected
  return {
    total_obligations: stats.totalObligations,
    upcoming_30_days: stats.upcoming30Days,
    overdue_filings: stats.overdue,
    accepted_filings: stats.accepted,
    rejected_filings: stats.rejected,
    filing_accuracy_rate: total > 0 ? Math.round((stats.accepted / total) * 100) : 0,
    avg_preparation_hours: Math.round(stats.avgPreparationHours * 10) / 10,
    on_time_rate: Math.round(((stats.totalObligations - stats.overdue) / stats.totalObligations) * 100),
  }
}

/**
 * Calculates invoicing KPIs
 */
export function calculateInvoicingKPIs(stats: {
  totalInvoiced: number
  totalPaid: number
  paidCount: number
  totalCount: number
  avgDaysToPayment: number
  currency: string
}): Record<string, any> {
  return {
    total_invoiced: `${stats.currency} ${stats.totalInvoiced.toFixed(2)}`,
    total_paid: `${stats.currency} ${stats.totalPaid.toFixed(2)}`,
    paid_invoices: stats.paidCount,
    total_invoices: stats.totalCount,
    outstanding_balance: `${stats.currency} ${(stats.totalInvoiced - stats.totalPaid).toFixed(2)}`,
    payment_collection_rate: Math.round((stats.paidCount / stats.totalCount) * 100),
    avg_days_to_payment: Math.round(stats.avgDaysToPayment),
  }
}

/**
 * Evaluates SLA compliance
 */
export function evaluateSLACompliance(
  sla: Partial<SLA>,
  actualMetrics: Record<string, number>
): {
  compliant: boolean
  breaches: Array<{ metric: string; target: number; actual: number; variance: number }>
  status: 'COMPLIANT' | 'WARNING' | 'BREACHED'
} {
  const breaches: Array<{ metric: string; target: number; actual: number; variance: number }> = []

  if (!sla.metrics) {
    return { compliant: true, breaches: [], status: 'COMPLIANT' }
  }

  for (const metric of sla.metrics) {
    const actual = actualMetrics[metric.name]
    if (actual !== undefined && actual > metric.target) {
      breaches.push({
        metric: metric.name,
        target: metric.target,
        actual,
        variance: actual - metric.target,
      })
    }
  }

  const status = breaches.length === 0
    ? 'COMPLIANT'
    : breaches.some(b => b.variance > (sla.alertThresholds?.critical || 0))
      ? 'BREACHED'
      : 'WARNING'

  return {
    compliant: status === 'COMPLIANT',
    breaches,
    status,
  }
}

/**
 * Generates metrics for dashboard display
 */
export function generateMetricsSummary(
  periodKPIs: Record<string, number | string>,
  previousPeriodKPIs?: Record<string, number | string>
): Array<{
  name: string
  value: number | string
  change?: number
  changePercent?: number
  trend: 'UP' | 'DOWN' | 'STABLE'
}> {
  return Object.entries(periodKPIs).map(([name, value]) => {
    const summary: any = { name, value }

    if (previousPeriodKPIs && previousPeriodKPIs[name]) {
      const prev = typeof previousPeriodKPIs[name] === 'number' 
        ? previousPeriodKPIs[name] 
        : 0
      const curr = typeof value === 'number' ? value : 0
      const change = curr - (prev as number)
      const changePercent = prev !== 0 
        ? Math.round((change / (prev as number)) * 100) 
        : 0

      summary.change = change
      summary.changePercent = changePercent
      summary.trend = change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE'
    } else {
      summary.trend = 'STABLE'
    }

    return summary
  })
}

/**
 * Detects anomalies in metrics
 */
export function detectMetricAnomalies(
  currentValue: number,
  historicalValues: number[],
  sensitivity: number = 2 // standard deviations
): {
  isAnomaly: boolean
  zscore: number
  expectedRange: [number, number]
} {
  if (historicalValues.length < 3) {
    return {
      isAnomaly: false,
      zscore: 0,
      expectedRange: [0, 0],
    }
  }

  const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length
  const variance = historicalValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / historicalValues.length
  const stdDev = Math.sqrt(variance)
  const zscore = (currentValue - mean) / stdDev

  return {
    isAnomaly: Math.abs(zscore) > sensitivity,
    zscore,
    expectedRange: [mean - (sensitivity * stdDev), mean + (sensitivity * stdDev)],
  }
}

/**
 * Generates alert based on metric threshold
 */
export function generateMetricAlert(
  metricName: string,
  value: number,
  threshold: { warning: number; critical: number },
  unit: string
): {
  alert: boolean
  level: 'WARNING' | 'CRITICAL' | null
  message: string
} {
  if (value >= threshold.critical) {
    return {
      alert: true,
      level: 'CRITICAL',
      message: `Critical: ${metricName} is ${value} ${unit} (threshold: ${threshold.critical})`,
    }
  }

  if (value >= threshold.warning) {
    return {
      alert: true,
      level: 'WARNING',
      message: `Warning: ${metricName} is ${value} ${unit} (threshold: ${threshold.warning})`,
    }
  }

  return { alert: false, level: null, message: '' }
}
