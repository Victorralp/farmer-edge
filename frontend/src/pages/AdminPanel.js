import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Tabs, Tab, Alert, Modal, Form } from 'react-bootstrap';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';

function AdminPanel() {
  const [stats, setStats] = useState({
    users: { total: 0, farmers: 0, buyers: 0, admins: 0 },
    listings: { total: 0, active: 0, suspended: 0, pending: 0 },
    orders: { total: 0, completed: 0, pending: 0, cancelled: 0 },
    revenue: { total: 0, thisMonth: 0 }
  });
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

      setStats(statsRes.data.stats || statsRes.data || {
        users: { total: 0, farmers: 0, buyers: 0 },
        listings: { total: 0, active: 0 },
        orders: { total: 0, completed: 0 },
        revenue: { total: 0 }
      });
      setUsers(usersRes.data.users);
      setListings(listingsRes.data.listings);
      setOrders(ordersRes.data.orders);
      setPermissionError(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
        setPermissionError(true);
      } else {
        toast.error('Failed to load admin data');
      }
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

  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const confirmRoleChange = async () => {
    try {
      await adminAPI.updateUserRole(selectedUser.uid, newRole);
      toast.success(`User role updated to ${newRole}`);
      setShowRoleModal(false);
      fetchAdminData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = (user) => {
    setDeleteTarget({ type: 'user', data: user });
    setShowDeleteModal(true);
  };

  const handleDeleteListing = (listing) => {
    setDeleteTarget({ type: 'listing', data: listing });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'user') {
        await adminAPI.deleteUser(deleteTarget.data.uid);
        toast.success('User deleted');
      } else if (deleteTarget.type === 'listing') {
        await adminAPI.deleteListing(deleteTarget.data.id);
        toast.success('Listing deleted');
      }
      setShowDeleteModal(false);
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success"></div>
      </Container>
    );
  }

  if (permissionError) {
    return (
      <Container className="py-5">
        <Card className="border-danger shadow-sm">
          <Card.Header className="bg-danger text-white">
            <h4 className="mb-0"><i className="bi bi-exclamation-triangle-fill me-2"></i>Access Denied</h4>
          </Card.Header>
          <Card.Body className="text-center p-5">
            <h3>You do not have Admin permissions</h3>
            <p className="lead text-muted mb-4">
              Your user account is not recognized as an administrator in the database.
            </p>
            <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
              <Button 
                variant="outline-danger" 
                href="/set-admin.html" 
                target="_blank"
                size="lg"
              >
                <i className="bi bi-tools me-2"></i>
                Fix Permissions (Make Me Admin)
              </Button>
              <Button 
                variant="secondary" 
                onClick={fetchAdminData}
                size="lg"
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Retry
              </Button>
            </div>
            <Alert variant="info" className="mt-4 text-start">
              <strong>How to fix:</strong>
              <ol className="mb-0 mt-2">
                <li>Click the <strong>Fix Permissions</strong> button above</li>
                <li>Enter your email address</li>
                <li>Click "Make Me Admin"</li>
                <li>Come back here and click <strong>Retry</strong></li>
              </ol>
            </Alert>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-shield-check me-2"></i>
        Admin Panel
      </h1>

      <Row className="mb-4">
          <Col md={3}>
            <Card className="stat-card shadow-sm border-primary">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-value text-primary">{stats.users.total}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                  <i className="bi bi-people-fill text-primary" style={{fontSize: '2.5rem', opacity: 0.3}}></i>
                </div>
                <hr className="my-2" />
                <small className="text-muted d-block">
                  <i className="bi bi-person-badge me-1"></i>{stats.users.farmers} farmers
                </small>
                <small className="text-muted d-block">
                  <i className="bi bi-cart me-1"></i>{stats.users.buyers} buyers
                </small>
                <small className="text-muted d-block">
                  <i className="bi bi-shield-check me-1"></i>{stats.users.admins} admins
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm border-success">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-value text-success">{stats.listings.active}</div>
                    <div className="stat-label">Active Listings</div>
                  </div>
                  <i className="bi bi-shop text-success" style={{fontSize: '2.5rem', opacity: 0.3}}></i>
                </div>
                <hr className="my-2" />
                <small className="text-muted d-block">
                  <i className="bi bi-check-circle me-1"></i>{stats.listings.active} active
                </small>
                <small className="text-muted d-block">
                  <i className="bi bi-pause-circle me-1"></i>{stats.listings.suspended} suspended
                </small>
                <small className="text-muted d-block">
                  <i className="bi bi-clock me-1"></i>{stats.listings.pending} pending
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm border-info">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-value text-info">{stats.orders.total}</div>
                    <div className="stat-label">Total Orders</div>
                  </div>
                  <i className="bi bi-bag-check-fill text-info" style={{fontSize: '2.5rem', opacity: 0.3}}></i>
                </div>
                <hr className="my-2" />
                <small className="text-muted d-block">
                  <i className="bi bi-check-circle me-1"></i>{stats.orders.completed} completed
                </small>
                <small className="text-muted d-block">
                  <i className="bi bi-hourglass-split me-1"></i>{stats.orders.pending} pending
                </small>
                <small className="text-muted d-block">
                  <i className="bi bi-x-circle me-1"></i>{stats.orders.cancelled} cancelled
                </small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm border-warning">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-value text-warning">
                      ₦{(stats.revenue.total / 1000).toFixed(1)}K
                    </div>
                    <div className="stat-label">Total Revenue</div>
                  </div>
                  <i className="bi bi-currency-exchange text-warning" style={{fontSize: '2.5rem', opacity: 0.3}}></i>
                </div>
                <hr className="my-2" />
                <small className="text-muted d-block">
                  <i className="bi bi-calendar-month me-1"></i>This month: ₦{(stats.revenue.thisMonth / 1000).toFixed(1)}K
                </small>
                <small className="text-muted d-block">
                  <i className="bi bi-graph-up me-1"></i>All time: ₦{stats.revenue.total.toLocaleString()}
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

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
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                               style={{width: '35px', height: '35px', fontSize: '14px'}}>
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="fw-bold">{user.name}</div>
                            <small className="text-muted">ID: {user.uid.substring(0, 8)}...</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <Badge 
                          bg={user.role === 'admin' ? 'danger' : user.role === 'farmer' ? 'success' : 'info'} 
                          className="text-capitalize"
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={user.active !== false ? 'success' : 'danger'}>
                          {user.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <Button
                            variant={user.active !== false ? 'outline-danger' : 'outline-success'}
                            size="sm"
                            onClick={() => handleUserStatusChange(user.uid, user.active === false)}
                            title={user.active !== false ? 'Deactivate' : 'Activate'}
                          >
                            <i className={`bi bi-${user.active !== false ? 'x-circle' : 'check-circle'}`}></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleRoleChange(user)}
                            title="Change Role"
                          >
                            <i className="bi bi-person-gear"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            title="Delete User"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
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
                      <td>
                        <div>
                          <div className="fw-bold">{listing.title}</div>
                          <small className="text-muted">
                            {listing.quantity} {listing.unit} • {listing.type}
                          </small>
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">{listing.farmerId?.substring(0, 12)}...</small>
                      </td>
                      <td>
                        <span className="fw-bold text-success">₦{listing.price?.toLocaleString()}</span>
                        <small className="text-muted d-block">per {listing.unit}</small>
                      </td>
                      <td>
                        <Badge bg={listing.status === 'active' ? 'success' : listing.status === 'suspended' ? 'danger' : 'warning'}>
                          {listing.status || 'active'}
                        </Badge>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          {listing.status === 'active' ? (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleListingModeration(listing.id, 'suspended')}
                              title="Suspend"
                            >
                              <i className="bi bi-pause-circle"></i>
                            </Button>
                          ) : (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleListingModeration(listing.id, 'active')}
                              title="Activate"
                            >
                              <i className="bi bi-check-circle"></i>
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteListing(listing)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
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

      {/* Role Change Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Change role for: <strong>{selectedUser?.email}</strong></p>
          <Form.Group>
            <Form.Label>Select New Role</Form.Label>
            <Form.Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmRoleChange}>
            Update Role
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Are you sure you want to delete this {deleteTarget?.type}?
          </p>
          {deleteTarget?.type === 'user' && (
            <Alert variant="warning" className="mt-3 mb-0">
              <strong>Warning:</strong> This will permanently delete the user account and all associated data.
            </Alert>
          )}
          {deleteTarget?.type === 'listing' && (
            <Alert variant="warning" className="mt-3 mb-0">
              <strong>Warning:</strong> This will permanently delete the listing.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            <i className="bi bi-trash me-2"></i>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default AdminPanel;
