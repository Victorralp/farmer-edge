// Analytics Service
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

const db = getFirestore();

export const analyticsService = {
  // Get sales trends
  getSalesTrends: async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Group by date
    const salesByDate = {};
    orders.forEach(order => {
      const date = order.createdAt?.toDate().toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, revenue: 0, orders: 0 };
      }
      salesByDate[date].revenue += order.totalPrice || 0;
      salesByDate[date].orders += 1;
    });
    
    return Object.values(salesByDate);
  },
  
  // Get top products
  getTopProducts: async (limitCount = 10) => {
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs.map(doc => doc.data());
    
    // Count product occurrences
    const productStats = {};
    orders.forEach(order => {
      const productId = order.listingId;
      if (!productStats[productId]) {
        productStats[productId] = {
          productId,
          productName: order.produceName,
          totalOrders: 0,
          totalRevenue: 0,
          totalQuantity: 0
        };
      }
      productStats[productId].totalOrders += 1;
      productStats[productId].totalRevenue += order.totalPrice || 0;
      productStats[productId].totalQuantity += order.quantity || 0;
    });
    
    return Object.values(productStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limitCount);
  },
  
  // Get top farmers
  getTopFarmers: async (limitCount = 10) => {
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs.map(doc => doc.data());
    
    const farmerStats = {};
    orders.forEach(order => {
      const farmerId = order.farmerId;
      if (!farmerStats[farmerId]) {
        farmerStats[farmerId] = {
          farmerId,
          farmerName: order.farmerName,
          totalOrders: 0,
          totalRevenue: 0
        };
      }
      farmerStats[farmerId].totalOrders += 1;
      farmerStats[farmerId].totalRevenue += order.totalPrice || 0;
    });
    
    return Object.values(farmerStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limitCount);
  },
  
  // Get geographic distribution
  getGeographicDistribution: async () => {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => doc.data());
    
    const distribution = {};
    users.forEach(user => {
      const state = user.location?.state || 'Unknown';
      distribution[state] = (distribution[state] || 0) + 1;
    });
    
    return Object.entries(distribution)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
  },
  
  // Get order statistics
  getOrderStats: async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => doc.data());
    
    return {
      total: orders.length,
      completed: orders.filter(o => o.status === 'completed').length,
      pending: orders.filter(o => o.status === 'pending').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) / orders.length 
        : 0
    };
  },
  
  // Get user growth
  getUserGrowth: async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const usersByDate = {};
    users.forEach(user => {
      const date = user.createdAt?.toDate?.()?.toISOString().split('T')[0];
      if (date && new Date(date) >= startDate) {
        if (!usersByDate[date]) {
          usersByDate[date] = { date, farmers: 0, buyers: 0, total: 0 };
        }
        usersByDate[date].total += 1;
        if (user.role === 'farmer') usersByDate[date].farmers += 1;
        if (user.role === 'buyer') usersByDate[date].buyers += 1;
      }
    });
    
    return Object.values(usersByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  },
  
  // Export data to CSV
  exportToCSV: (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => JSON.stringify(row[header] || '')).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};
