const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // id of the author
  username: { type: String, required: true },
  avatarUrl: { type: String }, // optional
  images: { type: [String], required: true }, // array of image URLs; can be empty
  caption: { type: String }, // optional
  community: {
    type: String,
    required: true,   // e.g. "wheat", "corn", "rice", "fruits", "vegetables", "other"
    trim: true
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);