-- Add composite indexes for server-side filtering optimization
-- These indexes support efficient filtering on email, name, status fields

DO $$
BEGIN
  -- Add index for email search (supports ILIKE queries)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'idx_users_tenantid_email'
  ) THEN
    CREATE INDEX idx_users_tenantid_email ON "users" ("tenantId", "email");
  END IF;

  -- Add index for name search (supports ILIKE queries)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'idx_users_tenantid_name'
  ) THEN
    CREATE INDEX idx_users_tenantid_name ON "users" ("tenantId", "name");
  END IF;

  -- Add composite index for role + status filtering
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'idx_users_tenantid_role_status'
  ) THEN
    CREATE INDEX idx_users_tenantid_role_status ON "users" ("tenantId", "role", "availabilityStatus");
  END IF;

  -- Add composite index for tier filtering
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'idx_users_tenantid_tier_created'
  ) THEN
    CREATE INDEX idx_users_tenantid_tier_created ON "users" ("tenantId", "tier", "createdAt" DESC);
  END IF;

  -- Add composite index for department filtering
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'idx_users_tenantid_department_created'
  ) THEN
    CREATE INDEX idx_users_tenantid_department_created ON "users" ("tenantId", "department", "createdAt" DESC);
  END IF;

  -- Add index for sorting by email (case-insensitive search support)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'idx_users_tenantid_email_lower'
  ) THEN
    CREATE INDEX idx_users_tenantid_email_lower ON "users" ("tenantId", LOWER("email"));
  END IF;

  -- Add index for text search on name + email combined
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'idx_users_tenantid_search'
  ) THEN
    CREATE INDEX idx_users_tenantid_search ON "users" ("tenantId") INCLUDE ("email", "name", "role", "tier", "department");
  END IF;

  RAISE NOTICE 'Phase 4.3: Server-side filtering indexes created successfully';
END $$;
