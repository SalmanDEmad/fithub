import { Redirect, Slot } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { ActivityIndicator, View } from 'react-native';

/**
 * Auth layout: only accessible when NOT authenticated.
 * If user has a session, redirect to private area.
 */
export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(private)/history" />;
  }

  return <Slot />;
}
