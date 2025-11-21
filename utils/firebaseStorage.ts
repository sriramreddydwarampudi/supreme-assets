import { storage, db } from './firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { Product, CustomerProduct, Company, User } from '../types';

// Firestore Companies
export const getAllCompanies = async (): Promise<Company[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'companies'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Company));
  } catch (error) {
    console.error('Error getting companies:', error);
    throw error;
  }
};

export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  try {
    const docSnap = await getDocs(
      query(collection(db, 'companies'), where('id', '==', companyId))
    );
    if (docSnap.empty) return null;
    const doc = docSnap.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Company;
  } catch (error) {
    console.error('Error getting company:', error);
    throw error;
  }
};

export const addCompany = async (company: Omit<Company, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'companies'), company);
    return docRef.id;
  } catch (error) {
    console.error('Error adding company:', error);
    throw error;
  }
};

export const updateCompany = async (
  companyId: string,
  updates: Partial<Company>
): Promise<void> => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, updates);
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

export const deleteCompany = async (companyId: string): Promise<void> => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    await deleteDoc(companyRef);
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
};

// Firestore All Products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  } catch (error) {
    console.error('Error getting all products:', error);
    throw error;
  }
};

export const getProductByQRCode = async (qrCode: string): Promise<Product | null> => {
  try {
    console.log('[FirebaseStorage] Looking for product with qrCode:', qrCode);
    
    const q = query(collection(db, 'products'), where('qrCode', '==', qrCode));
    const querySnapshot = await getDocs(q);
    
    console.log('[FirebaseStorage] Query returned', querySnapshot.docs.length, 'results');
    
    if (querySnapshot.empty) {
      console.log('[FirebaseStorage] No product found with qrCode:', qrCode);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const productData = doc.data();
    console.log('[FirebaseStorage] Found product:', doc.id, productData.name);
    
    return {
      id: doc.id,
      ...productData,
    } as Product;
  } catch (error) {
    console.error('[FirebaseStorage] Error getting product by QR code:', error);
    throw error;
  }
};

// Product Images Storage
export const uploadProductImage = async (
  productId: string,
  imageUri: string,
  fileName: string
): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `products/${productId}/${fileName}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading product image:', error);
    throw error;
  }
};

// Product Manuals Storage
export const uploadProductManual = async (
  productId: string,
  fileUri: string,
  fileName: string
): Promise<string> => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `manuals/${productId}/${fileName}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading product manual:', error);
    throw error;
  }
};

// Delete File from Storage
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Firestore Products
export const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (
  productId: string,
  updates: Partial<Product>
): Promise<void> => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    console.log('[FirebaseStorage] deleteProduct called with:', productId);
    const productRef = doc(db, 'products', productId);
    console.log('[FirebaseStorage] productRef created:', productRef);
    await deleteDoc(productRef);
    console.log('[FirebaseStorage] deleteDoc completed for:', productId);
  } catch (error) {
    console.error('[FirebaseStorage] Error deleting product:', error);
    throw error;
  }
};

export const getProductsByCompany = async (companyId: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, 'products'),
      where('companyIds', 'array-contains', companyId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  } catch (error) {
    console.error('Error getting products by company:', error);
    throw error;
  }
};

// Firestore Customer Products
export const addCustomerProduct = async (
  userId: string,
  customerProduct: Omit<CustomerProduct, 'id'>
): Promise<string> => {
  try {
    console.log('[addCustomerProduct] Adding new product for user:', userId, 'Product:', customerProduct.product.name);
    const docRef = await addDoc(collection(db, 'users', userId, 'products'), {
      ...customerProduct,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('[addCustomerProduct] Successfully added product with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[addCustomerProduct] Error adding product for user:', userId, error);
    throw error;
  }
};

export const updateCustomerProduct = async (
  userId: string,
  productId: string,
  updates: Partial<CustomerProduct>
): Promise<void> => {
  try {
    console.log('[updateCustomerProduct] Updating product:', productId, 'for user:', userId);
    const productRef = doc(db, 'users', userId, 'products', productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    console.log('[updateCustomerProduct] Successfully updated product:', productId);
  } catch (error) {
    console.error('[updateCustomerProduct] Error updating product:', productId, 'for user:', userId, error);
    throw error;
  }
};

export const deleteCustomerProduct = async (
  userId: string,
  productId: string
): Promise<void> => {
  try {
    console.log('[deleteCustomerProduct] Deleting product:', productId, 'for user:', userId);
    const productRef = doc(db, 'users', userId, 'products', productId);
    await deleteDoc(productRef);
    console.log('[deleteCustomerProduct] Successfully deleted product:', productId);
  } catch (error) {
    console.error('[deleteCustomerProduct] Error deleting product:', productId, 'for user:', userId, error);
    throw error;
  }
};

export const getCustomerProducts = async (userId: string): Promise<CustomerProduct[]> => {
  try {
    console.log('[getCustomerProducts] Fetching products for user:', userId);
    const querySnapshot = await getDocs(
      collection(db, 'users', userId, 'products')
    );
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as CustomerProduct));
    console.log('[getCustomerProducts] Successfully fetched', products.length, 'products for user:', userId);
    return products;
  } catch (error) {
    console.error('[getCustomerProducts] Error getting customer products for user:', userId, error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    console.log('[getAllUsers] Fetching all users from Firestore');
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as User));
    console.log('[getAllUsers] Successfully fetched', users.length, 'users');
    console.log('[getAllUsers] Users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
    return users;
  } catch (error) {
    console.error('[getAllUsers] Error getting all users:', error);
    throw error;
  }
};

// Get all non-working customer products with customer details
export const getAllNonWorkingProducts = async (): Promise<
  (CustomerProduct & { userId: string; userName: string; userEmail: string; clinicName?: string })[]
> => {
  try {
    console.log('[getAllNonWorkingProducts] Starting to fetch all non-working products');
    const users = await getAllUsers();
    console.log('[getAllNonWorkingProducts] Fetched', users.length, 'total users');
    const allNonWorkingProducts: (CustomerProduct & {
      userId: string;
      userName: string;
      userEmail: string;
      clinicName?: string;
    })[] = [];

    for (const user of users) {
      if (user.role === 'customer') {
        try {
          const customerProducts = await getCustomerProducts(user.id);
          const nonWorkingProducts = customerProducts.filter(
            cp => cp.status === 'not-working'
          );
          console.log('[getAllNonWorkingProducts] User:', user.email, 'has', nonWorkingProducts.length, 'non-working products');

          for (const product of nonWorkingProducts) {
            allNonWorkingProducts.push({
              ...product,
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              clinicName: user.clinicName,
            });
          }
        } catch (err) {
          console.error('[getAllNonWorkingProducts] Error getting products for user:', user.id, user.email, err);
        }
      }
    }

    console.log('[getAllNonWorkingProducts] Total non-working products found:', allNonWorkingProducts.length);
    return allNonWorkingProducts;
  } catch (error) {
    console.error('[getAllNonWorkingProducts] Error getting all non-working products:', error);
    throw error;
  }
};
