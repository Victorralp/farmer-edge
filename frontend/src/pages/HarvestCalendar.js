import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Badge, Table } from 'react-bootstrap';
import { harvestService } from '../services/harvestService';
import { toast } from 'react-toastify';
import './HarvestCalendar.css';

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

function HarvestCalendar() {
  const [harvests, setHarvests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    productType: 'vegetables',
    estimatedQuantity: '',
    unit: 'kg',
    harvestDate: '',
    state: '',
    lga: '',
    notes: ''
  });

  useEffect(() => {
    loadHarvests();
  }, []);

  const loadHarvests = async () => {
    try {
      const data = await harvestService.getFarmerHarvests();
      setHarvests(data);
    } catch (error) {
      console.error('Error loading harvests:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await harvestService.create({
        ...formData,
        estimatedQuantity: Number(formData.estimatedQuantity),
        harvestDate: new Date(formData.harvestDate),
        location: {
          state: formData.state,
          lga: formData.lga
        }
      });

      toast.success('Harvest scheduled successfully!');
      setShowModal(false);
      resetForm();
      loadHarvests();
    } catch (error) {
      console.error('Error creating harvest:', error);
      toast.error('Failed to schedule harvest');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHarvested = async (harvestId) => {
    try {
      await harvestService.markAsHarvested(harvestId);
      toast.success('Marked as harvested!');
      loadHarvests();
    } catch (error) {
      console.error('Error marking harvest:', error);
      toast.error('Failed to update harvest');
    }
  };

  const handleNotifySubscribers = async (harvestId) => {
    try {
      await harvestService.notifySubscribers(harvestId);
      toast.success('Subscribers notified!');
      loadHarvests();
    } catch (error) {
      console.error('Error notifying subscribers:', error);
      toast.error('Failed to send notifications');
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      productType: 'vegetables',
      estimatedQuantity: '',
      unit: 'kg',
      harvestDate: '',
      state: '',
      lga: '',
      notes: ''
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      scheduled: 'primary',
      harvested: 'success',
      cancelled: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const upcomingHarvests = harvests.filter(h => h.status === 'scheduled');
  const completedHarvests = harvests.filter(h => h.status === 'harvested');

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            <i className="bi bi-calendar-check text-success me-2"></i>
            Harvest Calendar
          </h1>
          <p className="text-muted">Schedule and manage your harvests</p>
        </div>
        <Button variant="success" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Schedule Harvest
        </Button>
      </div>

      {/* Stats */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="stat-card shadow-sm border-primary">
            <Card.Body>
              <div className="stat-value text-primary">{upcomingHarvests.length}</div>
              <div className="stat-label">Upcoming Harvests</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card shadow-sm border-success">
            <Card.Body>
              <div className="stat-value text-success">{completedHarvests.length}</div>
              <div className="stat-label">Completed</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card shadow-sm border-info">
            <Card.Body>
              <div className="stat-value text-info">{harvests.length}</div>
              <div className="stat-label">Total Harvests</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Upcoming Harvests */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-calendar-event me-2"></i>
            Upcoming Harvests
          </h5>
        </Card.Header>
        <Card.Body>
          {upcomingHarvests.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-calendar-x" style={{ fontSize: '3rem' }}></i>
              <p className="mt-2">No upcoming harvests scheduled</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Harvest Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingHarvests.map(harvest => (
                  <tr key={harvest.id}>
                    <td>
                      <strong>{harvest.productName}</strong>
                      <br />
                      <small className="text-muted">{harvest.productType}</small>
                    </td>
                    <td>{harvest.estimatedQuantity} {harvest.unit}</td>
                    <td>
                      {new Date(harvest.harvestDate?.toDate?.() || harvest.harvestDate).toLocaleDateString()}
                    </td>
                    <td>
                      {harvest.location?.state}
                      {harvest.location?.lga && `, ${harvest.location.lga}`}
                    </td>
                    <td>{getStatusBadge(harvest.status)}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button
                          size="sm"
                          variant="outline-success"
                          onClick={() => handleMarkHarvested(harvest.id)}
                          title="Mark as Harvested"
                        >
                          <i className="bi bi-check-circle"></i>
                        </Button>
                        {!harvest.notificationsSent && (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleNotifySubscribers(harvest.id)}
                            title="Notify Subscribers"
                          >
                            <i className="bi bi-bell"></i>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Schedule Harvest Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Schedule New Harvest</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    required
                    placeholder="e.g., Fresh Tomatoes"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Type *</Form.Label>
                  <Form.Select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    required
                  >
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="grains">Grains</option>
                    <option value="tubers">Tubers</option>
                    <option value="livestock">Livestock</option>
                    <option value="dairy">Dairy</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estimated Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.estimatedQuantity}
                    onChange={(e) => setFormData({ ...formData, estimatedQuantity: e.target.value })}
                    required
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit *</Form.Label>
                  <Form.Select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="bag">Bags</option>
                    <option value="basket">Baskets</option>
                    <option value="bundle">Bundles</option>
                    <option value="piece">Pieces</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Harvest Date *</Form.Label>
              <Form.Control
                type="date"
                value={formData.harvestDate}
                onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>State *</Form.Label>
                  <Form.Select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  >
                    <option value="">Select state</option>
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
                    value={formData.lga}
                    onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                    placeholder="Optional"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information (optional)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Scheduling...
              </>
            ) : (
              <>
                <i className="bi bi-calendar-check me-2"></i>
                Schedule Harvest
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default HarvestCalendar;
