import { Handler } from "@netlify/functions";
import { processNextVerificationJob, cleanupExpiredJobs } from "../../src/lib/jobs/entity-setup";
import { logger } from "../../src/lib/logger";

/**
 * Scheduled Netlify function to process entity setup verification jobs
 * Runs every 30 seconds to process queued verification jobs
 */
export const handler: Handler = async (event) => {
  // Verify cron secret
  const cronSecret = process.env.CRON_ENTITY_VERIFICATION_SECRET;
  if (!cronSecret || event.headers["x-cron-secret"] !== cronSecret) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  try {
    let processed = 0;
    let failed = 0;

    // Process up to 10 verification jobs per cron run
    for (let i = 0; i < 10; i++) {
      try {
        const result = await processNextVerificationJob();
        if (!result) {
          // Queue is empty
          break;
        }
        processed++;
        
        logger.info("Verification job processed", {
          entityId: result.entityId,
          status: result.status,
        });
      } catch (error) {
        failed++;
        logger.error("Error processing verification job", { error });
      }
    }

    // Cleanup expired jobs
    await cleanupExpiredJobs();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processed,
        failed,
        message: `Processed ${processed} verification jobs, ${failed} failed`,
      }),
    };
  } catch (error) {
    logger.error("Error in entity verification cron", { error });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
    };
  }
};
