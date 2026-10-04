const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Catering', 'Decor', 'Rentals', 'Photography']
  },
  subCategory: { type: String },
  price: { type: Number, required: true },
  unit: { type: String },
  description: { type: String },
  vendorName: { type: String, default: "EventEase Certified Vendor" },
  rating: { type: Number, default: 4.8 },
  image: { type: String },

  // --- NEW FIELDS (Detailed Attributes) ---
  ingredients: { type: [String], default: [] }, // For Food
  isHalal: { type: Boolean, default: false },   // For Food
  features: { type: [String], default: [] },    // For Photographers/Rentals (e.g. "Drone Coverage")

  // --- NEW FIELD ---
  isVerified: { type: Boolean, default: false } // Default is FALSE (Pending)
});

module.exports = mongoose.model('Item', itemSchema);