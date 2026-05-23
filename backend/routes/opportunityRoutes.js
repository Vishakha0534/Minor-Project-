const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all opportunities with filtering
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { where: { type } } : {};
    const opps = await prisma.opportunity.findMany({
      ...filter,
      orderBy: { createdAt: 'desc' }
    });
    res.json(opps);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin add opportunity
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const { type, title, description, organizer, deadline, applyUrl } = req.body;
    const opp = await prisma.opportunity.create({
      data: { type, title, description, organizer, deadline, applyUrl }
    });
    res.json(opp);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin delete opportunity
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    await prisma.opportunity.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
