const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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

// search users by username (protected - excludes current user)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.userId;
    
    let query = { _id: { $ne: currentUserId } };
    
    if (q && q.trim()) {
      query.username = { $regex: q.trim(), $options: 'i' };
    }
    
    const users = await User.find(query)
      .select('username fullName avatarUrl')
      .limit(20)
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get user suggestions (protected - excludes current user)
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('username fullName avatarUrl')
      .limit(10)
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get current user profile (protected)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update current user profile (protected)
router.put('/profile', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const { fullName, farmType, crops } = req.body;
    const userId = req.user.userId;
    
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (fullName !== undefined) updateData.name = fullName; // Keep for backward compatibility
    if (farmType !== undefined) updateData.farmType = farmType;
    if (crops !== undefined) {
      // If crops is a string, try to parse it as JSON array, otherwise treat as single value
      try {
        updateData.crops = typeof crops === 'string' ? JSON.parse(crops) : crops;
      } catch {
        updateData.crops = Array.isArray(crops) ? crops : [crops];
      }
    }
    
    // Handle avatar upload
    if (req.file) {
      updateData.avatarUrl = `/uploads/${req.file.filename}`;
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// get user by username (protected)
router.get('/by-username/:username', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:username/follow - Follow a user (protected)
router.post('/:username/follow', authMiddleware, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const targetUsername = req.params.username;
    
    if (currentUsername === targetUsername) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    // Find both users
    const currentUser = await User.findOne({ username: currentUsername });
    const targetUser = await User.findOne({ username: targetUsername });
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize arrays if they don't exist
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];
    
    // Check if already following
    if (currentUser.following.includes(targetUsername)) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    
    // Add to following and followers (no duplicates)
    if (!currentUser.following.includes(targetUsername)) {
      currentUser.following.push(targetUsername);
    }
    if (!targetUser.followers.includes(currentUsername)) {
      targetUser.followers.push(currentUsername);
    }
    
    await currentUser.save();
    await targetUser.save();
    
    res.json({ 
      success: true, 
      message: `Now following ${targetUsername}`,
      following: currentUser.following 
    });
  } catch (err) {
    console.error('Error following user:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:username/unfollow - Unfollow a user (protected)
router.post('/:username/unfollow', authMiddleware, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const targetUsername = req.params.username;
    
    if (currentUsername === targetUsername) {
      return res.status(400).json({ error: 'Cannot unfollow yourself' });
    }
    
    // Find both users
    const currentUser = await User.findOne({ username: currentUsername });
    const targetUser = await User.findOne({ username: targetUsername });
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize arrays if they don't exist
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];
    
    // Remove from following and followers
    currentUser.following = currentUser.following.filter(u => u !== targetUsername);
    targetUser.followers = targetUser.followers.filter(u => u !== currentUsername);
    
    await currentUser.save();
    await targetUser.save();
    
    res.json({ 
      success: true, 
      message: `Unfollowed ${targetUsername}`,
      following: currentUser.following 
    });
  } catch (err) {
    console.error('Error unfollowing user:', err);
    res.status(500).json({ error: err.message });
  }
});

// get profile by id
router.get('/:id', async (req,res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error:'Not found' });
  res.json(user);
});

module.exports = router;