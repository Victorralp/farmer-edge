import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { listingsAPI } from '../services/api';
import { saveDraftListing, isOnline } from '../services/offlineStorage';
import { toast } from 'react-toastify';
import { validateListingForm } from '../utils/validation';
import { produceTypes, units, nigerianStates } from '../constants';

const produceTypesOptions = produceTypes;
const unitOptions = units;
const stateOptions = nigerianStates;

function CreateListing() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    price: '',
    quantity: '',
    unit: 'kg',
    state: '',
    lga: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { valid, errors, cleaned } = validateListingForm(formData);
      if (!valid) {
        const firstError = Object.values(errors)[0];
        toast.error(firstError);
        setLoading(false);
        return;
      }

      if (!isOnline()) {
        await saveDraftListing(formData);
        toast.info('You are offline. Listing saved as draft and will be submitted when online.');
        navigate('/dashboard');
        return;
      }

      await listingsAPI.create({
        title: cleaned.title,
        description: cleaned.description,
        type: cleaned.type,
        price: formData.price,
        quantity: formData.quantity,
        unit: cleaned.unit,
        location: {
          state: cleaned.state,
          lga: cleaned.lga,
        },
        image: formData.image,
      });

      toast.success('Listing created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const msg = error?.message || 'Failed to create listing';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="mb-3">
                <i className="bi bi-plus-circle me-2"></i>
                Create New Listing
              </h2>
              
              <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Tips for better listings:</strong>
                <ul className="mb-0 mt-2">
                  <li>Use clear, high-quality photos</li>
                  <li>Set competitive prices based on market rates</li>
                  <li>Provide accurate quantity and harvest information</li>
                  <li>Respond quickly to buyer inquiries</li>
                </ul>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Fresh Tomatoes"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your produce (quality, harvest date, etc.)"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Product Type *</Form.Label>
                      <Form.Select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select type</option>
                        {produceTypesOptions.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Unit *</Form.Label>
                      <Form.Select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        required
                      >
                        {unitOptions.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price per Unit (₦) *</Form.Label>
                      <Form.Control
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantity Available *</Form.Label>
                      <Form.Control
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

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
                        <option value="">Select state</option>
                        {stateOptions.map(state => (
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
                        placeholder="Local government area"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Product Image (Max 10MB)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <Form.Text className="text-muted">
                    Upload a clear photo of your produce. Images are automatically optimized.
                  </Form.Text>
                </Form.Group>

                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="img-thumbnail"
                      style={{ maxWidth: '300px', maxHeight: '300px' }}
                    />
                  </div>
                )}

                <div className="d-grid gap-2">
                  <Button variant="success" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Creating Listing...
                      </>
                    ) : (
                      'Create Listing'
                    )}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CreateListing;
