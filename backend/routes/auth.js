const express = require('express');
const router = express.Router();
const { getFirestore, getAuth } = require('../config/firebase');
const { sendVerificationEmail } = require('../config/brevo');
const { verifyToken } = require('../middleware/auth');

// Create user profile after Firebase Authentication signup
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { name, phone, role, location } = req.body;
    const { uid, email } = req.user;

    // Validate role
    const validRoles = ['farmer', 'buyer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be farmer, buyer, or admin.' });
    }

    const db = getFirestore();
    const userProfile = {
      uid,
      email,
      name,
      phone,
      role,
      location: location || {},
      createdAt: new Date().toISOString(),
      verified: false,
      active: true,
    };

    await db.collection('users').doc(uid).set(userProfile);

    // Set custom claims for role-based access
    await getAuth().setCustomUserClaims(uid, { role });

    // Send verification email via Brevo
    try {
      const verificationLink = `${process.env.FRONTEND_URL}/verify?uid=${uid}`;
      await sendVerificationEmail(email, name, verificationLink);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    res.status(201).json({
      message: 'User profile created successfully',
      user: userProfile,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user profile' });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json(userDoc.data());
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, location, bio } = req.body;
    const db = getFirestore();

    const updates = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (location) updates.location = location;
    if (bio !== undefined) updates.bio = bio;

    await db.collection('users').doc(req.user.uid).update(updates);

    res.json({ message: 'Profile updated successfully', updates });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Verify email (mark user as verified)
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const db = getFirestore();
    await db.collection('users').doc(req.user.uid).update({
      verified: true,
      verifiedAt: new Date().toISOString(),
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

module.exports = router;
