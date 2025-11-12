"use client";

import { useEffect, useState, useCallback } from "react";
import type { CsvImportResult } from "@/lib/jobs/csv-import";

interface UseCsvImportStatusOptions {
  jobId: string | null;
  enabled?: boolean;
  pollInterval?: number;
  maxWaitTime?: number;
}

export function useCsvImportStatus({
  jobId,
  enabled = true,
  pollInterval = 2000, // 2 seconds
  maxWaitTime = 300000, // 5 minutes
}: UseCsvImportStatusOptions) {
  const [status, setStatus] = useState<CsvImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!jobId || !enabled) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/entities/import-csv/status?jobId=${encodeURIComponent(jobId)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch job status");
      }

      const data = await response.json();
      if (data.success && data.data) {
        const jobStatus = data.data as CsvImportResult;
        setStatus(jobStatus);

        // Calculate progress percentage
        if (jobStatus.totalRows > 0) {
          const percent = Math.round(
            ((jobStatus.successCount + jobStatus.failureCount) / jobStatus.totalRows) * 100
          );
          setProgress(percent);
        }

        // Check if job is complete
        if (
          jobStatus.status === "SUCCESS" ||
          jobStatus.status === "PARTIAL_SUCCESS" ||
          jobStatus.status === "FAILED"
        ) {
          setIsComplete(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setIsLoading(false);
    }
  }, [jobId, enabled]);

  useEffect(() => {
    if (!jobId || !enabled) return;

    // Fetch immediately
    fetchStatus();

    // Set up polling
    const startTime = Date.now();
    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > maxWaitTime) {
        clearInterval(interval);
        setError("Job timeout: taking longer than expected");
        return;
      }

      await fetchStatus();
    }, pollInterval);

    // Stop polling when job is complete
    return () => clearInterval(interval);
  }, [jobId, enabled, fetchStatus, pollInterval, maxWaitTime]);

  return {
    status,
    isLoading,
    error,
    progress,
    isComplete,
    refetch: fetchStatus,
  };
}
