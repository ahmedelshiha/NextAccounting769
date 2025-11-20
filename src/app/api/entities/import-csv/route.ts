import { NextResponse, type NextRequest } from 'next/server';
import { validateCsvData, processCsvImport, generateCsvTemplate } from '@/lib/csv/entity-importer';
import { logger } from '@/lib/logger';
import { logAuditSafe } from '@/lib/observability-helpers';
import { withTenantContext } from '@/lib/api-wrapper';
import { requireTenantContext } from '@/lib/tenant-utils';

export const POST = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId, tenantId } = requireTenantContext();

      if (!userId || !tenantId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Check file type
      if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
        return NextResponse.json(
          { error: 'Please upload a CSV file' },
          { status: 400 }
        );
      }

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File is too large. Maximum size is 10MB' },
          { status: 413 }
        );
      }

      // Read file content
      const csvContent = await file.text();

      // Validate CSV
      const validation = await validateCsvData(csvContent);

      // If there are validation errors, return them
      if (validation.errorCount > 0) {
        return NextResponse.json({
          success: false,
          validation: {
            totalRows: validation.totalRows,
            validRows: validation.successCount,
            invalidRows: validation.errorCount,
            errors: validation.errors.slice(0, 10), // Return first 10 errors
            hasMoreErrors: validation.errorCount > 10,
          },
        });
      }

      // Process the import (creates background job)
      const result = await processCsvImport(csvContent, tenantId, userId);

      // Log audit event
      await logAuditSafe({
        action: 'entities.csv_import_started',
        details: {
          actorId: userId,
          targetId: tenantId,
          jobId: result.jobId,
          totalRows: result.totalRows,
          validRows: result.validRows,
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        data: {
          jobId: result.jobId,
          totalRows: result.totalRows,
          validRows: result.validRows,
          invalidRows: result.invalidRows,
          message: `Import started. ${result.validRows} entities will be processed.`,
        },
      });
    } catch (error) {
      logger.error('Failed to process CSV import', { error });
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process CSV file',
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId } = requireTenantContext();
      const format = request.nextUrl.searchParams.get('format');

      if (format === 'template') {
        // Return CSV template
        const template = generateCsvTemplate();

        return new NextResponse(template, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="entities-template.csv"',
          },
        });
      }

      return NextResponse.json({
        message: 'Use GET ?format=template to download a CSV template',
      });
    } catch (error) {
      logger.error('Failed to generate CSV template', { error });
      return NextResponse.json(
        { error: 'Failed to generate template' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
