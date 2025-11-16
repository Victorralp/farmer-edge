const express = require('express');
const router = express.Router();
const { getFirestore } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

// Send message between buyer and farmer
router.post('/', verifyToken, async (req, res) => {
  try {
    const { recipientId, orderId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ error: 'Missing required fields: recipientId, content' });
    }

    const db = getFirestore();

    // Get sender and recipient details
    const senderDoc = await db.collection('users').doc(req.user.uid).get();
    const recipientDoc = await db.collection('users').doc(recipientId).get();

    if (!recipientDoc.exists) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const sender = senderDoc.data();
    const recipient = recipientDoc.data();

    // Create conversation ID (consistent ordering for grouping)
    const participants = [req.user.uid, recipientId].sort();
    const conversationId = participants.join('_');

    const message = {
      conversationId,
      senderId: req.user.uid,
      senderName: sender.name,
      recipientId,
      recipientName: recipient.name,
      orderId: orderId || null,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const messageRef = await db.collection('messages').add(message);

    // Update or create conversation document
    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      await conversationRef.set({
        participants,
        participantDetails: {
          [req.user.uid]: { name: sender.name, role: sender.role },
          [recipientId]: { name: recipient.name, role: recipient.role },
        },
        lastMessage: content,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    } else {
      await conversationRef.update({
        lastMessage: content,
        lastMessageAt: new Date().toISOString(),
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: {
        id: messageRef.id,
        ...message,
      },
    });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get user's conversations
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('conversations')
      .where('participants', 'array-contains', req.user.uid)
      .orderBy('lastMessageAt', 'desc')
      .get();

    const conversations = [];
    snapshot.forEach(doc => {
      conversations.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ conversations });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages in a conversation
router.get('/conversation/:conversationId', verifyToken, async (req, res) => {
  try {
    const db = getFirestore();
    
    // Verify user is part of this conversation
    const conversationDoc = await db.collection('conversations').doc(req.params.conversationId).get();
    if (!conversationDoc.exists) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = conversationDoc.data();
    if (!conversation.participants.includes(req.user.uid)) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    // Get messages
    const snapshot = await db
      .collection('messages')
      .where('conversationId', '==', req.params.conversationId)
      .orderBy('createdAt', 'asc')
      .get();

    const messages = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Mark messages as read
    const batch = db.batch();
    messages.forEach(msg => {
      if (msg.recipientId === req.user.uid && !msg.read) {
        batch.update(db.collection('messages').doc(msg.id), { read: true });
      }
    });
    await batch.commit();

    res.json({ messages });
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get unread message count
router.get('/unread/count', verifyToken, async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('messages')
      .where('recipientId', '==', req.user.uid)
      .where('read', '==', false)
      .get();

    res.json({ unreadCount: snapshot.size });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Delete message (sender only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = getFirestore();
    const messageDoc = await db.collection('messages').doc(req.params.id).get();

    if (!messageDoc.exists) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = messageDoc.data();

    if (message.senderId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await db.collection('messages').doc(req.params.id).delete();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Message deletion error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
