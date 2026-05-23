const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  console.log('--- Starting Database Seeding ---');
  
  // 1. Clear existing data to avoid conflicts
  console.log('Clearing old data...');
  await prisma.attendance.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.note.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.club.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();

  // 2. Load the generated dataset
  const data = JSON.parse(fs.readFileSync('smart_campus_dataset.json', 'utf8'));

  // 3. Create Users
  console.log(`Seeding ${data.users.length} users...`);
  // We use createMany for speed
  await prisma.user.createMany({
    data: data.users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      department: u.department,
      year: u.year || 1,
      section: u.section || 'A'
    }))
  });

  // 4. Create Classrooms
  console.log('Seeding classrooms & linking teachers...');
  const depts = ['AIML', 'CSIT', 'CSE', 'EC', 'VLSI', 'Mechanical', 'Civil'];
  const faculty = data.users.filter(u => u.role === 'faculty' || u.role === 'hod');

  for (const dept of depts) {
    const deptFac = faculty.filter(f => f.department === dept);
    for (let year = 1; year <= 4; year++) {
      for (const section of ['A', 'B']) {
        const coord = deptFac[randomInt(0, deptFac.length - 1)];
        // Randomly pick 2 other teachers from the same dept
        const teachers = deptFac.slice(0, 3).map(f => ({ id: f._id || f.id }));

        const room = await prisma.classroom.create({
          data: {
            department: dept,
            year,
            section,
            coordinatorId: coord._id || coord.id,
            teachers: { connect: teachers } // Link teachers
          }
        });

        // 5. Add Dummy Content
        await prisma.assignment.create({
          data: {
            classroomId: room.id,
            title: `${room.department} - Project Phase 1`,
            description: 'Submit your initial research and architecture diagram.',
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            subject: 'Core Project',
            department: room.department,
            year: room.year,
            createdBy: coord.name,
            facultyId: coord._id || coord.id
          }
        });

        await prisma.note.create({
          data: {
            classroomId: room.id,
            title: 'Welcome Kit & Syllabus',
            description: 'Download the full course syllabus and lab manual.',
            createdBy: coord.name
          }
        });

        // 6. Deep Attendance Seeding (ALL students in this class)
        const classStudents = data.users.filter(u => u.role === 'student' && u.department === dept && u.section === section);
        const records = [];
        for (const stu of classStudents) {
          for (let d = 0; d < 30; d++) { // 30 days of history
            const date = new Date();
            date.setDate(date.getDate() - d);
            records.push({
              studentId: stu._id || stu.id,
              classroomId: room.id,
              subject: 'Core Module',
              facultyId: coord._id || coord.id,
              date: date.toISOString(),
              status: Math.random() > 0.15 ? 'Present' : 'Absent'
            });
          }
        }
        if (records.length > 0) {
          await prisma.attendance.createMany({ data: records });
        }
      }
    }
  }

  console.log('--- Massive Seeding Complete! ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
