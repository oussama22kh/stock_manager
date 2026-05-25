import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import api from '../src/api';

export default function ConfirmationScreen() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { selectedEmplacement, selectedProduit, setSelectedProduit, selectedWarehouse } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!selectedProduit || !selectedEmplacement) {
      router.replace('/(tabs)/produits');
    }
  }, [selectedProduit, selectedEmplacement, router]);

  if (!selectedProduit || !selectedEmplacement) {
    return null;
  }

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.patch(`/produits/${selectedProduit.id}/emplacement`, {
        emplacement_id: selectedEmplacement.id,
      });
      setSelectedProduit(data);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Erreur lors de l'assignation");
    } finally {
      setLoading(false);
    }
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
        <View style={styles.row}>
          <Text style={styles.label}>Entrepôt</Text>
          <Text style={[styles.value, { color: '#002f5e' }]}>{selectedWarehouse?.name}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Emplacement</Text>
          <Text style={[styles.value, { color: '#002f5e' }]}>{selectedEmplacement.name}</Text>
        </View>

        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Produit assigné avec succès !</Text>
          </View>
        ) : (
          <>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
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
                  <Text style={styles.confirmText}>Confirmer</Text>
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
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
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
