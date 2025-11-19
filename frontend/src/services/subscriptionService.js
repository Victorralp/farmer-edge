// Subscription Orders Service (Buyers Only)
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
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

export const subscriptionService = {
  // Create subscription
  create: async (subscriptionData) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const subscription = {
      ...subscriptionData,
      buyerId: user.uid,
      status: 'active',
      nextDeliveryDate: calculateNextDelivery(subscriptionData.frequency, subscriptionData.startDate),
      createdAt: serverTimestamp(),
      totalDeliveries: 0,
      pausedUntil: null
    };
    
    const docRef = await addDoc(collection(db, 'subscriptions'), subscription);
    return { id: docRef.id, ...subscription };
  },
  
  // Get buyer's subscriptions
  getBuyerSubscriptions: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const q = query(
      collection(db, 'subscriptions'),
      where('buyerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Get farmer's subscriptions
  getFarmerSubscriptions: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const q = query(
      collection(db, 'subscriptions'),
      where('farmerId', '==', user.uid),
      where('status', '==', 'active'),
      orderBy('nextDeliveryDate', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Update subscription
  update: async (subscriptionId, data) => {
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  },
  
  // Pause subscription
  pause: async (subscriptionId, pauseUntil) => {
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      status: 'paused',
      pausedUntil: pauseUntil,
      updatedAt: serverTimestamp()
    });
  },
  
  // Resume subscription
  resume: async (subscriptionId) => {
    const subscription = await getDoc(doc(db, 'subscriptions', subscriptionId));
    const data = subscription.data();
    
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      status: 'active',
      pausedUntil: null,
      nextDeliveryDate: calculateNextDelivery(data.frequency, new Date()),
      updatedAt: serverTimestamp()
    });
  },
  
  // Cancel subscription
  cancel: async (subscriptionId) => {
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      status: 'cancelled',
      cancelledAt: serverTimestamp()
    });
  },
  
  // Process delivery (called by system/farmer)
  processDelivery: async (subscriptionId) => {
    const subscription = await getDoc(doc(db, 'subscriptions', subscriptionId));
    const data = subscription.data();
    
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      totalDeliveries: (data.totalDeliveries || 0) + 1,
      lastDeliveryDate: serverTimestamp(),
      nextDeliveryDate: calculateNextDelivery(data.frequency, new Date()),
      updatedAt: serverTimestamp()
    });
  },
  
  // Get subscription details
  getSubscription: async (subscriptionId) => {
    const subscriptionDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));
    
    if (!subscriptionDoc.exists()) {
      throw new Error('Subscription not found');
    }
    
    return { id: subscriptionDoc.id, ...subscriptionDoc.data() };
  }
};

// Helper function to calculate next delivery date
function calculateNextDelivery(frequency, fromDate) {
  const date = new Date(fromDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      date.setDate(date.getDate() + 7); // Default to weekly
  }
  
  return date;
}
