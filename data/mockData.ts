import { Company, Product, CustomerProduct, User } from '../types';

export const companies: Company[] = [
  { id: '1', name: 'NSK', productCount: 15 },
  { id: '2', name: 'Dentsply Sirona', productCount: 12 },
  { id: '3', name: 'KaVo Kerr', productCount: 10 },
  { id: '4', name: 'Planmeca', productCount: 8 },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Ti-Max X95L High-Speed Handpiece',
    companyId: '1',
    companyName: 'NSK',
    description: 'LED high-speed handpiece with titanium body',
    category: 'Handpieces',
    qrCode: 'PROD001',
    manualUrl: 'https://example.com/manuals/nsk-x95l.pdf'
  },
  {
    id: '2',
    name: 'SiroLaser Blue Diode Laser',
    companyId: '2',
    companyName: 'Dentsply Sirona',
    description: '970 nm diode laser for soft tissue procedures',
    category: 'Lasers',
    qrCode: 'PROD002',
    manualUrl: 'https://example.com/manuals/sirolaser.pdf'
  },
  {
    id: '3',
    name: 'Gentle Power Lux 25 LP',
    companyId: '3',
    companyName: 'KaVo Kerr',
    description: 'Low-speed handpiece with LED',
    category: 'Handpieces',
    qrCode: 'PROD003',
    manualUrl: 'https://example.com/manuals/kavo-gentle.pdf'
  },
];

export const users: User[] = [
  {
    id: '1',
    email: 'supreme@gmail.com',
    name: 'Admin',
    role: 'admin',
  },
  {
    id: '2',
    email: 'clinic@example.com',
    name: 'Dr. Smith',
    role: 'customer',
    clinicName: 'Smith Dental Clinic',
  },
];

export const customerProducts: CustomerProduct[] = [
  {
    id: '1',
    productId: '1',
    product: products[0],
    purchaseDate: '2024-01-15',
    serialNumber: 'NSK-2024-001',
    status: 'working',
    notes: 'Regular maintenance done',
  },
  {
    id: '2',
    productId: '2',
    product: products[1],
    purchaseDate: '2024-02-20',
    serialNumber: 'DS-2024-042',
    status: 'not-working',
    notes: 'Needs repair',
  },
];
