import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-wrapper";
import { requireTenantContext } from "@/lib/tenant-utils";
import { logger } from "@/lib/logger";

/**
 * Generate iCalendar (ICS) format for compliance filing
 * Allows users to import deadlines into their calendar apps
 */
function generateICS(
  type: string,
  entityName: string,
  dueAt: string,
  description: string
): string {
  const dueDate = new Date(dueAt);
  const now = new Date();

  // Format date as YYYYMMDD for ICS
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  // Format datetime as YYYYMMDDTHHMMSSZ for ICS
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  // Create unique ID
  const uid = `filing-${Date.now()}@taxhub.local`;

  // ICS content
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TaxHub//Tax Compliance Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Tax Compliance Deadlines
X-WR-TIMEZONE:UTC
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDateTime(now)}
DTSTART:${formatDate(dueDate)}
SUMMARY:${type} - ${entityName}
DESCRIPTION:${description || `Tax filing deadline for ${entityName}`}
LOCATION:Online
STATUS:CONFIRMED
SEQUENCE:0
CREATED:${formatDateTime(now)}
LAST-MODIFIED:${formatDateTime(now)}
END:VEVENT
END:VCALENDAR`;

  return ics;
}

/**
 * GET /api/compliance/[id]/export-ics
 * Export compliance filing as ICS (iCalendar) format
 */
const _api_GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const ctx = requireTenantContext();

    if (!ctx.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock compliance data
    // This would be fetched from database in production
    const mockCompliance = {
      type: "VAT Return",
      entityName: "Example Business LLC",
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Monthly VAT return for the United Arab Emirates. File through FTA e-Services.",
    };

    // Generate ICS content
    const icsContent = generateICS(
      mockCompliance.type,
      mockCompliance.entityName,
      mockCompliance.dueAt,
      mockCompliance.description
    );

    logger.info("Compliance filing exported as ICS", {
      filingId: id,
      exportedBy: ctx.userId,
    });

    // Return as downloadable file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar",
        "Content-Disposition": `attachment; filename="tax-filing-${id}.ics"`,
      },
    });
  } catch (error) {
    logger.error("Error exporting compliance filing to ICS", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const GET = withTenantContext(_api_GET, { requireAuth: true });
