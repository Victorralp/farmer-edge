import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal } from 'react-bootstrap';
import { forumService, ForumCategories } from '../services/forumService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

function CommunityForum() {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const postsData = await forumService.getPosts(selectedCategory);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser) {
      toast.error('Please login to create a post');
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await forumService.createPost(newPost);
      toast.success('Post created successfully');
      setShowCreateModal(false);
      setNewPost({ title: '', content: '', category: 'general' });
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
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

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Container fluid className="py-4">
      <Row>
        {/* Sidebar */}
        <Col md={3}>
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <h5 className="mb-3">
                <i className="bi bi-people-fill me-2"></i>
                Community
              </h5>
              <Button 
                variant="success" 
                className="w-100 mb-3"
                onClick={() => setShowCreateModal(true)}
                disabled={!currentUser}
              >
                <i className="bi bi-plus-circle me-2"></i>
                New Post
              </Button>
              
              <h6 className="mb-2">Categories</h6>
              <div className="d-grid gap-2">
                <Button
                  variant={selectedCategory === null ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Posts
                </Button>
                {Object.values(ForumCategories).map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {getCategoryLabel(category)}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="mb-3">Forum Guidelines</h6>
              <ul className="small text-muted mb-0">
                <li>Be respectful and courteous</li>
                <li>Share helpful farming tips</li>
                <li>No spam or self-promotion</li>
                <li>Stay on topic</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col md={9}>
          <h1 className="mb-4">
            <i className="bi bi-chat-square-text me-2"></i>
            Community Forum
          </h1>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
            </div>
          ) : posts.length === 0 ? (
            <Card className="shadow-sm">
              <Card.Body className="text-center py-5">
                <i className="bi bi-chat-square-text" style={{fontSize: '4rem', color: '#ddd'}}></i>
                <h4 className="mt-3">No posts yet</h4>
                <p className="text-muted">Be the first to start a discussion!</p>
                <Button variant="success" onClick={() => setShowCreateModal(true)}>
                  Create First Post
                </Button>
              </Card.Body>
            </Card>
          ) : (
            posts.map(post => (
              <Card key={post.id} className="shadow-sm mb-3 post-card" style={{cursor: 'pointer'}}>
                <Card.Body onClick={() => navigate(`/forum/${post.id}`)}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1">
                      <h5 className="mb-1">{post.title}</h5>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <Badge bg={getCategoryBadge(post.category)}>
                          {getCategoryLabel(post.category)}
                        </Badge>
                        <small className="text-muted">
                          by {post.authorName || 'Anonymous'} • {getTimeAgo(post.createdAt)}
                        </small>
                      </div>
                      <p className="mb-2 text-muted">
                        {post.content?.substring(0, 200)}
                        {post.content?.length > 200 && '...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="d-flex gap-3 text-muted small">
                    <span>
                      <i className="bi bi-hand-thumbs-up me-1"></i>
                      {post.likes || 0}
                    </span>
                    <span>
                      <i className="bi bi-chat me-1"></i>
                      {post.comments || 0}
                    </span>
                    <span>
                      <i className="bi bi-eye me-1"></i>
                      {post.views || 0}
                    </span>
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </Col>
      </Row>

      {/* Create Post Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={newPost.category}
                onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
              >
                {Object.values(ForumCategories).map(category => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title..."
              />
            </Form.Group>
            
            <Form.Group>
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your thoughts, tips, or questions..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleCreatePost}>
            <i className="bi bi-send me-2"></i>
            Post
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CommunityForum;
