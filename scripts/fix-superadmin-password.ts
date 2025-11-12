import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function fixSuperAdminPassword() {
  try {
    console.log('🔧 Fixing superadmin password...\n')

    // 1. Get or create primary tenant
    let tenant = await prisma.tenant.findFirst({ where: { slug: 'primary' } })
    if (!tenant) {
      console.log('Creating primary tenant...')
      tenant = await prisma.tenant.create({
        data: {
          slug: 'primary',
          name: 'Primary Tenant',
          status: 'ACTIVE',
        },
      })
    }
    console.log(`✓ Using tenant: ${tenant.id} (${tenant.slug})`)

    // 2. Hash the password
    const plainPassword = 'SuperAdmin!2025#A9f3Kp'
    const hashedPassword = await bcrypt.hash(plainPassword, 12)
    console.log('✓ Password hashed')

    // 3. Create or update superadmin user
    const superadmin = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: 'superadmin@accountingfirm.com' } },
      update: {
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        emailVerified: new Date(),
      },
      create: {
        tenantId: tenant.id,
        email: 'superadmin@accountingfirm.com',
        name: 'Super Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        emailVerified: new Date(),
      },
    })
    console.log(`✓ Superadmin user created/updated: ${superadmin.id}`)

    // 4. Ensure tenant membership exists
    const membership = await prisma.tenantMembership.upsert({
      where: { userId_tenantId: { userId: superadmin.id, tenantId: tenant.id } },
      update: { role: 'SUPER_ADMIN', isDefault: true },
      create: {
        userId: superadmin.id,
        tenantId: tenant.id,
        role: 'SUPER_ADMIN',
        isDefault: true,
      },
    })
    console.log(`✓ Tenant membership ensured: ${membership.id}`)

    // 5. Verify the setup
    console.log('\n✓ Setup complete! You can now log in with:')
    console.log(`  Email: superadmin@accountingfirm.com`)
    console.log(`  Password: ${plainPassword}`)

    // 6. Test password verification
    const isValid = await bcrypt.compare(plainPassword, hashedPassword)
    console.log(`\n✓ Password verification test: ${isValid ? '✓ PASS' : '✗ FAIL'}`)

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixSuperAdminPassword()
