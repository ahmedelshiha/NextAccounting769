import { Redis } from "@upstash/redis";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { countryRegistry } from "@/lib/registries/countries";

export type VerificationJobStatus = 
  | "PENDING_VERIFICATION"
  | "VERIFYING_LICENSE"
  | "VERIFYING_REGISTRATIONS"
  | "VERIFIED_SUCCESS"
  | "VERIFICATION_FAILED"
  | "MANUAL_REVIEW";

export interface VerificationJobState {
  entityId: string;
  status: VerificationJobStatus;
  startedAt: Date;
  completedAt?: Date;
  verifiedRegistrations: string[];
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
}

export interface VerificationResult {
  success: boolean;
  entityId: string;
  status: VerificationJobStatus;
  details?: {
    verifiedRegistrations: string[];
    failureReason?: string;
  };
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const JOB_STATE_PREFIX = "entity-setup:";
const JOB_CHANNEL = "entity-setup:events";
const JOB_QUEUE = "entity-setup:queue";
const VERIFICATION_TIMEOUT = 300000; // 5 minutes

/**
 * Get current verification job state
 */
export async function getVerificationState(
  entityId: string
): Promise<VerificationJobState | null> {
  try {
    const key = `${JOB_STATE_PREFIX}${entityId}`;
    const state = await redis.get(key);
    return state ? JSON.parse(state as string) : null;
  } catch (error) {
    logger.error("Failed to get verification state", { entityId, error });
    return null;
  }
}

/**
 * Initialize verification job for entity
 */
export async function initializeVerificationJob(
  entityId: string
): Promise<VerificationJobState> {
  const state: VerificationJobState = {
    entityId,
    status: "PENDING_VERIFICATION",
    startedAt: new Date(),
    verifiedRegistrations: [],
    retryCount: 0,
    maxRetries: 3,
  };

  try {
    const key = `${JOB_STATE_PREFIX}${entityId}`;
    await redis.setex(key, VERIFICATION_TIMEOUT / 1000, JSON.stringify(state));
    
    // Publish event
    await publishEvent("job.initialized", state);
    
    logger.info("Verification job initialized", { entityId });
    return state;
  } catch (error) {
    logger.error("Failed to initialize verification job", { entityId, error });
    throw error;
  }
}

/**
 * Update verification job state
 */
export async function updateVerificationState(
  entityId: string,
  updates: Partial<VerificationJobState>
): Promise<VerificationJobState | null> {
  try {
    const current = await getVerificationState(entityId);
    if (!current) {
      logger.warn("Verification state not found", { entityId });
      return null;
    }

    const updated: VerificationJobState = {
      ...current,
      ...updates,
      entityId: current.entityId, // Prevent accidental change
      startedAt: current.startedAt, // Preserve original start time
    };

    const key = `${JOB_STATE_PREFIX}${entityId}`;
    await redis.setex(key, VERIFICATION_TIMEOUT / 1000, JSON.stringify(updated));
    
    // Publish update event
    await publishEvent("job.updated", updated);
    
    return updated;
  } catch (error) {
    logger.error("Failed to update verification state", { entityId, error });
    return null;
  }
}

/**
 * Verify entity registrations against registry
 */
export async function verifyEntityRegistrations(
  entityId: string
): Promise<VerificationJobState | null> {
  try {
    let state = await updateVerificationState(entityId, {
      status: "VERIFYING_REGISTRATIONS",
    });
    
    if (!state) {
      logger.error("Cannot update state to verifying", { entityId });
      return null;
    }

    // Get entity with its registrations
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        registrations: true,
        licenses: true,
      },
    });

    if (!entity) {
      state = await updateVerificationState(entityId, {
        status: "VERIFICATION_FAILED",
        failureReason: "Entity not found",
        completedAt: new Date(),
      });
      return state;
    }

    const verifiedRegistrations: string[] = [];
    let verificationFailed = false;
    let failureReason = "";

    // Verify each registration
    for (const registration of entity.registrations) {
      try {
        // Validate identifier format based on country
        const country = countryRegistry.getCountry(entity.country);
        const validator = country?.validators[registration.type];

        if (validator && validator.validate(registration.value)) {
          // Mark as verified in database
          await prisma.entityRegistration.update({
            where: { id: registration.id },
            data: { 
              verifiedAt: new Date(),
              status: "VERIFIED",
            },
          });
          verifiedRegistrations.push(registration.type);
        } else {
          verificationFailed = true;
          failureReason = `Invalid ${registration.type} format`;
          
          // Record verification attempt failure
          await prisma.verificationAttempt.create({
            data: {
              tenantId: entity.tenantId,
              type: registration.type,
              value: registration.value,
              country: entity.country,
              status: "FAILED",
              result: { reason: failureReason },
            },
          });
          break;
        }
      } catch (error) {
        logger.error("Error verifying registration", {
          entityId,
          registrationType: registration.type,
          error,
        });
        verificationFailed = true;
        failureReason = "Verification service error";
        break;
      }
    }

    // Update final state
    if (verificationFailed) {
      state = await updateVerificationState(entityId, {
        status: "VERIFICATION_FAILED",
        failureReason,
        completedAt: new Date(),
        verifiedRegistrations,
      });
      
      // Emit audit event
      await prisma.auditEvent.create({
        data: {
          tenantId: entity.tenantId,
          userId: "system",
          type: "entity.setup.verification.failed",
          resource: "entity",
          details: {
            entityId,
            reason: failureReason,
          },
        },
      });
    } else {
      // Mark entity as verified and active
      await prisma.entity.update({
        where: { id: entityId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
        },
      });

      state = await updateVerificationState(entityId, {
        status: "VERIFIED_SUCCESS",
        completedAt: new Date(),
        verifiedRegistrations,
      });

      // Emit audit event
      await prisma.auditEvent.create({
        data: {
          tenantId: entity.tenantId,
          userId: "system",
          type: "entity.setup.verification.success",
          resource: "entity",
          details: {
            entityId,
            verifiedRegistrations,
          },
        },
      });
    }

    logger.info("Entity verification completed", {
      entityId,
      status: state.status,
      verifiedCount: verifiedRegistrations.length,
    });

    return state;
  } catch (error) {
    logger.error("Unexpected error in entity verification", { entityId, error });
    
    const state = await updateVerificationState(entityId, {
      status: "VERIFICATION_FAILED",
      failureReason: "Unexpected error during verification",
      completedAt: new Date(),
    });
    
    return state;
  }
}

/**
 * Mark entity for manual review
 */
export async function markForManualReview(
  entityId: string,
  reason: string
): Promise<VerificationJobState | null> {
  const state = await updateVerificationState(entityId, {
    status: "MANUAL_REVIEW",
    failureReason: reason,
    completedAt: new Date(),
  });

  if (state) {
    // Create support case for manual review
    await createManualReviewCase(entityId, reason);
  }

  return state;
}

/**
 * Publish event to Redis pubsub channel
 */
export async function publishEvent(
  eventType: string,
  payload: VerificationJobState | Record<string, unknown>
): Promise<void> {
  try {
    const event = JSON.stringify({
      type: eventType,
      timestamp: new Date().toISOString(),
      ...payload,
    });
    
    await redis.publish(JOB_CHANNEL, event);
  } catch (error) {
    logger.error("Failed to publish verification event", { eventType, error });
  }
}

/**
 * Enqueue verification job
 */
export async function enqueueVerificationJob(entityId: string): Promise<void> {
  try {
    await redis.rpush(JOB_QUEUE, JSON.stringify({ entityId }));
    logger.info("Verification job enqueued", { entityId });
  } catch (error) {
    logger.error("Failed to enqueue verification job", { entityId, error });
    throw error;
  }
}

/**
 * Dequeue and process next verification job
 */
export async function processNextVerificationJob(): Promise<VerificationJobState | null> {
  try {
    const job = await redis.lpop(JOB_QUEUE);
    if (!job) return null;

    const { entityId } = JSON.parse(job as string);
    
    logger.info("Processing verification job", { entityId });
    
    // Run verification
    const result = await verifyEntityRegistrations(entityId);
    
    return result;
  } catch (error) {
    logger.error("Error processing verification job", { error });
    return null;
  }
}

/**
 * Get job status with expiry calculation
 */
export async function getJobStatus(entityId: string): Promise<{
  state: VerificationJobState | null;
  expiresIn: number; // seconds until expiry
} | null> {
  try {
    const state = await getVerificationState(entityId);
    if (!state) return null;

    // Get TTL from Redis
    const key = `${JOB_STATE_PREFIX}${entityId}`;
    const ttl = await redis.ttl(key);

    return {
      state,
      expiresIn: Math.max(0, ttl || 0),
    };
  } catch (error) {
    logger.error("Error getting job status", { entityId, error });
    return null;
  }
}

/**
 * Helper: Create manual review case in messaging system
 */
async function createManualReviewCase(
  entityId: string,
  reason: string
): Promise<void> {
  try {
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) return;

    // Create a support case/message thread
    // This would integrate with the messaging system once it's built
    logger.info("Manual review case created for entity", {
      entityId,
      reason,
    });
  } catch (error) {
    logger.error("Error creating manual review case", { entityId, error });
  }
}

/**
 * Cleanup expired verification jobs
 */
export async function cleanupExpiredJobs(): Promise<number> {
  try {
    // Redis automatically expires keys based on setex TTL
    // This is a placeholder for any additional cleanup logic
    logger.info("Verification job cleanup completed");
    return 0;
  } catch (error) {
    logger.error("Error cleaning up expired jobs", { error });
    return 0;
  }
}
