import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const product = {
    id: Array.isArray(params.productId) ? params.productId[0] : (params.productId || ''),
    name: Array.isArray(params.productName) ? params.productName[0] : (params.productName || ''),
    companyName: Array.isArray(params.companyName) ? params.companyName[0] : (params.companyName || ''),
    category: Array.isArray(params.category) ? params.category[0] : (params.category || ''),
    description: Array.isArray(params.description) ? params.description[0] : (params.description || ''),
    qrCode: Array.isArray(params.qrCode) ? params.qrCode[0] : (params.qrCode || ''),
  };

  if (!product.name) {
    return (
      <View style={styles.container}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const companies = product.companyName.split(', ').filter(c => c.trim());
  const companyCount = companies.length;

  const handlePrintQR = async () => {
    try {
      const qrValue = product.qrCode;
      const htmlContent = `
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                font-family: Arial, sans-serif;
                background: white;
              }
              .container {
                text-align: center;
                max-width: 500px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 15px;
                color: #333;
              }
              .info {
                font-size: 13px;
                color: #666;
                margin-bottom: 10px;
                line-height: 1.6;
              }
              .qr-section {
                margin: 30px 0;
                padding: 20px;
                border: 2px solid #2196F3;
                border-radius: 8px;
              }
              .qr-code {
                background: white;
                padding: 10px;
                display: inline-block;
              }
              .footer {
                margin-top: 20px;
                font-size: 11px;
                color: #999;
                border-top: 1px solid #eee;
                padding-top: 15px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">${product.name}</div>
              <div class="info"><strong>Companies:</strong> ${product.companyName}</div>
              <div class="info"><strong>Category:</strong> ${product.category}</div>
              ${product.description ? `<div class="info"><strong>Description:</strong> ${product.description}</div>` : ''}
              
              <div class="qr-section">
                <div style="font-size: 12px; margin-bottom: 15px; color: #666;">Product QR Code</div>
                <div class="qr-code">
                  <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg" style="border: 2px solid #000;">
                    <rect width="200" height="200" fill="white"/>
                    <text x="100" y="100" font-size="14" text-anchor="middle" dy=".3em" fill="#333">
                      QR: ${qrValue.substring(0, 20)}${qrValue.length > 20 ? '...' : ''}
                    </text>
                  </svg>
                </div>
              </div>
              
              <div class="info"><strong>Product ID:</strong> ${product.id}</div>
              <div class="footer">
                <p>Printed: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      await Print.printAsync({
        html: htmlContent,
        printerUrl: undefined,
      });
      
      Alert.alert('Success', 'Product details sent to printer');
    } catch (error) {
      console.error('Error printing:', error);
      Alert.alert('Error', 'Failed to print product details');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#2196F3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.productCard}>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Ionicons name="business" size={20} color="#2196F3" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Companies ({companyCount})</Text>
                {companies.map((company, index) => (
                  <Text key={index} style={styles.detailValue}>
                    • {company}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Ionicons name="pricetag" size={20} color="#4CAF50" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{product.category}</Text>
              </View>
            </View>
          </View>

          {product.description && (
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Ionicons name="document-text" size={20} color="#FF9800" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{product.description}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Ionicons name="qr-code" size={20} color="#9C27B0" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>QR Code</Text>
                <Text style={[styles.detailValue, styles.qrCode]}>
                  {product.qrCode.substring(0, 30)}
                  {product.qrCode.length > 30 ? '...' : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Ionicons name="key" size={20} color="#F44336" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Product ID</Text>
                <Text style={[styles.detailValue, styles.productId]}>
                  {product.id}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {product.qrCode && (
          <View style={styles.qrPreview}>
            <Text style={styles.qrPreviewTitle}>QR Code Preview</Text>
            <View style={styles.qrBox}>
              <QRCode
                value={product.qrCode}
                size={120}
                backgroundColor="white"
                color="black"
                quietZone={10}
              />
            </View>
            <Text style={styles.qrCodeText}>{product.qrCode}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.printButton}
          onPress={handlePrintQR}
        >
          <Ionicons name="print" size={24} color="#fff" />
          <Text style={styles.printButtonText}>Print Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  qrCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  productId: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  qrPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  qrBox: {
    width: 140,
    height: 140,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    marginBottom: 16,
  },
  qrCodeText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
