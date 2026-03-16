import { forwardRef } from 'react';
import {
  I18nManager,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  ViewStyle,
} from 'react-native';

interface AppTextInputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  ({ style, containerStyle, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        style={[
          styles.input,
          {
            textAlign: I18nManager.isRTL ? 'right' : 'left',
            writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
          },
          containerStyle,
          style,
        ]}
        placeholderTextColor="#6b7280"
        {...props}
      />
    );
  },
);

AppTextInput.displayName = 'AppTextInput';

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
});
