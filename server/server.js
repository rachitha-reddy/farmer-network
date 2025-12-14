const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads')); // serve uploaded files

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const postRoutes = require('./routes/posts');
app.use('/api/posts', postRoutes);

const resourceRoutes = require('./routes/resources');
app.use('/api/resources', resourceRoutes);

const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

const conversationRoutes = require('./routes/conversations');
app.use('/api/conversations', conversationRoutes);

// Root route
app.get('/', (req, res) => res.send('🌾 Farmer Network API is running!'));

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));