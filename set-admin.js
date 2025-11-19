// Quick script to set a user as admin
// Usage: node set-admin.js <user-email>

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const email = process.argv[2];

if (!email) {
  console.error('Usage: node set-admin.js <user-email>');
  process.exit(1);
}

async function setAdmin() {
  try {
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (usersSnapshot.empty) {
      console.error('User not found');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    await userDoc.ref.update({ role: 'admin' });
    
    console.log(`✅ User ${email} is now an admin!`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setAdmin();
