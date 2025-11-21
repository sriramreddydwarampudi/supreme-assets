import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	RefreshControl,
	Alert,
	TextInput,
	Modal,
	ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
	getCustomerProducts,
	deleteCustomerProduct,
	updateCustomerProduct,
} from '../../utils/firebaseStorage';
import { getCurrentUser } from '../../utils/auth';
import { StatusToggle } from '../../components/StatusToggle';
import { CustomerProduct } from '../../types';

declare global {
	var productJustAdded: string | null | undefined;
}

export default function MyProductsScreen() {
	const [products, setProducts] = useState<CustomerProduct[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [togglingId, setTogglingId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [editingProduct, setEditingProduct] = useState<CustomerProduct | null>(null);
	const [editSerialNumber, setEditSerialNumber] = useState('');
	const [editNotes, setEditNotes] = useState('');
	const [showEditModal, setShowEditModal] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);
	const router = useRouter();

	const loadProducts = async () => {
		try {
			console.log('[LOAD_PRODUCTS] Loading products...');
			const user = await getCurrentUser();
			console.log('[LOAD_PRODUCTS] Current user:', user?.id, user?.email);
			if (!user) {
				console.log('[LOAD_PRODUCTS] No user found, setting empty products');
				setProducts([]);
				setUserId(null);
				return;
			}
			setUserId(user.id);
			const customerProducts = await getCustomerProducts(user.id);
			console.log('[LOAD_PRODUCTS] Loaded products count:', customerProducts.length);
			console.log('[LOAD_PRODUCTS] Products:', customerProducts);
			setProducts(customerProducts);
			if (globalThis.productJustAdded) {
				globalThis.productJustAdded = null;
			}
		} catch (error) {
			console.error('[LOAD_PRODUCTS] Error loading products:', error);
			Alert.alert('Error', 'Failed to load products. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadProducts();
	}, []);

	useFocusEffect(
		React.useCallback(() => {
			loadProducts();
		}, [])
	);

	const onRefresh = async () => {
		setRefreshing(true);
		await loadProducts();
		setRefreshing(false);
	};

	const handleStatusToggle = async (product: CustomerProduct) => {
		if (togglingId === product.id) return;
		setTogglingId(product.id);
		try {
			if (!userId) {
				console.error('[STATUS_TOGGLE] User ID is null');
				throw new Error('User not found');
			}
			console.log('[STATUS_TOGGLE] Toggling product:', product.id, 'Current status:', product.status);
			const newStatus = product.status === 'working' ? 'not-working' : 'working';
			console.log('[STATUS_TOGGLE] New status:', newStatus);
			const result = await updateCustomerProduct(userId, product.id, { status: newStatus });
			console.log('[STATUS_TOGGLE] Update result:', result);
			await loadProducts();
			console.log('[STATUS_TOGGLE] Products reloaded successfully');
		} catch (error) {
			console.error('[STATUS_TOGGLE] Failed to update product status:', error);
			Alert.alert('Error', 'Failed to update product status. Please try again.');
		} finally {
			setTogglingId(null);
		}
	};

	async function handleDeleteProduct(product: CustomerProduct) {
		console.log('[DELETE_PRODUCT] Delete button pressed for:', product.id, product.product.name);
		try {
			if (!userId) {
				console.error('[DELETE_PRODUCT] User ID is null');
				throw new Error('User not found');
			}
			console.log('[DELETE_PRODUCT] Attempting to delete product:', product.id);
			console.log('[DELETE_PRODUCT] User ID:', userId);
			const result = await deleteCustomerProduct(userId, product.id);
			console.log('[DELETE_PRODUCT] Delete result:', result);
			await loadProducts();
			console.log('[DELETE_PRODUCT] Products reloaded successfully');
		} catch (error) {
			console.error('[DELETE_PRODUCT] Failed to delete product:', error);
			Alert.alert('Error', 'Failed to delete product. Please try again.');
		}
	}

	const handleEditProduct = (product: CustomerProduct) => {
		console.log('[EDIT_PRODUCT] Opening edit modal for:', product.id);
		setEditingProduct(product);
		setEditSerialNumber(product.serialNumber || '');
		setEditNotes(product.notes || '');
		setShowEditModal(true);
	};

	const handleSaveEdit = async () => {
		if (!editingProduct) {
			console.error('[SAVE_EDIT] No product selected');
			return;
		}
		try {
			if (!userId) {
				console.error('[SAVE_EDIT] User ID is null');
				throw new Error('User not found');
			}
			console.log('[SAVE_EDIT] Saving edit for product:', editingProduct.id);
			console.log('[SAVE_EDIT] Serial number:', editSerialNumber);
			console.log('[SAVE_EDIT] Notes:', editNotes);
			await updateCustomerProduct(userId, editingProduct.id, {
				serialNumber: editSerialNumber,
				notes: editNotes,
			});
			console.log('[SAVE_EDIT] Update successful');
			await loadProducts();
			setShowEditModal(false);
		} catch (error) {
			console.error('[SAVE_EDIT] Failed to save edit:', error);
			Alert.alert('Error', 'Failed to update product. Please try again.');
		}
	};

	const renderProduct = ({ item }: { item: CustomerProduct }) => (
		<View style={styles.productCard}>
			<View style={styles.productHeader}>
				<View style={styles.productInfo}>
					<Text style={styles.productName}>{item.product.name}</Text>
					<Text style={styles.productCompany}>{(item.product.companyNames || []).join(', ')}</Text>
					<Text style={styles.productCategory}>{item.product.category}</Text>
					{item.serialNumber && (
						<Text style={styles.serialNumber}>SN: {item.serialNumber}</Text>
					)}
					<Text style={styles.purchaseDate}>
						Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
					</Text>
				</View>
			</View>
			<StatusToggle status={item.status} onToggle={() => handleStatusToggle(item)} />
			{item.notes && (
				<View style={styles.notesContainer}>
					<Text style={styles.notesLabel}>Notes:</Text>
					<Text style={styles.notes}>{item.notes}</Text>
				</View>
			)}
			<View style={styles.actionButtons}>
				<TouchableOpacity style={styles.viewButton} onPress={() => router.push(`/library/product/${item.product.id}`)}>
					<View style={styles.buttonContent}>
						<Ionicons name="eye-outline" size={20} color="#2196F3" />
						<Text style={styles.buttonText}>View</Text>
					</View>
				</TouchableOpacity>
				<TouchableOpacity style={styles.manualButton} onPress={() => router.push(`/library/product/${item.product.id}`)}>
					<View style={styles.buttonContent}>
						<Ionicons name="document-text-outline" size={20} color="#4CAF50" />
						<Text style={styles.buttonText}>Manual</Text>
					</View>
				</TouchableOpacity>
				<TouchableOpacity style={styles.editButton} onPress={() => handleEditProduct(item)}>
					<View style={styles.buttonContent}>
						<Ionicons name="pencil-outline" size={20} color="#FF9800" />
						<Text style={styles.buttonText}>Edit</Text>
					</View>
				</TouchableOpacity>
				<TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(item)}>
					<View style={styles.buttonContent}>
						<Ionicons name="trash-outline" size={20} color="#F44336" />
						<Text style={styles.buttonText}>Delete</Text>
					</View>
				</TouchableOpacity>
			</View>
		</View>
	);

	if (loading) {
		return (
			<View style={[styles.container, styles.centerContent]}>
				<ActivityIndicator size="large" color="#2196F3" />
				<Text style={styles.loadingText}>Loading your products...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={products}
				renderItem={renderProduct}
				keyExtractor={item => item.id}
				contentContainerStyle={styles.list}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				ListHeaderComponent={
					<View style={styles.header}>
						<Text style={styles.headerTitle}>My Products</Text>
						<TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-product')}>
							<Ionicons name="add" size={24} color="#fff" />
						</TouchableOpacity>
					</View>
				}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Ionicons name="cube-outline" size={64} color="#ccc" />
						<Text style={styles.emptyText}>No products yet</Text>
						<Text style={styles.emptySubtext}>Add products from the library</Text>
						<TouchableOpacity style={styles.addProductButton} onPress={() => router.push('/add-product')}>
							<Text style={styles.addProductButtonText}>Add Product</Text>
						</TouchableOpacity>
					</View>
				}
			/>
			<Modal
				visible={showEditModal}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowEditModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Edit Product</Text>
							<TouchableOpacity onPress={() => setShowEditModal(false)}>
								<Ionicons name="close" size={24} color="#666" />
							</TouchableOpacity>
						</View>
						{editingProduct && (
							<View style={styles.modalBody}>
								<Text style={styles.editProductName}>{editingProduct.product.name}</Text>
								<Text style={styles.inputLabel}>Serial Number</Text>
								<TextInput
									style={styles.modalInput}
									placeholder="Enter serial number (optional)"
									value={editSerialNumber}
									onChangeText={setEditSerialNumber}
								/>
								<Text style={styles.inputLabel}>Notes</Text>
								<TextInput
									style={[styles.modalInput, styles.notesInput]}
									placeholder="Add notes (optional)"
									value={editNotes}
									onChangeText={setEditNotes}
									multiline
									numberOfLines={4}
									textAlignVertical="top"
								/>
								<View style={styles.modalButtons}>
									<TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowEditModal(false)}>
										<Text style={styles.cancelButtonText}>Cancel</Text>
									</TouchableOpacity>
									<TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEdit}>
										<Ionicons name="checkmark" size={20} color="#fff" />
										<Text style={styles.saveButtonText}>Save</Text>
									</TouchableOpacity>
								</View>
							</View>
						)}
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	centerContent: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: '#666',
	},
	list: {
		padding: 16,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	addButton: {
		backgroundColor: '#2196F3',
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	productCard: {
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
	productHeader: {
		marginBottom: 16,
	},
	productInfo: {
		flex: 1,
	},
	productName: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	productCompany: {
		fontSize: 14,
		color: '#2196F3',
		marginBottom: 2,
	},
	productCategory: {
		fontSize: 13,
		color: '#666',
		marginBottom: 2,
	},
	serialNumber: {
		fontSize: 12,
		color: '#999',
		marginBottom: 2,
	},
	purchaseDate: {
		fontSize: 12,
		color: '#999',
		marginBottom: 2,
	},
	notesContainer: {
		marginTop: 8,
		backgroundColor: '#f9f9f9',
		borderRadius: 8,
		padding: 8,
	},
	notesLabel: {
		fontWeight: 'bold',
		color: '#666',
		marginBottom: 2,
	},
	notes: {
		fontSize: 13,
		color: '#444',
	},
	actionButtons: {
		flexDirection: 'row',
		gap: 8,
		marginTop: 12,
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	viewButton: {
		backgroundColor: '#2196F3',
		padding: 8,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
	manualButton: {
		backgroundColor: '#4CAF50',
		padding: 8,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
	editButton: {
		backgroundColor: '#FF9800',
		padding: 8,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
	deleteButton: {
		backgroundColor: '#F44336',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		minWidth: 80,
	},
	buttonContent: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
		marginLeft: 4,
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 32,
	},
	emptyText: {
		fontSize: 18,
		color: '#999',
		marginBottom: 8,
		textAlign: 'center',
	},
	emptySubtext: {
		fontSize: 14,
		color: '#bbb',
		marginBottom: 16,
		textAlign: 'center',
	},
	addProductButton: {
		backgroundColor: '#2196F3',
		padding: 12,
		borderRadius: 8,
		marginTop: 8,
	},
	addProductButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#fff',
		borderRadius: 12,
		width: '80%',
		maxHeight: '70%',
		overflow: 'hidden',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	modalBody: {
		padding: 16,
	},
	editProductName: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	inputLabel: {
		fontSize: 13,
		color: '#666',
		marginBottom: 4,
	},
	modalInput: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 10,
		marginBottom: 12,
		fontSize: 15,
		backgroundColor: '#f9f9f9',
	},
	notesInput: {
		minHeight: 60,
	},
	modalButtons: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 8,
		justifyContent: 'flex-end',
	},
	modalButton: {
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
		flexDirection: 'row',
		gap: 4,
	},
	cancelButton: {
		backgroundColor: '#eee',
	},
	saveButton: {
		backgroundColor: '#2196F3',
	},
	cancelButtonText: {
		color: '#666',
		fontSize: 15,
		fontWeight: 'bold',
	},
	saveButtonText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: 'bold',
	},
});