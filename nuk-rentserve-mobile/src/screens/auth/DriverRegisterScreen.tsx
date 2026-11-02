// Driver Registration Screen (/register/driver)

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
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { isValidEmail, isValidPhone } from '../../utils/validators';

interface DriverRegisterScreenProps {
  onLogin: () => void;
  onReadTerms: () => void;
  onSuccess: () => void;
}

export const DriverRegisterScreen: React.FC<DriverRegisterScreenProps> = ({
  onLogin,
  onReadTerms,
  onSuccess,
}) => {
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

  // Attached files state (supports web file inputs and mobile mocks)
  const [profileImageName, setProfileImageName] = useState('driver-selfie.jpg');
  const [dlDocName, setDlDocName] = useState('driving-licence.pdf');
  const [rcDocName, setRcDocName] = useState('vehicle-rc.pdf');
  const [addressDocName, setAddressDocName] = useState('address-proof.pdf');

  const [consent, setConsent] = useState(false);
  const [terms, setTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedApp, setSubmittedApp] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError(t('Please enter your full name as on Driving Licence', 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಪ್ರಕಾರ ಪೂರ್ಣ ಹೆಸರು ನಮೂದಿಸಿ'));
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
    if (!dlNumber.trim() || dlNumber.trim().length < 5) {
      setError(t('Please enter your Driving Licence Number', 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!regNumber.trim() || regNumber.trim().length < 4) {
      setError(t('Please enter your Vehicle Registration Number (e.g. KA 29 B 1234)', 'ವಾಹನ ನೋಂದಣಿ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ'));
      return;
    }
    if (!consent) {
      setError(t('Explicit consent is required for government licence verification', 'ಲೈಸೆನ್ಸ್ ಪರಿಶೀಲನೆಗೆ ನಿಮ್ಮ ಒಪ್ಪಿಗೆ ಅಗತ್ಯವಿದೆ'));
      return;
    }
    if (!terms) {
      setError(t('Please accept Terms & Conditions', 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('phone', phone.trim());
      formData.append('password', password);
      formData.append('address', address.trim() || 'Bagalkot');
      formData.append('city', city.trim());
      formData.append('drivingLicenceNumber', dlNumber.trim());
      formData.append('vehicleType', vehicleType);
      formData.append('vehicleRegistrationNumber', regNumber.trim());
      formData.append('terms', 'true');
      formData.append('consent', 'true');

      // Attach documents (FormData compatible across Expo web & mobile)
      formData.append('profileImage', {
        uri: 'file://mock/profile.jpg',
        name: profileImageName,
        type: 'image/jpeg',
      } as any);

      formData.append('drivingLicenceDocument', {
        uri: 'file://mock/dl.pdf',
        name: dlDocName,
        type: 'application/pdf',
      } as any);

      formData.append('vehicleRcDocument', {
        uri: 'file://mock/rc.pdf',
        name: rcDocName,
        type: 'application/pdf',
      } as any);

      formData.append('addressProofDocument', {
        uri: 'file://mock/address.pdf',
        name: addressDocName,
        type: 'application/pdf',
      } as any);

      await authApi.registerDriver(formData);

      // Log in session
      await login(email.trim().toLowerCase(), password);
      setSubmittedApp(true);
    } catch (err: any) {
      setError(err.message || 'Driver registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (submittedApp) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={styles.successBox}>
            <Text style={styles.successEmoji}>⏳</Text>
            <Badge tone="sun" label={t('Pending Verification', 'ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ')} />
            <Text style={styles.successTitle}>
              {t('Driver Application Submitted!', 'ಚಾಲಕರ ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!')}
            </Text>
            <Text style={styles.successSub}>
              {t(
                'Our administration team in Bagalkot will review your Driving Licence and Vehicle RC within 24 hours. Transport booking dispatch will be enabled upon administrator approval.',
                'ನಮ್ಮ ಆಡಳಿತ ತಂಡವು 24 ಗಂಟೆಗಳ ಒಳಗೆ ನಿಮ್ಮ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಮತ್ತು ಆರ್‌ಸಿಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ. ಅನುಮೋದನೆಯ ನಂತರ ಪ್ರಯಾಣ ಸೇವೆ ಸಕ್ರಿಯಗೊಳ್ಳುತ್ತದೆ.'
              )}
            </Text>
            <Button
              title={t('Go to Driver Dashboard', 'ಚಾಲಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ')}
              onPress={onSuccess}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.successBtn}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Logo size={46} />
            <Text style={styles.title}>{t('Driver Partner Registration', 'ಚಾಲಕರ ಪಾಲುದಾರ ನೋಂದಣಿ')}</Text>
            <Text style={styles.sub}>
              {t('Auto, Car & Goods Van Driver Onboarding', 'ಆಟೋ, ಕಾರು ಮತ್ತು ಗೂಡ್ಸ್ ವ್ಯಾನ್ ಚಾಲಕರ ನೋಂದಣಿ')}
            </Text>
          </View>

          {/* Verification Notice Banner */}
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeIcon}>🛡️</Text>
            <Text style={styles.noticeText}>
              {t(
                'Notice: All drivers must undergo administrator document verification before receiving ride bookings.',
                'ಗಮನಿಸಿ: ಪ್ರಯಾಣ ಬುಕಿಂಗ್ ಸ್ವೀಕರಿಸುವ ಮೊದಲು ಚಾಲಕರ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.'
              )}
            </Text>
          </View>

          {error ? <ErrorBanner message={error} onRetry={handleRegister} /> : null}

          <View style={styles.card}>
            <Text style={styles.sectionHeader}>{t('1. Personal Details', '೧. ವೈಯಕ್ತಿಕ ವಿವರಗಳು')}</Text>

            <Input
              label={t('Full Name (as on Driving Licence)', 'ಪೂರ್ಣ ಹೆಸರು')}
              placeholder="e.g. Manjunath Kamble"
              value={fullName}
              onChangeText={setFullName}
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
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
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
                { key: 'auto', label: '🛺 Auto Rickshaw' },
                { key: 'car', label: '🚗 Car' },
                { key: 'goods-van', label: '🚚 Goods Van' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.vehiclePill,
                    vehicleType === item.key && styles.vehiclePillActive,
                  ]}
                  onPress={() => setVehicleType(item.key as any)}
                >
                  <Text
                    style={[
                      styles.vehiclePillText,
                      vehicleType === item.key && styles.vehiclePillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
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

            {/* Document Row: Profile Photo */}
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>📸 {t('Driver Photograph', 'ಚಾಲಕರ ಫೋಟೋ')}</Text>
                <Text style={styles.docSub}>{profileImageName}</Text>
              </View>
              <Badge tone="ok" label="Attached" />
            </View>

            {/* Document Row: Driving Licence */}
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>🪪 {t('Driving Licence (DL)', 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್')}</Text>
                <Text style={styles.docSub}>{dlDocName}</Text>
              </View>
              <Badge tone="ok" label="Attached" />
            </View>

            {/* Document Row: Vehicle RC */}
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>📄 {t('Vehicle RC Document', 'ವಾಹನ ಆರ್‌ಸಿ')}</Text>
                <Text style={styles.docSub}>{rcDocName}</Text>
              </View>
              <Badge tone="ok" label="Attached" />
            </View>

            {/* Document Row: Address Proof */}
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>🏠 {t('Address Proof Document', 'ವಿಳಾಸ ಪುರಾವೆ')}</Text>
                <Text style={styles.docSub}>{addressDocName}</Text>
              </View>
              <Badge tone="ok" label="Attached" />
            </View>

            {/* Explicit Consent Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setConsent(!consent)}
            >
              <View style={[styles.checkbox, consent && styles.checkboxActive]}>
                {consent && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                {t(
                  'I provide explicit consent to NUK RentServe for verifying my driving licence and vehicle identity records.',
                  'ನನ್ನ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಮತ್ತು ವಾಹನ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.'
                )}
              </Text>
            </TouchableOpacity>

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setTerms(!terms)}
            >
              <View style={[styles.checkbox, terms && styles.checkboxActive]}>
                {terms && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                {t('I agree to the', 'ನಾನು ಒಪ್ಪುತ್ತೇನೆ')}{' '}
                <Text style={styles.termsLink} onPress={onReadTerms}>
                  {t('Driver Terms & Operating Code', 'ಚಾಲಕರ ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳು')}
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
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {t('Already registered as a driver?', 'ಈಗಾಗಲೇ ಚಾಲಕರಾಗಿ ನೋಂದಾಯಿಸಿದ್ದೀರಾ?')}{' '}
            </Text>
            <TouchableOpacity onPress={onLogin}>
              <Text style={styles.loginLink}>{t('Sign In', 'ಲಾಗಿನ್')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  keyboard: { flex: 1 },
  scroll: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 23, fontWeight: '900', color: COLORS.ink, marginTop: 10, textAlign: 'center' },
  sub: { fontSize: 13, color: COLORS.mute, marginTop: 4, textAlign: 'center' },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sunTint,
    borderWidth: 1,
    borderColor: COLORS.sun,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 16,
  },
  noticeIcon: { fontSize: 20, marginRight: 8 },
  noticeText: { fontSize: 12, color: COLORS.ink, flex: 1, fontWeight: '600', lineHeight: 17 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brand,
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputLabel: { fontSize: 13, fontWeight: '700', color: COLORS.ink, marginBottom: 6 },
  vehicleTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  vehiclePill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
  },
  vehiclePillActive: { borderColor: COLORS.brand, backgroundColor: COLORS.brandTint },
  vehiclePillText: { fontSize: 12, fontWeight: '700', color: COLORS.ink },
  vehiclePillTextActive: { color: COLORS.brand },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paper,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  docInfo: { flex: 1, marginRight: 8 },
  docTitle: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  docSub: { fontSize: 11, color: COLORS.mute, marginTop: 2 },
  toggleText: { fontSize: 13, fontWeight: '700', color: COLORS.brand },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, marginBottom: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.mute,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  checkMark: { color: COLORS.white, fontSize: 13, fontWeight: '900' },
  termsText: { fontSize: 12, color: COLORS.ink, flex: 1, lineHeight: 18 },
  termsLink: { fontWeight: '700', color: COLORS.brand },
  submitBtn: { marginTop: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  footerText: { fontSize: 14, color: COLORS.mute },
  loginLink: { fontSize: 14, fontWeight: '800', color: COLORS.brand },
  successScroll: { padding: 24, flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  successBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.line,
    width: '100%',
  },
  successEmoji: { fontSize: 52, marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: '900', color: COLORS.ink, marginTop: 12, textAlign: 'center' },
  successSub: { fontSize: 13, color: COLORS.mute, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  successBtn: { marginTop: 20 },
});
