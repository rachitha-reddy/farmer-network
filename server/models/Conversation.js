const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: { type: [String], required: true }, // array of usernames or user IDs
  lastMessage: { type: String }, // optional
  lastMessageAt: { type: Date, default: Date.now },
  avatarMap: { type: mongoose.Schema.Types.Mixed, default: {} } // plain object mapping username → avatarUrl
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);





