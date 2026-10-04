const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  itemName: String,
  vendorName: String,
  reason: String,
  status: { type: String, default: 'Pending' }, // Pending -> Resolved
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);