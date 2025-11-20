/**
 * CountrySelector - Shared Component
 * Reusable country selection dropdown
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
import { countries } from "../constants/countries";
import type { Country } from "../types/setup";

interface CountrySelectorProps {
  value: Country;
  onChange: (value: Country) => void;
  disabled?: boolean;
  error?: string;
}

export function CountrySelector({
  value,
  onChange,
  disabled = false,
  error,
}: CountrySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="country">Country *</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="country">
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
