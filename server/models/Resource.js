const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, required: true }, // e.g. "Available", "Borrowed"
  owner: { type: String, required: true }, // person or organization
  contact: { type: String, required: true }, // phone or email
  location: { type: String, required: true }, // village / area
  nextAvailable: { type: String, required: true }, // e.g. "Immediately", "3 days"
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Resource', resourceSchema);

