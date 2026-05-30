import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import api from '../src/api';

export default function ConfirmationScreen() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const {
    selectedEmplacement, selectedProduit, setSelectedProduit,
    selectedWarehouse, invalidateProductCache,
  } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!selectedProduit || !selectedEmplacement) {
      router.replace('/(tabs)/produits');
    }
  }, [selectedProduit, selectedEmplacement, router]);

  if (!selectedProduit || !selectedEmplacement) {
    return null;
  }

  const isMoving = selectedProduit.emplacement_id && selectedProduit.emplacement_id !== selectedEmplacement.id;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.patch(`/produits/${selectedProduit.id}/emplacement`, {
        emplacement_id: selectedEmplacement.id,
      });

      if (data.already_assigned) {
        setError('Ce produit est déjà dans cet emplacement');
        setLoading(false);
        return;
      }

      setSelectedProduit(data);
      if (selectedProduit.code_produit) {
        invalidateProductCache(selectedProduit.code_produit);
      }
      setResult(data);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Erreur lors de l'assignation");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    handleConfirm();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmation</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Produit</Text>
          <Text style={styles.value}>{selectedProduit.nom_produit}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Code</Text>
          <Text style={[styles.value, styles.mono]}>{selectedProduit.code_produit}</Text>
        </View>
        <View style={styles.divider} />

        {isMoving && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>De</Text>
              <View>
                <Text style={styles.value}>{selectedProduit.emplacement_nom}</Text>
                <Text style={styles.locationDetail}>{selectedProduit.warehouse_nom}</Text>
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>{isMoving ? 'Vers' : 'Emplacement'}</Text>
          <View>
            <Text style={[styles.value, { color: '#002f5e' }]}>{selectedEmplacement.name}</Text>
            <Text style={styles.locationDetail}>{selectedWarehouse?.name}</Text>
          </View>
        </View>

        {isMoving && (
          <View style={styles.moveIndicator}>
            <Text style={styles.moveArrow}>↓</Text>
            <Text style={styles.moveHint}>Déplacement de produit</Text>
          </View>
        )}

        {success && result ? (
          <View style={styles.resultBox}>
            <View style={styles.successBanner}>
              <Text style={styles.successText}>
                {result.was_moved ? 'Produit déplacé avec succès !' : 'Produit assigné avec succès !'}
              </Text>
            </View>
            {result.was_moved && (
              <View style={styles.moveSummary}>
                <Text style={styles.moveSummaryLabel}>De</Text>
                <Text style={styles.moveSummaryValue}>
                  {result.previous_emplacement_nom} · {result.previous_warehouse_nom}
                </Text>
                <Text style={styles.moveSummaryArrow}>↓</Text>
                <Text style={styles.moveSummaryLabel}>Vers</Text>
                <Text style={styles.moveSummaryValue}>
                  {result.emplacement_nom} · {result.warehouse_nom}
                </Text>
              </View>
            )}
            {result.assigned_by_name && (
              <Text style={styles.assignedBy}>
                Assigné par {result.assigned_by_name} · {new Date(result.assigned_at).toLocaleString('fr-FR')}
              </Text>
            )}
          </View>
        ) : (
          <>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
                <View style={styles.errorActions}>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRetry}
                  >
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setError('')}>
                    <Text style={styles.errorClose}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.buttonDisabled]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>
                    {isMoving ? 'Déplacer' : 'Confirmer'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {success && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/produits')}
          >
            <Text style={styles.backButtonText}>Retour aux produits</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    paddingVertical: 12,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mono: {
    fontFamily: 'monospace',
  },
  locationDetail: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  moveIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  moveArrow: {
    fontSize: 20,
    color: '#f86126',
    fontWeight: '700',
  },
  moveHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  successText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 16,
  },
  moveSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  moveSummaryLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  moveSummaryValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  moveSummaryArrow: {
    fontSize: 16,
    color: '#f86126',
    fontWeight: '700',
    marginVertical: 2,
  },
  assignedBy: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  errorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  errorClose: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '700',
    paddingLeft: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#f86126',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  backButton: {
    backgroundColor: '#f86126',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
