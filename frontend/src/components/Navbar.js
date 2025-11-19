import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Badge, NavDropdown, Button } from 'react-bootstrap';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { messagesAPI, authAPI } from '../services/api';
import { toast } from 'react-toastify';
import NotificationBell from './NotificationBell';
import './Navbar.css';

function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize admin check to prevent unnecessary re-renders
  const checkAdminStatus = useCallback(async () => {
    try {
      const profileRes = await authAPI.getProfile();
      setIsAdmin(profileRes.data.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  }, []);

  // Memoize unread count fetch
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await messagesAPI.getUnreadCount();
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      checkAdminStatus();
      
      // Poll for unread messages every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      // Listen for FCM messages
      const handler = (e) => {
        const payload = e.detail;
        if (payload?.data?.type === 'message') {
          setUnreadCount((c) => c + 1);
        }
      };
      window.addEventListener('fcm-message', handler);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('fcm-message', handler);
      };
    } else {
      setUnreadCount(0);
      setIsAdmin(false);
    }
  }, [user, fetchUnreadCount, checkAdminStatus]);

  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error logging out');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check if current route is active
  const isActive = (path) => location.pathname === path;

  // Memoize navigation items to prevent re-renders
  const publicNavItems = useMemo(() => (
    <>
      <Nav.Link 
        as={Link} 
        to="/marketplace"
        active={isActive('/marketplace')}
        className="d-flex align-items-center"
      >
        <i className="bi bi-shop me-1"></i>
        <span className="d-none d-lg-inline">Marketplace</span>
      </Nav.Link>
      
      <Nav.Link 
        as={Link} 
        to="/forum"
        active={isActive('/forum')}
        className="d-flex align-items-center"
      >
        <i className="bi bi-people me-1"></i>
        <span className="d-none d-lg-inline">Community</span>
      </Nav.Link>
    </>
  ), [isActive]);

  const authenticatedNavItems = useMemo(() => {
    if (!user) return null;
    
    return (
      <>
        <Nav.Link 
          as={Link} 
          to="/dashboard"
          active={isActive('/dashboard')}
          className="d-flex align-items-center"
        >
          <i className="bi bi-speedometer2 me-1"></i>
          <span className="d-none d-lg-inline">Dashboard</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/messages"
          active={isActive('/messages')}
          className="d-flex align-items-center position-relative"
        >
          <i className="bi bi-chat-dots me-1"></i>
          <span className="d-none d-lg-inline">Messages</span>
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              pill 
              className="ms-1 position-absolute top-0 start-100 translate-middle"
              style={{ fontSize: '0.65rem' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/rewards"
          active={isActive('/rewards')}
          className="d-flex align-items-center"
        >
          <i className="bi bi-gift me-1"></i>
          <span className="d-none d-lg-inline">Rewards</span>
        </Nav.Link>
        
        {isAdmin && (
          <NavDropdown 
            title={
              <span className="d-flex align-items-center">
                <i className="bi bi-shield-check me-1"></i>
                <span className="d-none d-lg-inline">Admin</span>
              </span>
            } 
            id="admin-dropdown"
            className="d-flex align-items-center"
          >
            <NavDropdown.Item as={Link} to="/admin">
              <i className="bi bi-speedometer me-2"></i>
              Admin Panel
            </NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/analytics">
              <i className="bi bi-graph-up me-2"></i>
              Analytics
            </NavDropdown.Item>
          </NavDropdown>
        )}
        
        <NotificationBell />
        
        <NavDropdown 
          title={
            <span className="d-flex align-items-center">
              <i className="bi bi-person-circle me-1"></i>
              <span className="d-none d-lg-inline">Account</span>
            </span>
          }
          id="account-dropdown"
          align="end"
          className="d-flex align-items-center"
        >
          <NavDropdown.Item as={Link} to="/profile">
            <i className="bi bi-person me-2"></i>
            My Profile
          </NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={handleLogout} disabled={isLoading}>
            <i className="bi bi-box-arrow-right me-2"></i>
            {isLoading ? 'Logging out...' : 'Logout'}
          </NavDropdown.Item>
        </NavDropdown>
      </>
    );
  }, [user, unreadCount, isAdmin, isLoading, isActive, handleLogout]);

  const guestNavItems = useMemo(() => {
    if (user) return null;
    
    return (
      <>
        <Nav.Link as={Link} to="/login" className="d-flex align-items-center">
          <i className="bi bi-box-arrow-in-right me-1"></i>
          Login
        </Nav.Link>
        <Button 
          as={Link} 
          to="/register" 
          variant="light" 
          size="sm"
          className="ms-2"
        >
          <i className="bi bi-person-plus me-1"></i>
          Sign Up
        </Button>
      </>
    );
  }, [user]);

  return (
    <BSNavbar 
      bg="success" 
      variant="dark" 
      expand="lg" 
      sticky="top"
      className="shadow-sm"
    >
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="fw-bold">
          <i className="bi bi-basket2-fill me-2"></i>
          <span className="d-none d-sm-inline">Nigeria Farmers Market</span>
          <span className="d-inline d-sm-none">NFM</span>
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-lg-center">
            {publicNavItems}
            {authenticatedNavItems}
            {guestNavItems}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

export default React.memo(Navbar);
