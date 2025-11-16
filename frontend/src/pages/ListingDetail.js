import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { listingsAPI, ordersAPI } from '../services/api';
import { toast } from 'react-toastify';

function ListingDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderData, setOrderData] = useState({
    quantity: 1,
    message: '',
    deliveryAddress: '',
  });

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await listingsAPI.getOne(id);
      setListing(response.data);
      await listingsAPI.incrementView(id);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.warning('Please login to place an order');
      navigate('/login');
      return;
    }

    try {
      await ordersAPI.create({
        listingId: id,
        quantity: parseFloat(orderData.quantity),
        message: orderData.message,
        deliveryAddress: orderData.deliveryAddress,
      });

      toast.success('Order placed successfully! The farmer will be notified.');
      setShowOrderModal(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.error || 'Failed to place order');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (!listing) {
    return (
      <Container className="py-5 text-center">
        <h3>Listing not found</h3>
        <Button variant="success" onClick={() => navigate('/marketplace')}>
          Back to Marketplace
        </Button>
      </Container>
    );
  }

  const totalPrice = orderData.quantity * listing.price;

  return (
    <Container className="py-4">
      <Button variant="outline-secondary" onClick={() => navigate('/marketplace')} className="mb-3">
        <i className="bi bi-arrow-left me-2"></i>
        Back to Marketplace
      </Button>

      <Row>
        <Col md={6} className="mb-4">
          {listing.image ? (
            <img
              src={listing.image.url}
              alt={listing.title}
              className="img-fluid rounded shadow"
              style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="bg-light rounded d-flex align-items-center justify-content-center"
              style={{ width: '100%', height: '400px' }}
            >
              <i className="bi bi-image text-muted" style={{ fontSize: '5rem' }}></i>
            </div>
          )}
        </Col>

        <Col md={6}>
          <h1>{listing.title}</h1>
          <p className="text-muted">
            <i className="bi bi-geo-alt me-1"></i>
            {listing.location?.state}
            {listing.location?.lga && `, ${listing.location.lga}`}
          </p>

          <Card className="mb-3">
            <Card.Body>
              <h2 className="text-success mb-0">
                ₦{listing.price.toLocaleString()}/{listing.unit}
              </h2>
              <p className="text-muted mb-0">
                {listing.quantity} {listing.unit} available
              </p>
            </Card.Body>
          </Card>

          {listing.description && (
            <div className="mb-3">
              <h5>Description</h5>
              <p>{listing.description}</p>
            </div>
          )}

          {listing.farmer && (
            <Card className="mb-3">
              <Card.Body>
                <h5>Farmer Information</h5>
                <p className="mb-1">
                  <strong>Name:</strong> {listing.farmer.name}
                </p>
                <p className="mb-1">
                  <strong>Location:</strong> {listing.farmer.location?.state}
                </p>
                {listing.farmer.phone && (
                  <p className="mb-0">
                    <strong>Phone:</strong> {listing.farmer.phone}
                  </p>
                )}
              </Card.Body>
            </Card>
          )}

          <Button
            variant="success"
            size="lg"
            className="w-100"
            onClick={() => setShowOrderModal(true)}
            disabled={listing.quantity === 0}
          >
            {listing.quantity === 0 ? 'Out of Stock' : 'Place Order'}
          </Button>
        </Col>
      </Row>

      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Place Order</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleOrderSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Quantity ({listing.unit})</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={listing.quantity}
                value={orderData.quantity}
                onChange={(e) => setOrderData({ ...orderData, quantity: e.target.value })}
                required
              />
              <Form.Text className="text-muted">
                Maximum: {listing.quantity} {listing.unit}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Delivery Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={orderData.deliveryAddress}
                onChange={(e) => setOrderData({ ...orderData, deliveryAddress: e.target.value })}
                placeholder="Enter your delivery address"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message to Farmer (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={orderData.message}
                onChange={(e) => setOrderData({ ...orderData, message: e.target.value })}
                placeholder="Any special requests or questions?"
              />
            </Form.Group>

            <Card bg="light">
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <span>Total Price:</span>
                  <strong className="text-success">₦{totalPrice.toLocaleString()}</strong>
                </div>
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              Confirm Order
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default ListingDetail;
