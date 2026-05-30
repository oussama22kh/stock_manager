import { Tabs, useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { useApp } from '../../src/context/AppContext';

function TabIcon({ label, focused }) {
  return (
    <Text style={{
      fontSize: 11,
      fontWeight: focused ? '700' : '400',
      color: focused ? '#f86126' : '#666',
    }}>
      {label}
    </Text>
  );
}

function LogoutButton({ tintColor }) {
  const { logout } = useApp();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 8 }}>
      <Text style={{ color: tintColor, fontSize: 14, fontWeight: '600' }}>
        Déconnexion
      </Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#002f5e' },
        headerTintColor: '#fff',
        headerRight: ({ tintColor }) => <LogoutButton tintColor={tintColor} />,
        tabBarActiveTintColor: '#f86126',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: { paddingBottom: 4, height: 56 },
      }}
    >
      <Tabs.Screen
        name="entrepots"
        options={{
          title: 'Entrepôts',
          tabBarIcon: ({ focused }) => <TabIcon label="🏭" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="produits"
        options={{
          title: 'Produits',
          tabBarIcon: ({ focused }) => <TabIcon label="📦" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
