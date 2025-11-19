// Bulk Order Service
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

export const bulkOrderService = {
  // Create bulk order request
  create: async (bulkOrderData) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const bulkOrder = {
      ...bulkOrderData,
      buyerId: user.uid,
      status: 'pending',
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'bulkOrders'), bulkOrder);
    return { id: docRef.id, ...bulkOrder };
  },
  
  // Get buyer's bulk orders
  getBuyerBulkOrders: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const q = query(
      collection(db, 'bulkOrders'),
      where('buyerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Get farmer's bulk orders
  getFarmerBulkOrders: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const q = query(
      collection(db, 'bulkOrders'),
      where('farmerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Update bulk order (farmer responds with quote)
  update: async (bulkOrderId, data) => {
    await updateDoc(doc(db, 'bulkOrders', bulkOrderId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  },
  
  // Accept bulk order quote
  acceptQuote: async (bulkOrderId) => {
    await updateDoc(doc(db, 'bulkOrders', bulkOrderId), {
      status: 'accepted',
      acceptedAt: serverTimestamp()
    });
  },
  
  // Reject bulk order
  reject: async (bulkOrderId, reason) => {
    await updateDoc(doc(db, 'bulkOrders', bulkOrderId), {
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: serverTimestamp()
    });
  },
  
  // Delete bulk order
  delete: async (bulkOrderId) => {
    await deleteDoc(doc(db, 'bulkOrders', bulkOrderId));
  }
};
