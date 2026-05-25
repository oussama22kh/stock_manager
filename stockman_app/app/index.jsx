import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useApp } from '../src/context/AppContext';

export default function Index() {
  const { token, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#f86126" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/(tabs)/emplacements" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002f5e',
  },
});
