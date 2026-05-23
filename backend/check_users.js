const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    take: 5,
    select: { email: true, role: true }
  });
  console.log('Sample Users in DB:');
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
check();
