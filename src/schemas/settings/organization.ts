import { z } from 'zod'

export const OrgGeneralSchema = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(200).default(''),
  description: z.string().max(2000).default(''),
  industry: z.string().max(120).default('')
})

export const OrgContactSchema = z.object({
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  }).optional()
})

export const OrgLocalizationSchema = z.object({
  defaultTimezone: z.string().default('UTC'),
  defaultCurrency: z.string().default('USD'),
  defaultLocale: z.string().default('en')
})

export const OrgBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  branding: z.record(z.string(), z.any()).optional(),
  // Backwards-compatible JSON blob (deprecated in favor of explicit URL fields)
  legalLinks: z.object({
    terms: z.string().url().optional(),
    privacy: z.string().url().optional(),
    refund: z.string().url().optional(),
  }).strict().optional(),
  // Explicit fields stored in DB for easier validation and querying
  termsUrl: z.string().url().optional(),
  privacyUrl: z.string().url().optional(),
  refundUrl: z.string().url().optional(),
})

export const OrganizationSettingsSchema = z.object({
  general: OrgGeneralSchema.optional(),
  contact: OrgContactSchema.optional(),
  localization: OrgLocalizationSchema.optional(),
  branding: OrgBrandingSchema.optional()
})

export type OrganizationSettings = z.infer<typeof OrganizationSettingsSchema>
