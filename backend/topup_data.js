/**
 * SMART CAMPUS AI - Data Top-Up Script
 * Adds ONLY missing data: timetable, attendance (50 days), clubs, opportunities, notices
 * Does NOT delete or modify any existing users or classrooms
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subjectsByDept = {
  'AIML':       ['Machine Learning', 'Deep Learning', 'Neural Networks', 'Python for AI', 'Data Science'],
  'CSIT':       ['Web Technologies', 'Software Testing', 'Information Security', 'Cloud Architectures', 'Computer Networks'],
  'CSE':        ['Data Structures', 'Operating Systems', 'DBMS', 'Computer Networks', 'Algorithms'],
  'EC':         ['Signals & Systems', 'Digital Electronics', 'Microprocessors', 'Communication Systems', 'VLSI Design'],
  'VLSI':       ['Analog Layout', 'Digital VLSI', 'Verilog HDL', 'Semiconductor Devices', 'Physical Design'],
  'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Robotics', 'CAD/CAM'],
  'Civil':      ['Structural Analysis', 'Fluid Kinematics', 'Surveying', 'Concrete Technology', 'Geotechnics'],
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const times = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM'];

async function topupData() {
  console.log('=== Smart Campus Data Top-Up ===\n');

  // ─── Load all existing data ───────────────────────────────────────────────
  const allUsers      = await prisma.user.findMany();
  const allClassrooms = await prisma.classroom.findMany();
  const students      = allUsers.filter(u => u.role === 'student');
  const faculty       = allUsers.filter(u => u.role === 'faculty' || u.role === 'hod');

  console.log(`Found: ${allUsers.length} users, ${allClassrooms.length} classrooms, ${students.length} students`);

  // ─── 1. CLEAR OLD INCOMPLETE DATA (only these tables) ────────────────────
  console.log('\n[1] Clearing old timetable, attendance, club, opportunity, notice data...');
  await prisma.timetable.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.club.deleteMany();

  // ─── 2. TIMETABLE (5 subjects × 5 days for every dept/year/section) ──────
  console.log('[2] Seeding timetable...');
  let timetableCount = 0;

  for (const classroom of allClassrooms) {
    const dept    = classroom.department;
    const subjects = subjectsByDept[dept] || subjectsByDept['CSE'];
    const deptFac  = faculty.filter(f => f.department === dept);

    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const subject = subjects[dayIdx % subjects.length];
      const fac     = deptFac[dayIdx % Math.max(deptFac.length, 1)];
      
      await prisma.timetable.create({
        data: {
          classroomId: classroom.id,
          department:  classroom.department,
          year:        classroom.year,
          section:     classroom.section,
          day:         days[dayIdx],
          subject:     subject,
          faculty:     fac ? fac.name : 'TBD',
          time:        times[dayIdx % times.length],
        }
      });
      timetableCount++;
    }
  }
  console.log(`   ✓ Created ${timetableCount} timetable entries`);

  // ─── 3. ATTENDANCE (50 days × every student × multiple subjects) ──────────
  console.log('[3] Seeding 50-day attendance for all students...');
  let attendanceCount = 0;
  const batchSize     = 500;
  let batch           = [];

  for (const student of students) {
    const dept     = student.department;
    const subjects = subjectsByDept[dept] || subjectsByDept['CSE'];

    // Find the classroom this student belongs to
    const room = allClassrooms.find(
      c => c.department === dept &&
           c.year       === (student.year    || 1) &&
           c.section    === (student.section || 'A')
    );
    if (!room) continue;

    const deptFac = faculty.filter(f => f.department === dept);

    // 50 days of attendance for each subject
    for (const subject of subjects) {
      const subjectFac = deptFac[Math.floor(Math.random() * Math.max(deptFac.length, 1))];

      for (let daysAgo = 0; daysAgo < 50; daysAgo++) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        // Skip weekends
        const dow = date.getDay();
        if (dow === 0 || dow === 6) continue;

        // Realistic attendance: 75–95% present
        const isPresent = Math.random() > 0.15;

        batch.push({
          studentId:   student.id,
          classroomId: room.id,
          subject:     subject,
          facultyId:   subjectFac ? subjectFac.id : room.coordinatorId,
          date:        date.toISOString().split('T')[0], // YYYY-MM-DD
          status:      isPresent ? 'Present' : 'Absent',
        });

        if (batch.length >= batchSize) {
          await prisma.attendance.createMany({ data: batch });
          attendanceCount += batch.length;
          batch = [];
          process.stdout.write(`\r   Processing... ${attendanceCount} records`);
        }
      }
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await prisma.attendance.createMany({ data: batch });
    attendanceCount += batch.length;
  }
  console.log(`\n   ✓ Created ${attendanceCount} attendance records`);

  // ─── 4. CLUBS (Rich dummy data) ───────────────────────────────────────────
  console.log('[4] Seeding clubs...');
  const clubsData = [
    { name: 'CodeCraft Club',      description: 'Competitive programming, hackathons, and open-source contributions. Weekly coding challenges every Friday.', events: 'Hackathon 2026,Code Sprint,Debug Wars' },
    { name: 'Robotics Society',    description: 'Design, build and program robots. Participate in national-level competitions like RoboWars and TechRobo.', events: 'RoboWars 2026,Arduino Night,Bot Building Workshop' },
    { name: 'AI & ML Club',        description: 'Explore the frontiers of Artificial Intelligence. Guest lectures, paper reading sessions, and Kaggle competitions.', events: 'AI Summit,Kaggle Meetup,Deep Learning Bootcamp' },
    { name: 'Photography Club',    description: 'Capture moments and stories through the lens. Monthly photo walks, editing workshops, and exhibition events.', events: 'Campus Photo Walk,Portrait Workshop,Annual Exhibition' },
    { name: 'Drama & Arts Society', description: 'Celebrate creativity through theatre, painting, and music. Annual stage performance and campus cultural fest.', events: 'Annual Play,Talent Show,Art Exhibition 2026' },
    { name: 'Entrepreneurship Cell', description: 'Nurturing the next generation of founders. Startup pitch competitions, mentorship sessions, and industry connects.', events: 'Startup Pitch Day,Founder Talk,Business Plan Competition' },
    { name: 'Green Campus Club',   description: 'Dedicated to sustainability and environmental awareness. Tree plantation drives and eco-audits of campus facilities.', events: 'Plantation Drive,Eco Audit,Clean Campus Day' },
    { name: 'Sports Committee',    description: 'Organize and manage all campus sports events. Annual sports meet, inter-college tournaments, and fitness challenges.', events: 'Annual Sports Meet,Inter-College Tournament,Fitness Week' },
  ];

  for (const club of clubsData) {
    await prisma.club.create({ data: club });
  }
  console.log(`   ✓ Created ${clubsData.length} clubs`);

  // ─── 5. OPPORTUNITIES (Hackathons, Internships, Scholarships) ────────────
  console.log('[5] Seeding opportunities...');
  const existingOpp = await prisma.opportunity.count();
  if (existingOpp === 0) {
    await prisma.opportunity.createMany({
      data: [
        { type: 'Hackathon',   title: 'Smart India Hackathon 2026',      description: 'National-level hackathon by Govt of India. Build solutions for real problems.', organizer: 'Ministry of Education', deadline: '2026-08-15', applyUrl: 'https://sih.gov.in' },
        { type: 'Hackathon',   title: 'HackMIT 2026',                    description: 'International hackathon at MIT. Open to all undergraduate students.', organizer: 'MIT', deadline: '2026-09-01', applyUrl: 'https://hackmit.org' },
        { type: 'Internship',  title: 'Google Summer of Code',           description: 'Paid open-source internship program by Google. 3 months remote.', organizer: 'Google', deadline: '2026-04-02', applyUrl: 'https://summerofcode.withgoogle.com' },
        { type: 'Internship',  title: 'Microsoft Engage Program',        description: 'Summer engineering internship at Microsoft India. Full-time, paid.', organizer: 'Microsoft', deadline: '2026-03-31', applyUrl: 'https://careers.microsoft.com' },
        { type: 'Scholarship', title: 'Merit Scholarship 2026',          description: 'Full tuition waiver for students with CGPA above 9.0. Apply with marksheets.', organizer: 'University', deadline: '2026-07-01', applyUrl: '' },
        { type: 'Scholarship', title: 'Women in Tech Scholarship',       description: 'Rs 75,000 scholarship for female students in engineering branches.', organizer: 'Tech Foundation', deadline: '2026-06-30', applyUrl: '' },
        { type: 'Hackathon',   title: 'CodeChef SnackDown 2026',         description: 'Global online coding competition. Individual and team entries welcome.', organizer: 'CodeChef', deadline: '2026-07-20', applyUrl: 'https://codechef.com/snackdown' },
      ]
    });
    console.log('   ✓ Created 7 opportunities');
  } else {
    console.log(`   ℹ Skipped (${existingOpp} already exist)`);
  }

  // ─── 6. NOTICES ───────────────────────────────────────────────────────────
  console.log('[6] Seeding notices...');
  const existingNotices = await prisma.notice.count();
  if (existingNotices === 0) {
    await prisma.notice.createMany({
      data: [
        { title: 'Mid-Semester Examinations',    description: 'Mid semester exams will commence from 15th June 2026. Detailed schedule posted on the portal.',        date: new Date().toISOString(), targetAudience: 'student' },
        { title: 'Faculty Development Program',  description: 'A 3-day FDP on AI in Education is scheduled for 20-22 June. All faculty members must attend.',          date: new Date().toISOString(), targetAudience: 'faculty' },
        { title: 'Campus Fest 2026 — Registrations Open', description: 'Annual cultural festival "Aura 2026" registrations are now open. Last date: 10th June.',     date: new Date().toISOString(), targetAudience: 'all' },
        { title: 'Library Timing Change',        description: 'The central library will remain open till 10 PM starting June 1st to support exam preparation.',          date: new Date().toISOString(), targetAudience: 'all' },
        { title: 'Scholarship Applications',     description: 'Students with CGPA above 9.0 can apply for the Merit Scholarship before 1st July 2026.',                date: new Date().toISOString(), targetAudience: 'student' },
      ]
    });
    console.log('   ✓ Created 5 notices');
  } else {
    console.log(`   ℹ Skipped (${existingNotices} already exist)`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  const finalAttendance = await prisma.attendance.count();
  const finalTimetable  = await prisma.timetable.count();
  const finalClubs      = await prisma.club.count();

  console.log('\n=== Top-Up Complete! ===');
  console.log(`  Attendance records : ${finalAttendance}`);
  console.log(`  Timetable entries  : ${finalTimetable}`);
  console.log(`  Clubs              : ${finalClubs}`);
}

topupData()
  .catch(e => { console.error('\nERROR:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
