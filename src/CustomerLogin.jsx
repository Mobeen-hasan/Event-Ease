import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, ArrowLeft, LogIn } from 'lucide-react';

function CustomerLogin() {
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
                navigate('/');
            } else {
                setError(user.error);
            }
        } catch (err) {
            setError("Server error.");
        }
    };

    return (
        <Container fluid className="vh-100 p-0 overflow-hidden">
            <Row className="h-100 g-0">
                {/* LEFT: Form Section */}
                <Col md={6} lg={5} className="d-flex flex-column justify-content-center align-items-center bg-white">
                    <div className="w-75" style={{ maxWidth: '400px' }}>
                        <div className="text-center mb-4">
                            <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle p-3 mb-3 shadow-sm">
                                <LogIn size={32} />
                            </div>
                            <h2 className="fw-bold">Welcome Back!</h2>
                            <p className="text-muted">Login to continue planning your event</p>
                        </div>

                        {error && <Alert variant="danger" className="text-center small">{error}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">USERNAME</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-end-0"><User size={18} className="text-muted"/></InputGroup.Text>
                                    <Form.Control 
                                        className="bg-light border-start-0 ps-0 shadow-none" 
                                        placeholder="Enter your username"
                                        onChange={e => setFormData({ ...formData, username: e.target.value })} 
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
                                        placeholder="Enter your password"
                                        onChange={e => setFormData({ ...formData, password: e.target.value })} 
                                        required 
                                    />
                                </InputGroup>
                            </Form.Group>

                            <Button type="submit" className="w-100 mb-3 py-2 fw-bold shadow-sm">Log In</Button>
                            
                            <div className="text-center mb-4">
                                <span className="text-muted">No account? </span>
                                <Link to="/customer/register" className="fw-bold text-decoration-none">Sign Up Free</Link>
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
                        src="https://images.unsplash.com/photo-1496337589254-7e19d01cec44?q=80&w=2070&auto=format&fit=crop" 
                        alt="Celebration" 
                        className="w-100 h-100 object-fit-cover"
                    />
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-primary bg-opacity-25 d-flex align-items-end p-5">
                        <div className="text-white mb-5">
                            <h2 className="fw-bold">Pick up where you left off.</h2>
                            <p className="lead">Your dream event is just a few clicks away.</p>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}
export default CustomerLogin;