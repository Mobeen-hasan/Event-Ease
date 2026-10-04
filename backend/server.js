// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- Middleware ---
// Allows JSON data to be sent to frontend
app.use(express.json());
// Allows React (port 5173) to talk to this Server (port 5000)
app.use(cors());

// --- Database Connection ---
// We will put the link in a separate .env file for security
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// --- Basic Route (Test) ---
app.get('/', (req, res) => {
  res.send('EventEase Backend is Running!');
});

// Add this inside server.js, BEFORE app.listen(...)

// 1. Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, businessName, role } = req.body;

    // Default to 'customer' if no role provided, unless businessName exists then 'vendor'
    const finalRole = role || (businessName ? 'vendor' : 'customer');

    const newUser = new require('./models/User')({
      username,
      password,
      businessName,
      role: finalRole,
      isVerified: finalRole === 'customer' ? true : false // Customers verified by default
    });

    await newUser.save();
    res.status(201).json({ message: "Registration successful!" });
  } catch (err) {
    res.status(400).json({ error: "Username already exists" });
  }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await require('./models/User').findOne({ username, password });

    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    if (!user.isVerified && user.role === 'vendor') return res.status(403).json({ error: "Account pending Admin approval" });

    res.json(user); // Send back user info (role, businessName)
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Pending Vendors (For Admin)
app.get('/api/admin/vendors', async (req, res) => {
  const vendors = await require('./models/User').find({ role: 'vendor' });
  res.json(vendors);
});

// 4. Approve Vendor
app.put('/api/admin/vendors/:id/approve', async (req, res) => {
  await require('./models/User').findByIdAndUpdate(req.params.id, { isVerified: true });
  res.json({ success: true });
});

// Route to get all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await require('./models/Item').find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NEW: POST ROUTE (Add Item) ---
app.post('/api/items', async (req, res) => {
  try {
    const newItem = new require('./models/Item')(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- NEW: DELETE ROUTE (Remove Item) ---
app.delete('/api/items/:id', async (req, res) => {
  try {
    await require('./models/Item').findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NEW: APPROVE ITEM ROUTE ---
app.put('/api/items/:id/verify', async (req, res) => {
  try {
    const updatedItem = await require('./models/Item').findByIdAndUpdate(
      req.params.id,
      { isVerified: true }, // The change we are making
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NEW: ORDER ROUTES ---

// 1. Create a New Order (Customer clicks "Book")
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new require('./models/Order')(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 2. Get All Orders (For Vendor Dashboard)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await require('./models/Order').find().sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NEW: UPDATE ORDER STATUS ---
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // Expect { status: 'Confirmed' } or { status: 'Rejected' }
    const updatedOrder = await require('./models/Order').findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- COMPLAINT ROUTES ---

// 1. Submit a Complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const newComplaint = new require('./models/Complaint')(req.body);
    await newComplaint.save();
    res.status(201).json({ message: "Complaint submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Complaints (For Admin)
app.get('/api/complaints', async (req, res) => {
  const complaints = await require('./models/Complaint').find().sort({ date: -1 });
  res.json(complaints);
});

// 3. Resolve Complaint (Ban Item)
app.delete('/api/complaints/:id/ban', async (req, res) => {
  try {
    const complaint = await require('./models/Complaint').findById(req.params.id);
    if (complaint) {
      // Delete the Actual Item
      await require('./models/Item').findByIdAndDelete(complaint.itemId);
      // Mark complaint as Resolved
      complaint.status = 'Resolved (Banned)';
      await complaint.save();
      res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Dismiss Complaint
app.put('/api/complaints/:id/dismiss', async (req, res) => {
  await require('./models/Complaint').findByIdAndUpdate(req.params.id, { status: 'Dismissed' });
  res.json({ success: true });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});