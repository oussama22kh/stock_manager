import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import api from '../../src/api';
import SearchBar from '../../src/components/SearchBar';
import BarcodeScanner from '../../src/components/BarcodeScanner';

function SkeletonCard() {
  return (
    <View style={styles.skeleton}>
      <View style={[styles.skeletonLine, { width: '70%' }]} />
      <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
      <View style={[styles.skeletonLine, { width: '30%', marginTop: 8 }]} />
    </View>
  );
}

export default function ProduitsScreen() {
  const [filteredProduits, setFilteredProduits] = useState([]);
  const [tab, setTab] = useState('scan');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [scanError, setScanError] = useState('');
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const {
    selectedEmplacement, setSelectedProduit,
    cacheProduct, cacheProducts, findCached,
  } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!selectedEmplacement) {
      router.replace('/(tabs)/emplacements');
    }
  }, [selectedEmplacement, router]);

  useEffect(() => {
    if (tab === 'search') {
      setSearchQuery('');
      setFilteredProduits([]);
      setHasSearched(false);
      setError('');
    }
  }, [tab]);

  const handleSearch = useCallback(async (query) => {
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
      cacheProducts(results);
      setFilteredProduits(results);
      setHasSearched(true);
    } catch {
      setError('Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  }, [selectedEmplacement, cacheProducts]);

  const handleProductClick = (product) => {
    setSelectedProduit(product);
    router.push('/confirmation');
  };

  const handleScan = async (code) => {
    setScanError('');

    const cached = findCached(code);
    if (cached) {
      if (cached.emplacement_id === selectedEmplacement?.id) {
        setScanError('Ce produit est déjà dans cet emplacement');
        return;
      }
      setSelectedProduit(cached);
      router.push('/confirmation');
      return;
    }

    try {
      const data = await api.get(`/produits/code/${code}`);
      cacheProduct(data);
      if (data.emplacement_id === selectedEmplacement?.id) {
        setScanError('Ce produit est déjà dans cet emplacement');
        return;
      }
      setSelectedProduit(data);
      router.push('/confirmation');
    } catch {
      setScanError('Produit non trouvé pour ce code-barres');
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
        <Text style={styles.emplacementBadge}>
          {selectedEmplacement.name}
        </Text>
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
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{scanError}</Text>
          <TouchableOpacity onPress={() => setScanError('')}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {tab === 'scan' && (
        <BarcodeScanner onScan={handleScan} />
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
          ) : hasSearched && filteredProduits.length === 0 ? (
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          ) : filteredProduits.length > 0 ? (
            <FlatList
              data={filteredProduits}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productCard}
                  onPress={() => handleProductClick(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.productName}>{item.nom_produit}</Text>
                  <Text style={styles.productCode}>{item.code_produit}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.productList}
              showsVerticalScrollIndicator={false}
            />
          ) : null}
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
  emplacementBadge: {
    fontSize: 13,
    color: '#002f5e',
    fontWeight: '600',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
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
  errorClose: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  searchContainer: {
    flex: 1,
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
  productList: {
    paddingBottom: 20,
  },
});
