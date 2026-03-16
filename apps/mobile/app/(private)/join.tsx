import { queryKeys } from '@fithub/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppTextInput } from '../../components/AppTextInput';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

export default function JoinGymScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const joinMutation = useMutation({
    mutationFn: () => api.joinGym(code.trim(), name.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.member.home(user?.id ?? 'anonymous'),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.member.history(user?.id ?? 'anonymous'),
      });
      Alert.alert('Welcome!', 'You have joined the gym.', [
        { text: 'Open Home', onPress: () => router.replace('/(private)') },
      ]);
      setCode('');
      setName('');
    },
    onError: (error: Error) => {
      Alert.alert('Could not join gym', error.message);
    },
  });

  const handleJoin = () => {
    if (!code.trim() || !name.trim()) {
      Alert.alert('Missing details', 'Please fill in both fields.');
      return;
    }

    joinMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Join a gym</Text>
        <Text style={styles.title}>Use your invite code</Text>
        <Text style={styles.subtitle}>
          Paste the invite code your gym shared with you, then choose the name other members will see.
        </Text>

        <AppTextInput
          accessibilityLabel="Invite code"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Invite code"
          value={code}
          onChangeText={setCode}
          style={styles.input}
        />
        <AppTextInput
          accessibilityLabel="Display name"
          placeholder="Your display name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Join gym"
          disabled={joinMutation.isPending}
          onPress={handleJoin}
          style={[styles.button, joinMutation.isPending && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {joinMutation.isPending ? 'Joining...' : 'Join Gym'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8f4',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#15803d',
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  input: {
    marginTop: 16,
  },
  button: {
    minHeight: 48,
    marginTop: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
