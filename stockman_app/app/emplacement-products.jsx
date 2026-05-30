import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import api from '../src/api';
import SelectionBadge from '../src/components/SelectionBadge';

export default function EmplacementProductsScreen() {
  const { selectedEmplacement, selectedWarehouse, setSelectedProduit } = useApp();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!selectedEmplacement) return;
    try {
      const data = await api.get(`/emplacements/${selectedEmplacement.id}/products`);
      setProducts(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedEmplacement]);

  useEffect(() => {
    if (!selectedEmplacement) {
      router.back();
      return;
    }
    fetchProducts();
  }, [selectedEmplacement, fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const handleProductPress = (product) => {
    setSelectedProduit(product);
    router.push('/product-detail');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f86126" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SelectionBadge />

      <View style={styles.headerRow}>
        <Text style={styles.title}>Produits dans cet emplacement</Text>
        <Text style={styles.count}>{products.length} produit{products.length !== 1 ? 's' : ''}</Text>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Aucun produit dans cet emplacement</Text>
          <Text style={styles.emptySubtext}>Scannez un produit pour l'ajouter</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => handleProductPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.nom_produit}</Text>
                  <Text style={styles.productCode}>{item.code_produit}</Text>
                  {item.assigned_by_name && item.assigned_at && (
                    <Text style={styles.productAssigned}>
                      Assigné par {item.assigned_by_name} · {new Date(item.assigned_at).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </View>
                <Text style={styles.productArrow}>›</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f86126']} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  count: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  list: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  productCode: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  productAssigned: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
  productArrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#f86126',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
