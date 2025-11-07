const prisma = require('@/lib/prisma')
(async ()=>{
  try{
    const u = await prisma.user.findFirst({ where: { email: 'superadmin@accountingfirm.com' } });
    if(!u){ console.log('User not found'); return }
    const memberships = await prisma.tenantMembership.findMany({ where: { userId: u.id } });
    console.log('USER:', { id: u.id, email: u.email, role: u.role, tenantId: u.tenantId });
    console.log('MEMBERSHIPS:', JSON.stringify(memberships, null, 2));
  }catch(e){ console.error('ERROR', e && e.message ? e.message : e)}finally{ await prisma.$disconnect(); }
})()
