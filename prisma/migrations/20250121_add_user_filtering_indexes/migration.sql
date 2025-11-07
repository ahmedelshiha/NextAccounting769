-- Phase 4.3: Database Optimization - Add indexes for server-side filtering
-- Purpose: Optimize queries for frequently filtered user attributes (status, department, tier, experienceYears)
-- Impact: Significant query performance improvement for large datasets (10,000+ users)
-- Backward compatible: Yes - purely additive change

-- Add single-column indexes for frequently filtered fields
CREATE INDEX IF NOT EXISTS "users_tenantId_status_idx" ON "users"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "users_tenantId_department_idx" ON "users"("tenantId", "department");
CREATE INDEX IF NOT EXISTS "users_tenantId_tier_idx" ON "users"("tenantId", "tier");
CREATE INDEX IF NOT EXISTS "users_tenantId_experienceYears_idx" ON "users"("tenantId", "experienceYears");

-- Add composite indexes for common filter + sort combinations
CREATE INDEX IF NOT EXISTS "users_tenantId_status_createdAt_idx" ON "users"("tenantId", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "users_tenantId_role_createdAt_idx" ON "users"("tenantId", "role", "createdAt" DESC);

-- Note: These indexes improve query performance for:
-- 1. Filtering by status: WHERE tenantId = X AND status = Y
-- 2. Filtering by department: WHERE tenantId = X AND department = Y
-- 3. Filtering by tier: WHERE tenantId = X AND tier = Y
-- 4. Filtering by experience range: WHERE tenantId = X AND experienceYears >= Y
-- 5. Complex filters with sorting: WHERE tenantId = X AND status = Y ORDER BY createdAt DESC
