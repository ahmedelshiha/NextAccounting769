/**
 * New Startup - Validation Schema
 * Zod schema for new startup setup
 */

import { z } from "zod";

export const newStartupSchema = z.object({
  country: z.enum(["AE", "SA", "EG"], {
    required_error: "Country is required",
  }),
  businessName: z
    .string()
    .min(1, "Business name is required")
    .max(200, "Business name is too long"),
  economicZoneId: z.string().min(1, "Economic zone is required"),
  legalForm: z.string().min(1, "Legal form is required"),
  activityCode: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type NewStartupInput = z.infer<typeof newStartupSchema>;
