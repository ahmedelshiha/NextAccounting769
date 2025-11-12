-- Phase 2 Part 2: Add remaining User fields
-- Purpose: Add workingHours, bookingBuffer, autoAssign fields for team scheduling and automation
-- These fields complete the User model enhancements for Phase 2

-- Add workingHours field (JSON: team working hours schedule)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='workingHours') THEN
      ALTER TABLE "users" ADD COLUMN "workingHours" JSONB DEFAULT NULL;
    END IF;
  END IF;
END $$;

-- Add bookingBuffer field (INTEGER: minutes buffer between bookings)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bookingBuffer') THEN
      ALTER TABLE "users" ADD COLUMN "bookingBuffer" INTEGER DEFAULT NULL;
    END IF;
  END IF;
END $$;

-- Add autoAssign field (BOOLEAN: auto-assignment toggle)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='autoAssign') THEN
      ALTER TABLE "users" ADD COLUMN "autoAssign" BOOLEAN DEFAULT NULL;
    END IF;
  END IF;
END $$;

-- Create index for bookingBuffer (common filter for scheduling)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bookingBuffer') THEN
      CREATE INDEX IF NOT EXISTS "users_bookingBuffer_idx" ON "users" ("bookingBuffer");
    END IF;
  END IF;
END $$;
