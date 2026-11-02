// User Login Screen with Links to Role Registrations & Admin Portal

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
  onOtpLogin: (phone: string) => void;
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onRegisterCustomer,
  onRegisterProvider,
  onRegisterDriver,
  onRegisterStudent,
  onAdminLogin,
  onForgotPassword,
  onOtpLogin,
  onSuccess,
}) => {
  const { login } = useAuth();
  const { t } = useLocalization();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [registerPickerVisible, setRegisterPickerVisible] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
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

            {/* Quick OTP Option */}
            <Button
              title={t('Login with OTP instead', 'OTP ಮೂಲಕ ಲಾಗಿನ್ ಆಗಿ')}
              onPress={() => onOtpLogin(identifier)}
              variant="outline"
              size="md"
              fullWidth
              style={styles.otpBtn}
            />
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
  scroll: { padding: 20, justifyContent: 'center', flexGrow: 1 },
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
  submitBtn: { marginBottom: 10 },
  otpBtn: { borderColor: COLORS.sun, backgroundColor: COLORS.sunTint },
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
