import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { listingsAPI } from '../services/api';
import { getCachedListings, cacheListings, isOnline } from '../services/offlineStorage';
import { toast } from 'react-toastify';

const produceTypes = ['Vegetables', 'Fruits', 'Grains', 'Tubers', 'Legumes', 'Other'];

function Marketplace() {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    location: '',
  });

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, listings]);

  const fetchListings = async () => {
    try {
      if (isOnline()) {
        const response = await listingsAPI.getAll();
        setListings(response.data.listings);
        await cacheListings(response.data.listings);
      } else {
        const cached = await getCachedListings();
        if (cached) {
          setListings(cached);
          toast.info('Showing cached listings (offline mode)');
        } else {
          toast.warning('No cached listings available offline');
        }
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      const cached = await getCachedListings();
      if (cached) {
        setListings(cached);
        toast.info('Showing cached listings');
      } else {
        toast.error('Failed to load listings');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        listing =>
          listing.title.toLowerCase().includes(searchLower) ||
          (listing.description && listing.description.toLowerCase().includes(searchLower))
      );
    }

    if (filters.type) {
      filtered = filtered.filter(listing => listing.type === filters.type);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(listing => listing.price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(listing => listing.price <= parseFloat(filters.maxPrice));
    }

    if (filters.location) {
      filtered = filtered.filter(
        listing =>
          listing.location?.state?.toLowerCase().includes(filters.location.toLowerCase()) ||
          listing.location?.lga?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    setFilteredListings(filtered);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      location: '',
    });
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

  return (
    <Container className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-shop me-2"></i>
        Marketplace
      </h1>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <Form.Control
                type="text"
                name="search"
                placeholder="Search produce..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </Col>
            <Col md={2} className="mb-3">
              <Form.Select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">All Types</option>
                {produceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2} className="mb-3">
              <Form.Control
                type="number"
                name="minPrice"
                placeholder="Min Price (₦)"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
            </Col>
            <Col md={2} className="mb-3">
              <Form.Control
                type="number"
                name="maxPrice"
                placeholder="Max Price (₦)"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </Col>
            <Col md={2} className="mb-3">
              <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
                Clear Filters
              </Button>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Control
                type="text"
                name="location"
                placeholder="Filter by location..."
                value={filters.location}
                onChange={handleFilterChange}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="mb-3">
        <strong>{filteredListings.length}</strong> listing(s) found
      </div>

      {filteredListings.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3">No listings found</h4>
            <p className="text-muted">Try adjusting your filters or check back later</p>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {filteredListings.map(listing => (
            <Col key={listing.id} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                {listing.image && (
                  <Card.Img
                    variant="top"
                    src={listing.image.thumbnail || listing.image.url}
                    alt={listing.title}
                    className="listing-image"
                    loading="lazy"
                  />
                )}
                {!listing.image && (
                  <div
                    className="listing-image bg-light d-flex align-items-center justify-content-center"
                  >
                    <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
                  </div>
                )}
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0">{listing.title}</Card.Title>
                    <Badge bg="success">{listing.type}</Badge>
                  </div>
                  <Card.Text className="text-muted small">
                    <i className="bi bi-geo-alt me-1"></i>
                    {listing.location?.state}
                    {listing.location?.lga && `, ${listing.location.lga}`}
                  </Card.Text>
                  <Card.Text>
                    {listing.description && listing.description.substring(0, 100)}
                    {listing.description?.length > 100 && '...'}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="text-success mb-0">
                        ₦{listing.price.toLocaleString()}/{listing.unit}
                      </h5>
                      <small className="text-muted">
                        {listing.quantity} {listing.unit} available
                      </small>
                    </div>
                    <Button
                      as={Link}
                      to={`/listing/${listing.id}`}
                      variant="outline-success"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </Card.Body>
                {listing.views > 0 && (
                  <Card.Footer className="text-muted small">
                    <i className="bi bi-eye me-1"></i>
                    {listing.views} views
                  </Card.Footer>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default Marketplace;
