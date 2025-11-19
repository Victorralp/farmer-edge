// Price Comparison Service (Buyers Only)
import { 
  getFirestore, 
  collection, 
  getDocs,
  getDoc,
  doc,
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';

const db = getFirestore();

export const priceComparisonService = {
  // Compare prices for a product type
  comparePrices: async (productType, filters = {}) => {
    let q = query(
      collection(db, 'listings'),
      where('type', '==', productType),
      where('status', '==', 'active')
    );
    
    // Add state filter if provided
    if (filters.state) {
      q = query(q, where('location.state', '==', filters.state));
    }
    
    // Order by price
    q = query(q, orderBy('price', 'asc'));
    
    // Limit results if specified
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      pricePerUnit: doc.data().price
    }));
  },
  
  // Get best deals (lowest prices)
  getBestDeals: async (limitCount = 10) => {
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'active'),
      orderBy('price', 'asc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },
  
  // Compare specific listings
  compareListings: async (listingIds) => {
    const listings = await Promise.all(
      listingIds.map(async (id) => {
        const listingDoc = await getDoc(doc(db, 'listings', id));
        return { id: listingDoc.id, ...listingDoc.data() };
      })
    );
    
    return listings.sort((a, b) => a.price - b.price);
  },
  
  // Get price statistics for a product type
  getPriceStats: async (productType, state = null) => {
    let q = query(
      collection(db, 'listings'),
      where('type', '==', productType),
      where('status', '==', 'active')
    );
    
    if (state) {
      q = query(q, where('location.state', '==', state));
    }
    
    const snapshot = await getDocs(q);
    const prices = snapshot.docs.map(doc => doc.data().price);
    
    if (prices.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        median: 0,
        count: 0
      };
    }
    
    const sorted = prices.sort((a, b) => a - b);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    
    return {
      average: avg,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: median,
      count: prices.length
    };
  },
  
  // Get price by location
  getPricesByLocation: async (productType) => {
    const q = query(
      collection(db, 'listings'),
      where('type', '==', productType),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    
    // Group by state
    const pricesByState = {};
    snapshot.docs.forEach(doc => {
      const state = doc.data().location?.state || 'Unknown';
      if (!pricesByState[state]) {
        pricesByState[state] = [];
      }
      pricesByState[state].push(doc.data().price);
    });
    
    // Calculate average per state
    return Object.entries(pricesByState).map(([state, prices]) => ({
      state: state,
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      count: prices.length
    })).sort((a, b) => a.averagePrice - b.averagePrice);
  },
  
  // Get similar products
  getSimilarProducts: async (listingId, limitCount = 5) => {
    // Get the original listing
    const listingDoc = await getDoc(doc(db, 'listings', listingId));
    const listing = listingDoc.data();
    
    if (!listing) return [];
    
    // Find similar products
    const q = query(
      collection(db, 'listings'),
      where('type', '==', listing.type),
      where('status', '==', 'active'),
      orderBy('price', 'asc'),
      limit(limitCount + 1) // +1 to exclude the original
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(item => item.id !== listingId);
  },
  
  // Get price alerts (products below average)
  getPriceAlerts: async (productType, state = null) => {
    const stats = await priceComparisonService.getPriceStats(productType, state);
    
    if (stats.count === 0) return [];
    
    let q = query(
      collection(db, 'listings'),
      where('type', '==', productType),
      where('status', '==', 'active'),
      where('price', '<=', stats.average * 0.9) // 10% below average
    );
    
    if (state) {
      q = query(q, where('location.state', '==', state));
    }
    
    q = query(q, orderBy('price', 'asc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      savingsPercent: ((stats.average - doc.data().price) / stats.average) * 100
    }));
  }
};
