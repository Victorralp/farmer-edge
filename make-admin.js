#!/usr/bin/env node

// Simple script to make a user admin
// Run: node make-admin.js

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs, updateDoc } = require('firebase/firestore');

// Firebase config from your .env
const firebaseConfig = {
  apiKey: "AIzaSyB9ADIZ6wNZCcaFvPCsWWhhMjt3YbkaKRw",
  authDomain: "farmer-edge.firebaseapp.com",
  projectId: "farmer-edge",
  storageBucket: "farmer-edge.firebasestorage.app",
  messagingSenderId: "513334243484",
  appId: "1:513334243484:web:eccd4e83b77bbf3d807d59"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const targetEmail = 'victorralph407@gmail.com';

async function makeAdmin() {
  try {
    console.log(`🔍 Looking for user: ${targetEmail}...`);
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', targetEmail));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.error('❌ User not found!');
      console.log('Please register at http://localhost:3000/register first.');
      process.exit(1);
    }
    
    const userDoc = snapshot.docs[0];
    await updateDoc(userDoc.ref, { role: 'admin' });
    
    console.log('✅ Success! User is now an admin!');
    console.log('🔄 Refresh your browser to access /admin');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeAdmin();
