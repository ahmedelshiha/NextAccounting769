-- Phase 4b: Workflow Engine Tables

-- Create workflow status enum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Create workflow step status enum
CREATE TYPE "WorkflowStepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED');

-- Create workflow type enum
CREATE TYPE "WorkflowType" AS ENUM ('ONBOARDING', 'OFFBOARDING', 'ROLE_CHANGE');

-- Create action type enum
CREATE TYPE "StepActionType" AS ENUM ('CREATE_ACCOUNT', 'PROVISION_ACCESS', 'SEND_EMAIL', 'ASSIGN_ROLE', 'DISABLE_ACCOUNT', 'ARCHIVE_DATA', 'REQUEST_APPROVAL', 'SYNC_PERMISSIONS');

-- Create notification status enum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- Create user_workflows table
CREATE TABLE "user_workflows" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" VARCHAR NOT NULL,
  
  "user_id" VARCHAR NOT NULL,
  "workflow_type" "WorkflowType" NOT NULL,
  "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
  
  -- Execution details
  "triggered_by" VARCHAR NOT NULL,
  "approved_by" VARCHAR,
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "scheduled_for" TIMESTAMP,
  
  -- Progress tracking
  "total_steps" INT NOT NULL,
  "completed_steps" INT NOT NULL DEFAULT 0,
  "progress_percent" INT NOT NULL DEFAULT 0,
  
  -- Error handling
  "error_message" TEXT,
  "retry_count" INT DEFAULT 0,
  "last_error_at" TIMESTAMP,
  
  -- Audit
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "due_at" TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT "fk_workflow_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_workflow_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_workflow_triggered_by" FOREIGN KEY ("triggered_by") REFERENCES "users"("id"),
  CONSTRAINT "fk_workflow_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users"("id")
);

-- Create workflow_steps table
CREATE TABLE "workflow_steps" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflow_id" UUID NOT NULL,
  
  "step_number" INT NOT NULL,
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "action_type" "StepActionType" NOT NULL,
  
  "status" "WorkflowStepStatus" NOT NULL DEFAULT 'PENDING',
  
  -- Step configuration (JSON)
  "config" JSONB,
  
  -- Execution details
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "duration_ms" INT,
  
  -- Error handling
  "error_message" TEXT,
  
  -- Human approval
  "requires_approval" BOOLEAN DEFAULT FALSE,
  "approved_at" TIMESTAMP,
  "approved_by" VARCHAR,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT "fk_step_workflow" FOREIGN KEY ("workflow_id") REFERENCES "user_workflows"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_step_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users"("id")
);

-- Create workflow_templates table
CREATE TABLE "workflow_templates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" VARCHAR NOT NULL,
  
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "workflow_type" "WorkflowType" NOT NULL,
  
  -- Template steps (JSON array)
  "steps" JSONB NOT NULL,
  
  -- Configuration
  "requires_approval" BOOLEAN DEFAULT FALSE,
  "approval_emails" TEXT[],
  
  -- Status
  "is_active" BOOLEAN DEFAULT TRUE,
  
  "created_by" VARCHAR NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT "fk_template_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_template_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id")
);

-- Create workflow_notifications table
CREATE TABLE "workflow_notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflow_id" UUID NOT NULL,
  
  "email_to" VARCHAR NOT NULL,
  "email_subject" VARCHAR NOT NULL,
  "email_body" TEXT NOT NULL,
  
  "status" "NotificationStatus" DEFAULT 'PENDING',
  "sent_at" TIMESTAMP,
  "error_message" TEXT,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT "fk_notification_workflow" FOREIGN KEY ("workflow_id") REFERENCES "user_workflows"("id") ON DELETE CASCADE
);

-- Create workflow_history table (for audit trail)
CREATE TABLE "workflow_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflow_id" UUID NOT NULL,
  
  "event_type" VARCHAR NOT NULL,
  "event_description" TEXT,
  "changed_by" VARCHAR NOT NULL,
  
  "old_value" JSONB,
  "new_value" JSONB,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT "fk_history_workflow" FOREIGN KEY ("workflow_id") REFERENCES "user_workflows"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_history_changed_by" FOREIGN KEY ("changed_by") REFERENCES "users"("id")
);

-- Add pending_workflow_id to users table (track current workflow)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pending_workflow_id" UUID REFERENCES "user_workflows"("id");
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_workflow_at" TIMESTAMP;

-- Create indices for performance
CREATE INDEX "idx_workflow_tenant" ON "user_workflows"("tenant_id");
CREATE INDEX "idx_workflow_user" ON "user_workflows"("user_id");
CREATE INDEX "idx_workflow_status" ON "user_workflows"("status");
CREATE INDEX "idx_workflow_type" ON "user_workflows"("workflow_type");
CREATE INDEX "idx_workflow_created" ON "user_workflows"("created_at");
CREATE INDEX "idx_workflow_due" ON "user_workflows"("due_at");

CREATE INDEX "idx_step_workflow" ON "workflow_steps"("workflow_id");
CREATE INDEX "idx_step_status" ON "workflow_steps"("status");
CREATE INDEX "idx_step_created" ON "workflow_steps"("created_at");

CREATE INDEX "idx_template_tenant" ON "workflow_templates"("tenant_id");
CREATE INDEX "idx_template_type" ON "workflow_templates"("workflow_type");
CREATE INDEX "idx_template_active" ON "workflow_templates"("is_active");

CREATE INDEX "idx_notification_workflow" ON "workflow_notifications"("workflow_id");
CREATE INDEX "idx_notification_status" ON "workflow_notifications"("status");

CREATE INDEX "idx_history_workflow" ON "workflow_history"("workflow_id");
CREATE INDEX "idx_history_created" ON "workflow_history"("created_at");
