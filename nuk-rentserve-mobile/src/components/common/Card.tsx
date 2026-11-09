// Card Surface Component - Premium White Glass & Solid Luxe Surfaces

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'glass' | 'solid' | 'flat' | 'highlight';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'glass',
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'solid':
        return styles.solid;
      case 'flat':
        return styles.flat;
      case 'highlight':
        return styles.highlight;
      case 'glass':
      default:
        return styles.glass;
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={[styles.base, getVariantStyle(), SHADOWS.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, getVariantStyle(), SHADOWS.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },
  glass: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  solid: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lineDark,
  },
  flat: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  highlight: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.brandTint,
  },
});
