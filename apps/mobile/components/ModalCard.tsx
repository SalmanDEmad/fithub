import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface ModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

interface ModalCardProps {
  visible: boolean;
  title: string;
  body: string;
  primaryAction: ModalAction;
  secondaryAction?: ModalAction;
  onRequestClose: () => void;
}

export function ModalCard({
  visible,
  title,
  body,
  primaryAction,
  secondaryAction,
  onRequestClose,
}: ModalCardProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={primaryAction.label}
            onPress={primaryAction.onPress}
            style={[styles.button, styles.primaryButton]}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {primaryAction.label}
            </Text>
          </Pressable>
          {secondaryAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={secondaryAction.label}
              onPress={secondaryAction.onPress}
              style={[styles.button, styles.secondaryButton]}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                {secondaryAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: '#16a34a',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#111827',
  },
});
