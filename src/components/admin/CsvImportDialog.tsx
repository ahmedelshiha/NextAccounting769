"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportStart?: (jobId: string) => void;
}

type DialogStep = "upload" | "validation" | "processing" | "complete" | "error";

interface ValidationError {
  rowNumber: number;
  data: Record<string, any>;
  error: string;
}

export function CsvImportDialog({ open, onOpenChange, onImportStart }: CsvImportDialogProps) {
  const [step, setStep] = useState<DialogStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationData, setValidationData] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: ValidationError[];
    hasMoreErrors: boolean;
  } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/entities/import-csv?format=template");
      const content = await response.text();
      const blob = new Blob([content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "entities-template.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsLoading(true);
      setStep("validation");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/entities/import-csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success && data.validation) {
        setValidationData(data.validation);
        if (data.validation.invalidRows > 0) {
          toast.error(
            `${data.validation.invalidRows} rows have errors. Please fix them before importing.`
          );
        }
      } else if (data.success) {
        setJobId(data.data.jobId);
        setStep("processing");
        onImportStart?.(data.data.jobId);

        // Auto-complete after a short delay (in production, would poll for job status)
        setTimeout(() => {
          setStep("complete");
        }, 2000);
      } else {
        setErrorMessage(data.error);
        setStep("error");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload CSV"
      );
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setStep("upload");
    setFile(null);
    setValidationData(null);
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (step === "complete") {
      onOpenChange(false);
      handleRetry();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Entities from CSV</DialogTitle>
          <DialogDescription>
            Bulk upload multiple entities at once
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <Upload className="h-8 w-8 mx-auto mb-3 text-gray-600" />
              <p className="font-medium text-gray-900">
                Drag and drop your CSV file here
              </p>
              <p className="text-sm text-gray-600 mt-1">
                or click below to select a file
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>

            {file && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Need a template? {" "}
                <button
                  onClick={handleDownloadTemplate}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Download CSV template
                </button>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Validation Step */}
        {step === "validation" && validationData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-blue-600">
                    {validationData.totalRows}
                  </p>
                  <p className="text-sm text-gray-600">Total Rows</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-green-600">
                    {validationData.validRows}
                  </p>
                  <p className="text-sm text-gray-600">Valid Rows</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold text-red-600">
                    {validationData.invalidRows}
                  </p>
                  <p className="text-sm text-gray-600">Invalid Rows</p>
                </CardContent>
              </Card>
            </div>

            {validationData.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Errors found:</p>
                  <div className="space-y-1 text-sm max-h-48 overflow-auto">
                    {validationData.errors.map((error, index) => (
                      <div key={index} className="bg-red-50 p-2 rounded">
                        <p className="font-mono text-xs">
                          Row {error.rowNumber}: {error.error}
                        </p>
                      </div>
                    ))}
                    {validationData.hasMoreErrors && (
                      <p className="text-gray-600 italic">
                        + More errors not shown
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleRetry}>
                Back
              </Button>
              <Button
                onClick={handleUpload}
                disabled={validationData.invalidRows > 0}
              >
                {validationData.invalidRows > 0
                  ? "Fix Errors and Retry"
                  : "Import"}
              </Button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="space-y-4 py-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
            <div>
              <p className="font-medium">Processing your import...</p>
              <p className="text-sm text-gray-600 mt-1">
                Job ID: {jobId}
              </p>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <div className="space-y-4 py-8 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
            <div>
              <p className="font-medium">Import started successfully!</p>
              <p className="text-sm text-gray-600 mt-1">
                Your entities are being processed. You can track the progress in the entities list.
              </p>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
