// Empty State Component for Lists, Bookings & Messages

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionTitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  actionLabel,
  onAction,
  icon,
  style,
}) => {
  const btnLabel = actionTitle || actionLabel;
  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <View style={styles.iconBox}>{icon}</View>
      ) : (
        <View style={styles.defaultIconBox}>
          <Text style={styles.defaultIconText}>🔍</Text>
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}

      {btnLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={btnLabel}
            onPress={onAction}
            variant="outline"
            size="sm"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  iconBox: {
    marginBottom: 16,
  },
  defaultIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  defaultIconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: 18,
  },
});
