const express = require('express');
const router = express.Router();
const { getFirestore } = require('../config/firebase');
const { sendOrderStatusEmail, sendInterestNotificationEmail } = require('../config/brevo');
const { verifyToken, requireRole } = require('../middleware/auth');

// Create order/express interest (buyers only)
router.post('/', verifyToken, requireRole(['buyer', 'admin']), async (req, res) => {
  try {
    const { listingId, quantity, message, deliveryAddress } = req.body;

    if (!listingId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields: listingId, quantity' });
    }

    const db = getFirestore();
    
    // Get listing details
    const listingDoc = await db.collection('listings').doc(listingId).get();
    if (!listingDoc.exists) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = listingDoc.data();

    // Check if enough quantity is available
    if (quantity > listing.quantity) {
      return res.status(400).json({ 
        error: 'Requested quantity exceeds available quantity',
        available: listing.quantity,
        requested: quantity,
      });
    }

    // Get buyer details
    const buyerDoc = await db.collection('users').doc(req.user.uid).get();
    const buyer = buyerDoc.data();

    // Get farmer details
    const farmerDoc = await db.collection('users').doc(listing.farmerId).get();
    const farmer = farmerDoc.data();

    // Create order
    const order = {
      listingId,
      buyerId: req.user.uid,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      farmerId: listing.farmerId,
      farmerName: farmer.name,
      farmerEmail: farmer.email,
      produceName: listing.title,
      quantity: parseFloat(quantity),
      unit: listing.unit,
      pricePerUnit: listing.price,
      totalPrice: listing.price * quantity,
      message: message || '',
      deliveryAddress: deliveryAddress || buyer.location,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orderRef = await db.collection('orders').add(order);

    // Send notification to farmer via Brevo
    try {
      await sendInterestNotificationEmail(farmer.email, farmer.name, {
        produceName: listing.title,
        buyerName: buyer.name,
        quantity: `${quantity} ${listing.unit}`,
        message,
      });
    } catch (emailError) {
      console.error('Failed to send farmer notification:', emailError);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: orderRef.id,
        ...order,
      },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get buyer's orders
router.get('/buyer', verifyToken, requireRole(['buyer', 'admin']), async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('orders')
      .where('buyerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = [];
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ orders });
  } catch (error) {
    console.error('Buyer orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch your orders' });
  }
});

// Get farmer's orders
router.get('/farmer', verifyToken, requireRole(['farmer', 'admin']), async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('orders')
      .where('farmerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = [];
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ orders });
  } catch (error) {
    console.error('Farmer orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const db = getFirestore();
    const orderDoc = await db.collection('orders').doc(req.params.id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderDoc.data();

    // Check if user is involved in this order
    if (order.buyerId !== req.user.uid && order.farmerId !== req.user.uid) {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      if (userDoc.data().role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this order' });
      }
    }

    res.json({
      id: orderDoc.id,
      ...order,
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (farmers can accept/decline/ship, buyers can complete)
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'declined', 'shipped', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }

    const db = getFirestore();
    const orderDoc = await db.collection('orders').doc(req.params.id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderDoc.data();

    // Authorization checks
    if (status === 'accepted' || status === 'declined' || status === 'shipped') {
      if (order.farmerId !== req.user.uid) {
        return res.status(403).json({ error: 'Only the farmer can update to this status' });
      }
    } else if (status === 'completed') {
      if (order.buyerId !== req.user.uid) {
        return res.status(403).json({ error: 'Only the buyer can mark as completed' });
      }
    }

    // Update order status
    await db.collection('orders').doc(req.params.id).update({
      status,
      updatedAt: new Date().toISOString(),
      [`${status}At`]: new Date().toISOString(),
    });

    // Update listing quantity if order is accepted
    if (status === 'accepted') {
      const listingRef = db.collection('listings').doc(order.listingId);
      await listingRef.update({
        quantity: require('firebase-admin').firestore.FieldValue.increment(-order.quantity),
      });
    }

    // Restore listing quantity if order is declined or cancelled
    if ((status === 'declined' || status === 'cancelled') && order.status === 'accepted') {
      const listingRef = db.collection('listings').doc(order.listingId);
      await listingRef.update({
        quantity: require('firebase-admin').firestore.FieldValue.increment(order.quantity),
      });
    }

    // Send notification to buyer
    try {
      await sendOrderStatusEmail(order.buyerEmail, order.buyerName, {
        orderId: req.params.id,
        status,
        produceName: order.produceName,
        farmerName: order.farmerName,
      });
    } catch (emailError) {
      console.error('Failed to send status notification:', emailError);
    }

    res.json({ 
      message: 'Order status updated successfully',
      status,
    });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order (buyer can cancel pending orders)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = getFirestore();
    const orderDoc = await db.collection('orders').doc(req.params.id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderDoc.data();

    // Only buyer can cancel their own pending orders
    if (order.buyerId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to cancel this order' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Can only cancel pending orders',
        currentStatus: order.status,
      });
    }

    await db.collection('orders').doc(req.params.id).update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;
