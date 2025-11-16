import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { listingsAPI, ordersAPI, authAPI } from '../services/api';
import { toast } from 'react-toastify';

function Dashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const profileRes = await authAPI.getProfile();
      setProfile(profileRes.data);

      if (profileRes.data.role === 'farmer') {
        const listingsRes = await listingsAPI.getMyListings();
        setListings(listingsRes.data.listings);

        const ordersRes = await ordersAPI.getFarmerOrders();
        setOrders(ordersRes.data.orders);
      } else {
        const ordersRes = await ordersAPI.getBuyerOrders();
        setOrders(ordersRes.data.orders);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      toast.success('Order status updated');
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      accepted: 'info',
      declined: 'danger',
      shipped: 'primary',
      completed: 'success',
      cancelled: 'secondary',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-speedometer2 me-2"></i>
        Dashboard
      </h1>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="stat-card shadow-sm">
            <Card.Body>
              <div className="stat-value">{orders.length}</div>
              <div className="stat-label">Total Orders</div>
            </Card.Body>
          </Card>
        </Col>
        {profile?.role === 'farmer' && (
          <>
            <Col md={4}>
              <Card className="stat-card shadow-sm">
                <Card.Body>
                  <div className="stat-value">{listings.length}</div>
                  <div className="stat-label">Active Listings</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="stat-card shadow-sm">
                <Card.Body>
                  <div className="stat-value">
                    {orders.filter(o => o.status === 'pending').length}
                  </div>
                  <div className="stat-label">Pending Orders</div>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}
      </Row>

      {profile?.role === 'farmer' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>My Listings</h3>
            <Button as={Link} to="/create-listing" variant="success">
              <i className="bi bi-plus-circle me-2"></i>
              Create New Listing
            </Button>
          </div>

          <Card className="mb-4 shadow-sm">
            <Card.Body>
              {listings.length === 0 ? (
                <p className="text-muted text-center py-3 mb-0">
                  No listings yet. Create your first listing to start selling!
                </p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Views</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map(listing => (
                      <tr key={listing.id}>
                        <td>{listing.title}</td>
                        <td>₦{listing.price}/{listing.unit}</td>
                        <td>{listing.quantity} {listing.unit}</td>
                        <td>{getStatusBadge(listing.status)}</td>
                        <td>{listing.views || 0}</td>
                        <td>
                          <Button
                            as={Link}
                            to={`/listing/${listing.id}`}
                            variant="outline-primary"
                            size="sm"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      <h3 className="mb-3">
        {profile?.role === 'farmer' ? 'Incoming Orders' : 'My Orders'}
      </h3>

      <Card className="shadow-sm">
        <Card.Body>
          {orders.length === 0 ? (
            <p className="text-muted text-center py-3 mb-0">No orders yet</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>{profile?.role === 'farmer' ? 'Buyer' : 'Farmer'}</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.produceName}</td>
                    <td>
                      {profile?.role === 'farmer' ? order.buyerName : order.farmerName}
                    </td>
                    <td>{order.quantity} {order.unit}</td>
                    <td>₦{order.totalPrice.toLocaleString()}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      {profile?.role === 'farmer' && order.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleStatusUpdate(order.id, 'accepted')}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'declined')}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {profile?.role === 'farmer' && order.status === 'accepted' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'shipped')}
                        >
                          Mark as Shipped
                        </Button>
                      )}
                      {profile?.role === 'buyer' && order.status === 'shipped' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'completed')}
                        >
                          Confirm Receipt
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Dashboard;
