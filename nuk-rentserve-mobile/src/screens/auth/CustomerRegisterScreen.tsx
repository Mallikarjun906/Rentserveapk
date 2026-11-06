// Customer Registration Screen (/register/customer) with Google Sign-In & Lucide Icons

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Eye, EyeOff, Check, UserPlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { isValidEmail, isValidPhone } from '../../utils/validators';

interface CustomerRegisterScreenProps {
  onLogin: () => void;
  onReadTerms: () => void;
  onSuccess: () => void;
  onBack?: () => void;
}

const KARNATAKA_CITIES = ['Bagalkot', 'Badami', 'Ilkal', 'Guledgudda', 'Mudhol', 'Jamkhandi', 'Hubballi', 'Dharwad', 'Belagavi'];

export const CustomerRegisterScreen: React.FC<CustomerRegisterScreenProps> = ({
  onLogin,
  onReadTerms,
  onSuccess,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t } = useLocalization();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bagalkot');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setError(t('Please enter your full name', 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!isValidPhone(phone)) {
      setError(t('Enter a valid 10-digit mobile number', 'ಮಾನ್ಯ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('Enter a valid email address', 'ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!password || password.length < 8) {
      setError(t('Password must be at least 8 characters', 'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('Passwords do not match', 'ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ'));
      return;
    }
    if (!termsAccepted) {
      setError(t('Please accept Terms & Conditions to proceed', 'ಮುಂದುವರಿಯಲು ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authApi.registerCustomer({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        confirmPassword,
        address: address.trim(),
        city: city.trim(),
        terms: true,
      });

      // Login customer session
      await login(email.trim().toLowerCase(), password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const googleClientId =
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.VITE_GOOGLE_CLIENT_ID ||
      '';

    if (!googleClientId) {
      Alert.alert(
        t('Google Sign-In Configuration', 'ಗೂಗಲ್ ಲಾಗಿನ್ ಸಂರಚನೆ'),
        t(
          'Google Sign-In requires an active EXPO_PUBLIC_GOOGLE_CLIENT_ID. Please register with your email/mobile and password, or add your Google Client ID.',
          'ಗೂಗಲ್ ಲಾಗಿನ್ ಸಕ್ರಿಯಗೊಳಿಸಲು EXPO_PUBLIC_GOOGLE_CLIENT_ID ಅಗತ್ಯವಿದೆ.'
        )
      );
      return;
    }

    Alert.alert('Google Sign-In', 'Connecting to Google OAuth 2.0…');
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <Header
        title={t('Customer Sign Up', 'ಗ್ರಾಹಕರ ನೋಂದಣಿ')}
        subtitle={t('Book local services, rentals & transport', 'ಸ್ಥಳೀಯ ಸೇವೆಗಳು, ಬಾಡಿಗೆ ಮತ್ತು ಪ್ರಯಾಣ')}
        onBack={onBack || onLogin}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size={48} />
            <Text style={styles.title}>{t('Create Customer Account', 'ಗ್ರಾಹಕರ ಖಾತೆ ರಚಿಸಿ')}</Text>
            <Text style={styles.sub}>
              {t('Book local services, rentals & transport', 'ಸ್ಥಳೀಯ ಸೇವೆಗಳು, ಬಾಡಿಗೆಗಳು ಮತ್ತು ಪ್ರಯಾಣವನ್ನು ಬುಕ್ ಮಾಡಿ')}
            </Text>
          </View>

          {/* GOOGLE SIGN-IN BUTTON (Customer Only) */}
          <TouchableOpacity
            style={[styles.googleBtn, SHADOWS.card]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
          >
            <View style={styles.googleContent}>
              <View style={styles.googleGContainer}>
                <Text style={styles.googleGText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>
                {t('Continue with Google', 'Google ಮೂಲಕ ನೋಂದಾಯಿಸಿ')}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('Or register with email', 'ಅಥವಾ ಇಮೇಲ್ ಮೂಲಕ ನೋಂದಾಯಿಸಿ')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {error ? <ErrorBanner message={error} onRetry={handleRegister} /> : null}

          <View style={[styles.card, SHADOWS.card]}>
            <Input
              label={t('Full Name', 'ಪೂರ್ಣ ಹೆಸರು')}
              placeholder="e.g. Basavaraj Patil"
              value={name}
              onChangeText={setName}
            />

            <Input
              label={t('Mobile Number', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ')}
              placeholder="10-digit mobile"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              prefix="+91"
            />

            <Input
              label={t('Email Address', 'ಇಮೇಲ್ ವಿಳಾಸ')}
              placeholder="user@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label={t('Password', 'ಗುಪ್ತಪದ')}
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.mute} />
                  ) : (
                    <Eye size={20} color={COLORS.mute} />
                  )}
                </TouchableOpacity>
              }
            />

            <Input
              label={t('Confirm Password', 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ')}
              placeholder="Repeat password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />

            <Input
              label={t('Address (Optional)', 'ವಿಳಾಸ')}
              placeholder="House no, Street / Locality"
              value={address}
              onChangeText={setAddress}
            />

            {/* City Selection Grid */}
            <Text style={styles.fieldLabel}>{t('City / Town', 'ನಗರ')}</Text>
            <View style={styles.cityGrid}>
              {KARNATAKA_CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.cityChip, city === c && styles.cityChipActive]}
                  onPress={() => setCity(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cityText, city === c && styles.cityTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                {termsAccepted ? <Check size={14} color={COLORS.white} strokeWidth={3} /> : null}
              </View>
              <Text style={styles.termsText}>
                {t('I agree to the', 'ನಾನು ಒಪ್ಪುತ್ತೇನೆ')}{' '}
                <Text style={styles.termsLink} onPress={onReadTerms}>
                  {t('Terms and Conditions', 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು')}
                </Text>
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Complete Registration', 'ನೋಂದಣಿ ಪೂರ್ಣಗೊಳಿಸಿ')}
              onPress={handleRegister}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={<UserPlus size={18} color={COLORS.white} style={{ marginRight: 8 }} />}
              style={styles.submitBtn}
            />

            <TouchableOpacity onPress={onLogin} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                {t('Already registered? Log In', 'ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ? ಲಾಗಿನ್')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  keyboard: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 36 },
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.ink, marginTop: 10 },
  sub: { fontSize: 13, color: COLORS.mute, marginTop: 4, textAlign: 'center' },
  googleBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.line,
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mute,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  cityChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cityChipActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
  },
  cityText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
  },
  cityTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  termsText: {
    fontSize: 13,
    color: COLORS.ink,
    flex: 1,
  },
  termsLink: {
    color: COLORS.brand,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  submitBtn: {
    marginBottom: 12,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
  },
});
