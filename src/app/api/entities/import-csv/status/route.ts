import { NextResponse, type NextRequest } from "next/server";
import { getImportJobStatus } from "@/lib/jobs/csv-import";
import { logger } from "@/lib/logger";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";

export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId } = requireTenantContext();

      const jobId = request.nextUrl.searchParams.get("jobId");
      if (!jobId) {
        return NextResponse.json(
          { error: "Missing jobId parameter" },
          { status: 400 }
        );
      }

      // Get job status
      const status = await getImportJobStatus(jobId);

      if (!status) {
        return NextResponse.json(
          { error: "Job not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error("Failed to get CSV import status", { error });
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get job status",
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
