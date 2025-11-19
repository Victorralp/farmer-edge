// Wishlist Service (Buyers Only)
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
  deleteDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

export const wishlistService = {
  // Add to wishlist
  add: async (listingId, listingData) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    // Use composite key to prevent duplicates
    const wishlistId = `${user.uid}_${listingId}`;
    const wishlistRef = doc(db, 'wishlists', wishlistId);
    
    const wishlistItem = {
      userId: user.uid,
      listingId: listingId,
      productName: listingData.title,
      productType: listingData.type,
      farmerId: listingData.farmerId,
      farmerName: listingData.farmerName,
      price: listingData.price,
      imageUrl: listingData.imageUrl,
      createdAt: serverTimestamp(),
      notifyOnAvailable: true,
      notifyOnPriceChange: true
    };
    
    await setDoc(wishlistRef, wishlistItem);
    return { id: wishlistId, ...wishlistItem };
  },
  
  // Remove from wishlist
  remove: async (wishlistId) => {
    await deleteDoc(doc(db, 'wishlists', wishlistId));
  },
  
  // Get user's wishlist
  getUserWishlist: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const q = query(
      collection(db, 'wishlists'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Check if item is in wishlist
  isInWishlist: async (listingId) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return false;
    
    const wishlistId = `${user.uid}_${listingId}`;
    const wishlistDoc = await getDoc(doc(db, 'wishlists', wishlistId));
    
    return wishlistDoc.exists();
  },
  
  // Toggle wishlist
  toggle: async (listingId, listingData) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const wishlistId = `${user.uid}_${listingId}`;
    const wishlistDoc = await getDoc(doc(db, 'wishlists', wishlistId));
    
    if (wishlistDoc.exists()) {
      await wishlistService.remove(wishlistId);
      return { added: false };
    } else {
      await wishlistService.add(listingId, listingData);
      return { added: true };
    }
  },
  
  // Update notification preferences
  updatePreferences: async (wishlistId, preferences) => {
    const wishlistRef = doc(db, 'wishlists', wishlistId);
    await setDoc(wishlistRef, preferences, { merge: true });
  },
  
  // Get wishlist count
  getCount: async () => {
    const wishlist = await wishlistService.getUserWishlist();
    return wishlist.length;
  }
};
