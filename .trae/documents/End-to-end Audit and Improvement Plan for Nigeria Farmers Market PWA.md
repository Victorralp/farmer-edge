Scope and priorities
- Foundation and tooling
- Security and configuration
- PWA and performance
- Product UX improvements
- Testing and CI/CD
- Documentation and operational readiness

Key findings (with code references)
- Root scripts reference a non-existent backend; dev/build flow is inconsistent (c:\Users\Raphael\...\package.json:7-13)
- Firebase Functions predeploy runs a lint script that is not defined (c:\Users\Raphael\...\firebase.json:4-6; c:\Users\Raphael\...\functions\package.json:6-12)
- Custom service worker hard-codes CRA bundle paths which change on build, risking stale caches (c:\Users\Raphael\...\frontend\public\service-worker.js:2-9)
- Firebase Messaging SW tries to read env via self.REACT_APP_* which will not be defined at runtime (c:\Users\Raphael\...\frontend\public\firebase-messaging-sw.js:4-11)
- Cloudinary deletion is a stub; images may accumulate (c:\Users\Raphael\...\frontend\src\services\firebaseService.js:69-75)
- Firestore security rules lack field-level validation (e.g., price/quantity ranges) beyond ownership (c:\Users\Raphael\...\firestore.rules:39-60)
- Docs and env example still reference a backend API URL that the code does not use (c:\Users\Raphael\...\frontend\.env.example:11-15; README.md:204)

Proposed improvements (phased and actionable)
1) Foundation and tooling
- Align root scripts to a Firebase-only workflow: install, dev (frontend + functions emulator), build, deploy
- Add ESLint/Prettier to functions and frontend; define "lint" in functions to satisfy predeploy
- Optional: add path aliases and import hygiene for frontend

2) Security and configuration
- Audit .env in frontend for correctness; remove unused REACT_APP_API_URL; ensure FCM VAPID key present
- Fix Firebase Messaging SW init: move config to a small static JSON loaded via importScripts or initialize messaging in the app and let CRA handle the SW
- Strengthen Firestore rules: validate schema (types and ranges) for listings/orders/messages; restrict writable fields
- Add Firebase Hosting security headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy

3) PWA and performance
- Replace custom SW with Workbox: precache CRA build assets, runtime caching strategies
  - Network-first for navigation, stale-while-revalidate for Cloudinary images, cache-first with versioning for static
- Add an offline fallback page and smarter cache versioning
- Optimize image delivery: Cloudinary transformations for responsive breakpoints; lazy loading in listings

4) Product UX improvements
- Accessibility pass: labels, alt text, focus states, contrast
- Marketplace: add skeleton loaders and virtualized list for large datasets
- Forms: client-side validation and better error messaging; sanitize inputs before Firestore writes
- Optional: i18n scaffolding (Hausa, Yoruba, Igbo)

5) Notifications and engagement
- Use FCM tokens saved in user profiles to send push notifications for new listings and order updates (complementing email)
- Ensure opt-in flows and permission handling (frontend)

6) Testing and CI/CD
- Unit tests for services (offlineStorage, firebaseService)
- Integration tests for Marketplace, CreateListing, Orders
- GitHub Actions: lint, build, functions tests, Firebase deploy (on release branch)

7) Documentation and ops
- Update README/setup guides to reflect Firebase-only stack; remove outdated backend references
- Add runbooks for setting functions config (brevo.apikey, brevo.sender_email, app.url) and environment variables

Deliverables
- Updated scripts, linting, and CI setup
- Hardened Firestore rules and hosting headers
- Workbox-based SW with runtime caching
- Fixed FCM SW configuration
- Tests for core flows
- Documentation refresh

Acceptance criteria
- Dev scripts run without referencing non-existent paths
- Firebase deploy passes predeploy lint; functions tested
- PWA passes Lighthouse audits (Performance, PWA, Accessibility ≥ 90)
- Firestore rules protect against unauthorized writes and invalid data
- Push/email notifications work for the defined events
- Docs enable a fresh setup end-to-end without external backend