import React, { useState, useEffect } from 'react';
import Toast from 'react-native-root-toast';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductCard } from '../components/ProductCard';
import { Product, CustomerProduct } from '../types';
import { getAllProducts, addCustomerProduct } from '../utils/firebaseStorage';
import { getCurrentUser } from '../utils/auth';

export default function AddProductScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    console.log('[AddProduct] Component mounted, loading products');
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      console.log('[AddProduct] Starting to load all products from Firestore');
      setProductsLoading(true);
      const productsData = await getAllProducts();
      console.log(`[AddProduct] Successfully loaded ${productsData.length} products from Firestore`);
      setProducts(productsData);
    } catch (error) {
      console.error('[AddProduct] Error loading products from Firestore:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setProductsLoading(false);
      console.log('[AddProduct] Product loading finished');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.companyNames || []).join(', ').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async () => {
    console.log('[AddProduct] handleAddProduct called');

    if (!selectedProduct) {
      console.warn('[AddProduct] No product selected');
      Alert.alert('Error', 'Please select a product');
      return;
    }

    if (loading) {
      console.warn('[AddProduct] Already saving, ignoring duplicate request');
      return;
    }

    setLoading(true);
    console.log('[AddProduct] Starting add product flow');

    try {
      console.log('[AddProduct] Fetching current user from auth');
      const user = await getCurrentUser();
      console.log('[AddProduct] Current user:', user);

      if (!user) {
        console.error('[AddProduct] No user found');
        Alert.alert('Error', 'You must be logged in to add products');
        return;
      }

      const userId = user.id;
      console.log(`[AddProduct] Using userId: ${userId}`);

      if (!userId) {
        console.error('[AddProduct] User object missing id:', user);
        Alert.alert('Error', 'User ID missing');
        return;
      }

      // Always include serialNumber and notes (as empty string if not provided)
      const newProduct: Omit<CustomerProduct, 'id'> = {
        productId: selectedProduct.id,
        product: selectedProduct,
        purchaseDate: new Date().toISOString(),
        status: 'working',
        serialNumber: serialNumber || '',
        notes: notes || '',
      };

      console.log('[AddProduct] Product data to add:', newProduct);
      console.log(`[AddProduct] Calling addCustomerProduct with userId: ${userId}`);

      const productId = await addCustomerProduct(userId, newProduct);
      console.log(`[AddProduct] Successfully added product with id: ${productId}`);

      Toast.show(`✅ ${selectedProduct.name} added successfully!`, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        backgroundColor: '#2196F3',
        textColor: '#fff',
      });
      setSelectedProduct(null);
      setSerialNumber('');
      setNotes('');
      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (error) {
      console.error('[AddProduct] Error adding product:', error);
      const err = error as any;
      Alert.alert(
        'Error',
        err.message || 'Failed to add product. Please try again.'
      );
    } finally {
      setLoading(false);
      console.log('[AddProduct] Add product flow finished');
    }
  };

  if (productsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={(text) => {
            console.log(`[AddProduct] Search query changed to: ${text}`);
            setSearchQuery(text);
          }}
          placeholderTextColor="#ccc"
        />
      </View>

      {selectedProduct && (
        <View style={styles.selectedContainer}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedLabel}>✓ Selected Product:</Text>
            <TouchableOpacity
              onPress={() => {
                console.log('[AddProduct] Deselecting product');
                setSelectedProduct(null);
              }}
            >
              <Ionicons name="close-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.selectedName}>{selectedProduct.name}</Text>
          <Text style={styles.selectedCompany}>{(selectedProduct.companyNames || []).join(', ')}</Text>
          {selectedProduct.category && (
            <Text style={styles.selectedCategory}>Category: {selectedProduct.category}</Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Serial Number (optional)"
            value={serialNumber}
            onChangeText={(text) => {
              console.log(`[AddProduct] Serial number changed to: ${text}`);
              setSerialNumber(text);
            }}
            editable={!loading}
            placeholderTextColor="#ccc"
          />

          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes (optional)"
            value={notes}
            onChangeText={(text) => {
              console.log(`[AddProduct] Notes changed to: ${text}`);
              setNotes(text);
            }}
            editable={!loading}
            multiline
            numberOfLines={3}
            placeholderTextColor="#ccc"
          />

          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddProduct}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add to My Products</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => {
              console.log(`[AddProduct] Selected product: ${item.id} - ${item.name}`);
              setSelectedProduct(item);
            }}
            showQR={false}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
            {searchQuery && (
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  selectedContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  selectedName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  selectedCompany: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 2,
  },
  selectedCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  notesInput: {
    minHeight: 80,
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#90CAF9',
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
});
