# 🔥 Firestore Setup & Security Rules

## ⚠️ CRITICAL: You Must Set Up Firestore Security Rules

Without proper security rules, **all customer CRUD operations will fail silently**.

### Step 1: Go to Firebase Console

1. Open: https://console.firebase.google.com/
2. Select your project: `supreme-assets-98ab6`
3. Go to: **Firestore Database** (left menu)
4. Click: **Rules** tab

### Step 2a: START WITH TESTING RULES (Recommended)

Use the **"For Testing"** rules from the box below first. This allows everything to work so you can verify the setup.

Once everything is working, you can switch to the **"For Production"** rules for security.

**⚠️ IMPORTANT**: The testing rules are NOT secure and should only be used for development!

**For Testing** (use this first to verify everything works):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for now (TESTING ONLY)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**For Production** (use this after testing works):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || isOwner(userId);
    }
    
    // Companies collection
    match /companies/{companyId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Customers collection
    match /customers/{customerId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // Customer Products collection (subcollections under users)
    match /users/{userId}/products/{productId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create, update, delete: if isAuthenticated() && isOwner(userId);
    }
  }
}
```

### Step 3: Copy & Paste Your Rules

Copy ONE of the rule sets above (start with "For Testing") and paste it completely into the Rules editor in Firebase Console.

### Step 4: Click "Publish"

The rules should now be live.

### Step 5: Verify in Firebase Console

1. Go to Firestore Database
2. You should now see a **"customers"** collection (it will auto-create when you add the first customer)
3. Customers should appear there when you use the app

---

## ✅ Testing Your Setup

After setting rules, test these operations:

1. **Add Customer**: Click "Add Customer" button
   - Fill form with test data (name, email, password, clinic)
   - Should see success alert
   - Check Firebase Console → Firestore → `customers` collection
   - New document should appear with fields: firebaseUid, name, email, clinicName, createdAt

2. **Delete Customer**: Click trash icon
   - Should disappear from list immediately
   - Check Firestore - document should be gone

3. **Refresh**: Pull down on customer list
   - Should reload from Firestore

---

## 🔐 Production Security Rules (Later)

When you're ready for production, use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Customers collection
    match /customers/{document=**} {
---

## 🛠️ Troubleshooting

### "No customers appear in the list"
- Check Firestore security rules are published ✓
- Check `customers` collection exists in Firestore
- Check browser console for errors

### "Delete button doesn't work"
- Check security rules allow `delete`
- Check console for error messages

### "Adding customer shows success but doesn't appear"
- Check Firestore security rules
- Check Firestore → `customers` collection
- Look for new documents

---

## 📊 Firestore Structure Expected

```
Firestore
└── customers (collection)
    ├── doc1 (auto-generated ID)
    │   ├── firebaseUid: "abc123"
    │   ├── name: "Ram"
    │   ├── email: "ram@gmail.com"
    │   ├── clinicName: ""
    │   ├── productCount: 0
    │   └── createdAt: timestamp
    │
    ├── doc2
    │   └── (same structure)
```

---

## 🚀 Current App Status

- ✅ Firebase Auth configured (users can be created)
- ✅ Firestore initialized in code
- ✅ Customer CRUD functions written
- ✅ Delete button fixed (async bug resolved)
- ⏳ **Firestore security rules - WAITING FOR YOU TO SET THEM**
- ⏳ `customers` collection - will auto-create when you add first customer

---

## 📝 What to Do Now

1. **Copy the "For Testing" rules** from Step 2 above
2. **Go to Firebase Console** → Firestore → Rules
3. **Paste the rules** and click Publish
4. **Try adding a customer** in the admin panel
5. **Check Firestore** to see if document was created
6. **Try deleting** to verify delete works
7. **Report any errors** you see

Once everything works, you can switch to the "For Production" rules for security!
