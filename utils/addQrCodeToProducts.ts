import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * This script will add a qrCode field to all products in Firestore that are missing it.
 * The qrCode will be set to the product's document ID (or you can customize this logic).
 */

async function addQrCodeToProducts() {
  const productsCol = collection(db, 'products');
  const snapshot = await getDocs(productsCol);
  let updated = 0;
  for (const productDoc of snapshot.docs) {
    const data = productDoc.data();
    if (!data.qrCode) {
      // Set qrCode to the product's document ID (customize if needed)
      await updateDoc(doc(db, 'products', productDoc.id), {
        qrCode: productDoc.id,
      });
      updated++;
      console.log(`Updated product ${productDoc.id} with qrCode: ${productDoc.id}`);
    }
  }
  console.log(`Done. Updated ${updated} products.`);
}

// Run the script
addQrCodeToProducts().catch(console.error);
