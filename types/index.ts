export interface Company {
  id: string;
  name: string;
  logo?: string;
  productCount: number;
}

export interface Product {
  id: string;
  name: string;
  companyIds: string[];
  companyNames: string[];
  description: string;
  image?: string;
  manualUrl?: string;
  qrCode: string;
  category: string;
}

export interface CustomerProduct {
  id: string;
  productId: string;
  product: Product;
  purchaseDate: string;
  serialNumber?: string;
  status: 'working' | 'not-working';
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  clinicName?: string;
}

export type RootStackParamList = {
  login: undefined;
  '(tabs)': undefined;
  admin: undefined;
  'add-product': undefined;
  'library/company/[id]': { id: string };
  'library/product/[id]': { id: string };
};
