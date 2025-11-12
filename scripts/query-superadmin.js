const prisma = require('@/lib/prisma')

async function run() {
  try {
    const u = await prisma.user.findFirst({ where: { email: 'superadmin@accountingfirm.com' } });
    console.log(JSON.stringify(u, null, 2));
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
