const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('Reading dataset...');
  const dataset = JSON.parse(fs.readFileSync('./smart_campus_dataset.json', 'utf8'));

  console.log('Clearing existing database...');
  await prisma.attendance.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.section.deleteMany();
  await prisma.department.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.club.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.note.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const hashedDefaultPassword = await bcrypt.hash('password123', salt);

  // Force-add primary test users
  const testUsers = [
    { name: 'Admin User', email: 'vish.admin@campus.edu', role: 'admin', department: 'Administration' },
    { name: 'Raj Sharma', email: 'raj.sharma_faculty@campus.edu', role: 'faculty', department: 'CSE' },
    { name: 'Vishakha Solanki', email: 'vishakha.solanki@campus.edu', role: 'student', department: 'CSE', year: 2, section: 'A' }
  ];

  for (const tu of testUsers) {
    await prisma.user.upsert({
      where: { email: tu.email },
      update: {},
      create: {
        ...tu,
        password: hashedDefaultPassword,
      }
    });
  }

  for (const user of dataset.users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user._id,
        name: user.name,
        email: user.email,
        password: hashedDefaultPassword,
        role: user.role,
        department: user.department,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        year: user.year,
        section: user.section,
        subjects: user.subjects ? user.subjects.join(',') : null
      }
    });
  }

  console.log('Seeding Departments...');
  for (const dept of dataset.departments) {
    await prisma.department.create({
      data: {
        id: dept._id,
        name: dept.name,
        hodId: dept.hod
      }
    });

    for (const sec of dept.sections) {
      await prisma.section.create({
        data: {
          name: sec.name,
          department: dept.name,
          coordinatorId: sec.coordinator
        }
      });
    }
  }

  console.log('Seeding Classrooms, Folders, Alerts, and Comprehensive Timetables...');
  const departments = ['AIML', 'CSIT', 'CSE', 'EC', 'VLSI', 'Mechanical', 'Civil'];
  const sections = ['A', 'B'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '01:00 PM - 02:00 PM'];
  
  const allFaculty = await prisma.user.findMany({ where: { role: 'faculty' } });

  for (const dept of departments) {
    const deptFacs = allFaculty.filter(f => f.department === dept);
    if (deptFacs.length === 0) continue;

    for (const sec of sections) {
      // Pick a coordinator and a couple of teachers
      const coordinator = deptFacs[0];
      const teachers = deptFacs.slice(0, 3).map(f => ({ id: f.id }));

      const classroom = await prisma.classroom.create({
        data: {
          department: dept,
          year: 2,
          section: sec,
          coordinatorId: coordinator.id,
          teachers: {
            connect: teachers
          }
        }
      });

      // Create a default Folder
      const folder = await prisma.folder.create({
        data: {
          name: 'Lecture Materials',
          classroomId: classroom.id
        }
      });

      // Generate dummy Assignments
      await prisma.assignment.create({
        data: {
          classroomId: classroom.id,
          subject: `${dept} Core Subject`,
          title: `Assignment 1 - ${dept} Basics`,
          description: `Complete chapters 1 and 2 for ${dept}.`,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          facultyId: coordinator.id,
          department: dept,
          year: 2,
          createdBy: coordinator.name
        }
      });

      // Generate Note inside the Folder
      await prisma.note.create({
        data: {
          classroomId: classroom.id,
          folderId: folder.id,
          title: `${dept} Lecture 1`,
          description: `Introductory PDF for ${dept}.`,
          fileUrl: `https://dummy.com/notes.pdf`,
          createdBy: coordinator.name
        }
      });

      // Generate 2 Historical Alerts!
      const pastDate1 = new Date();
      pastDate1.setDate(pastDate1.getDate() - 2);
      const pastDate2 = new Date();
      pastDate2.setDate(pastDate2.getDate() - 5);

      await prisma.alert.createMany({
        data: [
          {
            classroomId: classroom.id,
            message: `Reminder: Submit your ${dept} assignment by Friday.`,
            isUrgent: false,
            createdBy: coordinator.name,
            createdAt: pastDate1
          },
          {
            classroomId: classroom.id,
            message: `URGENT: ${dept} midterms have been rescheduled!`,
            isUrgent: true,
            createdBy: coordinator.name,
            createdAt: pastDate2
          }
        ]
      });

      // Generate Comprehensive Timetable for all 5 Days!
      const timetableRecords = [];
      for (const day of days) {
        for (let i = 0; i < 3; i++) {
          const facultyObj = deptFacs[i % deptFacs.length]; // cycle through faculty
          timetableRecords.push({
            classroomId: classroom.id,
            department: dept,
            year: 2,
            section: sec,
            day: day,
            subject: `${dept} Subject ${i + 1}`,
            faculty: facultyObj.name,
            time: times[i]
          });
        }
      }

      await prisma.timetable.createMany({
        data: timetableRecords
      });
    }
  }

  console.log('Seeding 50-day Attendance for all Students...');
  const allStudents = await prisma.user.findMany({ where: { role: 'student' } });
  const allClassrooms = await prisma.classroom.findMany();
  
  const attendanceRecords = [];
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Programming', 'Communication'];
  
  // For each classroom, find its students and generate 50 days of data
  for (const classroom of allClassrooms) {
    const classStudents = allStudents.filter(s => s.department === classroom.department && s.section === classroom.section);
    
    for (const student of classStudents) {
      for (let day = 0; day < 50; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        
        attendanceRecords.push({
          studentId: student.id,
          classroomId: classroom.id,
          subject: subjects[day % subjects.length],
          date: date.toISOString().split('T')[0],
          status: Math.random() > 0.15 ? 'Present' : 'Absent', // 85% attendance rate
          facultyId: classroom.coordinatorId
        });
      }
    }
  }

  // Batch insert attendance
  const batchSize = 1000;
  for (let i = 0; i < attendanceRecords.length; i += batchSize) {
    await prisma.attendance.createMany({
      data: attendanceRecords.slice(i, i + batchSize)
    });
  }

  await prisma.notice.createMany({
    data: dataset.notices.map(n => ({
      id: n._id,
      title: n.title,
      description: n.description,
      date: n.date,
      targetAudience: n.targetAudience
    }))
  });

  console.log('Seeding Clubs & Opportunities...');
  await prisma.club.createMany({
    data: [
      { name: 'Coding Club', description: 'Exploring competitive programming and software dev.', events: 'Hacktoberfest, CP Contest' },
      { name: 'Photography Club', description: 'Capturing moments and learning visual storytelling.', events: 'Photo Walk, Exhibition' },
      { name: 'Cultural Club', description: 'Celebrating diversity through dance, music and drama.', events: 'Annual Fest, Talent Show' }
    ]
  });

  await prisma.opportunity.createMany({
    data: [
      { type: 'Hackathon', title: 'Smart India Hackathon', description: 'National level hackathon for innovation.', organizer: 'Govt of India', deadline: '2026-06-15', applyUrl: 'https://sih.gov.in' },
      { type: 'Internship', title: 'Software Engineering Intern', description: 'Summer internship at Google.', organizer: 'Google', deadline: '2026-05-30', applyUrl: 'https://google.com/careers' },
      { type: 'Scholarship', title: 'Merit-Based Grant', description: 'Full tuition coverage for toppers.', organizer: 'University Trust', deadline: '2026-08-01', applyUrl: 'https://university.edu/grant' }
    ]
  });

  console.log('Phase 12 Database successfully seeded (Clubs + Opportunities)!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
