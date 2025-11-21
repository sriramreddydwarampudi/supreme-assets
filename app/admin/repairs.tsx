import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllNonWorkingProducts, updateCustomerProduct } from '../../utils/firebaseStorage';
import { CustomerProduct } from '../../types';

interface NonWorkingProduct extends CustomerProduct {
  userId: string;
  userName: string;
  userEmail: string;
  clinicName?: string;
}

export default function ManageRepairsScreen() {
  const [products, setProducts] = useState<NonWorkingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<NonWorkingProduct | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadNonWorkingProducts();
  }, []);

  const loadNonWorkingProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const nonWorkingProducts = await getAllNonWorkingProducts();
      setProducts(nonWorkingProducts);
    } catch (err) {
      console.error('Error loading non-working products:', err);
      setError('Failed to load repair items');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNonWorkingProducts();
    setRefreshing(false);
  };

  const markAsFixed = async (product: NonWorkingProduct) => {
    try {
      await updateCustomerProduct(product.userId, product.id, {
        ...product,
        status: 'working',
      });
      await loadNonWorkingProducts();
      setModalVisible(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error updating product status:', err);
      setError('Failed to update product status');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="warning-outline" size={64} color="#ff9800" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNonWorkingProducts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Repairs</Text>
        <Text style={styles.subtitle}>{products.length} items needing repair</Text>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
          <Text style={styles.emptyText}>All products are working!</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => {
                setSelectedProduct(item);
                setModalVisible(true);
              }}
            >
              <View style={styles.productContent}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.clinicName}>{item.clinicName || item.userName}</Text>
                <Text style={styles.productEmail}>{item.userEmail}</Text>
                {item.serialNumber && (
                  <Text style={styles.serialNumber}>Serial: {item.serialNumber}</Text>
                )}
                {item.notes && <Text style={styles.notes}>Notes: {item.notes}</Text>}
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name="warning" size={24} color="#ff5252" />
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => `${item.userId}-${item.id}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {selectedProduct && (
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Product Details</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Product Name</Text>
                  <Text style={styles.detailValue}>{selectedProduct.product.name}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Customer</Text>
                  <Text style={styles.detailValue}>{selectedProduct.userName}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Clinic Name</Text>
                  <Text style={styles.detailValue}>
                    {selectedProduct.clinicName || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{selectedProduct.userEmail}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Serial Number</Text>
                  <Text style={styles.detailValue}>
                    {selectedProduct.serialNumber || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Purchase Date</Text>
                  <Text style={styles.detailValue}>{selectedProduct.purchaseDate}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>
                    {selectedProduct.notes || 'No notes provided'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.fixButton}
                onPress={() => markAsFixed(selectedProduct)}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.fixButtonText}>Mark as Fixed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ff5252',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productContent: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  clinicName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 2,
  },
  productEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  serialNumber: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  notes: {
    fontSize: 12,
    color: '#ff6b6b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  statusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  fixButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
  },
  fixButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
