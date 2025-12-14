const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

router.get('/:postId', async (req,res) => {
  const comments = await Comment.find({ post: req.params.postId }).populate('author','name avatarUrl');
  res.json({ success:true, comments });
});

module.exports = router;