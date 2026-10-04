import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Navbar, Nav, Alert, Modal, Tab, Tabs } from 'react-bootstrap';
import { LayoutDashboard, PlusCircle, Trash2, Package, DollarSign, Image as ImageIcon, Clock, CheckCircle, XCircle, Check, Eye, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function VendorDashboard() {
  const navigate = useNavigate();
  // Get User from Real Login
  const user = JSON.parse(localStorage.getItem('user'));

  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    name: '', category: 'Catering', subCategory: '', price: '', unit: 'fixed', description: '', image: '',
    ingredients: '', features: '', isHalal: false
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal State for viewing order details
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/login');
    else {
      fetchItems();
      fetchOrders();
    }
  }, [user]);

  const fetchItems = () => {
    fetch('http://localhost:5000/api/items')
      .then(res => res.json())
      .then(data => setItems(data.filter(i => i.vendorName === user.businessName)));
  };

  const fetchOrders = () => {
    fetch('http://localhost:5000/api/orders')
      .then(res => res.json())
      .then(data => {
        // FILTER: Only show orders where this vendor is involved
        const myOrders = data.filter(order => order.involvedVendors && order.involvedVendors.includes(user.businessName));
        setOrders(myOrders);
      });
  };

  // --- HELPER: Find EXACTLY what this vendor needs to provide ---
  const getMyTask = (order) => {
    const tasks = [];
    if (order.items.food?.vendor === user.businessName) tasks.push(`Provide: ${order.items.food.name}`);
    if (order.items.decor?.vendor === user.businessName) tasks.push(`Provide: ${order.items.decor.name}`);
    if (order.items.rental?.vendor === user.businessName) tasks.push(`Provide: ${order.items.rental.name}`);
    return tasks;
  };

  // --- ACTIONS ---
  const handleOrderStatus = async (orderId, newStatus) => {
    await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchOrders(); // Refresh list
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return alert("Please fill in Name and Price");

    setLoading(true);

    try {
      // Process Arrays & Data
      const processedData = {
        ...formData,
        vendorName: user.businessName,
        isVerified: false,
        ingredients: formData.ingredients && typeof formData.ingredients === 'string' ? formData.ingredients.split(',').map(s => s.trim()) : [],
        features: formData.features && typeof formData.features === 'string' ? formData.features.split(',').map(s => s.trim()) : []
      };

      const res = await fetch('http://localhost:5000/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData)
      });

      // CHECK IF SERVER RETURNED AN ERROR
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Server rejected request");
      }

      setShowSuccess(true);
      // Reset Form
      setFormData({
        name: '', category: 'Catering', subCategory: '', price: '', unit: 'fixed', description: '', image: '',
        ingredients: '', features: '', isHalal: false
      });
      fetchItems();
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error("Publishing failed:", error);
      alert("Failed to publish: " + error.message);
    } finally {
      // THIS RUNS NO MATTER WHAT (Success or Failure)
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    await fetch(`http://localhost:5000/api/items/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  if (!user) return null;

  return (
    <div className="bg-light min-h-screen pb-5">
      <Navbar bg="dark" variant="dark" className="mb-4">
        <Container>
          <Navbar.Brand>{user.businessName} <span className="opacity-50">| Dashboard</span></Navbar.Brand>
          <Button variant="outline-danger" size="sm" onClick={handleLogout}><LogOut size={16} /> Logout</Button>
        </Container>
      </Navbar>

      <Container>
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm p-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary"><Package size={24} /></div>
                <div><h6 className="text-muted mb-0">Total Listings</h6><h3 className="fw-bold mb-0">{items.length}</h3></div>
              </div>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="border-0 shadow-sm p-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success bg-opacity-10 p-3 rounded-circle text-success"><DollarSign size={24} /></div>
                <div><h6 className="text-muted mb-0">Total Orders</h6><h3 className="fw-bold mb-0">{orders.length}</h3></div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* ORDERS SECTION */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-primary text-white fw-bold">My Orders (Action Required)</Card.Header>
          <Card.Body className="p-0">
            <Table responsive className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Customer</th>
                  <th>YOUR TASK (Highlighted)</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td className="ps-4">
                      <div className="fw-bold">{order.customerName}</div>
                      <div className="small text-muted">{order.customerPhone}</div>
                    </td>

                    {/* --- THE HIGHLIGHT LOGIC --- */}
                    <td className="bg-warning bg-opacity-10 border-start border-warning border-3">
                      {getMyTask(order).map((task, i) => (
                        <div key={i} className="fw-bold text-dark mb-1">✅ {task}</div>
                      ))}
                    </td>

                    <td className="fw-bold">{order.totalCost.toLocaleString()}</td>
                    <td>
                      {order.status === 'Confirmed' ? <Badge bg="success">Confirmed</Badge> :
                        order.status === 'Rejected' ? <Badge bg="danger">Rejected</Badge> :
                          <Badge bg="warning" text="dark">Pending</Badge>}
                    </td>
                    <td className="text-end pe-4">
                      <Button variant="light" size="sm" className="me-2 text-primary" onClick={() => openOrderModal(order)}>
                        <Eye size={18} />
                      </Button>
                      {order.status === 'Pending' && (
                        <>
                          <Button size="sm" variant="success" className="me-2" onClick={() => handleOrderStatus(order._id, 'Confirmed')}>
                            <Check size={16} />
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleOrderStatus(order._id, 'Rejected')}>
                            <XCircle size={16} />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-muted">No orders yet</td></tr>}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        <Row>
          <Col lg={4}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white fw-bold py-3"><PlusCircle size={18} className="me-2" /> Add Service</Card.Header>
              <Card.Body>
                {showSuccess && <Alert variant="success">Item submitted for review!</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Item Name</Form.Label>
                    <Form.Control name="name" onChange={handleChange} value={formData.name} required />
                  </Form.Group>

                  {/* 1. UPDATED CATEGORY SELECT */}
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Category</Form.Label>
                    <Form.Select name="category" onChange={handleChange} value={formData.category}>
                      <option value="Catering">Caterer</option>
                      <option value="Decor">Decorator</option>
                      <option value="Rentals">Rental Provider</option>
                      <option value="Photography">Photography & Video</option> {/* NEW */}
                    </Form.Select>
                  </Form.Group>

                  {/* 2. NEW PRICING UNIT SELECT */}
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Pricing Unit</Form.Label>
                    <Form.Select name="unit" onChange={handleChange} value={formData.unit}>
                        <option value="fixed">Per Event (Fixed Price)</option>
                        <option value="per hour">Per Hour</option> {/* NEW */}
                        <option value="per head">Per Head (Catering)</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Price (PKR)</Form.Label>
                    <Form.Control type="number" name="price" onChange={handleChange} value={formData.price} required />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Sub-Category (Optional)</Form.Label>
                    <Form.Control name="subCategory" onChange={handleChange} value={formData.subCategory} placeholder="e.g. Wedding, Birthday, Sound" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Image URL</Form.Label>
                    <Form.Control name="image" onChange={handleChange} value={formData.image} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Description</Form.Label>
                    <Form.Control as="textarea" rows={2} name="description" onChange={handleChange} value={formData.description} />
                  </Form.Group>

                  {/* 3. CONDITIONAL FIELDS BASED ON CATEGORY */}
                  {formData.category === 'Catering' ? (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Ingredients</Form.Label>
                        <Form.Control name="ingredients" placeholder="e.g. Chicken, Rice" onChange={handleChange} value={formData.ingredients || ''} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Check type="checkbox" label="Halal Certified?" name="isHalal" checked={formData.isHalal || false} onChange={(e) => setFormData({ ...formData, isHalal: e.target.checked })} />
                      </Form.Group>
                    </>
                  ) : formData.category === 'Photography' ? (
                    // NEW PHOTOGRAPHY SPECIFIC SECTION
                    <div className="mb-3 p-3 bg-light rounded border">
                        <Form.Label className="small fw-bold">Photography Features</Form.Label>
                        <Form.Check 
                            type="checkbox" label="Drone Coverage Available" 
                            onChange={(e) => {
                                const currentFeatures = formData.features ? formData.features.split(',') : [];
                                if(e.target.checked) currentFeatures.push('Drone Coverage');
                                else { const idx = currentFeatures.indexOf('Drone Coverage'); if(idx > -1) currentFeatures.splice(idx, 1); }
                                setFormData({...formData, features: currentFeatures.join(',')});
                            }} 
                        />
                        <Form.Text className="text-muted">Check if this package includes drone shots.</Form.Text>
                    </div>
                  ) : (
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Features</Form.Label>
                      <Form.Control name="features" placeholder="e.g. 4k, Drone" onChange={handleChange} value={formData.features || ''} />
                    </Form.Group>
                  )}

                  <Button variant="primary" type="submit" className="w-100 fw-bold" disabled={loading}>
                    {loading ? 'Publishing...' : 'Publish Item'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Tabs defaultActiveKey="listings" className="mb-3 border-bottom-0">
              <Tab eventKey="listings" title="My Listings">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white fw-bold py-3"><LayoutDashboard size={18} className="me-2" /> Active Listings</Card.Header>
                  <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle">
                      <thead className="bg-light"><tr><th className="ps-4">Item</th><th>Category</th><th>Price</th><th className="text-end pe-4">Action</th></tr></thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item._id}>
                            <td className="ps-4">
                              <div className="d-flex align-items-center">
                                <img src={item.image} alt="" className="rounded me-3" width="30" height="30" style={{ objectFit: 'cover' }} />
                                <span className="fw-medium">{item.name}</span>
                              </div>
                            </td>
                            <td><Badge bg="secondary">{item.category}</Badge></td>
                            <td>{item.price.toLocaleString()} <span className="text-muted small">/ {item.unit || 'event'}</span></td>
                            <td className="text-end pe-4"><Button variant="link" className="text-danger p-0" onClick={() => handleDelete(item._id)}><Trash2 size={16} /></Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab>

              <Tab eventKey="analytics" title="📊 Business Analytics">
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <h5 className="fw-bold mb-4">Performance Insights</h5>
                    <Row className="g-3 mb-4">
                      <Col md={6}>
                        <div className="p-3 border rounded bg-light">
                          <h6 className="text-muted">Total Potential Revenue</h6>
                          <h2 className="fw-bold text-success">
                            {orders.filter(o => o.status === 'Confirmed').reduce((acc, curr) => acc + (curr.totalCost || 0), 0).toLocaleString()} <span className="fs-6 text-muted">PKR</span>
                          </h2>
                          <small className="text-muted">*Gross value of confirmed deals</small>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="p-3 border rounded bg-light">
                          <h6 className="text-muted">Conversion Rate</h6>
                          <h2 className="fw-bold text-primary">
                            {orders.length > 0 ? Math.round((orders.filter(o => o.status === 'Confirmed').length / orders.length) * 100) : 0}%
                          </h2>
                          <small className="text-muted">Confirmed vs Total Orders</small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>

      {/* --- ORDER DETAILS MODAL --- */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Full Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <div className="mb-3 border-bottom pb-2">
                <div className="fw-bold fs-5">{selectedOrder.customerName}</div>
                <div className="text-muted">{selectedOrder.customerPhone}</div>
                <div className="text-primary fw-bold mt-1">{selectedOrder.eventType} ({selectedOrder.guests} Guests)</div>
              </div>

              <h6 className="fw-bold bg-light p-2 rounded">Package Breakdown</h6>
              <ul className="list-unstyled ps-2">
                <li className="mb-2"><strong>🍽️ Catering:</strong> {selectedOrder.items.food?.name || "None"} <br /><small className="text-muted">Vendor: {selectedOrder.items.food?.vendor}</small></li>
                <li className="mb-2"><strong>🎈 Decor:</strong> {selectedOrder.items.decor?.name || "None"} <br /><small className="text-muted">Vendor: {selectedOrder.items.decor?.vendor}</small></li>
                <li className="mb-2"><strong>🔊 Rentals:</strong> {selectedOrder.items.rental?.name || "None"} <br /><small className="text-muted">Vendor: {selectedOrder.items.rental?.vendor}</small></li>
              </ul>

              <div className="mt-3 text-end">
                <span className="text-muted me-2">Total Value:</span>
                <span className="h4 fw-bold text-success">{selectedOrder.totalCost?.toLocaleString()} PKR</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
export default VendorDashboard;