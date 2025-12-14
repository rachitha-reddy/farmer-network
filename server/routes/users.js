const express = require('express');
const router = express.Router();
const User = require('../models/User');

// create user
router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json({ success:true, user });
  } catch (err) { res.status(500).json({ success:false, error: err.message }); }
});

// get all users
router.get('/', async (req,res) => {
  const users = await User.find().sort({ createdAt:-1 });
  res.json(users);
});

// get profile by id
router.get('/:id', async (req,res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error:'Not found' });
  res.json(user);
});

module.exports = router;