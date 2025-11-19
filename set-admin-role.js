// Set user as admin using Firestore
const admin = require('firebase-admin');

// Initialize with application default credentials
admin.initializeApp({
  projectId: 'farmer-edge'
});

const db = admin.firestore();
const email = 'victorralph407@gmail.com';

async function setAdmin() {
  try {
    console.log(`Looking for user: ${email}...`);
    
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (usersSnapshot.empty) {
      console.error('❌ User not found. Make sure you have registered first!');
      process.exit(1);
    }
    
    const userDoc = usersSnapshot.docs[0];
    await userDoc.ref.update({ role: 'admin' });
    
    console.log(`✅ Success! User ${email} is now an admin!`);
    console.log('Refresh your browser to see the changes.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setAdmin();
