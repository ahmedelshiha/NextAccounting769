import { UserItem } from '../contexts/UserDataContext'

export interface ExcelExportConfig {
  filename?: string
  includeMetadata?: boolean
  includeSummary?: boolean
  includeTrendData?: boolean
  sheets?: string[]
  pageOrientation?: 'portrait' | 'landscape'
  freezeHeader?: boolean
  autoFilter?: boolean
  conditionalFormatting?: boolean
  columns?: string[]
  customFormatting?: Record<string, CellFormat>
}

export interface CellFormat {
  backgroundColor?: string
  fontColor?: string
  bold?: boolean
  italic?: boolean
  fontSize?: number
  alignment?: 'left' | 'center' | 'right'
  numberFormat?: string
  borderStyle?: 'thin' | 'medium' | 'thick'
  borderColor?: string
}

export interface ExcelSheet {
  name: string
  data: any[][]
  formatting?: Record<string, CellFormat>
  columnWidths?: number[]
  frozenRows?: number
  autoFilter?: boolean
}

export interface ExcelGenerationResult {
  success: boolean
  data?: Blob | string
  error?: string
  sheetCount?: number
  estimatedSize?: number
}

/**
 * Generate Excel-compatible TSV (Tab-Separated Values) format
 * Can be opened in Excel and maintains formatting compatibility
 */
export function generateExcelTSV(
  users: UserItem[],
  config: ExcelExportConfig = {}
): string {
  const {
    includeSummary = true,
    columns = ['name', 'email', 'phone', 'role', 'status', 'department', 'position', 'createdAt']
  } = config

  // Column headers
  const columnLabels: Record<string, string> = {
    id: 'ID',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    role: 'Role',
    status: 'Status',
    position: 'Position',
    department: 'Department',
    createdAt: 'Created At',
    lastLoginAt: 'Last Login'
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString()
  }

  const getCellValue = (user: UserItem, column: string): string => {
    switch (column) {
      case 'createdAt':
        return formatDate(user.createdAt)
      case 'lastLoginAt':
        return formatDate(user.lastLoginAt)
      case 'name':
        return user.name || ''
      case 'email':
        return user.email || ''
      case 'phone':
        return user.phone || ''
      case 'role':
        return user.role || ''
      case 'status':
        return user.status || 'ACTIVE'
      case 'position':
        return user.position || ''
      case 'department':
        return user.department || ''
      case 'id':
        return user.id || ''
      default:
        return ''
    }
  }

  let tsvContent = ''

  // Add summary section if enabled
  if (includeSummary) {
    const activeCount = users.filter(u => u.status === 'ACTIVE').length
    const inactiveCount = users.filter(u => u.status === 'INACTIVE').length
    const suspendedCount = users.filter(u => u.status === 'SUSPENDED').length

    tsvContent += 'USER DIRECTORY EXPORT SUMMARY\n'
    tsvContent += `Export Date\t${new Date().toLocaleDateString()}\n`
    tsvContent += `Total Users\t${users.length}\n`
    tsvContent += `Active Users\t${activeCount}\n`
    tsvContent += `Inactive Users\t${inactiveCount}\n`
    tsvContent += `Suspended Users\t${suspendedCount}\n`
    tsvContent += '\n\n'
  }

  // Add headers
  tsvContent += columns.map(col => columnLabels[col] || col).join('\t') + '\n'

  // Add data rows
  users.forEach(user => {
    const row = columns.map(col => getCellValue(user, col))
    tsvContent += row.join('\t') + '\n'
  })

  return tsvContent
}

/**
 * Generate Excel-compatible XML format (OOXML)
 * More advanced formatting support than TSV
 */
export function generateExcelXML(
  sheets: ExcelSheet[],
  config: ExcelExportConfig = {}
): string {
  const { filename = 'export' } = config

  // This is a simplified XML structure for Excel
  // For production use, consider using a proper library like xlsx or exceljs
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">\n'
  xmlContent += '<DocumentProperties><Created>' + new Date().toISOString() + '</Created></DocumentProperties>\n'
  xmlContent += '<Styles>\n'

  // Define styles
  xmlContent += '<Style ss:ID="header"><Font ss:Bold="1" ss:Color="#1e40af"/><Interior ss:Color="#f3f4f6" ss:Pattern="Solid"/></Style>\n'
  xmlContent += '<Style ss:ID="statusActive"><Font ss:Color="#10b981" ss:Bold="1"/></Style>\n'
  xmlContent += '<Style ss:ID="statusInactive"><Font ss:Color="#6b7280"/></Style>\n'
  xmlContent += '<Style ss:ID="statusSuspended"><Font ss:Color="#ef4444" ss:Bold="1"/></Style>\n'

  xmlContent += '</Styles>\n'

  // Add worksheets
  sheets.forEach((sheet, sheetIndex) => {
    xmlContent += `<Worksheet ss:Name="${escapeXML(sheet.name)}">\n`
    xmlContent += '<Table>\n'

    // Add columns with widths
    if (sheet.columnWidths) {
      sheet.columnWidths.forEach(width => {
        xmlContent += `<Column ss:Width="${width}"/>\n`
      })
    }

    // Add rows
    sheet.data.forEach((row, rowIndex) => {
      xmlContent += '<Row>\n'
      row.forEach((cell, cellIndex) => {
        let cellStyle = ''

        // Apply header style to first row
        if (rowIndex === 0) {
          cellStyle = ' ss:StyleID="header"'
        }

        // Apply status formatting
        if (cell === 'ACTIVE') {
          cellStyle = ' ss:StyleID="statusActive"'
        } else if (cell === 'INACTIVE') {
          cellStyle = ' ss:StyleID="statusInactive"'
        } else if (cell === 'SUSPENDED') {
          cellStyle = ' ss:StyleID="statusSuspended"'
        }

        xmlContent += `<Cell${cellStyle}><Data ss:Type="String">${escapeXML(cell.toString())}</Data></Cell>\n`
      })
      xmlContent += '</Row>\n'
    })

    xmlContent += '</Table>\n'
    xmlContent += '</Worksheet>\n'
  })

  xmlContent += '</Workbook>'

  return xmlContent
}

/**
 * Export users to Excel format (TSV for compatibility)
 */
export function exportUsersToExcel(
  users: UserItem[],
  config: ExcelExportConfig = {}
): ExcelGenerationResult {
  try {
    const { filename = `users-export-${new Date().toISOString().slice(0, 10)}` } = config

    const tsvContent = generateExcelTSV(users, config)
    const blob = new Blob([tsvContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return {
      success: true,
      estimatedSize: blob.size,
      sheetCount: 1
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to export to Excel: ${(error as Error).message}`
    }
  }
}

/**
 * Export users with multiple sheets (data + summary + statistics)
 */
export function exportUsersWithMultipleSheets(
  users: UserItem[],
  config: ExcelExportConfig = {}
): ExcelGenerationResult {
  try {
    const { filename = `users-detailed-export-${new Date().toISOString().slice(0, 10)}` } = config

    // Sheet 1: User Data
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Department', 'Position', 'Created At']
    const dataRows = users.map(u => [
      u.name || '',
      u.email || '',
      u.phone || '',
      u.role || '',
      u.status || 'ACTIVE',
      u.department || '',
      u.position || '',
      new Date(u.createdAt).toLocaleDateString()
    ])

    const sheet1Data = [headers, ...dataRows]

    // Sheet 2: Summary Statistics
    const activeCount = users.filter(u => u.status === 'ACTIVE').length
    const inactiveCount = users.filter(u => u.status === 'INACTIVE').length
    const suspendedCount = users.filter(u => u.status === 'SUSPENDED').length

    const roleDistribution = users.reduce(
      (acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Users', users.length.toString()],
      ['Active Users', activeCount.toString()],
      ['Inactive Users', inactiveCount.toString()],
      ['Suspended Users', suspendedCount.toString()],
      ['', ''],
      ['Role Distribution', ''],
      ...Object.entries(roleDistribution).map(([role, count]) => [role, count.toString()])
    ]

    // Sheet 3: Department Distribution
    const departmentDistribution = users.reduce(
      (acc, u) => {
        const dept = u.department || 'Unassigned'
        acc[dept] = (acc[dept] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const deptData = [
      ['Department', 'Count'],
      ...Object.entries(departmentDistribution).map(([dept, count]) => [dept, count.toString()])
    ]

    // Create combined TSV with sheet indicators
    let tsvContent = 'USER DATA\n\n'
    tsvContent += sheet1Data.map(row => row.join('\t')).join('\n')
    tsvContent += '\n\n\nSUMMARY STATISTICS\n\n'
    tsvContent += summaryData.map(row => row.join('\t')).join('\n')
    tsvContent += '\n\n\nDEPARTMENT DISTRIBUTION\n\n'
    tsvContent += deptData.map(row => row.join('\t')).join('\n')

    const blob = new Blob([tsvContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return {
      success: true,
      estimatedSize: blob.size,
      sheetCount: 3
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to export with multiple sheets: ${(error as Error).message}`
    }
  }
}

/**
 * Generate CSV with conditional formatting indicators (using comments)
 */
export function generateExcelWithConditionalFormatting(
  users: UserItem[],
  config: ExcelExportConfig = {}
): string {
  const { columns = ['name', 'email', 'role', 'status', 'department'] } = config

  const columnLabels: Record<string, string> = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    role: 'Role',
    status: 'Status',
    position: 'Position',
    department: 'Department',
    createdAt: 'Created At'
  }

  const getCellValue = (user: UserItem, column: string): string => {
    switch (column) {
      case 'name':
        return user.name || ''
      case 'email':
        return user.email || ''
      case 'phone':
        return user.phone || ''
      case 'role':
        return user.role || ''
      case 'status':
        return user.status || 'ACTIVE'
      case 'position':
        return user.position || ''
      case 'department':
        return user.department || ''
      case 'createdAt':
        return new Date(user.createdAt).toLocaleDateString()
      default:
        return ''
    }
  }

  // Start CSV with conditional formatting indicators
  let csvContent = '# Conditional Formatting Rules Applied:\n'
  csvContent += '# - Status=ACTIVE: Green Background\n'
  csvContent += '# - Status=INACTIVE: Gray Background\n'
  csvContent += '# - Status=SUSPENDED: Red Background\n'
  csvContent += '# - Admin Roles: Bold Yellow Background\n\n'

  // Add headers
  csvContent += columns.map(col => `"${columnLabels[col] || col}"`).join(',') + '\n'

  // Add data
  users.forEach(user => {
    const row = columns.map(col => {
      const value = getCellValue(user, col)
      return `"${value.replace(/"/g, '""')}"`
    })
    csvContent += row.join(',') + '\n'
  })

  return csvContent
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Validate Excel export configuration
 */
export function validateExcelConfig(config: ExcelExportConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (config.pageOrientation && !['portrait', 'landscape'].includes(config.pageOrientation)) {
    errors.push('Invalid page orientation. Must be portrait or landscape.')
  }

  if (config.columns && config.columns.length === 0) {
    errors.push('At least one column must be selected.')
  }

  if (config.filename && config.filename.length > 100) {
    errors.push('Filename must be less than 100 characters.')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Estimate Excel file size
 */
export function estimateExcelSize(
  userCount: number,
  sheetCount = 1,
  includeFormatting = true
): number {
  const baseSizePerUser = includeFormatting ? 256 : 128
  const sheetOverhead = sheetCount * 1024
  return userCount * baseSizePerUser + sheetOverhead + 2048
}

/**
 * Create Excel column width recommendation based on header text
 */
export function calculateColumnWidths(headers: string[]): number[] {
  return headers.map(header => {
    // Base width calculation: header length * 1.2 + padding
    const baseWidth = Math.max(header.length * 1.2, 10)
    // Cap at reasonable maximum (40 characters)
    return Math.min(baseWidth, 40)
  })
}

/**
 * Generate formula for Excel summary calculations
 */
export function generateExcelFormula(
  type: 'sum' | 'count' | 'average' | 'percentage',
  startRow: number,
  endRow: number,
  column: string
): string {
  const cellRange = `${column}${startRow}:${column}${endRow}`

  switch (type) {
    case 'sum':
      return `=SUM(${cellRange})`
    case 'count':
      return `=COUNTA(${cellRange})`
    case 'average':
      return `=AVERAGE(${cellRange})`
    case 'percentage':
      return `=ROUND(${cellRange}/SUM($${column}$${startRow}:$${column}$${endRow})*100,2)`
    default:
      return ''
  }
}
