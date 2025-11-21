import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../../utils/auth';

export default function AdminLayout() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 12 }}>
            <Ionicons name="log-out-outline" size={22} color="#F44336" />
          </TouchableOpacity>
        ),
        headerTitleStyle: { fontSize: 18, fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen
        name="customers"
        options={{ headerShown: true, title: 'Customers' }}
      />
      <Stack.Screen
        name="companies"
        options={{ headerShown: true, title: 'Companies' }}
      />
      <Stack.Screen
        name="products"
        options={{ headerShown: true, title: 'Products' }}
      />
      <Stack.Screen
        name="repairs"
        options={{ headerShown: true, title: 'Repairs' }}
      />
      <Stack.Screen
        name="product-detail"
        options={{ headerShown: true, title: 'Product Detail' }}
      />
    </Stack>
  );
}