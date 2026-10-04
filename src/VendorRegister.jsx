import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Lock, ArrowLeft, TrendingUp } from 'lucide-react';

function VendorRegister() {
  const [formData, setFormData] = useState({ username: '', password: '', businessName: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if(res.ok) {
      alert(data.message);
      navigate('/login'); // Redirect to Vendor Login
    } else {
      setMsg(data.error);
    }
  };

  return (
    <Container fluid className="vh-100 p-0 overflow-hidden">
        <Row className="h-100 g-0">
            {/* LEFT: Form Section (Swapped side for variety) */}
            <Col md={6} lg={5} className="d-flex flex-column justify-content-center align-items-center bg-white">
                <div className="w-75" style={{ maxWidth: '400px' }}>
                    <div className="text-center mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-circle p-3 mb-3 shadow-sm">
                            <TrendingUp size={32} />
                        </div>
                        <h2 className="fw-bold">Vendor Partner</h2>
                        <p className="text-muted">Grow your business with EventEase</p>
                    </div>

                    {msg && <Alert variant="danger" className="text-center small">{msg}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">BUSINESS NAME</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0"><Store size={18} className="text-muted"/></InputGroup.Text>
                                <Form.Control 
                                    className="bg-light border-start-0 ps-0 shadow-none" 
                                    placeholder="e.g. Ali Catering Services"
                                    onChange={e => setFormData({...formData, businessName: e.target.value})} 
                                    required 
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">USERNAME</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0"><User size={18} className="text-muted"/></InputGroup.Text>
                                <Form.Control 
                                    className="bg-light border-start-0 ps-0 shadow-none" 
                                    placeholder="Username for login"
                                    onChange={e => setFormData({...formData, username: e.target.value})} 
                                    required
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">PASSWORD</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0"><Lock size={18} className="text-muted"/></InputGroup.Text>
                                <Form.Control 
                                    type="password" 
                                    className="bg-light border-start-0 ps-0 shadow-none" 
                                    placeholder="Secure password"
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    required
                                />
                            </InputGroup>
                        </Form.Group>

                        <Button type="submit" variant="dark" className="w-100 mb-3 py-2 fw-bold shadow-sm">Register Business</Button>
                        
                        <div className="text-center mb-4">
                            <span className="text-muted">Already registered? </span>
                            <Link to="/login" className="fw-bold text-dark text-decoration-none">Vendor Login</Link>
                        </div>

                        <div className="text-center border-top pt-3">
                            <Link to="/" className="text-muted text-decoration-none small d-inline-flex align-items-center gap-1">
                                <ArrowLeft size={14}/> Back to Marketplace
                            </Link>
                        </div>
                    </Form>
                </div>
            </Col>

            {/* RIGHT: Image Section */}
            <Col md={6} lg={7} className="d-none d-md-block position-relative">
                <img 
                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop" 
                    alt="Business Meeting" 
                    className="w-100 h-100 object-fit-cover"
                />
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-primary bg-opacity-75 d-flex align-items-center justify-content-center">
                    <div className="text-white text-center px-5">
                        <h1 className="display-4 fw-bold mb-3">Reach More Customers.</h1>
                        <p className="lead">Manage bookings, track revenue, and grow your brand.</p>
                    </div>
                </div>
            </Col>
        </Row>
    </Container>
  );
}
export default VendorRegister;