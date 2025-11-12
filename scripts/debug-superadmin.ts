import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function debugSuperAdmin() {
  try {
    console.log('=== Debugging Superadmin Login ===\n')

    // 1. Check tenants
    console.log('1. Available tenants:')
    const tenants = await prisma.tenant.findMany()
    tenants.forEach(t => {
      console.log(`   - ID: ${t.id}, Slug: ${t.slug}, Name: ${t.name}`)
    })

    if (tenants.length === 0) {
      console.log('   (No tenants found)')
    }

    // 2. Check for superadmin user
    console.log('\n2. Searching for superadmin@accountingfirm.com:')
    const superadmin = await prisma.user.findFirst({
      where: {
        email: 'superadmin@accountingfirm.com'
      }
    })

    if (superadmin) {
      console.log(`   Found user: ${superadmin.id}`)
      console.log(`   Name: ${superadmin.name}`)
      console.log(`   Email: ${superadmin.email}`)
      console.log(`   Role: ${superadmin.role}`)
      console.log(`   TenantID: ${superadmin.tenantId}`)
      console.log(`   Has password: ${!!superadmin.password}`)
      console.log(`   Password hash: ${superadmin.password?.substring(0, 20)}...`)

      // 3. Test password verification
      console.log('\n3. Testing password verification:')
      const testPassword = 'SuperAdmin!2025#A9f3Kp'
      if (superadmin.password) {
        const isValid = await bcrypt.compare(testPassword, superadmin.password)
        console.log(`   Password match: ${isValid}`)
      } else {
        console.log('   No password hash in database!')
      }

      // 4. Check tenant membership
      console.log('\n4. Checking tenant memberships:')
      const memberships = await prisma.tenantMembership.findMany({
        where: { userId: superadmin.id },
        include: { tenant: true }
      })
      if (memberships.length > 0) {
        memberships.forEach(m => {
          console.log(`   - TenantID: ${m.tenantId}, Slug: ${m.tenant?.slug}, Role: ${m.role}`)
        })
      } else {
        console.log('   No tenant memberships found!')
      }
    } else {
      console.log('   User not found in database!')
      
      // Check similar emails
      console.log('\n   Searching for users with similar email patterns:')
      const allUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: 'admin',
            mode: 'insensitive'
          }
        }
      })
      allUsers.slice(0, 10).forEach(u => {
        console.log(`   - ${u.email} (role: ${u.role})`)
      })
    }

    console.log('\n5. Environment check:')
    console.log(`   MULTI_TENANCY_ENABLED: ${process.env.MULTI_TENANCY_ENABLED}`)
    console.log(`   MULTI_TENANCY_STRICT: ${process.env.MULTI_TENANCY_STRICT}`)
    console.log(`   AUTH_DISABLED: ${process.env.AUTH_DISABLED}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSuperAdmin()
