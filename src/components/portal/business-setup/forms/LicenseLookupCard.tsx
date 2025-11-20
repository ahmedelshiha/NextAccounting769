/**
 * LicenseLookupCard - Form Component
 * License lookup UI component
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle2, XCircle } from "lucide-react";
import type { LicenseLookupResult } from "../types/setup";

interface LicenseLookupCardProps {
  result: LicenseLookupResult | null;
  isLooking: boolean;
  onLookup: () => void;
  disabled?: boolean;
}

export function LicenseLookupCard({
  result,
  isLooking,
  onLookup,
  disabled = false,
}: LicenseLookupCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">License Verification</CardTitle>
        <CardDescription>
          Verify your business license with the registry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          onClick={onLookup}
          disabled={isLooking || disabled}
          variant="outline"
          className="w-full"
        >
          {isLooking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Looking up...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Verify License
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-2">
            {result.found ? (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">License Found</span>
                </div>
                {result.businessName && (
                  <p className="text-sm text-gray-600">
                    <strong>Business:</strong> {result.businessName}
                  </p>
                )}
                {result.status && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge variant="outline">{result.status}</Badge>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-orange-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">License not found in registry</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
