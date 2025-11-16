const express = require('express');
const router = express.Router();
const { getFirestore } = require('../config/firebase');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all listings with optional filters (public endpoint for marketplace browsing)
router.get('/', async (req, res) => {
  try {
    const db = getFirestore();
    let query = db.collection('listings').where('status', '==', 'active');

    // Filter by produce type
    if (req.query.type) {
      query = query.where('type', '==', req.query.type);
    }

    // Filter by location (state or LGA)
    if (req.query.location) {
      query = query.where('location.state', '==', req.query.location);
    }

    // Get documents
    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
    
    const listings = [];
    snapshot.forEach(doc => {
      listings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Filter by price range (client-side since Firestore has query limitations)
    let filteredListings = listings;
    if (req.query.minPrice || req.query.maxPrice) {
      const minPrice = parseFloat(req.query.minPrice) || 0;
      const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
      filteredListings = listings.filter(
        listing => listing.price >= minPrice && listing.price <= maxPrice
      );
    }

    // Search by title or description
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredListings = filteredListings.filter(
        listing =>
          listing.title.toLowerCase().includes(searchTerm) ||
          (listing.description && listing.description.toLowerCase().includes(searchTerm))
      );
    }

    res.json({
      listings: filteredListings,
      total: filteredListings.length,
    });
  } catch (error) {
    console.error('Listings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get single listing by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const listingDoc = await db.collection('listings').doc(req.params.id).get();

    if (!listingDoc.exists) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Get farmer details
    const listing = listingDoc.data();
    const farmerDoc = await db.collection('users').doc(listing.farmerId).get();
    
    res.json({
      id: listingDoc.id,
      ...listing,
      farmer: farmerDoc.exists ? {
        name: farmerDoc.data().name,
        location: farmerDoc.data().location,
        phone: farmerDoc.data().phone,
      } : null,
    });
  } catch (error) {
    console.error('Listing fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Create new listing (farmers only)
router.post('/', verifyToken, requireRole(['farmer', 'admin']), upload.single('image'), async (req, res) => {
  try {
    const { title, description, type, price, quantity, unit, location } = req.body;

    // Validate required fields
    if (!title || !price || !quantity || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, price, quantity, location' 
      });
    }

    let imageData = null;
    
    // Upload image to Cloudinary if provided
    if (req.file) {
      imageData = await uploadToCloudinary(req.file, 'produce');
    }

    const db = getFirestore();
    const listing = {
      farmerId: req.user.uid,
      title,
      description: description || '',
      type: type || 'other',
      price: parseFloat(price),
      quantity: parseFloat(quantity),
      unit: unit || 'kg',
      location: typeof location === 'string' ? JSON.parse(location) : location,
      image: imageData,
      status: 'active',
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('listings').add(listing);

    res.status(201).json({
      message: 'Listing created successfully',
      listing: {
        id: docRef.id,
        ...listing,
      },
    });
  } catch (error) {
    console.error('Listing creation error:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Update listing (owner or admin only)
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const db = getFirestore();
    const listingDoc = await db.collection('listings').doc(req.params.id).get();

    if (!listingDoc.exists) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = listingDoc.data();

    // Check ownership or admin role
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userRole = userDoc.data().role;
    
    if (listing.farmerId !== req.user.uid && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const { title, description, type, price, quantity, unit, location, status } = req.body;

    const updates = {
      updatedAt: new Date().toISOString(),
    };

    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (type) updates.type = type;
    if (price) updates.price = parseFloat(price);
    if (quantity) updates.quantity = parseFloat(quantity);
    if (unit) updates.unit = unit;
    if (location) updates.location = typeof location === 'string' ? JSON.parse(location) : location;
    if (status) updates.status = status;

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary
      if (listing.image && listing.image.publicId) {
        await deleteFromCloudinary(listing.image.publicId);
      }
      updates.image = await uploadToCloudinary(req.file, 'produce');
    }

    await db.collection('listings').doc(req.params.id).update(updates);

    res.json({
      message: 'Listing updated successfully',
      updates,
    });
  } catch (error) {
    console.error('Listing update error:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// Delete listing (owner or admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = getFirestore();
    const listingDoc = await db.collection('listings').doc(req.params.id).get();

    if (!listingDoc.exists) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = listingDoc.data();

    // Check ownership or admin role
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userRole = userDoc.data().role;
    
    if (listing.farmerId !== req.user.uid && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    // Delete image from Cloudinary
    if (listing.image && listing.image.publicId) {
      await deleteFromCloudinary(listing.image.publicId);
    }

    await db.collection('listings').doc(req.params.id).delete();

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Listing deletion error:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// Get farmer's own listings
router.get('/my/listings', verifyToken, requireRole(['farmer', 'admin']), async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('listings')
      .where('farmerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const listings = [];
    snapshot.forEach(doc => {
      listings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({ listings });
  } catch (error) {
    console.error('My listings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

// Increment view count
router.post('/:id/view', async (req, res) => {
  try {
    const db = getFirestore();
    const listingRef = db.collection('listings').doc(req.params.id);
    
    await listingRef.update({
      views: require('firebase-admin').firestore.FieldValue.increment(1),
    });

    res.json({ message: 'View counted' });
  } catch (error) {
    console.error('View count error:', error);
    res.status(500).json({ error: 'Failed to update view count' });
  }
});

module.exports = router;
