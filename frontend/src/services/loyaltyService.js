// Loyalty & Rewards Service
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

// Points configuration
const POINTS_CONFIG = {
  ORDER_COMPLETED: 10,
  REFERRAL: 50,
  REVIEW_WRITTEN: 5,
  FIRST_ORDER: 20,
  POINTS_PER_NAIRA: 0.1 // 1 point per 10 naira spent
};

export const loyaltyService = {
  // Get user points
  getPoints: async (userId) => {
    const auth = getAuth();
    const uid = userId || auth.currentUser?.uid;
    
    if (!uid) return null;
    
    const docRef = doc(db, 'loyaltyPoints', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    // Initialize if doesn't exist
    const initialData = {
      userId: uid,
      points: 0,
      totalEarned: 0,
      totalSpent: 0,
      tier: 'bronze',
      createdAt: serverTimestamp()
    };
    
    await setDoc(docRef, initialData);
    return initialData;
  },
  
  // Add points
  addPoints: async (userId, points, reason) => {
    const docRef = doc(db, 'loyaltyPoints', userId);
    
    await updateDoc(docRef, {
      points: increment(points),
      totalEarned: increment(points),
      lastEarned: serverTimestamp(),
      lastEarnReason: reason
    });
    
    // Check and update tier
    await updateTier(userId);
  },
  
  // Spend points
  spendPoints: async (userId, points, reason) => {
    const current = await loyaltyService.getPoints(userId);
    
    if (current.points < points) {
      throw new Error('Insufficient points');
    }
    
    const docRef = doc(db, 'loyaltyPoints', userId);
    
    await updateDoc(docRef, {
      points: increment(-points),
      totalSpent: increment(points),
      lastSpent: serverTimestamp(),
      lastSpendReason: reason
    });
  },
  
  // Award points for order
  awardOrderPoints: async (userId, orderAmount) => {
    const basePoints = POINTS_CONFIG.ORDER_COMPLETED;
    const amountPoints = Math.floor(orderAmount * POINTS_CONFIG.POINTS_PER_NAIRA);
    const totalPoints = basePoints + amountPoints;
    
    await loyaltyService.addPoints(userId, totalPoints, 'Order completed');
  },
  
  // Get available coupons
  getCoupons: async () => {
    const snapshot = await getDocs(collection(db, 'coupons'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Redeem coupon
  redeemCoupon: async (couponId) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) throw new Error('Must be authenticated');
    
    const couponDoc = await getDoc(doc(db, 'coupons', couponId));
    const coupon = couponDoc.data();
    
    if (!coupon) throw new Error('Coupon not found');
    if (coupon.pointsCost) {
      await loyaltyService.spendPoints(user.uid, coupon.pointsCost, `Redeemed coupon: ${coupon.code}`);
    }
    
    return coupon;
  },
  
  // Get tier benefits
  getTierBenefits: (tier) => {
    const benefits = {
      bronze: {
        name: 'Bronze',
        minPoints: 0,
        discount: 0,
        freeShipping: false,
        prioritySupport: false
      },
      silver: {
        name: 'Silver',
        minPoints: 500,
        discount: 5,
        freeShipping: false,
        prioritySupport: false
      },
      gold: {
        name: 'Gold',
        minPoints: 2000,
        discount: 10,
        freeShipping: true,
        prioritySupport: true
      },
      platinum: {
        name: 'Platinum',
        minPoints: 5000,
        discount: 15,
        freeShipping: true,
        prioritySupport: true
      }
    };
    
    return benefits[tier] || benefits.bronze;
  }
};

// Helper to update user tier
async function updateTier(userId) {
  const points = await loyaltyService.getPoints(userId);
  let newTier = 'bronze';
  
  if (points.totalEarned >= 5000) newTier = 'platinum';
  else if (points.totalEarned >= 2000) newTier = 'gold';
  else if (points.totalEarned >= 500) newTier = 'silver';
  
  if (newTier !== points.tier) {
    await updateDoc(doc(db, 'loyaltyPoints', userId), {
      tier: newTier,
      tierUpdatedAt: serverTimestamp()
    });
  }
}
