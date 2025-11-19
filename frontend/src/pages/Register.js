import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { toast } from 'react-toastify';
import './Register.css';

const db = getFirestore();

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'buyer',
    state: '',
    lga: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const [selectedRole, setSelectedRole] = useState('buyer');
  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        location: {
          state: formData.state,
          lga: formData.lga,
        },
        createdAt: serverTimestamp(),
        verified: false,
        active: true
      });

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Store user data and show role selection modal
        setGoogleUserData({
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'User',
          phone: user.phoneNumber || '',
          photoURL: user.photoURL || ''
        });
        setShowRoleModal(true);
        setLoading(false);
      } else {
        toast.success('Logged in with Google!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google signup error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Signup cancelled.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup blocked. Please allow popups for this site.');
      } else {
        setError('Failed to signup with Google. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleCompleteGoogleSignup = async () => {
    if (!selectedState) {
      toast.error('Please select your state');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', googleUserData.uid);
      await setDoc(userRef, {
        ...googleUserData,
        role: selectedRole,
        location: { 
          state: selectedState, 
          lga: selectedLga 
        },
        createdAt: serverTimestamp(),
        verified: true,
        active: true
      });

      toast.success(`Account created successfully as ${selectedRole}!`);
      setShowRoleModal(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing signup:', error);
      toast.error('Failed to complete signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <i className="bi bi-person-plus text-success" style={{ fontSize: '3rem' }}></i>
                <h2 className="mt-3">Create Account</h2>
                <p className="text-muted">Join Nigeria Farmers Market today</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Button
                variant="outline-dark"
                className="w-100 d-flex align-items-center justify-content-center mb-3"
                onClick={handleGoogleSignup}
                disabled={loading}
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="me-2">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="text-center my-3">
                <span className="text-muted">or register with email</span>
              </div>

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your full name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="080xxxxxxxx"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="At least 6 characters"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="Repeat password"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">I am a *</Form.Label>
                  <Row>
                    <Col md={6}>
                      <Card 
                        className={`role-card ${formData.role === 'buyer' ? 'border-success border-2' : 'border'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setFormData({ ...formData, role: 'buyer' })}
                      >
                        <Card.Body className="text-center p-3">
                          <i className={`bi bi-cart-check fs-1 ${formData.role === 'buyer' ? 'text-success' : 'text-muted'}`}></i>
                          <h5 className="mt-2 mb-1">Buyer</h5>
                          <small className="text-muted">I want to purchase produce</small>
                          {formData.role === 'buyer' && (
                            <div className="mt-2">
                              <Badge bg="success">
                                <i className="bi bi-check-circle me-1"></i>
                                Selected
                              </Badge>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card 
                        className={`role-card ${formData.role === 'farmer' ? 'border-success border-2' : 'border'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setFormData({ ...formData, role: 'farmer' })}
                      >
                        <Card.Body className="text-center p-3">
                          <i className={`bi bi-basket2 fs-1 ${formData.role === 'farmer' ? 'text-success' : 'text-muted'}`}></i>
                          <h5 className="mt-2 mb-1">Farmer</h5>
                          <small className="text-muted">I want to sell my produce</small>
                          {formData.role === 'farmer' && (
                            <div className="mt-2">
                              <Badge bg="success">
                                <i className="bi bi-check-circle me-1"></i>
                                Selected
                              </Badge>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State *</Form.Label>
                      <Form.Select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select your state</option>
                        {nigerianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>LGA / City</Form.Label>
                      <Form.Control
                        type="text"
                        name="lga"
                        value={formData.lga}
                        onChange={handleChange}
                        placeholder="Your local government area"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  variant="success"
                  type="submit"
                  className="w-100 mt-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Form>

              <hr className="my-4" />

              <div className="text-center">
                <p className="mb-0">
                  Already have an account? <Link to="/login">Login here</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Role Selection Modal for Google Sign-up */}
      <Modal 
        show={showRoleModal} 
        onHide={() => !loading && setShowRoleModal(false)}
        backdrop="static"
        centered
      >
        <Modal.Header closeButton={!loading}>
          <Modal.Title>
            <i className="bi bi-person-badge me-2 text-success"></i>
            Complete Your Profile
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            {googleUserData?.photoURL && (
              <img 
                src={googleUserData.photoURL} 
                alt="Profile" 
                className="rounded-circle mb-3"
                style={{ width: '80px', height: '80px' }}
              />
            )}
            <h5>{googleUserData?.name}</h5>
            <p className="text-muted small">{googleUserData?.email}</p>
          </div>

          <Alert variant="info" className="mb-3">
            <i className="bi bi-info-circle me-2"></i>
            Please select your role and location to complete registration
          </Alert>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">I am a *</Form.Label>
              <div className="d-grid gap-2">
                <Button
                  variant={selectedRole === 'buyer' ? 'success' : 'outline-success'}
                  size="lg"
                  onClick={() => setSelectedRole('buyer')}
                  className="text-start d-flex align-items-center"
                >
                  <i className="bi bi-cart-check fs-3 me-3"></i>
                  <div>
                    <div className="fw-bold">Buyer</div>
                    <small className="text-muted">I want to purchase produce</small>
                  </div>
                  {selectedRole === 'buyer' && (
                    <i className="bi bi-check-circle-fill ms-auto"></i>
                  )}
                </Button>
                <Button
                  variant={selectedRole === 'farmer' ? 'success' : 'outline-success'}
                  size="lg"
                  onClick={() => setSelectedRole('farmer')}
                  className="text-start d-flex align-items-center"
                >
                  <i className="bi bi-basket2 fs-3 me-3"></i>
                  <div>
                    <div className="fw-bold">Farmer</div>
                    <small className="text-muted">I want to sell my produce</small>
                  </div>
                  {selectedRole === 'farmer' && (
                    <i className="bi bi-check-circle-fill ms-auto"></i>
                  )}
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">State *</Form.Label>
              <Form.Select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                required
              >
                <option value="">Select your state</option>
                {nigerianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">LGA / City</Form.Label>
              <Form.Control
                type="text"
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                placeholder="Your local government area (optional)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowRoleModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleCompleteGoogleSignup}
            disabled={loading || !selectedState}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Completing...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Complete Registration
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Register;
