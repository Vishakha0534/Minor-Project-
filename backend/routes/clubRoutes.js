const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await prisma.club.findMany();
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Club (Admin)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const { name, description, events } = req.body;
    const club = await prisma.club.create({
      data: { name, description, events }
    });
    res.json(club);
  } catch (error) { res.status(500).json({ error: 'Failed to create club' }); }
});

// Delete Club (Admin)
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    await prisma.club.delete({ where: { id: req.params.id } });
    res.json({ message: 'Club deleted successfully' });
  } catch (error) { res.status(500).json({ error: 'Delete failed' }); }
});

module.exports = router;
