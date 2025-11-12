/**
 * Report Builder Types and Interfaces
 */

export type ReportFormat = 'table' | 'grid' | 'pivot' | 'chart'
export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter'
export type AggregationType = 'sum' | 'count' | 'average' | 'min' | 'max' | 'distinct'
export type SortDirection = 'asc' | 'desc'

export interface ReportColumn {
  name: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  visible: boolean
  width?: number
  sortable?: boolean
  aggregatable?: boolean
}

export interface ReportGrouping {
  column: string
  order: number
  showSubtotals?: boolean
  subtotalFields?: string[]
}

export interface ReportSorting {
  column: string
  direction: SortDirection
  order: number
}

export interface ReportFilter {
  column: string
  operator: 'equals' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'between'
  value: any
}

export interface ReportCalculation {
  name: string
  type: AggregationType
  column: string
  label?: string
  formatAs?: 'number' | 'percentage' | 'currency'
}

export interface ReportSection {
  id: string
  title: string
  type: 'summary' | 'details' | 'chart' | 'table'
  order: number
  columns?: ReportColumn[]
  grouping?: ReportGrouping[]
  sorting?: ReportSorting[]
  filters?: ReportFilter[]
  calculations?: ReportCalculation[]
  chartConfig?: ChartConfig
  showPageBreak?: boolean
}

export interface ChartConfig {
  type: ChartType
  xAxis?: string
  yAxis?: string
  series?: string[]
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
  responsive?: boolean
}

export interface ReportTemplate {
  id: string
  name: string
  description?: string
  category?: string
  icon?: string
  sections: ReportSection[]
  isPublic: boolean
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface Report {
  id: string
  tenantId: string
  userId: string
  name: string
  description?: string
  template?: ReportTemplate
  sections: ReportSection[]
  format?: ReportFormat
  pageSize?: 'A4' | 'Letter' | 'Tabloid'
  orientation?: 'portrait' | 'landscape'
  includeHeader?: boolean
  includeFooter?: boolean
  headerText?: string
  footerText?: string
  createdAt: string
  updatedAt: string
  lastGeneratedAt?: string
  generationCount?: number
}

export interface ReportExecution {
  id: string
  reportId: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  filePath?: string
  fileSizeBytes?: number
  generationTimeMs?: number
  errorMessage?: string
  executedAt: string
  completedAt?: string
}

export interface ReportData {
  columns: ReportColumn[]
  rows: any[]
  summary?: Record<string, any>
  pageCount?: number
  rowCount: number
}

export interface GenerateReportRequest {
  reportId: string
  format?: 'pdf' | 'xlsx' | 'csv' | 'json'
  filters?: ReportFilter[]
  includeMetadata?: boolean
}

export interface GenerateReportResponse {
  success: boolean
  executionId?: string
  data?: ReportData
  downloadUrl?: string
  error?: string
  estimatedSize?: number
}

/**
 * Pre-built Report Templates
 */
export const DEFAULT_REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  active_users: {
    id: 'active-users',
    name: 'Active Users Report',
    description: 'Summary of all active users in the organization',
    category: 'Users',
    icon: 'Users',
    sections: [
      {
        id: 'summary-active',
        title: 'Active Users Summary',
        type: 'summary',
        order: 1,
        calculations: [
          { name: 'total_active', type: 'count', column: 'id', label: 'Total Active Users' },
          { name: 'by_role', type: 'count', column: 'role', label: 'Users by Role' },
          { name: 'by_dept', type: 'count', column: 'department', label: 'Users by Department' }
        ]
      },
      {
        id: 'details-active',
        title: 'Active Users Detail',
        type: 'table',
        order: 2,
        columns: [
          { name: 'name', label: 'Name', type: 'string', visible: true, sortable: true },
          { name: 'email', label: 'Email', type: 'string', visible: true },
          { name: 'department', label: 'Department', type: 'string', visible: true },
          { name: 'role', label: 'Role', type: 'string', visible: true },
          { name: 'createdAt', label: 'Joined', type: 'date', visible: true }
        ],
        filters: [{ column: 'status', operator: 'equals', value: 'ACTIVE' }],
        sorting: [{ column: 'name', direction: 'asc', order: 1 }]
      }
    ],
    isPublic: true
  },
  department_overview: {
    id: 'department-overview',
    name: 'Department Overview',
    description: 'User distribution across departments',
    category: 'Organization',
    icon: 'Building',
    sections: [
      {
        id: 'dept-summary',
        title: 'Department Statistics',
        type: 'summary',
        order: 1,
        calculations: [
          { name: 'total_users', type: 'count', column: 'id', label: 'Total Users' },
          { name: 'dept_count', type: 'distinct', column: 'department', label: 'Departments' }
        ]
      },
      {
        id: 'dept-chart',
        title: 'Users by Department',
        type: 'chart',
        order: 2,
        chartConfig: {
          type: 'bar',
          xAxis: 'department',
          yAxis: 'count',
          showLegend: true,
          responsive: true
        }
      },
      {
        id: 'dept-details',
        title: 'Department Details',
        type: 'table',
        order: 3,
        columns: [
          { name: 'department', label: 'Department', type: 'string', visible: true, sortable: true },
          { name: 'role', label: 'Role', type: 'string', visible: true },
          { name: 'count', label: 'Count', type: 'number', visible: true, aggregatable: true }
        ],
        grouping: [{ column: 'department', order: 1, showSubtotals: true }]
      }
    ],
    isPublic: true
  },
  role_analysis: {
    id: 'role-analysis',
    name: 'Role Analysis Report',
    description: 'Detailed analysis of users by role and status',
    category: 'Users',
    icon: 'Shield',
    sections: [
      {
        id: 'role-summary',
        title: 'Role Statistics',
        type: 'summary',
        order: 1,
        calculations: [
          { name: 'total_admins', type: 'count', column: 'id', label: 'Administrators' },
          { name: 'total_leads', type: 'count', column: 'id', label: 'Team Leads' },
          { name: 'total_members', type: 'count', column: 'id', label: 'Team Members' }
        ]
      },
      {
        id: 'role-chart',
        title: 'Role Distribution (Pie Chart)',
        type: 'chart',
        order: 2,
        chartConfig: {
          type: 'pie',
          series: ['admin', 'team_lead', 'team_member'],
          showLegend: true
        }
      },
      {
        id: 'role-status-table',
        title: 'Role by Status',
        type: 'table',
        order: 3,
        columns: [
          { name: 'role', label: 'Role', type: 'string', visible: true },
          { name: 'status', label: 'Status', type: 'string', visible: true },
          { name: 'count', label: 'Count', type: 'number', visible: true },
          { name: 'percentage', label: 'Percentage', type: 'string', visible: true }
        ],
        grouping: [{ column: 'role', order: 1 }, { column: 'status', order: 2 }]
      }
    ],
    isPublic: true
  }
}

/**
 * Column options for user directory report
 */
export const AVAILABLE_COLUMNS: ReportColumn[] = [
  { name: 'id', label: 'User ID', type: 'string', visible: false, sortable: true },
  { name: 'name', label: 'Full Name', type: 'string', visible: true, sortable: true },
  { name: 'email', label: 'Email Address', type: 'string', visible: true, sortable: true },
  { name: 'phone', label: 'Phone Number', type: 'string', visible: false, sortable: true },
  { name: 'role', label: 'Role', type: 'string', visible: true, sortable: true, aggregatable: true },
  { name: 'status', label: 'Status', type: 'string', visible: true, sortable: true, aggregatable: true },
  { name: 'department', label: 'Department', type: 'string', visible: true, sortable: true, aggregatable: true },
  { name: 'position', label: 'Position', type: 'string', visible: false, sortable: true },
  { name: 'createdAt', label: 'Created Date', type: 'date', visible: true, sortable: true },
  { name: 'lastLoginAt', label: 'Last Login', type: 'date', visible: false, sortable: true }
]

/**
 * Report configuration presets
 */
export const REPORT_PRESETS = {
  minimal: {
    name: 'Minimal Report',
    sections: [
      {
        id: 'min-table',
        title: 'Users',
        type: 'table',
        order: 1,
        columns: [
          { name: 'name', label: 'Name', type: 'string', visible: true },
          { name: 'email', label: 'Email', type: 'string', visible: true },
          { name: 'role', label: 'Role', type: 'string', visible: true }
        ]
      }
    ]
  },
  detailed: {
    name: 'Detailed Report',
    sections: [
      {
        id: 'detail-summary',
        title: 'Summary',
        type: 'summary',
        order: 1,
        calculations: [
          { name: 'total', type: 'count', column: 'id', label: 'Total Users' }
        ]
      },
      {
        id: 'detail-table',
        title: 'All Users',
        type: 'table',
        order: 2,
        columns: AVAILABLE_COLUMNS
      }
    ]
  }
}
