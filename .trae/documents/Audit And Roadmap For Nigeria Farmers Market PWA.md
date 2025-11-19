## Current State
- Full‑stack React + Express + Firebase; Cloudinary images; Brevo emails/SMS
- Offline basics via `localforage` and a custom service worker; USSD/SMS Cloud Functions stubs
- Role‑based backend protections; admin dashboards; messaging and orders

## Key Improvements
### Security & Robustness
- Harden token/role handling and config checks (`backend/middleware/auth.js`:4–26, `backend/config/firebase.js`:5–24)
- Restrict profile visibility or return sanitized views (`firestore.rules`:31–37)
- Enforce admin‑only route guard in UI (`frontend/src/App.js`:101–107)
- Validate inputs server‑side (Joi/Zod) for listings/orders/messages
- Use Firestore transactions for inventory updates to avoid race conditions (`backend/routes/orders.js`:209–223)

### Offline & PWA
- Implement real background sync of queued orders/drafts: connect `offlineStorage` queue to Service Worker Sync (`frontend/src/services/offlineStorage.js`:76–107, `frontend/public/service-worker.js`:84–94)
- Replace ad‑hoc SW cache with Workbox runtime caching for images/API and versioned precache (`frontend/public/service-worker.js`:1–65)
- Cache marketplace API responses and images with sensible TTL; provide offline detail view fallback

### Performance & DX
- Add pagination/infinite scroll to listings/admin tables (`frontend/src/pages/Marketplace.js`; `frontend/src/pages/AdminPanel.js`:19–30)
- Improve Cloudinary uploads using upload streams instead of data URIs (`backend/config/cloudinary.js`:11–23)
- Centralize constants (produce types, units, states) and reuse across backend/frontend
- Add structured logging (Winston/Pino) and consistent error envelopes (`backend/server.js`:72–86)

### Messaging & Notifications
- Reduce polling; use realtime updates (SSE/WebSocket) or FCM push for unread/messages (`frontend/src/components/Navbar.js`:13–18)
- Web Push via Firebase Cloud Messaging for order status/message events

### UX & Accessibility
- Dynamic LGA selection by state; better mobile forms and skeleton loaders
- Currency formatting and localization for NGN across UI
- Accessibility pass (labels, roles, contrast, keyboard navigation)

## Features To Add
- Payments: Paystack/Flutterwave checkout, escrow, and payout to farmers
- Delivery logistics: pickup/delivery workflows, address book, fee estimation, map support
- Ratings & reviews for farmers and listings
- Price negotiation/counter‑offers on orders
- Buyer alerts/subscriptions for new listings in their location/type
- Multi‑image listings and gallery
- Farmer verification/KYC and badge
- Real‑time chat with attachments
- USSD: enable browsing and simple ordering; integrate Africa’s Talking (`functions/index.js`:223–275)
- SMS: transactional updates and simple commands (`functions/index.js`:278–317)
- Analytics: farmer dashboards; admin KPIs beyond current stats

## Suggested Milestones
### Phase 1: Foundations
- Input validation, admin route guard, config checks, transactional inventory, logging
- Workbox service worker; connect background sync; cached marketplace/API

### Phase 2: Realtime & Notifications
- FCM push; unread/messages realtime; pagination/infinite scroll; constants refactor

### Phase 3: Payments & Logistics
- Integrate Paystack/Flutterwave; order state extensions; delivery flows; address book

### Phase 4: USSD/SMS & Growth
- Production USSD flows; SMS notifications/commands; buyer alerts; ratings/reviews; KYC

### Phase 5: UX/Accessibility & Analytics
- Dynamic LGA, skeletons, i18n groundwork; accessibility pass; richer analytics

## Quick Wins (Low Effort, High Impact)
- Guard `/admin` route in UI by role (redirect non‑admins) (`frontend/src/App.js`:101–107)
- Use Firestore transactions in order status updates (`backend/routes/orders.js`:209–223)
- Strengthen service worker caching and wire background sync (`frontend/public/service-worker.js`:84–94)
- Add server‑side input validation for create/update endpoints

Approve to proceed and I’ll implement Phase 1 first, then verify end‑to‑end.