const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const admin = await prisma.user.findUnique({ where: { email: 'vish.admin@campus.edu' } });
  const faculty = await prisma.user.findUnique({ where: { email: 'raj.sharma_faculty@campus.edu' } });
  const student = await prisma.user.findUnique({ where: { email: 'vishakha.solanki@campus.edu' } });
  
  console.log('Admin:', admin ? 'Found' : 'NOT FOUND');
  console.log('Faculty:', faculty ? 'Found' : 'NOT FOUND');
  console.log('Student:', student ? 'Found' : 'NOT FOUND');
  
  await prisma.$disconnect();
}
check();
