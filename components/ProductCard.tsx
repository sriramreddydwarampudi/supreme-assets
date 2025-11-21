import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Product } from '../types';
import QRCode from 'react-native-qrcode-svg';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  showQR?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onPress, 
  showQR = false 
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.company}>{product.companyName}</Text>
          <Text style={styles.category}>{product.category}</Text>
        </View>
        {showQR && (
          <View style={styles.qrContainer}>
            <QRCode
              value={product.qrCode}
              size={80}
              backgroundColor="white"
            />
          </View>
        )}
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {product.description}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#999',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  qrContainer: {
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
});
