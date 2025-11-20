import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface LicenseData {
  number: string;
  name: string;
  authority: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED";
  expiresAt?: string;
  legalForm?: string;
  authorityCode?: string;
}

/**
 * Mock license lookup adapters for each country
 * In production, these would integrate with actual government APIs:
 * - UAE: DED, DIFC, JAFZA, ADGM APIs
 * - KSA: Ministry of Commerce API
 * - Egypt: GAFI / ETA APIs
 */

async function lookupUAELicense(licenseNumber: string): Promise<LicenseData | null> {
  // Mock data - in production, integrate with DED/DIFC/JAFZA APIs
  const mockLicenses: Record<string, LicenseData> = {
    P123456X: {
      number: "P123456X",
      name: "Tech Innovations LLC",
      authority: "DED",
      status: "ACTIVE",
      expiresAt: "2025-12-31",
      legalForm: "LLC",
    },
    P654321Y: {
      number: "P654321Y",
      name: "Global Business Solutions",
      authority: "JAFZA",
      status: "ACTIVE",
      expiresAt: "2026-06-30",
      legalForm: "LLC",
    },
  };

  return mockLicenses[licenseNumber.toUpperCase()] || null;
}

async function lookupSALicense(licenseNumber: string): Promise<LicenseData | null> {
  // Mock data - in production, integrate with Ministry of Commerce
  const mockLicenses: Record<string, LicenseData> = {
    "1010123456": {
      number: "1010123456",
      name: "Saudi Tech Company",
      authority: "Ministry of Commerce",
      status: "ACTIVE",
      expiresAt: "2025-12-31",
      legalForm: "Company",
    },
    "1010654321": {
      number: "1010654321",
      name: "Kingdom Services",
      authority: "Ministry of Commerce",
      status: "ACTIVE",
      expiresAt: "2026-06-30",
      legalForm: "Limited Partnership",
    },
  };

  return mockLicenses[licenseNumber] || null;
}

async function lookupEGYPTLicense(licenseNumber: string): Promise<LicenseData | null> {
  // Mock data - in production, integrate with GAFI/ETA
  const mockLicenses: Record<string, LicenseData> = {
    "123456789": {
      number: "123456789",
      name: "Egypt Business Group",
      authority: "GAFI",
      status: "ACTIVE",
      expiresAt: "2025-12-31",
      legalForm: "Company",
    },
    "987654321": {
      number: "987654321",
      name: "Nile Commerce",
      authority: "GAFI",
      status: "ACTIVE",
      expiresAt: "2026-06-30",
      legalForm: "Company",
    },
  };

  return mockLicenses[licenseNumber] || null;
}

/**
 * GET /api/registries/[country]/license/[number]
 * Look up a business license in country registry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { country, number } = params;

    if (!country || !number) {
      return NextResponse.json(
        { error: "Country and license number are required" },
        { status: 400 }
      );
    }

    const licenseNumber = decodeURIComponent(number);

    let licenseData: LicenseData | null = null;

    switch (country.toUpperCase()) {
      case "AE":
        licenseData = await lookupUAELicense(licenseNumber);
        break;
      case "SA":
        licenseData = await lookupSALicense(licenseNumber);
        break;
      case "EG":
        licenseData = await lookupEGYPTLicense(licenseNumber);
        break;
      default:
        return NextResponse.json(
          { error: "Unsupported country code" },
          { status: 400 }
        );
    }

    if (!licenseData) {
      return NextResponse.json(
        {
          error: "License not found in registry. Please verify the number or continue with manual verification.",
        },
        { status: 404 }
      );
    }

    logger.info("License lookup successful", {
      country,
      licenseNumber,
      businessName: licenseData.name,
    });

    return NextResponse.json({
      success: true,
      data: {
        number: licenseData.number,
        name: licenseData.name,
        authority: licenseData.authority,
        status: licenseData.status,
        expiresAt: licenseData.expiresAt,
        legalForm: licenseData.legalForm,
      },
    });
  } catch (error) {
    logger.error("License lookup error", { error });
    return NextResponse.json(
      { error: "Failed to lookup license. Please try again later." },
      { status: 500 }
    );
  }
}
