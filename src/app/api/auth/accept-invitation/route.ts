import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { invitationService } from '@/services/invitations';
import { logger } from '@/lib/logger';
import { withTenantContext } from '@/lib/api-wrapper';
import { requireTenantContext } from '@/lib/tenant-utils';

const acceptInvitationSchema = z.object({
  token: z.string().min(32),
  userId: z.string().min(1),
});

export const POST = withTenantContext(
  async (request: NextRequest) => {
    try {
      const { userId } = requireTenantContext();

      const data = await request.json();
      const validated = acceptInvitationSchema.parse(data);

      // Accept the invitation
      const result = await invitationService.acceptInvitation(
        validated.token,
        validated.userId
      );

      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: error.issues },
          { status: 400 }
        );
      }

      if (error instanceof Error) {
        // Check for specific error messages
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: 'Invitation not found or has expired' },
            { status: 404 }
          );
        }
        if (error.message.includes('expired')) {
          return NextResponse.json(
            { error: 'This invitation has expired' },
            { status: 410 }
          );
        }
        if (error.message.includes('already accepted')) {
          return NextResponse.json(
            { error: 'This invitation has already been accepted' },
            { status: 409 }
          );
        }
      }

      logger.error('Failed to accept invitation', { error });
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);
