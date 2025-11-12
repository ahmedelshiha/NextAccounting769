-- Phase 1: Entity Management - Create tables for entities, registrations, obligations, and compliance
-- This migration adds core data models for multi-country entity and tax filing management

-- Create economic zones table
CREATE TABLE IF NOT EXISTS "economic_zones" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "country" VARCHAR(2) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "authorityCode" VARCHAR(50),
  "city" VARCHAR(100),
  "region" VARCHAR(100),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "economic_zones_country_name_key" UNIQUE("country", "name")
);

-- Create entities table
CREATE TABLE IF NOT EXISTS "entities" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "country" VARCHAR(2) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "legalForm" VARCHAR(50),
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "fiscalYearStart" TIMESTAMP(3),
  "registrationCertUrl" TEXT,
  "registrationCertHash" TEXT,
  "activityCode" VARCHAR(20),
  "parentEntityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT,

  CONSTRAINT "entities_tenantId_name_key" UNIQUE("tenantId", "name"),
  CONSTRAINT "entities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "entities_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "entities_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "entities_parentEntityId_fkey" FOREIGN KEY ("parentEntityId") REFERENCES "entities"("id") ON DELETE SET NULL
);

CREATE INDEX "entities_tenantId_country_idx" ON "entities"("tenantId", "country");
CREATE INDEX "entities_tenantId_status_idx" ON "entities"("tenantId", "status");
CREATE INDEX "entities_createdAt_idx" ON "entities"("createdAt");
CREATE INDEX "entities_tenantId_createdAt_idx" ON "entities"("tenantId", "createdAt");

-- Create entity licenses table
CREATE TABLE IF NOT EXISTS "entity_licenses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityId" TEXT NOT NULL,
  "country" VARCHAR(2) NOT NULL,
  "authority" VARCHAR(100) NOT NULL,
  "licenseNumber" VARCHAR(100) NOT NULL,
  "legalForm" VARCHAR(50),
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "economicZoneId" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),

  CONSTRAINT "entity_licenses_entityId_country_licenseNumber_key" UNIQUE("entityId", "country", "licenseNumber"),
  CONSTRAINT "entity_licenses_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE,
  CONSTRAINT "entity_licenses_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE,
  CONSTRAINT "entity_licenses_economicZoneId_fkey" FOREIGN KEY ("economicZoneId") REFERENCES "economic_zones"("id") ON DELETE SET NULL
);

CREATE INDEX "entity_licenses_entityId_idx" ON "entity_licenses"("entityId");
CREATE INDEX "entity_licenses_status_idx" ON "entity_licenses"("status");
CREATE INDEX "entity_licenses_createdAt_idx" ON "entity_licenses"("createdAt");

-- Create entity registrations table (TRN, ZATCA, ETA, etc.)
CREATE TABLE IF NOT EXISTS "entity_registrations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityId" TEXT NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "value" VARCHAR(100) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "source" VARCHAR(50),
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "entity_registrations_entityId_type_key" UNIQUE("entityId", "type"),
  CONSTRAINT "entity_registrations_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE
);

CREATE INDEX "entity_registrations_entityId_idx" ON "entity_registrations"("entityId");
CREATE INDEX "entity_registrations_status_idx" ON "entity_registrations"("status");
CREATE INDEX "entity_registrations_createdAt_idx" ON "entity_registrations"("createdAt");

-- Create obligations table (VAT, Corporate Tax, ESR, Zakat, etc.)
CREATE TABLE IF NOT EXISTS "obligations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityId" TEXT NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "country" VARCHAR(2) NOT NULL,
  "frequency" VARCHAR(20) NOT NULL,
  "ruleConfig" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "obligations_entityId_type_country_key" UNIQUE("entityId", "type", "country"),
  CONSTRAINT "obligations_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE
);

CREATE INDEX "obligations_entityId_idx" ON "obligations"("entityId");
CREATE INDEX "obligations_country_idx" ON "obligations"("country");
CREATE INDEX "obligations_type_idx" ON "obligations"("type");

-- Create filing periods table (specific filing deadlines)
CREATE TABLE IF NOT EXISTS "filing_periods" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "obligationId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
  "assigneeId" TEXT,
  "snoozeUntil" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "filing_periods_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "obligations"("id") ON DELETE CASCADE,
  CONSTRAINT "filing_periods_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "filing_periods_obligationId_idx" ON "filing_periods"("obligationId");
CREATE INDEX "filing_periods_status_idx" ON "filing_periods"("status");
CREATE INDEX "filing_periods_dueAt_idx" ON "filing_periods"("dueAt");
CREATE INDEX "filing_periods_assigneeId_idx" ON "filing_periods"("assigneeId");

-- Create consents table
CREATE TABLE IF NOT EXISTS "consents" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "entityId" TEXT,
  "userId" TEXT,
  "type" VARCHAR(50) NOT NULL,
  "version" VARCHAR(20) NOT NULL,
  "acceptedBy" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip" VARCHAR(45),
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "consents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "consents_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE SET NULL,
  CONSTRAINT "consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "consents_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "users"("id")
);

CREATE INDEX "consents_tenantId_idx" ON "consents"("tenantId");
CREATE INDEX "consents_entityId_idx" ON "consents"("entityId");
CREATE INDEX "consents_acceptedBy_idx" ON "consents"("acceptedBy");
CREATE INDEX "consents_createdAt_idx" ON "consents"("createdAt");

-- Create verification attempts table
CREATE TABLE IF NOT EXISTS "verification_attempts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "value" VARCHAR(255) NOT NULL,
  "country" VARCHAR(2) NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "result" JSONB,
  "attemptedBy" TEXT,
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "correlationId" VARCHAR(100),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "verification_attempts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "verification_attempts_attemptedBy_fkey" FOREIGN KEY ("attemptedBy") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "verification_attempts_tenantId_idx" ON "verification_attempts"("tenantId");
CREATE INDEX "verification_attempts_status_idx" ON "verification_attempts"("status");
CREATE INDEX "verification_attempts_createdAt_idx" ON "verification_attempts"("createdAt");
CREATE INDEX "verification_attempts_correlationId_idx" ON "verification_attempts"("correlationId");

-- Create entity audit logs table
CREATE TABLE IF NOT EXISTS "entity_audit_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "changes" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "entity_audit_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE,
  CONSTRAINT "entity_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id")
);

CREATE INDEX "entity_audit_logs_entityId_idx" ON "entity_audit_logs"("entityId");
CREATE INDEX "entity_audit_logs_userId_idx" ON "entity_audit_logs"("userId");
CREATE INDEX "entity_audit_logs_action_idx" ON "entity_audit_logs"("action");
CREATE INDEX "entity_audit_logs_createdAt_idx" ON "entity_audit_logs"("createdAt");

-- Create indexes for economic zones
CREATE INDEX "economic_zones_country_idx" ON "economic_zones"("country");
CREATE INDEX "economic_zones_city_idx" ON "economic_zones"("city");
