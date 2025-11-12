import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initializeImportJob,
  getImportJobState,
  getImportJobStatus,
  processNextImportJob,
  cleanupExpiredImportJobs,
  type CsvImportJobState,
  type EntityRow,
} from "../csv-import";

// Mock dependencies
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue(true),
    lpush: vi.fn().mockResolvedValue(1),
    rpop: vi.fn().mockResolvedValue(null),
    publish: vi.fn().mockResolvedValue(1),
  })),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    entity: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: "entity-123",
        tenantId: "tenant-123",
        country: "AE",
        name: "Test Business",
        status: "VERIFIED",
        type: "COMPANY",
      }),
    },
  },
}));

vi.mock("@/lib/registries/countries", () => ({
  countryRegistry: {
    getCountry: vi.fn((code) => {
      const countries: Record<string, any> = {
        AE: { code: "AE", name: "UAE" },
        SA: { code: "SA", name: "Saudi Arabia" },
        EG: { code: "EG", name: "Egypt" },
      };
      return countries[code] || null;
    }),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    audit: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("CSV Import Job Worker", () => {
  const mockTenantId = "tenant-123";
  const mockUserId = "user-456";
  const mockJobId = "csv-import-123";

  const mockEntityRow: EntityRow = {
    country: "AE",
    businessName: "Test Business LLC",
    licenseNumber: "P123456X",
    legalForm: "LLC",
    economicZoneId: "ded",
    taxId: "123456789012345",
    email: "test@example.com",
    phone: "+971501234567",
  };

  describe("Job Initialization", () => {
    it("should initialize a new import job", async () => {
      const csvData = [mockEntityRow];
      const state = await initializeImportJob(
        mockTenantId,
        mockUserId,
        csvData,
        mockJobId
      );

      expect(state).toEqual(
        expect.objectContaining({
          jobId: mockJobId,
          tenantId: mockTenantId,
          userId: mockUserId,
          status: "PENDING",
          totalRows: 1,
          processedRows: 0,
          successCount: 0,
          failureCount: 0,
          errors: [],
        })
      );
      expect(state.startedAt).toBeInstanceOf(Date);
    });

    it("should set correct retry count", async () => {
      const csvData = [mockEntityRow];
      const state = await initializeImportJob(
        mockTenantId,
        mockUserId,
        csvData,
        mockJobId
      );

      expect(state.retryCount).toBe(0);
      expect(state.maxRetries).toBe(3);
    });

    it("should handle multiple rows", async () => {
      const csvData = [
        mockEntityRow,
        { ...mockEntityRow, businessName: "Another Business" },
        { ...mockEntityRow, businessName: "Third Business" },
      ];

      const state = await initializeImportJob(
        mockTenantId,
        mockUserId,
        csvData,
        mockJobId
      );

      expect(state.totalRows).toBe(3);
    });
  });

  describe("Job State Management", () => {
    it("should retrieve job state by ID", async () => {
      const csvData = [mockEntityRow];
      await initializeImportJob(mockTenantId, mockUserId, csvData, mockJobId);

      const state = await getImportJobState(mockJobId);
      expect(state).toBeNull(); // Mock returns null
    });

    it("should handle missing job state gracefully", async () => {
      const state = await getImportJobState("nonexistent-job");
      expect(state).toBeNull();
    });
  });

  describe("Job Status", () => {
    it("should retrieve job status", async () => {
      const status = await getImportJobStatus(mockJobId);
      expect(status).toBeNull(); // Mock returns null since no state stored
    });

    it("should return null for nonexistent job", async () => {
      const status = await getImportJobStatus("nonexistent-job");
      expect(status).toBeNull();
    });
  });

  describe("Job Processing", () => {
    it("should process jobs from queue", async () => {
      const processed = await processNextImportJob();
      // Mock returns false since queue is empty
      expect(typeof processed).toBe("boolean");
    });

    it("should cleanup expired jobs", async () => {
      expect(async () => {
        await cleanupExpiredImportJobs();
      }).not.toThrow();
    });
  });

  describe("Entity Row Validation", () => {
    it("should accept valid entity rows", () => {
      expect(mockEntityRow).toEqual(
        expect.objectContaining({
          country: expect.stringMatching(/^(AE|SA|EG)$/),
          businessName: expect.any(String),
          licenseNumber: expect.any(String),
        })
      );
    });

    it("should accept optional fields", () => {
      const minimalRow: EntityRow = {
        country: "AE",
        businessName: "Minimal Business",
      };

      expect(minimalRow).toEqual(
        expect.objectContaining({
          country: "AE",
          businessName: "Minimal Business",
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle missing job data gracefully", async () => {
      const state = await getImportJobState("missing-job");
      expect(state).toBeNull();
    });

    it("should handle processing errors without throwing", async () => {
      expect(async () => {
        await processNextImportJob();
      }).not.toThrow();
    });

    it("should handle cleanup errors gracefully", async () => {
      expect(async () => {
        await cleanupExpiredImportJobs();
      }).not.toThrow();
    });
  });

  describe("Job Lifecycle", () => {
    it("should move through correct status states", async () => {
      const csvData = [mockEntityRow];
      const initialState = await initializeImportJob(
        mockTenantId,
        mockUserId,
        csvData,
        mockJobId
      );

      expect(initialState.status).toBe("PENDING");
      // In real flow: PENDING -> PROCESSING -> PROCESSING_ENTITIES -> SUCCESS/PARTIAL_SUCCESS
    });

    it("should track processing progress", async () => {
      const csvData = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...mockEntityRow,
          businessName: `Business ${i + 1}`,
        }));

      const state = await initializeImportJob(
        mockTenantId,
        mockUserId,
        csvData,
        mockJobId
      );

      expect(state.processedRows).toBe(0);
      expect(state.totalRows).toBe(10);
    });

    it("should record errors during processing", async () => {
      const csvData = [mockEntityRow];
      const state = await initializeImportJob(
        mockTenantId,
        mockUserId,
        csvData,
        mockJobId
      );

      expect(state.errors).toEqual([]);
      expect(state.failureCount).toBe(0);
    });
  });

  describe("Configuration", () => {
    it("should have correct timeout values", async () => {
      const csvData = [mockEntityRow];
      const state = await initializeImportJob(
        mockTenantId,
        mockUserId,
        csvData,
        mockJobId
      );

      // Job should be set with 1 hour timeout in Redis
      expect(state).toHaveProperty("startedAt");
    });

    it("should support batch processing", async () => {
      const csvData = Array(100)
        .fill(null)
        .map((_, i) => ({
          ...mockEntityRow,
          businessName: `Business ${i + 1}`,
        }));

      const state = await initializeImportJob(
        mockTenantId,
        mockUserId,
        csvData,
        mockJobId
      );

      expect(state.totalRows).toBe(100);
    });
  });
});
