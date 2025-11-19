// Inventory Management Service
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
import { createNotification, NotificationTypes } from './notificationService';

const db = getFirestore();

export const inventoryService = {
  // Add inventory item
  add: async (itemData) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const item = {
      ...itemData,
      farmerId: user.uid,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'inventory'), item);
    return { id: docRef.id, ...item };
  },
  
  // Get farmer's inventory
  getInventory: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const q = query(
      collection(db, 'inventory'),
      where('farmerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Update inventory item
  update: async (itemId, data) => {
    await updateDoc(doc(db, 'inventory', itemId), {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    // Check for low stock alert
    if (data.quantity !== undefined) {
      const itemDoc = await getDoc(doc(db, 'inventory', itemId));
      const item = itemDoc.data();
      
      if (item.lowStockThreshold && data.quantity <= item.lowStockThreshold) {
        await createNotification(item.farmerId, NotificationTypes.LOW_STOCK, {
          productName: item.name,
          currentStock: data.quantity,
          threshold: item.lowStockThreshold
        });
      }
    }
  },
  
  // Delete inventory item
  delete: async (itemId) => {
    await deleteDoc(doc(db, 'inventory', itemId));
  },
  
  // Get low stock items
  getLowStockItems: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const inventory = await inventoryService.getInventory();
    return inventory.filter(item => 
      item.lowStockThreshold && item.quantity <= item.lowStockThreshold
    );
  },
  
  // Update stock after order
  updateStockAfterOrder: async (listingId, quantity) => {
    const q = query(
      collection(db, 'inventory'),
      where('listingId', '==', listingId)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const itemDoc = snapshot.docs[0];
      const currentQuantity = itemDoc.data().quantity || 0;
      await inventoryService.update(itemDoc.id, {
        quantity: Math.max(0, currentQuantity - quantity)
      });
    }
  }
};
