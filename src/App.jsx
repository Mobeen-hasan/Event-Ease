import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import VendorDashboard from './VendorDashboard';
import AdminDashboard from './AdminDashboard';
import VendorLogin from './VendorLogin';
import VendorRegister from './VendorRegister';
import CustomerLogin from './CustomerLogin'; // [NEW]
import CustomerRegister from './CustomerRegister'; // [NEW]

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer Side */}
        <Route path="/" element={<Home />} />

        {/* Auth Pages */}
        <Route path="/login" element={<VendorLogin />} />
        <Route path="/register" element={<VendorRegister />} />

        {/* Customer Auth */}
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />

        {/* Protected Dashboards */}
        <Route path="/vendor" element={<VendorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;