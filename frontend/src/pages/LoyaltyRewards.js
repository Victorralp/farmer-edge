import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ProgressBar, Modal } from 'react-bootstrap';
import { loyaltyService } from '../services/loyaltyService';
import { toast } from 'react-toastify';

function LoyaltyRewards() {
  const [points, setPoints] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [tierBenefits, setTierBenefits] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pointsData, couponsData] = await Promise.all([
        loyaltyService.getPoints(),
        loyaltyService.getCoupons()
      ]);
      
      setPoints(pointsData);
      setCoupons(couponsData);
      
      if (pointsData) {
        setTierBenefits(loyaltyService.getTierBenefits(pointsData.tier));
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      await loyaltyService.redeemCoupon(selectedCoupon.id);
      toast.success(`Coupon ${selectedCoupon.code} redeemed successfully!`);
      setShowRedeemModal(false);
      loadData();
    } catch (error) {
      console.error('Error redeeming coupon:', error);
      toast.error(error.message || 'Failed to redeem coupon');
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2'
    };
    return colors[tier] || colors.bronze;
  };

  const getNextTier = () => {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(points?.tier || 'bronze');
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  const getPointsToNextTier = () => {
    const nextTier = getNextTier();
    if (!nextTier) return 0;
    
    const nextTierBenefits = loyaltyService.getTierBenefits(nextTier);
    return nextTierBenefits.minPoints - (points?.totalEarned || 0);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success"></div>
      </Container>
    );
  }

  if (!points) {
    return (
      <Container className="py-5 text-center">
        <h3>Please login to view your rewards</h3>
      </Container>
    );
  }

  const nextTier = getNextTier();
  const pointsToNext = getPointsToNextTier();

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-trophy me-2"></i>
        Loyalty & Rewards
      </h1>

      {/* Points Overview */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm text-center" style={{borderTop: `4px solid ${getTierColor(points.tier)}`}}>
            <Card.Body>
              <div style={{fontSize: '3rem', color: getTierColor(points.tier)}}>
                <i className="bi bi-award-fill"></i>
              </div>
              <h3 className="text-capitalize">{points.tier} Member</h3>
              <div className="display-4 fw-bold text-success">{points.points}</div>
              <p className="text-muted mb-0">Available Points</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Points Summary</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Earned:</span>
                <strong>{points.totalEarned}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Total Spent:</span>
                <strong>{points.totalSpent}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Available:</span>
                <strong className="text-success">{points.points}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Tier Progress</h5>
              {nextTier ? (
                <>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Next Tier:</span>
                    <strong className="text-capitalize">{nextTier}</strong>
                  </div>
                  <ProgressBar 
                    now={(points.totalEarned / loyaltyService.getTierBenefits(nextTier).minPoints) * 100}
                    label={`${pointsToNext} points to go`}
                    variant="success"
                  />
                </>
              ) : (
                <div className="text-center py-3">
                  <i className="bi bi-trophy-fill text-warning" style={{fontSize: '2rem'}}></i>
                  <p className="mb-0 mt-2">You've reached the highest tier!</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tier Benefits */}
      {tierBenefits && (
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h5 className="mb-0">Your {tierBenefits.name} Benefits</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <div className="text-center p-3">
                  <i className="bi bi-percent" style={{fontSize: '2rem', color: '#28a745'}}></i>
                  <h4 className="mt-2">{tierBenefits.discount}%</h4>
                  <p className="text-muted mb-0">Discount</p>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3">
                  <i className="bi bi-truck" style={{fontSize: '2rem', color: '#28a745'}}></i>
                  <h4 className="mt-2">{tierBenefits.freeShipping ? 'Yes' : 'No'}</h4>
                  <p className="text-muted mb-0">Free Shipping</p>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3">
                  <i className="bi bi-headset" style={{fontSize: '2rem', color: '#28a745'}}></i>
                  <h4 className="mt-2">{tierBenefits.prioritySupport ? 'Yes' : 'No'}</h4>
                  <p className="text-muted mb-0">Priority Support</p>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3">
                  <i className="bi bi-gift" style={{fontSize: '2rem', color: '#28a745'}}></i>
                  <h4 className="mt-2">Exclusive</h4>
                  <p className="text-muted mb-0">Offers</p>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Available Coupons */}
      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Available Coupons</h5>
        </Card.Header>
        <Card.Body>
          {coupons.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-ticket-perforated" style={{fontSize: '3rem'}}></i>
              <p className="mt-2">No coupons available at the moment</p>
            </div>
          ) : (
            <Row>
              {coupons.map(coupon => (
                <Col md={6} lg={4} key={coupon.id} className="mb-3">
                  <Card className="h-100 border-success">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="mb-0">{coupon.discount}% OFF</h5>
                        <Badge bg="success">{coupon.pointsCost} pts</Badge>
                      </div>
                      <p className="text-muted small mb-2">{coupon.description}</p>
                      <p className="mb-2">
                        <strong>Code:</strong> <code>{coupon.code}</code>
                      </p>
                      <Button
                        variant="success"
                        size="sm"
                        className="w-100"
                        disabled={points.points < coupon.pointsCost}
                        onClick={() => {
                          setSelectedCoupon(coupon);
                          setShowRedeemModal(true);
                        }}
                      >
                        {points.points < coupon.pointsCost ? 'Insufficient Points' : 'Redeem'}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Redeem Confirmation Modal */}
      <Modal show={showRedeemModal} onHide={() => setShowRedeemModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Redeem Coupon</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCoupon && (
            <>
              <p>Are you sure you want to redeem this coupon?</p>
              <Card className="bg-light">
                <Card.Body>
                  <h5>{selectedCoupon.discount}% OFF</h5>
                  <p className="mb-2">{selectedCoupon.description}</p>
                  <p className="mb-0">
                    <strong>Cost:</strong> {selectedCoupon.pointsCost} points
                  </p>
                </Card.Body>
              </Card>
              <p className="mt-3 mb-0">
                Your remaining points: <strong>{points.points - selectedCoupon.pointsCost}</strong>
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRedeemModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleRedeemCoupon}>
            Confirm Redeem
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default LoyaltyRewards;
