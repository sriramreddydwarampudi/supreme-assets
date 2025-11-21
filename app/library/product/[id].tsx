import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { PDFViewer } from '../../../components/PDFViewer';
import { getAllProducts } from '../../../utils/firebaseStorage';
import { Product } from '../../../types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const products = await getAllProducts();
      const found = products.find(p => p.id === id);
      if (found) {
        setProduct(found);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Failed to load product');
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

  if (error || !product) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="warning-outline" size={64} color="#ff9800" />
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProduct}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.company}>{(product.companyNames || []).join(', ')}</Text>
        <Text style={styles.category}>{product.category}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QR Code</Text>
        <View style={styles.qrContainer}>
          {product.qrCode ? (
            <QRCode value={product.qrCode} size={200} />
          ) : (
            <Text style={styles.qrLabel}>No QR code available</Text>
          )}
          <Text style={styles.qrLabel}>Scan to access this manual</Text>
        </View>
      </View>

      {product.manualUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Manual</Text>
          <PDFViewer url={product.manualUrl} title={`${product.name} Manual`} />
        </View>
      )}
    </ScrollView>
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
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ff9800',
    fontWeight: '500',
    textAlign: 'center',
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
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  company: {
    fontSize: 18,
    color: '#2196F3',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 20,
  },
  qrLabel: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
});
