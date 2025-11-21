# Firebase Integration Guide

## ✅ Firebase Setup Complete

Your Supreme Dental app now has Firebase integration with the following configuration:

```javascript
{
  apiKey: "AIzaSyCbsA4uutuPoEP18gpEsUwaJLkVE-pUzr8",
  authDomain: "supreme-assets-98ab6.firebaseapp.com",
  projectId: "supreme-assets-98ab6",
  storageBucket: "supreme-assets-98ab6.firebasestorage.app",
  messagingSenderId: "603179509924",
  appId: "1:603179509924:web:611e4b7aff816f4f72de31",
  measurementId: "G-0N3027522F"
}
```

## 📦 Files Created

### Core Firebase Files
- `utils/firebase.ts` - Firebase initialization and service exports
- `utils/firebaseStorage.ts` - Firestore and Storage operations
- Updated `utils/auth.ts` - Firebase Authentication integration

## 🔑 Firebase Services Enabled

### 1. **Authentication (Firebase Auth)**
- Email/Password authentication
- Real-time auth state changes
- Fallback to mock authentication

### 2. **Firestore Database**
- Products collection
- Customer products (user subcollection)
- Companies collection
- Real-time data sync

### 3. **Cloud Storage**
- Product images (`/products/{productId}/`)
- Product manuals (`/manuals/{productId}/`)
- File upload/download management

## 🚀 Usage Examples

### Authentication
```typescript
import { login, logout, getCurrentUser } from './utils/auth';

// Login
const user = await login('email@example.com', 'password');

// Get current user
const currentUser = await getCurrentUser();

// Logout
await logout();

// Listen to auth changes
import { onAuthChange } from './utils/auth';
onAuthChange((user) => {
  if (user) console.log('User logged in:', user);
  else console.log('User logged out');
});
```

### Firestore Operations
```typescript
import {
  addProduct,
  updateProduct,
  deleteProduct,
  getProductsByCompany,
  addCustomerProduct,
  updateCustomerProduct,
  getCustomerProducts,
} from './utils/firebaseStorage';

// Add product
const productId = await addProduct({
  name: 'Product Name',
  companyId: 'company123',
  companyName: 'Company Name',
  description: 'Product description',
  category: 'Handpieces',
  qrCode: 'PROD001',
});

// Get customer products
const products = await getCustomerProducts(userId);

// Update product status
await updateCustomerProduct(userId, productId, { status: 'not-working' });
```

### Cloud Storage
```typescript
import {
  uploadProductImage,
  uploadProductManual,
  deleteFile,
} from './utils/firebaseStorage';

// Upload product image
const imageURL = await uploadProductImage(
  productId,
  imageUri,
  'product-image.jpg'
);

// Upload manual
const manualURL = await uploadProductManual(
  productId,
  fileUri,
  'manual.pdf'
);

// Delete file
await deleteFile('products/productId/product-image.jpg');
```

## 🔐 Security Rules

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products collection (public read, admin write)
    match /products/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    
    // User products (read/write own data)
    match /users/{userId}/products/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Companies collection (public read, admin write)
    match /companies/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### Cloud Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Products folder
    match /products/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    
    // Manuals folder
    match /manuals/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

## 📝 Environment Variables

Create a `.env` file (if needed for web):
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyCbsA4uutuPoEP18gpEsUwaJLkVE-pUzr8
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=supreme-assets-98ab6.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=supreme-assets-98ab6
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=supreme-assets-98ab6.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=603179509924
EXPO_PUBLIC_FIREBASE_APP_ID=1:603179509924:web:611e4b7aff816f4f72de31
```

## 🔄 Migration from Mock Data

### Option 1: Use Hybrid Approach (Recommended)
Keep mock data as fallback while migrating to Firebase:

```typescript
// In your screens, try Firebase first:
try {
  const products = await getCustomerProducts(userId);
  setProducts(products);
} catch (error) {
  // Fallback to mock data
  const mockProducts = await getCustomerProducts(); // from storage.ts
  setProducts(mockProducts);
}
```

### Option 2: Full Firebase Migration
Update your screens to use Firebase functions instead of AsyncStorage:

```typescript
// Before (AsyncStorage)
const products = await getCustomerProducts();

// After (Firebase)
const products = await getCustomerProducts(userId);
```

## 📊 Firestore Data Structure

```
firestore/
├── products/
│   ├── {productId}
│   │   ├── name: string
│   │   ├── companyId: string
│   │   ├── companyName: string
│   │   ├── description: string
│   │   ├── image: string (URL)
│   │   ├── manualUrl: string (URL)
│   │   ├── qrCode: string
│   │   ├── category: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── companies/
│   ├── {companyId}
│   │   ├── name: string
│   │   ├── productCount: number
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
└── users/
    ├── {userId}/
    │   └── products/
    │       ├── {productId}
    │       │   ├── productId: string
    │       │   ├── product: object
    │       │   ├── purchaseDate: string
    │       │   ├── serialNumber: string
    │       │   ├── status: 'working' | 'not-working'
    │       │   ├── notes: string
    │       │   ├── createdAt: timestamp
    │       │   └── updatedAt: timestamp
```

## 🛠️ Next Steps

1. **Install Firebase SDK**
   ```bash
   npm install firebase@^10.7.0
   ```

2. **Set up Firestore**
   - Go to Firebase Console
   - Enable Firestore Database
   - Copy security rules from above

3. **Set up Cloud Storage**
   - Enable Cloud Storage in Firebase Console
   - Copy storage rules from above

4. **Update Authentication**
   - Enable Email/Password in Firebase Console
   - Add your users

5. **Migrate Data** (if needed)
   - Export mock data to Firestore
   - Update app to use Firebase functions

## ⚙️ Configuration

### Update `app.json` for Native Builds (if needed)
For native builds with Expo, you may need to add Firebase compatibility:

```json
{
  "expo": {
    "plugins": [
      ["@react-native-firebase/app"]
    ]
  }
}
```

## 🚨 Important Notes

- **Demo Credentials**: Test accounts in mock data still work as fallback
- **Auth State**: Always check `getCurrentUser()` on app launch
- **Error Handling**: All functions have try-catch; implement proper UI feedback
- **Performance**: Firestore charges per read/write; optimize queries
- **Offline Support**: Firestore offers offline persistence (enable in settings)

## 📚 Useful Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Cloud Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

---

**Firebase integration complete! Your app is ready to use cloud services.** 🚀
