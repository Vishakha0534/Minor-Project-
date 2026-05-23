const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET students belonging to a classroom
router.get('/classroom/:classroomId', async (req, res) => {
  try {
    const { classroomId } = req.params;
    
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    });
    
    if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

    // Fetch all students in this exact dept, year, section
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        department: classroom.department,
        year: classroom.year,
        section: classroom.section
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching classroom students' });
  }
});

// POST mark attendance for an entire class at once
router.post('/mark', async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Unauthorized' });

    const { classroomId, subject, date, records } = req.body;
    const attendanceData = records.map(record => ({
      studentId: record.studentId,
      classroomId,
      subject,
      facultyId: req.user.id,
      date,
      status: record.status
    }));

    await prisma.attendance.createMany({ data: attendanceData });
    res.json({ message: 'Attendance marked successfully!' });
  } catch (error) { res.status(500).json({ error: 'Error marking attendance' }); }
});

// Admin Global Attendance (Enriched)
router.get('/admin/all', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const attendance = await prisma.attendance.findMany({ orderBy: { date: 'desc' } });
    
    const studentIds = [...new Set(attendance.map(a => a.studentId))];
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true }
    });
    
    const studentMap = {};
    students.forEach(s => studentMap[s.id] = s.name);
    
    const enriched = attendance.map(a => ({
      ...a,
      studentName: studentMap[a.studentId] || 'Unknown'
    }));
    
    res.json(enriched);
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

// Faculty Global Attendance (Enriched)
router.get('/faculty/all', async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Unauthorized' });
    const attendance = await prisma.attendance.findMany({
      where: { facultyId: req.user.id },
      orderBy: { date: 'desc' }
    });
    
    const studentIds = [...new Set(attendance.map(a => a.studentId))];
    const students = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true }
    });
    
    const studentMap = {};
    students.forEach(s => studentMap[s.id] = s.name);
    
    const enriched = attendance.map(a => ({
      ...a,
      studentName: studentMap[a.studentId] || 'Unknown'
    }));
    
    res.json(enriched);
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
