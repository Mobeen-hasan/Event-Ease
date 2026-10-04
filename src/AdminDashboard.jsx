import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Navbar, Nav } from 'react-bootstrap';
import { ShieldCheck, CheckCircle, XCircle, LayoutDashboard, UserCheck, Store, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [complaints, setComplaints] = useState([]); // [NEW] State for complaints

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchItems();
    fetchVendors();
    fetchComplaints(); // [NEW] Fetch complaints on load
  }, []);

  const fetchItems = () => {
    fetch('http://localhost:5000/api/items')
      .then(res => res.json())
      .then(data => setItems(data));
  };

  const fetchVendors = () => {
    fetch('http://localhost:5000/api/admin/vendors')
      .then(res => res.json())
      .then(data => setVendors(data));
  };

  // [NEW] Fetch Complaints
  const fetchComplaints = () => {
    fetch('http://localhost:5000/api/complaints')
        .then(res => res.json())
        .then(setComplaints);
  };

  // --- 2. ITEM ACTIONS ---
  const handleApproveItem = async (id) => {
    await fetch(`http://localhost:5000/api/items/${id}/verify`, { method: 'PUT' });
    fetchItems();
  };

  const handleRejectItem = async (id) => {
    if(!window.confirm("Reject and delete this item?")) return;
    await fetch(`http://localhost:5000/api/items/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  // --- 3. VENDOR ACTIONS ---
  const verifyVendor = async (id) => {
    await fetch(`http://localhost:5000/api/admin/vendors/${id}/approve`, { method: 'PUT' });
    fetchVendors();
  };

  // --- [NEW] 4. COMPLAINT ACTIONS ---
  const handleBanItem = async (complaintId) => {
    if(!window.confirm("Ban this item? It will be deleted permanently.")) return;
    await fetch(`http://localhost:5000/api/complaints/${complaintId}/ban`, { method: 'DELETE' });
    fetchComplaints();
    fetchItems(); // Refresh item list since one was deleted
  };

  const handleDismiss = async (complaintId) => {
    await fetch(`http://localhost:5000/api/complaints/${complaintId}/dismiss`, { method: 'PUT' });
    fetchComplaints();
  };

  // Filters
  const pendingItems = items.filter(item => item.isVerified === false);
  const pendingVendors = vendors.filter(vendor => vendor.isVerified === false);

  return (
    <div className="bg-light min-h-screen pb-5">
      {/* Admin Navbar */}
      <Navbar bg="danger" variant="dark" expand="lg" className="mb-4 shadow-sm sticky-top">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center gap-2">
            <ShieldCheck size={24}/> EventEase <span className="text-white opacity-75">Admin Panel</span>
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="text-white fw-bold">Back to Marketplace</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container>
        <Row className="mb-4">
            <Col>
                <h2 className="fw-bold text-dark">System Overview</h2>
                <p className="text-muted">Manage users, content quality, and safety.</p>
            </Col>
        </Row>

        {/* --- SECTION 1: VENDOR APPROVAL --- */}
        <Card className="border-0 shadow-sm mb-5">
          <Card.Header className="bg-dark text-white fw-bold py-3 d-flex justify-content-between align-items-center">
            <span><UserCheck size={20} className="me-2"/> Vendor Requests</span>
            {pendingVendors.length > 0 && <Badge bg="warning" text="dark">{pendingVendors.length} Pending</Badge>}
          </Card.Header>
          <Card.Body className="p-0">
            {pendingVendors.length === 0 ? (
                <div className="text-center py-4 text-muted">No pending vendor registrations.</div>
            ) : (
                <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                    <tr>
                    <th className="ps-4">Business Name</th>
                    <th>Username</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingVendors.map(v => (
                    <tr key={v._id}>
                        <td className="ps-4 fw-bold text-primary"><Store size={16} className="me-2"/> {v.businessName}</td>
                        <td>@{v.username}</td>
                        <td><Badge bg="warning" text="dark">Pending Approval</Badge></td>
                        <td className="text-end pe-4">
                        <Button variant="success" size="sm" onClick={() => verifyVendor(v._id)}>
                            <CheckCircle size={16} className="me-1"/> Approve Access
                        </Button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </Table>
            )}
          </Card.Body>
        </Card>

        {/* --- [NEW] SECTION 2: COMPLAINTS --- */}
        <Card className="border-0 shadow-sm mb-5">
          <Card.Header className="bg-warning text-dark fw-bold py-3 d-flex justify-content-between align-items-center">
            <span><AlertTriangle size={20} className="me-2"/> User Complaints</span>
            {complaints.filter(c => c.status === 'Pending').length > 0 && <Badge bg="danger">{complaints.filter(c => c.status === 'Pending').length} New</Badge>}
          </Card.Header>
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0 align-middle">
                <thead className="bg-light">
                    <tr><th>Item</th><th>Vendor</th><th>Reason</th><th>Status</th><th className="text-end pe-4">Action</th></tr>
                </thead>
                <tbody>
                    {complaints.map(c => (
                        <tr key={c._id}>
                            <td className="fw-bold ps-4">{c.itemName}</td>
                            <td>{c.vendorName}</td>
                            <td className="text-danger">{c.reason}</td>
                            <td><Badge bg={c.status === 'Pending' ? 'warning' : 'secondary'}>{c.status}</Badge></td>
                            <td className="text-end pe-4">
                                {c.status === 'Pending' && (
                                    <>
                                        <Button size="sm" variant="danger" className="me-2" onClick={() => handleBanItem(c._id)}>Ban Item</Button>
                                        <Button size="sm" variant="outline-secondary" onClick={() => handleDismiss(c._id)}>Dismiss</Button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    {complaints.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-muted">No complaints filed.</td></tr>}
                </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* --- SECTION 3: ITEM MODERATION --- */}
        <Row>
          <Col md={6} className="mb-4">
            <Card className="border-0 shadow-sm p-3 border-start border-4 border-danger h-100">
              <div className="d-flex align-items-center gap-3">
                  <div className="p-3 bg-danger bg-opacity-10 rounded-circle text-danger"><LayoutDashboard size={24}/></div>
                  <div><h6 className="text-muted mb-0">Pending Items</h6><h3 className="fw-bold mb-0 text-danger">{pendingItems.length}</h3></div>
              </div>
            </Card>
          </Col>
          <Col md={6} className="mb-4">
             <Card className="border-0 shadow-sm p-3 border-start border-4 border-success h-100">
              <div className="d-flex align-items-center gap-3">
                  <div className="p-3 bg-success bg-opacity-10 rounded-circle text-success"><CheckCircle size={24}/></div>
                  <div><h6 className="text-muted mb-0">Live Items</h6><h3 className="fw-bold mb-0 text-success">{items.length - pendingItems.length}</h3></div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white fw-bold py-3 text-danger border-bottom">
            <LayoutDashboard size={18} className="me-2"/> Item Moderation Queue
          </Card.Header>
          <Card.Body className="p-0">
            {pendingItems.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <CheckCircle size={48} className="text-success mb-3 opacity-50"/>
                <h5>All Caught Up!</h5>
                <p>No items waiting for review.</p>
              </div>
            ) : (
              <Table hover responsive className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4">Item Details</th>
                    <th>Vendor</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingItems.map(item => (
                    <tr key={item._id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <img src={item.image} alt="" className="rounded me-3" width="50" height="50" style={{objectFit:'cover'}} />
                          <div>
                            <div className="fw-bold">{item.name}</div>
                            <small className="text-muted">{item.description}</small>
                          </div>
                        </div>
                      </td>
                      <td><Badge bg="light" text="dark" className="border">{item.vendorName || "Unknown"}</Badge></td>
                      <td><Badge bg="secondary">{item.category}</Badge></td>
                      <td>{item.price.toLocaleString()} PKR</td>
                      <td className="text-end pe-4">
                        <Button 
                          variant="success" size="sm" className="me-2"
                          onClick={() => handleApproveItem(item._id)}
                        >
                          <CheckCircle size={16}/> Approve
                        </Button>
                        <Button 
                          variant="outline-danger" size="sm"
                          onClick={() => handleRejectItem(item._id)}
                        >
                          <XCircle size={16}/> Reject
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default AdminDashboard;