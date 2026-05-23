const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');

// Auth imports
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const { protect } = require('./middleware/authMiddleware');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const CHATBOT_SERVICE_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:8000';

app.use(cors());
app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static('uploads'));

// Expose io to routes
app.set('io', io);

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);

  socket.on('join_classroom', (classroomId) => {
    socket.join(`room_${classroomId}`);
    console.log(`User joined room_${classroomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', apiRoutes);
app.use('/api/classrooms', protect, classroomRoutes);
app.use('/api/attendance', protect, require('./routes/attendanceRoutes'));
app.use('/api/departments', protect, require('./routes/departmentRoutes'));
app.use('/api/clubs', protect, require('./routes/clubRoutes'));
app.use('/api/opportunities', protect, require('./routes/opportunityRoutes'));
app.use('/api/issues', protect, require('./routes/issueRoutes'));
app.use('/api/admin', protect, require('./routes/adminRoutes'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Smart Campus API with Socket.IO' });
});

// Chatbot proxy route - Protected!
app.post('/api/chat', protect, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    let attendance = [];
    let timetable = [];
    
    if (req.user.role === 'student') {
      const allAttendance = await prisma.attendance.findMany({ 
        where: { studentId: req.user.id } 
      });
      const present = allAttendance.filter(a => a.status === 'Present').length;
      const total = allAttendance.length;
      const percent = total > 0 ? ((present/total)*100).toFixed(1) : 0;
      
      attendance = `Overall: ${percent}% (${present}/${total}). Recent: ${JSON.stringify(allAttendance.slice(-5))}`;
      
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const fullTimetable = await prisma.timetable.findMany({ 
        where: { department: req.user.department, year: req.user.year, section: req.user.section } 
      });
      timetable = fullTimetable.filter(t => t.day === today);
    }

    const payload = {
      message,
      userId: req.user.id,
      context: {
        profile: req.user,
        attendance: attendance,
        timetable: timetable
      }
    };

    const chatbotResponse = await axios.post(`${CHATBOT_SERVICE_URL}/chat`, payload);
    res.json({ reply: chatbotResponse.data.reply });
  } catch (error) {
    console.error('Chatbot service error:', error.message);
    res.json({ reply: "I'm having trouble connecting to my brain right now. Please try again later." });
  }
});

// File Upload Proxy Route
const multer = require('multer');
const FormData = require('form-data');
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const formData = new FormData();
    formData.append('file', req.file.buffer, { filename: req.file.originalname });
    
    const response = await axios.post(`${CHATBOT_SERVICE_URL}/upload`, formData, {
      headers: { ...formData.getHeaders() }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Use server.listen instead of app.listen for Socket.IO
server.listen(PORT, () => {
  console.log(`Server & Socket.IO running on port ${PORT}`);
});
