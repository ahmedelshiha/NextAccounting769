/**
 * LegalFormSelector - Shared Component
 * Reusable legal form selection dropdown
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
import { getLegalFormsByCountry } from "../constants/legalForms";
import type { Country } from "../types/setup";

interface LegalFormSelectorProps {
  country: Country;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export function LegalFormSelector({
  country,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
}: LegalFormSelectorProps) {
  const forms = getLegalFormsByCountry(country);

  return (
    <div className="space-y-2">
      <Label htmlFor="legalForm">
        Legal Form {required && "*"}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="legalForm">
          <SelectValue placeholder="Select legal form" />
        </SelectTrigger>
        <SelectContent>
          {forms.map((form) => (
            <SelectItem key={form.id} value={form.id}>
              {form.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
