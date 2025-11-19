// Review & Rating Service
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
  increment
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

export const reviewService = {
  // Create a review
  create: async (reviewData) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const review = {
      ...reviewData,
      reviewerId: user.uid,
      createdAt: serverTimestamp(),
      status: 'active'
    };
    
    const docRef = await addDoc(collection(db, 'reviews'), review);
    
    // Update user's average rating
    await updateUserRating(reviewData.reviewedUserId);
    
    return { id: docRef.id, ...review };
  },
  
  // Get reviews for a user
  getUserReviews: async (userId) => {
    const q = query(
      collection(db, 'reviews'),
      where('reviewedUserId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Get reviews by a user
  getReviewsByUser: async (userId) => {
    const q = query(
      collection(db, 'reviews'),
      where('reviewerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Update review
  update: async (reviewId, data) => {
    const reviewRef = doc(db, 'reviews', reviewId);
    await updateDoc(reviewRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },
  
  // Delete review
  delete: async (reviewId) => {
    await deleteDoc(doc(db, 'reviews', reviewId));
  },
  
  // Get average rating for user
  getUserRating: async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    return {
      averageRating: userData?.averageRating || 0,
      totalReviews: userData?.totalReviews || 0
    };
  }
};

// Helper function to update user's average rating
async function updateUserRating(userId) {
  const reviews = await reviewService.getUserReviews(userId);
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
  
  await updateDoc(doc(db, 'users', userId), {
    averageRating: averageRating,
    totalReviews: reviews.length
  });
}
