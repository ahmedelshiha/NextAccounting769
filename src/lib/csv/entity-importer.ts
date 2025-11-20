
import { logger } from '@/lib/logger';

import { parse } from 'csv-parse/sync';
import { z } from 'zod';

const entityRowSchema = z.object({
  country: z.enum(['AE', 'SA', 'EG']).describe('Country code (AE, SA, EG)'),
  businessName: z.string().min(1, 'Business name is required'),
  licenseNumber: z.string().optional(),
  legalForm: z.string().optional(),
  economicZoneId: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export type EntityRow = z.infer<typeof entityRowSchema>;

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    rowNumber: number;
    data: Record<string, any>;
    error: string;
  }>;
  data: EntityRow[];
}

export async function validateCsvData(csvContent: string): Promise<ImportResult> {
  try {
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const result: ImportResult = {
      totalRows: records.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      data: [],
    };

    // Validate each row
    records.forEach((record: Record<string, any>, index: number) => {
      const rowNumber = index + 2; // +1 for header, +1 for 1-based indexing

      try {
        // Validate against schema
        const validated = entityRowSchema.parse(record);
        result.data.push(validated);
        result.successCount++;
      } catch (error) {
        result.errorCount++;
        if (error instanceof z.ZodError) {
          const messages = error.issues
            .map((err) => `${err.path.join('.')}: ${err.message}`)
            .join('; ');
          result.errors.push({
            rowNumber,
            data: record,
            error: messages,
          });
        } else {
          result.errors.push({
            rowNumber,
            data: record,
            error: 'Invalid row format',
          });
        }
      }
    });

    return result;
  } catch (error) {
    logger.error('Failed to parse CSV', { error });
    throw new Error('Failed to parse CSV file. Please ensure it is a valid CSV format.');
  }
}

export function generateCsvTemplate(): string {
  const headers = [
    'country',
    'businessName',
    'licenseNumber',
    'legalForm',
    'economicZoneId',
    'taxId',
    'email',
    'phone',
  ];

  const examples = [
    {
      country: 'AE',
      businessName: 'Example Business LLC',
      licenseNumber: 'P123456X',
      legalForm: 'LLC',
      economicZoneId: 'ded',
      taxId: '123456789012345',
      email: 'business@example.com',
      phone: '+971501234567',
    },
    {
      country: 'SA',
      businessName: 'شركة مثال',
      licenseNumber: '1010123456',
      legalForm: 'Company',
      economicZoneId: 'riyadh',
      taxId: '300000000000003',
      email: 'info@example.com',
      phone: '+966501234567',
    },
    {
      country: 'EG',
      businessName: 'شركة النموذج',
      licenseNumber: '',
      legalForm: 'Business',
      economicZoneId: 'cairo',
      taxId: '612345678',
      email: 'contact@example.com',
      phone: '+201001234567',
    },
  ];

  const csv = [
    headers.join(','),
    ...examples.map((row) =>
      headers
        .map((key) => {
          const value = row[key as keyof typeof row];
          // Escape quotes and wrap in quotes if contains comma or quote
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        })
        .join(',')
    ),
  ].join('\n');

  return csv;
}

export interface CsvValidationError {
  rowNumber: number;
  field: string;
  message: string;
}

export function formatValidationErrors(errors: ImportResult['errors']): string {
  if (errors.length === 0) return '';

  return errors
    .slice(0, 10) // Show first 10 errors
    .map((err) => `Row ${err.rowNumber}: ${err.error}`)
    .join('\n');
}

export async function processCsvImport(
  csvContent: string,
  tenantId: string,
  userId: string
): Promise<{
  jobId: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
}> {
  // Import CSV job utilities
  const { initializeImportJob } = await import('@/lib/jobs/csv-import');

  // Validate CSV
  const validation = await validateCsvData(csvContent);

  if (validation.errorCount > 0 && validation.successCount === 0) {
    throw new Error(`CSV validation failed. ${formatValidationErrors(validation.errors)}`);
  }

  // Generate job ID
  const jobId = `csv-import-${tenantId}-${Date.now()}`;

  // Create import job (queues it for processing)
  const state = await initializeImportJob(
    tenantId,
    userId,
    validation.data,
    jobId
  );

  return {
    jobId: state.jobId,
    totalRows: validation.totalRows,
    validRows: validation.successCount,
    invalidRows: validation.errorCount,
  };
}
