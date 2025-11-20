-- CreateTable
CREATE TABLE "user_on_entities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_on_entities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_on_entities_userId_entityId_key" ON "user_on_entities"("userId", "entityId");

-- CreateIndex
CREATE INDEX "user_on_entities_entityId_idx" ON "user_on_entities"("entityId");

-- AddForeignKey
ALTER TABLE "user_on_entities" ADD CONSTRAINT "user_on_entities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_on_entities" ADD CONSTRAINT "user_on_entities_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
