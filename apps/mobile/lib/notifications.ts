import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

const PROMPT_STATE_KEY = 'fithub.notification-prompt-state';
const PUSH_TOKEN_KEY = 'fithub.push-token';

type PromptState = {
  enabled: boolean;
  lastPromptedCheckinCount: number | null;
};

export async function getPromptState(): Promise<PromptState> {
  const raw = await AsyncStorage.getItem(PROMPT_STATE_KEY);
  if (!raw) {
    return { enabled: false, lastPromptedCheckinCount: null };
  }

  try {
    return JSON.parse(raw) as PromptState;
  } catch {
    return { enabled: false, lastPromptedCheckinCount: null };
  }
}

export async function shouldShowNotificationPrompt(totalCheckins: number) {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) {
    return false;
  }

  const state = await getPromptState();
  if (state.enabled) {
    return false;
  }

  if (totalCheckins === 1 && state.lastPromptedCheckinCount === null) {
    return true;
  }

  return totalCheckins === 3 && state.lastPromptedCheckinCount === 1;
}

export async function markPromptShown(totalCheckins: number) {
  const current = await getPromptState();
  await AsyncStorage.setItem(
    PROMPT_STATE_KEY,
    JSON.stringify({
      ...current,
      lastPromptedCheckinCount: totalCheckins,
    }),
  );
}

export async function markPromptEnabled() {
  await AsyncStorage.setItem(
    PROMPT_STATE_KEY,
    JSON.stringify({
      enabled: true,
      lastPromptedCheckinCount: 3,
    }),
  );
}

export async function getRegisteredPushToken() {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return { granted: false as const };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  await api.registerPushDevice({
    expo_push_token: token.data,
    platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
    device_name: Constants.deviceName ?? null,
  });

  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
  await markPromptEnabled();
  return { granted: true as const, token: token.data };
}

export async function disablePushNotifications(token: string | null) {
  if (!token) return;
  await api.unregisterPushDevice(token);
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}
