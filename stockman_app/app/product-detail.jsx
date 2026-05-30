import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import api from '../../src/api';

function MovementCard({ item }) {
  const fromText = item.from_emplacement
    ? `${item.from_emplacement.name} · ${item.from_emplacement.warehouse}`
    : 'Aucun';
  const toText = `${item.to_emplacement.name} · ${item.to_emplacement.warehouse}`;
  const date = new Date(item.moved_at).toLocaleString('fr-FR');

  return (
    <View style={styles.movementCard}>
      <View style={styles.movementDot} />
      <View style={styles.movementContent}>
        <Text style={styles.movementDate}>{date}</Text>
        <Text style={styles.movementDesc}>
          {item.from_emplacement ? 'Déplacé' : 'Assigné'}
          {item.moved_by ? ` par ${item.moved_by}` : ''}
        </Text>
        <Text style={styles.movementFrom}>De : {fromText}</Text>
        <Text style={styles.movementArrow}>↓</Text>
        <Text style={styles.movementTo}>Vers : {toText}</Text>
      </View>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { selectedProduit, setSelectedProduit, selectedEmplacement, selectedWarehouse } = useApp();
  const router = useRouter();
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(true);

  useEffect(() => {
    if (!selectedProduit) {
      router.back();
      return;
    }
    (async () => {
      try {
        const data = await api.get(`/produits/${selectedProduit.id}/movements`);
        setMovements(data);
      } catch {
        setMovements([]);
      } finally {
        setLoadingMovements(false);
      }
    })();
  }, [selectedProduit]);

  if (!selectedProduit) return null;

  const isInDifferentEmplacement =
    selectedEmplacement &&
    selectedProduit.emplacement_id &&
    selectedProduit.emplacement_id !== selectedEmplacement.id;

  const handleAssign = () => {
    router.push('/confirmation');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString('fr-FR');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.productName}>{selectedProduit.nom_produit}</Text>
        <Text style={styles.productBarcode}>{selectedProduit.code_produit}</Text>

        {selectedProduit.description ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.label}>Description</Text>
            <Text style={styles.description}>{selectedProduit.description}</Text>
          </>
        ) : null}

        <View style={styles.divider} />

        <Text style={styles.label}>Emplacement actuel</Text>
        {selectedProduit.emplacement_nom ? (
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <View>
              <Text style={styles.locationName}>{selectedProduit.emplacement_nom}</Text>
              <Text style={styles.locationWarehouse}>{selectedProduit.warehouse_nom}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noLocation}>Non assigné</Text>
        )}
      </View>

      {selectedEmplacement && (
        <TouchableOpacity
          style={[
            styles.assignButton,
            selectedProduit.emplacement_id === selectedEmplacement.id && styles.assignButtonDisabled,
          ]}
          onPress={handleAssign}
          disabled={selectedProduit.emplacement_id === selectedEmplacement.id}
        >
          <Text style={styles.assignButtonText}>
            {isInDifferentEmplacement
              ? `Déplacer vers ${selectedEmplacement.name}`
              : selectedProduit.emplacement_id === selectedEmplacement.id
                ? 'Déjà dans cet emplacement'
                : `Assigner à ${selectedEmplacement.name}`}
          </Text>
          <Text style={styles.assignSubtext}>
            {selectedWarehouse?.name}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Historique des mouvements</Text>

      {loadingMovements ? (
        <ActivityIndicator size="small" color="#f86126" style={{ marginTop: 20 }} />
      ) : movements.length === 0 ? (
        <Text style={styles.noMovements}>Aucun mouvement enregistré</Text>
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MovementCard item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.movementsList}
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  productBarcode: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 14,
  },
  label: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationIcon: {
    fontSize: 18,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#002f5e',
  },
  locationWarehouse: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  noLocation: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  assignButton: {
    backgroundColor: '#f86126',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  assignButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  assignSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  movementsList: {
    paddingBottom: 30,
  },
  movementCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  movementDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f86126',
    marginRight: 12,
    marginTop: 4,
  },
  movementContent: {
    flex: 1,
  },
  movementDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  movementDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  movementFrom: {
    fontSize: 12,
    color: '#888',
  },
  movementArrow: {
    fontSize: 12,
    color: '#f86126',
    fontWeight: '700',
    marginVertical: 1,
  },
  movementTo: {
    fontSize: 12,
    color: '#002f5e',
    fontWeight: '500',
  },
  noMovements: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
});
