const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const authMiddleware = require('../middleware/auth');

// GET /api/resources - Get all resources (public)
router.get('/', async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json({ resources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resources - Create a new resource (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, status, owner, contact, location, nextAvailable } = req.body;
    
    // Validate all required fields
    if (!name || !status || !owner || !contact || !location || !nextAvailable) {
      return res.status(400).json({ error: 'All fields are required: name, status, owner, contact, location, nextAvailable' });
    }

    const resource = await Resource.create({
      name,
      status,
      owner,
      contact,
      location,
      nextAvailable,
      createdBy: req.user.userId
    });

    res.status(201).json({ resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
