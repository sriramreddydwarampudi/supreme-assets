import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Migrate user data from old user ID to Firebase Auth UID
 * This fixes the issue where AsyncStorage has a different user ID than Firebase Auth
 */
export const migrateUserDataToFirebaseUID = async (
  oldUserId: string,
  newUserId: string
): Promise<void> => {
  try {
    console.log('[Migration] Starting migration from', oldUserId, 'to', newUserId);
    
    // Check if old user document exists
    const oldUserRef = doc(db, 'users', oldUserId);
    const oldUserSnap = await getDoc(oldUserRef);
    
    if (!oldUserSnap.exists()) {
      console.log('[Migration] Old user document does not exist, nothing to migrate');
      return;
    }
    
    // Check if new user document exists
    const newUserRef = doc(db, 'users', newUserId);
    const newUserSnap = await getDoc(newUserRef);
    
    console.log('[Migration] Old user data exists:', oldUserSnap.data());
    console.log('[Migration] New user document exists:', newUserSnap.exists());
    
    // If new user document doesn't exist, copy the old one
    if (!newUserSnap.exists()) {
      console.log('[Migration] Creating new user document with data from old document');
      const oldData = oldUserSnap.data();
      await setDoc(newUserRef, oldData);
      console.log('[Migration] New user document created');
    }
    
    // Migrate products from old user to new user
    const oldProductsRef = collection(db, 'users', oldUserId, 'products');
    const oldProductsSnap = await getDocs(oldProductsRef);
    
    if (!oldProductsSnap.empty) {
      console.log('[Migration] Found', oldProductsSnap.size, 'products to migrate');
      
      for (const productDoc of oldProductsSnap.docs) {
        const productData = productDoc.data();
        const newProductRef = doc(db, 'users', newUserId, 'products', productDoc.id);
        
        console.log('[Migration] Migrating product:', productDoc.id);
        await setDoc(newProductRef, productData);
      }
      
      console.log('[Migration] All products migrated successfully');
    } else {
      console.log('[Migration] No products to migrate');
    }
    
    // Delete old user document (optional - you can keep it for backup)
    // await deleteDoc(oldUserRef);
    
    console.log('[Migration] Migration completed successfully');
  } catch (error) {
    console.error('[Migration] Error during migration:', error);
    throw error;
  }
};

/**
 * Check and auto-fix user ID mismatches
 * Call this during app initialization
 */
export const autoFixUserIdMismatch = async (): Promise<void> => {
  try {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      console.log('[Migration] No Firebase user authenticated, skipping auto-fix');
      return;
    }
    
    console.log('[Migration] Checking for user ID mismatch...');
    console.log('[Migration] Firebase UID:', firebaseUser.uid);
    
    // Get the user document with Firebase UID
    const firebaseUserRef = doc(db, 'users', firebaseUser.uid);
    const firebaseUserSnap = await getDoc(firebaseUserRef);
    
    if (firebaseUserSnap.exists()) {
      console.log('[Migration] User document exists with Firebase UID, no migration needed');
      return;
    }
    
    // Firebase UID document doesn't exist, look for documents with matching email
    console.log('[Migration] Firebase UID document does not exist, checking by email...');
    
    const allUsersSnap = await getDocs(collection(db, 'users'));
    let oldUserId: string | null = null;
    
    for (const userDoc of allUsersSnap.docs) {
      const userData = userDoc.data();
      if (userData.email === firebaseUser.email) {
        oldUserId = userDoc.id;
        console.log('[Migration] Found existing user document with mismatched ID:', oldUserId);
        break;
      }
    }
    
    if (oldUserId && oldUserId !== firebaseUser.uid) {
      console.log('[Migration] Detected ID mismatch! Old:', oldUserId, 'New:', firebaseUser.uid);
      await migrateUserDataToFirebaseUID(oldUserId, firebaseUser.uid);
    }
  } catch (error) {
    console.error('[Migration] Error during auto-fix:', error);
    // Don't throw - this is a safety check, app should continue even if it fails
  }
};
