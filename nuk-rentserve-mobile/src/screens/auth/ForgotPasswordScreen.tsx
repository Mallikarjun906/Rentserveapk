// Password Recovery Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { authApi } from '../../api/authApi';
import { useLocalization } from '../../context/LocalizationContext';
import { isValidEmail } from '../../utils/validators';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
}) => {
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setError(t('Enter a valid registered email', 'ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← {t('back', 'ಹಿಂದಕ್ಕೆ')}</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Logo size={52} />
          <Text style={styles.title}>{t('Reset Password', 'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ')}</Text>
          <Text style={styles.sub}>
            {t(
              'Enter your registered email and we will send password reset instructions.',
              'ನಿಮ್ಮ ನೋಂದಾಯಿತ ಇಮೇಲ್ ನಮೂದಿಸಿ, ಮರುಹೊಂದಿಸುವ ಲಿಂಕ್ ಕಳುಹಿಸುತ್ತೇವೆ.'
            )}
          </Text>

          {error ? <ErrorBanner message={error} onRetry={handleSubmit} /> : null}

          {sent ? (
            <View style={styles.successCard}>
              <Text style={styles.checkIcon}>✉️</Text>
              <Text style={styles.successTitle}>
                {t('Recovery Email Sent', 'ಇಮೇಲ್ ಕಳುಹಿಸಲಾಗಿದೆ')}
              </Text>
              <Text style={styles.successSub}>
                {t(
                  'Please check your inbox and follow instructions to reset your password.',
                  'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇನ್‌ಬಾಕ್ಸ್ ಪರಿಶೀಲಿಸಿ ಸೂಚನೆಗಳನ್ನು ಅನುಸರಿಸಿ.'
                )}
              </Text>
              <Button
                title={t('Back to Sign In', 'ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ')}
                onPress={onBack}
                variant="outline"
                size="md"
                fullWidth
                style={styles.backSignInBtn}
              />
            </View>
          ) : (
            <View style={styles.card}>
              <Input
                label={t('Registered Email', 'ನೋಂದಾಯಿತ ಇಮೇಲ್')}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Button
                title={t('Send Reset Instructions', 'ಲಿಂಕ್ ಕಳುಹಿಸಿ')}
                onPress={handleSubmit}
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  backBtn: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  content: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 14,
  },
  sub: {
    fontSize: 13,
    color: COLORS.mute,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  successCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1.5,
    borderColor: COLORS.ok,
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ok,
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  backSignInBtn: {
    marginTop: 10,
  },
});
