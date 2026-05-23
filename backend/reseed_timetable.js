/**
 * Re-seeds ONLY the timetable with 7 lectures per day (9AM-5PM real college timing)
 * Does NOT touch users, classrooms, attendance, clubs, or any other data
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subjectsByDept = {
  'AIML':       ['Machine Learning', 'Deep Learning', 'Neural Networks', 'Python for AI', 'Data Science', 'Statistics', 'Computer Vision'],
  'CSIT':       ['Web Technologies', 'Software Testing', 'Information Security', 'Cloud Architectures', 'Computer Networks', 'Data Mining', 'Mobile Computing'],
  'CSE':        ['Data Structures', 'Operating Systems', 'DBMS', 'Computer Networks', 'Algorithms', 'Compiler Design', 'Software Engineering'],
  'EC':         ['Signals & Systems', 'Digital Electronics', 'Microprocessors', 'Communication Systems', 'Analog Circuits', 'Electromagnetic Theory', 'Control Systems'],
  'VLSI':       ['Analog Layout', 'Digital VLSI', 'Verilog HDL', 'Semiconductor Devices', 'Physical Design', 'FPGA Design', 'Testing & Verification'],
  'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Robotics', 'CAD/CAM', 'Manufacturing Processes', 'Heat Transfer'],
  'Civil':      ['Structural Analysis', 'Fluid Kinematics', 'Surveying', 'Concrete Technology', 'Geotechnics', 'Environmental Engg', 'Transportation Engg'],
};

// 7 real lecture slots: 9AM-5PM with lunch at 1-2PM
const LECTURE_SLOTS = [
  { label: 'L1', time: '09:00 AM', timeRange: '09:00 AM - 10:00 AM' },
  { label: 'L2', time: '10:00 AM', timeRange: '10:00 AM - 11:00 AM' },
  { label: 'L3', time: '11:00 AM', timeRange: '11:00 AM - 12:00 PM' },
  { label: 'L4', time: '12:00 PM', timeRange: '12:00 PM - 01:00 PM' },
  // Lunch: 01:00 PM - 02:00 PM (not a lecture)
  { label: 'L5', time: '02:00 PM', timeRange: '02:00 PM - 03:00 PM' },
  { label: 'L6', time: '03:00 PM', timeRange: '03:00 PM - 04:00 PM' },
  { label: 'L7', time: '04:00 PM', timeRange: '04:00 PM - 05:00 PM' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

async function reseedTimetable() {
  console.log('=== Re-seeding Timetable (7 lectures/day, 9AM-5PM) ===\n');

  // Step 1: Clear old timetable
  const deleted = await prisma.timetable.deleteMany();
  console.log(`Cleared ${deleted.count} old timetable entries`);

  // Step 2: Load classrooms and faculty
  const classrooms = await prisma.classroom.findMany();
  const allFaculty = await prisma.user.findMany({
    where: { role: { in: ['faculty', 'hod'] } }
  });

  console.log(`Found ${classrooms.length} classrooms, ${allFaculty.length} faculty members\n`);

  let totalCreated = 0;
  const records = [];

  for (const room of classrooms) {
    const dept = room.department;
    const subjects = subjectsByDept[dept] || subjectsByDept['CSE'];
    const deptFaculty = allFaculty.filter(f => f.department === dept);

    for (const day of DAYS) {
      for (let i = 0; i < LECTURE_SLOTS.length; i++) {
        const slot = LECTURE_SLOTS[i];
        // Rotate subjects and faculty across slots so each slot has a different subject
        const subject = subjects[i % subjects.length];
        const fac = deptFaculty[(i + DAYS.indexOf(day)) % Math.max(deptFaculty.length, 1)];

        records.push({
          classroomId: room.id,
          department:  room.department,
          year:        room.year,
          section:     room.section,
          day:         day,
          subject:     subject,
          faculty:     fac ? fac.name : 'TBD',
          time:        slot.timeRange,   // "09:00 AM - 10:00 AM" format
        });
      }
    }
  }

  // Bulk insert in batches
  const BATCH = 500;
  for (let i = 0; i < records.length; i += BATCH) {
    await prisma.timetable.createMany({ data: records.slice(i, i + BATCH) });
    totalCreated += Math.min(BATCH, records.length - i);
    process.stdout.write(`\r  Inserted ${totalCreated} / ${records.length} entries...`);
  }

  console.log(`\n\n✅ Done! Created ${totalCreated} timetable entries`);
  console.log(`   = ${classrooms.length} classrooms × 5 days × 7 lectures`);
}

reseedTimetable()
  .catch(e => { console.error('\nERROR:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
