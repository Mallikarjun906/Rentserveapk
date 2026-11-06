// Password Recovery Screen with Lucide Icons & Safe-Area Support

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Mail, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
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
  const insets = useSafeAreaInsets();
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
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <Header
        title={t('Reset Password', 'ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ')}
        onBack={onBack}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
              <View style={[styles.successCard, SHADOWS.card]}>
                <View style={styles.iconCircle}>
                  <CheckCircle2 size={36} color={COLORS.ok} />
                </View>
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
              <View style={[styles.card, SHADOWS.card]}>
                <Input
                  label={t('Registered Email', 'ನೋಂದಾಯಿತ ಇಮೇಲ್')}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  prefix="@"
                />

                <Button
                  title={t('Send Reset Instructions', 'ಲಿಂಕ್ ಕಳುಹಿಸಿ')}
                  onPress={handleSubmit}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  icon={<Mail size={18} color={COLORS.white} style={{ marginRight: 8 }} />}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 14,
  },
  sub: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
    maxWidth: 320,
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
    borderColor: COLORS.line,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5F4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
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
    marginTop: 4,
  },
});
