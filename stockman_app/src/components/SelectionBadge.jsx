import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function SelectionBadge() {
  const { selectedWarehouse, selectedEmplacement } = useApp();

  if (!selectedWarehouse && !selectedEmplacement) return null;

  return (
    <View style={styles.container}>
      {selectedWarehouse ? (
        <View style={styles.item}>
          <Text style={styles.icon}>🏭</Text>
          <Text style={styles.text}>{selectedWarehouse.name}</Text>
        </View>
      ) : null}
      {selectedWarehouse && selectedEmplacement ? (
        <Text style={styles.arrow}> → </Text>
      ) : null}
      {selectedEmplacement ? (
        <View style={styles.item}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.text}>{selectedEmplacement.name}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  arrow: {
    fontSize: 12,
    color: '#002f5e',
    fontWeight: '700',
    marginHorizontal: 2,
  },
  text: {
    fontSize: 12,
    color: '#002f5e',
    fontWeight: '600',
    maxWidth: 160,
  },
});
