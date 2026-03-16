import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../lib/auth-context';
import {
  disablePushNotifications,
  getPromptState,
  getRegisteredPushToken,
  registerForPushNotifications,
} from '../../lib/notifications';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getRegisteredPushToken(), getPromptState()]).then(
      ([token, promptState]) => {
        setPushToken(token);
        setNotificationsEnabled(Boolean(token) || promptState.enabled);
      },
    );
  }, []);

  const handleEnableNotifications = async () => {
    const result = await registerForPushNotifications();
    if (!result.granted) {
      Alert.alert(
        'Notifications are off',
        'Permission was not granted. You can try again anytime.',
      );
      return;
    }

    setNotificationsEnabled(true);
    setPushToken(result.token);
  };

  const handleDisableNotifications = async () => {
    await disablePushNotifications(pushToken);
    setNotificationsEnabled(false);
    setPushToken(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.email?.charAt(0).toUpperCase() ?? '?'}
        </Text>
      </View>

      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>User ID</Text>
        <Text style={styles.infoValue}>{user?.id}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Reminders</Text>
        <Text style={styles.cardBody}>
          {notificationsEnabled
            ? 'Gentle streak reminders are enabled on this device.'
            : 'Reminders are off right now. Turn them on when you want a nudge back to the gym.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            notificationsEnabled
              ? 'Disable reminder notifications'
              : 'Enable reminder notifications'
          }
          onPress={
            notificationsEnabled
              ? handleDisableNotifications
              : handleEnableNotifications
          }
          style={[
            styles.notificationButton,
            notificationsEnabled
              ? styles.notificationButtonSecondary
              : styles.notificationButtonPrimary,
          ]}
        >
          <Text
            style={[
              styles.notificationButtonText,
              notificationsEnabled
                ? styles.notificationButtonTextSecondary
                : styles.notificationButtonTextPrimary,
            ]}
          >
            {notificationsEnabled ? 'Disable reminders' : 'Enable reminders'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        style={styles.signOutButton}
        onPress={signOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    paddingTop: 48,
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '700',
  },
  email: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#f9fafb',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 13,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cardBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#4b5563',
  },
  notificationButton: {
    minHeight: 48,
    marginTop: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  notificationButtonPrimary: {
    backgroundColor: '#16a34a',
  },
  notificationButtonSecondary: {
    backgroundColor: '#e5e7eb',
  },
  notificationButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  notificationButtonTextPrimary: {
    color: '#ffffff',
  },
  notificationButtonTextSecondary: {
    color: '#111827',
  },
  signOutButton: {
    marginTop: 'auto',
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#fee2e2',
  },
  signOutText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '700',
  },
});
