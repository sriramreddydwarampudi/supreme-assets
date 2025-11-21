import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  getAuth,
  onAuthStateChanged,
} from 'firebase/auth';

const USER_KEY = '@supreme_user';
const auth = getAuth();

// Admin credentials for Firebase Auth
const ADMIN_EMAIL = 'supreme@gmail.com';
const ADMIN_PASSWORD = 'supreme';

export const login = async (email: string, password: string): Promise<User | null> => {
  try {
    console.log('[Auth] Login attempt with email:', email);
    
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('[Auth] Firebase auth successful, UID:', firebaseUser.uid);
    
    // Get user role from Firestore using direct document access
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      console.log('[Auth] No user document found in Firestore for UID:', firebaseUser.uid);
      
      // Auto-create user document if it doesn't exist (fallback)
      console.log('[Auth] Creating user document...');
      const defaultRole = email === ADMIN_EMAIL ? 'admin' : 'customer';
      
      await setDoc(userDocRef, {
        email: firebaseUser.email || email,
        name: 'User',
        role: defaultRole,
        createdAt: new Date().toISOString(),
      });
      
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: 'User',
        role: defaultRole,
      };
      
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log('[Auth] User stored with correct Firebase UID:', firebaseUser.uid);
      return user;
    }
    
    const userData = userDocSnap.data();
    
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || email,
      name: userData.name || 'User',
      role: userData.role || 'customer',
      clinicName: userData.clinicName,
    };
    
    console.log('[Auth] User logged in with UID:', user.id, 'Email:', user.email);
    // IMPORTANT: Always use Firebase UID, not any stored ID
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    console.log('[Auth] Logout attempt');
    await signOut(auth);
    await AsyncStorage.removeItem(USER_KEY);
    console.log('[Auth] Logout successful');
  } catch (error) {
    console.error('[Auth] Logout error:', error);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // First, try to get the actual Firebase authenticated user
    const firebaseUser = auth.currentUser;
    console.log('[Auth] Firebase current user:', firebaseUser?.uid, firebaseUser?.email);
    
    if (firebaseUser) {
      // Get user data from Firestore using the actual Firebase UID
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const user: User = {
          id: firebaseUser.uid, // ALWAYS use the actual Firebase UID
          email: firebaseUser.email || userData.email || '',
          name: userData.name || 'User',
          role: userData.role || 'customer',
          clinicName: userData.clinicName,
        };
        console.log('[Auth] Current user from Firestore (Firebase UID):', user.email, 'with UID:', user.id);
        // Update stored user to use correct Firebase UID
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      } else {
        console.log('[Auth] Firebase user exists but no Firestore document for UID:', firebaseUser.uid);
        // Create the Firestore document if it doesn't exist
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          role: 'customer',
          createdAt: new Date().toISOString(),
        });
        
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'User',
          role: 'customer',
        };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }
    }
    
    // If no Firebase user, check AsyncStorage but WARN about potential ID mismatch
    const userData = await AsyncStorage.getItem(USER_KEY);
    if (userData) {
      const storedUser = JSON.parse(userData);
      console.log('[Auth] WARNING: Using stored user (Firebase auth not ready yet):', storedUser.email, 'with ID:', storedUser.id);
      console.log('[Auth] NOTE: This may cause permission errors if ID does not match Firebase UID');
      return storedUser;
    }
    
    return null;
  } catch (error) {
    console.error('[Auth] Error getting current user:', error);
    // As last resort, return stored user
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (userData) {
        const storedUser = JSON.parse(userData);
        console.log('[Auth] Returning stored user as fallback:', storedUser.email);
        return storedUser;
      }
    } catch (fallbackError) {
      console.error('[Auth] Error getting fallback user:', fallbackError);
    }
    return null;
  }
};

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const createAdminUser = async (email: string, password: string, name: string): Promise<void> => {
  try {
    console.log('[Auth] Creating admin user with email:', email);
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('[Auth] Firebase user created with UID:', firebaseUser.uid);
    
    // Create Firestore user document
    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, {
      email: email,
      name: name,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    
    console.log('[Auth] Admin user document created in Firestore');
  } catch (error) {
    console.error('[Auth] Error creating admin user:', error);
    throw error;
  }
};

export const createCustomerUser = async (
  email: string, 
  password: string, 
  name: string,
  clinicName: string
): Promise<void> => {
  try {
    console.log('[Auth] Creating customer user with email:', email);
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('[Auth] Firebase user created with UID:', firebaseUser.uid);
    
    // Create Firestore user document
    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, {
      email: email,
      name: name,
      role: 'customer',
      clinicName: clinicName,
      createdAt: new Date().toISOString(),
    });
    
    console.log('[Auth] Customer user document created in Firestore');
  } catch (error) {
    console.error('[Auth] Error creating customer user:', error);
    throw error;
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (userData) {
        callback(JSON.parse(userData));
      }
    } else {
      callback(null);
    }
  });
};