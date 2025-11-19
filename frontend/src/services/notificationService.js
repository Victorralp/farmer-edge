// Notification Service
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  query, 
  where, 
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

export const notificationService = {
  // Create notification
  create: async (userId, notificationData) => {
    const notification = {
      userId,
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notification);
    return { id: docRef.id, ...notification };
  },
  
  // Get user notifications
  getUserNotifications: async (limitCount = 50) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Get unread count
  getUnreadCount: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return 0;
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  },
  
  // Mark as read
  markAsRead: async (notificationId) => {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    });
  },
  
  // Mark all as read
  markAllAsRead: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true, readAt: serverTimestamp() })
    );
    
    await Promise.all(updates);
  },
  
  // Delete notification
  delete: async (notificationId) => {
    await deleteDoc(doc(db, 'notifications', notificationId));
  },
  
  // Delete all notifications
  deleteAll: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );
    
    const snapshot = await getDocs(q);
    const deletes = snapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletes);
  }
};

// Notification types and helpers
export const NotificationTypes = {
  ORDER_PLACED: 'order_placed',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  NEW_MESSAGE: 'new_message',
  NEW_REVIEW: 'new_review',
  LISTING_APPROVED: 'listing_approved',
  LISTING_REJECTED: 'listing_rejected',
  PAYMENT_RECEIVED: 'payment_received',
  LOW_STOCK: 'low_stock',
  BULK_ORDER_REQUEST: 'bulk_order_request'
};

export const createNotification = async (userId, type, data) => {
  const templates = {
    order_placed: {
      title: 'New Order Received',
      message: `You have a new order for ${data.productName}`,
      icon: 'bag-check',
      link: `/orders/${data.orderId}`
    },
    order_accepted: {
      title: 'Order Accepted',
      message: `Your order for ${data.productName} has been accepted`,
      icon: 'check-circle',
      link: `/orders/${data.orderId}`
    },
    new_message: {
      title: 'New Message',
      message: `${data.senderName} sent you a message`,
      icon: 'chat',
      link: `/messages/${data.conversationId}`
    },
    new_review: {
      title: 'New Review',
      message: `${data.reviewerName} left you a ${data.rating}-star review`,
      icon: 'star',
      link: `/profile`
    }
  };
  
  const template = templates[type] || {
    title: 'Notification',
    message: data.message,
    icon: 'bell'
  };
  
  return notificationService.create(userId, {
    type,
    ...template,
    data
  });
};
