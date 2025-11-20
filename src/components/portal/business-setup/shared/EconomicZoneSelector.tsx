/**
 * EconomicZoneSelector - Shared Component
 * Reusable economic zone selection dropdown
 */

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getEconomicZonesByCountry } from "../constants/economicZones";
import type { Country } from "../types/setup";

interface EconomicZoneSelectorProps {
  country: Country;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export function EconomicZoneSelector({
  country,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
}: EconomicZoneSelectorProps) {
  const zones = getEconomicZonesByCountry(country);

  return (
    <div className="space-y-2">
      <Label htmlFor="economicZone">
        Economic Zone {required && "*"}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="economicZone">
          <SelectValue placeholder="Select economic zone" />
        </SelectTrigger>
        <SelectContent>
          {zones.map((zone) => (
            <SelectItem key={zone.id} value={zone.id}>
              {zone.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
