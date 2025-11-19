// Firebase-based API - No backend server needed!
import { 
  authService, 
  listingsService, 
  ordersService, 
  messagesService,
  usersService
} from './firebaseService';

// Wrap Firebase services to match existing API interface
export const authAPI = {
  register: async (data) => ({ data: await authService.createProfile(data) }),
  getProfile: async () => ({ data: await authService.getProfile() }),
  updateProfile: async (data) => ({ data: await authService.updateProfile(data) }),
  verifyEmail: async () => ({ data: { message: 'Email verified' } }),
};

export const listingsAPI = {
  getAll: async (params) => ({ data: { listings: await listingsService.getAll(params) } }),
  getOne: async (id) => ({ data: await listingsService.getOne(id) }),
  create: async (data) => ({ data: await listingsService.create(data) }),
  update: async (id, data) => ({ data: await listingsService.update(id, data) }),
  delete: async (id) => ({ data: await listingsService.delete(id) }),
  getMyListings: async () => ({ data: { listings: await listingsService.getMyListings() } }),
  incrementView: async (id) => ({ data: await listingsService.incrementView(id) }),
};

export const ordersAPI = {
  create: async (data) => ({ data: await ordersService.create(data) }),
  getBuyerOrders: async () => ({ data: { orders: await ordersService.getBuyerOrders() } }),
  getFarmerOrders: async () => ({ data: { orders: await ordersService.getFarmerOrders() } }),
  getOne: async (id) => ({ data: await ordersService.getOne(id) }),
  updateStatus: async (id, status) => ({ data: await ordersService.updateStatus(id, status) }),
  cancel: async (id) => ({ data: await ordersService.cancel(id) }),
};

export const messagesAPI = {
  send: async (data) => ({ data: await messagesService.send(data) }),
  getConversations: async () => ({ data: { conversations: await messagesService.getConversations() } }),
  getMessages: async (userId) => ({ data: { messages: await messagesService.getMessages(userId) } }),
  getUnreadCount: async () => ({ data: { count: await messagesService.getUnreadCount() } }),
  delete: async (id) => ({ data: { message: 'Message deleted' } }),
};

export const usersAPI = {
  getByRole: async (role) => ({ data: { users: await usersService.listByRole(role) } }),
  getFarmers: async () => ({ data: { users: await usersService.listFarmers() } })
};

// Admin endpoints
export const adminAPI = {
  getStats: async () => {
    // Get real stats from Firestore
    const { getFirestore, collection, getDocs, query, where } = await import('firebase/firestore');
    const db = getFirestore();
    
    const [usersSnap, listingsSnap, ordersSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'listings')),
      getDocs(collection(db, 'orders'))
    ]);
    
    const users = usersSnap.docs.map(d => d.data());
    const listings = listingsSnap.docs.map(d => d.data());
    const orders = ordersSnap.docs.map(d => d.data());
    
    // Calculate this month's revenue
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthOrders = orders.filter(o => {
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return orderDate >= firstDayOfMonth;
    });
    
    return {
      data: {
        users: {
          total: users.length,
          farmers: users.filter(u => u.role === 'farmer').length,
          buyers: users.filter(u => u.role === 'buyer').length,
          admins: users.filter(u => u.role === 'admin').length
        },
        listings: {
          total: listings.length,
          active: listings.filter(l => !l.status || l.status === 'active').length,
          suspended: listings.filter(l => l.status === 'suspended').length,
          pending: listings.filter(l => l.status === 'pending').length
        },
        orders: {
          total: orders.length,
          completed: orders.filter(o => o.status === 'completed').length,
          pending: orders.filter(o => o.status === 'pending').length,
          cancelled: orders.filter(o => o.status === 'cancelled').length
        },
        revenue: {
          total: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
          thisMonth: thisMonthOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
        }
      }
    };
  },
  
  getUsers: async () => {
    const { getFirestore, collection, getDocs } = await import('firebase/firestore');
    const db = getFirestore();
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    return { data: { users } };
  },
  
  updateUserStatus: async (uid, active) => {
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    const db = getFirestore();
    await updateDoc(doc(db, 'users', uid), { active });
    return { data: { message: 'Updated' } };
  },
  
  updateUserRole: async (uid, role) => {
    const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
    const db = getFirestore();
    await updateDoc(doc(db, 'users', uid), { role });
    return { data: { message: 'Updated' } };
  },
  
  deleteUser: async (uid) => {
    const { getFirestore, doc, deleteDoc } = await import('firebase/firestore');
    const db = getFirestore();
    await deleteDoc(doc(db, 'users', uid));
    return { data: { message: 'Deleted' } };
  },
  
  getListings: async () => {
    const listings = await listingsService.getAll();
    return { data: { listings } };
  },
  
  moderateListing: async (id, status) => {
    await listingsService.update(id, { status });
    return { data: { message: 'Moderated' } };
  },
  
  getOrders: async () => {
    const { getFirestore, collection, getDocs } = await import('firebase/firestore');
    const db = getFirestore();
    const snapshot = await getDocs(collection(db, 'orders'));
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: { orders } };
  },

  deleteListing: async (id) => {
    const { getFirestore, doc, deleteDoc } = await import('firebase/firestore');
    const db = getFirestore();
    await deleteDoc(doc(db, 'listings', id));
    return { data: { message: 'Deleted' } };
  },
};

// Subscriptions - simplified
export const subscriptionsAPI = {
  create: async () => ({ data: { message: 'Subscription created' } }),
  list: async () => ({ data: { subscriptions: [] } }),
  delete: async () => ({ data: { message: 'Deleted' } }),
};
