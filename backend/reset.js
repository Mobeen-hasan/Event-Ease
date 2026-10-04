const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const resetDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Wipe Collections
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('items').deleteMany({});
    await mongoose.connection.collection('orders').deleteMany({});

    console.log('Database Wiped Clean (Users, Items, Orders removed).');
    console.log('Now go to /register to create new Vendors with passwords.');
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
};

resetDB();