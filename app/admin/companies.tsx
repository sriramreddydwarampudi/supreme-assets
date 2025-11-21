import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import {
  getAllCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
  getAllProducts,
} from '../../utils/firebaseStorage';

import { Company, Product } from '../../types';

export default function CompaniesScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCompanyName, setNewCompanyName] = useState('');

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [showProductsModal, setShowProductsModal] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadCompanies();
      loadProducts();
    }, [])
  );

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const allCompanies = await getAllCompanies();
      setCompanies(allCompanies);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    } catch (error) {
      console.log("Error loading products:", error);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateCompany(editingId, { name: newCompanyName });
      } else {
        await addCompany({
          name: newCompanyName,
          productCount: 0,
        } as Omit<Company, "id">);
      }

      setNewCompanyName('');
      setEditingId(null);
      setShowAddForm(false);
      await loadCompanies();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (companyId: string, companyName: string) => {
    setSelectedCompanyId(companyId);
    setSelectedCompanyName(companyName);
    setShowDeletePopup(true);
  };

  const executeDelete = async () => {
    setShowDeletePopup(false);

    if (!selectedCompanyId) return;

    try {
      await deleteCompany(selectedCompanyId);
      await loadCompanies();
    } catch (error) {
      console.log("Delete error:", error);
    }
  };

  const getCompanyProducts = (companyId: string) => {
    return products.filter(p => (p.companyIds || []).includes(companyId));
  };

  const handleViewProducts = (company: Company) => {
    setSelectedCompanyId(company.id);
    setSelectedCompanyName(company.name);
    setShowProductsModal(true);
  };

  const renderCompanyProduct = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productCategory}>{item.category}</Text>
      <Text style={styles.productQR}>QR: {item.qrCode.slice(0, 15)}...</Text>
    </View>
  );

  const renderCompany = ({ item }: { item: Company }) => (
    <View style={styles.companyCard}>
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{item.name}</Text>
        <Text style={styles.productCount}>
          {getCompanyProducts(item.id).length} products
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.viewButton} onPress={() => handleViewProducts(item)}>
          <Ionicons name="eye" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setEditingId(item.id);
            setNewCompanyName(item.name);
            setShowAddForm(true);
          }}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDelete(item.id, item.name)}
        >
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {showAddForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingId ? "Edit Company" : "Add Company"}</Text>

          <TextInput
            style={styles.input}
            placeholder="Company Name"
            value={newCompanyName}
            onChangeText={setNewCompanyName}
            editable={!saving}
          />

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowAddForm(false);
                setEditingId(null);
                setNewCompanyName('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleAddCompany}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Company</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={companies}
          renderItem={renderCompany}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      {/* PRODUCTS MODAL */}
      <Modal visible={showProductsModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedCompanyName} Products</Text>
            <TouchableOpacity onPress={() => setShowProductsModal(false)}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={
              selectedCompanyId ? getCompanyProducts(selectedCompanyId) : []
            }
            renderItem={renderCompanyProduct}
          />
        </View>
      </Modal>

      {/* DELETE CONFIRM POPUP */}
      <Modal visible={showDeletePopup} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>Delete Company</Text>
            <Text style={styles.popupMsg}>
              Are you sure you want to delete "{selectedCompanyName}"?  
              All products under this company will also be deleted.
            </Text>

            <View style={styles.popupButtons}>
              <TouchableOpacity
                style={[styles.popupBtn, styles.popupCancel]}
                onPress={() => setShowDeletePopup(false)}
              >
                <Text style={styles.popupCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.popupBtn, styles.popupDelete]}
                onPress={executeDelete}
              >
                <Text style={styles.popupDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    justifyContent: "center",
    gap: 8,
  },

  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  form: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },

  formTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  formButtons: { flexDirection: "row", gap: 12 },

  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelButton: { backgroundColor: "#eee" },
  saveButton: { backgroundColor: "#2196F3" },

  cancelButtonText: { color: "#444" },
  saveButtonText: { color: "#fff", fontWeight: "bold" },

  list: { padding: 16 },

  companyCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
  },

  companyInfo: { flex: 1 },

  companyName: { fontSize: 18, fontWeight: "bold" },

  productCount: { color: "#555", marginTop: 4 },

  actions: { flexDirection: "row", gap: 10 },

  viewButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
  },

  editButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 8,
  },

  deleteButton: {
    backgroundColor: "#E53935",
    padding: 10,
    borderRadius: 8,
  },

  modalContainer: { flex: 1, backgroundColor: "#f5f5f5" },

  modalHeader: {
    backgroundColor: "#2196F3",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modalTitle: { fontSize: 20, color: "#fff", fontWeight: "bold" },

  productItem: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 16,
    borderRadius: 12,
  },

  productName: { fontSize: 16, fontWeight: "bold" },

  productCategory: { color: "#777" },

  productQR: { color: "#aaa", fontSize: 12 },

  popupOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  popupBox: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },

  popupTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },

  popupMsg: { fontSize: 16, color: "#444", marginBottom: 20 },

  popupButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },

  popupBtn: { paddingVertical: 10, paddingHorizontal: 16 },

  popupCancel: { backgroundColor: "#eee", borderRadius: 6 },
  popupDelete: { backgroundColor: "#E53935", borderRadius: 6 },

  popupCancelText: { color: "#444", fontWeight: "600" },
  popupDeleteText: { color: "#fff", fontWeight: "bold" },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
