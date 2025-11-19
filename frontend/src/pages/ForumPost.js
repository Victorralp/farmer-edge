import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { forumService } from '../services/forumService';
import { toast } from 'react-toastify';
import { getAuth } from 'firebase/auth';

function ForumPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const [postData, commentsData] = await Promise.all([
        forumService.getPost(postId),
        forumService.getComments(postId)
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      await forumService.likePost(postId);
      setPost(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
      toast.success('Post liked!');
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleLikeComment = async (commentId, e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please login to like comments');
      return;
    }

    try {
      await forumService.likeComment(commentId);
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
      ));
      toast.success('Comment liked!');
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setSubmitting(true);
    try {
      await forumService.addComment(postId, {
        content: newComment,
        authorName: currentUser.displayName || currentUser.email
      });
      setNewComment('');
      toast.success('Comment added!');
      loadPost();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getCategoryBadge = (category) => {
    const colors = {
      general: 'secondary',
      farming_tips: 'success',
      market_trends: 'info',
      success_stories: 'warning',
      questions: 'primary',
      news: 'danger'
    };
    return colors[category] || 'secondary';
  };

  const getCategoryLabel = (category) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">Loading post...</p>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Post not found</h4>
          <p>The post you're looking for doesn't exist or has been removed.</p>
          <Button variant="primary" onClick={() => navigate('/forum')}>
            Back to Forum
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Button 
        variant="link" 
        className="mb-3 p-0"
        onClick={() => navigate('/forum')}
      >
        <i className="bi bi-arrow-left me-2"></i>
        Back to Forum
      </Button>

      {/* Post Card */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1">
              <h2 className="mb-2">{post.title}</h2>
              <div className="d-flex align-items-center gap-2 mb-3">
                <Badge bg={getCategoryBadge(post.category)}>
                  {getCategoryLabel(post.category)}
                </Badge>
                <small className="text-muted">
                  by {post.authorName || 'Anonymous'} • {getTimeAgo(post.createdAt)}
                </small>
              </div>
            </div>
          </div>

          <div className="post-content mb-4" style={{ whiteSpace: 'pre-wrap' }}>
            {post.content}
          </div>

          <div className="d-flex gap-3 align-items-center">
            <Button
              variant={post.userLiked ? 'success' : 'outline-success'}
              size="sm"
              onClick={handleLikePost}
              disabled={!currentUser}
            >
              <i className="bi bi-hand-thumbs-up me-1"></i>
              {post.likes || 0} Likes
            </Button>
            <span className="text-muted">
              <i className="bi bi-chat me-1"></i>
              {post.comments || 0} Comments
            </span>
            <span className="text-muted">
              <i className="bi bi-eye me-1"></i>
              {post.views || 0} Views
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* Comments Section */}
      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-chat-dots me-2"></i>
            Comments ({comments.length})
          </h5>
        </Card.Header>
        <Card.Body>
          {/* Add Comment Form */}
          {currentUser ? (
            <Form onSubmit={handleSubmitComment} className="mb-4">
              <Form.Group>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  disabled={submitting}
                />
              </Form.Group>
              <Button
                type="submit"
                variant="success"
                className="mt-2"
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Posting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Post Comment
                  </>
                )}
              </Button>
            </Form>
          ) : (
            <Alert variant="info" className="mb-4">
              <i className="bi bi-info-circle me-2"></i>
              Please login to comment
            </Alert>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-chat-square-text" style={{ fontSize: '3rem' }}></i>
              <p className="mt-2">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-item border-bottom pb-3 mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>{comment.authorName || 'Anonymous'}</strong>
                      <small className="text-muted ms-2">
                        {getTimeAgo(comment.createdAt)}
                      </small>
                    </div>
                  </div>
                  <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-muted"
                    onClick={(e) => handleLikeComment(comment.id, e)}
                    disabled={!currentUser}
                  >
                    <i className="bi bi-hand-thumbs-up me-1"></i>
                    {comment.likes || 0}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ForumPost;
