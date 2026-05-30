import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, RefreshControl, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import api from '../../src/api';
import SearchBar from '../../src/components/SearchBar';
import SelectionBadge from '../../src/components/SelectionBadge';

function SkeletonCard() {
  return (
    <View style={styles.skeleton}>
      <View style={[styles.skeletonLine, { width: '70%' }]} />
      <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
      <View style={[styles.skeletonLine, { width: '30%', marginTop: 8 }]} />
    </View>
  );
}

let _BarcodeScanner = null;

export default function ProduitsScreen() {
  const [filteredProduits, setFilteredProduits] = useState([]);
  const [tab, setTab] = useState('scan');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [scanError, setScanError] = useState('');
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scannerLoaded, setScannerLoaded] = useState(false);
  const [scannerFailed, setScannerFailed] = useState(false);
  const scanLoadAttempted = useRef(false);

  const [movePrompt, setMovePrompt] = useState(null);

  const {
    selectedEmplacement, selectedWarehouse,
    setSelectedProduit, setSelectedEmplacement,
    cacheProduct, cacheProducts, findCached,
    invalidateProductCache,
  } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!selectedEmplacement) {
      router.replace('/(tabs)/entrepots');
    }
  }, [selectedEmplacement, router]);

  useEffect(() => {
    if (tab === 'scan' && !scannerLoaded && !scanLoadAttempted.current) {
      scanLoadAttempted.current = true;
      try {
        _BarcodeScanner = require('../../src/components/BarcodeScanner').default;
        setScannerLoaded(true);
      } catch {
        setScannerFailed(true);
        setScannerLoaded(true);
      }
    }
    if (tab === 'search') {
      setSearchQuery('');
      setFilteredProduits([]);
      setHasSearched(false);
      setError('');
    }
  }, [tab]);

  const handleSearch = useCallback(async (query, skipCache = false) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredProduits([]);
      setHasSearched(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    setError('');
    try {
      const data = await api.get(`/produits?search=${encodeURIComponent(query)}`);
      const results = data.filter(p => p.emplacement_id !== selectedEmplacement?.id);
      if (!skipCache) cacheProducts(results);
      setFilteredProduits(results);
      setHasSearched(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  }, [selectedEmplacement, cacheProducts]);

  const onRefresh = useCallback(async () => {
    if (tab === 'search' && searchQuery.trim()) {
      setRefreshing(true);
      await handleSearch(searchQuery, true);
      setRefreshing(false);
    }
  }, [tab, searchQuery, handleSearch]);

  const handleProductSelect = (product) => {
    if (product.emplacement_id && product.emplacement_id !== selectedEmplacement?.id) {
      setMovePrompt({
        product,
        currentEmplacementNom: product.emplacement_nom,
        currentWarehouseNom: product.warehouse_nom,
        targetEmplacementNom: selectedEmplacement.name,
        targetWarehouseNom: selectedWarehouse?.name,
      });
    } else {
      setSelectedProduit(product);
      router.push('/product-detail');
    }
  };

  const handleConfirmMove = () => {
    if (movePrompt) {
      invalidateProductCache(movePrompt.product.code_produit);
      setSelectedProduit(movePrompt.product);
      setMovePrompt(null);
      router.push('/confirmation');
    }
  };

  const handleCancelMove = () => {
    setMovePrompt(null);
  };

  const handleScan = async (code) => {
    setScanError('');

    const cached = findCached(code);
    if (cached) {
      if (cached.emplacement_id === selectedEmplacement?.id) {
        setScanError('Ce produit est déjà dans cet emplacement');
        return true;
      }
      if (cached.emplacement_id) {
        invalidateProductCache(code);
        setMovePrompt({
          product: cached,
          currentEmplacementNom: cached.emplacement_nom,
          currentWarehouseNom: cached.warehouse_nom,
          targetEmplacementNom: selectedEmplacement.name,
          targetWarehouseNom: selectedWarehouse?.name,
        });
        return false;
      }
      setSelectedProduit(cached);
      router.push('/confirmation');
      return false;
    }

    try {
      const data = await api.get(`/produits/code/${code}`);
      cacheProduct(data);
      if (data.emplacement_id === selectedEmplacement?.id) {
        setScanError('Ce produit est déjà dans cet emplacement');
        return true;
      }
      if (data.emplacement_id) {
        setMovePrompt({
          product: data,
          currentEmplacementNom: data.emplacement_nom,
          currentWarehouseNom: data.warehouse_nom,
          targetEmplacementNom: selectedEmplacement.name,
          targetWarehouseNom: selectedWarehouse?.name,
        });
        return false;
      }
      setSelectedProduit(data);
      router.push('/confirmation');
      return false;
    } catch {
      setScanError('Produit non trouvé pour ce code-barres');
      return true;
    }
  };

  if (!selectedEmplacement) return null;

  const tabs = [
    { key: 'scan', label: 'Scanner' },
    { key: 'search', label: 'Recherche' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Produits</Text>
        <SelectionBadge />
      </View>

      <View style={styles.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {scanError ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{scanError}</Text>
          <TouchableOpacity onPress={() => setScanError('')}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {tab === 'scan' && scannerLoaded && _BarcodeScanner && (
        <_BarcodeScanner onScan={handleScan} />
      )}

      {tab === 'scan' && scannerLoaded && scannerFailed && (
        <View style={styles.scannerFailed}>
          <Text style={styles.scannerFailedIcon}>📷❌</Text>
          <Text style={styles.scannerFailedText}>Le scanner n'a pas pu être chargé</Text>
          <Text style={styles.scannerFailedSubtext}>Utilisez la recherche ou redémarrez l'application</Text>
        </View>
      )}

      {tab === 'scan' && !scannerLoaded && (
        <View style={styles.scannerLoading}>
          <ActivityIndicator size="large" color="#f86126" />
        </View>
      )}

      {tab === 'search' && (
        <View style={styles.searchContainer}>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Rechercher par nom ou code..."
          />

          {searching ? (
            <View style={styles.skeletonGrid}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : !hasSearched && !searchQuery ? (
            <View style={styles.preSearch}>
              <Text style={styles.preSearchIcon}>🔍</Text>
              <Text style={styles.preSearchText}>Recherchez un produit</Text>
              <Text style={styles.preSearchSubtext}>par nom ou code-barres</Text>
            </View>
          ) : hasSearched && filteredProduits.length === 0 ? (
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          ) : filteredProduits.length > 0 ? (
            <FlatList
              data={filteredProduits}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() => handleProductSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.productRow}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.nom_produit}</Text>
                      <Text style={styles.productCode}>{item.code_produit}</Text>
                    </View>
                    <Text style={styles.productArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.productList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f86126']} />
              }
            />
          ) : null}
        </View>
      )}

      <Modal visible={!!movePrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Produit déjà placé</Text>
            <Text style={styles.modalProductName}>{movePrompt?.product?.nom_produit}</Text>

            <View style={styles.moveRow}>
              <View style={styles.moveBox}>
                <Text style={styles.moveLabel}>Actuellement</Text>
                <Text style={styles.moveValue}>{movePrompt?.currentEmplacementNom}</Text>
                <Text style={styles.moveSubvalue}>{movePrompt?.currentWarehouseNom}</Text>
              </View>
              <Text style={styles.moveArrow}>→</Text>
              <View style={styles.moveBox}>
                <Text style={styles.moveLabel}>Nouvel emplacement</Text>
                <Text style={styles.moveValue}>{movePrompt?.targetEmplacementNom}</Text>
                <Text style={styles.moveSubvalue}>{movePrompt?.targetWarehouseNom}</Text>
              </View>
            </View>

            <Text style={styles.modalQuestion}>Voulez-vous le déplacer ?</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={handleCancelMove}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleConfirmMove}>
                <Text style={styles.modalConfirmText}>Déplacer</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#f86126',
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    color: '#c2410c',
    fontSize: 13,
    flex: 1,
  },
  errorClose: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  searchContainer: {
    flex: 1,
  },
  scannerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  scannerFailed: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
  },
  scannerFailedIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  scannerFailedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  scannerFailedSubtext: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
  },
  skeleton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonGrid: {
    marginTop: 8,
  },
  preSearch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  preSearchIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  preSearchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  preSearchSubtext: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 15,
    marginTop: 40,
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
  productArrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 8,
  },
  productList: {
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '88%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#c2410c',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  moveBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  moveLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  moveValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  moveSubvalue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  moveArrow: {
    fontSize: 24,
    color: '#f86126',
    fontWeight: '700',
    marginHorizontal: 8,
  },
  modalQuestion: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: '#f86126',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
