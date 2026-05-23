const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all issues based on role
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    let issues;

    if (user.role === 'admin') {
      issues = await prisma.issue.findMany({ orderBy: { createdAt: 'desc' } });
    } else if (user.role === 'hod') {
      issues = await prisma.issue.findMany({ 
        where: { department: user.department },
        orderBy: { createdAt: 'desc' } 
      });
    } else {
      issues = await prisma.issue.findMany({ 
        where: { raisedById: user.id },
        orderBy: { createdAt: 'desc' } 
      });
    }
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Raise a new issue
router.post('/', async (req, res) => {
  try {
    const { title, description, department } = req.body;
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        department,
        raisedBy: req.user.name,
        raisedById: req.user.id,
        role: req.user.role,
        status: 'Pending'
      }
    });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Respond to an issue
router.put('/:id/respond', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hod') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { response, status } = req.body;
    const updated = await prisma.issue.update({
      where: { id: req.params.id },
      data: {
        response,
        status, // Resolved, In Progress
        respondedBy: req.user.name
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE Issue (Admin)
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    
    const issue = await prisma.issue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ error: 'Issue record not found' });

    await prisma.issue.delete({ where: { id: req.params.id } });
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) { res.status(500).json({ error: 'Internal server error during deletion' }); }
});

module.exports = router;
