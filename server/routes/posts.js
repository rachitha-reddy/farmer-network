const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// GET /api/posts/feed - Get posts from followed users (protected)
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    
    // Get current user to access their following list
    const me = await User.findOne({ username: currentUsername });
    if (!me) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Include current user's own posts plus posts from users they follow
    const authors = [...(me.following || []), currentUsername];
    
    // Query posts from these authors
    const posts = await Post.find({ username: { $in: authors } })
      .sort({ createdAt: -1 });
    
    res.json({ posts });
  } catch (err) {
    console.error('Error loading feed:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts - Get all posts (public, optionally filtered by community)
router.get('/', async (req, res) => {
  try {
    const { community } = req.query;
    let query = {};
    
    // Valid communities (exclude "other" and undefined/null)
    const validCommunities = ['wheat', 'corn', 'rice', 'fruits', 'vegetables'];
    
    // If community filter is provided, normalize and add it to the query
    if (community && community.trim()) {
      const normalizedCommunity = community.trim().toLowerCase();
      if (validCommunities.includes(normalizedCommunity)) {
        query.community = normalizedCommunity;
      } else {
        // Invalid community, return empty array
        return res.json({ posts: [] });
      }
    } else {
      // If no specific community requested, only return posts with valid communities (exclude "other" and null)
      query.community = { $in: validCommunities };
    }
    
    const posts = await Post.find(query).sort({ createdAt: -1 });
    console.log(`GET /api/posts${community ? `?community=${community}` : ''} - Found ${posts.length} posts`);
    res.json({ posts });
  } catch (err) {
    console.error('Error in GET /api/posts:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts - Create a post with file uploads (protected)
router.post('/', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    const { caption, community } = req.body;
    
    // Validate community field
    const allowedCommunities = ['wheat', 'corn', 'rice', 'fruits', 'vegetables', 'other'];
    if (!community || !allowedCommunities.includes(community.trim())) {
      return res.status(400).json({ 
        error: 'Community is required and must be one of: ' + allowedCommunities.join(', ') 
      });
    }
    
    // Get userId and username from req.user (decoded from JWT)
    const userId = req.user.userId;
    const username = req.user.username;
    
    // Optionally get avatarUrl from user record
    let avatarUrl = req.user.avatarUrl || '';
    if (!avatarUrl) {
      const user = await User.findById(userId);
      if (user) {
        avatarUrl = user.avatarUrl || '';
      }
    }
    
    // Get uploaded image URLs
    const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Create and save Post document
    // Normalize community to lowercase for consistency
    const normalizedCommunity = community.trim().toLowerCase();
    
    const post = await Post.create({
      userId,
      username,
      avatarUrl,
      images: imageUrls,
      caption: caption || '',
      community: normalizedCommunity
    });
    
    res.status(201).json({ post });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/communities - Get distinct communities with post counts (must be before /:id)
router.get('/communities', async (req, res) => {
  try {
    const validCommunities = ['wheat', 'corn', 'rice', 'fruits', 'vegetables'];
    
    // Aggregate to get count of posts per community
    const communities = await Post.aggregate([
      { $match: { community: { $in: validCommunities } } },
      { $group: { _id: '$community', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Format the response
    const formatted = communities.map(c => ({
      community: c._id,
      count: c.count
    }));
    
    res.json({ communities: formatted });
  } catch (err) {
    console.error('Error loading communities:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/posts/:id - Delete a post (protected, only by owner)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;
    
    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if the user owns this post
    if (post.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    
    // Delete the post
    await Post.findByIdAndDelete(postId);
    
    // TODO: Optionally delete associated image files from uploads directory
    
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;