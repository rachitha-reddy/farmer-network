const express = require('express');
const router = express.Router();
const multer = require('multer');
const Post = require('../models/Post');

const upload = multer({ dest: 'uploads/' });

// Create a post
router.post('/', upload.array('images', 4), async (req, res) => {
  try {
    const { authorId, text, location } = req.body;
    const imageUrls = req.files.map(f => `/uploads/${f.filename}`);
    const post = await Post.create({ author: authorId, text, imageUrls, location });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;