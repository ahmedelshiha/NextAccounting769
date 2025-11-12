import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTenantContext } from '@/lib/api-wrapper';
import { requireTenantContext } from '@/lib/tenant-utils';

const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  countryScope: z.array(z.enum(['AE', 'SA', 'EG'])),
  pricing: z.object({
    amount: z.number(),
    currency: z.string(),
    unit: z.string(), // 'per_entity', 'per_year', 'fixed', etc.
  }),
  prerequisites: z.array(z.string()).optional(),
  featureFlag: z.string().optional(),
  sla: z.object({
    turnaroundTime: z.string(),
    responseTime: z.string(),
  }).optional(),
  icon: z.string().optional(),
});

type Service = z.infer<typeof serviceSchema>;

// Mock services data (in production, this would come from database)
const SERVICES: Service[] = [
  {
    id: 'vat-return-ae',
    name: 'UAE VAT Return Filing',
    description: 'Monthly or quarterly VAT return preparation and filing with the UAE FTA',
    category: 'VAT Filing',
    countryScope: ['AE'],
    pricing: {
      amount: 500,
      currency: 'AED',
      unit: 'per_return',
    },
    prerequisites: ['TRN Verification', 'VAT Registration'],
    sla: {
      turnaroundTime: '5 business days',
      responseTime: '24 hours',
    },
    icon: '📋',
  },
  {
    id: 'corporate-tax-ae',
    name: 'UAE Corporate Tax Return',
    description: 'Annual corporate income tax return for eligible entities in UAE',
    category: 'Corporate Tax',
    countryScope: ['AE'],
    pricing: {
      amount: 2500,
      currency: 'AED',
      unit: 'per_year',
    },
    prerequisites: ['Entity Setup', 'Financial Records'],
    sla: {
      turnaroundTime: '10 business days',
      responseTime: '24 hours',
    },
    icon: '🏢',
  },
  {
    id: 'zatca-vat-sa',
    name: 'ZATCA VAT Filing (KSA)',
    description: 'Monthly VAT return filing with ZATCA including e-invoice compliance',
    category: 'VAT Filing',
    countryScope: ['SA'],
    pricing: {
      amount: 800,
      currency: 'SAR',
      unit: 'per_return',
    },
    prerequisites: ['VAT Registration', 'E-Invoice Setup'],
    sla: {
      turnaroundTime: '3 business days',
      responseTime: '12 hours',
    },
    icon: '📑',
  },
  {
    id: 'zakat-return-sa',
    name: 'Zakat Return Filing',
    description: 'Annual zakat computation and filing for Saudi entities',
    category: 'Zakat',
    countryScope: ['SA'],
    pricing: {
      amount: 1500,
      currency: 'SAR',
      unit: 'per_year',
    },
    prerequisites: ['Entity Setup', 'Financial Statements'],
    sla: {
      turnaroundTime: '7 business days',
      responseTime: '24 hours',
    },
    icon: '🕌',
  },
  {
    id: 'esr-annual-ae',
    name: 'UAE ESR Annual Report',
    description: 'Economic Substance Report submission for UAE entities with significant economic activity',
    category: 'Compliance',
    countryScope: ['AE'],
    pricing: {
      amount: 3000,
      currency: 'AED',
      unit: 'per_year',
    },
    prerequisites: ['Entity Setup', 'Business Plan', 'Financial Records'],
    sla: {
      turnaroundTime: '14 business days',
      responseTime: '24 hours',
    },
    icon: '📊',
  },
  {
    id: 'eta-filing-eg',
    name: 'ETA VAT Return (Egypt)',
    description: 'Egyptian Tax Authority VAT return filing and e-Invoice compliance',
    category: 'VAT Filing',
    countryScope: ['EG'],
    pricing: {
      amount: 600,
      currency: 'EGP',
      unit: 'per_return',
    },
    prerequisites: ['Tax ID', 'E-Invoice Profile'],
    sla: {
      turnaroundTime: '4 business days',
      responseTime: '24 hours',
    },
    icon: '🗂️',
  },
  {
    id: 'bookkeeping',
    name: 'Full Bookkeeping Service',
    description: 'End-to-end bookkeeping including invoice entry, reconciliation, and reporting',
    category: 'Bookkeeping',
    countryScope: ['AE', 'SA', 'EG'],
    pricing: {
      amount: 2000,
      currency: 'AED',
      unit: 'per_month',
    },
    prerequisites: ['Business Setup', 'Bank Access'],
    sla: {
      turnaroundTime: 'Monthly',
      responseTime: '48 hours',
    },
    icon: '📚',
  },
  {
    id: 'audit',
    name: 'Independent Audit',
    description: 'Annual audit of financial statements in accordance with ISA standards',
    category: 'Audit',
    countryScope: ['AE', 'SA', 'EG'],
    pricing: {
      amount: 5000,
      currency: 'AED',
      unit: 'per_year',
    },
    prerequisites: ['Financial Statements', 'Annual Records'],
    sla: {
      turnaroundTime: '20 business days',
      responseTime: '24 hours',
    },
    icon: '✓',
  },
];

export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId } = requireTenantContext();

      // Get query parameters
      const search = request.nextUrl.searchParams.get('search');
      const country = request.nextUrl.searchParams.get('country');
      const category = request.nextUrl.searchParams.get('category');

      // Filter services
      let filtered = SERVICES;

      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(searchLower) ||
            s.description.toLowerCase().includes(searchLower)
        );
      }

      if (country) {
        filtered = filtered.filter((s) => s.countryScope.includes(country));
      }

      if (category) {
        filtered = filtered.filter((s) => s.category === category);
      }

      // Get unique categories
      const categories = Array.from(new Set(SERVICES.map((s) => s.category)));

      return NextResponse.json({
        success: true,
        data: {
          services: filtered,
          categories,
          total: filtered.length,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch services', { error });
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

export const POST = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId } = requireTenantContext();

      const data = await request.json();
      const { serviceId } = data;

      if (!serviceId) {
        return NextResponse.json(
          { error: 'Service ID is required' },
          { status: 400 }
        );
      }

      const service = SERVICES.find((s) => s.id === serviceId);
      if (!service) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }

      // In production, this would create a service request ticket in messaging
      const requestId = `req-${Date.now()}`;

      // Log audit event
      await logger.audit({
        action: 'service.request_created',
        actorId: userId,
        targetId: serviceId,
        details: { requestId, serviceName: service.name },
      });

      return NextResponse.json({
        success: true,
        data: {
          requestId,
          serviceId,
          serviceName: service.name,
          status: 'pending',
          createdAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to create service request', { error });
      return NextResponse.json(
        { error: 'Failed to create service request' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
