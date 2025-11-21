# Debugging Checklist for Customer Management

## Current Issues
1. ❌ Customer list not showing in admin screen (even though form allows add)
2. ❌ Firebase Auth email already exists error when creating customer
3. ⚠️ Need to verify product deletion works
4. ⚠️ Need to verify QR scanning works

## What We Know Works
✅ Firestore rules allow authenticated users to read 'customers' collection
✅ loadCustomers() function has deep logging
✅ Alert.prompt error fixed (replaced with Alert.alert)
✅ handleAddCustomer creates both Firebase Auth user and Firestore documents

## Steps to Debug Customer Loading

### 1. Check if Customers Exist in Firestore
- Go to Firebase Console
- Navigate to Firestore Database
- Look in the `customers` collection
- **Expected:** Should see customer documents with structure:
  ```
  {
    uid: "...",
    name: "...",
    email: "...",
    clinicName: "...",
    password: "...",
    productCount: 0,
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
  ```

### 2. Check Console Logs When Admin Page Loads
Expected logs:
```
[LoadCustomers] Starting to load customers from Firestore...
[LoadCustomers] Query snapshot received, docs count: X
[LoadCustomers] Processing customer doc: customer-id-1 { ... }
```

If you don't see these logs:
- Check browser console (if testing web)
- Check mobile device logs (if testing on device)
- Ensure the admin page actually loads the component

### 3. Test Customer Creation Flow
1. Open admin/customers page
2. Click "Add Customer" button
3. Fill in form:
   - Name: Test Customer 1
   - Email: testcustomer1@example.com
   - Password: password123
   - Clinic: Test Clinic
4. Click "Add Customer"
5. Watch console for logs:
   ```
   [Customer] Creating Firebase Auth user: testcustomer1@example.com
   [Customer] Firebase Auth user created with UID: xxxxxx
   [Customer] User document created in users collection
   [Customer] Customer document created in customers collection
   ```

### 4. Verify Firebase Auth
- Go to Firebase Console
- Navigate to Authentication > Users
- **Expected:** Should see the new user (e.g., testcustomer1@example.com)
- **Check:** Verify UID is stored in the customer document

### 5. Verify Firestore Documents
- Check `/customers` collection for new document
- Check `/users/{uid}` for user document with role='customer'
- Verify both have matching UID

### 6. Check Firestore Rules
The rules should allow:
- Any authenticated user: read from 'customers' collection
- Only admins: create, update, delete in 'customers' collection

Current rules in firestore.rules line 35-38:
```
match /customers/{customerId} {
  allow read: if isAuthenticated();
  allow create, update, delete: if isAdmin();
}
```

## Test Scenarios

### Scenario 1: List existing customers (once created)
1. Log in as admin
2. Go to admin/customers
3. **Expected:** See list of all customers
4. **Check logs:** [LoadCustomers] messages should appear

### Scenario 2: Create new customer
1. Click "Add Customer"
2. Fill form
3. Click "Add Customer"
4. **Expected:** Alert saying "Customer created successfully"
5. **Check logs:** All [Customer] messages should appear
6. **Check Firestore:** Customer document should exist in customers collection
7. **Check Firebase Auth:** New user should appear in Authentication

### Scenario 3: Delete customer
1. In customer list, click delete button on a customer
2. Confirm deletion in modal
3. **Expected:** Customer removed from list and Firestore
4. **Check Firestore:** Customer document should be deleted
5. **Check Firebase Auth:** User should be deleted from Authentication

## Known Limitations
1. Passwords stored as plain text in Firestore (security concern)
2. Product count not automatically updated on product creation/deletion
3. Users must be created with email as unique identifier

## Next Steps
1. Create test customer via admin interface
2. Verify in Firebase Console that documents exist
3. If still not showing, check browser/device console for actual errors
4. Verify admin user is actually marked as 'admin' role in users collection
