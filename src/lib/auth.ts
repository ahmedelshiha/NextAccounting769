import type { NextAuthOptions, User, Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getResolvedTenantId, userByTenantEmail } from '@/lib/tenant'
import { getClientIp, rateLimitAsync } from '@/lib/rate-limit'
import { computeIpHash } from '@/lib/security/ip-hash'
import { logAudit } from '@/lib/audit'

const hasDb = Boolean(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)

// Lightweight fallback demo users when no DB is configured
const demoUsers = [
  { id: 'demo-admin', name: 'Admin User', email: 'admin@accountingfirm.com', password: 'admin123', role: 'ADMIN' },
  { id: 'demo-lead', name: 'Team Lead', email: 'lead@accountingfirm.com', password: 'lead123', role: 'TEAM_LEAD' },
  { id: 'demo-staff', name: 'Team Member', email: 'staff@accountingfirm.com', password: 'staff123', role: 'TEAM_MEMBER' },
  { id: 'demo-client1', name: 'Client One', email: 'client1@example.com', password: 'client123', role: 'CLIENT' },
  { id: 'demo-client2', name: 'Client Two', email: 'client2@example.com', password: 'client123', role: 'CLIENT' },
]

export const authOptions: NextAuthOptions = {
  // Only attach the Prisma adapter when a DB is available
  ...(hasDb ? { adapter: PrismaAdapter(prisma) } : {}),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        const requestLike = ((req as any)?.request ?? (req as any)) as unknown as Request
        let clientIp = 'anonymous'
        try {
          clientIp = getClientIp(requestLike)
        } catch {}
        const sessionIpHash = await computeIpHash(clientIp)
        const sessionIssuedAt = Date.now()

        if (!hasDb) {
          const u = demoUsers.find((x) => x.email.toLowerCase() === credentials.email.toLowerCase())
          if (!u) return null
          if (credentials.password !== u.password) return null
          return {
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            sessionIpHash,
            sessionIssuedAt,
          }
        }

        const tenantId = await getResolvedTenantId(requestLike)
        try {
          if (!(await rateLimitAsync(`auth:login:ip:${clientIp}`, 20, 60_000))) {
            try { await logAudit({ action: 'security.ratelimit.block', details: { ip: clientIp, key: `auth:login:ip:${clientIp}` } }) } catch {}
            return null
          }
          const emailKey = String(credentials.email || '').toLowerCase()
          if (!(await rateLimitAsync(`auth:login:${tenantId}:${emailKey}`, 10, 60_000))) {
            try { await logAudit({ action: 'security.ratelimit.block', details: { tenantId, key: `auth:login:${tenantId}:${emailKey}` } }) } catch {}
            return null
          }
        } catch {}

        // Preview fallback: allow login using PREVIEW_ADMIN_EMAIL/PASSWORD and auto-provision the user in the default tenant
        const previewEmail = (process.env.PREVIEW_ADMIN_EMAIL || '').toLowerCase()
        const previewPassword = process.env.PREVIEW_ADMIN_PASSWORD || ''
        const inputEmail = String(credentials.email).toLowerCase()
        const inputPassword = String(credentials.password)
        if (previewEmail && previewPassword && inputEmail === previewEmail && inputPassword === previewPassword) {
          // Upsert preview admin user in DB to ensure downstream APIs work
          const hashed = await bcrypt.hash(previewPassword, 12)
          const user = await prisma.user.upsert({
            where: userByTenantEmail(tenantId, inputEmail),
            update: { password: hashed, role: 'ADMIN' as any, name: 'Preview Admin' },
            create: { tenantId, email: inputEmail, name: 'Preview Admin', password: hashed, role: 'ADMIN' as any }
          })
          // Ensure tenant membership exists
          await prisma.tenantMembership.upsert({
            where: { userId_tenantId: { userId: user.id, tenantId } },
            update: { role: 'ADMIN' as any, isDefault: true },
            create: { userId: user.id, tenantId, role: 'ADMIN' as any, isDefault: true }
          }).catch(() => {})

          const tenantMemberships = await prisma.tenantMembership.findMany({ where: { userId: user.id }, include: { tenant: true } }).catch(() => [])
          const activeMembership = tenantMemberships.find(m => m.tenantId === tenantId) || tenantMemberships[0] || null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            tenantId: activeMembership ? activeMembership.tenantId : tenantId,
            tenantSlug: activeMembership?.tenant?.slug ?? null,
            tenantRole: activeMembership ? activeMembership.role : null,
            availableTenants: tenantMemberships.map(m => ({ id: m.tenantId, slug: m.tenant?.slug, name: m.tenant?.name, role: m.role })),
            sessionIpHash,
            sessionIssuedAt,
          }
        }

        const emailKey = String(credentials.email as string).toLowerCase()

        // Strategy 1: Tenant-scoped lookup (primary path for all users)
        let user = await prisma.user.findUnique({
          where: userByTenantEmail(tenantId, emailKey)
        })

        // Strategy 2: Cross-tenant SUPER_ADMIN lookup
        // If the tenant-scoped lookup fails, check if this is a SUPER_ADMIN user
        // attempting to access from a different tenant context
        if (!user) {
          try {
            user = await prisma.user.findFirst({
              where: {
                email: emailKey,
                role: 'SUPER_ADMIN'
              },
              // Performance: limit to 1 result since email should be unique per SUPER_ADMIN
              take: 1
            })

            // Audit cross-tenant superadmin access for security monitoring
            if (user) {
              await logAudit({
                action: 'auth.superadmin.cross_tenant_access',
                actorId: user.id,
                targetId: user.id,
                details: {
                  requestedTenantId: tenantId,
                  userHomeTenantId: (user as any).tenantId,
                  email: emailKey
                }
              }).catch(() => {})
            }
          } catch (err) {
            // Log cross-tenant lookup failures for debugging
            await logAudit({
              action: 'auth.superadmin.cross_tenant_lookup_error',
              actorId: null,
              targetId: null,
              details: {
                tenantId,
                email: emailKey,
                error: String(err)
              }
            }).catch(() => {})
          }
        }

        // If still no user found, fail authentication
        if (!user || !user.password) {
          // Audit failed attempt without revealing whether user exists (prevent enumeration)
          logAudit({
            action: 'auth.login.failed',
            actorId: null,
            targetId: null,
            details: { tenantId, email: emailKey }
          }).catch(() => {})
          return null
        }

        // Continue with existing password verification
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          logAudit({ action: 'auth.login.failed', actorId: user.id, targetId: user.id, details: { tenantId } }).catch(() => {})
          return null
        }

        // MFA enforcement for admin/super admin
        try {
          const role = String(user.role || '').toUpperCase()
          if (role === 'SUPER_ADMIN') {
            // For SUPER_ADMIN, enforce tenant-aware step-up MFA policy.
            const { verifySuperAdminStepUp } = await import('@/lib/security/step-up')

            // Build a request-like object whose headers.get prioritizes OTP passed in credentials (credentials.mfa/otp/code)
            const credOtp = (credentials as any)?.mfa || (credentials as any)?.otp || (credentials as any)?.code || ''
            const headerLike: any = {
              headers: {
                get: (name: string) => {
                  if (credOtp && String(credOtp).trim()) return String(credOtp).trim()
                  try {
                    const r = (req as any)?.request ?? (req as any)
                    return r?.headers?.get?.(name) ?? null
                  } catch {
                    return null
                  }
                },
              },
            }

            const stepUpOk = await verifySuperAdminStepUp(headerLike as any, user.id, tenantId)
            if (!stepUpOk) {
              await logAudit({ action: 'auth.mfa.stepup.required', actorId: user.id, targetId: user.id, details: { tenantId } }).catch(() => {})
              return null
            }
          } else if (role === 'ADMIN') {
            // For regular ADMIN, keep previous behavior: require OTP only if user has MFA secret configured
            const { getUserMfaSecret, verifyTotp, consumeBackupCode } = await import('@/lib/mfa')
            const secret = await getUserMfaSecret(user.id)
            if (secret) {
              const otp = (credentials as any)?.mfa || (credentials as any)?.otp || (credentials as any)?.code || ''
              const isValid = verifyTotp(secret, String(otp || '')) || (await consumeBackupCode(user.id, String(otp || '')))
              if (!isValid) {
                await logAudit({ action: 'auth.mfa.required', actorId: user.id, targetId: user.id, details: { tenantId } }).catch(() => {})
                return null
              }
            }
          }
        } catch (err) {
          // Fail closed: if any error occurs during MFA checks, log and block the login
          try { await logAudit({ action: 'auth.mfa.error', actorId: user.id, targetId: user.id, details: { error: String(err) } }) } catch {}
          return null
        }

        // Fetch tenant memberships for the user to populate available tenants
        let tenantMemberships = await prisma.tenantMembership.findMany({ where: { userId: user.id }, include: { tenant: true } }).catch(() => [])

        // If this is a SUPER_ADMIN and no tenant membership exists, create one using the user's tenantId (or resolved tenantId)
        try {
          const roleNormalized = String(user.role || '').toUpperCase()
          if (roleNormalized === 'SUPER_ADMIN' && (!tenantMemberships || tenantMemberships.length === 0)) {
            const membershipTenantId = (user as any).tenantId || tenantId
            if (membershipTenantId) {
              await prisma.tenantMembership.upsert({
                where: { userId_tenantId: { userId: user.id, tenantId: membershipTenantId } },
                update: { role: 'SUPER_ADMIN' as any, isDefault: true },
                create: { userId: user.id, tenantId: membershipTenantId, role: 'SUPER_ADMIN' as any, isDefault: true },
              }).catch(() => {})

              // Refresh memberships after ensuring the row exists
              tenantMemberships = await prisma.tenantMembership.findMany({ where: { userId: user.id }, include: { tenant: true } }).catch(() => [])
            }
          }
        } catch (err) {
          // Don't block login for membership sync failures, but log audit entry
          try { await logAudit({ action: 'auth.superadmin.membership.sync.failed', actorId: user.id, targetId: user.id, details: { error: String(err) } }) } catch {}
        }

        // Determine active tenant membership (the one used for login)
        const activeMembership = tenantMemberships.find(m => m.tenantId === tenantId) || tenantMemberships[0] || null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          tenantId: activeMembership ? activeMembership.tenantId : tenantId,
          tenantSlug: activeMembership?.tenant?.slug ?? null,
          tenantRole: activeMembership ? activeMembership.role : null,
          availableTenants: tenantMemberships.map(m => ({ id: m.tenantId, slug: m.tenant?.slug, name: m.tenant?.name, role: m.role })),
          sessionIpHash,
          sessionIssuedAt,
        }
      }
    })
  ],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7, updateAge: 60 * 60 },
  events: {
    async signIn({ user }) {
      try { await logAudit({ action: 'auth.signin', actorId: (user as any)?.id, targetId: (user as any)?.id }) } catch {}
    },
    async signOut({ session }) {
      try { await logAudit({ action: 'auth.signout', actorId: (session as any)?.user?.id || null, targetId: null }) } catch {}
    }
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign in, attach role, sessionVersion and tenant metadata
      if (user) {
        token.role = (user as any).role
        if (hasDb) {
          try {
            const dbUser = await prisma.user.findUnique({ where: { id: (user as any).id }, select: { sessionVersion: true } })
            token.sessionVersion = dbUser?.sessionVersion ?? 0
          } catch {
            token.sessionVersion = 0
          }
        } else {
          token.sessionVersion = 0
        }

        token.sessionIpHash = typeof (user as any).sessionIpHash === 'string' ? (user as any).sessionIpHash : null
        token.sessionIssuedAt = typeof (user as any).sessionIssuedAt === 'number' ? (user as any).sessionIssuedAt : Date.now()

        // Attach tenant metadata if provided by authorize
        if ((user as any).tenantId) token.tenantId = (user as any).tenantId
        if ((user as any).tenantSlug) token.tenantSlug = (user as any).tenantSlug
        if ((user as any).tenantRole) token.tenantRole = (user as any).tenantRole
        if ((user as any).availableTenants) token.availableTenants = (user as any).availableTenants
        token.version = (token.version as number || 0) + 1
      }

      // Support session update trigger for tenant switching
      if (trigger === 'update' && session && (session as any).tenantId) {
        const requestedTenantId = (session as any).tenantId as string
        const available: Array<any> = (token.availableTenants as any[]) || []
        if (available.some(t => t.id === requestedTenantId)) {
          token.tenantId = requestedTenantId
          const membership = available.find(t => t.id === requestedTenantId)
          token.tenantSlug = membership?.slug ?? token.tenantSlug
          token.tenantRole = membership?.role ?? token.tenantRole
          token.version = (token.version as number || 0) + 1
        } else {
          // ignore invalid tenant switch attempts
        }
      }

      // On subsequent requests, validate token against DB version
      if (!user && token.sub && hasDb) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.sub }, select: { sessionVersion: true } })
          if (dbUser && token.sessionVersion !== dbUser.sessionVersion) {
            // Mark token as invalidated
            const t = token as unknown as { invalidated?: boolean }
            t.invalidated = true
          }
        } catch {
          // ignore
        }
      }

      return token
    },
    async session({ session, token }) {
      // If token was invalidated due to sessionVersion mismatch, return null session
      const tok = token as unknown as { invalidated?: boolean }
      if (tok.invalidated) {
        return null as unknown as Session
      }

      if (token) {
        // Preserve email from token (critical for API requests)
        if (token.email) {
          session.user.email = token.email
        }

        const tenantId = (token as any).tenantId ?? null
        const tenantSlug = (token as any).tenantSlug ?? null
        const tenantRole = (token as any).tenantRole ?? null
        const tenantList = Array.isArray((token as any).availableTenants)
          ? ((token as any).availableTenants as Array<any>)
              .map((tenant) => {
                if (!tenant || tenant.id == null) return null
                return {
                  id: String(tenant.id),
                  slug: tenant.slug ?? null,
                  name: tenant.name ?? null,
                  role: tenant.role ?? null,
                }
              })
              .filter((tenant): tenant is { id: string; slug: string | null; name: string | null; role: string | null } => Boolean(tenant))
          : []
        const tokenVersion = typeof (token as any).version === 'number' ? (token as any).version : 0
        const sessionVersion = typeof (token as any).sessionVersion === 'number' ? (token as any).sessionVersion : 0

        if (token.sub) {
          session.user.id = token.sub
        }
        if (token.role !== undefined) {
          session.user.role = token.role as string
        }

        const sessionIpHash = typeof (token as any).sessionIpHash === 'string' ? (token as any).sessionIpHash : null
        const sessionIssuedAtValue = typeof (token as any).sessionIssuedAt === 'number' ? (token as any).sessionIssuedAt : null
        ;(session.user as any).sessionIpHash = sessionIpHash
        ;(session.user as any).sessionIssuedAt = sessionIssuedAtValue
        ;(session as any).sessionIpHash = sessionIpHash
        ;(session as any).sessionIssuedAt = sessionIssuedAtValue

        ;(session.user as any).tenantId = tenantId
        ;(session.user as any).tenantSlug = tenantSlug
        ;(session.user as any).tenantRole = tenantRole
        ;(session.user as any).availableTenants = tenantList
        ;(session.user as any).tokenVersion = tokenVersion
        ;(session.user as any).sessionVersion = sessionVersion

        ;(session as any).tenantId = tenantId
        ;(session as any).tenantSlug = tenantSlug
        ;(session as any).tenantRole = tenantRole
        ;(session as any).availableTenants = tenantList
        ;(session as any).tokenVersion = tokenVersion
        ;(session as any).sessionVersion = sessionVersion
      }
      return session
    }
  },
  pages: { signIn: '/login' }
}

export async function getSessionOrBypass(): Promise<Session | null> {
  if (String(process.env.AUTH_DISABLED || '').toLowerCase() === 'true') {
    try {
      const tenantId = await getResolvedTenantId(null as any).catch(() => null)
      return {
        user: {
          id: 'public',
          name: 'Preview Admin',
          email: 'preview@local',
          role: 'ADMIN',
          ...(tenantId ? { tenantId } : {}),
        } as any,
      } as unknown as Session
    } catch {
      return {
        user: {
          id: 'public',
          name: 'Preview Admin',
          email: 'preview@local',
          role: 'ADMIN',
        } as any,
      } as unknown as Session
    }
  }
  return getServerSession(authOptions) as unknown as Promise<Session | null>
}
