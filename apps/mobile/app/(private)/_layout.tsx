import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../lib/auth-context';
import { Home, History, Camera, Dumbbell, User } from 'lucide-react-native';

export default function PrivateLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#171717',
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopColor: '#e5e7eb',
          minHeight: 68,
          paddingBottom: 10,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => (
            <Home size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }: { color: string }) => (
            <History size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Check In',
          tabBarIcon: ({ color }: { color: string }) => (
            <Camera size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="join"
        options={{
          title: 'Join Gym',
          tabBarIcon: ({ color }: { color: string }) => (
            <Dumbbell size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => (
            <User size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
