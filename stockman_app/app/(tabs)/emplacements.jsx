import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';

export default function EmplacementsScreen() {
  const {
    selectedEmplacement, setSelectedEmplacement,
    emplacements, emplacementsLoading, loadEmplacements,
  } = useApp();
  const router = useRouter();

  useEffect(() => {
    loadEmplacements();
  }, [loadEmplacements]);

  const handleSelect = (emplacement) => {
    setSelectedEmplacement(emplacement);
    router.push('/(tabs)/produits');
  };

  const renderCard = ({ item }) => {
    const isSelected = selectedEmplacement?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.location && (
          <Text style={styles.cardSubtitle}>{item.location}</Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.countBadge}>
            {item.products_count || 0} produit{(item.products_count || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (emplacementsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f86126" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sélectionnez un emplacement</Text>
      <FlatList
        data={emplacements}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
});
