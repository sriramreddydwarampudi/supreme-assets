import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCustomerProducts } from '../../utils/firebaseStorage';
import { getCurrentUser, logout } from '../../utils/auth';
import { CustomerProduct } from '../../types';

export default function HomeScreen() {
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [userName, setUserName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadData = async () => {
    const user = await getCurrentUser();
    if (user) {
      setUserName(user.name);
      const customerProducts = await getCustomerProducts(user.id);
      setProducts(customerProducts);
    } else {
      setProducts([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data whenever screen is focused (for status updates)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const workingCount = products.filter(p => p.status === 'working').length;
  const notWorkingCount = products.filter(p => p.status === 'not-working').length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.workingCard]}>
          <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
          <Text style={styles.statNumber}>{workingCount}</Text>
          <Text style={styles.statLabel}>Working</Text>
        </View>

        <View style={[styles.statCard, styles.notWorkingCard]}>
          <Ionicons name="close-circle" size={48} color="#F44336" />
          <Text style={styles.statNumber}>{notWorkingCount}</Text>
          <Text style={styles.statLabel}>Not Working</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/find')}
        >
          <Ionicons name="qr-code" size={32} color="#2196F3" />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Scan QR Code</Text>
            <Text style={styles.actionSubtitle}>Access product manual</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/add-product')}
        >
          <Ionicons name="add-circle" size={32} color="#4CAF50" />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Add Product</Text>
            <Text style={styles.actionSubtitle}>From product library</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No products yet</Text>
            <Text style={styles.emptySubtext}>
              Add products from the library
            </Text>
          </View>
        ) : (
          products.slice(0, 3).map(item => (
            <View key={item.id} style={styles.recentCard}>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{item.product.name}</Text>
                <Text style={styles.recentCompany}>{(item.product.companyNames || []).join(', ')}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'working' ? styles.workingBadge : styles.notWorkingBadge,
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status === 'working' ? '✓' : '✗'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  notWorkingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentCompany: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workingBadge: {
    backgroundColor: '#4CAF50',
  },
  notWorkingBadge: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
