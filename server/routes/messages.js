const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// send message (protected)
router.post('/', authMiddleware, async (req,res) => {
  try {
    const { to, text } = req.body;
    const from = req.user.userId;
    
    if (!to || !text) {
      return res.status(400).json({ error: 'Recipient and message text are required' });
    }
    
    const uto = await User.findById(to);
    if (!uto) return res.status(400).json({ error:'Invalid recipient user id' });
    
    const m = await Message.create({ from, to, text });
    res.json({ success:true, message: m });
  } catch (err) { res.status(500).json({error: err.message}); }
});

// get inbox for user (protected - can only get own inbox)
router.get('/inbox/:userId', authMiddleware, async (req,res) => {
  // Ensure user can only access their own inbox
  if (req.params.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden: Cannot access another user\'s inbox' });
  }
  
  const msgs = await Message.find({ to: req.params.userId })
    .populate('from', 'username fullName avatarUrl')
    .sort({ createdAt: -1 });
  res.json({ success:true, messages: msgs });
});

// Get conversations for current user (protected)
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Get all unique users the current user has messaged or received messages from
    const sentMessages = await Message.find({ from: userId }).distinct('to');
    const receivedMessages = await Message.find({ to: userId }).distinct('from');
    const allUserIds = [...new Set([...sentMessages, ...receivedMessages])];
    
    // Exclude current user from the list
    const otherUserIds = allUserIds.filter(id => id.toString() !== userId.toString());
    
    const users = await User.find({ _id: { $in: otherUserIds } })
      .select('username fullName avatarUrl');
    
    // Get last message for each conversation
    const conversations = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { from: userId, to: user._id },
            { from: user._id, to: userId }
          ]
        }).sort({ createdAt: -1 });
        
        return {
          user: {
            id: user._id.toString(),
            username: user.username,
            fullName: user.fullName || user.username,
            avatarUrl: user.avatarUrl || ''
          },
          lastMessage: lastMessage ? {
            text: lastMessage.text,
            createdAt: lastMessage.createdAt
          } : null
        };
      })
    );
    
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages between current user and another user (protected)
router.get('/conversations/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const otherUserId = req.params.otherUserId;
    
    const messages = await Message.find({
      $or: [
        { from: userId, to: otherUserId },
        { from: otherUserId, to: userId }
      ]
    })
    .populate('from', 'username fullName avatarUrl')
    .populate('to', 'username fullName avatarUrl')
    .sort({ createdAt: 1 });
    
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message to a specific user (protected)
router.post('/conversations/:otherUserId/messages', authMiddleware, async (req, res) => {
  try {
    const from = req.user.userId;
    const to = req.params.otherUserId;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    const uto = await User.findById(to);
    if (!uto) {
      return res.status(400).json({ error: 'Invalid recipient user id' });
    }
    
    const message = await Message.create({ from, to, text });
    const populatedMessage = await Message.findById(message._id)
      .populate('from', 'username fullName avatarUrl')
      .populate('to', 'username fullName avatarUrl');
    
    res.json({ success: true, message: populatedMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;