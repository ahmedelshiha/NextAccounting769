-- CreateTable "knowledge_base_categories"
CREATE TABLE "knowledge_base_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable "knowledge_base_articles"
CREATE TABLE "knowledge_base_articles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" VARCHAR(1000),
    "authorId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "relatedArticleIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "knowledge_base_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_categories_tenantId_slug_key" ON "knowledge_base_categories"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "knowledge_base_categories_tenantId_idx" ON "knowledge_base_categories"("tenantId");

-- CreateIndex
CREATE INDEX "knowledge_base_categories_published_idx" ON "knowledge_base_categories"("published");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_articles_tenantId_slug_key" ON "knowledge_base_articles"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_tenantId_idx" ON "knowledge_base_articles"("tenantId");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_categoryId_idx" ON "knowledge_base_articles"("categoryId");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_authorId_idx" ON "knowledge_base_articles"("authorId");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_published_idx" ON "knowledge_base_articles"("published");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_featured_idx" ON "knowledge_base_articles"("featured");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_tags_idx" ON "knowledge_base_articles" USING GIN("tags");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_createdAt_idx" ON "knowledge_base_articles"("createdAt");

-- AddForeignKey
ALTER TABLE "knowledge_base_categories" ADD CONSTRAINT "knowledge_base_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "knowledge_base_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
