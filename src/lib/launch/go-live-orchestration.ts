import { z } from 'zod'

/**
 * Go-Live Orchestration Service
 * Manages canary deployments, feature flags, support playbooks, and customer satisfaction tracking
 */

export const CanaryDeploymentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  featureName: z.string(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ROLLING_OUT', 'COMPLETED', 'ROLLED_BACK']),
  rolloutPercentage: z.number().min(0).max(100),
  targetPercentage: z.number().min(0).max(100),
  startDate: z.date(),
  scheduledRolloutStages: z.array(z.object({
    percentage: z.number(),
    targetDate: z.date(),
    minSuccessRate: z.number(),
    maxErrorRate: z.number(),
  })),
  currentMetrics: z.object({
    successRate: z.number(),
    errorRate: z.number(),
    latencyP50Ms: z.number(),
    latencyP95Ms: z.number(),
    latencyP99Ms: z.number(),
    usersAffected: z.number(),
  }).optional(),
  killSwitchEnabled: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const SupportPlaybookSchema = z.object({
  id: z.string(),
  scenarioType: z.enum([
    'DATA_LOSS',
    'SERVICE_OUTAGE',
    'PERFORMANCE_DEGRADATION',
    'SECURITY_INCIDENT',
    'DATA_CORRUPTION',
    'USER_LOCKED_OUT',
  ]),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']),
  detectionRules: z.array(z.object({
    metric: z.string(),
    condition: z.string(),
    threshold: z.number(),
  })),
  escalationPath: z.array(z.object({
    timeMinutes: z.number(),
    escalateTo: z.string(),
    action: z.string(),
  })),
  mitigationSteps: z.array(z.string()),
  rollbackSteps: z.array(z.string()),
  communicationTemplate: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CustomerFeedbackSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  feedbackType: z.enum(['NPS', 'CSAT', 'CES', 'FEATURE_REQUEST', 'BUG_REPORT']),
  score: z.number().min(0).max(10).optional(),
  comment: z.string(),
  category: z.string().optional(),
  sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).optional(),
  followUpRequired: z.boolean().default(false),
  createdAt: z.date(),
  resolvedAt: z.date().optional(),
})

export const GoLivePlanSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  launchDate: z.date(),
  phase: z.enum(['PLANNING', 'PREPARATION', 'LAUNCH_DAY', 'POST_LAUNCH', 'STABILIZATION']),
  features: z.array(z.object({
    id: z.string(),
    name: z.string(),
    readiness: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'TESTING', 'READY']),
    dependencies: z.array(z.string()),
  })),
  risks: z.array(z.object({
    id: z.string(),
    description: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    mitigation: z.string(),
  })),
  successCriteria: z.array(z.object({
    metric: z.string(),
    target: z.number(),
    unit: z.string(),
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type CanaryDeployment = z.infer<typeof CanaryDeploymentSchema>
export type SupportPlaybook = z.infer<typeof SupportPlaybookSchema>
export type CustomerFeedback = z.infer<typeof CustomerFeedbackSchema>
export type GoLivePlan = z.infer<typeof GoLivePlanSchema>

/**
 * Default rollout stages for canary deployments
 */
export const DEFAULT_CANARY_STAGES = [
  {
    percentage: 5,
    targetDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // +1 day
    minSuccessRate: 0.99,
    maxErrorRate: 0.001,
  },
  {
    percentage: 25,
    targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
    minSuccessRate: 0.999,
    maxErrorRate: 0.0005,
  },
  {
    percentage: 50,
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
    minSuccessRate: 0.9995,
    maxErrorRate: 0.0001,
  },
  {
    percentage: 100,
    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
    minSuccessRate: 0.9999,
    maxErrorRate: 0.00001,
  },
]

/**
 * Creates a canary deployment plan
 */
export function createCanaryDeployment(
  tenantId: string,
  featureName: string,
  description?: string
): CanaryDeployment {
  return {
    id: Math.random().toString(36).substr(2, 9),
    tenantId,
    featureName,
    description,
    status: 'PLANNING',
    rolloutPercentage: 0,
    targetPercentage: 100,
    startDate: new Date(),
    scheduledRolloutStages: DEFAULT_CANARY_STAGES,
    killSwitchEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Determines next canary rollout stage
 */
export function getNextCanaryStage(
  deployment: Partial<CanaryDeployment>
): CanaryDeployment['scheduledRolloutStages'][0] | null {
  if (!deployment.scheduledRolloutStages) {
    return null
  }

  const now = new Date()
  for (const stage of deployment.scheduledRolloutStages) {
    if (now >= stage.targetDate && deployment.rolloutPercentage! < stage.percentage) {
      return stage
    }
  }

  return null
}

/**
 * Evaluates readiness for rollout
 */
export function evaluateRolloutReadiness(
  deployment: Partial<CanaryDeployment>,
  metrics: Partial<CanaryDeployment['currentMetrics']>
): {
  ready: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []

  if (!metrics) {
    return {
      ready: false,
      issues: ['No metrics available'],
      recommendations: ['Wait for metrics to be collected'],
    }
  }

  const currentStage = getNextCanaryStage(deployment)
  if (!currentStage) {
    return {
      ready: false,
      issues: ['No rollout stages defined'],
      recommendations: [],
    }
  }

  // Check success rate
  if (metrics.successRate && metrics.successRate < currentStage.minSuccessRate) {
    issues.push(`Success rate ${metrics.successRate} is below minimum ${currentStage.minSuccessRate}`)
    recommendations.push('Investigate and fix failures before proceeding')
  }

  // Check error rate
  if (metrics.errorRate && metrics.errorRate > currentStage.maxErrorRate) {
    issues.push(`Error rate ${metrics.errorRate} exceeds maximum ${currentStage.maxErrorRate}`)
    recommendations.push('Analyze error logs and roll back if necessary')
  }

  // Check latency (p95 should not increase significantly)
  if (metrics.latencyP95Ms && metrics.latencyP95Ms > 2000) {
    issues.push(`P95 latency ${metrics.latencyP95Ms}ms is high`)
    recommendations.push('Profile application and optimize performance')
  }

  return {
    ready: issues.length === 0,
    issues,
    recommendations,
  }
}

/**
 * Creates support playbook for common issues
 */
export function createSupportPlaybook(
  scenarioType: 'DATA_LOSS' | 'SERVICE_OUTAGE' | 'PERFORMANCE_DEGRADATION',
  priority: 'P1' | 'P2' | 'P3'
): SupportPlaybook {
  const playbooks: Record<string, Partial<SupportPlaybook>> = {
    DATA_LOSS: {
      detectionRules: [
        { metric: 'row_count_mismatch', condition: 'gt', threshold: 100 },
        { metric: 'data_integrity_check', condition: 'lt', threshold: 0.99 },
      ],
      escalationPath: [
        { timeMinutes: 5, escalateTo: 'on_call_dba', action: 'Start database investigation' },
        { timeMinutes: 15, escalateTo: 'engineering_lead', action: 'Prepare rollback procedure' },
      ],
      mitigationSteps: [
        'Stop all write operations immediately',
        'Create backup of current database state',
        'Begin restore from last known good backup',
        'Verify data integrity post-restore',
        'Resume operations in read-only mode',
      ],
      rollbackSteps: [
        'Restore database from backup',
        'Clear application cache',
        'Verify data consistency',
        'Re-enable write operations',
      ],
    },
    SERVICE_OUTAGE: {
      detectionRules: [
        { metric: 'http_5xx_rate', condition: 'gt', threshold: 0.05 },
        { metric: 'health_check_failures', condition: 'gt', threshold: 3 },
      ],
      escalationPath: [
        { timeMinutes: 2, escalateTo: 'ops_team', action: 'Assess service status' },
        { timeMinutes: 5, escalateTo: 'incident_commander', action: 'Open incident' },
      ],
      mitigationSteps: [
        'Check system health dashboard',
        'Review recent deployments',
        'Check infrastructure capacity',
        'Restart affected services',
        'Monitor error logs',
      ],
      rollbackSteps: [
        'Identify problematic deployment',
        'Execute rollback procedure',
        'Verify service recovery',
      ],
    },
    PERFORMANCE_DEGRADATION: {
      detectionRules: [
        { metric: 'api_latency_p95', condition: 'gt', threshold: 2000 },
        { metric: 'database_query_time', condition: 'gt', threshold: 1000 },
      ],
      escalationPath: [
        { timeMinutes: 10, escalateTo: 'performance_team', action: 'Profile application' },
        { timeMinutes: 30, escalateTo: 'engineering_lead', action: 'Prepare hot fix' },
      ],
      mitigationSteps: [
        'Enable detailed query logging',
        'Identify slow queries',
        'Check for missing indexes',
        'Review cache hit rates',
        'Scale resources if needed',
      ],
      rollbackSteps: [
        'Revert recent changes',
        'Clear caches',
        'Rebuild indexes if needed',
      ],
    },
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    scenarioType: scenarioType as any,
    priority: priority as any,
    ...playbooks[scenarioType],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SupportPlaybook
}

/**
 * Analyzes customer feedback sentiment and trends
 */
export function analyzeFeedbackTrends(
  feedback: Partial<CustomerFeedback>[]
): {
  averageNPS: number
  averageCSAT: number
  sentimentBreakdown: Record<string, number>
  topThemes: Array<{ theme: string; frequency: number }>
  recommendations: string[]
} {
  const scores = feedback
    .filter(f => f.feedbackType === 'NPS')
    .map(f => f.score || 0)

  const sentiments = feedback.map(f => f.sentiment || 'NEUTRAL')
  const sentimentCount: Record<string, number> = {
    POSITIVE: sentiments.filter(s => s === 'POSITIVE').length,
    NEUTRAL: sentiments.filter(s => s === 'NEUTRAL').length,
    NEGATIVE: sentiments.filter(s => s === 'NEGATIVE').length,
  }

  const recommendations: string[] = []

  if (sentimentCount.NEGATIVE > sentimentCount.POSITIVE) {
    recommendations.push('Negative sentiment exceeds positive - investigate user issues')
  }

  if (scores.length > 0) {
    const avgNPS = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    if (avgNPS < 30) {
      recommendations.push('NPS is critically low - conduct user interviews')
    } else if (avgNPS < 50) {
      recommendations.push('NPS is below industry standard - prioritize improvements')
    }
  }

  return {
    averageNPS: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
    averageCSAT: 0, // Calculate if CSAT feedback exists
    sentimentBreakdown: sentimentCount,
    topThemes: [], // Would aggregate from feedback comments
    recommendations,
  }
}

/**
 * Generates launch checklist
 */
export function generateLaunchChecklist(
  plan: Partial<GoLivePlan>
): Array<{
  category: string
  items: Array<{ id: string; description: string; responsible: string; completed: boolean }>
}> {
  return [
    {
      category: 'Technical Readiness',
      items: [
        { id: 't1', description: 'All feature tests passing', responsible: 'QA', completed: false },
        { id: 't2', description: 'Performance benchmarks met', responsible: 'Performance Team', completed: false },
        { id: 't3', description: 'Database migration tested', responsible: 'DBAs', completed: false },
        { id: 't4', description: 'Backup and recovery procedures verified', responsible: 'Operations', completed: false },
      ],
    },
    {
      category: 'Communication',
      items: [
        { id: 'c1', description: 'Customer notifications sent', responsible: 'Marketing', completed: false },
        { id: 'c2', description: 'Support team trained', responsible: 'Training', completed: false },
        { id: 'c3', description: 'Documentation updated', responsible: 'Documentation', completed: false },
        { id: 'c4', description: 'Known issues documented', responsible: 'Product', completed: false },
      ],
    },
    {
      category: 'Operations',
      items: [
        { id: 'o1', description: 'Incident response team on standby', responsible: 'Operations', completed: false },
        { id: 'o2', description: 'Monitoring and alerts configured', responsible: 'Operations', completed: false },
        { id: 'o3', description: 'Support tickets queuing system ready', responsible: 'Support', completed: false },
        { id: 'o4', description: 'Escalation procedures communicated', responsible: 'Management', completed: false },
      ],
    },
  ]
}

/**
 * Schedules post-launch monitoring tasks
 */
export function schedulePostLaunchMonitoring(
  launchDate: Date
): Array<{
  timeAfterLaunch: string
  task: string
  owner: string
  critical: boolean
}> {
  return [
    { timeAfterLaunch: '15 minutes', task: 'Check system health dashboard', owner: 'Ops', critical: true },
    { timeAfterLaunch: '1 hour', task: 'Review error logs for anomalies', owner: 'Engineering', critical: true },
    { timeAfterLaunch: '4 hours', task: 'Check customer satisfaction feedback', owner: 'Product', critical: false },
    { timeAfterLaunch: '24 hours', task: 'Full system audit', owner: 'QA', critical: true },
    { timeAfterLaunch: '7 days', task: 'Performance analysis and optimization', owner: 'Performance', critical: false },
    { timeAfterLaunch: '30 days', task: 'Post-launch retrospective', owner: 'Product', critical: false },
  ]
}
