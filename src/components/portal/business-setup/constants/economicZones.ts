/**
 * Economic Zones - Constants
 * Economic zones data for UAE, KSA, and Egypt
 */

import type { EconomicZone, Country } from "../types/setup";

export const economicZones: Record<Country, EconomicZone[]> = {
  AE: [
    { id: "ded", name: "Abu Dhabi Department of Economic Development (DED)", country: "AE" },
    { id: "difc", name: "Dubai International Financial Centre (DIFC)", country: "AE" },
    { id: "dtec", name: "Dubai Technology & Enterprise Campus (DTEC)", country: "AE" },
    { id: "jafza", name: "Jebel Ali Free Zone (JAFZA)", country: "AE" },
    { id: "adgm", name: "Abu Dhabi Global Market (ADGM)", country: "AE" },
  ],
  SA: [
    { id: "riyadh", name: "Riyadh Chamber of Commerce", country: "SA" },
    { id: "jeddah", name: "Jeddah Chamber of Commerce", country: "SA" },
    { id: "dmmh", name: "Dammam Chamber of Commerce", country: "SA" },
    { id: "neom", name: "NEOM Economic Zone", country: "SA" },
  ],
  EG: [
    { id: "cairo", name: "Cairo", country: "EG" },
    { id: "giza", name: "Giza", country: "EG" },
    { id: "alex", name: "Alexandria", country: "EG" },
    { id: "suez", name: "Suez Canal Zone", country: "EG" },
  ],
};

export const getEconomicZonesByCountry = (country: Country): EconomicZone[] => {
  return economicZones[country] || [];
};
