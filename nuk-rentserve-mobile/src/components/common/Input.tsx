// Accessible Input Field Component (Single Line & Textarea)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  prefix?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textarea?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  prefix,
  icon,
  rightIcon,
  textarea = false,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Field Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input Box Wrapper */}
      <View
        style={[
          styles.inputWrapper,
          textarea && styles.textareaWrapper,
          isFocused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}
      >
        {icon && <View style={styles.iconBox}>{icon}</View>}
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}

        <TextInput
          style={[
            styles.textInput,
            textarea && styles.textareaInput,
            style,
          ]}
          placeholderTextColor={COLORS.muteLight}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={textarea}
          numberOfLines={textarea ? 3 : 1}
          textAlignVertical={textarea ? 'top' : 'center'}
          {...rest}
        />

        {rightIcon && <View style={styles.iconBox}>{rightIcon}</View>}
      </View>

      {/* Error or Hint Text */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  textareaWrapper: {
    alignItems: 'flex-start',
    minHeight: 96,
    paddingVertical: 10,
  },
  inputWrapperFocused: {
    borderColor: COLORS.brand,
    backgroundColor: '#FFFAFA',
  },
  inputWrapperError: {
    borderColor: COLORS.bad,
    backgroundColor: COLORS.badTint,
  },
  iconBox: {
    marginRight: 8,
  },
  prefix: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.mute,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.ink,
    paddingVertical: 0,
  },
  textareaInput: {
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.bad,
    marginTop: 4,
    marginLeft: 2,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 4,
    marginLeft: 2,
  },
});
