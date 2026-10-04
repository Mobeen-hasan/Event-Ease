# EventEase

A web app for planning events in one place. Customers pick an event type, set a budget, and get a suggested package of catering, decor, and rentals from approved vendors. Vendors list their items and manage bookings, and an admin approves vendors and handles complaints.

Built as a Web Programming semester project (Fall 2025). Prices are in PKR.

## Features

**Customers**
- Browse items by category (catering, decor, rentals, photography) and filter by vendor
- Budget planner: choose an event type, guest count, and budget, and get a suggested package. The budget is split roughly 50% food, 30% decor, 20% rentals, and items are picked to fit each share
- Book a single item or a whole package
- Download the estimate as a PDF
- Submit a complaint about an item
- Dark mode

**Vendors**
- Register and wait for admin approval before logging in
- Add and remove items
- Confirm or reject incoming orders

**Admin**
- Approve vendor accounts and verify new items (customers only see verified items)
- Review complaints: remove the reported item or dismiss the complaint

## Tech stack

- Frontend: React 19, Vite, React Router, React-Bootstrap, jsPDF
- Backend: Node.js, Express 5
- Database: MongoDB with Mongoose

## Running it locally

You need Node.js and a MongoDB database (a free MongoDB Atlas cluster works, or a local MongoDB).

1. Install dependencies for both parts:

   ```bash
   npm install
   cd backend && npm install
   ```

2. Create `backend/.env` using `backend/.env.example` as a template and put in your own connection string.

3. Load the sample items and create an admin account:

   ```bash
   cd backend
   node seed.js
   ```

   This wipes the existing items and adds the sample data, plus an admin user (`admin` / `admin123`). That login is for local demo use only.

4. Start the backend (runs on port 5000):

   ```bash
   cd backend
   npm start
   ```

5. In another terminal, start the frontend from the project root:

   ```bash
   npm run dev
   ```

   Then open http://localhost:5173. The frontend calls the backend at `http://localhost:5000`, so the backend needs to be running.

## Project structure

```
src/                  React pages (Home, vendor and admin dashboards, login/register)
backend/server.js     Express API
backend/models/       Mongoose models: User, Item, Order, Complaint
backend/seed.js       Sample data and admin account
backend/reset.js      Clears users, items, and orders
```

## Known limitations

- Passwords are stored and compared as plain text, and the API has no tokens or session handling. The dashboards are only hidden in the UI, and the admin routes are not protected on the server.
- The "budget planner" is a set of filtering rules, not machine learning.
- The API address is hard-coded to `localhost:5000`.

Fixing the first one (password hashing and JWT-based auth with role checks on the routes) is the next thing I would do. The same approach is in my [Job Tracker](https://github.com/Mobeen-hasan/Job-Tracker) project.
