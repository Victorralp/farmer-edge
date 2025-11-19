# Deployment Guide

This guide covers deploying the Nigeria Farmers Market application to production.

## Prerequisites

- [ ] Firebase project created
- [ ] Cloudinary account setup
- [ ] Brevo account with API key
- [ ] Domain name (optional but recommended)

## 1. Firebase Setup

### Enable Required Services

1. **Authentication**
   ```bash
   # Enable Email/Password authentication in Firebase Console
   # Go to Authentication > Sign-in method > Email/Password > Enable
   ```

2. **Firestore Database**
   ```bash
   # Create Firestore database in Firebase Console
   # Choose production mode
   # Select appropriate region (closest to Nigeria)
   ```

3. **Deploy Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

### Service Account Setup

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file securely
4. Extract the values for environment variables

## 2. Backend Deployment

### Option A: Railway (Recommended)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Create New Project**
   ```bash
   cd backend
   railway init
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set PORT=5000
   railway variables set NODE_ENV=production
   railway variables set FIREBASE_PROJECT_ID="your-project-id"
   railway variables set FIREBASE_PRIVATE_KEY="your-private-key"
   railway variables set FIREBASE_CLIENT_EMAIL="your-client-email"
   railway variables set CLOUDINARY_CLOUD_NAME="your-cloud-name"
   railway variables set CLOUDINARY_API_KEY="your-api-key"
   railway variables set CLOUDINARY_API_SECRET="your-api-secret"
   railway variables set BREVO_API_KEY="your-brevo-key"
   railway variables set BREVO_SENDER_EMAIL="noreply@yourdomain.com"
   railway variables set BREVO_SENDER_NAME="Nigeria Farmers Market"
   railway variables set FRONTEND_URL="https://yourdomain.com"
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Option B: Heroku

1. **Create Heroku App**
   ```bash
   heroku create nigeria-farmers-market-api
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set PORT=5000
   heroku config:set NODE_ENV=production
   # ... set all other variables from .env
   ```

3. **Deploy**
   ```bash
   git subtree push --prefix backend heroku main
   ```

### Option C: Google Cloud Run

1. **Build Docker Image**
   ```bash
   cd backend
   docker build -t gcr.io/YOUR_PROJECT_ID/farmers-market-api .
   ```

2. **Push to Container Registry**
   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/farmers-market-api
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy farmers-market-api \
     --image gcr.io/YOUR_PROJECT_ID/farmers-market-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## 3. Frontend Deployment

### Option A: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard**
   - Go to Project Settings > Environment Variables
   - Add all REACT_APP_* variables

### Option B: Netlify

1. **Build the app**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=build
   ```

3. **Set Environment Variables**
   - Go to Site Settings > Build & Deploy > Environment
   - Add all REACT_APP_* variables

### Option C: Firebase Hosting

1. **Build the app**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy**
   ```bash
   cd ..
   firebase deploy --only hosting
   ```

## 4. Firebase Cloud Functions

1. **Set Function Configuration**
   ```bash
   firebase functions:config:set brevo.apikey="your-api-key"
   firebase functions:config:set brevo.sender_email="noreply@yourdomain.com"
   firebase functions:config:set app.url="https://yourdomain.com"
   ```

2. **Deploy Functions**
   ```bash
   firebase deploy --only functions
   ```

## 5. Database Initialization

### Create Initial Admin User

1. Register a user through the app
2. Get the user's UID from Firebase Console
3. Update the user's role in Firestore:
   ```javascript
   // In Firebase Console > Firestore
   users/{uid}
   {
     ...
     role: "admin"
   }
   ```

4. Or use Firebase CLI:
   ```bash
   firebase firestore:set users/USER_UID '{"role": "admin"}' --merge
   ```

## 6. Domain Configuration

### Custom Domain Setup

1. **For Firebase Hosting**
   ```bash
   firebase hosting:channel:deploy production
   # Follow instructions to add custom domain
   ```

2. **For Vercel/Netlify**
   - Add domain in project settings
   - Update DNS records with your domain registrar

### SSL Certificate

- Firebase Hosting: Automatic SSL provisioning
- Vercel/Netlify: Automatic SSL via Let's Encrypt
- Railway: Automatic SSL for custom domains

## 7. Environment-Specific Configuration

### Production Checklist

- [ ] All API keys are set in environment variables
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] Firebase security rules are deployed
- [ ] SSL certificate is active
- [ ] Custom domain is configured
- [ ] Error monitoring is set up
- [ ] Backup strategy is in place

### Update CORS Origins

In `backend/server.js`:
```javascript
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true,
}));
```

## 8. Monitoring & Maintenance

### Set Up Error Tracking

1. **Sentry (Recommended)**
   ```bash
   npm install @sentry/node @sentry/react
   ```

2. **Google Cloud Monitoring**
   - Enable in Google Cloud Console
   - Set up alerts for errors and performance

### Database Backups

1. **Firestore Backups**
   ```bash
   gcloud firestore export gs://YOUR_BUCKET_NAME
   ```

2. **Schedule Automated Backups**
   - Use Cloud Scheduler
   - Export to Cloud Storage daily

### Performance Monitoring

1. Enable Firebase Performance Monitoring
2. Set up Lighthouse CI for frontend
3. Monitor API response times

## 9. Post-Deployment Testing

### Test Checklist

- [ ] User registration works
- [ ] Email verification is sent
- [ ] Login/logout functionality
- [ ] Create listing (farmer)
- [ ] Browse marketplace (public)
- [ ] Place order (buyer)
- [ ] Order notifications sent
- [ ] Messaging system works
- [ ] Image upload to Cloudinary
- [ ] Admin panel accessible
- [ ] PWA installs correctly
- [ ] Offline mode works
- [ ] Mobile responsive design

### Load Testing

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 https://your-api-url.com/api/listings
```

## 10. Scaling Considerations

### Backend Scaling

- Enable auto-scaling on Railway/Heroku
- Use Redis for session management
- Implement connection pooling
- Consider CDN for static assets

### Frontend Optimization

- Enable gzip compression
- Optimize images (already using Cloudinary)
- Implement code splitting
- Use service worker caching

### Database Optimization

- Monitor Firestore usage
- Implement pagination for large lists
- Use composite indexes for complex queries
- Consider Firestore emulator for development

## 11. Security Hardening

### Backend Security

- [ ] Rate limiting enabled
- [ ] Helmet.js configured
- [ ] Input validation on all endpoints
- [ ] File upload size limits
- [ ] SQL injection protection (N/A for Firestore)
- [ ] XSS protection

### Firebase Security

- [ ] Firestore rules tested
- [ ] Authentication rules enforced
- [ ] Custom claims for roles
- [ ] API keys restricted in Firebase Console

## 12. Troubleshooting

### Common Issues

**"CORS Error"**
- Check FRONTEND_URL in backend .env
- Verify CORS configuration in server.js

**"Firebase Admin Error"**
- Verify private key format (include \n)
- Check service account permissions

**"Cloudinary Upload Failed"**
- Verify API credentials
- Check file size limits
- Ensure proper MIME types

**"Email Not Sent"**
- Verify Brevo API key
- Check sender email is verified in Brevo
- Review Brevo dashboard for errors

### Logs

**Backend Logs**
```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# Google Cloud Run
gcloud run logs read
```

**Firebase Functions Logs**
```bash
firebase functions:log
```

## Support

For deployment issues, contact:
- Email: support@farmersmarket.ng
- Documentation: https://docs.farmersmarket.ng

---

**Remember**: Always test in a staging environment before deploying to production!
