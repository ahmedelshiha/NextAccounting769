Phase 2: Add Remaining User Fields (Part 2)
============================================

Timestamp: 2025-01-15

Purpose
-------
Complete the User model by adding the remaining 3 missing fields that are defined in the Prisma schema:
- workingHours: JSON object for team working hours schedule
- bookingBuffer: Integer representing minutes buffer between bookings
- autoAssign: Boolean toggle for automatic task assignment

Related to Phase 2 of admin/users consolidation and RbacTab enhancement.

Changes
-------
1. Added "workingHours" column (JSONB, nullable) to "users" table
   - Stores team working hours schedule as JSON object
   - Example: {"monday": {"start": "09:00", "end": "17:00"}, ...}
   - No index needed (non-query-critical)

2. Added "bookingBuffer" column (INTEGER, nullable) to "users" table
   - Stores minutes buffer between bookings (e.g., 15 minutes)
   - Index added for scheduling queries
   - Supports filtering by buffer duration

3. Added "autoAssign" column (BOOLEAN, nullable) to "users" table
   - Toggle for automatic task/booking assignment
   - Helps with workflow automation

Indexes Added
-------------
- users_bookingBuffer_idx: On "bookingBuffer" column for scheduling queries

Related Tasks
-------------
- Phase 2: Modal Consolidation & Testing
- Phase 2: Database Schema Completion
- RbacTab consolidation with 4 functional tabs
- Team member scheduling and automation features

Database Dependencies
---------------------
Note: This migration is Part 2 of the Phase 2 User Fields migration.
Part 1 (20250115_phase2_user_fields) added: tier, certifications, experienceYears

Together they complete all 6 missing User fields as defined in Prisma schema.

Rollback
--------
If needed, run:
ALTER TABLE "users" DROP COLUMN IF EXISTS "workingHours";
ALTER TABLE "users" DROP COLUMN IF EXISTS "bookingBuffer";
ALTER TABLE "users" DROP COLUMN IF EXISTS "autoAssign";
DROP INDEX IF EXISTS "users_bookingBuffer_idx";

Type Safety
-----------
The Prisma schema already includes these fields with proper types:
- workingHours?: Json
- bookingBuffer?: Int
- autoAssign?: Boolean

This migration aligns the database schema with the Prisma schema definition.

Deployment Notes
----------------
- Both Part 1 and Part 2 migrations should be applied in sequence
- No data migration needed (all columns are nullable/have defaults)
- Safe to deploy to production without downtime
- Zero breaking changes to existing queries
