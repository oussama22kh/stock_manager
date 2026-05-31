import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import SelectionBadge from '../../src/components/SelectionBadge';

export default function EntrepotsScreen() {
  const {
    selectedWarehouse, setSelectedWarehouse,
    selectedEmplacement, setSelectedEmplacement,
    warehouses, warehousesLoading, warehousesError,
    loadWarehouses, refreshWarehouses,
    emplacements, emplacementsLoading, emplacementsError,
    loadEmplacements,
  } = useApp();
  const router = useRouter();
  const [showWarehouses, setShowWarehouses] = useState(true);
  const [refreshingWarehouses, setRefreshingWarehouses] = useState(false);
  const [refreshingEmplacements, setRefreshingEmplacements] = useState(false);
  const [emplacementSearch, setEmplacementSearch] = useState('');

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  useEffect(() => {
    if (selectedWarehouse && !showWarehouses) {
      loadEmplacements(selectedWarehouse.id);
    }
  }, [selectedWarehouse, showWarehouses, loadEmplacements]);

  const handleWarehouseSelect = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setSelectedEmplacement(null);
    setShowWarehouses(false);
    setEmplacementSearch('');
  };

  const handleEmplacementSelect = (emplacement) => {
    setSelectedEmplacement(emplacement);
  };

  const handleScanProduct = () => {
    router.push('/(tabs)/produits');
  };

  const handleViewProducts = () => {
    router.push('/emplacement-products');
  };

  const handleBackToWarehouses = () => {
    setShowWarehouses(true);
    setSelectedWarehouse(null);
    setSelectedEmplacement(null);
    setEmplacementSearch('');
  };

  const onRefreshWarehouses = useCallback(async () => {
    setRefreshingWarehouses(true);
    await refreshWarehouses();
    setRefreshingWarehouses(false);
  }, [refreshWarehouses]);

  const onRefreshEmplacements = useCallback(async () => {
    if (!selectedWarehouse) return;
    setRefreshingEmplacements(true);
    await loadEmplacements(selectedWarehouse.id);
    setRefreshingEmplacements(false);
  }, [selectedWarehouse, loadEmplacements]);

  const warehouseCount = useCallback((w) => {
    if (!w.emplacements) return 0;
    return w.emplacements.reduce((sum, e) => sum + (e.products_count || 0), 0);
  }, []);

  if (warehousesLoading && warehouses.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f86126" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (warehousesError && warehouses.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{warehousesError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshWarehouses}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showWarehouses) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sélectionnez un entrepôt</Text>

        {warehouses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏭</Text>
            <Text style={styles.emptyText}>Aucun entrepôt disponible</Text>
            <Text style={styles.emptySubtext}>Contactez un administrateur</Text>
          </View>
        ) : (
          <FlatList
            data={warehouses}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, selectedWarehouse?.id === item.id && styles.cardSelected]}
                onPress={() => handleWarehouseSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.location ? (
                  <Text style={styles.cardSubtitle}>{item.location}</Text>
                ) : null}
                <View style={styles.cardFooter}>
                  <Text style={styles.countBadge}>
                    {warehouseCount(item)} produit{warehouseCount(item) !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.emplacementCount}>
                    {item.emplacements?.length || 0} emplacement{(item.emplacements?.length || 0) !== 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshingWarehouses} onRefresh={onRefreshWarehouses} colors={['#f86126']} />
            }
          />
        )}
      </View>
    );
  }

  const filteredEmplacements = useMemo(() => {
    if (!emplacementSearch.trim()) return emplacements
    const q = emplacementSearch.trim().toLowerCase()
    return emplacements.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.location && e.location.toLowerCase().includes(q))
    )
  }, [emplacements, emplacementSearch])

  return (
    <View style={styles.container}>
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={handleBackToWarehouses}>
          <Text style={styles.breadcrumbLink}>← Entrepôts</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSeparator}>/</Text>
        <Text style={styles.breadcrumbCurrent}>{selectedWarehouse?.name}</Text>
      </View>

      <SelectionBadge />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un emplacement..."
          placeholderTextColor="#999"
          value={emplacementSearch}
          onChangeText={setEmplacementSearch}
          clearButtonMode="while-editing"
        />
        {emplacementSearch !== '' && (
          <TouchableOpacity onPress={() => setEmplacementSearch('')} style={styles.searchClear}>
            <Text style={styles.searchClearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {emplacementsLoading && emplacements.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#f86126" />
        </View>
      ) : emplacementsError && emplacements.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{emplacementsError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefreshEmplacements}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : filteredEmplacements.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{emplacementSearch ? '🔍' : '📍'}</Text>
          <Text style={styles.emptyText}>
            {emplacementSearch ? 'Aucun emplacement trouvé' : 'Aucun emplacement dans cet entrepôt'}
          </Text>
          <Text style={styles.emptySubtext}>
            {emplacementSearch ? 'Essayez un autre terme de recherche' : 'Ajoutez des emplacements depuis l\'administration'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmplacements}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, selectedEmplacement?.id === item.id && styles.cardEmplacementSelected]}
              onPress={() => handleEmplacementSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.location ? (
                <Text style={styles.cardSubtitle}>{item.location}</Text>
              ) : null}
              <View style={styles.cardFooter}>
                <Text style={styles.countBadge}>
                  {item.products_count || 0} produit{(item.products_count || 0) !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshingEmplacements} onRefresh={onRefreshEmplacements} colors={['#f86126']} />
          }
        />
      )}

      {selectedEmplacement && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={handleScanProduct}>
            <Text style={styles.actionButtonText}>📷 Scanner un produit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonOutline} onPress={handleViewProducts}>
            <Text style={styles.actionButtonOutlineText}>📋 Voir les produits</Text>
          </TouchableOpacity>
        </View>
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
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  breadcrumbLink: {
    fontSize: 15,
    color: '#f86126',
    fontWeight: '600',
  },
  breadcrumbSeparator: {
    fontSize: 15,
    color: '#999',
    marginHorizontal: 8,
  },
  breadcrumbCurrent: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#f86126',
    backgroundColor: '#fff8f5',
  },
  cardEmplacementSelected: {
    borderColor: '#002f5e',
    backgroundColor: '#e8f0fe',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countBadge: {
    fontSize: 12,
    color: '#002f5e',
    fontWeight: '500',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  emplacementCount: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
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
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f86126',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#002f5e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonOutlineText: {
    color: '#002f5e',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchClear: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  searchClearText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
});
