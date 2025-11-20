/**
 * Individual - Validation Schema
 * Zod schema for individual setup
 */

import { z } from "zod";

export const individualSchema = z.object({
  country: z.enum(["AE", "SA", "EG"], {
    required_error: "Country is required",
  }),
  businessName: z
    .string()
    .min(1, "Business/Individual name is required")
    .max(200, "Name is too long"),
  economicZoneId: z.string().optional(),
  activityCode: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type IndividualInput = z.infer<typeof individualSchema>;
