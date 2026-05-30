import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

export default function BarcodeScanner({ onScan }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanFeedback, setScanFeedback] = useState(null);
  const scannedRef = useRef(false);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      scannedRef.current = false;
    };
  }, []);

  const showFeedback = useCallback((color, text) => {
    setScanFeedback({ color, text });
    Animated.sequence([
      Animated.timing(feedbackOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(feedbackOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setScanFeedback(null));
  }, [feedbackOpacity]);

  const handleBarcodeScanned = async ({ data }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}

    const keepOpen = await onScan(data);

    if (keepOpen) {
      setTimeout(() => {
        scannedRef.current = false;
      }, 1500);
    } else {
      setActive(false);
    }
  };

  const handleManualSubmit = async () => {
    if (manualCode.trim()) {
      const code = manualCode.trim();
      setShowManual(false);
      setManualCode('');
      const keepOpen = await onScan(code);
      if (keepOpen) {
        setShowManual(true);
      }
    }
  };

  const startScanning = async () => {
    setCameraError('');
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setCameraError('Caméra non disponible. Utilisez la saisie manuelle.');
        return;
      }
    }
    scannedRef.current = false;
    setActive(true);
  };

  const stopScanning = () => {
    setActive(false);
    scannedRef.current = false;
  };

  return (
    <View style={styles.container}>
      {cameraError ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{cameraError}</Text>
        </View>
      ) : null}

      <View style={[styles.cameraContainer, active && styles.cameraActive]}>
        {active ? (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.cameraHint}>
              Appuyez sur Démarrer pour scanner
            </Text>
          </View>
        )}

        {scanFeedback && (
          <Animated.View style={[styles.feedbackOverlay, { opacity: feedbackOpacity, backgroundColor: scanFeedback.color }]}>
            <Text style={styles.feedbackText}>{scanFeedback.text}</Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.buttonRow}>
        {!active ? (
          <TouchableOpacity style={styles.primaryButton} onPress={startScanning}>
            <Text style={styles.primaryButtonText}>Démarrer le scan</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopScanning}>
            <Text style={styles.stopButtonText}>Arrêter le scan</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowManual(true)}>
          <Text style={styles.secondaryButtonText}>Saisie manuelle</Text>
        </TouchableOpacity>
      </View>

      {active && (
        <Text style={styles.scanningHint}>Scannez un code-barres avec la caméra</Text>
      )}

      <Modal visible={showManual} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Saisie manuelle</Text>
            <Text style={styles.modalSubtitle}>Entrez le code-barres:</Text>
            <TextInput
              style={styles.modalInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Code-barres"
              placeholderTextColor="#999"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleManualSubmit}
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setShowManual(false); setManualCode(''); }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, !manualCode.trim() && styles.modalDisabled]}
                onPress={handleManualSubmit}
                disabled={!manualCode.trim()}
              >
                <Text style={styles.modalConfirmText}>Valider</Text>
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
    alignItems: 'center',
    gap: 12,
  },
  warningBanner: {
    width: '100%',
    backgroundColor: '#fef5e0',
    borderWidth: 1,
    borderColor: '#fbb945',
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    color: '#78350f',
    fontSize: 13,
  },
  cameraContainer: {
    width: '100%',
    height: 260,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cameraActive: {
    borderWidth: 2,
    borderColor: '#f86126',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  cameraIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  cameraHint: {
    color: '#888',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#f86126',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#4b5563',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  scanningHint: {
    color: '#888',
    fontSize: 13,
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
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
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
  modalDisabled: {
    opacity: 0.5,
  },
  feedbackOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
