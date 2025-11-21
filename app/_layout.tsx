import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { RootSiblingParent } from 'react-native-root-siblings';
import { User } from '../types';
import { initializeAppData } from '../utils/initializeApp';
import { autoFixUserIdMismatch } from '../utils/migrate';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utils/firebase';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('[App] Initializing app data...');
        await initializeAppData();
        console.log('[App] App data initialized');
      } catch (error) {
        console.error('[App] Error initializing app data:', error);
      }
    };
    
    initApp();
  }, []);

  useEffect(() => {
    console.log('[App] Setting up Firebase Auth listener');
    
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('[App] Firebase user authenticated:', firebaseUser.uid);
          
          // Auto-fix any user ID mismatches
          console.log('[App] Checking for user ID mismatches...');
          await autoFixUserIdMismatch();
          
          // Import getCurrentUser to get fresh user data from Firestore
          const { getCurrentUser } = await import('../utils/auth');
          const appUser = await getCurrentUser();
          
          if (appUser) {
            console.log('[App] User loaded:', appUser.email);
            setUser(appUser);
            // Navigate based on user role
            if (appUser.role === 'admin') {
              router.replace('/admin');
            } else {
              router.replace('/(tabs)');
            }
          } else {
            console.log('[App] Failed to load user data');
            router.replace('/login');
          }
        } else {
          console.log('[App] No Firebase user - redirecting to login');
          setUser(null);
          router.replace('/login');
        }
      } catch (error) {
        console.error('[App] Error in auth state change:', error);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <RootSiblingParent>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
        <Stack.Screen 
          name="add-product" 
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Add Product'
          }}
        />
        <Stack.Screen 
          name="library/company/[id]" 
          options={{ headerShown: true, title: 'Products' }}
        />
        <Stack.Screen 
          name="library/product/[id]" 
          options={{ headerShown: true, title: 'Product Details' }}
        />
      </Stack>
    </RootSiblingParent>
  );
}
