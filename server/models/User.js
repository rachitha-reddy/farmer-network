const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  farmType: String,
  crops: [String]
});

module.exports = mongoose.model('User', userSchema);