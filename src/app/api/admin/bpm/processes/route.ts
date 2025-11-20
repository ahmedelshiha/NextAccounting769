import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTenantContext } from '@/lib/api-wrapper';
import { requireTenantContext } from '@/lib/tenant-utils';
import { processEngine, ProcessStatus } from '@/lib/bpm/process-engine';

const ProcessDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string(),
  status: z.nativeEnum(ProcessStatus),
  steps: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['TASK', 'DECISION', 'PARALLEL', 'LOOP']),
    assignee: z.string().optional(),
    assigneeRole: z.string().optional(),
    duration: z.number().optional(),
    dependencies: z.array(z.string()).optional(),
  })),
  rules: z.array(z.any()).optional(),
});

/**
 * GET /api/admin/bpm/processes
 * List all process definitions with optional filtering
 */
export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId } = requireTenantContext();

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') as ProcessStatus | null;

      const processes = status
        ? processEngine.listProcessDefinitions(status)
        : processEngine.listProcessDefinitions();

      return NextResponse.json({
        success: true,
        data: {
          processes,
          total: processes.length,
        },
      });
    } catch (error) {
      logger.error('Failed to list process definitions', { error });
      return NextResponse.json(
        { error: 'Failed to list process definitions' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

/**
 * POST /api/admin/bpm/processes
 * Create a new process definition
 */
export const POST = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId } = requireTenantContext();

      const body = await request.json();
      const validated = ProcessDefinitionSchema.parse(body);

      const process = processEngine.createProcessDefinition({
        ...validated,
        createdBy: userId || 'system',
      });

      return NextResponse.json({
        success: true,
        data: process,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid process definition', details: error.flatten() },
          { status: 400 }
        );
      }

      logger.error('Failed to create process definition', { error });
      return NextResponse.json(
        { error: 'Failed to create process definition' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
