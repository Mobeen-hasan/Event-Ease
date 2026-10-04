import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, ArrowLeft, LayoutDashboard } from 'lucide-react';

function VendorLogin() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const user = await res.json();
      
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(user));
        if(user.role === 'admin') navigate('/admin');
        else navigate('/vendor');
      } else {
        setError(user.error);
      }
    } catch (err) {
      setError("Server error. Is the backend running?");
    }
  };

  return (
    <Container fluid className="vh-100 p-0 overflow-hidden">
        <Row className="h-100 g-0">
            {/* LEFT: Image Section */}
            <Col md={6} lg={7} className="d-none d-md-block position-relative">
                <img 
                    src="https://images.unsplash.com/photo-1519225421980-715cb0202128?q=80&w=2070&auto=format&fit=crop" 
                    alt="Event Preparation" 
                    className="w-100 h-100 object-fit-cover"
                />
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-60 d-flex align-items-center justify-content-center">
                    <div className="text-white text-center px-5">
                        <h1 className="display-4 fw-bold">Manage Your Success.</h1>
                        <p className="lead">Track orders, manage listings, and grow your business.</p>
                    </div>
                </div>
            </Col>

            {/* RIGHT: Form Section */}
            <Col md={6} lg={5} className="d-flex flex-column justify-content-center align-items-center bg-light">
                <div className="w-75" style={{ maxWidth: '400px' }}>
                    <div className="text-center mb-4">
                        <div className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-circle p-3 mb-3 shadow-sm">
                            <LayoutDashboard size={32} />
                        </div>
                        <h2 className="fw-bold">Vendor Portal</h2>
                        <p className="text-muted">Login to access your dashboard</p>
                    </div>

                    {error && <Alert variant="danger" className="text-center small">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted">USERNAME</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-end-0"><User size={18} className="text-muted"/></InputGroup.Text>
                                <Form.Control 
                                    className="border-start-0 ps-0 shadow-none" 
                                    placeholder="Business username"
                                    onChange={e => setFormData({...formData, username: e.target.value})} 
                                    required
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold text-muted">PASSWORD</Form.Label>
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-end-0"><Lock size={18} className="text-muted"/></InputGroup.Text>
                                <Form.Control 
                                    type="password" 
                                    className="border-start-0 ps-0 shadow-none" 
                                    placeholder="Your password"
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    required
                                />
                            </InputGroup>
                        </Form.Group>

                        <Button type="submit" variant="dark" className="w-100 mb-3 py-2 fw-bold shadow-sm">Access Dashboard</Button>
                        
                        <div className="text-center mb-4">
                            <span className="text-muted">Not a partner yet? </span>
                            <Link to="/register" className="fw-bold text-dark text-decoration-none">Register Business</Link>
                        </div>
                        
                        <div className="text-center border-top pt-3">
                            <Link to="/" className="text-muted text-decoration-none small d-inline-flex align-items-center gap-1">
                                <ArrowLeft size={14}/> Back to Marketplace
                            </Link>
                        </div>
                    </Form>
                </div>
            </Col>
        </Row>
    </Container>
  );
}
export default VendorLogin;