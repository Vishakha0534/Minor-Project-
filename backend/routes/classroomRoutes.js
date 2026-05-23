const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const assignmentsDir = path.join(__dirname, '../uploads/assignments');
const notesDir = path.join(__dirname, '../uploads/notes');
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir, { recursive: true });
if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir, { recursive: true });

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.baseUrl.includes('classrooms') && req.url.includes('assignments')) {
      cb(null, 'uploads/assignments/');
    } else {
      cb(null, 'uploads/notes/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET all classrooms for the logged-in user
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'student') {
      const classrooms = await prisma.classroom.findMany({
        where: { department: user.department, year: user.year, section: user.section }
      });
      return res.json({ coordinated: [], taught: classrooms });
    }
    if (user.role === 'faculty' || user.role === 'hod' || user.role === 'admin') {
      const coordinated = await prisma.classroom.findMany({ where: { coordinatorId: user.id } });
      const taught = await prisma.classroom.findMany({ where: { teachers: { some: { id: user.id } } } });
      return res.json({ coordinated, taught });
    }
  } catch (error) { res.status(500).json({ error: 'Server error fetching classrooms' }); }
});

// CREATE new classroom
router.post('/', async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Unauthorized' });
    const { department, year, section } = req.body;
    const classroom = await prisma.classroom.create({
      data: { department, year: parseInt(year), section, coordinatorId: req.user.id }
    });
    res.json(classroom);
  } catch (error) { res.status(500).json({ error: 'Server error creating classroom' }); }
});

// GET classroom details
router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const assignments = await prisma.assignment.findMany({ where: { classroomId: id }, orderBy: { createdAt: 'desc' } });
    const notes = await prisma.note.findMany({ where: { classroomId: id }, orderBy: { createdAt: 'desc' } });
    const folders = await prisma.folder.findMany({ where: { classroomId: id } });
    const alerts = await prisma.alert.findMany({ where: { classroomId: id }, orderBy: { createdAt: 'desc' } });
    const timetable = await prisma.timetable.findMany({ where: { classroomId: id } });
    
    let studentAttendance = [];
    if (req.user.role === 'student') {
      studentAttendance = await prisma.attendance.findMany({ 
        where: { classroomId: id, studentId: req.user.id },
        orderBy: { date: 'desc' }
      });
    }

    res.json({ assignments, notes, folders, alerts, timetable, studentAttendance });
  } catch (error) { res.status(500).json({ error: 'Server error fetching details' }); }
});

// POST Folders
router.post('/:id/folders', async (req, res) => {
  try {
    const folder = await prisma.folder.create({ data: { name: req.body.name, classroomId: req.params.id } });
    res.json(folder);
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

// POST Notes (with File Upload)
router.post('/:id/notes', upload.single('file'), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Unauthorized' });
    
    const { title, description, folderId } = req.body;
    const fileUrl = req.file ? `/uploads/notes/${req.file.filename}` : null;

    const note = await prisma.note.create({
      data: { 
        classroomId: req.params.id, 
        folderId: folderId || null, 
        title, 
        description, 
        fileUrl, 
        createdBy: req.user.name 
      }
    });
    res.json(note);
  } catch (error) { res.status(500).json({ error: 'Failed to create note' }); }
});

// POST Assignment (with File Upload)
router.post('/:id/assignments', upload.single('file'), async (req, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Unauthorized' });

    const { title, description, deadline, subject } = req.body;
    const fileUrl = req.file ? `/uploads/assignments/${req.file.filename}` : null;
    const classroom = await prisma.classroom.findUnique({ where: { id: req.params.id } });

    const assignment = await prisma.assignment.create({
      data: {
        classroomId: req.params.id,
        title,
        description,
        deadline,
        subject: subject || 'General',
        fileUrl,
        department: classroom.department,
        year: classroom.year,
        facultyId: req.user.id,
        createdBy: req.user.name
      }
    });
    res.json(assignment);
  } catch (error) { res.status(500).json({ error: 'Failed to create assignment' }); }
});

// PUT Extend Assignment Deadline
router.put('/:id/assignments/:assignmentId', async (req, res) => {
  try {
    const updated = await prisma.assignment.update({
      where: { id: req.params.assignmentId },
      data: { deadline: req.body.deadline }
    });
    res.json(updated);
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

// Alerts
router.post('/:id/alerts', async (req, res) => {
  try {
    const newAlert = await prisma.alert.create({
      data: { classroomId: req.params.id, message: req.body.message, isUrgent: req.body.isUrgent || false, createdBy: req.user.name }
    });
    req.app.get('io').to(`room_${req.params.id}`).emit('classroom-alert', newAlert);
    res.status(201).json(newAlert);
  } catch (error) { res.status(500).json({ error: 'Failed to create alert' }); }
});

// DELETE Assignment
router.delete('/assignments/:id', async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) return res.status(404).json({ error: 'Not found' });
    
    // Check ownership or admin
    if (req.user.role !== 'admin' && assignment.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.assignment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ error: 'Delete failed' }); }
});

// DELETE Note
router.delete('/notes/:id', async (req, res) => {
  try {
    const note = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!note) return res.status(404).json({ error: 'Not found' });

    // For simplicity, checking createdBy name or admin
    if (req.user.role !== 'admin' && note.createdBy !== req.user.name) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.note.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ error: 'Delete failed' }); }
});

// Create Timetable Entry (Admin)
router.post('/timetable', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const { classroomId, day, subject, faculty, time, department, year, section } = req.body;
    const entry = await prisma.timetable.create({
      data: { classroomId, day, subject, faculty, time, department, year: parseInt(year), section }
    });
    res.json(entry);
  } catch (error) { res.status(500).json({ error: 'Failed to create timetable entry' }); }
});

// DELETE Classroom (Admin)
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    await prisma.classroom.delete({ where: { id: req.params.id } });
    res.json({ message: 'Classroom deleted' });
  } catch (error) { res.status(500).json({ error: 'Delete failed' }); }
});

// Delete Timetable Entry (Admin)
router.delete('/timetable/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    await prisma.timetable.delete({ where: { id: req.params.id } });
    res.json({ message: 'Timetable entry deleted' });
  } catch (error) { res.status(500).json({ error: 'Delete failed' }); }
});

module.exports = router;
