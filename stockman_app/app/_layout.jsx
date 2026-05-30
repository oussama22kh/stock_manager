import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../src/context/AppContext';

function AuthGuard({ children }) {
  const { token, isLoading } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    if (!token && segments[0] !== 'login') {
      router.replace('/login');
    }
  }, [token, isLoading]);

  return children;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <AuthGuard>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="confirmation"
            options={{
              title: 'Confirmation',
              presentation: 'card',
              headerStyle: { backgroundColor: '#002f5e' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="emplacement-products"
            options={{
              title: 'Produits de l\'emplacement',
              presentation: 'card',
              headerStyle: { backgroundColor: '#002f5e' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="product-detail"
            options={{
              title: 'Détail produit',
              presentation: 'card',
              headerStyle: { backgroundColor: '#002f5e' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'Paramètres',
              presentation: 'card',
              headerStyle: { backgroundColor: '#002f5e' },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </AppProvider>
  );
}
