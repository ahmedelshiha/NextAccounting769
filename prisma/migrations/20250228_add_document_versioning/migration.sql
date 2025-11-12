-- Create DocumentVersion table for tracking document revisions
CREATE TABLE "DocumentVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "attachmentId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "name" TEXT,
  "size" INTEGER,
  "contentType" TEXT,
  "key" TEXT,
  "url" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploaderId" TEXT,
  "changeDescription" TEXT,
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DocumentVersion_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment" ("id") ON DELETE CASCADE,
  CONSTRAINT "DocumentVersion_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE SET NULL,
  CONSTRAINT "DocumentVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX "DocumentVersion_attachmentId_idx" ON "DocumentVersion"("attachmentId");
CREATE INDEX "DocumentVersion_tenantId_idx" ON "DocumentVersion"("tenantId");
CREATE INDEX "DocumentVersion_uploadedAt_idx" ON "DocumentVersion"("uploadedAt");
CREATE UNIQUE INDEX "DocumentVersion_attachmentId_versionNumber_key" ON "DocumentVersion"("attachmentId", "versionNumber");

-- Add documentations table for linking to filings and tasks
CREATE TABLE "DocumentLink" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "attachmentId" TEXT NOT NULL,
  "linkedToType" TEXT NOT NULL,
  "linkedToId" TEXT NOT NULL,
  "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "linkedBy" TEXT,
  "tenantId" TEXT NOT NULL,

  CONSTRAINT "DocumentLink_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment" ("id") ON DELETE CASCADE,
  CONSTRAINT "DocumentLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE
);

-- Create indexes for document links
CREATE INDEX "DocumentLink_attachmentId_idx" ON "DocumentLink"("attachmentId");
CREATE INDEX "DocumentLink_linkedToType_idx" ON "DocumentLink"("linkedToType");
CREATE INDEX "DocumentLink_linkedToId_idx" ON "DocumentLink"("linkedToId");
CREATE INDEX "DocumentLink_tenantId_idx" ON "DocumentLink"("tenantId");
CREATE UNIQUE INDEX "DocumentLink_attachmentId_linkedToType_linkedToId_key" ON "DocumentLink"("attachmentId", "linkedToType", "linkedToId");

-- Add immutable audit trail table
CREATE TABLE "DocumentAuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "attachmentId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "performedBy" TEXT,
  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "tenantId" TEXT NOT NULL,

  CONSTRAINT "DocumentAuditLog_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment" ("id") ON DELETE CASCADE,
  CONSTRAINT "DocumentAuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE
);

-- Create indexes for audit queries
CREATE INDEX "DocumentAuditLog_attachmentId_idx" ON "DocumentAuditLog"("attachmentId");
CREATE INDEX "DocumentAuditLog_performedAt_idx" ON "DocumentAuditLog"("performedAt");
CREATE INDEX "DocumentAuditLog_tenantId_idx" ON "DocumentAuditLog"("tenantId");
CREATE INDEX "DocumentAuditLog_action_idx" ON "DocumentAuditLog"("action");
