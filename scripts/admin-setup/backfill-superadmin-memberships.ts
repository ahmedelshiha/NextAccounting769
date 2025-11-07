import prisma from '@/lib/prisma'

async function main() {
  console.log('🔎 Scanning for SUPER_ADMIN users without tenant memberships...')
  const superAdmins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } })
  console.log(`Found ${superAdmins.length} SUPER_ADMIN users`)

  let created = 0
  for (const user of superAdmins) {
    try {
      const memberships = await prisma.tenantMembership.findMany({ where: { userId: user.id } })
      if (!memberships || memberships.length === 0) {
        const tenantId = (user as any).tenantId
        if (!tenantId) {
          console.warn(`  • Skipping user ${user.email} (${user.id}) — no tenantId on user record`) 
          continue
        }
        const upsert = await prisma.tenantMembership.upsert({
          where: { userId_tenantId: { userId: user.id, tenantId } },
          update: { role: 'SUPER_ADMIN' as any, isDefault: true },
          create: { userId: user.id, tenantId, role: 'SUPER_ADMIN' as any, isDefault: true }
        })
        console.log(`  • Created tenant membership for ${user.email} (${user.id}) -> tenant ${tenantId}`)
        created += 1
      } else {
        console.log(`  • User ${user.email} (${user.id}) already has ${memberships.length} membership(s)`) 
      }
    } catch (err) {
      console.error(`  ✖ Failed to ensure membership for ${user.email} (${user.id}):`, (err as any)?.message ?? err)
    }
  }

  console.log(`
Done. Created ${created} tenant_membership record(s).
`) 
}

main()
  .catch((e) => {
    console.error('Unhandled error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
