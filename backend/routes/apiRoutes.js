const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { protect } = require('../middleware/authMiddleware');

// Get current user profile and their section coordinator
router.get('/profile', protect, async (req, res) => {
  try {
    const user = req.user;
    
    // If student, find their coordinator
    let coordinator = null;
    if (user.role === 'student' && user.department && user.section) {
      const sectionInfo = await prisma.section.findFirst({
        where: {
          department: user.department,
          name: user.section
        }
      });
      
      if (sectionInfo && sectionInfo.coordinatorId) {
        coordinator = await prisma.user.findUnique({
          where: { id: sectionInfo.coordinatorId },
          select: { name: true, email: true, phone: true }
        });
      }
    }

    res.json({
      ...user,
      coordinator
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Get user's timetable
router.get('/timetable', protect, async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'student') {
      const timetable = await prisma.timetable.findMany({
        where: { department: user.department, year: user.year, section: user.section },
        orderBy: { day: 'asc' }
      });
      return res.json(timetable);
    }

    // Faculty / HOD — combine ALL assigned classrooms (coordinated + taught)
    if (user.role === 'faculty' || user.role === 'hod') {
      const coordinated = await prisma.classroom.findMany({
        where: { coordinatorId: user.id }
      });
      const taught = await prisma.classroom.findMany({
        where: { teachers: { some: { id: user.id } } }
      });

      // De-duplicate by id
      const allRoomsMap = {};
      [...coordinated, ...taught].forEach(r => { allRoomsMap[r.id] = r; });
      const allRooms  = Object.values(allRoomsMap);
      const roomIds   = allRooms.map(r => r.id);
      const coordIdSet = new Set(coordinated.map(r => r.id));

      let entries = [];
      if (roomIds.length > 0) {
        entries = await prisma.timetable.findMany({
          where: { classroomId: { in: roomIds } },
          orderBy: { day: 'asc' }
        });
      }

      // Fallback: search by faculty name
      if (entries.length === 0) {
        entries = await prisma.timetable.findMany({
          where: { faculty: user.name },
          orderBy: { day: 'asc' }
        });
        return res.json(entries.map(e => ({ ...e, isCoordinated: false })));
      }

      // Enrich entries with classroom info + isCoordinated flag
      const enriched = entries.map(e => {
        const room = e.classroomId ? allRoomsMap[e.classroomId] : null;
        return {
          ...e,
          isCoordinated: e.classroomId ? coordIdSet.has(e.classroomId) : false,
          classroomLabel: room ? `${room.department} Y${room.year}–${room.section}` : ''
        };
      });

      return res.json(enriched);
    }

    // Admin: return all
    if (user.role === 'admin') {
      const timetable = await prisma.timetable.findMany({ orderBy: { day: 'asc' } });
      return res.json(timetable);
    }

    res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching timetable' });
  }
});


// Get user's attendance
router.get('/attendance', protect, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role === 'student') {
      const attendance = await prisma.attendance.findMany({
        where: { studentId: user.id },
        orderBy: { date: 'desc' },
        take: 50 // limit to recent 50 for performance
      });
      return res.json(attendance);
    }
    
    res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

module.exports = router;
