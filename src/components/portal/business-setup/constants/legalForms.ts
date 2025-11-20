/**
 * Legal Forms - Constants
 * Legal form data for UAE, KSA, and Egypt
 */

import type { LegalForm, Country } from "../types/setup";

export const legalForms: Record<Country, LegalForm[]> = {
  AE: [
    { id: "llc", name: "Limited Liability Company (LLC)", country: "AE" },
    { id: "fze", name: "Free Zone Establishment (FZE)", country: "AE" },
    { id: "fzco", name: "Free Zone Company (FZCO)", country: "AE" },
    { id: "branch", name: "Branch of Foreign Company", country: "AE" },
    { id: "sole", name: "Sole Proprietorship", country: "AE" },
  ],
  SA: [
    { id: "llc", name: "Limited Liability Company (LLC)", country: "SA" },
    { id: "jsc", name: "Joint Stock Company (JSC)", country: "SA" },
    { id: "branch", name: "Branch of Foreign Company", country: "SA" },
    { id: "sole", name: "Sole Proprietorship", country: "SA" },
  ],
  EG: [
    { id: "llc", name: "Limited Liability Company (LLC)", country: "EG" },
    { id: "jsc", name: "Joint Stock Company (JSC)", country: "EG" },
    { id: "branch", name: "Branch of Foreign Company", country: "EG" },
    { id: "sole", name: "Sole Proprietorship", country: "EG" },
  ],
};

export const getLegalFormsByCountry = (country: Country): LegalForm[] => {
  return legalForms[country] || [];
};
