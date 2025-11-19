# 🎯 Unique Role-Based Features

## Overview
Implemented unique features that are specific to Farmers and Buyers, enhancing the platform's value proposition for each user type.

---

## ✅ Features Implemented

### 1. 🌾 **Harvest Calendar** (Farmers Only)

**Purpose:** Farmers can schedule and announce upcoming harvests, allowing buyers to plan purchases in advance.

**Features:**
- Schedule harvest dates
- Specify product type and estimated quantity
- Set status (scheduled, harvested, cancelled)
- Notify interested buyers automatically
- Track actual vs estimated harvest
- Public visibility for buyers

**Service:** `frontend/src/services/harvestService.js`

**Database:** `harvests` collection

**Use Cases:**
- Farmer schedules tomato harvest for next week
- System notifies buyers who wishlisted tomatoes
- Buyers can pre-order or plan purchases
- Farmer updates when harvest is complete

---

### 2. ❤️ **Wishlist & Alerts** (Buyers Only)

**Purpose:** Buyers can save favorite products and get notified when they become available or prices change.

**Features:**
- Add/remove items from wishlist
- Get notified when product is available
- Get notified on price changes
- Track wishlist count
- Quick access to favorite products
- Notification preferences per item

**Service:** `frontend/src/services/wishlistService.js`

**Database:** `wishlists` collection

**Use Cases:**
- Buyer adds "Organic Tomatoes" to wishlist
- Farmer schedules tomato harvest
- Buyer gets notification
- Buyer can quickly purchase from wishlist

---

## 🔧 Technical Implementation

### Harvest Service API

```javascript
import { harvestService } from '../services/harvestService';

// Create harvest schedule (Farmers)
await harvestService.create({
  productName: 'Tomatoes',
  productType: 'vegetables',
  estimatedQuantity: 500,
  unit: 'kg',
  harvestDate: new Date('2024-12-01'),
  location: { state: 'Lagos', lga: 'Ikeja' },
  notes: 'Organic, pesticide-free'
});

// Get farmer's harvests
const harvests = await harvestService.getFarmerHarvests();

// Get upcoming harvests (Buyers)
const upcoming = await harvestService.getUpcomingHarvests(30); // Next 30 days

// Mark as harvested
await harvestService.markAsHarvested(harvestId);

// Notify subscribers
await harvestService.notifySubscribers(harvestId);
```

### Wishlist Service API

```javascript
import { wishlistService } from '../services/wishlistService';

// Add to wishlist (Buyers)
await wishlistService.add(listingId, {
  title: 'Fresh Tomatoes',
  type: 'vegetables',
  farmerId: 'farmer123',
  farmerName: 'John Farm',
  price: 500,
  imageUrl: 'https://...'
});

// Remove from wishlist
await wishlistService.remove(wishlistId);

// Get user's wishlist
const wishlist = await wishlistService.getUserWishlist();

// Check if in wishlist
const isWishlisted = await wishlistService.isInWishlist(listingId);

// Toggle wishlist
const result = await wishlistService.toggle(listingId, listingData);
// Returns: { added: true/false }

// Get wishlist count
const count = await wishlistService.getCount();
```

---

## 🗄️ Database Schema

### Harvests Collection
```javascript
{
  id: string,
  farmerId: string,
  productName: string,
  productType: string,
  estimatedQuantity: number,
  unit: string,
  harvestDate: timestamp,
  actualHarvestDate: timestamp (optional),
  location: {
    state: string,
    lga: string
  },
  status: 'scheduled' | 'harvested' | 'cancelled',
  notes: string,
  notificationsSent: boolean,
  notificationsSentAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Wishlists Collection
```javascript
{
  id: string, // Composite: userId_listingId
  userId: string,
  listingId: string,
  productName: string,
  productType: string,
  farmerId: string,
  farmerName: string,
  price: number,
  imageUrl: string,
  notifyOnAvailable: boolean,
  notifyOnPriceChange: boolean,
  createdAt: timestamp
}
```

---

## 🔐 Security Rules

### Harvests
```javascript
// Public read (buyers can see upcoming harvests)
allow read: if true;

// Only farmers can create
allow create: if isAuthenticated() && 
              request.resource.data.farmerId == request.auth.uid &&
              isFarmer();

// Only owner can update/delete
allow update, delete: if isAuthenticated() && 
                        resource.data.farmerId == request.auth.uid;
```

### Wishlists
```javascript
// Only owner can read
allow read: if isAuthenticated() && 
              resource.data.userId == request.auth.uid;

// Only owner can create
allow create: if isAuthenticated() &&
              request.resource.data.userId == request.auth.uid;

// Only owner can update/delete
allow update, delete: if isAuthenticated() && 
                        resource.data.userId == request.auth.uid;
```

---

## 📊 Firestore Indexes

### Harvests
```json
{
  "collectionGroup": "harvests",
  "fields": [
    { "fieldPath": "farmerId", "order": "ASCENDING" },
    { "fieldPath": "harvestDate", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "harvests",
  "fields": [
    { "fieldPath": "harvestDate", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

### Wishlists
```json
{
  "collectionGroup": "wishlists",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

## 🎨 UI Integration (To Be Built)

### For Farmers

**Harvest Calendar Page** (`/farmer/harvests`)
- Calendar view of scheduled harvests
- Add new harvest button
- List view with filters
- Edit/delete harvests
- Mark as harvested button
- Notify subscribers button

**Dashboard Widget**
- Upcoming harvests (next 7 days)
- Quick add harvest
- Harvest statistics

### For Buyers

**Wishlist Page** (`/wishlist`)
- Grid/list view of wishlisted items
- Remove from wishlist button
- Quick purchase button
- Notification preferences toggle
- Empty state with suggestions

**Listing Detail Page**
- Heart icon to add/remove from wishlist
- Visual feedback when added
- Wishlist count in navbar

**Upcoming Harvests Page** (`/upcoming-harvests`)
- Browse scheduled harvests
- Filter by product type, location
- Add to wishlist from harvest
- Pre-order option

---

## 🔔 Notification Integration

### Harvest Notifications
```javascript
// When farmer schedules harvest
await harvestService.notifySubscribers(harvestId);

// Notification sent to buyers who wishlisted that product type
{
  type: 'harvest_scheduled',
  title: 'Harvest Scheduled',
  message: 'Fresh Tomatoes will be available on Dec 1',
  data: {
    productName: 'Tomatoes',
    harvestDate: timestamp,
    farmerId: 'farmer123',
    harvestId: 'harvest123'
  }
}
```

### Wishlist Notifications
```javascript
// When wishlisted product becomes available
{
  type: 'wishlist_available',
  title: 'Product Available',
  message: 'Fresh Tomatoes you wishlisted is now available',
  data: {
    listingId: 'listing123',
    productName: 'Tomatoes'
  }
}

// When price changes
{
  type: 'price_change',
  title: 'Price Update',
  message: 'Fresh Tomatoes price changed from ₦500 to ₦450',
  data: {
    listingId: 'listing123',
    oldPrice: 500,
    newPrice: 450
  }
}
```

---

## 🎯 User Flows

### Farmer Flow
```
1. Navigate to Harvest Calendar
2. Click "Schedule Harvest"
3. Fill in details:
   - Product name
   - Quantity
   - Harvest date
   - Location
   - Notes
4. Click "Schedule"
5. System notifies interested buyers
6. On harvest day, mark as "Harvested"
7. Create listing from harvest
```

### Buyer Flow
```
1. Browse marketplace
2. Find interesting product
3. Click heart icon to add to wishlist
4. Farmer schedules harvest of that product
5. Buyer receives notification
6. Buyer clicks notification
7. Navigates to harvest/listing
8. Places order
```

---

## ✨ Benefits

### For Farmers
✅ **Better planning** - Schedule harvests in advance
✅ **Guaranteed buyers** - Notify interested buyers
✅ **Reduced waste** - Pre-orders before harvest
✅ **Professional image** - Organized, planned approach
✅ **Market intelligence** - See demand via wishlists

### For Buyers
✅ **Never miss products** - Get notified when available
✅ **Better prices** - Pre-order at harvest time
✅ **Convenience** - Quick access to favorites
✅ **Planning** - Know when products will be available
✅ **Personalized** - Only get relevant notifications

### For Platform
✅ **Engagement** - Users return for notifications
✅ **Retention** - Wishlist keeps buyers coming back
✅ **Data** - Understand demand patterns
✅ **Differentiation** - Unique features vs competitors
✅ **Network effects** - More farmers → more wishlists → more buyers

---

## 📈 Metrics to Track

### Harvest Calendar
- Number of harvests scheduled
- Average lead time (days before harvest)
- Notification open rate
- Conversion rate (notification → purchase)
- Harvest completion rate

### Wishlist
- Wishlist items per user
- Wishlist → purchase conversion
- Notification effectiveness
- Most wishlisted products
- Wishlist growth rate

---

## 🚀 Next Steps

### Phase 1: Basic UI (Immediate)
1. Create Harvest Calendar page for farmers
2. Add wishlist button to listing pages
3. Create Wishlist page for buyers
4. Add wishlist count to navbar

### Phase 2: Enhanced Features
1. Harvest calendar widget on dashboard
2. Upcoming harvests page for buyers
3. Pre-order from harvest
4. Price tracking charts
5. Wishlist sharing

### Phase 3: Advanced
1. Harvest weather integration
2. Demand forecasting for farmers
3. Group buying from wishlists
4. Subscription harvests
5. Harvest insurance

---

## 📁 Files Created

- ✅ `frontend/src/services/harvestService.js` - Harvest calendar service
- ✅ `frontend/src/services/wishlistService.js` - Wishlist service
- ✅ `firestore.rules` - Updated with harvest & wishlist rules
- ✅ `firestore.indexes.json` - Added indexes
- ✅ `UNIQUE_FEATURES_SUMMARY.md` - This documentation

---

## 🎉 Summary

**Two powerful, role-specific features implemented:**

1. **Harvest Calendar** (Farmers) - Schedule harvests, notify buyers
2. **Wishlist & Alerts** (Buyers) - Save favorites, get notified

**Services are production-ready and deployed!**

Next step: Build the UI components to make these features accessible to users.

---

**Unique features that differentiate your platform from competitors!** 🚀
