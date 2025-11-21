import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Print from 'expo-print';
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllCompanies,
  updateCompany,
} from '../../utils/firebaseStorage';
import { Product, Company } from '../../types';

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    selectedCompanies: [] as string[],
    category: '',
    description: '',
    qrCode: '',
  });

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
      loadCompanies();
    }, [])
  );

  const loadCompanies = async () => {
    try {
      const allCompanies = await getAllCompanies();
      setCompanies(allCompanies);
    } catch (error) {
      console.error('Error loading companies:', error);
      Alert.alert('Error', 'Failed to load companies');
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.selectedCompanies.length === 0 || !newProduct.category) {
      Alert.alert('Error', 'Please select at least one company and fill required fields');
      return;
    }

    setSaving(true);
    try {
      const companyNames = newProduct.selectedCompanies
        .map(id => {
          const company = companies.find(c => c.id === id);
          return company ? company.name : id;
        })
        .filter(Boolean);

      if (editingId) {
        // Update existing product
        await updateProduct(editingId, {
          name: newProduct.name,
          companyNames,
          companyIds: newProduct.selectedCompanies,
          category: newProduct.category,
          description: newProduct.description,
          qrCode: newProduct.qrCode,
        } as Partial<Product>);
        Alert.alert('✅ Product Updated', `${newProduct.name} updated successfully.`);
      } else {
        // Generate a unique QR code value for the product
        const qrCodeValue = `${newProduct.name}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
        await addProduct({
          name: newProduct.name,
          companyNames,
          companyIds: newProduct.selectedCompanies,
          category: newProduct.category,
          description: newProduct.description,
          qrCode: qrCodeValue,
        } as Omit<Product, 'id'>);
        // Update productCount for each company
        for (const companyId of newProduct.selectedCompanies) {
          const company = companies.find(c => c.id === companyId);
          if (company) {
            const newCount = (company.productCount || 0) + 1;
            await updateCompany(companyId, { productCount: newCount });
          }
        }
        Alert.alert('✅ Product Added', `${newProduct.name} added successfully with QR code.`);
      }

      // Reset form and reload
      setNewProduct({ name: '', selectedCompanies: [], category: '', description: '', qrCode: '' });
      setEditingId(null);
      setShowAddForm(false);
      await loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintQR = async (product: Product) => {
    try {
      const qrValue = product.qrCode;
      const htmlContent = `
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: Arial, sans-serif;
                background: white;
              }
              .qr-code {
                background: white;
                padding: 5px;
                display: inline-block;
              }
            </style>
          </head>
          <body>
            <div class="qr-code">
              <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg" style="border: 2px solid #000;">
                <rect width="200" height="200" fill="white"/>
                <text x="100" y="100" font-size="14" text-anchor="middle" dy=".3em" fill="#333">
                  QR: ${qrValue.substring(0, 20)}${qrValue.length > 20 ? '...' : ''}
                </text>
              </svg>
            </div>
          </body>
        </html>
      `;
      
      await Print.printAsync({
        html: htmlContent,
        printerUrl: undefined,
      });
      
      Alert.alert('Success', 'QR Code sent to printer');
    } catch (error) {
      console.error('Error printing QR code:', error);
      Alert.alert('Error', 'Failed to print QR code');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    // Prevent multiple taps
    if (deletingId) {
      console.log('[DeleteProduct] Already deleting, ignoring tap');
      return;
    }

    setDeletingId(productId);
    console.log('[DeleteProduct] Deleting product immediately:', productId);

    try {
      // Get the product to delete
      const productToDelete = products.find(p => p.id === productId);
      console.log('[DeleteProduct] Product to delete:', productToDelete);
      
      if (!productToDelete) {
        throw new Error('Product not found');
      }

      // Delete the product from Firebase
      await deleteProduct(productId);
      console.log('[DeleteProduct] Deleted product from Firebase:', productId);
      
      // Update productCount for each company
      if (productToDelete.companyIds && productToDelete.companyIds.length > 0) {
        console.log('[DeleteProduct] Updating company counts for:', productToDelete.companyIds);
        
        for (const companyId of productToDelete.companyIds) {
          const company = companies.find(c => c.id === companyId);
          if (company) {
            const newCount = Math.max((company.productCount || 1) - 1, 0);
            console.log('[DeleteProduct] Updating company', companyId, 'count to:', newCount);
            await updateCompany(companyId, { productCount: newCount });
          }
        }
      }
      
      // Reload products
      await loadProducts();
      console.log('[DeleteProduct] Products reloaded successfully');
      
      Alert.alert('✅ Success', 'Product deleted successfully');
    } catch (error) {
      console.error('[DeleteProduct] Error deleting product:', error);
      console.error('[DeleteProduct] Error details:', JSON.stringify(error, null, 2));
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('❌ Error', `Failed to delete product: ${errorMessage}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id);
    // Map company names back to IDs for editing
    const selectedCompanyIds = companies
      .filter(c => (product.companyNames || []).includes(c.name))
      .map(c => c.id);
    setNewProduct({
      name: product.name,
      selectedCompanies: selectedCompanyIds,
      category: product.category,
      description: product.description,
      qrCode: product.qrCode,
    });
    setShowAddForm(true);
  };

  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.companyNames || []).join(', ').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewProduct = (product: Product) => {
    router.push({
      pathname: '/admin/product-detail',
      params: { 
        productId: product.id,
        productName: product.name,
        companyNames: (product.companyNames || []).join(', '),
        category: product.category,
        description: product.description,
        qrCode: product.qrCode,
      }
    });
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.companyName}>{(item.companyNames || []).join(', ')}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewProduct(item)}
        >
          <Ionicons name="eye" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.printButton}
          onPress={() => handleViewProduct(item)}
        >
          <Ionicons name="print" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditProduct(item)}
        >
          <Ionicons name="pencil" size={18} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, deletingId === item.id && styles.deleteButtonDisabled]}
          onPress={() => handleDeleteProduct(item.id)}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="trash" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {showAddForm ? (
        <ScrollView style={styles.form}>
          <Text style={styles.formTitle}>{editingId ? 'Edit Product' : 'Add New Product'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={newProduct.name}
            onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
          />
          
          <TouchableOpacity
            style={styles.companyPickerButton}
            onPress={() => setShowCompanyPicker(true)}
          >
            <Text style={styles.companyPickerLabel}>Select Companies (Multiple)</Text>
            <Text style={[styles.companyPickerValue, newProduct.selectedCompanies.length === 0 && { color: '#999' }]}>
              {newProduct.selectedCompanies.length > 0 
                ? `${newProduct.selectedCompanies.length} selected: ${newProduct.selectedCompanies.map(id => {
                    const company = companies.find(c => c.id === id);
                    return company ? company.name : id;
                  }).join(', ')}`
                : 'Choose companies...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#2196F3" />
          </TouchableOpacity>

          <Modal
            visible={showCompanyPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCompanyPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Companies</Text>
                <ScrollView>
                  {companies.map((company) => (
                    <TouchableOpacity
                      key={company.id}
                      style={styles.companyOption}
                      onPress={() => {
                        setNewProduct(prev => {
                          const isSelected = prev.selectedCompanies.includes(company.id);
                          return {
                            ...prev,
                            selectedCompanies: isSelected
                              ? prev.selectedCompanies.filter(c => c !== company.id)
                              : [...prev.selectedCompanies, company.id],
                          };
                        });
                      }}
                    >
                      <View style={styles.checkbox}>
                        {newProduct.selectedCompanies.includes(company.id) && (
                          <Ionicons name="checkmark" size={18} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.companyOptionText}>
                        {company.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {companies.length === 0 && (
                    <Text style={styles.noCompaniesText}>No companies available. Add companies first.</Text>
                  )}
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCompanyPicker(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TextInput
            style={styles.input}
            placeholder="Category"
            value={newProduct.category}
            onChangeText={(text) => setNewProduct({ ...newProduct, category: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={newProduct.description}
            onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowAddForm(false);
                setEditingId(null);
                setNewProduct({ name: '', selectedCompanies: [], category: '', description: '', qrCode: '' });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleAddProduct}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{editingId ? 'Update' : 'Add'} Product</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Product</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
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
    backgroundColor: '#f5f5f5',
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
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  productCard: {
    flexDirection: 'row',
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
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  printButton: {
    backgroundColor: '#27ae60',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  companyPickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyPickerLabel: {
    fontSize: 12,
    color: '#999',
    position: 'absolute',
    top: 4,
    left: 12,
  },
  companyPickerValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  companyOption: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  noCompaniesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  modalCloseButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});