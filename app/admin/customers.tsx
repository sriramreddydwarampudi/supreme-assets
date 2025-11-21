import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-root-toast';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { db, customerCreationAuth } from '../../utils/firebase';

interface Customer {
  id: string;
  name: string;
  email: string;
  password: string;
  clinicName: string;
  productCount: number;
}

const CUSTOMERS_STORAGE_KEY = '@admin_customers';
const USER_CACHE_KEY = '@supreme_user';

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  Toast.show(`${type === 'success' ? '✅' : '❌'} ${message}`, {
    duration: Toast.durations.SHORT,
    position: Toast.positions.BOTTOM,
  });
};

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [adminPassword, setAdminPassword] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    password: '',
    clinicName: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleAddCustomer = async () => {
    const auth = getAuth();
    let currentAdmin = auth.currentUser;

    console.log('[Customer] handleAddCustomer invoked');

    if (!currentAdmin?.email) {
      try {
        const cachedUser = await AsyncStorage.getItem(USER_CACHE_KEY);
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          if (parsed?.email) {
            currentAdmin = { email: parsed.email } as any;
            console.log('[Customer] Using cached admin user:', parsed.email);
          }
        }
      } catch (error) {
        console.warn('[Customer] Failed to read cached admin user', error);
      }
    }

    if (!currentAdmin?.email) {
      showToast('You must be logged in as admin to create customers.', 'error');
      console.log('[Customer] Blocked: no admin session');
      return;
    }

    if (!newCustomer.name || !newCustomer.email || !newCustomer.password || !newCustomer.clinicName) {
      showToast('Please fill in all fields.', 'error');
      console.log('[Customer] Blocked: missing fields');
      return;
    }

    if (newCustomer.password.length < 6) {
      showToast('Customer password should be at least 6 characters.', 'error');
      return;
    }

    if (!adminPassword.trim()) {
      showToast('Admin password is required.', 'error');
      console.log('[Customer] Blocked: missing admin password');
      return;
    }

    console.log('[Customer] Passed validation, creating customer...');
    await createCustomerWithAdminPassword(currentAdmin.email, adminPassword.trim());
  };

  const createCustomerWithAdminPassword = async (adminEmail: string, adminPasswordInput: string) => {
    const auth = getAuth();
    setIsSaving(true);
    const customerData = { ...newCustomer };

    try {
      console.log('[Customer] Step 0: verifying admin credential via secondary auth');
      await signInWithEmailAndPassword(customerCreationAuth, adminEmail, adminPasswordInput);
      await signOut(customerCreationAuth);
      console.log('[Customer] Step 0 complete: admin credential verified');

      console.log('[Customer] Step 1: creating Firebase Auth user for', customerData.email);
      const userCredential = await createUserWithEmailAndPassword(
        customerCreationAuth,
        customerData.email,
        customerData.password
      );
      const newCustomerUid = userCredential.user.uid;
      console.log('[Customer] Step 1 complete: UID', newCustomerUid);

      console.log('[Customer] Step 2a: creating user doc');
      await setDoc(doc(db, 'users', newCustomerUid), {
        email: customerData.email,
        name: customerData.name,
        role: 'customer',
        clinicName: customerData.clinicName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log('[Customer] Step 2b: creating customer doc');
      await addDoc(collection(db, 'customers'), {
        uid: newCustomerUid,
        name: customerData.name,
        email: customerData.email,
        password: customerData.password,
        clinicName: customerData.clinicName,
        productCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log('[Customer] Step 3: signing out secondary auth');
      await signOut(customerCreationAuth);

      console.log('[Customer] Step 4: refreshing list');
      await loadCustomers();

      setNewCustomer({ name: '', email: '', password: '', clinicName: '' });
      setAdminPassword('');
      setShowAddForm(false);
      showToast(`Customer ${customerData.name} created successfully!`, 'success');
      console.log('[Customer] ✅ All steps complete');
    } catch (error: any) {
      console.error('[Customer] ❌ Error creating customer', error);
      let errorMessage = 'Failed to create customer. ';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage += 'This email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage += 'Password is too weak.';
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage += 'Incorrect admin password. Please try again.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsSaving(false);
      setAdminPassword('');
    }
  };

  const loadCustomers = async () => {
    try {
      setIsFetching(true);
      const customersCollection = collection(db, 'customers');
      const querySnapshot = await getDocs(customersCollection);

      const firestoreCustomers: Customer[] = [];
      querySnapshot.forEach((item) => {
        const data = item.data();
        firestoreCustomers.push({
          id: item.id,
          name: data.name || '',
          email: data.email || '',
          password: data.password || '',
          clinicName: data.clinicName || '',
          productCount: data.productCount || 0,
        });
      });

      setCustomers(firestoreCustomers);
      if (firestoreCustomers.length > 0) {
        await AsyncStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(firestoreCustomers));
      }
    } catch (error) {
      console.error('[Customer] Error loading customers', error);
      try {
        const cachedData = await AsyncStorage.getItem(CUSTOMERS_STORAGE_KEY);
        if (cachedData) {
          setCustomers(JSON.parse(cachedData));
          console.log('[Customer] Loaded customers from cache');
        }
      } catch (cacheError) {
        console.error('[Customer] Error loading cache', cacheError);
      }
    } finally {
      setIsFetching(false);
      setRefreshing(false);
    }
  };

  const executeDelete = async (customerId: string, customerName: string) => {
    try {
      setIsDeletingId(customerId);
      await deleteDoc(doc(db, 'customers', customerId));
      const updated = customers.filter((customer) => customer.id !== customerId);
      setCustomers(updated);
      await AsyncStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(updated));
      showToast(`Customer "${customerName}" deleted successfully`, 'success');
    } catch (error) {
      console.error('[Customer] Error deleting customer', error);
      showToast('Failed to delete customer. Please try again.', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    await executeDelete(customerId, customerName);
  };

  const togglePasswordVisibility = (customerId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [customerId]: !prev[customerId],
    }));
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerEmail}>{item.email}</Text>
        <Text style={styles.clinicName}>{item.clinicName}</Text>
        <View style={styles.passwordContainer}>
          <Text style={styles.passwordLabel}>Password: </Text>
          <Text style={styles.passwordValue}>
            {showPasswords[item.id] ? item.password : '••••••'}
          </Text>
          <TouchableOpacity onPress={() => togglePasswordVisibility(item.id)} style={styles.eyeButton}>
            <Ionicons name={showPasswords[item.id] ? 'eye-off' : 'eye'} size={18} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.productCount}>Products: {item.productCount}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.deleteButton,
            isDeletingId === item.id && styles.disabledButton,
          ]}
          onPress={() => handleDeleteCustomer(item.id, item.name)}
          disabled={isDeletingId === item.id}
        >
          {isDeletingId === item.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="trash" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {showAddForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add New Customer</Text>
          <TextInput
            style={styles.input}
            placeholder="Customer Name"
            value={newCustomer.name}
            onChangeText={(text) => setNewCustomer({ ...newCustomer, name: text })}
            editable={!isSaving}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={newCustomer.email}
            onChangeText={(text) => setNewCustomer({ ...newCustomer, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSaving}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            value={newCustomer.password}
            onChangeText={(text) => setNewCustomer({ ...newCustomer, password: text })}
            secureTextEntry
            editable={!isSaving}
          />
          <TextInput
            style={styles.input}
            placeholder="Clinic Name"
            value={newCustomer.clinicName}
            onChangeText={(text) => setNewCustomer({ ...newCustomer, clinicName: text })}
            editable={!isSaving}
          />
          <TextInput
            style={styles.input}
            placeholder="Admin Password"
            value={adminPassword}
            onChangeText={setAdminPassword}
            secureTextEntry
            editable={!isSaving}
          />
          <Text style={styles.helperText}>Enter your admin password to confirm account creation.</Text>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowAddForm(false)}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleAddCustomer}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Add Customer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addButton, isSaving && styles.disabledButton]}
          onPress={() => setShowAddForm(true)}
          disabled={isSaving}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Customer</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isFetching}
            onRefresh={async () => {
              setRefreshing(true);
              await loadCustomers();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No customers yet</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh or add a new customer</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  helperText: { fontSize: 13, color: '#777', marginBottom: 12 },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: { backgroundColor: '#f5f5f5' },
  saveButton: { backgroundColor: '#2196F3' },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  list: { padding: 16, paddingTop: 0 },
  customerCard: {
    flexDirection: 'row',
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
  customerInfo: { flex: 1 },
  customerName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  customerEmail: { fontSize: 14, color: '#2196F3', marginBottom: 4 },
  clinicName: { fontSize: 14, color: '#666', marginBottom: 8 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  passwordLabel: { fontSize: 14, color: '#666' },
  passwordValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  eyeButton: { marginLeft: 8, padding: 4 },
  productCount: { fontSize: 12, color: '#999', marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  disabledButton: { backgroundColor: '#ccc' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center' },
});

