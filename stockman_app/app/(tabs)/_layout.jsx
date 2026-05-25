import { Tabs } from 'expo-router';
import { Text } from 'react-native';

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

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#002f5e' },
        headerTintColor: '#fff',
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
