import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getCountry } from "@/lib/registries/countries";
import { logAuditSafe } from "@/lib/observability-helpers";


import type { EntityRow } from "@/lib/csv/entity-importer";
import { Redis } from "@upstash/redis";

export type CsvImportJobStatus = 
  | "PENDING"
  | "PROCESSING"
  | "PROCESSING_ENTITIES"
  | "SUCCESS"
  | "PARTIAL_SUCCESS"
  | "FAILED";

export interface CsvImportJobState {
  jobId: string;
  tenantId: string;
  userId: string;
  status: CsvImportJobStatus;
  startedAt: Date;
  completedAt?: Date;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    rowNumber: number;
    data: Record<string, any>;
    error: string;
  }>;
  retryCount: number;
  maxRetries: number;
}

export interface CsvImportResult {
  success: boolean;
  jobId: string;
  status: CsvImportJobStatus;
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    rowNumber: number;
    error: string;
  }>;
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const JOB_STATE_PREFIX = "csv-import:";
const JOB_CHANNEL = "csv-import:events";
const JOB_QUEUE = "csv-import:queue";
const IMPORT_TIMEOUT = 3600000; // 1 hour

/**
 * Get current import job state
 */
export async function getImportJobState(
  jobId: string
): Promise<CsvImportJobState | null> {
  try {
    const key = `${JOB_STATE_PREFIX}${jobId}`;
    const state = await redis.get(key);
    return state ? JSON.parse(state as string) : null;
  } catch (error) {
    logger.error("Failed to get import job state", { jobId, error });
    return null;
  }
}

/**
 * Initialize CSV import job
 */
export async function initializeImportJob(
  tenantId: string,
  userId: string,
  csvData: EntityRow[],
  jobId: string
): Promise<CsvImportJobState> {
  const state: CsvImportJobState = {
    jobId,
    tenantId,
    userId,
    status: "PENDING",
    startedAt: new Date(),
    totalRows: csvData.length,
    processedRows: 0,
    successCount: 0,
    failureCount: 0,
    errors: [],
    retryCount: 0,
    maxRetries: 3,
  };

  try {
    const key = `${JOB_STATE_PREFIX}${jobId}`;
    await redis.set(key, JSON.stringify(state), { ex: IMPORT_TIMEOUT / 1000 });
    
    // Enqueue job for processing
    await (redis as any).lpush(JOB_QUEUE, JSON.stringify({
      jobId,
      tenantId,
      userId,
      data: csvData,
    }));

    // Publish event
    await (redis as any).publish(JOB_CHANNEL, JSON.stringify({
      type: "job.initialized",
      jobId,
      status: "PENDING",
    }));

    logger.info("CSV import job initialized", { jobId, tenantId, rowCount: csvData.length });
    return state;
  } catch (error) {
    logger.error("Failed to initialize import job", { jobId, error });
    throw error;
  }
}

/**
 * Update import job state
 */
async function updateImportJobState(
  jobId: string,
  updates: Partial<CsvImportJobState>
): Promise<CsvImportJobState | null> {
  try {
    const state = await getImportJobState(jobId);
    if (!state) return null;

    const updated = { ...state, ...updates };
    const key = `${JOB_STATE_PREFIX}${jobId}`;
    await redis.set(key, JSON.stringify(updated), { ex: IMPORT_TIMEOUT / 1000 });

    // Publish update event
    await (redis as any).publish(JOB_CHANNEL, JSON.stringify({
      type: "job.updated",
      jobId,
      status: updated.status,
      progress: {
        processed: updated.processedRows,
        total: updated.totalRows,
      },
    }));

    return updated;
  } catch (error) {
    logger.error("Failed to update import job state", { jobId, error });
    return null;
  }
}

/**
 * Process single entity import
 */
async function processEntityRow(
  row: EntityRow,
  tenantId: string,
  userId: string,
  rowNumber: number
): Promise<{ success: boolean; error?: string; entityId?: string }> {
  try {
    // Validate country
    const country = getCountry(row.country);
    if (!country) {
      return { success: false, error: "Invalid country code" };
    }

    // Check for duplicate by license number
    if (row.licenseNumber) {
      const existing = await prisma.entity.findFirst({
        where: {
          tenantId,
          registrations: {
            some: {
              value: row.licenseNumber,
            },
          },
        },
      });

      if (existing) {
        return { success: false, error: "Entity with this license number already exists" };
      }
    }

    // Create entity with transaction
    const entity = await prisma.entity.create({
      data: {
        tenantId,
        country: row.country,
        name: row.businessName,
        status: "VERIFIED",
        createdBy: userId,
        metadata: {
          importedAt: new Date().toISOString(),
          importedBy: userId,
          sourceRow: rowNumber,
        },
        registrations: row.licenseNumber
          ? {
              create: {
                type: "LICENSE",
                value: row.licenseNumber,
                status: "VERIFIED",
                verifiedAt: new Date(),
              },
            }
          : undefined,
      },
    });

    logger.info("Entity imported successfully", {
      entityId: entity.id,
      jobId: `csv-import-${tenantId}`,
      rowNumber,
    });

    return { success: true, entityId: entity.id };
  } catch (error) {
    logger.error("Failed to process entity row", { rowNumber, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process next import job in queue
 */
export async function processNextImportJob(): Promise<boolean> {
  try {
    // Get next job from queue
    const jobData = await redis.rpop(JOB_QUEUE);
    if (!jobData) {
      return false; // No jobs to process
    }

    const job = JSON.parse(jobData as string) as {
      jobId: string;
      tenantId: string;
      userId: string;
      data: EntityRow[];
    };

    // Update job status to processing
    await updateImportJobState(job.jobId, {
      status: "PROCESSING",
    });

    // Process entities
    const errors: Array<{ rowNumber: number; data: Record<string, any>; error: string }> = [];
    let successCount = 0;
    let processedCount = 0;

    for (let i = 0; i < job.data.length; i++) {
      const row = job.data[i];
      const rowNumber = i + 2; // +1 for header, +1 for 1-based indexing

      const result = await processEntityRow(row, job.tenantId, job.userId, rowNumber);

      if (result.success) {
        successCount++;
      } else {
        errors.push({
          rowNumber,
          data: row,
          error: result.error || "Unknown error",
        });
      }

      processedCount++;

      // Update progress every 10 rows
      if (processedCount % 10 === 0) {
        await updateImportJobState(job.jobId, {
          processedRows: processedCount,
          successCount,
          failureCount: errors.length,
          status: "PROCESSING_ENTITIES",
        });
      }
    }

    // Finalize job
    const finalStatus = errors.length === 0 ? "SUCCESS" : "PARTIAL_SUCCESS";
    const finalState = await updateImportJobState(job.jobId, {
      status: finalStatus,
      processedRows: job.data.length,
      successCount,
      failureCount: errors.length,
      errors,
      completedAt: new Date(),
    });

    // Log import completion
    await logAuditSafe({
      action: "entities.csv_import_completed",
      details: {
        actorId: job.userId,
        targetId: job.tenantId,
        jobId: job.jobId,
        totalRows: job.data.length,
        successCount,
        failureCount: errors.length,
      },
    }).catch(() => {});

    logger.info("CSV import job completed", {
      jobId: job.jobId,
      status: finalStatus,
      successCount,
      failureCount: errors.length,
    });

    return true;
  } catch (error) {
    logger.error("Failed to process import job", { error });
    return false;
  }
}

/**
 * Cleanup expired jobs
 */
export async function cleanupExpiredImportJobs(): Promise<void> {
  try {
    // Expired jobs are automatically cleaned up by Redis TTL
    logger.debug("Import job cleanup completed (TTL-based)");
  } catch (error) {
    logger.error("Failed to cleanup import jobs", { error });
  }
}

/**
 * Get job status with progress
 */
export async function getImportJobStatus(jobId: string): Promise<CsvImportResult | null> {
  try {
    const state = await getImportJobState(jobId);
    if (!state) return null;

    return {
      success: state.status === "SUCCESS",
      jobId: state.jobId,
      status: state.status,
      totalRows: state.totalRows,
      successCount: state.successCount,
      failureCount: state.failureCount,
      errors: state.errors.map((err) => ({
        rowNumber: err.rowNumber,
        error: err.error,
      })),
    };
  } catch (error) {
    logger.error("Failed to get import job status", { jobId, error });
    return null;
  }
}
