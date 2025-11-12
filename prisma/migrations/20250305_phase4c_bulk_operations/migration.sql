-- CreateEnum for BulkOperationType
CREATE TYPE "BulkOperationType" AS ENUM ('ROLE_CHANGE', 'STATUS_UPDATE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE', 'SEND_EMAIL', 'IMPORT_CSV', 'CUSTOM');

-- CreateEnum for BulkOperationStatus
CREATE TYPE "BulkOperationStatus" AS ENUM ('DRAFT', 'READY', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED');

-- CreateTable bulk_operations
CREATE TABLE "bulk_operations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "BulkOperationType" NOT NULL,
    "userFilter" JSONB,
    "operationConfig" JSONB NOT NULL,
    "status" "BulkOperationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "notifyUsers" BOOLEAN NOT NULL DEFAULT true,
    "dryRunResults" JSONB,
    "totalUsersAffected" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "rollbackAvailable" BOOLEAN NOT NULL DEFAULT true,
    "rollbackUntilDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable bulk_operation_results
CREATE TABLE "bulk_operation_results" (
    "id" TEXT NOT NULL,
    "bulkOperationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "changesBefore" JSONB,
    "changesAfter" JSONB,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_operation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable bulk_operation_history
CREATE TABLE "bulk_operation_history" (
    "id" TEXT NOT NULL,
    "bulkOperationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDescription" TEXT,
    "changedBy" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_operation_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bulk_operations_tenantId_status_createdAt_idx" ON "bulk_operations"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "bulk_operations_createdBy_createdAt_idx" ON "bulk_operations"("createdBy", "createdAt");

-- CreateIndex
CREATE INDEX "bulk_operations_status_idx" ON "bulk_operations"("status");

-- CreateIndex
CREATE INDEX "bulk_operation_results_bulkOperationId_status_idx" ON "bulk_operation_results"("bulkOperationId", "status");

-- CreateIndex
CREATE INDEX "bulk_operation_results_userId_createdAt_idx" ON "bulk_operation_results"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "bulk_operation_history_bulkOperationId_createdAt_idx" ON "bulk_operation_history"("bulkOperationId", "createdAt");

-- AddForeignKey
ALTER TABLE "bulk_operations" ADD CONSTRAINT "bulk_operations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_operations" ADD CONSTRAINT "bulk_operations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_operations" ADD CONSTRAINT "bulk_operations_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_operation_results" ADD CONSTRAINT "bulk_operation_results_bulkOperationId_fkey" FOREIGN KEY ("bulkOperationId") REFERENCES "bulk_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_operation_results" ADD CONSTRAINT "bulk_operation_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_operation_history" ADD CONSTRAINT "bulk_operation_history_bulkOperationId_fkey" FOREIGN KEY ("bulkOperationId") REFERENCES "bulk_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_operation_history" ADD CONSTRAINT "bulk_operation_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
