// Error Alert Banner with Retry Option

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { COLORS, RADIUS } from '../../constants/theme';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  retryText = 'Retry',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <AlertTriangle size={18} color={COLORS.bad} style={{ marginRight: 8 }} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.badTint,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 8,
  },
  leftRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.badDeep,
  },
  retryBtn: {
    marginLeft: 10,
    backgroundColor: COLORS.bad,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});
