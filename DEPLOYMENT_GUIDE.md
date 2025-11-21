# Deployment Guide - Firestore Rules

## ⚠️ CRITICAL: Rules Must Be Deployed

Your Firestore security rules have been updated locally in `firestore.rules`, but **they are NOT active in Firebase yet**. 

You must deploy them manually to Firebase Console for the app to work.

## How to Deploy Rules to Firebase

### Option 1: Using Firebase CLI (Recommended)
```bash
cd "c:\Users\Welcome\supremee - Copy"
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### Option 2: Using Firebase Console (Manual)
1. Go to https://console.firebase.google.com
2. Select your project: **supreme-assets-98ab6**
3. Navigate to **Firestore Database** > **Rules** tab
4. Click **Edit Rules**
5. Copy the entire content from `firestore.rules` file in your project
6. Paste it into the Firebase Console Rules editor
7. Click **Publish**

## What Rules Are Being Deployed

```firestore
- Users: Can read/write own documents, admins can manage all
- Customers: All authenticated users can READ, only admins can CREATE/UPDATE/DELETE
- Companies: All authenticated users can READ, only admins can CREATE/UPDATE/DELETE  
- Products: All authenticated users can READ, only admins can CREATE/UPDATE/DELETE
```

## After Deployment

Once rules are deployed:
1. All authenticated users can read products, customers, companies
2. Only admins (users with role='admin') can create/update/delete
3. The "Missing or insufficient permissions" errors will be resolved
4. Customer add/delete will start working

## Current Error Status

```
Error: FirebaseError: Missing or insufficient permissions
Location: customers.tsx:111 (loadCustomers function)
Reason: Firestore rules not deployed to Firebase
```

## Next Steps

1. **Deploy rules using one of the methods above**
2. **Refresh the app in browser** (Ctrl+R or Cmd+R)
3. **Customer add/delete should now work**
4. If still not working, check browser console for more detailed logs

## Verification

After deployment, you should see:
- No more "Missing or insufficient permissions" errors
- Console logs showing successful customer operations
- Customers list loading properly
- Add/Delete buttons working
