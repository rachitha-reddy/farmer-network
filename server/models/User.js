const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  fullName: String,
  avatarUrl: String,
  name: { type: String }, // Keep for backward compatibility
  farmType: String,
  crops: [String],
  following: [{ type: String }], // array of usernames
  followers: [{ type: String }], // array of usernames
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);