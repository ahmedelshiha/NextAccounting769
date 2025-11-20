/**
 * FormActions - Shared Component
 * Reusable form action buttons
 */

"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SwipeToConfirm } from "@/components/ui/SwipeToConfirm";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface FormActionsProps {
  isLoading: boolean;
  isValid: boolean;
  onSubmit: () => void;
  submitText?: string;
}

export function FormActions({
  isLoading,
  isValid,
  onSubmit,
  submitText = "Create Account",
}: FormActionsProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <SwipeToConfirm
        onSwipeComplete={onSubmit}
        disabled={isLoading || !isValid}
        text={submitText}
      />
    );
  }

  return (
    <Button
      type="submit"
      onClick={onSubmit}
      disabled={isLoading || !isValid}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Creating...
        </>
      ) : (
        submitText
      )}
    </Button>
  );
}
