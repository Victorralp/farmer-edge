# Nigeria Farmers Market

A full-stack Progressive Web Application connecting smallholder farmers in Nigeria with local buyers, designed to work on low-bandwidth connections and support offline functionality.

## 🌍 Problem Statement

Over 30 million Nigerians face food insecurity, and farmers often struggle to reach markets. This platform bridges the gap between smallholder farmers and local buyers, making fresh produce accessible to everyone while ensuring farmers get fair prices.

## 🚀 Features

### Core Functionality
- **User Authentication**: Firebase Authentication with role-based access (farmer, buyer, admin)
- **Listing Management**: Farmers can create, edit, and delete produce listings
- **Marketplace Browsing**: Buyers can search and filter listings by type, location, and price
- **Order Workflow**: Place orders, track status, and coordinate delivery
- **Messaging System**: Direct communication between buyers and farmers
- **Admin Dashboard**: User management, listing moderation, and platform metrics

### Technical Features
- **Progressive Web App (PWA)**: Offline browsing with cached listings
- **Low-Bandwidth Optimization**: Compressed images and optimized assets
- **Real-time Updates**: Firebase Firestore for real-time data synchronization
- **Cloud Image Storage**: Cloudinary integration for efficient image management
- **Email Notifications**: Brevo (Sendinblue) for transactional emails
- **SMS/USSD Ready**: Architecture supports future SMS/USSD integration

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern UI framework
- **React Router v6**: Client-side routing
- **Bootstrap 5**: Responsive design framework
- **Firebase SDK**: Authentication and Firestore access
- **Localforage**: Offline data storage
- **Axios**: HTTP client
- **React Toastify**: Notifications

### Backend
- **Node.js & Express**: RESTful API server
- **Firebase Admin SDK**: Server-side Firebase operations
- **Cloudinary**: Image upload and optimization
- **Brevo API**: Email and SMS notifications
- **Multer**: File upload handling
- **Helmet**: Security middleware
- **Express Rate Limit**: API protection

### Cloud Services
- **Firebase Authentication**: User management
- **Cloud Firestore**: NoSQL database
- **Firebase Cloud Functions**: Serverless background tasks
- **Cloudinary**: Image CDN and transformation
- **Brevo (Sendinblue)**: Email/SMS delivery

## 📁 Project Structure

```
nigeria-farmers-market/
├── backend/                 # Express API server
│   ├── config/             # Configuration files
│   │   ├── firebase.js     # Firebase Admin setup
│   │   ├── cloudinary.js   # Cloudinary configuration
│   │   └── brevo.js        # Brevo email/SMS setup
│   ├── middleware/         # Express middleware
│   │   ├── auth.js         # Authentication middleware
│   │   └── upload.js       # File upload configuration
│   ├── routes/             # API routes
│   │   ├── auth.js         # User authentication
│   │   ├── listings.js     # Produce listings
│   │   ├── orders.js       # Order management
│   │   ├── messages.js     # Messaging system
│   │   └── admin.js        # Admin operations
│   ├── .env.example        # Environment variables template
│   ├── package.json        # Backend dependencies
│   └── server.js           # Main server file
│
├── frontend/               # React PWA
│   ├── public/
│   │   ├── manifest.json   # PWA manifest
│   │   ├── service-worker.js # Service worker for offline
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── Navbar.js
│   │   │   └── OfflineIndicator.js
│   │   ├── pages/          # Page components
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Marketplace.js
│   │   │   ├── ListingDetail.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CreateListing.js
│   │   │   ├── Messages.js
│   │   │   ├── Profile.js
│   │   │   └── AdminPanel.js
│   │   ├── services/       # API and storage services
│   │   │   ├── api.js      # API client
│   │   │   └── offlineStorage.js # Offline functionality
│   │   ├── config/
│   │   │   └── firebase.js # Firebase client config
│   │   ├── App.js          # Main app component
│   │   ├── index.js        # React entry point
│   │   └── index.css       # Global styles
│   ├── .env.example        # Frontend environment template
│   └── package.json        # Frontend dependencies
│
├── functions/              # Firebase Cloud Functions
│   ├── index.js           # Cloud Functions code
│   └── package.json       # Functions dependencies
│
├── .gitignore
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Firebase account
- Cloudinary account
- Brevo (Sendinblue) account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nigeria-farmers-market
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

### 3. Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the Dashboard

### 4. Brevo Setup

1. Sign up at [Brevo](https://www.brevo.com)
2. Go to SMTP & API > API Keys
3. Generate a new API key

### 5. Backend Configuration

```bash
cd backend
npm install
```

Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
PORT=5000
NODE_ENV=development

# Firebase credentials from service account JSON
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Brevo credentials
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Nigeria Farmers Market

FRONTEND_URL=http://localhost:3000
```

Start the backend server:
```bash
npm run dev
```

Server will run on http://localhost:5000

### 6. Frontend Configuration

```bash
cd frontend
npm install
```

Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` with your Firebase web app credentials:
```env
# Get these from Firebase Console > Project Settings > General > Your apps
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm start
```

Frontend will run on http://localhost:3000

### 7. Firebase Cloud Functions (Optional)

```bash
cd functions
npm install
```

Configure Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

Set environment variables:
```bash
firebase functions:config:set brevo.apikey="your-api-key"
firebase functions:config:set brevo.sender_email="noreply@yourdomain.com"
firebase functions:config:set app.url="https://yourdomain.com"
```

Deploy functions:
```bash
firebase deploy --only functions
```

## 🚀 Deployment

### Backend Deployment (Heroku, Railway, or similar)

1. Create a new app on your hosting platform
2. Set all environment variables from `.env`
3. Deploy the backend folder

### Frontend Deployment (Vercel, Netlify, or Firebase Hosting)

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy the `build` folder to your hosting platform
3. Set environment variables

### Firebase Hosting (Recommended)

```bash
firebase init hosting
firebase deploy --only hosting
```

## 📱 PWA Installation

Users can install the app on their devices:

1. **Mobile (Android/iOS)**:
   - Visit the website in Chrome/Safari
   - Tap "Add to Home Screen"

2. **Desktop**:
   - Visit the website in Chrome/Edge
   - Click the install icon in the address bar

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create user profile
- `GET /api/auth/profile` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/verify` - Verify email

### Listings
- `GET /api/listings` - Get all listings (with filters)
- `GET /api/listings/:id` - Get single listing
- `POST /api/listings` - Create listing (farmer)
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `GET /api/listings/my/listings` - Get farmer's listings

### Orders
- `POST /api/orders` - Create order (buyer)
- `GET /api/orders/buyer` - Get buyer's orders
- `GET /api/orders/farmer` - Get farmer's orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/conversation/:id` - Get messages
- `GET /api/messages/unread/count` - Get unread count

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:uid/status` - Update user status
- `GET /api/admin/listings` - Get all listings
- `PUT /api/admin/listings/:id/moderate` - Moderate listing

## 🌐 Future Enhancements

### SMS/USSD Integration

The platform is architected to support SMS and USSD access:

1. **Africa's Talking Integration**: Endpoints for USSD menu system
2. **SMS Commands**: Basic commands like LIST, ORDERS, HELP
3. **Webhook Handlers**: Already implemented in Cloud Functions

Example USSD flow:
```
*123# - Main menu
1 - View Available Produce
2 - Check My Orders
3 - Contact Support
```

### Planned Features
- [ ] Payment integration (Paystack/Flutterwave)
- [ ] GPS-based location services
- [ ] Multi-language support (Hausa, Yoruba, Igbo)
- [ ] Ratings and reviews system
- [ ] Delivery tracking
- [ ] Mobile apps (React Native)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For support or questions:
- Email: support@farmersmarket.ng
- Phone: 080-FARMERS-MKT

## 🙏 Acknowledgments

- Built to address food insecurity in Nigeria
- Inspired by the resilience of smallholder farmers
- Optimized for low-bandwidth environments

---

**Built with ❤️ for Nigerian farmers and buyers**
