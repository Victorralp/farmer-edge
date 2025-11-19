// Price Analytics Service (Farmers Only)
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

export const priceAnalyticsService = {
  // Get farmer's price history
  getPriceHistory: async (productType, days = 90) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, 'listings'),
      where('farmerId', '==', user.uid),
      where('type', '==', productType),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      date: doc.data().createdAt?.toDate(),
      price: doc.data().price,
      title: doc.data().title
    }));
  },
  
  // Get market average price
  getMarketAverage: async (productType, state = null) => {
    let q;
    
    if (state) {
      q = query(
        collection(db, 'listings'),
        where('type', '==', productType),
        where('location.state', '==', state),
        where('status', '==', 'active')
      );
    } else {
      q = query(
        collection(db, 'listings'),
        where('type', '==', productType),
        where('status', '==', 'active')
      );
    }
    
    const snapshot = await getDocs(q);
    const prices = snapshot.docs.map(doc => doc.data().price);
    
    if (prices.length === 0) return null;
    
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    return {
      average: avg,
      min: min,
      max: max,
      count: prices.length
    };
  },
  
  // Get price comparison with competitors
  getCompetitorPrices: async (productType, state) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return [];
    
    const q = query(
      collection(db, 'listings'),
      where('type', '==', productType),
      where('location.state', '==', state),
      where('status', '==', 'active'),
      orderBy('price', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      farmerId: doc.data().farmerId,
      farmerName: doc.data().farmerName,
      price: doc.data().price,
      title: doc.data().title,
      isYou: doc.data().farmerId === user.uid
    }));
  },
  
  // Get price trends
  getPriceTrends: async (productType, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, 'listings'),
      where('type', '==', productType),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    // Group by date
    const pricesByDate = {};
    snapshot.docs.forEach(doc => {
      const date = doc.data().createdAt?.toDate().toISOString().split('T')[0];
      if (!pricesByDate[date]) {
        pricesByDate[date] = [];
      }
      pricesByDate[date].push(doc.data().price);
    });
    
    // Calculate average per date
    return Object.entries(pricesByDate).map(([date, prices]) => ({
      date: date,
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      count: prices.length
    }));
  },
  
  // Get pricing recommendations
  getPricingRecommendation: async (productType, state) => {
    const marketAvg = await priceAnalyticsService.getMarketAverage(productType, state);
    
    if (!marketAvg) {
      return {
        recommended: null,
        message: 'Not enough market data available'
      };
    }
    
    // Recommend slightly below average for competitive pricing
    const recommended = Math.round(marketAvg.average * 0.95);
    
    return {
      recommended: recommended,
      marketAverage: marketAvg.average,
      marketMin: marketAvg.min,
      marketMax: marketAvg.max,
      message: `Based on ${marketAvg.count} active listings in ${state || 'Nigeria'}`
    };
  },
  
  // Get farmer's performance metrics
  getPerformanceMetrics: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return null;
    
    // Get farmer's listings
    const listingsQuery = query(
      collection(db, 'listings'),
      where('farmerId', '==', user.uid)
    );
    
    const listingsSnapshot = await getDocs(listingsQuery);
    const listings = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get farmer's orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('farmerId', '==', user.uid)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => doc.data());
    
    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const totalListings = listings.length;
    const activeListings = listings.filter(l => l.status === 'active').length;
    
    return {
      totalRevenue,
      avgOrderValue,
      totalOrders: orders.length,
      totalListings,
      activeListings,
      conversionRate: totalListings > 0 ? (orders.length / totalListings) * 100 : 0
    };
  }
};
