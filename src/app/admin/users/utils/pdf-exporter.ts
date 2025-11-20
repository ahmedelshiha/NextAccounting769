import { UserItem } from '../contexts/UserDataContext'

export interface PDFExportConfig {
  title?: string
  subtitle?: string
  includeHeader?: boolean
  includeFooter?: boolean
  headerText?: string
  footerText?: string
  companyLogo?: string
  companyName?: string
  pageSize?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  includeQRCode?: boolean
  qrCodeText?: string
  columns?: string[]
  customCSS?: string
}

export interface PDFGenerationResult {
  success: boolean
  data?: Blob | string
  error?: string
  pageCount?: number
  estimatedSize?: number
}

/**
 * Generate HTML content for PDF export
 * This creates a formatted HTML table that can be converted to PDF
 */
export function generatePDFHTML(
  users: UserItem[],
  config: PDFExportConfig = {}
): string {
  const {
    title = 'User Directory Export',
    subtitle,
    companyName = 'Accounting Firm',
    headerText,
    footerText,
    includeHeader = true,
    includeFooter = true,
    pageSize = 'A4',
    orientation = 'portrait',
    includeQRCode = false,
    qrCodeText,
    columns = ['name', 'email', 'phone', 'role', 'status', 'department'],
    customCSS = ''
  } = config

  const pageWidth = pageSize === 'A4' ? '210mm' : '8.5in'
  const pageHeight = pageSize === 'A4' ? '297mm' : '11in'
  const pageMargin = '10mm'

  // Map column names to display labels
  const columnLabels: Record<string, string> = {
    id: 'ID',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    role: 'Role',
    status: 'Status',
    position: 'Position',
    department: 'Department',
    createdAt: 'Created',
    lastLoginAt: 'Last Login'
  }

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  // Get cell value based on column name
  const getCellValue = (user: UserItem, column: string): string => {
    switch (column) {
      case 'createdAt':
        return formatDate(user.createdAt)
      case 'lastLoginAt':
        return formatDate(user.lastLoginAt)
      case 'name':
        return user.name || 'N/A'
      case 'email':
        return user.email || 'N/A'
      case 'phone':
        return user.phone || 'N/A'
      case 'role':
        return user.role || 'N/A'
      case 'status':
        return user.status || 'ACTIVE'
      case 'position':
        return user.position || 'N/A'
      case 'department':
        return user.department || 'N/A'
      case 'id':
        return user.id || 'N/A'
      default:
        return 'N/A'
    }
  }

  // Generate QR code placeholder (actual QR generation would require qrcode library)
  const qrCodeHTML = includeQRCode
    ? `
    <div class="qr-code-container">
      <p style="font-size: 10px; color: #666; margin: 5px 0;">
        [QR Code: ${qrCodeText || 'Export Timestamp'}]
      </p>
    </div>
    `
    : ''

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @page {
          size: ${pageSize === 'A4' ? 'A4' : 'letter'} ${orientation};
          margin: ${pageMargin};
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #333;
          background: white;
          width: ${pageWidth};
          margin: 0 auto;
        }

        .pdf-header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #1e40af;
          margin-bottom: 20px;
        }

        .company-info {
          font-size: 10px;
          color: #666;
          margin-bottom: 5px;
        }

        .pdf-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin: 10px 0 5px 0;
        }

        .pdf-subtitle {
          font-size: 12px;
          color: #666;
          margin-bottom: 10px;
        }

        .metadata {
          font-size: 9px;
          color: #999;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0;
        }

        .qr-code-container {
          text-align: right;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
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

        .status-active {
          color: #10b981;
          font-weight: 500;
        }

        .status-inactive {
          color: #6b7280;
          font-weight: 500;
        }

        .status-suspended {
          color: #ef4444;
          font-weight: 500;
        }

        .role-admin {
          background-color: #fef3c7;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 500;
        }

        .role-team-lead {
          background-color: #dbeafe;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 500;
        }

        .role-team-member {
          background-color: #e0e7ff;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 500;
        }

        .pdf-footer {
          margin-top: 30px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          font-size: 9px;
          color: #999;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
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
          margin-top: 10px;
        }

        .summary-section {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 10px 12px;
          margin: 15px 0;
          border-radius: 4px;
          font-size: 10px;
        }

        .summary-item {
          display: inline-block;
          margin-right: 20px;
          margin-bottom: 5px;
        }

        .summary-label {
          font-weight: 600;
          color: #1e40af;
        }

        .summary-value {
          color: #374151;
        }

        ${customCSS}
      </style>
    </head>
    <body>
      <div class="pdf-header">
        ${companyName ? `<div class="company-info">${companyName}</div>` : ''}
        <h1 class="pdf-title">${title}</h1>
        ${subtitle ? `<div class="pdf-subtitle">${subtitle}</div>` : ''}
        <div class="metadata">
          <span>${headerText || `Generated on ${new Date().toLocaleDateString()}`}</span>
          ${qrCodeHTML}
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-item">
          <span class="summary-label">Total Users:</span>
          <span class="summary-value">${users.length}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Active:</span>
          <span class="summary-value">${users.filter(u => u.status === 'ACTIVE').length}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Inactive:</span>
          <span class="summary-value">${users.filter(u => u.status === 'INACTIVE').length}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Suspended:</span>
          <span class="summary-value">${users.filter(u => u.status === 'SUSPENDED').length}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${columnLabels[col] || col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${users
            .map(
              user => `
            <tr class="no-break">
              ${columns
                .map(col => {
                  const value = getCellValue(user, col)
                  const className =
                    col === 'status' ? `status-${value.toLowerCase()}` :
                    col === 'role' ? `role-${value.replace(/_/g, '-').toLowerCase()}` : ''
                  return `<td class="${className}">${value}</td>`
                })
                .join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="pdf-footer">
        <div class="footer-left">
          ${footerText || `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`}
        </div>
        <div class="footer-right">
          Page <span class="page-number">1</span>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

/**
 * Export users to PDF using browser printing
 * For production, use a PDF library like jsPDF or pdfkit
 */
export function exportUsersToPDFBrowser(
  users: UserItem[],
  config: PDFExportConfig = {}
): PDFGenerationResult {
  try {
    const html = generatePDFHTML(users, config)
    const filename = `users-export-${new Date().toISOString().slice(0, 10)}`

    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) {
      return {
        success: false,
        error: 'Failed to open print window. Please check popup blocker settings.'
      }
    }

    printWindow.document.write(html)
    printWindow.document.close()

    // Trigger print dialog
    setTimeout(() => {
      printWindow.print()
      // Note: We don't close the window automatically to let user interact with print dialog
    }, 250)

    return {
      success: true,
      data: html
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to generate PDF: ${(error as Error).message}`
    }
  }
}

/**
 * Export users to HTML (for use with server-side PDF generation)
 */
export function exportUsersToHTML(
  users: UserItem[],
  config: PDFExportConfig = {}
): string {
  return generatePDFHTML(users, config)
}

/**
 * Download PDF as HTML for client-side conversion
 * Returns HTML blob that can be sent to a PDF generation service
 */
export function downloadPDFAsHTML(
  users: UserItem[],
  filename = 'users-export',
  config: PDFExportConfig = {}
): void {
  const html = generatePDFHTML(users, config)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Calculate estimated page count based on rows per page
 */
export function calculatePageCount(userCount: number, rowsPerPage = 20): number {
  const headerFooterRows = 2
  const usableRows = rowsPerPage - headerFooterRows
  return Math.ceil(userCount / usableRows)
}

/**
 * Estimate file size of PDF (rough approximation)
 */
export function estimatePDFSize(userCount: number): number {
  // Rough estimate: ~1KB per user row + 5KB overhead
  return userCount * 1024 + 5120
}

/**
 * Validate PDF export configuration
 */
export function validatePDFConfig(config: PDFExportConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (config.pageSize && !['A4', 'Letter'].includes(config.pageSize)) {
    errors.push('Invalid page size. Must be A4 or Letter.')
  }

  if (config.orientation && !['portrait', 'landscape'].includes(config.orientation)) {
    errors.push('Invalid orientation. Must be portrait or landscape.')
  }

  if (config.title && config.title.length > 100) {
    errors.push('Title must be less than 100 characters.')
  }

  if (config.columns && config.columns.length === 0) {
    errors.push('At least one column must be selected.')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Merge multiple user exports into a single PDF
 * Useful for combining multiple result sets
 */
export function mergePDFExports(
  exportConfigs: Array<{ users: UserItem[]; title: string }>,
  globalConfig: PDFExportConfig = {}
): string {
  let mergedHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
  `

  exportConfigs.forEach((config, index) => {
    const sectionConfig: PDFExportConfig = {
      ...globalConfig,
      title: config.title
    }
    const sectionHTML = generatePDFHTML(config.users, sectionConfig)
    // Extract body content
    const bodyMatch = sectionHTML.match(/<body[^>]*>([\s\S]*)<\/body>/)
    if (bodyMatch) {
      mergedHTML += bodyMatch[1]
      if (index < exportConfigs.length - 1) {
        mergedHTML += '<div class="page-break"></div>'
      }
    }
  })

  mergedHTML += '</body></html>'
  return mergedHTML
}
