const express = require('express');
const router = express.Router();

// Simple route to confirm assistant API works
router.get('/', (req, res) => {
  res.json({ message: '🌾 AI Assistant route is active and working!' });
});

module.exports = router;
