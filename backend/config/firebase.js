const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// This is used for server-side operations like verifying tokens and accessing Firestore
const initializeFirebase = () => {
  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log('✓ Firebase Admin initialized successfully');
    return admin;
  } catch (error) {
    console.error('✗ Error initializing Firebase Admin:', error.message);
    throw error;
  }
};

const getFirestore = () => {
  return admin.firestore();
};

const getAuth = () => {
  return admin.auth();
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  admin,
};
