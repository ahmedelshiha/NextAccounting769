/**
 * Countries - Constants
 * Country data for Business Setup
 */

import type { Country } from "../types/setup";

export interface CountryInfo {
  code: Country;
  name: string;
  flag: string;
}

export const countries: CountryInfo[] = [
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
];

export const getCountryName = (code: Country): string => {
  return countries.find((c) => c.code === code)?.name || code;
};

export const getCountryFlag = (code: Country): string => {
  return countries.find((c) => c.code === code)?.flag || "";
};
