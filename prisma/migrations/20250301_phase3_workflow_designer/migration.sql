-- Phase 3 Workflow Designer Models

-- Create workflows table
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create workflow_simulations table
CREATE TABLE "workflow_simulations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "testData" JSONB,
    "executionPath" JSONB NOT NULL DEFAULT '[]',
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workflow_simulations_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows" ("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "workflows_status_createdAt_idx" ON "workflows"("status", "createdAt");
CREATE INDEX "workflows_createdBy_createdAt_idx" ON "workflows"("createdBy", "createdAt");
CREATE INDEX "workflow_simulations_workflowId_createdAt_idx" ON "workflow_simulations"("workflowId", "createdAt");
