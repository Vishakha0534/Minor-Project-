const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { protect } = require('../middleware/authMiddleware');

// DELETE Notice
router.delete('/notices/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    await prisma.notice.delete({ where: { id: req.params.id } });
    res.json({ message: 'Notice deleted' });
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

// GET Global Attendance Analytics for Admin (Excel View)
router.get('/attendance-global', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    
    const { classroomId } = req.query;
    const filter = classroomId ? { where: { classroomId } } : {};
    
    const attendance = await prisma.attendance.findMany({
      ...filter,
      orderBy: { date: 'desc' }
    });
    
    // Fetch user names for the Excel view
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
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

module.exports = router;
