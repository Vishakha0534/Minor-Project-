const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const alertMessages = [
  {
    message: 'Mid-semester examination schedule has been posted. Please check the notice board and prepare accordingly. Attendance is mandatory for all pre-exam lectures.',
    isUrgent: false
  },
  {
    message: 'URGENT: Lab session tomorrow has been rescheduled to Room 204 due to maintenance work in the main lab. All students must report by 9:00 AM sharp.',
    isUrgent: true
  },
  {
    message: 'Assignment submission deadline extended by 2 days. Ensure proper formatting and references are included in your report.',
    isUrgent: false
  }
];

async function addAlerts() {
  const classrooms = await prisma.classroom.findMany();
  console.log(`Found ${classrooms.length} classrooms`);

  let count = 0;
  for (const room of classrooms) {
    const existing = await prisma.alert.count({ where: { classroomId: room.id } });
    if (existing > 0) continue;

    const coord = await prisma.user.findUnique({
      where: { id: room.coordinatorId },
      select: { name: true }
    });
    const name = coord ? coord.name : 'Faculty';

    // First 5 classrooms get 2 alerts each, rest get 1
    const msgs = count < 5 ? alertMessages.slice(0, 2) : [alertMessages[2]];

    for (const alert of msgs) {
      await prisma.alert.create({
        data: {
          classroomId: room.id,
          message: alert.message,
          isUrgent: alert.isUrgent,
          createdBy: name
        }
      });
    }
    count++;
    if (count % 5 === 0) console.log(`  Seeded alerts for ${count} classrooms...`);
  }

  const total = await prisma.alert.count();
  console.log(`Done! Total alerts in DB: ${total}`);
}

addAlerts()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
