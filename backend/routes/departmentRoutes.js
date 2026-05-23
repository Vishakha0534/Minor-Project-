const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all departments with HOD names
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany();
    
    // Enrich with HOD info
    const enriched = await Promise.all(departments.map(async (dept) => {
      let hod = null;
      if (dept.hodId) {
        hod = await prisma.user.findUnique({
          where: { id: dept.hodId },
          select: { name: true, email: true }
        });
      }
      
      const facultyCount = await prisma.user.count({
        where: { department: dept.name, role: 'faculty' }
      });
      
      const studentCount = await prisma.user.count({
        where: { department: dept.name, role: 'student' }
      });

      return {
        ...dept,
        hodName: hod ? hod.name : 'Not Assigned',
        hodEmail: hod ? hod.email : '',
        facultyCount,
        studentCount
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get specific department detail
router.get('/:id', async (req, res) => {
  try {
    const dept = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!dept) return res.status(404).json({ error: 'Not found' });

    const hod = dept.hodId ? await prisma.user.findUnique({ where: { id: dept.hodId } }) : null;
    
    const faculty = await prisma.user.findMany({
      where: { department: dept.name, role: 'faculty' },
      select: { id: true, name: true, email: true, subjects: true }
    });

    const students = await prisma.user.findMany({
      where: { department: dept.name, role: 'student' },
      select: { id: true, name: true, year: true, section: true }
    });

    const notices = await prisma.notice.findMany({
      where: { targetAudience: { contains: dept.name } },
      orderBy: { date: 'desc' },
      take: 5
    });

    res.json({
      ...dept,
      hod,
      faculty,
      students,
      notices
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
