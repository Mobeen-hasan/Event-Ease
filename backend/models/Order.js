const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  
  // --- NEW FIELDS ---
  eventDate: { type: String }, 
  eventLocation: { type: String },
  // ------------------

  eventType: { type: String },
  guests: { type: Number },
  totalCost: { type: Number },
  status: { type: String, default: 'Pending' }, 
  
  items: {
    food: { name: String, vendor: String },
    decor: { name: String, vendor: String },
    rental: { name: String, vendor: String }
  },
  
  involvedVendors: [String],
  
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);