import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <div className="bg-success text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="display-4 fw-bold mb-3">
                Connecting Nigerian Farmers with Local Buyers
              </h1>
              <p className="lead mb-4">
                Over 30 million Nigerians face food insecurity. We're bridging the gap between 
                smallholder farmers and local buyers, making fresh produce accessible to everyone.
              </p>
              <div className="d-grid gap-2 d-md-flex">
                <Button 
                  as={Link} 
                  to="/marketplace" 
                  variant="light" 
                  size="lg"
                  className="me-md-2"
                >
                  Browse Marketplace
                </Button>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="outline-light" 
                  size="lg"
                >
                  Get Started
                </Button>
              </div>
            </Col>
            <Col md={6} className="text-center mt-4 mt-md-0">
              <i className="bi bi-basket2-fill" style={{ fontSize: '200px', opacity: 0.8 }}></i>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-5">
        <h2 className="text-center mb-5">Why Choose Our Platform?</h2>
        <Row>
          <Col md={4} className="mb-4">
            <Card className="h-100 text-center border-0 shadow-sm">
              <Card.Body>
                <i className="bi bi-phone text-success" style={{ fontSize: '3rem' }}></i>
                <Card.Title className="mt-3">Low-Bandwidth Friendly</Card.Title>
                <Card.Text>
                  Optimized for slow connections and works offline. Browse cached listings 
                  even without internet access.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 text-center border-0 shadow-sm">
              <Card.Body>
                <i className="bi bi-cash-coin text-success" style={{ fontSize: '3rem' }}></i>
                <Card.Title className="mt-3">Direct Connection</Card.Title>
                <Card.Text>
                  Farmers get better prices, buyers get fresher produce. No middlemen taking 
                  unnecessary cuts from your earnings.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 text-center border-0 shadow-sm">
              <Card.Body>
                <i className="bi bi-shield-check text-success" style={{ fontSize: '3rem' }}></i>
                <Card.Title className="mt-3">Secure & Reliable</Card.Title>
                <Card.Text>
                  Built with Firebase security and encrypted communications. Your data and 
                  transactions are protected.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <div className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">How It Works</h2>
          <Row>
            <Col md={3} className="mb-4 text-center">
              <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                1
              </div>
              <h5>Register</h5>
              <p className="text-muted">
                Sign up as a farmer or buyer in minutes
              </p>
            </Col>
            <Col md={3} className="mb-4 text-center">
              <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                2
              </div>
              <h5>List/Browse</h5>
              <p className="text-muted">
                Farmers list produce, buyers browse offerings
              </p>
            </Col>
            <Col md={3} className="mb-4 text-center">
              <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                3
              </div>
              <h5>Connect</h5>
              <p className="text-muted">
                Message directly to coordinate delivery
              </p>
            </Col>
            <Col md={3} className="mb-4 text-center">
              <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                4
              </div>
              <h5>Transact</h5>
              <p className="text-muted">
                Complete the deal and get fresh produce
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-5">
        <Row className="align-items-center">
          <Col md={6}>
            <h2 className="mb-3">SMS/USSD Access Coming Soon</h2>
            <p className="lead">
              We're working on SMS and USSD access for users without smartphones or internet 
              access. Stay tuned for updates!
            </p>
            <p>
              <i className="bi bi-telephone-fill text-success me-2"></i>
              <strong>Support: </strong>{process.env.REACT_APP_SUPPORT_PHONE}
            </p>
            <p>
              <i className="bi bi-envelope-fill text-success me-2"></i>
              <strong>Email: </strong>{process.env.REACT_APP_SUPPORT_EMAIL}
            </p>
          </Col>
          <Col md={6} className="text-center">
            <i className="bi bi-chat-dots-fill text-success" style={{ fontSize: '150px', opacity: 0.6 }}></i>
          </Col>
        </Row>
      </Container>

      <div className="bg-success text-white py-4">
        <Container>
          <Row>
            <Col className="text-center">
              <p className="mb-0">
                &copy; 2024 Nigeria Farmers Market. Building a more food-secure future for Nigeria.
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default Home;
