import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProductCard } from '../../../components/ProductCard';
import { getAllCompanies, getProductsByCompany } from '../../../utils/firebaseStorage';
import { Company, Product } from '../../../types';

export default function CompanyProductsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const companies = await getAllCompanies();
      const foundCompany = companies.find(c => c.id === id);
      if (foundCompany) {
        setCompany(foundCompany);
        const companyProducts = await getProductsByCompany(id!);
        setProducts(companyProducts);
      } else {
        setError('Company not found');
      }
    } catch (err) {
      console.error('Error loading company:', err);
      setError('Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error || !company) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Company not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.companyName}>{company.name}</Text>
        <Text style={styles.productCount}>
          {products.length} products
        </Text>
      </View>

      <FlatList
        data={products}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/library/product/${item.id}`)}
            showQR={true}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No products for this company</Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCount: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff9800',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  list: {
    padding: 16,
  },
});
