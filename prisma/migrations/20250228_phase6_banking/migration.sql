-- CreateTable "banking_connections"
CREATE TABLE "banking_connections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityId" TEXT,
    "provider" TEXT NOT NULL,
    "accountNumber" VARCHAR(255) NOT NULL,
    "bankName" VARCHAR(255) NOT NULL,
    "accountType" VARCHAR(50) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "sessionToken" TEXT,
    "syncFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "credentials" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banking_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable "banking_transactions"
CREATE TABLE "banking_transactions" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "type" TEXT NOT NULL,
    "balance" DECIMAL(19,4),
    "reference" TEXT,
    "tags" TEXT[],
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "matchedToId" TEXT,
    "matchedToType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banking_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banking_connections_tenantId_idx" ON "banking_connections"("tenantId");

-- CreateIndex
CREATE INDEX "banking_connections_status_idx" ON "banking_connections"("status");

-- CreateIndex
CREATE INDEX "banking_connections_lastSyncAt_idx" ON "banking_connections"("lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "banking_transactions_connectionId_externalId_key" ON "banking_transactions"("connectionId", "externalId");

-- CreateIndex
CREATE INDEX "banking_transactions_tenantId_idx" ON "banking_transactions"("tenantId");

-- CreateIndex
CREATE INDEX "banking_transactions_connectionId_idx" ON "banking_transactions"("connectionId");

-- CreateIndex
CREATE INDEX "banking_transactions_date_idx" ON "banking_transactions"("date");

-- CreateIndex
CREATE INDEX "banking_transactions_matched_idx" ON "banking_transactions"("matched");

-- AddForeignKey
ALTER TABLE "banking_connections" ADD CONSTRAINT "banking_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banking_transactions" ADD CONSTRAINT "banking_transactions_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "banking_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banking_transactions" ADD CONSTRAINT "banking_transactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
