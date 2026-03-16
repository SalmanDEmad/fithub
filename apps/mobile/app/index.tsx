import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(private)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
