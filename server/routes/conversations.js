const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const MessageNew = require('../models/MessageNew');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/conversations?user=username
router.get('/', async (req, res) => {
  try {
    const user = req.query.user;
    
    if (!user) {
      return res.status(400).json({ error: 'User query parameter is required' });
    }
    
    // Find all conversations where participants includes that user
    const conversations = await Conversation.find({
      participants: user
    }).sort({ lastMessageAt: -1 });
    
    // Populate avatarMap with current user avatars if not already set
    const updatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // If avatarMap is empty or missing, populate it
        if (!conv.avatarMap || Object.keys(conv.avatarMap).length === 0) {
          const users = await User.find({ username: { $in: conv.participants } })
            .select('username avatarUrl');
          
          const avatarMap = {};
          users.forEach(u => {
            if (u.avatarUrl) {
              avatarMap[u.username] = u.avatarUrl;
            }
          });
          
          conv.avatarMap = avatarMap;
          await conv.save();
        }
        
        return conv;
      })
    );
    
    res.json({ conversations: updatedConversations });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    
    // Find all messages for this conversation, sorted by createdAt ascending
    const messages = await MessageNew.find({ conversationId })
      .sort({ createdAt: 1 });
    
    res.json({ messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/conversations/:id/messages (protected with JWT)
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { text } = req.body;
    
    // Get sender from req.user (JWT decoded) - don't take from body for security
    const sender = req.user.username;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    // Verify conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Verify user is a participant
    if (!conversation.participants.includes(sender)) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }
    
    // Create and save message
    const message = await MessageNew.create({
      conversationId,
      sender,
      text: text.trim()
    });
    
    // Update conversation's lastMessage and lastMessageAt
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    
    // Update avatarMap if needed
    if (!conversation.avatarMap || !conversation.avatarMap[sender]) {
      const user = await User.findOne({ username: sender }).select('avatarUrl');
      if (user && user.avatarUrl) {
        if (!conversation.avatarMap) conversation.avatarMap = {};
        conversation.avatarMap[sender] = user.avatarUrl;
      }
    }
    
    await conversation.save();
    
    res.status(201).json({ message });
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/conversations - Create a new conversation (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { participants } = req.body;
    const currentUser = req.user.username;
    
    if (!participants || !Array.isArray(participants) || participants.length < 2) {
      return res.status(400).json({ error: 'Participants array with at least 2 users is required' });
    }
    
    // Ensure current user is in participants
    if (!participants.includes(currentUser)) {
      participants.push(currentUser);
    }
    
    // Check if conversation already exists between these participants
    const existing = await Conversation.findOne({
      participants: { $all: participants, $size: participants.length }
    });
    
    if (existing) {
      return res.json({ conversation: existing });
    }
    
    // Build avatarMap from participants
    const avatarMap = {};
    const users = await User.find({ username: { $in: participants } })
      .select('username avatarUrl');
    
    users.forEach(user => {
      if (user.avatarUrl) {
        avatarMap[user.username] = user.avatarUrl;
      }
    });
    
    // Create new conversation
    const conversation = await Conversation.create({
      participants: [...new Set(participants)], // Remove duplicates
      avatarMap
    });
    
    res.status(201).json({ conversation });
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

