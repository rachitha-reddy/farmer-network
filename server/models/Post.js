const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  imageUrls: [String],
  location: String
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);