import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  getAuth
} from 'firebase/auth';

const ADMIN_EMAIL = 'supreme@gmail.com';
const ADMIN_PASSWORD = 'supreme';

/**
 * Initializes the admin user in Firebase Auth and Firestore
 * This should be called once when the app first loads
 */
export const ensureAdminUserExists = async (): Promise<void> => {
  try {
    console.log('[Init] Checking if admin user exists...');
    
    // Try to sign in with admin credentials
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('[Init] Admin user already exists');
      
      // Sign out after checking
      await signOut(auth);
      return;
    } catch (error: any) {
      // If user doesn't exist, create them
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        console.log('[Init] Admin user not found, creating...');
        
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            ADMIN_EMAIL,
            ADMIN_PASSWORD
          );
          
          const uid = userCredential.user.uid;
          console.log('[Init] Firebase Auth user created with UID:', uid);
          
          // Create admin document in Firestore
          const userRef = doc(db, 'users', uid);
          await setDoc(userRef, {
            email: ADMIN_EMAIL,
            name: 'Admin',
            role: 'admin',
            createdAt: new Date().toISOString(),
          });
          
          console.log('[Init] Admin user document created in Firestore');
          
          // Sign out after creation
          await signOut(auth);
        } catch (createError) {
          console.error('[Init] Error creating admin user:', createError);
          throw createError;
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('[Init] Error ensuring admin user exists:', error);
    // Don't throw - let the app continue, user can try to log in
  }
};

/**
 * Initializes app data and checks for required setup
 */
export const initializeAppData = async (): Promise<void> => {
  try {
    console.log('[Init] Starting app initialization...');
    
    // Ensure admin user exists
    await ensureAdminUserExists();
    
    console.log('[Init] App initialization complete');
  } catch (error) {
    console.error('[Init] App initialization error:', error);
  }
};
