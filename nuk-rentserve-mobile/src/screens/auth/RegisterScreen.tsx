// New User Registration Screen with Bilingual Terms Acceptance

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
import { COLORS, RADIUS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { CONFIG } from '../../constants/config';
import { isValidEmail, isValidPhone } from '../../utils/validators';

interface RegisterScreenProps {
  onLogin: () => void;
  onReadTerms: (role: string) => void;
  onSuccess: () => void;
  onBack?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onLogin,
  onReadTerms,
  onSuccess,
  onBack,
}) => {
  const { register, setRole, setTermsAccepted } = useAuth();
  const { t } = useLocalization();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Bagalkot');
  const [roleChoice, setRoleChoice] = useState<
    'Customer' | 'Property Owner' | 'Auto/Car Driver' | 'Student Rental Partner'
  >('Customer');
  const [termsAcceptedLocal, setTermsAcceptedLocal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setError(t('Please enter your full name', 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('Enter a valid email address', 'ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!isValidPhone(phone)) {
      setError(t('Enter a valid 10-digit mobile number', '10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (password.length < 6) {
      setError(t('Password must be at least 6 characters', 'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಿರಬೇಕು'));
      return;
    }
    if (!termsAcceptedLocal) {
      setError(
        t(
          'Please accept the Terms of Service & Privacy Policy',
          'ದಯವಿಟ್ಟು ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತಾ ನೀತಿಯನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ'
        )
      );
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        location: city,
      });

      // Record legal consent audit
      setTermsAccepted({
        at: new Date().toISOString(),
        version: CONFIG.TERMS_VERSION,
      });

      await setRole(roleChoice as any);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={t('registerTitle', 'ಹೊಸ ಖಾತೆ ರಚಿಸಿ')}
        subtitle={t('registerSub', 'ಸ್ಥಳೀಯ ಸೇವೆಗಳನ್ನು ಪಡೆಯಲು ನೋಂದಾಯಿಸಿ')}
        onBack={onBack || onLogin}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {error ? <ErrorBanner message={error} onRetry={handleRegister} /> : null}

          {/* Form */}
          <View style={styles.formCard}>
            <Input
              label={t('fullName', 'ಪೂರ್ಣ ಹೆಸರು')}
              placeholder="e.g. Basavaraj Patil"
              value={name}
              onChangeText={setName}
            />

            <Input
              label={t('mobileNumber', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ')}
              placeholder="98450 12345"
              prefix="+91"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Input
              label={t('emailAddress', 'ಇಮೇಲ್ ವಿಳಾಸ')}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label={t('password', 'ಗುಪ್ತಪದ (Password)')}
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* City Selector */}
            <Text style={styles.fieldLabel}>{t('location', 'ನಗರ / ತಾಲೂಕು')}</Text>
            <View style={styles.chipsRow}>
              {CONFIG.SUPPORTED_CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cityChip, city === c && styles.cityChipActive]}
                  onPress={() => setCity(c)}
                >
                  <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Primary Intent / Role Selector */}
            <Text style={styles.fieldLabel}>{t('I want to use NUK as', 'ನಾನು ಬಳಸಲು ಬಯಸುವುದು')}</Text>
            <View style={styles.chipsRow}>
              {[
                'Customer',
                'Property Owner',
                'Auto/Car Driver',
                'Student Rental Partner',
              ].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, roleChoice === r && styles.roleChipActive]}
                  onPress={() => setRoleChoice(r as any)}
                >
                  <Text style={[styles.roleChipText, roleChoice === r && styles.roleChipTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Terms & Consent Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setTermsAcceptedLocal(!termsAcceptedLocal)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, termsAcceptedLocal && styles.checkboxActive]}>
                {termsAcceptedLocal && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                {t('acceptTermsPrefix', 'ನಾನು')}{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => onReadTerms(roleChoice)}
                >
                  {t('termsAndPrivacy', 'ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತಾ ನೀತಿಯನ್ನು')}
                </Text>{' '}
                {t('agree to all clauses', 'ಒಪ್ಪುತ್ತೇನೆ')} ({CONFIG.TERMS_VERSION}).
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Create Account', 'ಖಾತೆ ತೆರೆಯಿರಿ')}
              onPress={handleRegister}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          {/* Login Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {t('Already registered?', 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?')}{' '}
            </Text>
            <TouchableOpacity onPress={onLogin}>
              <Text style={styles.loginLink}>{t('Sign In', 'ಲಾಗಿನ್ ಆಗಿ')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 10,
  },
  sub: {
    fontSize: 13,
    color: COLORS.mute,
    marginTop: 2,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cityChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  cityChipTextActive: {
    color: COLORS.white,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  roleChipActive: {
    backgroundColor: COLORS.sun,
    borderColor: COLORS.sunDeep,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  roleChipTextActive: {
    color: COLORS.ink,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.muteLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  checkMark: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 12,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.ink,
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: '800',
    color: COLORS.brand,
    textDecorationLine: 'underline',
  },
  submitBtn: {
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.mute,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brand,
  },
});
