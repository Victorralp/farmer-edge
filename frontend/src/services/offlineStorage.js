import localforage from 'localforage';

// Configure localforage for offline data storage
localforage.config({
  name: 'FarmersMarket',
  storeName: 'offline_data',
  description: 'Offline storage for Nigeria Farmers Market',
});

// Cache listings for offline browsing
export const cacheListings = async (listings) => {
  try {
    await localforage.setItem('cached_listings', {
      data: listings,
      timestamp: Date.now(),
    });

  } catch (error) {

  }
};

// Get cached listings
export const getCachedListings = async () => {
  try {
    const cached = await localforage.getItem('cached_listings');
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      // Cache valid for 24 hours
      return cached.data;
    }
    return null;
  } catch (error) {

    return null;
  }
};

// Save draft listing for later submission
export const saveDraftListing = async (draft) => {
  try {
    const drafts = (await localforage.getItem('draft_listings')) || [];
    drafts.push({
      ...draft,
      id: Date.now().toString(),
      createdAt: Date.now(),
    });
    await localforage.setItem('draft_listings', drafts);

  } catch (error) {

  }
};

// Get all draft listings
export const getDraftListings = async () => {
  try {
    return (await localforage.getItem('draft_listings')) || [];
  } catch (error) {

    return [];
  }
};

// Delete draft listing
export const deleteDraftListing = async (id) => {
  try {
    const drafts = (await localforage.getItem('draft_listings')) || [];
    const filtered = drafts.filter(draft => draft.id !== id);
    await localforage.setItem('draft_listings', filtered);
  } catch (error) {

  }
};

// Queue order for when online
export const queueOfflineOrder = async (orderData) => {
  try {
    const queue = (await localforage.getItem('offline_orders')) || [];
    queue.push({
      ...orderData,
      queuedAt: Date.now(),
    });
    await localforage.setItem('offline_orders', queue);

  } catch (error) {

  }
};

// Get queued orders
export const getQueuedOrders = async () => {
  try {
    return (await localforage.getItem('offline_orders')) || [];
  } catch (error) {

    return [];
  }
};

// Clear queued orders after sync
export const clearQueuedOrders = async () => {
  try {
    await localforage.setItem('offline_orders', []);
  } catch (error) {

  }
};

// Check if user is online
export const isOnline = () => {
  return navigator.onLine;
};

// Listen for online/offline events
export const setupConnectivityListeners = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

export default localforage;
