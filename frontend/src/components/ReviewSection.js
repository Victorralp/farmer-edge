import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Modal, Badge } from 'react-bootstrap';
import { reviewService } from '../services/reviewService';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';

function ReviewSection({ userId, userType = 'farmer' }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 });
  const [showModal, setShowModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    try {
      const [reviewsData, ratingData] = await Promise.all([
        reviewService.getUserReviews(userId),
        reviewService.getUserRating(userId)
      ]);
      setReviews(reviewsData);
      setRating(ratingData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser) {
      toast.error('Please login to leave a review');
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    try {
      await reviewService.create({
        reviewedUserId: userId,
        reviewedUserType: userType,
        rating: newReview.rating,
        comment: newReview.comment
      });

      toast.success('Review submitted successfully');
      setShowModal(false);
      setNewReview({ rating: 5, comment: '' });
      loadReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <i
            key={star}
            className={`bi bi-star${star <= rating ? '-fill' : ''}`}
            style={{
              color: star <= rating ? '#ffc107' : '#ddd',
              fontSize: interactive ? '1.5rem' : '1rem',
              cursor: interactive ? 'pointer' : 'default',
              marginRight: '0.25rem'
            }}
            onClick={() => interactive && onRate && onRate(star)}
          ></i>
        ))}
      </div>
    );
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-3"><div className="spinner-border spinner-border-sm"></div></div>;
  }

  return (
    <div className="review-section">
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-1">Reviews & Ratings</h5>
              <div className="d-flex align-items-center gap-2">
                {renderStars(Math.round(rating.averageRating))}
                <span className="fw-bold">{rating.averageRating.toFixed(1)}</span>
                <span className="text-muted">({rating.totalReviews} reviews)</span>
              </div>
            </div>
            {currentUser && currentUser.uid !== userId && (
              <Button variant="success" size="sm" onClick={() => setShowModal(true)}>
                <i className="bi bi-star me-1"></i>
                Write Review
              </Button>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="bi bi-chat-quote" style={{fontSize: '3rem'}}></i>
              <p className="mt-2">No reviews yet</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review.id} className="review-item border-top pt-3 mt-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-bold">{review.reviewerName || 'Anonymous'}</div>
                      {renderStars(review.rating)}
                    </div>
                    <small className="text-muted">{getTimeAgo(review.createdAt)}</small>
                  </div>
                  <p className="mb-0">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Write Review Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Write a Review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Rating</Form.Label>
              <div>
                {renderStars(newReview.rating, true, (rating) => 
                  setNewReview(prev => ({ ...prev, rating }))
                )}
              </div>
            </Form.Group>
            <Form.Group>
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmitReview}>
            Submit Review
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ReviewSection;
