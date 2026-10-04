const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // In real app, hash this!
  businessName: { type: String }, // Required only for vendors
  role: { type: String, enum: ['vendor', 'admin', 'customer'], default: 'customer' },
  isVerified: { type: Boolean, default: false } // Vendors need admin approval
});

module.exports = mongoose.model('User', userSchema);