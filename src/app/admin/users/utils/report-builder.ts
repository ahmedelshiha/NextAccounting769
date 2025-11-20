import {
  Report,
  ReportSection,
  ReportTemplate,
  ReportData,
  ReportFilter,
  ReportGrouping,
  ReportSorting,
  ReportCalculation,
  AggregationType,
  AVAILABLE_COLUMNS
} from '../types/report-builder'

/**
 * Escape HTML special characters
 */
function escapeHTMLChars(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Generate report HTML from report definition and data
 */
export function generateReportHTML(
  report: Report,
  data: ReportData,
  includeStyles = true
): string {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHTMLChars(report.name)}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @page {
          size: ${report.pageSize === 'Letter' ? 'letter' : 'A4'} ${report.orientation || 'portrait'};
          margin: 15mm;
        }

        @media print {
          body {
            background: white;
          }
          .page-break {
            page-break-after: always;
          }
          .no-break {
            page-break-inside: avoid;
          }
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #333;
          background: white;
        }

        .report-header {
          border-bottom: 2px solid #1e40af;
          padding-bottom: 15px;
          margin-bottom: 20px;
          text-align: center;
        }

        .report-title {
          font-size: 20px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 5px;
        }

        .report-description {
          font-size: 12px;
          color: #666;
          margin-bottom: 10px;
        }

        .report-metadata {
          font-size: 9px;
          color: #999;
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .report-section {
          margin-bottom: 25px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e40af;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        .section-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 15px;
        }

        .summary-item {
          border: 1px solid #e5e7eb;
          padding: 12px;
          background: #f9fafb;
          border-radius: 4px;
        }

        .summary-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .summary-value {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          background: white;
        }

        thead {
          background-color: #f3f4f6;
          border-bottom: 2px solid #1e40af;
        }

        th {
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          color: #1e40af;
          border: 1px solid #e5e7eb;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        td {
          padding: 8px;
          border: 1px solid #e5e7eb;
          font-size: 10px;
        }

        tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }

        tbody tr:hover {
          background-color: #f3f4f6;
        }

        .group-header {
          background-color: #e0e7ff;
          font-weight: 600;
          padding: 10px 8px;
          border-left: 3px solid #1e40af;
        }

        .group-subtotal {
          background-color: #f0f4ff;
          font-weight: 500;
          font-style: italic;
        }

        .report-footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          font-size: 9px;
          color: #999;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-left {
          flex: 1;
        }

        .footer-right {
          text-align: right;
          flex: 1;
        }

        .page-number {
          text-align: center;
          font-size: 9px;
          color: #999;
          margin-top: 10px;
        }

        .chart-container {
          text-align: center;
          margin: 20px 0;
          padding: 15px;
          background: #f9fafb;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .chart-title {
          font-weight: 600;
          margin-bottom: 10px;
          font-size: 11px;
        }

        .chart-placeholder {
          font-size: 10px;
          color: #999;
          padding: 20px;
          background: white;
          border: 1px dashed #e5e7eb;
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      ${report.includeHeader ? generateReportHeader(report) : ''}

      <div class="report-content">
        ${report.sections.map((section, index) => generateSectionHTML(section, data, index)).join('')}
      </div>

      ${report.includeFooter ? generateReportFooter(report) : ''}

      <div class="page-number">Generated on ${new Date().toLocaleDateString()}</div>
    </body>
    </html>
  `

  return html
}

/**
 * Generate report header
 */
function generateReportHeader(report: Report): string {
  return `
    <div class="report-header">
      <div class="report-title">${escapeHTMLChars(report.name)}</div>
      ${report.description ? `<div class="report-description">${escapeHTMLChars(report.description)}</div>` : ''}
      <div class="report-metadata">
        <span>Generated: ${new Date().toLocaleDateString()}</span>
        <span>${report.headerText || 'User Directory Report'}</span>
      </div>
    </div>
  `
}

/**
 * Generate report footer
 */
function generateReportFooter(report: Report): string {
  return `
    <div class="report-footer">
      <div class="footer-left">${report.footerText || '© 2024 Accounting Firm. All rights reserved.'}</div>
      <div class="footer-right">Page <span class="page-number">1</span></div>
    </div>
  `
}

/**
 * Generate HTML for a report section
 */
function generateSectionHTML(section: ReportSection, data: ReportData, index: number): string {
  let html = `<div class="report-section ${section.showPageBreak ? 'page-break' : ''}">`
  html += `<h2 class="section-title">${escapeHTMLChars(section.title)}</h2>`

  switch (section.type) {
    case 'summary':
      html += generateSummarySectionHTML(section, data)
      break
    case 'details':
    case 'table':
      html += generateTableSectionHTML(section, data)
      break
    case 'chart':
      html += generateChartSectionHTML(section, data)
      break
  }

  html += '</div>'
  return html
}

/**
 * Generate summary section HTML
 */
function generateSummarySectionHTML(section: ReportSection, data: ReportData): string {
  if (!section.calculations || section.calculations.length === 0) {
    return ''
  }

  const summary = data.summary || {}

  return `
    <div class="section-summary">
      ${section.calculations
        .map(
          calc => `
        <div class="summary-item no-break">
          <div class="summary-label">${escapeHTMLChars(calc.label || calc.name)}</div>
          <div class="summary-value">${formatSummaryValue(summary[calc.name])}</div>
        </div>
      `
        )
        .join('')}
    </div>
  `
}

/**
 * Generate table section HTML
 */
function generateTableSectionHTML(section: ReportSection, data: ReportData): string {
  const visibleColumns = section.columns?.filter(c => c.visible) || []
  const hasGrouping = section.grouping && section.grouping.length > 0

  if (visibleColumns.length === 0 || data.rows.length === 0) {
    return '<p style="color: #999; font-size: 10px;">No data to display</p>'
  }

  let html = '<table><thead><tr>'

  visibleColumns.forEach(col => {
    html += `<th>${escapeHTMLChars(col.label)}</th>`
  })

  html += '</tr></thead><tbody>'

  if (hasGrouping) {
    html += generateGroupedTableRows(section, data.rows, visibleColumns, section.grouping!)
  } else {
    data.rows.forEach(row => {
      html += '<tr>'
      visibleColumns.forEach(col => {
        const value = row[col.name] || ''
        html += `<td>${escapeHTMLChars(formatTableValue(value, col.type))}</td>`
      })
      html += '</tr>'
    })
  }

  html += '</tbody></table>'
  return html
}

/**
 * Generate grouped table rows
 */
function generateGroupedTableRows(
  section: ReportSection,
  rows: any[],
  columns: any[],
  grouping: ReportGrouping[]
): string {
  let html = ''
  const groupKey = grouping[0].column

  const groupedData = rows.reduce(
    (acc, row) => {
      const key = row[groupKey]
      if (!acc[key]) acc[key] = []
      acc[key].push(row)
      return acc
    },
    {} as Record<string, any[]>
  )

  const entries: Array<[string, any[]]> = Object.entries(groupedData)
  entries.forEach(([groupValue, groupRows]) => {
    const escapedGroupValue = escapeHTMLChars(String(groupValue))
    html += `<tr class="group-header"><td colspan="${columns.length}">${escapedGroupValue}</td></tr>`

    groupRows.forEach(row => {
      html += '<tr>'
      columns.forEach(col => {
        const value = row[col.name] || ''
        html += `<td>${escapeHTMLChars(formatTableValue(value, col.type))}</td>`
      })
      html += '</tr>'
    })

    if (grouping[0].showSubtotals) {
      html += `<tr class="group-subtotal"><td colspan="${columns.length}">Subtotal: ${groupRows.length} records</td></tr>`
    }
  })

  return html
}

/**
 * Generate chart section HTML (placeholder - actual chart rendering would use a library)
 */
function generateChartSectionHTML(section: ReportSection, data: ReportData): string {
  if (!section.chartConfig) {
    return ''
  }

  return `
    <div class="chart-container">
      <div class="chart-title">${escapeHTMLChars(section.title)}</div>
      <div class="chart-placeholder">
        [Chart: ${section.chartConfig.type.toUpperCase()}]
        <br/>
        Note: For interactive charts, use the PDF with embedded charts feature
      </div>
    </div>
  `
}

/**
 * Format value for summary display
 */
function formatSummaryValue(value: any): string {
  if (value === null || value === undefined) return '0'
  if (typeof value === 'number') return value.toLocaleString()
  return escapeHTMLChars(String(value || ''))
}

/**
 * Format value for table display
 */
function formatTableValue(value: any, type: string): string {
  if (value === null || value === undefined) return '-'

  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value)
    case 'boolean':
      return value ? 'Yes' : 'No'
    default:
      return String(value)
  }
}

/**
 * Calculate summary statistics from data
 */
export function calculateSummaryStats(
  data: any[],
  calculations: ReportCalculation[]
): Record<string, any> {
  const summary: Record<string, any> = {}

  calculations.forEach(calc => {
    summary[calc.name] = aggregateData(data, calc)
  })

  return summary
}

/**
 * Aggregate data based on calculation type
 */
function aggregateData(data: any[], calculation: ReportCalculation): any {
  const values = data.map(row => row[calculation.column]).filter(v => v != null)

  switch (calculation.type) {
    case 'count':
      return values.length

    case 'distinct':
      return new Set(values).size

    case 'sum':
      return values.reduce((sum, v) => sum + (Number(v) || 0), 0)

    case 'average':
      return values.length > 0 ? values.reduce((sum, v) => sum + (Number(v) || 0), 0) / values.length : 0

    case 'min':
      return Math.min(...values.filter(v => typeof v === 'number'))

    case 'max':
      return Math.max(...values.filter(v => typeof v === 'number'))

    default:
      return 0
  }
}

/**
 * Apply filters to data
 */
export function applyFilters(data: any[], filters?: ReportFilter[]): any[] {
  if (!filters || filters.length === 0) return data

  return data.filter(row => {
    return filters.every(filter => {
      const value = row[filter.column]

      switch (filter.operator) {
        case 'equals':
          return value === filter.value
        case 'contains':
          return String(value).includes(String(filter.value))
        case 'gt':
          return Number(value) > Number(filter.value)
        case 'gte':
          return Number(value) >= Number(filter.value)
        case 'lt':
          return Number(value) < Number(filter.value)
        case 'lte':
          return Number(value) <= Number(filter.value)
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value)
        case 'not_in':
          return !Array.isArray(filter.value) || !filter.value.includes(value)
        case 'between':
          return Number(value) >= filter.value[0] && Number(value) <= filter.value[1]
        default:
          return true
      }
    })
  })
}

/**
 * Sort data based on sorting rules
 */
export function applySorting(data: any[], sorting?: ReportSorting[]): any[] {
  if (!sorting || sorting.length === 0) return data

  return [...data].sort((a, b) => {
    for (const sort of sorting) {
      const aVal = a[sort.column]
      const bVal = b[sort.column]

      if (aVal === bVal) continue

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sort.direction === 'asc' ? comparison : -comparison
    }
    return 0
  })
}

/**
 * Group data based on grouping rules
 */
export function applyGrouping(data: any[], grouping?: ReportGrouping[]): Record<string, any[]> {
  if (!grouping || grouping.length === 0) {
    return { all: data }
  }

  const grouped: Record<string, any[]> = {}
  const groupColumn = grouping[0].column

  data.forEach(row => {
    const key = String(row[groupColumn] || '')
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(row)
  })

  return grouped
}

/**
 * Validate report configuration
 */
export function validateReportConfig(report: Partial<Report>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!report.name || report.name.trim().length === 0) {
    errors.push('Report name is required')
  }

  if (!report.sections || report.sections.length === 0) {
    errors.push('At least one report section is required')
  }

  report.sections?.forEach((section, index) => {
    if (!section.title) {
      errors.push(`Section ${index + 1}: Title is required`)
    }

    if (['table', 'details'].includes(section.type) && (!section.columns || section.columns.length === 0)) {
      errors.push(`Section "${section.title}": At least one column is required for table sections`)
    }

    if (section.type === 'chart' && !section.chartConfig) {
      errors.push(`Section "${section.title}": Chart configuration is required for chart sections`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Export report to JSON format
 */
export function exportReportToJSON(report: Report): string {
  return JSON.stringify(report, null, 2)
}

/**
 * Import report from JSON
 */
export function importReportFromJSON(jsonString: string): { report?: Report; error?: string } {
  try {
    const report = JSON.parse(jsonString) as Report

    const validation = validateReportConfig(report)
    if (!validation.valid) {
      return { error: `Invalid report: ${validation.errors.join(', ')}` }
    }

    return { report }
  } catch (error) {
    return { error: `Failed to parse JSON: ${(error as Error).message}` }
  }
}
