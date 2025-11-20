/**
 * BillUpload Component - Upload Container
 * Main container for bill upload functionality
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera } from "lucide-react";
import { UploadModal } from "./UploadModal";

interface BillUploadProps {
  onUploadComplete?: () => void;
}

export function BillUpload({ onUploadComplete }: BillUploadProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "camera">("file");

  const handleOpenUpload = (mode: "file" | "camera") => {
    setUploadMode(mode);
    setUploadModalOpen(true);
  };

  return (
    <>
      <div className="flex gap-3">
        <Button onClick={() => handleOpenUpload("file")}>
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
        <Button variant="outline" onClick={() => handleOpenUpload("camera")}>
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </Button>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        mode={uploadMode}
        onUploadComplete={() => {
          setUploadModalOpen(false);
          onUploadComplete?.();
        }}
      />
    </>
  );
}
