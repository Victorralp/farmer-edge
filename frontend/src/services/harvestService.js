// Harvest Calendar Service (Farmers Only)
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where, 
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { createNotification } from './notificationService';

const db = getFirestore();

export const harvestService = {
  // Create harvest schedule
  create: async (harvestData) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const harvest = {
      ...harvestData,
      farmerId: user.uid,
      status: 'scheduled',
      createdAt: serverTimestamp(),
      notificationsSent: false
    };
    
    const docRef = await addDoc(collection(db, 'harvests'), harvest);
    return { id: docRef.id, ...harvest };
  },
  
  // Get farmer's harvests
  getFarmerHarvests: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const q = query(
      collection(db, 'harvests'),
      where('farmerId', '==', user.uid),
      orderBy('harvestDate', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Get upcoming harvests (public - for buyers)
  getUpcomingHarvests: async (daysAhead = 30) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const q = query(
      collection(db, 'harvests'),
      where('harvestDate', '>=', Timestamp.fromDate(now)),
      where('harvestDate', '<=', Timestamp.fromDate(futureDate)),
      where('status', '==', 'scheduled'),
      orderBy('harvestDate', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Update harvest
  update: async (harvestId, data) => {
    await updateDoc(doc(db, 'harvests', harvestId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  },
  
  // Delete harvest
  delete: async (harvestId) => {
    await deleteDoc(doc(db, 'harvests', harvestId));
  },
  
  // Mark as harvested
  markAsHarvested: async (harvestId) => {
    await updateDoc(doc(db, 'harvests', harvestId), {
      status: 'harvested',
      actualHarvestDate: serverTimestamp()
    });
  },
  
  // Notify subscribers about upcoming harvest
  notifySubscribers: async (harvestId) => {
    const harvestDoc = await getDoc(doc(db, 'harvests', harvestId));
    const harvest = harvestDoc.data();
    
    if (!harvest) return;
    
    // Get subscribers (users who wishlisted this product)
    const wishlistQuery = query(
      collection(db, 'wishlists'),
      where('productType', '==', harvest.productType)
    );
    
    const wishlistSnapshot = await getDocs(wishlistQuery);
    const notifications = wishlistSnapshot.docs.map(doc => {
      const wishlist = doc.data();
      return createNotification(wishlist.userId, 'harvest_scheduled', {
        productName: harvest.productName,
        harvestDate: harvest.harvestDate,
        farmerId: harvest.farmerId,
        harvestId: harvestId
      });
    });
    
    await Promise.all(notifications);
    
    // Mark as notified
    await updateDoc(doc(db, 'harvests', harvestId), {
      notificationsSent: true,
      notificationsSentAt: serverTimestamp()
    });
  }
};
