// User Login Screen with Continue with Google & Links to Role Registrations

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';

interface LoginScreenProps {
  onRegisterCustomer: () => void;
  onRegisterProvider: () => void;
  onRegisterDriver: () => void;
  onRegisterStudent: () => void;
  onAdminLogin: () => void;
  onForgotPassword: () => void;
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onRegisterCustomer,
  onRegisterProvider,
  onRegisterDriver,
  onRegisterStudent,
  onAdminLogin,
  onForgotPassword,
  onSuccess,
}) => {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLocalization();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setError(t('Enter email or mobile number', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್ ನಮೂದಿಸಿ'));
      return;
    }
    if (!password) {
      setError(t('Enter your password', 'ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ'));
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    const googleClientId =
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.VITE_GOOGLE_CLIENT_ID ||
      '';

    if (!googleClientId) {
      setGoogleLoading(false);
      Alert.alert(
        t('Google Sign-In Configuration', 'ಗೂಗಲ್ ಲಾಗಿನ್ ಸಂರಚನೆ'),
        t(
          'Google Sign-In requires an active EXPO_PUBLIC_GOOGLE_CLIENT_ID in your configuration. Please sign in securely with your email/mobile and password, or add your Google Client ID to enable 1-tap sign-in.',
          'ಗೂಗಲ್ ಲಾಗಿನ್ ಸಕ್ರಿಯಗೊಳಿಸಲು EXPO_PUBLIC_GOOGLE_CLIENT_ID ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ಮೊಬೈಲ್/ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ ಲಾಗಿನ್ ಆಗಿ.'
        )
      );
      return;
    }

    try {
      // In web or production environment with GSI/OAuth token
      const gThis = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
      if (Platform.OS === 'web' && gThis?.google?.accounts?.id) {
        gThis.google.accounts.id.prompt(async (notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setGoogleLoading(false);
          }
        });
      } else {
        // Native mobile prompt or credential placeholder
        Alert.alert(
          'Google OAuth',
          'Connecting to Google Identity Services with Client ID: ' + googleClientId.slice(0, 16) + '…'
        );
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Top Brand Header */}
          <View style={styles.header}>
            <Logo size={52} />
            <Text style={styles.title}>{t('loginTitle', 'ಸ್ವಾಗತ')}</Text>
            <Text style={styles.sub}>
              {t('loginSub', 'ಮೊಬೈಲ್ ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ ಲಾಗಿನ್ ಆಗಿ')}
            </Text>
          </View>

          {/* Error Banner */}
          {error ? <ErrorBanner message={error} onRetry={handleLogin} /> : null}

          {/* Form Card */}
          <View style={[styles.formCard, SHADOWS.card]}>
            <Input
              label={t('Mobile Number or Email', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್')}
              placeholder="e.g. 9845012345 or user@example.com"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label={t('password', 'ಗುಪ್ತಪದ (Password)')}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              }
            />

            <TouchableOpacity onPress={onForgotPassword} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>
                {t('forgotPassword', 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?')}
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Sign In', 'ಲಾಗಿನ್')}
              onPress={handleLogin}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              style={styles.submitBtn}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('OR', 'ಅಥವಾ')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* CONTINUE WITH GOOGLE (Replaces removed OTP option) */}
            <TouchableOpacity
              style={[styles.googleBtn, SHADOWS.card]}
              onPress={handleGoogleLogin}
              disabled={googleLoading || loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : (
                <View style={styles.googleContent}>
                  <View style={styles.googleGContainer}>
                    <Text style={styles.googleGText}>G</Text>
                  </View>
                  <Text style={styles.googleBtnText}>
                    {t('Continue with Google', 'Google ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Registration Options Card */}
          <View style={[styles.regSection, SHADOWS.card]}>
            <Text style={styles.regTitle}>
              {t('New to NUK RentServe? Select Registration:', 'ಹೊಸ ಬಳಕೆದಾರರೇ? ನೋಂದಣಿ ಆಯ್ಕೆಮಾಡಿ:')}
            </Text>

            <View style={styles.regGrid}>
              <TouchableOpacity
                style={styles.regTile}
                onPress={onRegisterCustomer}
              >
                <Text style={styles.regTileIcon}>👤</Text>
                <Text style={styles.regTileTitle}>{t('Customer', 'ಗ್ರಾಹಕ')}</Text>
                <Text style={styles.regTileSub}>Rentals & rides</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regTile}
                onPress={onRegisterDriver}
              >
                <Text style={styles.regTileIcon}>🛞</Text>
                <Text style={styles.regTileTitle}>{t('Driver', 'ಚಾಲಕ')}</Text>
                <Text style={styles.regTileSub}>Auto / Car / Van</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regTile}
                onPress={onRegisterProvider}
              >
                <Text style={styles.regTileIcon}>🔧</Text>
                <Text style={styles.regTileTitle}>{t('Provider', 'ಸೇವೆ')}</Text>
                <Text style={styles.regTileSub}>Plumber / Electrician</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regTile}
                onPress={onRegisterStudent}
              >
                <Text style={styles.regTileIcon}>🎓</Text>
                <Text style={styles.regTileTitle}>{t('Student', 'ವಿದ್ಯಾರ್ಥಿ')}</Text>
                <Text style={styles.regTileSub}>Rental concierge</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Secure Admin Portal Link */}
          <TouchableOpacity onPress={onAdminLogin} style={styles.adminLinkRow}>
            <Text style={styles.adminLinkText}>🛡️ {t('Administrator Console Login', 'ನಿರ್ವಾಹಕರ ಪೋರ್ಟಲ್')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  keyboard: { flex: 1 },
  scroll: { padding: 20, justifyContent: 'center', flexGrow: 1, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.ink, marginTop: 12 },
  sub: { fontSize: 13, color: COLORS.mute, marginTop: 4, textAlign: 'center' },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  toggleText: { fontSize: 13, fontWeight: '700', color: COLORS.brand },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 14 },
  forgotText: { fontSize: 13, fontWeight: '700', color: COLORS.brand },
  submitBtn: { marginBottom: 12 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.line,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.mute,
  },
  googleBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleGText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  regSection: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  regTitle: { fontSize: 13, fontWeight: '800', color: COLORS.ink, marginBottom: 12, textAlign: 'center' },
  regGrid: { flexDirection: 'row', gap: 8 },
  regTile: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
  },
  regTileIcon: { fontSize: 22, marginBottom: 4 },
  regTileTitle: { fontSize: 12, fontWeight: '800', color: COLORS.ink },
  regTileSub: { fontSize: 9, color: COLORS.mute, marginTop: 2, textAlign: 'center' },
  adminLinkRow: { alignItems: 'center', paddingVertical: 10 },
  adminLinkText: { fontSize: 13, fontWeight: '700', color: COLORS.mute },
});
