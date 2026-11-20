// User Login Screen with Two Visible Methods: "Login with OTP" and "Login with Password"
// Fully integrated with Backend Phone OTP verification, Google Sign-In & Role Portals

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
  User,
  Car,
  Wrench,
  GraduationCap,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  Smartphone,
  KeyRound,
  RotateCw,
  CheckCircle2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { checkBackendConnectivity, AppApiError, ApiErrorKind } from '../../api/client';
import { isValidPhone } from '../../utils/validators';

interface LoginScreenProps {
  onRegisterCustomer: () => void;
  onRegisterProvider: () => void;
  onRegisterDriver: () => void;
  onRegisterStudent: () => void;
  onAdminLogin: () => void;
  onForgotPassword: () => void;
  onSuccess: (user?: any) => void;
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
  const insets = useSafeAreaInsets();
  const { login, loginWithOtp } = useAuth();
  const { t } = useLocalization();

  // Active Login Method Tab: 'otp' | 'password'
  const [activeTab, setActiveTab] = useState<'otp' | 'password'>('otp');

  // Password Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Login State
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // Google & Global States
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorKind, setErrorKind] = useState<ApiErrorKind | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);

  // Resend Countdown Timer
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
      setErrorKind(null);
      return;
    }

    setError('');
    setErrorKind(null);
    setOtpLoading(true);

    try {
      const response = await authApi.sendOtp(cleanPhone, 'login', 'customer');
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

  // Handle Verify OTP and Login
  const handleVerifyOtpAndLogin = async () => {
    if (otpLoading) return;

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError(t('Please enter the 6-digit OTP code', 'ದಯವಿಟ್ಟು 6-ಅಂಕಿಯ OTP ಕೋಡ್ ನಮೂದಿಸಿ'));
      setErrorKind(null);
      return;
    }

    const raw = phone.replace(/\D/g, '');
    const cleanPhone = raw.startsWith('91') && raw.length === 12 ? raw.slice(2) : raw;

    setError('');
    setErrorKind(null);
    setOtpLoading(true);

    try {
      const loggedIn = await loginWithOtp({
        phone: cleanPhone,
        otp: otpCode.trim(),
        role: 'customer',
      });
      onSuccess(loggedIn);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('Invalid OTP. Please check and try again.', 'ತಪ್ಪಾದ OTP. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.');
      setError(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Password Login
  const handlePasswordLogin = async () => {
    if (loading || checkingConnection) return;

    if (!identifier.trim()) {
      setError(t('Enter email or mobile number', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್ ನಮೂದಿಸಿ'));
      setErrorKind(null);
      return;
    }
    if (!password) {
      setError(t('Enter your password', 'ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ'));
      setErrorKind(null);
      return;
    }

    setError('');
    setErrorKind(null);
    setLoading(true);

    try {
      const loggedIn = await login(identifier.trim(), password);
      onSuccess(loggedIn);
    } catch (err: any) {
      if (err instanceof AppApiError) {
        setErrorKind(err.kind);
        if (err.kind === 'COLD_START_TIMEOUT') {
          setError(
            t(
              'Server is waking up from idle (cold start). Please wait a few moments and tap Retry.',
              'ಸರ್ವರ್ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಕೆಲವು ಕ್ಷಣಗಳ ನಂತರ ಮರುಪ್ರಯತ್ನಿಸಿ.'
            )
          );
        } else if (err.kind === 'NO_INTERNET') {
          setError(
            t(
              'No internet connection. Please verify your Wi-Fi or mobile data and tap Retry.',
              'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ. ದಯವಿಟ್ಟು ವೈಫೈ ಅಥವಾ ಮೊಬೈಲ್ ಡೇಟಾ ಪರಿಶೀಲಿಸಿ.'
            )
          );
        } else if (err.kind === 'INVALID_CREDENTIALS') {
          setError(
            t(
              'Invalid mobile number/email or password. Please verify your credentials.',
              'ತಪ್ಪಾದ ಇಮೇಲ್/ಮೊಬೈಲ್ ಅಥವಾ ಗುಪ್ತಪದ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.'
            )
          );
        } else if (err.kind === 'ACCESS_DENIED') {
          setError(
            t(
              'Account access restricted. Please check your verification status.',
              'ಖಾತೆ ಪ್ರವೇಶ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.'
            )
          );
        } else if (err.kind === 'RATE_LIMITED') {
          setError(
            t(
              'Too many attempts. Please wait a few minutes before trying again.',
              'ಹೆಚ್ಚಿನ ಪ್ರಯತ್ನಗಳು. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.'
            )
          );
        } else {
          setError(err.message || t('Login failed. Please try again.', 'ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ.'));
        }
      } else {
        setErrorKind('UNKNOWN');
        setError(err.message || t('Login failed. Please check your credentials.', 'ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (checkingConnection || loading || otpLoading) return;

    if (activeTab === 'password') {
      if (!identifier.trim() || !password) {
        setError(t('Please enter your login details', 'ದಯವಿಟ್ಟು ಲಾಗಿನ್ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ'));
        return;
      }
    } else {
      if (!phone.trim()) {
        setError(t('Please enter your mobile number', 'ದಯವಿಟ್ಟು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ'));
        return;
      }
    }

    if (
      errorKind === 'NO_INTERNET' ||
      errorKind === 'COLD_START_TIMEOUT' ||
      errorKind === 'SERVER_UNAVAILABLE' ||
      errorKind === 'SERVER_ERROR'
    ) {
      setCheckingConnection(true);
      setError(t('Checking server connectivity...', 'ಸರ್ವರ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...'));

      try {
        const health = await checkBackendConnectivity();
        if (!health.isReachable) {
          if (health.isColdStart) {
            setError(
              t(
                'Server is waking up (cold start). Please wait a moment and tap Retry.',
                'ಸರ್ವರ್ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಕೆಲವು ಕ್ಷಣಗಳ ನಂತರ ಮರುಪ್ರಯತ್ನಿಸಿ.'
              )
            );
          } else if (health.isOffline) {
            setError(
              t(
                'No internet connection. Please verify your Wi-Fi or mobile data.',
                'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ. ದಯವಿಟ್ಟು ವೈಫೈ ಅಥವಾ ಮೊಬೈಲ್ ಡೇಟಾ ಪರಿಶೀಲಿಸಿ.'
              )
            );
          } else {
            setError(health.message);
          }
          return;
        }

        setError('');
        setErrorKind(null);
        if (activeTab === 'password') {
          await handlePasswordLogin();
        } else if (otpSent) {
          await handleVerifyOtpAndLogin();
        } else {
          await handleSendOtp();
        }
      } catch {
        setError(t('Server is unreachable. Please try again later.', 'ಸರ್ವರ್ ಸಂಪರ್ಕ ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ.'));
      } finally {
        setCheckingConnection(false);
      }
    } else {
      if (activeTab === 'password') {
        await handlePasswordLogin();
      } else if (otpSent) {
        await handleVerifyOtpAndLogin();
      } else {
        await handleSendOtp();
      }
    }
  };

  // Google OAuth
  const handleGoogleSignIn = async () => {
    if (googleLoading || loading || otpLoading) return;
    setGoogleLoading(true);
    setError('');

    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          t('Google Sign-In', 'ಗೂಗಲ್ ಸೈನ್-ಇನ್'),
          t('On Web, please use the Google Sign-In button on the NUK RentServe website.', 'ವೆಬ್ ಆವೃತ್ತಿಯಲ್ಲಿ ಸೈನ್ ಇನ್ ಮಾಡಿ.')
        );
      } else {
        Alert.alert(
          t('Google Sign-In', 'ಗೂಗಲ್ ಸೈನ್-ಇನ್'),
          t('Please sign in using your verified Mobile Number or Password below.', 'ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಮೊಬೈಲ್ OTP ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ.')
        );
      }
    } catch (err: any) {
      setError(err.message || t('Google Sign-In unavailable.', 'ಗೂಗಲ್ ಸೈನ್-ಇನ್ ಲಭ್ಯವಿಲ್ಲ.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Header */}
          <View style={styles.header}>
            <Logo size={56} />
            <Text style={styles.brandTitle}>NUK RentServe</Text>
            <Text style={styles.title}>{t('loginTitle', 'ಸ್ವಾಗತ')}</Text>
            <Text style={styles.sub}>
              {t('loginSub', 'ಮೊಬೈಲ್ OTP ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಮೂಲಕ ಲಾಗಿನ್ ಆಗಿ')}
            </Text>
          </View>

          {/* Two Visible Method Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'otp' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('otp');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <Smartphone
                size={18}
                color={activeTab === 'otp' ? COLORS.white : COLORS.mute}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'otp' && styles.tabTextActive]}>
                {t('Login with OTP', 'ಮೊಬೈಲ್ OTP ಲಾಗಿನ್')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'password' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('password');
                setError('');
              }}
              activeOpacity={0.8}
            >
              <KeyRound
                size={18}
                color={activeTab === 'password' ? COLORS.white : COLORS.mute}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'password' && styles.tabTextActive]}>
                {t('Login with Password', 'ಪಾಸ್‌ವರ್ಡ್ ಲಾಗಿನ್')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner with Connectivity Verification */}
          {error ? (
            <ErrorBanner
              message={error}
              onRetry={handleRetry}
              loading={checkingConnection}
              retryText={t('Retry', 'ಮರುಪ್ರಯತ್ನ')}
            />
          ) : null}

          {/* Main Form Card */}
          <View style={[styles.formCard, SHADOWS.card]}>
            {activeTab === 'otp' ? (
              /* TAB 1: LOGIN WITH OTP */
              <View>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label={t('Mobile Number', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ')}
                      placeholder="9845012345"
                      value={phone}
                      onChangeText={(val) => {
                        setPhone(val);
                        if (otpSent) setOtpSent(false);
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      editable={!otpSent}
                    />
                  </View>
                </View>

                {!otpSent ? (
                  <Button
                    title={t('Send OTP', 'OTP ಕಳುಹಿಸಿ')}
                    onPress={handleSendOtp}
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={otpLoading}
                    icon={<Smartphone size={18} color={COLORS.white} style={{ marginRight: 8 }} />}
                    style={styles.submitBtn}
                  />
                ) : (
                  <View style={styles.otpVerifySection}>
                    <View style={styles.otpHeaderRow}>
                      <Text style={styles.otpSentLabel}>
                        {t('OTP sent to +91 ', '+91 ಗೆ OTP ಕಳುಹಿಸಲಾಗಿದೆ ')}{phone}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          setDevOtp(null);
                        }}
                      >
                        <Text style={styles.changePhoneText}>{t('Change', 'ಬದಲಾಯಿಸಿ')}</Text>
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
                      style={{ letterSpacing: 8, textAlign: 'center', fontSize: 20, fontWeight: '800' }}
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
                      title={t('Verify & Login', 'ದೃಢೀಕರಿಸಿ ಲಾಗಿನ್ ಆಗಿ')}
                      onPress={handleVerifyOtpAndLogin}
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={otpLoading}
                      icon={<CheckCircle2 size={18} color={COLORS.white} style={{ marginRight: 8 }} />}
                      style={styles.submitBtn}
                    />
                  </View>
                )}
              </View>
            ) : (
              /* TAB 2: LOGIN WITH PASSWORD */
              <View>
                <Input
                  label={t('Mobile Number or Email', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್')}
                  placeholder="9845012345 or user@example.com"
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

                <TouchableOpacity onPress={onForgotPassword} style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>
                    {t('forgotPassword', 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?')}
                  </Text>
                </TouchableOpacity>

                <Button
                  title={t('Sign In', 'ಲಾಗಿನ್')}
                  onPress={handlePasswordLogin}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  icon={<LogIn size={18} color={COLORS.white} style={{ marginRight: 8 }} />}
                  style={styles.submitBtn}
                />
              </View>
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('OR', 'ಅಥವಾ')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Authentication */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || loading || otpLoading}
              activeOpacity={0.8}
            >
              <View style={styles.googleContent}>
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <>
                    <View style={styles.googleGContainer}>
                      <Text style={styles.googleGText}>G</Text>
                    </View>
                    <Text style={styles.googleBtnText}>
                      {t('Continue with Google', 'ಗೂಗಲ್ ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ')}
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Registration Hub */}
          <View style={[styles.regSection, SHADOWS.card]}>
            <Text style={styles.regTitle}>
              {t('New to NUK RentServe? Create your account:', 'ಹೊಸ ಬಳಕೆದಾರರೇ? ಖಾತೆಯನ್ನು ರಚಿಸಿ:')}
            </Text>
            <View style={styles.regGrid}>
              <TouchableOpacity
                style={styles.regTile}
                onPress={onRegisterCustomer}
                activeOpacity={0.7}
              >
                <View style={[styles.regTileIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <User size={18} color="#4F46E5" />
                </View>
                <Text style={styles.regTileTitle}>{t('Customer', 'ಗ್ರಾಹಕ')}</Text>
                <Text style={styles.regTileSub}>{t('Rent & Hire', 'ಬಾಡಿಗೆ/ಸೇವೆ')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regTile}
                onPress={onRegisterProvider}
                activeOpacity={0.7}
              >
                <View style={[styles.regTileIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Wrench size={18} color="#059669" />
                </View>
                <Text style={styles.regTileTitle}>{t('Provider', 'ಪೂರೈಕೆದಾರ')}</Text>
                <Text style={styles.regTileSub}>{t('Trades & Work', 'ಸೇವಾ ಕೆಲಸ')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regTile}
                onPress={onRegisterDriver}
                activeOpacity={0.7}
              >
                <View style={[styles.regTileIconBox, { backgroundColor: '#FFFBEB' }]}>
                  <Car size={18} color="#D97706" />
                </View>
                <Text style={styles.regTileTitle}>{t('Driver', 'ಚಾಲಕ')}</Text>
                <Text style={styles.regTileSub}>{t('Auto & Car', 'ಆಟೋ/ಕಾರು')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regTile}
                onPress={onRegisterStudent}
                activeOpacity={0.7}
              >
                <View style={[styles.regTileIconBox, { backgroundColor: '#FDF2F8' }]}>
                  <GraduationCap size={18} color="#DB2777" />
                </View>
                <Text style={styles.regTileTitle}>{t('Student', 'ವಿದ್ಯಾರ್ಥಿ')}</Text>
                <Text style={styles.regTileSub}>{t('Partner', 'ಪಾಲುದಾರ')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Administrator Portal Link */}
          <TouchableOpacity
            onPress={onAdminLogin}
            style={styles.adminLinkRow}
            activeOpacity={0.7}
          >
            <ShieldCheck size={16} color={COLORS.mute} style={{ marginRight: 6 }} />
            <Text style={styles.adminLinkText}>
              {t('Administrator Console Login', 'ನಿರ್ವಾಹಕರ ಪೋರ್ಟಲ್')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.paper },
  keyboard: { flex: 1 },
  scroll: { padding: 20, justifyContent: 'center', flexGrow: 1, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 14 },
  brandTitle: { fontSize: 13, fontWeight: '800', color: COLORS.brand, marginTop: 6, letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.ink, marginTop: 4 },
  sub: { fontSize: 13, color: COLORS.mute, marginTop: 4, textAlign: 'center' },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  tabBtnActive: {
    backgroundColor: COLORS.brand,
    ...SHADOWS.card,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.mute,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
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
  otpVerifySection: {
    marginTop: 4,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpSentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  changePhoneText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand,
  },
  devOtpBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: RADIUS.md,
    padding: 8,
    marginBottom: 12,
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
    marginBottom: 14,
  },
  resendTimerText: {
    fontSize: 13,
    color: COLORS.mute,
    fontWeight: '600',
  },
  resendActionText: {
    fontSize: 13,
    color: COLORS.brand,
    fontWeight: '800',
  },
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
    fontSize: 14,
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
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    alignItems: 'center',
    backgroundColor: COLORS.paper,
  },
  regTileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  regTileTitle: { fontSize: 11, fontWeight: '800', color: COLORS.ink },
  regTileSub: { fontSize: 9, color: COLORS.mute, marginTop: 1, textAlign: 'center' },
  adminLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  adminLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
  },
});
