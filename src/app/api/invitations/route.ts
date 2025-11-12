import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { invitationService } from '@/services/invitations';
import { logger } from '@/lib/logger';
import { withTenantContext } from '@/lib/api-wrapper';
import { requireTenantContext } from '@/lib/tenant-utils';

const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['CLIENT_OWNER', 'FINANCE_MANAGER', 'ACCOUNTANT', 'VIEWER', 'AUDITOR', 'ADVISOR']),
  entityIds: z.array(z.string()).optional(),
});

type CreateInvitationRequest = z.infer<typeof createInvitationSchema>;

export const POST = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId, tenantId } = requireTenantContext();

      const data = await request.json();
      const validated = createInvitationSchema.parse(data);

      // Create invitation
      const invitation = await invitationService.createInvitation({
        email: validated.email,
        tenantId,
        role: validated.role,
        invitedBy: userId,
        entityIds: validated.entityIds,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.errors },
          { status: 400 }
        );
      }

      logger.error('Failed to create invitation', { error });
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

export const GET = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { tenantId } = requireTenantContext();

      const status = request.nextUrl.searchParams.get('status');

      const invitations = await invitationService.listInvitations(
        tenantId,
        status as any
      );

      return NextResponse.json({
        success: true,
        data: invitations.map(inv => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
          invitedAt: inv.invitedAt,
          expiresAt: inv.expiresAt,
          acceptedAt: inv.acceptedAt,
        })),
      });
    } catch (error) {
      logger.error('Failed to list invitations', { error });
      return NextResponse.json(
        { error: 'Failed to list invitations' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
