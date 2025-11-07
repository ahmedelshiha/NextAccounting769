-- Phase 2: Add missing User fields
-- Purpose: Add tier, certifications, experienceYears fields for enhanced user classification and team capabilities
-- These fields support improved user management and reporting in the RbacTab consolidation

-- Add tier field (client tier: INDIVIDUAL, SMB, ENTERPRISE)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tier') THEN
      ALTER TABLE "users" ADD COLUMN "tier" TEXT DEFAULT NULL;
    END IF;
  END IF;
END $$;

-- Add certifications field (array of certification names)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='certifications') THEN
      ALTER TABLE "users" ADD COLUMN "certifications" TEXT[] DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- Add experienceYears field (years of professional experience)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='experienceYears') THEN
      ALTER TABLE "users" ADD COLUMN "experienceYears" INTEGER DEFAULT NULL;
    END IF;
  END IF;
END $$;

-- Create indexes for improved query performance
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tier') THEN
      CREATE INDEX IF NOT EXISTS "users_tier_idx" ON "users" ("tier");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='experienceYears') THEN
      CREATE INDEX IF NOT EXISTS "users_experienceYears_idx" ON "users" ("experienceYears");
    END IF;
  END IF;
END $$;
