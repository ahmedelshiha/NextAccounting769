import prisma from '@/lib/prisma';
import { sendInvitationEmail } from '@/lib/email/invitations';
import { logger } from '@/lib/logger';
import { generateToken } from '@/lib/security/token-generator';

export interface CreateInvitationInput {
  email: string;
  tenantId: string;
  role: 'CLIENT_OWNER' | 'FINANCE_MANAGER' | 'ACCOUNTANT' | 'VIEWER' | 'AUDITOR' | 'ADVISOR';
  invitedBy: string;
  entityIds?: string[];
  expiresIn?: number;
}

export interface InvitationRecord {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  token: string;
  entityIds: string[];
}

export class InvitationService {
  async createInvitation(input: CreateInvitationInput): Promise<InvitationRecord> {
    const {
      email,
      tenantId,
      role,
      invitedBy,
      entityIds = [],
      expiresIn = 7 * 24 * 60 * 60 * 1000, // 7 days
    } = input;

    try {
      // Generate secure token
      const token = generateToken(32);

      // Create invitation
      const invitation = await prisma.$transaction(async (tx) => {
        // Check if user already exists (using the tenantId_email compound unique constraint)
        const existingUser = await tx.user.findUnique({
          where: { tenantId_email: { tenantId, email } },
        });

        if (existingUser) {
          throw new Error('User already exists with this email in the tenant');
        }

        // Create invitation record
        const created = await tx.invitation.create({
          data: {
            email,
            tenantId,
            role,
            invitedBy,
            token,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + expiresIn),
            entityIds,
          },
        });

        return created;
      });

      // Send invitation email
      try {
        await sendInvitationEmail({
          email,
          role,
          invitationToken: token,
          tenantId,
          invitedBy,
        });
      } catch (emailError) {
        logger.warn('Failed to send invitation email', {
          email,
          invitationId: invitation.id,
          error: emailError,
        });
      }

      // Log audit event
      if (logger.audit) {
        await logger.audit({
          action: 'invitation.created',
          actorId: invitedBy,
          targetId: email,
          details: { role, tenantId, entityIds },
        });
      }

      return {
        id: invitation.id,
        email: invitation.email,
        tenantId: invitation.tenantId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        status: invitation.status as 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED',
        token: invitation.token,
        entityIds: invitation.entityIds || [],
      };
    } catch (error) {
      logger.error('Failed to create invitation', { input, error });
      throw error;
    }
  }

  async acceptInvitation(
    token: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const invitation = await prisma.$transaction(async (tx) => {
        // Find invitation by token
        const inv = await tx.invitation.findUnique({
          where: { token },
        });

        if (!inv) {
          throw new Error('Invitation not found');
        }

        // Check if expired
        if (inv.expiresAt < new Date()) {
          throw new Error('Invitation has expired');
        }

        // Check if already accepted
        if (inv.status === 'ACCEPTED') {
          throw new Error('Invitation already accepted');
        }

        // Update invitation
        const updated = await tx.invitation.update({
          where: { id: inv.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            acceptedBy: userId,
          },
        });

        // Assign role to user via TenantMembership
        await tx.tenantMembership.upsert({
          where: {
            userId_tenantId: {
              userId,
              tenantId: inv.tenantId,
            },
          },
          create: {
            userId,
            tenantId: inv.tenantId,
            role: inv.role as any, // role is a string from invitation
          },
          update: {
            role: inv.role as any,
          },
        });

        // Link to entities if specified
        if (inv.entityIds && inv.entityIds.length > 0) {
          await tx.userOnEntity.createMany({
            data: inv.entityIds.map((entityId) => ({
              userId,
              entityId,
            })),
          });
        }

        return updated;
      });

      // Log audit event
      if (logger.audit) {
        await logger.audit({
          action: 'invitation.accepted',
          actorId: userId,
          targetId: invitation.email,
          details: { tenantId: invitation.tenantId, role: invitation.role },
        });
      }

      return {
        success: true,
        message: 'Invitation accepted successfully',
      };
    } catch (error) {
      logger.error('Failed to accept invitation', { token, userId, error });
      throw error;
    }
  }

  async cancelInvitation(invitationId: string, cancelledBy: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const invitation = await tx.invitation.findUnique({
          where: { id: invitationId },
        });

        if (!invitation) {
          throw new Error('Invitation not found');
        }

        await tx.invitation.update({
          where: { id: invitationId },
          data: {
            status: 'CANCELLED',
          },
        });

        // Log audit event
        if (logger.audit) {
          await logger.audit({
            action: 'invitation.cancelled',
            actorId: cancelledBy,
            targetId: invitation.email,
            details: { invitationId },
          });
        }
      });
    } catch (error) {
      logger.error('Failed to cancel invitation', { invitationId, cancelledBy, error });
      throw error;
    }
  }

  async listInvitations(
    tenantId: string,
    status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  ): Promise<InvitationRecord[]> {
    try {
      const invitations = await prisma.invitation.findMany({
        where: {
          tenantId,
          ...(status && { status }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        tenantId: inv.tenantId,
        role: inv.role,
        invitedBy: inv.invitedBy,
        invitedAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt || undefined,
        acceptedBy: inv.acceptedBy || undefined,
        status: inv.status as 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED',
        token: inv.token,
        entityIds: inv.entityIds || [],
      }));
    } catch (error) {
      logger.error('Failed to list invitations', { tenantId, status, error });
      throw error;
    }
  }

  async resendInvitation(invitationId: string): Promise<void> {
    try {
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== 'PENDING') {
        throw new Error('Only pending invitations can be resent');
      }

      // Check if not expired
      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Send invitation email
      await sendInvitationEmail({
        email: invitation.email,
        role: invitation.role,
        invitationToken: invitation.token,
        tenantId: invitation.tenantId,
        invitedBy: invitation.invitedBy,
      });

      // Log audit event
      if (logger.audit) {
        await logger.audit({
          action: 'invitation.resent',
          actorId: 'system',
          targetId: invitation.email,
          details: { invitationId },
        });
      }
    } catch (error) {
      logger.error('Failed to resend invitation', { invitationId, error });
      throw error;
    }
  }

  async cleanupExpiredInvitations(): Promise<number> {
    try {
      const result = await prisma.invitation.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: {
            lt: new Date(),
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      logger.info('Cleaned up expired invitations', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired invitations', { error });
      throw error;
    }
  }
}

export const invitationService = new InvitationService();
