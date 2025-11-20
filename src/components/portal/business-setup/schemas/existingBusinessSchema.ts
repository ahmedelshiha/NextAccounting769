/**
 * Existing Business - Validation Schema
 * Zod schema for existing business setup
 */

import { z } from "zod";

export const existingBusinessSchema = z.object({
  country: z.enum(["AE", "SA", "EG"], {
    required_error: "Country is required",
  }),
  licenseNumber: z
    .string()
    .min(3, "License number must be at least 3 characters")
    .max(50, "License number is too long"),
  businessName: z
    .string()
    .min(1, "Business name is required")
    .max(200, "Business name is too long"),
  economicZoneId: z.string().optional(),
  legalForm: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type ExistingBusinessInput = z.infer<typeof existingBusinessSchema>;
