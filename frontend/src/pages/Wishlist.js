import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { wishlistService } from '../services/wishlistService';
import { toast } from 'react-toastify';
import './Wishlist.css';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const items = await wishlistService.getUserWishlist();
      setWishlist(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (wishlistId) => {
    try {
      await wishlistService.remove(wishlistId);
      setWishlist(prev => prev.filter(item => item.id !== wishlistId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleViewProduct = (listingId) => {
    navigate(`/listing/${listingId}`);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">Loading your wishlist...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            <i className="bi bi-heart-fill text-danger me-2"></i>
            My Wishlist
          </h1>
          <p className="text-muted">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <Card className="text-center py-5 shadow-sm">
          <Card.Body>
            <i className="bi bi-heart" style={{ fontSize: '5rem', color: '#ddd' }}></i>
            <h3 className="mt-4">Your wishlist is empty</h3>
            <p className="text-muted mb-4">
              Start adding products you love to keep track of them
            </p>
            <Button variant="success" onClick={() => navigate('/marketplace')}>
              <i className="bi bi-shop me-2"></i>
              Browse Marketplace
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {wishlist.map(item => (
            <Col key={item.id} md={6} lg={4} className="mb-4">
              <Card className="wishlist-card h-100 shadow-sm">
                {item.imageUrl && (
                  <Card.Img 
                    variant="top" 
                    src={item.imageUrl} 
                    alt={item.productName}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                )}
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="mb-0">{item.productName}</h5>
                    <Button
                      variant="link"
                      className="text-danger p-0"
                      onClick={() => handleRemove(item.id)}
                      title="Remove from wishlist"
                    >
                      <i className="bi bi-heart-fill fs-4"></i>
                    </Button>
                  </div>
                  
                  <Badge bg="secondary" className="mb-2">
                    {item.productType}
                  </Badge>
                  
                  <div className="mb-2">
                    <small className="text-muted">
                      <i className="bi bi-person me-1"></i>
                      {item.farmerName || 'Farmer'}
                    </small>
                  </div>
                  
                  <div className="price-section mb-3">
                    <h4 className="text-success mb-0">
                      ₦{item.price?.toLocaleString()}
                    </h4>
                  </div>

                  <div className="notification-preferences mb-3">
                    <small className="text-muted d-block">
                      <i className="bi bi-bell me-1"></i>
                      Notifications enabled
                    </small>
                  </div>

                  <Button
                    variant="success"
                    className="w-100"
                    onClick={() => handleViewProduct(item.listingId)}
                  >
                    <i className="bi bi-eye me-2"></i>
                    View Product
                  </Button>
                </Card.Body>
                <Card.Footer className="text-muted small">
                  Added {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleDateString()}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {wishlist.length > 0 && (
        <Alert variant="info" className="mt-4">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Tip:</strong> You'll receive notifications when these products become available or when prices change.
        </Alert>
      )}
    </Container>
  );
}

export default Wishlist;
