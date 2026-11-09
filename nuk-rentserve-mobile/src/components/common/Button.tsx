// Accessible, Multi-variant Mobile Button

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'yellow' | 'outline' | 'ghost' | 'dark' | 'danger' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  pill?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  pill = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'yellow':
        return {
          backgroundColor: disabled ? '#F3E4AD' : COLORS.sun,
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: COLORS.white,
          borderColor: COLORS.line,
          borderWidth: 1.5,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'dark':
        return {
          backgroundColor: disabled ? '#9A9A9A' : COLORS.ink,
          borderColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: COLORS.white,
          borderColor: COLORS.bad,
          borderWidth: 1.5,
        };
      case 'glass':
        return {
          backgroundColor: COLORS.white,
          borderColor: COLORS.line,
          borderWidth: 1,
        };
      case 'primary':
      default:
        return {
          backgroundColor: disabled ? '#E4B3B5' : COLORS.brand,
          borderColor: 'transparent',
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'yellow':
        return { color: COLORS.ink };
      case 'outline':
        return { color: disabled ? COLORS.muteLight : COLORS.ink };
      case 'ghost':
        return { color: COLORS.brand };
      case 'dark':
        return { color: COLORS.white };
      case 'danger':
        return { color: COLORS.bad };
      case 'glass':
        return { color: COLORS.ink };
      case 'primary':
      default:
        return { color: COLORS.white };
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 38;
      case 'lg':
        return 56;
      case 'md':
      default:
        return 48;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 13;
      case 'lg':
        return 16;
      case 'md':
      default:
        return 15;
    }
  };

  const loaderColor =
    variant === 'yellow' || variant === 'outline' || variant === 'ghost' || variant === 'danger'
      ? COLORS.ink
      : COLORS.white;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        pill && styles.pill,
        getContainerStyle(),
        {
          height: getHeight(),
          width: fullWidth ? '100%' : undefined,
          paddingHorizontal: size === 'sm' ? 14 : 20,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              getTextStyle(),
              { fontSize: getFontSize() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderRadius: RADIUS.full,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
