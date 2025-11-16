# Quick Start Guide

Get the Nigeria Farmers Market up and running in 10 minutes!

## 🚀 Prerequisites

- Node.js 16+ installed
- Firebase account (free tier is fine)
- Cloudinary account (free tier)
- Brevo account (free tier)

## ⚡ 5-Minute Setup

### 1. Clone and Install (2 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd nigeria-farmers-market

# Install all dependencies
npm run install-all
```

### 2. Firebase Setup (1 minute)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Email/Password Authentication
4. Create Firestore database
5. Download service account JSON (Project Settings > Service Accounts)

### 3. Configure Backend (1 minute)

```bash
cd backend
cp .env.example .env
nano .env  # or use your preferred editor
```

Add your credentials:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
BREVO_API_KEY=your-brevo-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
```

### 4. Configure Frontend (1 minute)

```bash
cd ../frontend
cp .env.example .env
nano .env
```

Add Firebase web config:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef
```

### 5. Deploy Security Rules (30 seconds)

```bash
cd ..
firebase login
firebase init firestore  # Select existing project
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 6. Start Development Servers (30 seconds)

```bash
# From project root, run both servers
npm run dev
```

Or run separately:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

## ✅ You're Done!

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/health

## 📝 First Steps

### Create Your First User

1. Go to http://localhost:3000
2. Click "Register"
3. Fill in the form:
   - **Role**: Choose "Farmer" or "Buyer"
   - **State**: Select your Nigerian state
   - **Email**: Use a real email for verification
4. Click "Create Account"
5. Check email for verification link

### Create Admin User

1. Register a normal user first
2. Copy the user's UID from Firebase Console
3. Go to Firebase Console > Firestore
4. Find the user document: `users/{uid}`
5. Edit the document and change `role` to `"admin"`

### Create a Listing (Farmers)

1. Login as a farmer
2. Click "Dashboard"
3. Click "Create New Listing"
4. Fill in produce details
5. Upload an image
6. Click "Create Listing"

### Place an Order (Buyers)

1. Login as a buyer
2. Click "Marketplace"
3. Browse listings
4. Click "View Details" on any listing
5. Click "Place Order"
6. Fill in quantity and delivery address
7. Submit order

## 🔍 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5000/health

# Get listings (no auth required)
curl http://localhost:5000/api/listings

# Get user profile (requires auth)
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Get Firebase Token

In browser console on frontend:
```javascript
import { auth } from './config/firebase';
const token = await auth.currentUser.getIdToken();
console.log(token);
```

## 🎨 Customization

### Change App Name

**Frontend:**
- `frontend/public/index.html` - Update title and meta tags
- `frontend/public/manifest.json` - Update app name
- `frontend/src/pages/Home.js` - Update branding

**Backend:**
- `backend/server.js` - Update API description

### Change Theme Colors

**Frontend:**
- `frontend/src/index.css` - Modify `.btn-success` and other styles
- `frontend/public/manifest.json` - Update `theme_color`

### Add New Produce Types

**Backend:**
- `backend/routes/listings.js` - No changes needed (any string accepted)

**Frontend:**
- `frontend/src/pages/CreateListing.js` - Update `produceTypes` array
- `frontend/src/pages/Marketplace.js` - Update `produceTypes` array

## 🐛 Troubleshooting

### "Firebase Admin initialization failed"
- Check `FIREBASE_PRIVATE_KEY` has `\n` in the .env file
- Ensure service account has proper permissions

### "CORS Error"
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check browser console for exact error

### "Cloudinary upload failed"
- Verify all Cloudinary credentials are correct
- Check file size is under 5MB
- Ensure file is an image type

### "Email not sent"
- Check Brevo API key is valid
- Verify sender email is verified in Brevo dashboard
- Check Brevo logs for delivery status

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

## 📚 Next Steps

1. Read the full [README.md](./README.md)
2. Check [API.md](./API.md) for complete API documentation
3. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to production
4. Review [CHANGELOG.md](./CHANGELOG.md) for feature list

## 💡 Pro Tips

### Development Workflow

1. **Backend Changes**: Auto-reload with nodemon
2. **Frontend Changes**: Hot reload with React
3. **Firestore Rules**: Deploy with `firebase deploy --only firestore:rules`
4. **Test Email**: Use a test email service during development

### Data Seeding

Create sample data in Firebase Console:
- Add 5-10 users with different roles
- Create 20-30 listings
- Generate a few test orders

### Mobile Testing

1. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update backend CORS to allow your IP
3. Update frontend `.env` with `http://YOUR_IP:5000`
4. Access from mobile: `http://YOUR_IP:3000`

### PWA Testing

1. Build production version: `cd frontend && npm run build`
2. Serve build: `npx serve -s build`
3. Test PWA features with Chrome DevTools > Application

## 🎯 Demo Credentials

For testing, create these sample users:

**Farmer:**
- Email: farmer@example.com
- Password: farmer123

**Buyer:**
- Email: buyer@example.com
- Password: buyer123

**Admin:**
- Email: admin@example.com
- Password: admin123

## 🆘 Need Help?

- **Issues**: Open an issue on GitHub
- **Email**: support@farmersmarket.ng
- **Documentation**: Check README.md and API.md

---

**Ready to build something amazing! 🚜🌾**
