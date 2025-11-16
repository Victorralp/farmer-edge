const express = require('express');
const router = express.Router();
const { getFirestore, getAuth } = require('../config/firebase');
const { verifyToken, requireRole } = require('../middleware/auth');

// Get platform statistics
router.get('/stats', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getFirestore();

    // Count users by role
    const usersSnapshot = await db.collection('users').get();
    const users = { total: 0, farmers: 0, buyers: 0, admins: 0 };
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      users.total++;
      if (user.role === 'farmer') users.farmers++;
      else if (user.role === 'buyer') users.buyers++;
      else if (user.role === 'admin') users.admins++;
    });

    // Count listings by status
    const listingsSnapshot = await db.collection('listings').get();
    const listings = { total: 0, active: 0, inactive: 0 };
    listingsSnapshot.forEach(doc => {
      const listing = doc.data();
      listings.total++;
      if (listing.status === 'active') listings.active++;
      else listings.inactive++;
    });

    // Count orders by status
    const ordersSnapshot = await db.collection('orders').get();
    const orders = {
      total: 0,
      pending: 0,
      accepted: 0,
      declined: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
    };
    let totalRevenue = 0;
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      orders.total++;
      if (order.status) orders[order.status]++;
      if (order.status === 'completed') totalRevenue += order.totalPrice;
    });

    // Count messages
    const messagesSnapshot = await db.collection('messages').get();
    const messages = { total: messagesSnapshot.size };

    res.json({
      users,
      listings,
      orders,
      messages,
      revenue: {
        total: totalRevenue,
        currency: 'NGN',
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all users
router.get('/users', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getFirestore();
    let query = db.collection('users');

    // Filter by role
    if (req.query.role) {
      query = query.where('role', '==', req.query.role);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(100).get();
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ users, total: users.length });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user status (activate/deactivate)
router.put('/users/:uid/status', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'active must be a boolean' });
    }

    const db = getFirestore();
    await db.collection('users').doc(req.params.uid).update({
      active,
      updatedAt: new Date().toISOString(),
    });

    // Disable/enable Firebase Authentication
    await getAuth().updateUser(req.params.uid, { disabled: !active });

    res.json({ 
      message: `User ${active ? 'activated' : 'deactivated'} successfully`,
      active,
    });
  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update user role
router.put('/users/:uid/role', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['farmer', 'buyer', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role', validRoles });
    }

    const db = getFirestore();
    await db.collection('users').doc(req.params.uid).update({
      role,
      updatedAt: new Date().toISOString(),
    });

    // Update custom claims
    await getAuth().setCustomUserClaims(req.params.uid, { role });

    res.json({ 
      message: 'User role updated successfully',
      role,
    });
  } catch (error) {
    console.error('User role update error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/users/:uid', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getFirestore();
    
    // Delete user document
    await db.collection('users').doc(req.params.uid).delete();
    
    // Delete from Firebase Auth
    await getAuth().deleteUser(req.params.uid);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all listings (with moderation)
router.get('/listings', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('listings').orderBy('createdAt', 'desc').limit(100).get();
    
    const listings = [];
    snapshot.forEach(doc => {
      listings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ listings, total: listings.length });
  } catch (error) {
    console.error('Admin listings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Moderate listing (approve/reject)
router.put('/listings/:id/moderate', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ['active', 'inactive', 'suspended'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }

    const db = getFirestore();
    await db.collection('listings').doc(req.params.id).update({
      status,
      moderationReason: reason || null,
      moderatedBy: req.user.uid,
      moderatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ 
      message: 'Listing moderated successfully',
      status,
    });
  } catch (error) {
    console.error('Listing moderation error:', error);
    res.status(500).json({ error: 'Failed to moderate listing' });
  }
});

// Get all orders
router.get('/orders', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getFirestore();
    let query = db.collection('orders');

    if (req.query.status) {
      query = query.where('status', '==', req.query.status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(100).get();
    
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ orders, total: orders.length });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;
