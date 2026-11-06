// Splash Screen with Karnataka Heritage Branding

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { Logo } from '../../components/common/Logo';
import { useLocalization } from '../../context/LocalizationContext';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { t } = useLocalization();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brand} translucent />
      
      {/* Centered Brand Shield */}
      <View style={styles.centerBox}>
        <Logo size={88} mono />
        <Text style={styles.title}>NUK RentServe</Text>
        <Text style={styles.tagline}>
          {t('appTagline', 'ಕರ್ನಾಟಕದ ಬಾಡಿಗೆ, ಸೇವೆಗಳು ಮತ್ತು ಪ್ರಯಾಣ')}
        </Text>
      </View>

      {/* Regional Cultural Footer */}
      <View style={[styles.footer, { bottom: Math.max(insets.bottom + 16, 24) }]}>
        <Text style={styles.footerText}>
          Made for Bagalkot & Karnataka · ಸುರಕ್ಷಿತ ಮತ್ತು ಸ್ಥಳೀಯ
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerBox: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 18,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.sun,
    marginTop: 6,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    textAlign: 'center',
  },
});
