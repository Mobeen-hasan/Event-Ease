const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Item = require('./models/Item');

dotenv.config();

// Reliable, static image links
const sampleItems = [
  // --- CATERING ---
  {
    name: "Chicken Biryani Degh",
    category: "Catering",
    subCategory: "Rice",
    price: 12000,
    unit: "per degh",
    description: "Authentic Karachi spicy biryani. Serves 50-60.",
    vendorName: "Karachi Foods",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Gulaab Jamun Box",
    category: "Catering",
    subCategory: "Dessert",
    price: 1500,
    unit: "per kg",
    description: "Hot fresh sweets served in clay pots.",
    vendorName: "Sweet Palace",
    image: "https://www.pexels.com/photo/delicious-indian-gulab-jamun-in-clay-pot-30577321/"
  },
  {
    name: "Zinger Burger Deal",
    category: "Catering",
    subCategory: "Fast Food",
    price: 450,
    unit: "per head",
    description: "Crispy chicken burger with fries and drink.",
    vendorName: "Crunch House",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Fudge Cake (2lbs)",
    category: "Catering",
    subCategory: "Cake",
    price: 2500,
    unit: "2 lbs",
    description: "Rich dark chocolate layer cake.",
    vendorName: "The Cake Studio",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },

  // --- DECOR ---
  {
    name: "Birthday Balloon Set",
    category: "Decor",
    subCategory: "Birthday",
    price: 8000,
    unit: "complete setup",
    description: "Black and Gold luxury balloon arch.",
    vendorName: "Party Poppers",
    image: "https://images.unsplash.com/photo-1530103862676-de3c9da59af7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Wedding Stage Floral",
    category: "Decor",
    subCategory: "Wedding",
    price: 45000,
    unit: "per night",
    description: "Grand floral stage with white sofa.",
    vendorName: "Grand Events",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0202128?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Mehndi Theme Decor",
    category: "Decor",
    subCategory: "Wedding",
    price: 15000,
    unit: "per night",
    description: "Traditional yellow cushions and marigolds.",
    vendorName: "Desi Vibe",
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },

  // --- RENTALS ---
  {
    name: "Marquee Tent",
    category: "Rentals",
    subCategory: "Tent",
    price: 20000,
    unit: "per kanal",
    description: "Waterproof marquee for outdoor events.",
    vendorName: "Tent Masters",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "DJ Sound System",
    category: "Rentals",
    subCategory: "Sound",
    price: 8000,
    unit: "per night",
    description: "Speakers, Bass unit, and Mixer with Mic.",
    vendorName: "Sound Check",
    image: "https://images.unsplash.com/photo-1520114878144-6123749968dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    await Item.deleteMany({});

    // --- SHORTCUT: Add isVerified: true to all sample items automatically ---
    const verifiedItems = sampleItems.map(item => ({ ...item, isVerified: true }));

    await Item.insertMany(verifiedItems);
    // --- SEED ADMIN USER ---
    const User = require('./models/User');
    await User.deleteMany({ role: 'admin' }); // Clear old admins
    await User.create({
      username: 'admin',
      password: 'admin123', // In real app, this should be hashed
      role: 'admin',
      isVerified: true
    });
    console.log('Admin User Created: admin / admin123');

    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
};

seedDB();