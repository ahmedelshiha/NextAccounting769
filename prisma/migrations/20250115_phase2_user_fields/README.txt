Phase 2: Add Missing User Fields
=================================

Timestamp: 2025-01-15

Purpose
-------
Complete the User model by adding 3 missing fields that are defined in the Prisma schema but were not yet migrated to the database:
- tier: Client tier classification (INDIVIDUAL, SMB, ENTERPRISE)
- certifications: Array of professional certifications
- experienceYears: Years of professional experience

Changes
-------
1. Added "tier" column (TEXT, nullable) to "users" table
   - Supports client tier classification
   - Index added for improved query performance

2. Added "certifications" column (TEXT[], default '{}') to "users" table
   - Array field for storing multiple certification names
   - Defaults to empty array

3. Added "experienceYears" column (INTEGER, nullable) to "users" table
   - Stores years of experience as integer
   - Index added for filtering and sorting operations

Indexes Added
-------------
- users_tier_idx: On "tier" column for client classification queries
- users_experienceYears_idx: On "experienceYears" column for experience-based filtering

Related Tasks
-------------
- Phase 2: Modal Consolidation & Testing
- RbacTab consolidation with new tabs (Hierarchy, Test Access, Conflicts)
- Enhanced user classification and team management capabilities

Rollback
--------
If needed, run:
ALTER TABLE "users" DROP COLUMN IF EXISTS "tier";
ALTER TABLE "users" DROP COLUMN IF EXISTS "certifications";
ALTER TABLE "users" DROP COLUMN IF EXISTS "experienceYears";
DROP INDEX IF EXISTS "users_tier_idx";
DROP INDEX IF EXISTS "users_experienceYears_idx";

Type Safety
-----------
The Prisma schema already includes these fields with proper types:
- tier?: String
- certifications: String[]
- experienceYears?: Int

This migration aligns the database schema with the Prisma schema definition.
