import { processNextImportJob, cleanupExpiredImportJobs } from "@/lib/jobs/csv-import";
import { logger } from "@/lib/logger";

/**
 * Netlify scheduled function to process CSV import jobs
 * Runs every 60 seconds
 */
const csvImportHandler = async (req: any) => {
  try {
    // Verify cron secret
    const cronSecret = process.env.CRON_CSV_IMPORT_SECRET;
    if (!cronSecret || req.headers["x-cron-secret"] !== cronSecret) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    let processedCount = 0;
    const maxIterations = 10; // Process up to 10 jobs per cron run

    // Process queued import jobs
    while (processedCount < maxIterations) {
      const processed = await processNextImportJob();
      if (!processed) {
        break; // No more jobs to process
      }
      processedCount++;
    }

    // Cleanup expired jobs
    await cleanupExpiredImportJobs();

    logger.info("CSV import cron job completed", {
      processedJobs: processedCount,
      timestamp: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processed: processedCount,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    logger.error("CSV import cron job failed", { error });
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

export default csvImportHandler;

// Schedule: every 60 seconds
export const config = {
  schedule: "* * * * *", // Every minute, but with processing limit per run
};
