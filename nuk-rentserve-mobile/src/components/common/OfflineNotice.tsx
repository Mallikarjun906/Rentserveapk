// Offline Connectivity Warning Pill

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useLocalization } from '../../context/LocalizationContext';

interface OfflineNoticeProps {
  isOffline?: boolean;
}

export const OfflineNotice: React.FC<OfflineNoticeProps> = ({ isOffline = true }) => {
  const { t } = useLocalization();

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>
        {t('offlineTitle', 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ')} · {t('offlineMessage', 'ಕ್ಯಾಶ್ ಮಾಹಿತಿ')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  icon: {
    fontSize: 12,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
});
