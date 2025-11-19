import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert } from 'react-bootstrap';
import { priceComparisonService } from '../services/priceComparisonService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

function PriceComparison() {
  const [productType, setProductType] = useState('vegetables');
  const [state, setState] = useState('');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!productType) {
      toast.error('Please select a product type');
      return;
    }

    setLoading(true);
    try {
      const [priceResults, priceStats] = await Promise.all([
        priceComparisonService.comparePrices(productType, { state, limit: 20 }),
        priceComparisonService.getPriceStats(productType, state)
      ]);

      setResults(priceResults);
      setStats(priceStats);

      if (priceResults.length === 0) {
        toast.info('No products found for this search');
      }
    } catch (error) {
      console.error('Error comparing prices:', error);
      toast.error('Failed to load price comparison');
    } finally {
      setLoading(false);
    }
  };

  const getPriceBadge = (price) => {
    if (!stats) return null;
    
    if (price <= stats.average * 0.9) {
      return <Badge bg="success">Great Deal!</Badge>;
    } else if (price <= stats.average) {
      return <Badge bg="info">Good Price</Badge>;
    } else if (price <= stats.average * 1.1) {
      return <Badge bg="warning">Average</Badge>;
    } else {
      return <Badge bg="danger">Above Average</Badge>;
    }
  };

  const getSavingsPercent = (price) => {
    if (!stats || !stats.average) return 0;
    return ((stats.average - price) / stats.average * 100).toFixed(1);
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-graph-up-arrow text-success me-2"></i>
        Price Comparison
      </h1>

      {/* Search Form */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={5}>
              <Form.Group className="mb-3 mb-md-0">
                <Form.Label>Product Type</Form.Label>
                <Form.Select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
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
            <Col md={5}>
              <Form.Group className="mb-3 mb-md-0">
                <Form.Label>State (Optional)</Form.Label>
                <Form.Select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">All States</option>
                  {nigerianStates.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="success"
                className="w-100"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    Compare
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Price Statistics */}
      {stats && stats.count > 0 && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="stat-card shadow-sm border-success">
              <Card.Body className="text-center">
                <div className="stat-value text-success">
                  ₦{stats.average.toFixed(0)}
                </div>
                <div className="stat-label">Average Price</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm border-primary">
              <Card.Body className="text-center">
                <div className="stat-value text-primary">
                  ₦{stats.min.toFixed(0)}
                </div>
                <div className="stat-label">Lowest Price</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm border-danger">
              <Card.Body className="text-center">
                <div className="stat-value text-danger">
                  ₦{stats.max.toFixed(0)}
                </div>
                <div className="stat-label">Highest Price</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stat-card shadow-sm border-info">
              <Card.Body className="text-center">
                <div className="stat-value text-info">{stats.count}</div>
                <div className="stat-label">Listings Found</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">
              <i className="bi bi-list-check me-2"></i>
              Price Comparison Results
            </h5>
          </Card.Header>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Farmer</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Rating</th>
                  <th>Savings</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <br />
                      <small className="text-muted">
                        {item.quantity} {item.unit}
                      </small>
                    </td>
                    <td>{item.farmerName || 'Farmer'}</td>
                    <td>
                      {item.location?.state}
                      {item.location?.lga && `, ${item.location.lga}`}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <strong className="text-success">
                          ₦{item.price.toLocaleString()}
                        </strong>
                        {getPriceBadge(item.price)}
                      </div>
                    </td>
                    <td>
                      {item.averageRating ? (
                        <span>
                          <i className="bi bi-star-fill text-warning"></i>
                          {' '}{item.averageRating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted">No ratings</span>
                      )}
                    </td>
                    <td>
                      {stats && item.price < stats.average ? (
                        <span className="text-success">
                          Save {getSavingsPercent(item.price)}%
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => navigate(`/listing/${item.id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {results.length === 0 && !loading && stats && (
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          No products found. Try a different search.
        </Alert>
      )}
    </Container>
  );
}

export default PriceComparison;
