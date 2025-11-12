const prisma = require('@/lib/prisma')

(async ()=>{
  try{
    const email = 'superadmin@accountingfirm.com'
    const user = await prisma.user.findFirst({ where: { email } });
    if(!user){ console.error('User not found for', email); process.exit(1) }
    const tenantId = user.tenantId || process.env.DEFAULT_TENANT_ID || null;
    if(!tenantId){ console.error('No tenantId found for user', user.id); process.exit(1) }

    const up = await prisma.tenantMembership.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId } },
      update: { role: 'ADMIN', isDefault: true },
      create: { userId: user.id, tenantId, role: 'ADMIN', isDefault: true }
    })
    console.log('Upserted tenant membership:', JSON.stringify(up, null, 2))
  }catch(e){ console.error('ERROR', e && e.message ? e.message : e); process.exit(1)}finally{ await prisma.$disconnect(); }
})()
