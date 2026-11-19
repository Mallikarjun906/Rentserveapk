// Customer Registration Screen (/register/customer) with Mandatory Phone OTP Verification
// Fully integrated with Backend Phone Verification Session & Single-Use Verification Token

import React, { useState, useEffect } from 'react';
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
import {
  Eye,
  EyeOff,
  Check,
  UserPlus,
  Smartphone,
  CheckCircle2,
  RotateCw,
  ShieldCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { DocumentUploader, UploadFile } from '../../components/common/DocumentUploader';
import { appendFileToFormData, validateImage } from '../../utils/fileUpload';
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

const KARNATAKA_CITIES = [
  'Bagalkot',
  'Badami',
  'Ilkal',
  'Guledgudda',
  'Mudhol',
  'Jamkhandi',
  'Hubballi',
  'Dharwad',
  'Belagavi',
];

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
  const [profileImage, setProfileImage] = useState<UploadFile | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Phone OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // 60-Second Resend Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Handle Send OTP
  const handleSendOtp = async () => {
    if (otpLoading) return;

    const raw = phone.replace(/\D/g, '');
    const cleanPhone = raw.startsWith('91') && raw.length === 12 ? raw.slice(2) : raw;

    if (!isValidPhone(cleanPhone)) {
      setError(t('Enter a valid 10-digit Indian mobile number', 'ಮಾನ್ಯ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ'));
      return;
    }

    setError('');
    setOtpLoading(true);

    try {
      const response = await authApi.sendOtp(cleanPhone, 'customer-registration', 'customer');
      setOtpSent(true);
      setResendTimer(response.resendAfterSeconds || 60);
      if (response.devOtp) {
        setDevOtp(response.devOtp);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('Failed to send OTP. Please try again.', 'OTP ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ.'));
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    if (otpLoading) return;

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError(t('Please enter the 6-digit OTP code', 'ದಯವಿಟ್ಟು 6-ಅಂಕಿಯ OTP ಕೋಡ್ ನಮೂದಿಸಿ'));
      return;
    }

    const raw = phone.replace(/\D/g, '');
    const cleanPhone = raw.startsWith('91') && raw.length === 12 ? raw.slice(2) : raw;

    setError('');
    setOtpLoading(true);

    try {
      const response = await authApi.verifyOtp(cleanPhone, otpCode.trim(), 'customer-registration');
      if (response.success && response.verificationToken) {
        setPhoneVerified(true);
        setVerificationToken(response.verificationToken);
        setOtpSent(false);
      } else {
        setError(response.message || t('Invalid OTP. Please try again.', 'ತಪ್ಪಾದ OTP.'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('OTP verification failed.', 'OTP ದೃಢೀಕರಣ ವಿಫಲವಾಗಿದೆ.'));
    } finally {
      setOtpLoading(false);
    }
  };

  // Reset Phone Verification if user modifies number
  const handleResetPhone = () => {
    setPhoneVerified(false);
    setVerificationToken(null);
    setOtpSent(false);
    setOtpCode('');
    setDevOtp(null);
  };

  const handleRegister = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setError(t('Please enter your full name', 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!phoneVerified || !verificationToken) {
      setError(t('Mobile OTP verification is mandatory. Please verify your number.', 'ಮೊಬೈಲ್ OTP ಪರಿಶೀಲನೆ ಕಡ್ಡಾಯವಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.'));
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
    if (profileImage) {
      const imgVal = validateImage(profileImage);
      if (!imgVal.valid) {
        setError(imgVal.error || 'Invalid profile photo.');
        return;
      }
    }
    if (!termsAccepted) {
      setError(t('Please accept Terms & Conditions to proceed', 'ಮುಂದುವರಿಯಲು ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ'));
      return;
    }

    const raw = phone.replace(/\D/g, '');
    const cleanPhone = raw.startsWith('91') && raw.length === 12 ? raw.slice(2) : raw;

    setError('');
    setLoading(true);

    try {
      if (profileImage) {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('email', email.trim().toLowerCase());
        formData.append('phone', cleanPhone);
        formData.append('password', password);
        formData.append('confirmPassword', confirmPassword);
        formData.append('address', address.trim());
        formData.append('city', city.trim());
        formData.append('terms', 'true');
        formData.append('verificationToken', verificationToken);
        await appendFileToFormData(formData, 'profileImage', profileImage);
        await authApi.registerCustomer(formData as any);
      } else {
        await authApi.registerCustomer({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          password,
          confirmPassword,
          address: address.trim(),
          city: city.trim(),
          terms: true,
          verificationToken,
        });
      }

      // Automatically authenticate customer session
      await login(cleanPhone, password);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      t('Google Sign-In', 'ಗೂಗಲ್ ಸೈನ್-ಇನ್'),
      t('Please register using verified Mobile OTP below to complete role setup.', 'ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಮೊಬೈಲ್ OTP ನೋಂದಣಿ ಫಾರ್ಮ್ ಬಳಸಿ.')
    );
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

          {error ? <ErrorBanner message={error} onRetry={handleRegister} /> : null}

          <View style={[styles.card, SHADOWS.card]}>
            <Input
              label={t('Full Name', 'ಪೂರ್ಣ ಹೆಸರು')}
              placeholder="e.g. Basavaraj Patil"
              value={name}
              onChangeText={setName}
            />

            {/* MANDATORY MOBILE OTP VERIFICATION SECTION */}
            <View style={styles.phoneSection}>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label={t('Mobile Number (Mandatory OTP Verification)', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (OTP ಕಡ್ಡಾಯ)')}
                    placeholder="10-digit mobile"
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (phoneVerified) handleResetPhone();
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!phoneVerified}
                  />
                </View>
              </View>

              {phoneVerified ? (
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={18} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={styles.verifiedText}>
                    {t('Mobile Number Verified: +91 ', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ: +91 ')}{phone}
                  </Text>
                  <TouchableOpacity onPress={handleResetPhone} style={styles.changeBtn}>
                    <Text style={styles.changeBtnText}>{t('Change', 'ಬದಲಾಯಿಸಿ')}</Text>
                  </TouchableOpacity>
                </View>
              ) : !otpSent ? (
                <Button
                  title={t('Verify Mobile with OTP', 'OTP ಮೂಲಕ ಮೊಬೈಲ್ ದೃಢೀಕರಿಸಿ')}
                  onPress={handleSendOtp}
                  variant="outline"
                  size="md"
                  fullWidth
                  loading={otpLoading}
                  icon={<Smartphone size={16} color={COLORS.brand} style={{ marginRight: 6 }} />}
                  style={{ marginTop: 8 }}
                />
              ) : (
                <View style={styles.otpVerifyBox}>
                  <View style={styles.otpHeaderRow}>
                    <Text style={styles.otpSentLabel}>
                      {t('OTP code sent to +91 ', '+91 ಗೆ OTP ಕಳುಹಿಸಲಾಗಿದೆ ')}{phone}
                    </Text>
                    <TouchableOpacity onPress={handleResetPhone}>
                      <Text style={styles.changeBtnText}>{t('Change Number', 'ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ')}</Text>
                    </TouchableOpacity>
                  </View>

                  {devOtp && (
                    <TouchableOpacity
                      style={styles.devOtpBadge}
                      onPress={() => setOtpCode(devOtp)}
                    >
                      <Text style={styles.devOtpText}>
                        🛠️ Test Code: <Text style={{ fontWeight: '900' }}>{devOtp}</Text> (Tap to fill)
                      </Text>
                    </TouchableOpacity>
                  )}

                  <Input
                    label={t('Enter 6-Digit OTP', '6-ಅಂಕಿಯ OTP ನಮೂದಿಸಿ')}
                    placeholder="••••••"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={{ letterSpacing: 8, textAlign: 'center', fontSize: 18, fontWeight: '800' }}
                  />

                  <View style={styles.resendRow}>
                    {resendTimer > 0 ? (
                      <Text style={styles.resendTimerText}>
                        {t('Resend OTP in ', 'ಮರುಕಳುಹಿಸಿ ')}{resendTimer}s
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOtp} disabled={otpLoading}>
                        <Text style={styles.resendActionText}>
                          {t('Resend OTP', 'ಮತ್ತೆ OTP ಕಳುಹಿಸಿ')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Button
                    title={t('Confirm OTP Code', 'OTP ಕೋಡ್ ದೃಢೀಕರಿಸಿ')}
                    onPress={handleVerifyOtp}
                    variant="primary"
                    size="md"
                    fullWidth
                    loading={otpLoading}
                    icon={<CheckCircle2 size={16} color={COLORS.white} style={{ marginRight: 6 }} />}
                  />
                </View>
              )}
            </View>

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

            <DocumentUploader
              label={t('Profile Photograph (Optional)', 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ (ಐಚ್ಛಿಕ)')}
              description="Front facing photo / selfie (JPG, PNG)"
              acceptTypes="image"
              file={profileImage}
              onFileSelect={setProfileImage}
              uploadState={loading ? 'uploading' : profileImage ? 'selected' : 'idle'}
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
                </Text>{' '}
                {t('and', 'ಮತ್ತು')}{' '}
                <Text style={styles.termsLink} onPress={onReadTerms}>
                  {t('Privacy Policy', 'ಗೌಪ್ಯತಾ ನೀತಿ')}
                </Text>
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Create Account', 'ಖಾತೆ ರಚಿಸಿ')}
              onPress={handleRegister}
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={<UserPlus size={18} color={COLORS.white} style={{ marginRight: 8 }} />}
              style={styles.submitBtn}
            />

            <TouchableOpacity style={styles.loginLink} onPress={onLogin}>
              <Text style={styles.loginLinkText}>
                {t('Already have an account? Sign In', 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಲಾಗಿನ್ ಆಗಿ')}
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
  scroll: { padding: 20, flexGrow: 1, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.ink, marginTop: 4 },
  sub: { fontSize: 13, color: COLORS.mute, marginTop: 2, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  phoneSection: {
    marginBottom: 14,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  countryCodeBox: {
    height: 48,
    marginTop: 26,
    paddingHorizontal: 12,
    backgroundColor: COLORS.paper,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 8,
  },
  verifiedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  changeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
  },
  otpVerifyBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginTop: 8,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpSentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  devOtpBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: RADIUS.md,
    padding: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  devOtpText: {
    fontSize: 12,
    color: '#92400E',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resendTimerText: {
    fontSize: 12,
    color: COLORS.mute,
    fontWeight: '600',
  },
  resendActionText: {
    fontSize: 12,
    color: COLORS.brand,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
    marginTop: 10,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cityChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
  },
  cityChipActive: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brand,
  },
  cityText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  cityTextActive: {
    color: COLORS.white,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.mute,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 14,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand,
  },
});
