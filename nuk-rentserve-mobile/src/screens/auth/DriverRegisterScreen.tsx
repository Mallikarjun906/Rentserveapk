// Driver Registration Screen (/register/driver) with Mandatory Phone OTP Verification
// Fully integrated with Backend Phone Verification Session, Real Document Uploads & Lucide Icons

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Car,
  Truck,
  ShieldCheck,
  Check,
  Clock,
  Eye,
  EyeOff,
  UserPlus,
  Smartphone,
  CheckCircle2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { DocumentUploader, UploadFile } from '../../components/common/DocumentUploader';
import { appendFileToFormData, validateImage } from '../../utils/fileUpload';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { isValidEmail, isValidPhone } from '../../utils/validators';

interface DriverRegisterScreenProps {
  onLogin: () => void;
  onReadTerms: () => void;
  onSuccess: () => void;
  onBack?: () => void;
}

export const DriverRegisterScreen: React.FC<DriverRegisterScreenProps> = ({
  onLogin,
  onReadTerms,
  onSuccess,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t } = useLocalization();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bagalkot');

  const [vehicleType, setVehicleType] = useState<'auto' | 'car' | 'goods-van'>('auto');
  const [regNumber, setRegNumber] = useState('');
  const [dlNumber, setDlNumber] = useState('');

  // Phone OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);

  // Real Upload Files
  const [profileImage, setProfileImage] = useState<UploadFile | null>(null);
  const [dlDoc, setDlDoc] = useState<UploadFile | null>(null);
  const [rcDoc, setRcDoc] = useState<UploadFile | null>(null);
  const [addressDoc, setAddressDoc] = useState<UploadFile | null>(null);

  const [consent, setConsent] = useState(false);
  const [terms, setTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedApp, setSubmittedApp] = useState(false);

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
      const response = await authApi.sendOtp(cleanPhone, 'driver-registration', 'driver');
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
      const response = await authApi.verifyOtp(cleanPhone, otpCode.trim(), 'driver-registration');
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

  const handleResetPhone = () => {
    setPhoneVerified(false);
    setVerificationToken(null);
    setOtpSent(false);
    setOtpCode('');
    setDevOtp(null);
  };

  const handleRegister = async () => {
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError(t('Please enter your full name as on Driving Licence', 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಪ್ರಕಾರ ಪೂರ್ಣ ಹೆಸರು ನಮೂದಿಸಿ'));
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
    if (!dlNumber.trim() || dlNumber.trim().length < 5) {
      setError(t('Please enter your Driving Licence Number', 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!regNumber.trim() || regNumber.trim().length < 4) {
      setError(t('Please enter your Vehicle Registration Number (e.g. KA 29 B 1234)', 'ವಾಹನ ನೋಂದಣಿ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ'));
      return;
    }

    if (!dlDoc) {
      setError(t('Please attach your Driving Licence document', 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ದಾಖಲೆಯನ್ನು ಲಗತ್ತಿಸಿ'));
      return;
    }

    if (profileImage) {
      const imgVal = validateImage(profileImage);
      if (!imgVal.valid) {
        setError(imgVal.error || 'Invalid profile photo.');
        return;
      }
    }

    if (!consent) {
      setError(t('Explicit consent is required for government licence verification', 'ಲೈಸೆನ್ಸ್ ಪರಿಶೀಲನೆಗೆ ನಿಮ್ಮ ಒಪ್ಪಿಗೆ ಅಗತ್ಯವಿದೆ'));
      return;
    }
    if (!terms) {
      setError(t('Please accept Terms & Conditions', 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ'));
      return;
    }

    const raw = phone.replace(/\D/g, '');
    const cleanPhone = raw.startsWith('91') && raw.length === 12 ? raw.slice(2) : raw;

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('phone', cleanPhone);
      formData.append('password', password);
      formData.append('address', address.trim() || 'Bagalkot');
      formData.append('city', city.trim());
      formData.append('drivingLicenceNumber', dlNumber.trim());
      formData.append('vehicleType', vehicleType);
      formData.append('vehicleRegistrationNumber', regNumber.trim());
      formData.append('terms', 'true');
      formData.append('consent', 'true');
      formData.append('verificationToken', verificationToken);

      if (profileImage) {
        await appendFileToFormData(formData, 'profileImage', profileImage);
      }

      if (dlDoc) {
        await appendFileToFormData(formData, 'drivingLicenceDocument', dlDoc);
      }

      if (rcDoc) {
        await appendFileToFormData(formData, 'vehicleRcDocument', rcDoc);
      }

      if (addressDoc) {
        await appendFileToFormData(formData, 'addressProofDocument', addressDoc);
      }

      await authApi.registerDriver(formData);
      setSubmittedApp(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Driver registration failed. Please check your documents.');
    } finally {
      setLoading(false);
    }
  };

  if (submittedApp) {
    return (
      <View style={[styles.root, { paddingBottom: insets.bottom }]}>
        <Header title={t('Application Submitted', 'ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ')} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.successBox, SHADOWS.card]}>
            <View style={styles.clockCircle}>
              <Clock size={40} color={COLORS.warn} />
            </View>
            <Badge tone="warn" label={t('Pending Verification', 'ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ')} />
            <Text style={styles.successTitle}>
              {t('Driver Application Under Review!', 'ಚಾಲಕರ ಅರ್ಜಿ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ!')}
            </Text>
            <Text style={styles.successSub}>
              {t(
                'Our transport safety team will verify your Driving Licence and Vehicle RC details. Once verified, you will be able to go online, accept customer trips and track earnings.',
                'ನಮ್ಮ ಸಾರಿಗೆ ತಂಡವು ನಿಮ್ಮ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಮತ್ತು ವಾಹನ ಆರ್‌ಸಿ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ. ಅನುಮೋದನೆಯ ನಂತರ ಪ್ರಯಾಣಗಳನ್ನು ಸ್ವೀಕರಿಸಬಹುದು.'
              )}
            </Text>
            <Button
              title={t('Go to Driver Dashboard', 'ಡ್ರೈವರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ')}
              onPress={onSuccess}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.successBtn}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <Header
        title={t('Driver Registration', 'ಚಾಲಕರ ನೋಂದಣಿ')}
        subtitle={t('Auto, Car & Goods Van Driver Onboarding', 'ವಾಹನ ಚಾಲಕರ ನೋಂದಣಿ')}
        onBack={onBack || onLogin}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size={46} />
            <Text style={styles.title}>{t('Driver Partner Registration', 'ಚಾಲಕರ ಪಾಲುದಾರ ನೋಂದಣಿ')}</Text>
          </View>

          {/* Verification Notice Banner */}
          <View style={styles.noticeBanner}>
            <ShieldCheck size={18} color={COLORS.brand} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.noticeText}>
              {t(
                'Notice: All drivers must undergo administrator document verification before receiving ride bookings.',
                'ಗಮನಿಸಿ: ಪ್ರಯಾಣ ಬುಕಿಂಗ್ ಸ್ವೀಕರಿಸುವ ಮೊದಲು ಚಾಲಕರ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.'
              )}
            </Text>
          </View>

          {error ? <ErrorBanner message={error} onRetry={handleRegister} /> : null}

          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.sectionHeader}>{t('1. Personal Details', '೧. ವೈಯಕ್ತಿಕ ವಿವರಗಳು')}</Text>

            <Input
              label={t('Full Name (as on Driving Licence)', 'ಪೂರ್ಣ ಹೆಸರು')}
              placeholder="e.g. Manjunath Kamble"
              value={fullName}
              onChangeText={setFullName}
            />

            {/* MANDATORY PHONE OTP VERIFICATION */}
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
              placeholder="driver@example.com"
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
              label={t('Residential Address', 'ವಿಳಾಸ')}
              placeholder="Street / Locality, Bagalkot"
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.sectionHeader}>{t('2. Vehicle Details', '೨. ವಾಹನ ವಿವರಗಳು')}</Text>

            {/* Vehicle Type Picker */}
            <Text style={styles.inputLabel}>{t('Vehicle Category', 'ವಾಹನ ವರ್ಗ')}</Text>
            <View style={styles.vehicleTypeRow}>
              {[
                { key: 'auto', label: 'Auto Rickshaw', icon: Car },
                { key: 'car', label: 'Car', icon: Car },
                { key: 'goods-van', label: 'Goods Van', icon: Truck },
              ].map((item) => {
                const IconComponent = item.icon;
                const isActive = vehicleType === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.vehiclePill,
                      isActive && styles.vehiclePillActive,
                    ]}
                    onPress={() => setVehicleType(item.key as any)}
                    activeOpacity={0.7}
                  >
                    <IconComponent
                      size={14}
                      color={isActive ? COLORS.brand : COLORS.ink}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.vehiclePillText,
                        isActive && styles.vehiclePillTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              label={t('Vehicle Registration Number', 'ವಾಹನ ನೋಂದಣಿ ಸಂಖ್ಯೆ')}
              placeholder="e.g. KA 29 B 4821"
              value={regNumber}
              onChangeText={setRegNumber}
              autoCapitalize="characters"
            />

            <Input
              label={t('Driving Licence Number', 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಸಂಖ್ಯೆ')}
              placeholder="e.g. KA29 20240012345"
              value={dlNumber}
              onChangeText={setDlNumber}
              autoCapitalize="characters"
            />

            <Text style={styles.sectionHeader}>{t('3. Document Uploads', '೩. ದಾಖಲೆಗಳ ಅಪ್‌ಲೋಡ್')}</Text>

            <DocumentUploader
              label={t('Driver Photograph', 'ಚಾಲಕರ ಫೋಟೋ')}
              description="Front facing photo / selfie (JPG, PNG)"
              acceptTypes="image"
              file={profileImage}
              onFileSelect={setProfileImage}
              uploadState={loading ? 'uploading' : profileImage ? 'selected' : 'idle'}
            />

            <DocumentUploader
              label={t('Driving Licence Document', 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್')}
              description="Clear photo or PDF of driving licence"
              file={dlDoc}
              onFileSelect={setDlDoc}
              required
              uploadState={loading ? 'uploading' : dlDoc ? 'selected' : 'idle'}
            />

            <DocumentUploader
              label={t('Vehicle RC / Registration Certificate', 'ವಾಹನ ಆರ್‌ಸಿ')}
              description="Clear photo or PDF of registration certificate"
              file={rcDoc}
              onFileSelect={setRcDoc}
              uploadState={loading ? 'uploading' : rcDoc ? 'selected' : 'idle'}
            />

            <DocumentUploader
              label={t('Address Proof / Aadhaar Document', 'ವಿಳಾಸ ಪುರಾವೆ / ಆಧಾರ್')}
              description="Aadhaar or local address verification document"
              file={addressDoc}
              onFileSelect={setAddressDoc}
              uploadState={loading ? 'uploading' : addressDoc ? 'selected' : 'idle'}
            />

            {/* Checkboxes */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setConsent(!consent)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, consent && styles.checkboxActive]}>
                {consent ? <Check size={14} color={COLORS.white} strokeWidth={3} /> : null}
              </View>
              <Text style={styles.checkboxLabel}>
                {t(
                  'I give consent to NUK RentServe to verify my Driving Licence and Vehicle registration with official transport authorities.',
                  'ನನ್ನ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಪರಿಶೀಲನೆಗೆ ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.'
                )}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setTerms(!terms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, terms && styles.checkboxActive]}>
                {terms ? <Check size={14} color={COLORS.white} strokeWidth={3} /> : null}
              </View>
              <Text style={styles.checkboxLabel}>
                {t('I agree to NUK RentServe Driver Partner', 'ನಾನು ಒಪ್ಪುತ್ತೇನೆ')}{' '}
                <Text style={styles.termsLink} onPress={onReadTerms}>
                  {t('Terms & Conditions', 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು')}
                </Text>
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Submit Driver Application', 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ')}
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
                {t('Already registered? Log In', 'ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆಯೇ? ಲಾಗಿನ್')}
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
  noticeBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  vehiclePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
  },
  vehiclePillActive: {
    borderColor: COLORS.brand,
    backgroundColor: '#FFF1F2',
  },
  vehiclePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
  vehiclePillTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 10,
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
  checkboxLabel: {
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
    marginTop: 14,
    marginBottom: 12,
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
  successBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  clockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 12,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  successBtn: {
    marginTop: 20,
  },
});
