import { queryKeys } from '@fithub/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppTextInput } from '../../components/AppTextInput';
import { ModalCard } from '../../components/ModalCard';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import {
  markPromptShown,
  registerForPushNotifications,
  shouldShowNotificationPrompt,
} from '../../lib/notifications';

export default function ScanScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const scanMutation = useMutation({
    mutationFn: (qrPayload: string) => api.scanCheckin(qrPayload),
    onSuccess: async (result: any) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.member.home(user?.id ?? 'anonymous'),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.member.history(user?.id ?? 'anonymous'),
        }),
      ]);

      setManualCode('');
      setShowSuccessModal(true);

      if (await shouldShowNotificationPrompt(result.total_checkins)) {
        await markPromptShown(result.total_checkins);
        timerRef.current = setTimeout(() => {
          setShowSuccessModal(false);
          setShowPushPrompt(true);
        }, 2000);
      }
    },
    onError: (error: Error) => {
      Alert.alert('Check-in failed', error.message, [
        { text: 'Try again', onPress: () => setScanning(true) },
      ]);
    },
  });

  const handleScan = ({ data }: { data: string }) => {
    if (!scanning || scanMutation.isPending) return;
    setScanning(false);
    scanMutation.mutate(data);
  };

  const closeSuccess = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowSuccessModal(false);
    setScanning(true);
  };

  const handleEnableReminders = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const result = await registerForPushNotifications();
    setShowPushPrompt(false);
    setScanning(true);
    if (!result.granted) {
      Alert.alert(
        'Notifications are still off',
        'You can enable them later from your profile.',
      );
    }
  };

  const handleNotNow = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowPushPrompt(false);
    setScanning(true);
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Camera access required</Text>
        <Text style={styles.subtitle}>
          We need camera access to scan your gym's QR code.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Grant camera permission"
          onPress={requestPermission}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Scan to check in</Text>
        <Text style={styles.subtitle}>
          Point your camera at the live QR code, or paste the signed code below if the camera is unavailable.
        </Text>

        <View style={styles.cameraShell}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanning ? handleScan : undefined}
          />
          <View style={styles.cameraOverlay}>
            <Text style={styles.hint}>Point at the gym's QR code</Text>
          </View>
        </View>

        <View style={styles.manualSection}>
          <Text style={styles.manualTitle}>Manual code entry</Text>
          <AppTextInput
            accessibilityLabel="Signed QR code"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="gym-id:timestamp:signature"
            value={manualCode}
            onChangeText={setManualCode}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Submit manual code"
            disabled={scanMutation.isPending}
            onPress={() => {
              if (!manualCode.trim()) {
                Alert.alert('Missing code', 'Paste the signed QR code to continue.');
                return;
              }
              setScanning(false);
              scanMutation.mutate(manualCode.trim());
            }}
            style={[styles.primaryButton, scanMutation.isPending && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>
              {scanMutation.isPending ? 'Checking in...' : 'Use manual code'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <ModalCard
        visible={showSuccessModal}
        title="Checked in!"
        body="Your visit has been recorded. Nice work showing up today."
        primaryAction={{
          label: 'Done',
          onPress: closeSuccess,
        }}
        onRequestClose={closeSuccess}
      />

      <ModalCard
        visible={showPushPrompt}
        title="Stay on track"
        body="We'll send gentle reminders to help you keep your streak alive. You can adjust them later from your profile."
        primaryAction={{
          label: 'Enable reminders',
          onPress: handleEnableReminders,
        }}
        secondaryAction={{
          label: 'Not now',
          onPress: handleNotNow,
        }}
        onRequestClose={handleNotNow}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1115',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b1115',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#cbd5e1',
  },
  loadingText: {
    color: '#cbd5e1',
    fontSize: 16,
  },
  cameraShell: {
    marginTop: 20,
    height: 360,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#111827',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    end: 0,
    bottom: 0,
    start: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 18,
  },
  hint: {
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  manualSection: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  manualTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 48,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#16a34a',
    paddingHorizontal: 18,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
