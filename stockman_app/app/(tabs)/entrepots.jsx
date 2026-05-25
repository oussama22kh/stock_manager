import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import api from '../../src/api';

export default function EntrepotsScreen() {
  const {
    selectedWarehouse, setSelectedWarehouse,
    selectedEmplacement, setSelectedEmplacement,
    warehouses, warehousesLoading, warehousesError,
    loadWarehouses, refreshWarehouses,
    emplacements, emplacementsLoading,
    loadEmplacements,
  } = useApp();
  const router = useRouter();
  const [showWarehouses, setShowWarehouses] = useState(true);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  useEffect(() => {
    if (selectedWarehouse && !showWarehouses && emplacements.length === 0) {
      loadEmplacements(selectedWarehouse.id);
    }
  }, [selectedWarehouse, showWarehouses]);

  const handleWarehouseSelect = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowWarehouses(false);
  };

  const handleEmplacementSelect = (emplacement) => {
    setSelectedEmplacement(emplacement);
    router.push('/(tabs)/produits');
  };

  const handleBackToWarehouses = () => {
    setShowWarehouses(true);
    setSelectedWarehouse(null);
  };

  const warehouseCount = useCallback((w) => {
    if (!w.emplacements) return 0;
    return w.emplacements.reduce((sum, e) => sum + (e.products_count || 0), 0);
  }, []);

  if (warehousesLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f86126" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (warehousesError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{warehousesError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshWarehouses}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showWarehouses ? (
        <>
          <Text style={styles.title}>Sélectionnez un entrepôt</Text>
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
          />
        </>
      ) : (
        <>
          <View style={styles.breadcrumb}>
            <TouchableOpacity onPress={handleBackToWarehouses}>
              <Text style={styles.breadcrumbLink}>← Entrepôts</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSeparator}>/</Text>
            <Text style={styles.breadcrumbCurrent}>{selectedWarehouse?.name}</Text>
          </View>

          {emplacementsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#f86126" />
            </View>
          ) : (
            <FlatList
              data={emplacements}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.card, selectedEmplacement?.id === item.id && styles.cardSelected]}
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
            />
          )}
        </>
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
    marginBottom: 16,
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
});
