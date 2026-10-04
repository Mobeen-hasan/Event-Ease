import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';
import {
  Navbar, Nav, Container, Button, Row, Col, Card, Form, Badge, Modal, Spinner, Alert, Tab, Tabs, Dropdown
} from 'react-bootstrap';
import {
  Users, Gift, MapPin, Star, MessageCircle, Phone, CheckCircle, Store, Filter, Search, Calendar, ArrowUpDown, Flag, Download, ShoppingBag, PartyPopper, Clock, ChevronDown, Moon, Sun
} from 'lucide-react';
import { jsPDF } from "jspdf";

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // --- STATE ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(5);
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState(false);

  // Wizard State
  const [budget, setBudget] = useState(25000);
  const [guests, setGuests] = useState(50);
  const [eventType, setEventType] = useState('Birthday Parties');

  // Date & Location State
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  // Logic State
  const [generatedPackage, setGeneratedPackage] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [key, setKey] = useState('all');
  const [showSingleBookModal, setShowSingleBookModal] = useState(false);
  const [singleBookItem, setSingleBookItem] = useState(null);

  // Marketplace Filter State
  const [selectedVendor, setSelectedVendor] = useState('All Vendors');
  const [uniqueVendors, setUniqueVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('low-high');

  // Booking State
  const [bookingData, setBookingData] = useState({ name: '', phone: '' });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Reporting State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportItem, setReportItem] = useState(null);
  const [reportReason, setReportReason] = useState('');

  // Get Today's Date
  const today = new Date().toISOString().split('T')[0];

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetch('http://localhost:5000/api/items')
      .then(res => res.json())
      .then(data => {
        const verifiedOnly = data.filter(item => item.isVerified === true);
        setItems(verifiedOnly);
        const vendors = [...new Set(verifiedOnly.map(item => item.vendorName))].filter(Boolean);
        setUniqueVendors(vendors);
        setLoading(false);
      })
      .catch(err => console.error("Error:", err));
  }, []);

  // --- 2. SMART BUDGET LOGIC ---
  const generatePlan = () => {
    if (!eventDate || !eventLocation) return alert("Please select a Date and Location first!");

    const getCost = (item) => item.price * (item.unit === 'per head' ? guests : 1);
    let totalBudget = budget;
    let foodBudget = totalBudget * 0.5;

    const foodItems = items.filter(i => i.category === 'Catering');
    const decorItems = items.filter(i => i.category === 'Decor');
    const rentalItems = items.filter(i => i.category === 'Rentals');

    let selectedFood = null;
    let selectedDecor = null;
    let selectedRental = null;
    let currentTotal = 0;

    // --- FOOD STRATEGY ---
    const affordableFood = foodItems.filter(i => getCost(i) <= foodBudget);
    const cakeEvents = ['Birthday Parties', 'Graduation Events', 'Baby Showers'];
    
    if (cakeEvents.includes(eventType)) {
      const cakes = affordableFood.filter(i => i.subCategory === 'Cake');
      cakes.sort((a, b) => b.price - a.price);
      if (cakes.length > 0) selectedFood = cakes[0];
    }

    if (!selectedFood) {
      const mains = affordableFood.filter(i => ['Rice', 'Fast Food'].includes(i.subCategory));
      mains.sort((a, b) => getCost(b) - getCost(a));
      selectedFood = mains[0];
    }

    if (!selectedFood && affordableFood.length > 0) {
      affordableFood.sort((a, b) => getCost(b) - getCost(a));
      selectedFood = affordableFood[0];
    }

    if (!selectedFood) selectedFood = foodItems[0];

    if (selectedFood) {
      currentTotal += getCost(selectedFood);
      totalBudget -= getCost(selectedFood);
    }

    // --- DECOR STRATEGY ---
    let decorBudget = budget * 0.3;
    const affordableDecor = decorItems.filter(i => i.price <= decorBudget);
    let decorMatches = affordableDecor.filter(i => i.subCategory && eventType.toLowerCase().includes(i.subCategory.toLowerCase()));
    if (decorMatches.length === 0) decorMatches = affordableDecor;
    decorMatches.sort((a, b) => b.price - a.price);
    selectedDecor = decorMatches[0] || decorItems[0];
    if (selectedDecor) currentTotal += selectedDecor.price;

    // --- RENTAL STRATEGY ---
    let rentalBudget = budget * 0.2;
    const affordableRentals = rentalItems.filter(i => i.price <= rentalBudget);
    affordableRentals.sort((a, b) => b.price - a.price);
    selectedRental = affordableRentals[0] || rentalItems[0];
    if (selectedRental) currentTotal += rentalItems[0].price;

    setGeneratedPackage({
      food: selectedFood,
      decor: selectedDecor,
      rental: selectedRental,
      totalCost: currentTotal
    });
    setShowPlanModal(true);
  };

  // --- 3. BOOKING LOGIC ---
  const openSingleBookModal = (item) => {
    setSingleBookItem(item);
    setBookingSuccess(false);
    setShowSingleBookModal(true);
  };

  const handleBookOrder = async (isSingleItem = false) => {
    if (!bookingData.name || !bookingData.phone) return alert("Please fill in your details!");
    let finalTotalCost, finalItems, involvedVendors;

    if (isSingleItem === true) {
      if (!eventDate || !eventLocation) return alert("Please select Date and Location!");
      let qty = 1;
      if (singleBookItem.unit === 'per head') qty = guests;
      if (singleBookItem.unit === 'per hour') qty = hours;
      finalTotalCost = singleBookItem.price * qty;

      let slot = 'rental';
      if (singleBookItem.category === 'Catering') slot = 'food';
      if (singleBookItem.category === 'Decor') slot = 'decor';
      if (singleBookItem.category === 'Photography') slot = 'rental';

      finalItems = { [slot]: { name: singleBookItem.name, vendor: singleBookItem.vendorName } };
      involvedVendors = [singleBookItem.vendorName];
    } else {
      finalTotalCost = generatedPackage.totalCost;
      finalItems = {
        food: { name: generatedPackage.food?.name, vendor: generatedPackage.food?.vendorName },
        decor: { name: generatedPackage.decor?.name, vendor: generatedPackage.decor?.vendorName },
        rental: { name: generatedPackage.rental?.name, vendor: generatedPackage.rental?.vendorName }
      };
      involvedVendors = [generatedPackage.food?.vendorName, generatedPackage.decor?.vendorName, generatedPackage.rental?.vendorName].filter(Boolean);
    }

    try {
      await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: bookingData.name,
          customerPhone: bookingData.phone,
          eventType: eventType || 'Custom Event',
          eventDate, eventLocation, guests,
          totalCost: finalTotalCost,
          items: finalItems,
          involvedVendors
        })
      });
      setBookingSuccess(true);
    } catch (error) {
      alert("Failed to submit order.");
    }
  };

  // --- PDF LOGIC ---
  const downloadInvoice = () => {
    const doc = new jsPDF();
    const isSingle = showSingleBookModal && singleBookItem;

    doc.setFontSize(22); doc.setTextColor(99, 102, 241); doc.text("EventEase Invoice", 20, 20);
    doc.setFontSize(12); doc.setTextColor(0, 0, 0); doc.text("Official Booking Receipt", 20, 30);
    doc.line(20, 35, 190, 35);
    doc.setFontSize(14);
    doc.text(`Customer: ${bookingData.name}`, 20, 50);
    doc.text(`Phone: ${bookingData.phone}`, 20, 60);
    doc.text(`Event: ${eventType} (${guests} Guests)`, 20, 70);
    doc.text(`Date & Location: ${eventDate} @ ${eventLocation}`, 20, 80);

    doc.setFillColor(240, 240, 240); doc.rect(20, 95, 170, 10, 'F');
    doc.setFont(undefined, 'bold'); doc.text("Service Details", 25, 102);
    doc.setFont(undefined, 'normal');
    let y = 120;

    if (isSingle) {
      doc.text(`Item: ${singleBookItem.name}`, 20, y);
      doc.text(`Vendor: ${singleBookItem.vendorName}`, 120, y);
      y += 10;
    } else if (generatedPackage) {
      if (generatedPackage.food) {
        doc.text(`Catering: ${generatedPackage.food.name}`, 20, y);
        doc.text(`Vendor: ${generatedPackage.food.vendorName || 'EventEase'}`, 120, y);
        y += 10;
      }
      if (generatedPackage.decor) {
        doc.text(`Decor: ${generatedPackage.decor.name}`, 20, y);
        doc.text(`Vendor: ${generatedPackage.decor.vendorName || 'EventEase'}`, 120, y);
        y += 10;
      }
      if (generatedPackage.rental) {
        doc.text(`Rentals: ${generatedPackage.rental.name}`, 20, y);
        doc.text(`Vendor: ${generatedPackage.rental.vendorName || 'EventEase'}`, 120, y);
        y += 10;
      }
    }

    doc.line(20, y + 5, 190, y + 5);
    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    const total = isSingle
      ? (singleBookItem.price * (singleBookItem.unit === 'per head' ? guests : 1))
      : generatedPackage.totalCost;
    doc.text(`Total Estimate: ${total.toLocaleString()} PKR`, 20, y + 20);
    doc.save("EventEase_Booking.pdf");
  };

  // --- INTERACTIONS ---
  const handleWhatsApp = (item) => {
    if (!user) return navigate('/customer/login');
    const message = `Hi ${item.vendorName || 'Vendor'}, I found your item "${item.name}" on EventEase.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const openReportModal = (item) => {
    if (!user) return navigate('/customer/login');
    setReportItem(item);
    setShowReportModal(true);
  };

  const handleItemClick = () => {
    if (!user) navigate('/customer/login');
  }

  const handleReportSubmit = async () => {
    if (!reportReason) return alert("Please enter a reason");
    await fetch('http://localhost:5000/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: reportItem._id,
        itemName: reportItem.name,
        vendorName: reportItem.vendorName,
        reason: reportReason
      })
    });
    alert("Complaint submitted to Admin.");
    setShowReportModal(false);
    setReportReason('');
  };

  const getFilteredItems = () => {
    let filtered = items.filter(item => key === 'all' || item.category === key);
    if (selectedVendor !== 'All Vendors') {
      filtered = filtered.filter(item => item.vendorName === selectedVendor);
    }
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    filtered.sort((a, b) => {
      if (sortOption === 'low-high') return a.price - b.price;
      if (sortOption === 'high-low') return b.price - a.price;
      return 0;
    });
    return filtered;
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  // --- INTERNAL STYLES FOR UI ENHANCEMENT ---
  const styles = {
    heroSection: {
        background: darkMode 
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' 
            : 'linear-gradient(135deg, #eef2f3 0%, #8e9eab 100%)',
        backgroundImage: darkMode 
            ? 'linear-gradient(to right top, #1f2937, #1e2532, #1d212d, #1c1d29, #1a1924)'
            : 'linear-gradient(to right top, #f3f4f6, #ebecf0, #e3e5ea, #dbdee4, #d3d7de)',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        transition: 'background 0.3s ease'
    },
    glassCard: {
        background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255, 255, 255, 0.3)',
    },
  };

  return (
    <div className={darkMode ? 'dark-mode' : 'light-mode'} style={{ minHeight: '100vh', backgroundColor: darkMode ? '#121212' : '#ffffff', color: darkMode ? '#e0e0e0' : 'inherit' }}>
      <style>
        {`
          /* --- TRANSITIONS --- */
          * { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.1s ease; }

          /* --- NAVBAR --- */
          .navbar-glass {
            background: ${darkMode ? 'rgba(18, 18, 18, 0.9)' : 'rgba(255, 255, 255, 0.9)'} !important;
            backdrop-filter: blur(8px);
            border-bottom: 1px solid ${darkMode ? '#333' : '#dee2e6'} !important;
          }

          /* --- GENERAL DARK MODE OVERRIDES --- */
          .dark-mode .bg-white { background-color: #1e1e1e !important; }
          .dark-mode .bg-light { background-color: #2d2d2d !important; }
          .dark-mode .text-dark { color: #f8f9fa !important; }
          .dark-mode .text-muted { color: #a0a0a0 !important; }
          .dark-mode .text-secondary { color: #b0b0b0 !important; }
          .dark-mode .border { border-color: #404040 !important; }
          .dark-mode .border-bottom { border-color: #404040 !important; }
          .dark-mode .card { background-color: #1e1e1e; border-color: #333; color: #fff; }

          /* --- INPUTS & DROPDOWNS DARK MODE --- */
          .dark-mode .form-control { background-color: #2d2d2d; border-color: #444; color: #fff; }
          .dark-mode .form-control:focus { background-color: #333; border-color: #0d6efd; color: #fff; }
          .dark-mode .input-group-text { background-color: #252525 !important; border-color: #444; color: #ccc; }
          
          /* FIXED: Make placeholder visible in dark mode */
          .dark-mode input::placeholder { color: #aaa !important; opacity: 1; }

          /* FIXED: Hide Native Browser Date Icon to remove Double Icon */
          input[type="date"]::-webkit-calendar-picker-indicator {
            background: transparent;
            bottom: 0;
            color: transparent;
            cursor: pointer;
            height: auto;
            left: 0;
            position: absolute;
            right: 0;
            top: 0;
            width: auto;
          }

          .custom-dropdown-toggle {
            background-color: ${darkMode ? '#2d2d2d' : '#f8f9fa'} !important;
            border: 1px solid ${darkMode ? '#444' : '#e9ecef'} !important;
            color: ${darkMode ? '#fff' : '#333'} !important;
            border-radius: 50px;
            padding: 0.6rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          /* FIXED: Hide Default Bootstrap Caret to remove Double Arrow */
          .custom-dropdown-toggle::after {
            display: none !important;
          }
          
          .custom-dropdown-toggle:hover {
             background-color: ${darkMode ? '#3a3a3a' : '#fff'} !important;
             border-color: ${darkMode ? '#666' : '#d1d5db'} !important;
          }
          .custom-dropdown-menu {
             background-color: ${darkMode ? '#2d2d2d' : '#fff'};
             border: 1px solid ${darkMode ? '#444' : 'none'};
             box-shadow: 0 10px 30px rgba(0,0,0,0.3);
             border-radius: 12px;
             padding: 8px;
             margin-top: 8px !important;
          }
          .dropdown-item { color: ${darkMode ? '#e0e0e0' : '#212529'}; }
          .dropdown-item:hover {
             background-color: ${darkMode ? '#3d3d3d' : '#eff6ff'};
             color: ${darkMode ? '#fff' : '#0d6efd'};
          }
          
          /* --- MODALS DARK MODE --- */
          .modal-dark-content { background-color: #1e1e1e !important; color: #fff !important; border: 1px solid #444 !important; }
          .modal-dark-content .modal-header { border-bottom-color: #333 !important; }
          .modal-dark-content .modal-footer { border-top-color: #333 !important; }
          .modal-dark-content .btn-close { filter: invert(1) grayscale(100%) brightness(200%); }

          /* --- NAV LINK DARK MODE HOVER --- */
          /* Default state (no border, just light text) */
          .nav-link-dark {
            color: #f8f9fa !important;
            border: 1px solid transparent; /* Prevents layout shift on hover */
            transition: all 0.02s ease;
          }
          /* Hover state (border and background appear) */
          .nav-link-dark:hover {
            border-color: rgba(255, 255, 255, 0.2);
            background-color: rgba(255, 255, 255, 0.1);
            color: #fff !important;
          }

          /* --- UTILS --- */
          .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.2) !important; }
          .wizard-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .custom-nav-link.active {
            color: #0d6efd !important;
            background: rgba(13, 110, 253, 0.1);
            border-radius: 50px;
          }
        `}
      </style>

      {/* --- NAVBAR --- */}
      <Navbar expand="lg" fixed="top" className="navbar-glass border-bottom py-3">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 me-4">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm p-2" style={{ width: '45px', height: '45px' }}>
              <PartyPopper size={24} strokeWidth={2.5} fill="white" />
            </div>
            <div style={{ lineHeight: '1' }}>
              <span className={`fw-bold fs-3 ${darkMode ? 'text-light' : 'text-dark'}`} style={{ letterSpacing: '-0.5px' }}>Event</span>
              <span className="fw-bold fs-3 text-primary" style={{ letterSpacing: '-0.5px' }}>Ease</span>
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto fw-medium gap-2">
              <Nav.Link 
                href="#marketplace" 
                className={`${darkMode ? 'nav-link-dark' : 'text-dark'} px-3 rounded-pill hover-lift`}
              >
                Browse Services
              </Nav.Link>
              <Nav.Link 
                href="#how-it-works" 
                className={`${darkMode ? 'nav-link-dark' : 'text-dark'} px-3 rounded-pill hover-lift`}
              >
                How It Works
              </Nav.Link>

              {user && user.role === 'vendor' && <Nav.Link as={Link} to="/vendor" className="text-primary fw-bold bg-light px-3 rounded-pill">Vendor Dashboard</Nav.Link>}
              {user && user.role === 'admin' && <Nav.Link as={Link} to="/admin" className="text-danger fw-bold bg-light px-3 rounded-pill">Admin Panel</Nav.Link>}
            </Nav>

            <div className="d-flex gap-3 align-items-center mt-3 mt-lg-0">
              {/* DARK MODE TOGGLE */}
              <Button 
                variant={darkMode ? "secondary" : "light"} 
                className="rounded-circle p-2 border" 
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun size={20} className="text-warning" /> : <Moon size={20} className="text-dark" />}
              </Button>

              {user ? (
                <>
                  <span className={`fw-bold ${darkMode ? 'text-light' : 'text-dark'}`}>Hi, {user?.username || 'User'}</span>
                  <Button variant="outline-danger" size="sm" className="rounded-pill px-4" onClick={handleLogout}>Log Out</Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-decoration-none text-muted small fw-bold">
                    Vendor Login
                  </Link>
                  <Link to="/customer/login">
                    <Button variant={darkMode ? "outline-light" : "outline-dark"} size="sm" className="rounded-pill px-4 fw-bold">Log In</Button>
                  </Link>
                  <Link to="/customer/register">
                    <Button className="rounded-pill px-4 bg-primary border-0 shadow-sm text-white fw-bold">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* --- HERO SECTION --- */}
      <section style={styles.heroSection} className="pt-5 mt-5">
        <Container className="py-5">
          <Row className="align-items-center">
            <Col lg={user ? 6 : 12} className="mb-5 mb-lg-0 text-center text-lg-start">
              <div className={`d-inline-flex align-items-center gap-2 px-3 py-1 ${darkMode ? 'bg-dark border-secondary' : 'bg-white'} text-primary fw-bold small mb-4 border rounded-pill shadow-sm`}>
                <Star size={14} fill="#0d6efd" /> #1 Event Marketplace in Pakistan
              </div>
              <h1 className="display-3 fw-bold mb-3" style={{letterSpacing: '-1px'}}>
                Plan Your Event <br />
                <span className="text-primary">Without Stress.</span>
              </h1>
              <p className={`lead ${darkMode ? 'text-light opacity-75' : 'text-secondary'} mb-5`} style={{maxWidth: user ? '100%' : '700px', margin: user ? '' : '0 auto'}}>
                Find Catering, Décor, and Rentals within your budget.
                {user ? " Use our AI Budget Engine to plan instantly." : " Sign in to plan instantly!"}
              </p>
              {!user && (
                 <Link to="/customer/register">
                    <Button size="lg" className="rounded-pill px-5 py-3 shadow-lg fw-bold">Get Started Now</Button>
                 </Link>
              )}
            </Col>

            {/* --- WIZARD [CONDITIONAL] --- */}
            {user && (
              <Col lg={5} className="offset-lg-1">
                <Card className="border-0 shadow-lg rounded-4 overflow-hidden" style={styles.glassCard}>
                  <div className={`p-4 ${darkMode ? 'bg-dark bg-opacity-50 border-bottom border-secondary' : 'bg-light border-bottom'}`}>
                    <div className="d-flex align-items-center gap-2">
                         <div className="bg-success text-white p-2 rounded-circle"><Gift size={20}/></div>
                         <div>
                            <h5 className="fw-bold mb-0">Budget Planner</h5>
                            <small className={darkMode ? "text-light opacity-75" : "text-muted"}>AI-Powered Estimates</small>
                         </div>
                    </div>
                  </div>
                  <Card.Body className="p-4">
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label className={`fw-bold small text-uppercase ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>Event Type</Form.Label>
                        
                        {/* CUSTOM DROPDOWN 1: Event Type */}
                        <Dropdown onSelect={(k) => setEventType(k)}>
                            <Dropdown.Toggle className="w-100 custom-dropdown-toggle text-start" variant={darkMode ? "dark" : "light"}>
                                {eventType}
                                <ChevronDown size={16} className="text-muted"/>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100 custom-dropdown-menu">
                                {['Birthday Parties', 'Weddings & Engagements', 'Graduation Events', 'Baby Showers', 'College/University Functions', 'Corporate Events', 'Family Gatherings', 'Eid / Ramadan Events'].map(evt => (
                                    <Dropdown.Item key={evt} eventKey={evt} active={eventType === evt}>{evt}</Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                      </Form.Group>

                      <Row className="mb-3 g-2">
                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className={`fw-bold small text-uppercase ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>Date</Form.Label>
                            <div className="input-group">
                              <span className={`input-group-text ${darkMode ? 'bg-dark border-secondary text-light' : 'bg-light border-0'}`}><Calendar size={16} /></span>
                              <Form.Control type="date" className={`${darkMode ? 'bg-dark border-secondary text-white' : 'bg-light border-0'}`} min={today} value={eventDate} onChange={e => setEventDate(e.target.value)} />
                            </div>
                          </Form.Group>
                        </Col>
                        <Col xs={6}>
                          <Form.Group>
                            <Form.Label className={`fw-bold small text-uppercase ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>Location</Form.Label>
                            <div className="input-group">
                              <span className={`input-group-text ${darkMode ? 'bg-dark border-secondary text-light' : 'bg-light border-0'}`}><MapPin size={16} /></span>
                              <Form.Control type="text" className={`${darkMode ? 'bg-dark border-secondary text-white' : 'bg-light border-0'}`} placeholder="Venue" value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <Form.Label className={`fw-bold small text-uppercase ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>Total Budget</Form.Label>
                          <span className="text-primary fw-bold">{budget.toLocaleString()} PKR</span>
                        </div>
                        <Form.Range
                          min={5000} max={200000} step={1000}
                          value={budget}
                          onChange={(e) => setBudget(Number(e.target.value))}
                          className="w-100"
                        />
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className={`fw-bold small text-uppercase ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>Number of Guests</Form.Label>
                        <div className="input-group">
                          <span className={`input-group-text ${darkMode ? 'bg-dark border-secondary text-light' : 'bg-light border-0'}`}><Users size={18} /></span>
                          <Form.Control
                            type="number"
                            className={`${darkMode ? 'bg-dark border-secondary text-white' : 'bg-light border-0'}`}
                            value={guests}
                            onChange={(e) => setGuests(Number(e.target.value))}
                          />
                        </div>
                      </Form.Group>

                      <Button
                        className="w-100 wizard-gradient text-white py-3 fw-bold rounded-pill border-0 shadow"
                        onClick={generatePlan}
                        disabled={loading}
                      >
                        {loading ? 'Analyzing...' : 'Generate Plan'}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Container>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className={`py-5 ${darkMode ? 'bg-dark' : 'bg-white'}`}>
        <Container className="py-5">
          <div className="text-center mb-5">
            <small className="text-primary fw-bold text-uppercase ls-1">Simple Process</small>
            <h2 className="fw-bold display-6 mt-2">How <span className="text-primary">EventEase</span> Works</h2>
            <p className={darkMode ? "text-secondary" : "text-muted"}>Planning your dream event is as easy as 1-2-3.</p>
          </div>

          <Row className="g-4 text-center">
            {[ 
                { icon: <Search size={32} />, title: "Browse & Compare", desc: "Explore verified vendors for Catering, Decor, and Rentals with transparent pricing.", color: "primary" },
                { icon: <Calendar size={32} />, title: "Plan with AI", desc: "Use our Intelligent Budget Planner to build the perfect package instantly.", color: "info" },
                { icon: <CheckCircle size={32} />, title: "Book & Relax", desc: "Secure your items with one click. Vendors get notified, you get an invoice.", color: "success" }
            ].map((step, idx) => (
                <Col md={4} key={idx}>
                    <Card className="h-100 border-0 shadow-sm p-4 hover-lift rounded-4">
                        <div className={`d-inline-flex align-items-center justify-content-center bg-${step.color} bg-opacity-10 text-${step.color} rounded-circle mb-4 mx-auto`} style={{ width: '80px', height: '80px' }}>
                            {step.icon}
                        </div>
                        <h4 className="fw-bold mb-3">{idx + 1}. {step.title}</h4>
                        <p className={darkMode ? "text-secondary" : "text-muted"}>{step.desc}</p>
                    </Card>
                </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* --- MARKETPLACE --- */}
      <section className={`py-5 ${darkMode ? 'bg-secondary bg-opacity-10' : 'bg-light'}`} id="marketplace">
        <Container>
          {/* Filters Bar */}
          <Card className="border-0 shadow rounded-4 mb-5 p-2 bg-white sticky-top" style={{top: '80px', zIndex: 99}}>
            <Row className="align-items-center g-2">
              <Col lg={5}>
                <Tabs 
                    id="marketplace-tabs" 
                    activeKey={key} 
                    onSelect={(k) => setKey(k)} 
                    className="border-bottom-0 custom-tabs d-flex justify-content-between justify-content-lg-start gap-2"
                >
                  <Tab eventKey="all" title="All" tabClassName={`custom-nav-link ${darkMode ? 'text-light' : 'text-dark'} fw-medium border-0`} />
                  <Tab eventKey="Catering" title="🍽️ Catering" tabClassName={`custom-nav-link ${darkMode ? 'text-light' : 'text-dark'} fw-medium border-0`} />
                  <Tab eventKey="Decor" title="🎈 Décor" tabClassName={`custom-nav-link ${darkMode ? 'text-light' : 'text-dark'} fw-medium border-0`} />
                  <Tab eventKey="Rentals" title="🔊 Rentals" tabClassName={`custom-nav-link ${darkMode ? 'text-light' : 'text-dark'} fw-medium border-0`} />
                  <Tab eventKey="Photography" title="📷 Photo" tabClassName={`custom-nav-link ${darkMode ? 'text-light' : 'text-dark'} fw-medium border-0`} />
                </Tabs>
              </Col>

              <Col lg={7}>
                <div className="d-flex gap-2 justify-content-lg-end">
                  <div className={`input-group border rounded-pill overflow-hidden ${darkMode ? 'bg-dark border-secondary' : 'bg-light'}`} style={{ maxWidth: '300px' }}>
                    <span className="input-group-text bg-transparent border-0 ps-3"><Search size={18} className="text-muted"/></span>
                    <Form.Control className="border-0 bg-transparent shadow-none" placeholder="Search services..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>

                  <div className="d-none d-md-flex align-items-center gap-1">
                    {/* CUSTOM DROPDOWN 2: Vendor Filter */}
                    <Dropdown onSelect={(k) => setSelectedVendor(k)}>
                         <Dropdown.Toggle className="custom-dropdown-toggle shadow-sm" style={{minWidth: '150px'}} variant={darkMode ? "dark" : "white"}>
                             <span className="text-truncate">{selectedVendor}</span> <ChevronDown size={14} className="text-muted ms-2"/>
                         </Dropdown.Toggle>
                         <Dropdown.Menu className="custom-dropdown-menu" style={{maxHeight: '300px', overflowY: 'auto'}}>
                             <Dropdown.Item eventKey="All Vendors" active={selectedVendor === 'All Vendors'}>All Vendors</Dropdown.Item>
                             {uniqueVendors.map(v => (
                                 <Dropdown.Item key={v} eventKey={v} active={selectedVendor === v}>{v}</Dropdown.Item>
                             ))}
                         </Dropdown.Menu>
                    </Dropdown>
                  </div>

                  <div className="d-flex align-items-center">
                    {/* CUSTOM DROPDOWN 3: Sort */}
                    <Dropdown onSelect={(k) => setSortOption(k)}>
                         <Dropdown.Toggle className="custom-dropdown-toggle shadow-sm" style={{minWidth: '130px'}} variant={darkMode ? "dark" : "white"}>
                             {sortOption === 'low-high' ? 'Price: Low' : 'Price: High'} <ChevronDown size={14} className="text-muted ms-2"/>
                         </Dropdown.Toggle>
                         <Dropdown.Menu className="custom-dropdown-menu">
                             <Dropdown.Item eventKey="low-high" active={sortOption === 'low-high'}>Price: Low to High</Dropdown.Item>
                             <Dropdown.Item eventKey="high-low" active={sortOption === 'high-low'}>Price: High to Low</Dropdown.Item>
                         </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Row className="g-4">
              {getFilteredItems().map((item) => (
                <Col key={item._id} md={6} lg={3}>
                  <Card
                    className="h-100 border-0 shadow-sm hover-lift rounded-4 overflow-hidden"
                    onClick={handleItemClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="position-relative">
                      <div style={{ height: '200px', overflow: 'hidden' }}>
                           <Card.Img variant="top" src={item.image} style={{ objectFit: 'cover', height: '100%', width: '100%' }} />
                      </div>
                      <Badge bg={darkMode ? "dark" : "white"} text={darkMode ? "light" : "dark"} className="position-absolute top-0 end-0 m-3 shadow rounded-pill py-2 px-3 fw-bold">
                        <Star size={14} className="text-warning me-1 mb-1" fill="orange" /> {item.rating}
                      </Badge>
                      <Badge bg="dark" className="position-absolute bottom-0 start-0 m-3 bg-opacity-75 backdrop-blur">
                        {item.category}
                      </Badge>
                    </div>

                    <Card.Body className="d-flex flex-column p-4">
                      <div className="mb-2 d-flex align-items-center gap-1 text-muted small fw-medium text-uppercase">
                        <Store size={14} className="text-primary"/> {item.vendorName || "EventEase Verified"}
                      </div>
                      
                      <Card.Title className={`fw-bold fs-5 ${darkMode ? 'text-light' : 'text-dark'} mb-2 text-truncate`} title={item.name}>
                        {item.name}
                      </Card.Title>

                      <Card.Text className="text-muted small flex-grow-1 mb-3 line-clamp-2" style={{ fontSize: '0.9rem'}}>
                        {item.description}
                      </Card.Text>

                      {/* Attributes */}
                      <div className="mb-3 d-flex flex-wrap gap-1">
                         <span className={`badge ${darkMode ? 'bg-secondary bg-opacity-50' : 'bg-light text-secondary'} border`}>{item.subCategory}</span>
                        {item.isHalal && <span className="badge bg-success bg-opacity-10 text-success border border-success">Halal</span>}
                      </div>

                      <div className="mt-auto pt-3 border-top">
                        <div className="d-flex justify-content-between align-items-end mb-3">
                            <span className="small text-muted">Starting from</span>
                            <div>
                                <span className="fw-bolder text-primary fs-4">{item.price.toLocaleString()}</span>
                                <span className="small text-muted ms-1 fw-bold">PKR</span>
                            </div>
                        </div>

                        <div className="d-grid gap-2 d-flex">
                          <Button variant="primary" className="flex-grow-1 rounded-pill fw-bold" onClick={(e) => { e.stopPropagation(); openSingleBookModal(item); }}>
                            Book Now
                          </Button>
                          <Button variant={darkMode ? "outline-light" : "outline-dark"} className="border text-secondary rounded-circle p-2" onClick={(e) => { e.stopPropagation(); handleWhatsApp(item); }}>
                            <MessageCircle size={20} />
                          </Button>
                          <Button variant={darkMode ? "outline-light" : "outline-dark"} className="border text-danger rounded-circle p-2" onClick={(e) => { e.stopPropagation(); openReportModal(item); }}>
                            <Flag size={20} />
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* --- PLAN MODAL --- */}
      <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)} centered size="lg" contentClassName={darkMode ? "modal-dark-content" : ""}>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">🎉 Your Custom Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className={`d-flex justify-content-between align-items-center ${darkMode ? 'bg-dark border border-secondary' : 'bg-light'} p-3 rounded-3 mb-4`}>
             <div><span className={`small fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>ESTIMATED COST</span></div>
             <div className="fs-3 fw-bold text-primary">{generatedPackage?.totalCost.toLocaleString()} PKR</div>
          </div>

          {bookingSuccess ? (
            <Alert variant="success" className="text-center py-5 rounded-4">
              <div className="bg-white p-3 rounded-circle d-inline-block shadow-sm mb-3">
                 <CheckCircle size={48} className="text-success" />
              </div>
              <h4 className="fw-bold text-dark">Booking Request Sent!</h4>
              <p className="mb-4 text-dark">Vendors have been notified. You can download your receipt below.</p>
              <Button onClick={downloadInvoice} variant="success" className="fw-bold rounded-pill px-4">
                <Download size={18} className="me-2" /> Download Invoice (PDF)
              </Button>
              <div className="mt-4">
                  <Button variant="link" className="text-muted text-decoration-none" onClick={() => { setBookingSuccess(false); setShowPlanModal(false); }}>Close Window</Button>
              </div>
            </Alert>
          ) : generatedPackage ? (
            <div>
              <Row className="g-3 mb-4">
                <Col md={4}>
                  <Card className="h-100 border-0 shadow-sm p-3 text-center bg-warning bg-opacity-10">
                    <div className="mb-2"><span className="badge bg-warning text-dark">CATERING</span></div>
                    <div className={`fw-bold ${darkMode ? 'text-light' : 'text-dark'}`}>{generatedPackage.food?.name || "None"}</div>
                    <small className="text-muted d-block mt-1">{generatedPackage.food?.vendorName}</small>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 border-0 shadow-sm p-3 text-center bg-info bg-opacity-10">
                    <div className="mb-2"><span className="badge bg-info text-dark">DECOR</span></div>
                    <div className={`fw-bold ${darkMode ? 'text-light' : 'text-dark'}`}>{generatedPackage.decor?.name || "None"}</div>
                    <small className="text-muted d-block mt-1">{generatedPackage.decor?.vendorName}</small>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 border-0 shadow-sm p-3 text-center bg-success bg-opacity-10">
                    <div className="mb-2"><span className="badge bg-success">RENTALS</span></div>
                    <div className={`fw-bold ${darkMode ? 'text-light' : 'text-dark'}`}>{generatedPackage.rental?.name || "None"}</div>
                    <small className="text-muted d-block mt-1">{generatedPackage.rental?.vendorName}</small>
                  </Card>
                </Col>
              </Row>

              <div className={`${darkMode ? 'bg-dark border border-secondary' : 'bg-white border'} p-4 rounded-4 shadow-sm`}>
                <h5 className="fw-bold mb-3">Confirm Details</h5>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className={`small fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>YOUR NAME</Form.Label>
                      <Form.Control
                        className={darkMode ? "bg-dark border-secondary text-white" : "bg-light border-0"}
                        value={bookingData.name}
                        onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                        placeholder="Enter your name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className={`small fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>PHONE NUMBER</Form.Label>
                      <Form.Control
                        className={darkMode ? "bg-dark border-secondary text-white" : "bg-light border-0"}
                        value={bookingData.phone}
                        onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                        placeholder="0300-1234567"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button
                  onClick={() => handleBookOrder(false)}
                  className="w-100 bg-primary border-0 py-3 mt-4 fw-bold rounded-pill shadow-lg text-white" size="lg">
                  Confirm Booking
                </Button>
              </div>
            </div>
          ) : <Alert variant="warning">Increase budget to see a plan.</Alert>}
        </Modal.Body>
      </Modal>

      {/* --- SINGLE BOOK MODAL --- */}
      <Modal show={showSingleBookModal} onHide={() => setShowSingleBookModal(false)} centered contentClassName={darkMode ? "modal-dark-content" : ""}>
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">Book Service</Modal.Title></Modal.Header>
        <Modal.Body className="p-4 pt-0">
          {bookingSuccess ? (
             <Alert variant="success" className="text-center py-5 rounded-4">
             <div className="bg-white p-3 rounded-circle d-inline-block shadow-sm mb-3">
                <CheckCircle size={48} className="text-success" />
             </div>
             <h4 className="fw-bold text-dark">Order Placed!</h4>
             <Button onClick={downloadInvoice} variant="success" className="fw-bold rounded-pill px-4 mt-3">
               <Download size={18} className="me-2" /> Download Invoice
             </Button>
             <div className="mt-3"><Button variant="link" className="text-muted" onClick={() => { setBookingSuccess(false); setShowSingleBookModal(false); }}>Close</Button></div>
           </Alert>
          ) : singleBookItem && (
            <Form>
              <div className={`d-flex gap-3 mb-4 ${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'} p-3 rounded-4 align-items-center`}>
                <img src={singleBookItem.image} alt="" style={{ width: 70, height: 70, objectFit: 'cover' }} className="rounded-3 shadow-sm" />
                <div>
                  <div className="fw-bold fs-5">{singleBookItem.name}</div>
                  <div className="text-primary fw-bold">{singleBookItem.price.toLocaleString()} PKR <span className={`small fw-normal ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>/ {singleBookItem.unit}</span></div>
                </div>
              </div>

              <Row className="g-2 mb-3">
                <Col>
                    <Form.Label className={`small fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>DATE</Form.Label>
                    <div className="input-group">
                        <span className={`input-group-text ${darkMode ? 'bg-dark border-secondary text-light' : 'bg-light border-0'}`}><Calendar size={16}/></span>
                        <Form.Control type="date" className={darkMode ? "bg-dark border-secondary text-white" : "bg-light border-0"} min={today} value={eventDate} onChange={e => setEventDate(e.target.value)} />
                    </div>
                </Col>
                <Col>
                    <Form.Label className={`small fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>LOCATION</Form.Label>
                    <div className="input-group">
                        <span className={`input-group-text ${darkMode ? 'bg-dark border-secondary text-light' : 'bg-light border-0'}`}><MapPin size={16}/></span>
                        <Form.Control className={darkMode ? "bg-dark border-secondary text-white" : "bg-light border-0"} value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
                    </div>
                </Col>
              </Row>

              {singleBookItem.unit === 'per head' && (
                <Form.Group className="mb-3">
                    <Form.Label className={`small fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>GUESTS</Form.Label>
                    <div className="input-group">
                        <span className={`input-group-text ${darkMode ? 'bg-dark border-secondary text-light' : 'bg-light border-0'}`}><Users size={16}/></span>
                        <Form.Control type="number" className={darkMode ? "bg-dark border-secondary text-white" : "bg-light border-0"} value={guests} onChange={e => setGuests(Number(e.target.value))} />
                    </div>
                </Form.Group>
              )}

              {singleBookItem.unit === 'per hour' && (
                <Form.Group className="mb-3">
                  <Form.Label className={`small fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>DURATION (HOURS)</Form.Label>
                  <div className="input-group">
                    <span className={`input-group-text ${darkMode ? 'bg-dark border-secondary text-light' : 'bg-light border-0'}`}><Clock size={16}/></span>
                    <Form.Control type="number" min={1} className={darkMode ? "bg-dark border-secondary text-white" : "bg-light border-0"} value={hours} onChange={e => setHours(Number(e.target.value))} />
                  </div>
                  <Form.Text className="text-primary fw-bold d-block text-end mt-1">Total: {(singleBookItem.price * hours).toLocaleString()} PKR</Form.Text>
                </Form.Group>
              )}

              <Form.Group className="mb-2">
                  <Form.Label className={`small fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>YOUR NAME</Form.Label>
                  <Form.Control className={darkMode ? "bg-dark border-secondary text-white" : "bg-light border-0"} value={bookingData.name} onChange={e => setBookingData({ ...bookingData, name: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-4">
                  <Form.Label className={`small fw-bold ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>PHONE NUMBER</Form.Label>
                  <Form.Control className={darkMode ? "bg-dark border-secondary text-white" : "bg-light border-0"} value={bookingData.phone} onChange={e => setBookingData({ ...bookingData, phone: e.target.value })} />
              </Form.Group>

              <Button className="w-100 fw-bold rounded-pill py-3 shadow-sm" variant="primary" onClick={() => handleBookOrder(true)}>Confirm Booking</Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* --- REPORT MODAL --- */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered contentClassName={darkMode ? "modal-dark-content" : ""}>
        <Modal.Header closeButton className="border-0"><Modal.Title className="text-danger fw-bold h5">Report Listing</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">Help us keep EventEase safe. Why are you reporting <strong>{reportItem?.name}</strong>?</p>
          <Form.Group className="d-flex flex-column gap-2">
            <div className={`border rounded p-3 ${darkMode ? 'bg-dark' : 'bg-light'}`}><Form.Check type="radio" label="Fake / Scam" name="reason" onChange={() => setReportReason("Fake / Scam")} /></div>
            <div className={`border rounded p-3 ${darkMode ? 'bg-dark' : 'bg-light'}`}><Form.Check type="radio" label="Wrong Category" name="reason" onChange={() => setReportReason("Wrong Category")} /></div>
            <div className={`border rounded p-3 ${darkMode ? 'bg-dark' : 'bg-light'}`}><Form.Check type="radio" label="Inappropriate Content" name="reason" onChange={() => setReportReason("Inappropriate Content")} /></div>
            <div className={`border rounded p-3 ${darkMode ? 'bg-dark' : 'bg-light'}`}><Form.Check type="radio" label="Other" name="reason" onChange={() => setReportReason("Other")} /></div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowReportModal(false)}>Cancel</Button>
          <Button variant="danger" className="rounded-pill px-4" onClick={handleReportSubmit}>Submit Report</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Home;