-- CreateTable "user_payment_methods"
CREATE TABLE "user_payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last4" TEXT,
    "brand" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "fingerprint" TEXT,
    "billingDetails" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_payment_methods_paymentMethodId_key" ON "user_payment_methods"("paymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "user_payment_methods_userId_paymentMethodId_key" ON "user_payment_methods"("userId", "paymentMethodId");

-- CreateIndex
CREATE INDEX "user_payment_methods_userId_idx" ON "user_payment_methods"("userId");

-- CreateIndex
CREATE INDEX "user_payment_methods_tenantId_idx" ON "user_payment_methods"("tenantId");

-- CreateIndex
CREATE INDEX "user_payment_methods_isDefault_idx" ON "user_payment_methods"("isDefault");

-- CreateIndex
CREATE INDEX "user_payment_methods_status_idx" ON "user_payment_methods"("status");

-- AddForeignKey
ALTER TABLE "user_payment_methods" ADD CONSTRAINT "user_payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_payment_methods" ADD CONSTRAINT "user_payment_methods_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
