const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// send message
router.post('/', async (req,res) => {
  try {
    const { from, to, text } = req.body;
    const ufrom = await User.findById(from);
    const uto = await User.findById(to);
    if (!ufrom || !uto) return res.status(400).json({ error:'invalid user ids' });
    const m = await Message.create({ from, to, text });
    res.json({ success:true, message: m });
  } catch (err) { res.status(500).json({error: err.message}); }
});

// get inbox for user
router.get('/inbox/:userId', async (req,res) => {
  const msgs = await Message.find({ to: req.params.userId }).populate('from','name avatarUrl');
  res.json({ success:true, messages: msgs });
});

module.exports = router;