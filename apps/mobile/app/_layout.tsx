import { Slot } from 'expo-router';
import { AuthProvider } from '../lib/auth-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { mobileQueryClient } from '../lib/query-client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={mobileQueryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Slot />
      </AuthProvider>
    </QueryClientProvider>
  );
}
