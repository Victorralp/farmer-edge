import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { auth } from '../config/firebase';

const db = getFirestore();

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'demo';
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

// Helper to get current user
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user;
};

// Upload image to Cloudinary
const uploadToCloudinary = async (file) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'farmers-market');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      thumbnail: data.secure_url.replace('/upload/', '/upload/w_200,h_200,c_fill/'),
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {

    throw new Error('Failed to upload image');
  }
};

// Delete image from Cloudinary (optional - requires backend or signed requests)
const deleteFromCloudinary = async (publicId) => {
  // Note: Deletion requires authentication
  // For now, we'll just remove the reference from Firestore
  // Images can be managed from Cloudinary dashboard
  
};

// Auth Service
export const authService = {
  async createProfile(data) {
    const user = getCurrentUser();
    const userRef = doc(db, 'users', user.uid);
    
    const profile = {
      uid: user.uid,
      email: user.email,
      name: data.name,
      phone: data.phone,
      role: data.role,
      location: data.location || {},
      createdAt: serverTimestamp(),
      verified: false,
      active: true
    };
    
    await setDoc(userRef, profile);
    return profile;
  },

  async getProfile() {
    const user = getCurrentUser();
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create a basic profile if it doesn't exist
      const basicProfile = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        phone: user.phoneNumber || '',
        role: 'buyer', // Default role
        location: { state: '', lga: '' },
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        verified: user.emailVerified,
        active: true
      };
      
      await setDoc(userRef, basicProfile);
      return basicProfile;
    }
    
    return userDoc.data();
  },

  async updateProfile(data) {
    const user = getCurrentUser();
    const userRef = doc(db, 'users', user.uid);
    
    const updates = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(userRef, updates);
    return updates;
  }
};

// Listings Service
export const listingsService = {
  async getAll(filters = {}) {
    let q = query(
      collection(db, 'listings'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    // Apply filters
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters.location) {
      q = query(q, where('location.state', '==', filters.location));
    }

    const snapshot = await getDocs(q);
    const listings = [];
    
    snapshot.forEach(doc => {
      listings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return listings;
  },

  async getOne(id) {
    const listingRef = doc(db, 'listings', id);
    const listingDoc = await getDoc(listingRef);
    
    if (!listingDoc.exists()) {
      throw new Error('Listing not found');
    }

    const listing = listingDoc.data();
    
    // Get farmer details
    const farmerRef = doc(db, 'users', listing.farmerId);
    const farmerDoc = await getDoc(farmerRef);
    
    return {
      id: listingDoc.id,
      ...listing,
      farmer: farmerDoc.exists() ? {
        name: farmerDoc.data().name,
        location: farmerDoc.data().location,
        phone: farmerDoc.data().phone
      } : null
    };
  },

  async create(data) {
    const user = getCurrentUser();
    
    // Upload image to Cloudinary if provided
    let imageData = null;
    if (data.image) {
      imageData = await uploadToCloudinary(data.image);
    }

    const listing = {
      farmerId: user.uid,
      title: data.title,
      description: data.description || '',
      type: data.type || 'Other',
      price: parseFloat(data.price),
      quantity: parseFloat(data.quantity),
      unit: data.unit || 'kg',
      location: data.location,
      image: imageData,
      status: 'active',
      views: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'listings'), listing);
    
    return {
      id: docRef.id,
      ...listing
    };
  },

  async update(id, data) {
    const user = getCurrentUser();
    const listingRef = doc(db, 'listings', id);
    const listingDoc = await getDoc(listingRef);
    
    if (!listingDoc.exists()) {
      throw new Error('Listing not found');
    }

    const listing = listingDoc.data();
    
    // Check ownership
    if (listing.farmerId !== user.uid) {
      throw new Error('Not authorized');
    }

    const updates = {
      updatedAt: serverTimestamp()
    };

    if (data.title) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.type) updates.type = data.type;
    if (data.price !== undefined) updates.price = parseFloat(data.price);
    if (data.quantity !== undefined) updates.quantity = parseFloat(data.quantity);
    if (data.unit) updates.unit = data.unit;
    if (data.location) updates.location = data.location;
    if (data.status) updates.status = data.status;

    // Handle image update
    if (data.image instanceof File) {
      // Delete old image (optional)
      if (listing.image?.publicId) {
        await deleteFromCloudinary(listing.image.publicId);
      }
      updates.image = await uploadToCloudinary(data.image);
    }

    await updateDoc(listingRef, updates);
    return updates;
  },

  async delete(id) {
    const user = getCurrentUser();
    const listingRef = doc(db, 'listings', id);
    const listingDoc = await getDoc(listingRef);
    
    if (!listingDoc.exists()) {
      throw new Error('Listing not found');
    }

    const listing = listingDoc.data();
    
    // Check ownership
    if (listing.farmerId !== user.uid) {
      throw new Error('Not authorized');
    }

    // Delete image from Cloudinary (optional)
    if (listing.image?.publicId) {
      await deleteFromCloudinary(listing.image.publicId);
    }

    await deleteDoc(listingRef);
  },

  async getMyListings() {
    const user = getCurrentUser();
    
    const q = query(
      collection(db, 'listings'),
      where('farmerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const listings = [];
    
    snapshot.forEach(doc => {
      listings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return listings;
  },

  async incrementView(id) {
    const listingRef = doc(db, 'listings', id);
    await updateDoc(listingRef, {
      views: increment(1)
    });
  }
};

// Orders Service
export const ordersService = {
  async create(data) {
    const user = getCurrentUser();
    
    const order = {
      buyerId: user.uid,
      farmerId: data.farmerId,
      listingId: data.listingId,
      produceName: data.produceName,
      quantity: parseFloat(data.quantity),
      unit: data.unit,
      pricePerUnit: parseFloat(data.pricePerUnit),
      totalPrice: parseFloat(data.totalPrice),
      deliveryAddress: data.deliveryAddress,
      buyerName: data.buyerName,
      farmerName: data.farmerName,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'orders'), order);
    
    return {
      id: docRef.id,
      ...order
    };
  },

  async getBuyerOrders() {
    const user = getCurrentUser();
    
    const q = query(
      collection(db, 'orders'),
      where('buyerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const orders = [];
    
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return orders;
  },

  async getFarmerOrders() {
    const user = getCurrentUser();
    
    const q = query(
      collection(db, 'orders'),
      where('farmerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const orders = [];
    
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return orders;
  },

  async updateStatus(id, status) {
    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });
  },

  async cancel(id) {
    const user = getCurrentUser();
    const orderRef = doc(db, 'orders', id);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const order = orderDoc.data();
    
    // Only buyer can cancel
    if (order.buyerId !== user.uid) {
      throw new Error('Not authorized');
    }

    await updateDoc(orderRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
  }
};

// Messages Service
export const messagesService = {
  async send(data) {
    const user = getCurrentUser();
    const receiverId = data.receiverId || data.recipientId;
    if (!receiverId) {
      throw new Error('No recipient specified');
    }
    const content = (data.content || '').trim().slice(0, 200);
    
    const message = {
      senderId: user.uid,
      receiverId,
      content,
      read: false,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'messages'), message);
    
    return {
      id: docRef.id,
      ...message
    };
  },

  async getConversations() {
    const user = getCurrentUser();
    
    // Get messages where user is sender or receiver
    const sentQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const receivedQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery),
      getDocs(receivedQuery)
    ]);

    // Combine and organize by conversation keyed by other user
    const conversations = new Map();
    
    [...sentSnapshot.docs, ...receivedSnapshot.docs].forEach(docSnap => {
      const msg = docSnap.data();
      const otherId = msg.senderId === user.uid ? msg.receiverId : msg.senderId;
      const createdAt = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
      
      if (!conversations.has(otherId)) {
        conversations.set(otherId, {
          id: otherId,
          participants: [user.uid, otherId],
          lastMessage: msg.content,
          lastMessageAt: createdAt,
          unread: msg.receiverId === user.uid && !msg.read ? 1 : 0
        });
      }
    });

    // Fetch participant details
    const participantIds = Array.from(conversations.keys());
    const userRef = doc(db, 'users', user.uid);
    const currentUserDoc = await getDoc(userRef);
    const currentUser = currentUserDoc.exists() ? currentUserDoc.data() : { uid: user.uid };

    const participantDetailsEntries = await Promise.all(participantIds.map(async (otherId) => {
      const otherRef = doc(db, 'users', otherId);
      const otherDoc = await getDoc(otherRef);
      return [otherId, otherDoc.exists() ? otherDoc.data() : { uid: otherId, name: 'Unknown user' }];
    }));

    const participantDetailsMap = Object.fromEntries([
      [user.uid, currentUser],
      ...participantDetailsEntries
    ]);

    return Array.from(conversations.values()).map(conv => ({
      ...conv,
      participantDetails: {
        [conv.participants[0]]: participantDetailsMap[conv.participants[0]],
        [conv.participants[1]]: participantDetailsMap[conv.participants[1]]
      }
    }));
  },

  async getMessages(otherUserId) {
    const user = getCurrentUser();
    
    const sentToOther = query(
      collection(db, 'messages'),
      where('senderId', '==', user.uid),
      where('receiverId', '==', otherUserId)
    );

    const receivedFromOther = query(
      collection(db, 'messages'),
      where('senderId', '==', otherUserId),
      where('receiverId', '==', user.uid)
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentToOther),
      getDocs(receivedFromOther)
    ]);

    const messages = [
      ...sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    ].sort((a, b) => {
      const toMillis = (ts) => ts?.toDate ? ts.toDate().getTime() : (ts?.seconds ? ts.seconds * 1000 : 0);
      return toMillis(a.createdAt) - toMillis(b.createdAt);
    });

    return messages;
  },

  async getUnreadCount() {
    const user = getCurrentUser();
    
    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.uid),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }
};

// Users Service
export const usersService = {
  async listByRole(role) {
    const q = query(
      collection(db, 'users'),
      where('role', '==', role)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter(user => user.active !== false);
  },

  async listFarmers() {
    return this.listByRole('farmer');
  }
};
