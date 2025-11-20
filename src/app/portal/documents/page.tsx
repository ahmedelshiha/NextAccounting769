import { Suspense } from "react";
import DocumentsClientPage from "./DocumentsClientPage";
import { Loader2 } from "lucide-react";

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <DocumentsClientPage />
    </Suspense>
  );
}
