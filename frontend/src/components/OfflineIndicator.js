import React from 'react';
import { Alert } from 'react-bootstrap';

function OfflineIndicator() {
  return (
    <Alert variant="warning" className="mb-0 text-center" style={{ borderRadius: 0 }}>
      <i className="bi bi-wifi-off me-2"></i>
      You are currently offline. Some features may be limited. Changes will sync when you're back online.
    </Alert>
  );
}

export default OfflineIndicator;
