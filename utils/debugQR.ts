import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Debug utility to inspect all products and their qrCode fields
 * Run this to understand what QR code formats are in your database
 */
export async function debugProductQRCodes() {
  try {
    console.log('[Debug QR] Starting QR code inspection...');
    const productsCol = collection(db, 'products');
    const snapshot = await getDocs(productsCol);
    
    console.log(`[Debug QR] Total products: ${snapshot.docs.length}`);
    
    const qrCodeFormats: { [key: string]: number } = {};
    const productsWithoutQR: string[] = [];
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const qrCode = data.qrCode;
      
      if (!qrCode) {
        productsWithoutQR.push(doc.id);
      } else {
        const format = typeof qrCode;
        qrCodeFormats[format] = (qrCodeFormats[format] || 0) + 1;
        console.log(`[Debug QR] Product: ${doc.id}, Name: ${data.name}, QR Code: ${qrCode}`);
      }
    });
    
    console.log('[Debug QR] QR Code formats found:', qrCodeFormats);
    console.log('[Debug QR] Products without qrCode:', productsWithoutQR);
    console.log('[Debug QR] ===== INSPECTION COMPLETE =====');
    
    return {
      total: snapshot.docs.length,
      withQR: snapshot.docs.length - productsWithoutQR.length,
      withoutQR: productsWithoutQR.length,
      formats: qrCodeFormats,
      productsWithoutQR,
    };
  } catch (error) {
    console.error('[Debug QR] Error inspecting products:', error);
    throw error;
  }
}

/**
 * Generate example QR code data based on products
 * This will show what data to use when generating QR codes
 */
export async function generateQRCodeExamples() {
  try {
    console.log('[Debug QR] Generating QR code examples...');
    const productsCol = collection(db, 'products');
    const snapshot = await getDocs(productsCol);
    
    snapshot.docs.slice(0, 5).forEach((doc) => {
      const data = doc.data();
      console.log(`[Debug QR] ${data.name}: Use QR code value "${data.qrCode || doc.id}"`);
    });
  } catch (error) {
    console.error('[Debug QR] Error generating examples:', error);
    throw error;
  }
}
