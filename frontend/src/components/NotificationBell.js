import React, { useState, useEffect } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { notificationService } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        notificationService.getUserNotifications(10),
        notificationService.getUnreadCount()
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
    <Dropdown align="end" className="notification-dropdown">
      <Dropdown.Toggle variant="link" className="notification-bell-toggle">
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <Badge bg="danger" className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-menu">
        <div className="notification-header">
          <h6 className="mb-0">Notifications</h6>
          {unreadCount > 0 && (
            <button 
              className="btn btn-link btn-sm p-0"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          )}
        </div>
        
        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-bell-slash" style={{fontSize: '2rem'}}></i>
              <p className="mb-0 mt-2">No notifications</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  <i className={`bi bi-${notification.icon || 'bell'}`}></i>
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{getTimeAgo(notification.createdAt)}</div>
                </div>
                {!notification.read && <div className="unread-dot"></div>}
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="notification-footer">
            <button 
              className="btn btn-link btn-sm w-100"
              onClick={() => navigate('/notifications')}
            >
              View all notifications
            </button>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default NotificationBell;
