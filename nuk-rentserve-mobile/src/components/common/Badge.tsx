// Status and Category Pill Badge - White Glass & Solid Luxe Surfaces

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS, STATUS_TONES } from '../../constants/theme';

export type BadgeTone = 'ok' | 'warn' | 'bad' | 'info' | 'brand' | 'sun' | 'mute' | 'crimson' | 'emerald' | 'liveMint';

interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  tone?: BadgeTone;
  status?: string;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'solid' | 'glass';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  children,
  tone,
  status,
  dot = false,
  style,
  textStyle,
  variant = 'solid',
}) => {
  const getColors = () => {
    if (status && STATUS_TONES[status]) {
      return STATUS_TONES[status];
    }
    switch (tone) {
      case 'ok':
      case 'emerald':
      case 'liveMint':
        return { bg: COLORS.okTint, text: COLORS.ok };
      case 'warn':
        return { bg: COLORS.warnTint, text: COLORS.warn };
      case 'bad':
        return { bg: COLORS.badTint, text: COLORS.bad };
      case 'info':
        return { bg: COLORS.infoTint, text: COLORS.info };
      case 'brand':
        return { bg: COLORS.brand, text: COLORS.white };
      case 'sun':
        return { bg: COLORS.sunTint, text: '#8F6600' };
      case 'crimson':
        return { bg: COLORS.brandTint, text: COLORS.brand };
      case 'mute':
      default:
        return { bg: '#EAEBED', text: '#555555' };
    }
  };

  const { bg, text } = getColors();
  const content = label || children || status;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        variant === 'glass' && styles.glassBadge,
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: text }]} />}
      <Text style={[styles.text, { color: text }, textStyle]}>{content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  glassBadge: {
    borderColor: COLORS.glassBorderSubtle,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
