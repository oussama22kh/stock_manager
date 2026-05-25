import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';

export default function Index() {
  const { token, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (token) {
      router.replace('/(tabs)/entrepots');
    } else {
      router.replace('/login');
    }
  }, [token, isLoading, router]);

  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color="#f86126" />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002f5e',
  },
});
