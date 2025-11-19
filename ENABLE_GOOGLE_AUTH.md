# Enable Google Authentication

## Quick Setup (2 minutes)

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/farmer-edge/authentication/providers

2. **Enable Google Sign-In:**
   - Click on "Google" in the providers list
   - Toggle the "Enable" switch
   - Select your email as the support email
   - Click "Save"

3. **Done!** Refresh your app and you'll see "Continue with Google" buttons on:
   - Login page: http://localhost:3000/login
   - Register page: http://localhost:3000/register

## What's Added

✅ Google login button on Login page
✅ Google signup button on Register page
✅ Automatic profile creation for new Google users
✅ Default role: "buyer" (can be changed in Firestore)
✅ Google profile photo saved

## Making a Google User Admin

After signing in with Google:
1. Go to: https://console.firebase.google.com/project/farmer-edge/firestore/data/users
2. Find your user document (by email)
3. Change the `role` field to `admin`
4. Refresh your browser
5. Access: http://localhost:3000/admin

## Features

- One-click authentication
- No password needed
- Profile auto-populated from Google
- Secure Firebase authentication
- Works on all devices
