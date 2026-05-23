const fs = require('fs');
const crypto = require('crypto');

// Helpers
const generateId = () => crypto.randomBytes(12).toString('hex');
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();

const firstNamesM = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Riaan', 'Aryan', 'Karan', 'Rahul', 'Rohan', 'Amit', 'Vikram', 'Sanjay', 'Surya', 'Rajat', 'Manish', 'Kunal', 'Ajay'];
const firstNamesF = ['Vishakha', 'Aditi', 'Diya', 'Kavya', 'Neha', 'Priya', 'Riya', 'Sneha', 'Ananya', 'Aisha', 'Pooja', 'Shruti', 'Meera', 'Roshni', 'Kriti', 'Simran', 'Tanvi', 'Isha', 'Ritu'];
const lastNames = ['Sharma', 'Verma', 'Solanki', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Iyer', 'Desai', 'Joshi', 'Chauhan', 'Yadav', 'Rao', 'Das', 'Pandey', 'Nair', 'Bose'];

const departmentsList = ['AIML', 'CSIT', 'CSE', 'EC', 'VLSI', 'Mechanical', 'Civil'];
const subjectsByDept = {
  'AIML': ['Machine Learning', 'Deep Learning', 'Neural Networks', 'Python for AI', 'Data Science'],
  'CSIT': ['Web Technologies', 'Software Testing', 'Information Security', 'Cloud Architectures'],
  'CSE': ['Data Structures', 'Operating Systems', 'DBMS', 'Computer Networks', 'AI'],
  'EC': ['Signals and Systems', 'Digital Electronics', 'Microprocessors', 'Communication Systems'],
  'VLSI': ['Analog Layout', 'Digital VLSI', 'Verilog', 'Semiconductor Devices'],
  'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Robotics'],
  'Civil': ['Structural Analysis', 'Fluid Kinematics', 'Surveying', 'Concrete Technology']
};

const dataset = {
  users: [],
  departments: [],
  attendance: [],
  assignments: [],
  timetable: [],
  notices: [],
  clubs: [],
  scholarships: [],
  issues: []
};

let chatbotKB = "";

// Helper to create user
const createPerson = (role, deptName) => {
  const gender = randomItem(['M', 'F']);
  const first = gender === 'M' ? randomItem(firstNamesM) : randomItem(firstNamesF);
  const last = randomItem(lastNames);
  const name = `${first} ${last}`;
  const email = `${first.toLowerCase()}.${last.toLowerCase()}_${generateId().substring(0,4)}@campus.edu`;
  
  return {
    _id: generateId(),
    name,
    email,
    password: "$2b$10$8IFe5wY7uaCoVo7Ihya/1OplvYSLB3V8xTPm1TifWpBECOd1.f6Q2", // password123
    role,
    department: deptName,
    phone: `+91 9${randomInt(100000000, 999999999)}`,
    address: `${randomInt(10, 999)}, Tech Park, Bengaluru, India`,
    gender: gender === 'M' ? 'Male' : 'Female',
    dateOfBirth: randomDate(new Date(1970, 0, 1), new Date(2005, 0, 1))
  };
};

// 2 Admins
dataset.users.push({...createPerson('admin', 'Admin'), name: 'Vish Admin', email: 'vish.admin@campus.edu'});
dataset.users.push({...createPerson('admin', 'Admin')});

// Generate Departments & their specific faculty/students
const depts = departmentsList.map(name => ({
  _id: generateId(),
  name,
  hod: null,
  sections: [
    { name: 'A', coordinator: null },
    { name: 'B', coordinator: null }
  ],
  facultyIds: [],
  studentIds: []
}));

const allFaculty = [];
const allStudents = [];

// Populate each department
depts.forEach(d => {
  // 1 HOD
  const hod = {...createPerson('hod', d.name), subjects: [randomItem(subjectsByDept[d.name])]};
  d.hod = hod._id;
  d.facultyIds.push(hod._id);
  allFaculty.push(hod);
  dataset.users.push(hod);

  // 9 Faculty (total 10 including HOD)
  const deptFaculty = [];
  for(let i=0; i<9; i++) {
    let fac;
    if (d.name === 'CSE' && i === 0) {
      fac = {...createPerson('faculty', d.name), name: 'Raj Sharma', email: 'raj.sharma_faculty@campus.edu', subjects: [randomItem(subjectsByDept[d.name])]};
    } else if (d.name === 'CSE' && i === 1) {
      fac = {...createPerson('faculty', d.name), name: 'Riya Trivedi', email: 'riya.trivedi_faculty@campus.edu', subjects: [randomItem(subjectsByDept[d.name])]};
    } else {
      fac = {...createPerson('faculty', d.name), subjects: [randomItem(subjectsByDept[d.name])]};
    }
    d.facultyIds.push(fac._id);
    deptFaculty.push(fac);
    allFaculty.push(fac);
    dataset.users.push(fac);
  }

  // Assign Coordinators to Section A and B from the deptFaculty
  d.sections[0].coordinator = deptFaculty[0]._id;
  d.sections[1].coordinator = deptFaculty[1]._id;

  // 30 Students (15 in Section A, 15 in Section B)
  ['A', 'B'].forEach((sectionName, secIndex) => {
    for(let i=0; i<15; i++) {
      let stu;
      // Specific student injections for CSE Sec A
      if (d.name === 'CSE' && sectionName === 'A' && i === 0) {
        stu = {...createPerson('student', d.name), name: 'Vishakha Solanki', email: 'vishakha.solanki@campus.edu', year: 2, section: 'A', gender: 'Female'};
      } else if (d.name === 'CSE' && sectionName === 'A' && i === 1) {
        stu = {...createPerson('student', d.name), name: 'Vedanshi Dabbawala', email: 'vedanshi.dabbawala@campus.edu', year: 2, section: 'A', gender: 'Female'};
      } else if (d.name === 'CSE' && sectionName === 'A' && i === 2) {
        stu = {...createPerson('student', d.name), name: 'Sejal Pandya', email: 'sejal.pandya@campus.edu', year: 2, section: 'A', gender: 'Female'};
      } else if (d.name === 'CSE' && sectionName === 'A' && i === 3) {
        stu = {...createPerson('student', d.name), name: 'Vaidic Bagul', email: 'vaidic.bagul@campus.edu', year: 2, section: 'A', gender: 'Male'};
      } else {
        stu = {...createPerson('student', d.name), year: randomItem([1, 2, 3, 4]), section: sectionName};
      }
      
      d.studentIds.push(stu._id);
      allStudents.push(stu);
      dataset.users.push(stu);
      
      const coordName = secIndex === 0 ? deptFaculty[0].name : deptFaculty[1].name;
      chatbotKB += `${stu.name} is a ${['first', 'second', 'third', 'fourth'][stu.year-1]}-year ${stu.department} student in section ${stu.section}. Their faculty coordinator is ${coordName}.\n`;
    }
  });
});

dataset.departments = depts;

// Attendance & Assignments
allStudents.forEach(stu => {
  const subjects = subjectsByDept[stu.department] || subjectsByDept['CSE'];
  const teacherOptions = allFaculty.filter(f => f.department === stu.department);
  
  subjects.forEach(sub => {
    const teacher = teacherOptions.find(t => t.subjects.includes(sub)) || randomItem(teacherOptions);
    
    // Assignments (only a few per subject overall)
    if(Math.random() > 0.85) {
      dataset.assignments.push({
        _id: generateId(),
        subject: sub,
        title: `${sub} - Final Project`,
        description: `Complete the practical implementation for ${sub}.`,
        deadline: randomDate(new Date(), new Date(Date.now() + 10000000000)),
        facultyId: teacher._id,
        department: stu.department,
        year: stu.year
      });
    }

    // Attendance (10-15 per student per subject)
    let presentCount = 0;
    const totalClasses = randomInt(10, 15);
    for(let i=0; i<totalClasses; i++) {
      const isPresent = Math.random() > 0.2;
      if(isPresent) presentCount++;
      
      dataset.attendance.push({
        _id: generateId(),
        studentId: stu._id,
        subject: sub,
        facultyId: teacher._id,
        date: randomDate(new Date(2023, 0, 1), new Date()),
        status: isPresent ? 'Present' : 'Absent'
      });
    }
    
    const attPerc = Math.round((presentCount / totalClasses) * 100);
    chatbotKB += `Their attendance in ${sub} is ${attPerc}%.\n`;
  });
});

// Deduplicate assignments
dataset.assignments = dataset.assignments.filter((v,i,a)=>a.findIndex(t=>(t.title === v.title && t.year === v.year && t.department === v.department))===i);

// Timetable
depts.forEach(d => {
  [1,2,3,4].forEach(year => {
    ['A', 'B'].forEach(section => {
      const schedule = [];
      const deptFacs = allFaculty.filter(f => f.department === d.name);
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(day => {
        schedule.push({
          day,
          subject: randomItem(subjectsByDept[d.name]),
          faculty: randomItem(deptFacs).name,
          time: '10:00 AM - 11:00 AM'
        });
      });
      dataset.timetable.push({
        _id: generateId(),
        department: d.name,
        year,
        section,
        schedule
      });
    });
  });
});

// Notices, Clubs, Scholarships, Issues (same as before)
dataset.notices.push(
  { _id: generateId(), title: 'Mid-Sem Exams', description: 'Mid semester exams will begin from 15th of next month.', date: new Date().toISOString(), targetAudience: 'student' },
  { _id: generateId(), title: 'Faculty Meeting', description: 'Mandatory faculty meeting in the main auditorium.', date: new Date().toISOString(), targetAudience: 'faculty' },
  { _id: generateId(), title: 'Campus Fest 2026', description: 'Annual cultural fest registrations are open.', date: new Date().toISOString(), targetAudience: 'all' }
);
dataset.clubs.push(
  { _id: generateId(), name: 'Coding Club', description: 'For competitive programming and development.', members: allStudents.slice(0, 15).map(s=>s._id), events: ['Hackathon 2026'] },
  { _id: generateId(), name: 'Robotics Society', description: 'Build and program robots.', members: allStudents.slice(15, 30).map(s=>s._id), events: ['RoboWars'] }
);
dataset.scholarships.push(
  { _id: generateId(), name: 'Merit Scholarship', eligibility: 'CGPA > 9.0', amount: 50000, deadline: '2026-08-01T00:00:00Z' },
  { _id: generateId(), name: 'Women in Tech', eligibility: 'Female students in Tech Branches', amount: 75000, deadline: '2026-09-01T00:00:00Z' }
);
dataset.issues.push(
  { _id: generateId(), raisedBy: allStudents[0]._id, role: 'student', issue: 'Hostel Wi-Fi is very slow.', status: 'Pending', response: '' },
  { _id: generateId(), raisedBy: allFaculty[0]._id, role: 'faculty', issue: 'Projector in Room 302 not working.', status: 'Resolved', response: 'Replaced bulb.' }
);

// Chatbot General FAQs
chatbotKB += `
--- FAQs ---
Attendance Criteria: Students must maintain a minimum of 75% attendance in all subjects to be eligible for end-semester exams.
Assignment Submission: All assignments must be submitted via the Smart Campus portal before 11:59 PM on the deadline date. Late submissions attract a 10% penalty per day.
Timetable Queries: Classes run from 9:00 AM to 4:00 PM, Monday to Friday. Lunch break is from 1:00 PM to 2:00 PM.
Scholarship Info: The Merit Scholarship grants ₹50,000 to students with CGPA > 9.0. The Women in Tech scholarship grants ₹75,000 for female students in Tech Branches.
`;

fs.writeFileSync('smart_campus_dataset.json', JSON.stringify(dataset, null, 2));
fs.writeFileSync('chatbot_knowledge_base.txt', chatbotKB);

console.log('Massive Dataset generated successfully with custom accounts!');
