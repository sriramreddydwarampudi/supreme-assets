import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProductByQRCode } from '../../utils/firebaseStorage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useFocusEffect } from '@react-navigation/native';

export default function FindScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      setScanned(false);
      setSearching(false);
      
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!isFocused || scanned || searching) return;
    
    console.log('[QR] QR Code scanned:', data);
    setScanned(true);
    setSearching(true);
    
    try {
      let product = await getProductByQRCode(data);
      
      if (product) {
        console.log('[QR] Product found:', product.id, product.name);
        setSearching(false);
        router.push(`/library/product/${product.id}`);
        return;
      }
      
      const trimmedData = data.trim();
      if (trimmedData !== data) {
        product = await getProductByQRCode(trimmedData);
        if (product) {
          setSearching(false);
          router.push(`/library/product/${product.id}`);
          return;
        }
      }
      
      try {
        const productsCol = collection(db, 'products');
        const q = query(productsCol, where('__name__', '==', data));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setSearching(false);
          router.push(`/library/product/${doc.id}`);
          return;
        }
      } catch (error) {
        console.log('[QR] ID search failed');
      }
      
      setSearching(false);
      Alert.alert('Not Found', `Product with QR code "${data}" not found.`, [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    } catch (error) {
      console.error('[QR] Error:', error);
      setSearching(false);
      Alert.alert('Error', 'Failed to search product. Please try again.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera" size={80} color="#2196F3" />
        <Text style={styles.message}>Camera Permission Required</Text>
        <Text style={styles.submessage}>
          This app needs camera access to scan QR codes
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned || searching ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {searching && (
                <View style={styles.searchingIndicator}>
                  <ActivityIndicator size="large" color="#2196F3" />
                </View>
              )}
            </View>
            
            <View style={styles.instructionContainer}>
              <Text style={styles.instruction}>
                {searching ? '🔍 Searching product...' : '📱 Position QR code within the frame'}
              </Text>
            </View>
          </View>
        </CameraView>
      )}

      {scanned && !searching && (
        <TouchableOpacity
          style={styles.rescanButton}
          onPress={() => setScanned(false)}
        >
          <Ionicons name="scan" size={24} color="#fff" />
          <Text style={styles.rescanText}>Tap to scan again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: '#2196F3',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 8,
  },
  searchingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 12,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    color: '#fff',
    textAlign: 'center',
  },
  submessage: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  permissionButton: {
    marginTop: 24,
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rescanButton: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  rescanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});