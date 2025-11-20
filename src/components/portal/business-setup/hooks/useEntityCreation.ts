/**
 * useEntityCreation Hook - Entity Creation Logic
 * Custom hook for creating entities
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { SetupFormData } from "../types/setup";

export function useEntityCreation() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEntity = useCallback(async (data: SetupFormData) => {
    try {
      setIsCreating(true);
      setError(null);

      // Generate idempotency key
      const idempotencyKey = `setup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch("/api/entities/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          idempotencyKey,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create entity");
      }

      toast.success("Business account created successfully!");
      return result.data.entityId;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create entity";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    createEntity,
    isCreating,
    error,
  };
}
