import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Tabs, Tab } from 'react-bootstrap';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';

function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, listingsRes, ordersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getListings(),
        adminAPI.getOrders(),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setListings(listingsRes.data.listings);
      setOrders(ordersRes.data.orders);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusChange = async (uid, active) => {
    try {
      await adminAPI.updateUserStatus(uid, active);
      toast.success('User status updated');
      fetchAdminData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleListingModeration = async (id, status) => {
    try {
      await adminAPI.moderateListing(id, status);
      toast.success('Listing moderated');
      fetchAdminData();
    } catch (error) {
      console.error('Error moderating listing:', error);
      toast.error('Failed to moderate listing');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success"></div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-shield-check me-2"></i>
        Admin Panel
      </h1>

      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="stat-card shadow-sm">
              <Card.Body>
                <div className="stat-value">{stats.users.total}</div>
                <div className="stat-label">Total Users</div>
                <small className="text-muted">
                  {stats.users.farmers} farmers, {stats.users.buyers} buyers
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm">
              <Card.Body>
                <div className="stat-value">{stats.listings.active}</div>
                <div className="stat-label">Active Listings</div>
                <small className="text-muted">
                  {stats.listings.total} total
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm">
              <Card.Body>
                <div className="stat-value">{stats.orders.total}</div>
                <div className="stat-label">Total Orders</div>
                <small className="text-muted">
                  {stats.orders.completed} completed
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm">
              <Card.Body>
                <div className="stat-value">
                  ₦{stats.revenue.total.toLocaleString()}
                </div>
                <div className="stat-label">Platform Revenue</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Tabs defaultActiveKey="users" className="mb-3">
        <Tab eventKey="users" title="Users Management">
          <Card className="shadow-sm">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.uid}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg="info" className="text-capitalize">
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={user.active ? 'success' : 'danger'}>
                          {user.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant={user.active ? 'danger' : 'success'}
                          size="sm"
                          onClick={() => handleUserStatusChange(user.uid, !user.active)}
                        >
                          {user.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="listings" title="Listings Moderation">
          <Card className="shadow-sm">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Farmer</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(listing => (
                    <tr key={listing.id}>
                      <td>{listing.title}</td>
                      <td>{listing.farmerId}</td>
                      <td>₦{listing.price}</td>
                      <td>
                        <Badge bg={listing.status === 'active' ? 'success' : 'warning'}>
                          {listing.status}
                        </Badge>
                      </td>
                      <td>
                        {listing.status === 'active' ? (
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleListingModeration(listing.id, 'suspended')}
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleListingModeration(listing.id, 'active')}
                          >
                            Activate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="orders" title="Orders Overview">
          <Card className="shadow-sm">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Buyer</th>
                    <th>Farmer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.produceName}</td>
                      <td>{order.buyerName}</td>
                      <td>{order.farmerName}</td>
                      <td>₦{order.totalPrice.toLocaleString()}</td>
                      <td>
                        <Badge bg="info">{order.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default AdminPanel;
