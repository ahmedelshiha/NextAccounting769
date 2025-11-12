import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withTenantContext } from '@/lib/api-wrapper'
import { tenantContext } from '@/lib/tenant-context'
import { hasPermission } from '@/lib/permissions'
import { rateLimitAsync } from '@/lib/rate-limit'
import { generateReportHTML, applyFilters, calculateSummaryStats } from '@/app/admin/users/utils/report-builder'
import { Report, ReportSection } from '@/app/admin/users/types/report-builder'

export const POST = withTenantContext(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const success = await rateLimitAsync(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const context = tenantContext.getContext()
    const hasAccess = await hasPermission(context.userId, 'reports.generate')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const report = await prisma.report.findUnique({ where: { id: params.id } })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const body = await request.json()
    const { format = 'pdf', filters } = body

    if (!['pdf', 'xlsx', 'csv', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Invalid export format. Supported: pdf, xlsx, csv, json' }, { status: 400 })
    }

    // Cast sections to properly handle Prisma JSON types
    const sections = Array.isArray(report.sections) ? (report.sections as unknown as ReportSection[]) : []
    const typedReport: Report = {
      id: report.id,
      tenantId: report.tenantId,
      userId: report.userId,
      name: report.name,
      description: report.description ?? undefined,
      sections: sections,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString()
    }

    const execution = await prisma.reportExecution.create({
      data: {
        id: crypto.randomUUID(),
        reportId: report.id,
        status: 'generating',
        executedAt: new Date()
      }
    })

    try {
      const users = await prisma.user.findMany({
        where: { tenantId: report.tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          availabilityStatus: true,
          department: true,
          position: true,
          createdAt: true
        }
      })

      let data = users
      if (filters) {
        data = applyFilters(data, filters)
      }

      // Sections already properly typed above
      const reportData = {
        columns: sections[0]?.columns || [],
        rows: data,
        rowCount: data.length,
        summary: calculateSummaryStats(data, sections[0]?.calculations || [])
      }

      let generatedContent = ''
      let contentType = 'text/html'
      let filename = `${report.name.replace(/\s+/g, '-')}-${Date.now()}`

      switch (format) {
        case 'pdf':
          generatedContent = generateReportHTML(typedReport, reportData)
          contentType = 'text/html'
          filename += '.html'
          break
        case 'xlsx':
          generatedContent = generateExcelReport(typedReport, reportData)
          contentType = 'text/tab-separated-values'
          filename += '.xlsx'
          break
        case 'csv':
          generatedContent = generateCSVReport(typedReport, reportData)
          contentType = 'text/csv'
          filename += '.csv'
          break
        case 'json':
          generatedContent = JSON.stringify(reportData, null, 2)
          contentType = 'application/json'
          filename += '.json'
          break
      }

      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          fileSizeBytes: Buffer.byteLength(generatedContent),
          completedAt: new Date()
        }
      })

      await prisma.report.update({
        where: { id: report.id },
        data: {
          lastGeneratedAt: new Date(),
          generationCount: { increment: 1 }
        }
      })

      return new NextResponse(generatedContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    } catch (error) {
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        }
      })
      throw error
    }
  } catch (error) {
    console.error('Failed to generate report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
})

function generateExcelReport(report: any, reportData: any): string {
  let tsv = `${report.name}\n`
  if (report.description) tsv += `${report.description}\n`
  tsv += `Generated: ${new Date().toLocaleDateString()}\n\n`

  if (reportData.summary && Object.keys(reportData.summary).length > 0) {
    tsv += 'SUMMARY\n'
    Object.entries(reportData.summary).forEach(([key, value]) => {
      tsv += `${key.replace(/_/g, ' ')}\t${value}\n`
    })
    tsv += '\n\n'
  }

  if (reportData.rows && reportData.rows.length > 0) {
    const columns = reportData.columns || [
      { name: 'name', label: 'Name' },
      { name: 'email', label: 'Email' },
      { name: 'role', label: 'Role' },
      { name: 'availabilityStatus', label: 'Status' }
    ]
    tsv += columns.map((c: any) => c.label).join('\t') + '\n'
    reportData.rows.forEach((row: any) => {
      tsv += columns.map((c: any) => row[c.name] || '').join('\t') + '\n'
    })
  }
  return tsv
}

function generateCSVReport(report: any, reportData: any): string {
  let csv = ''
  if (reportData.columns && reportData.columns.length > 0) {
    csv += reportData.columns.map((c: any) => `"${c.label}"`).join(',') + '\n'
  }

  if (reportData.rows && reportData.rows.length > 0) {
    const columns = reportData.columns || []
    reportData.rows.forEach((row: any) => {
      const values = columns.map((c: any) => {
        const value = row[c.name] || ''
        return `"${String(value).replace(/"/g, '""')}"`
      })
      csv += values.join(',') + '\n'
    })
  }
  return csv
}
