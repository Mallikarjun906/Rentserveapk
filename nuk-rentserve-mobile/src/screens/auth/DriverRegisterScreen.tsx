// Driver Registration Screen (/register/driver) with Real Document Uploads & Lucide Icons

import React, { useState } from 'react';
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

    if (!dlDoc) {
      setError(t('Please attach your Driving Licence document', 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ದಾಖಲೆಯನ್ನು ಲಗತ್ತಿಸಿ'));
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

      if (profileImage) {
        formData.append('profileImage', {
          uri: profileImage.uri,
          name: profileImage.name,
          type: profileImage.type,
        } as any);
      }

      if (dlDoc) {
        formData.append('drivingLicenceDocument', {
          uri: dlDoc.uri,
          name: dlDoc.name,
          type: dlDoc.type,
        } as any);
      }

      if (rcDoc) {
        formData.append('vehicleRcDocument', {
          uri: rcDoc.uri,
          name: rcDoc.name,
          type: rcDoc.type,
        } as any);
      }

      if (addressDoc) {
        formData.append('addressProofDocument', {
          uri: addressDoc.uri,
          name: addressDoc.name,
          type: addressDoc.type,
        } as any);
      }

      await authApi.registerDriver(formData);
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
      <View style={[styles.root, { paddingBottom: insets.bottom }]}>
        <Header title={t('Application Submitted', 'ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ')} />
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={[styles.successBox, SHADOWS.card]}>
            <View style={styles.clockCircle}>
              <Clock size={40} color={COLORS.warn} />
            </View>
            <Badge tone="warn" label={t('Pending Verification', 'ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ')} />
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
              label={t('Driving Licence (DL)', 'ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್')}
              description="Front & back or clear copy (PDF, JPG, PNG)"
              file={dlDoc}
              onFileSelect={setDlDoc}
              required
              uploadState={loading ? 'uploading' : dlDoc ? 'selected' : 'idle'}
            />

            <DocumentUploader
              label={t('Vehicle RC Document', 'ವಾಹನ ಆರ್‌ಸಿ')}
              description="Registration Certificate copy (PDF, JPG, PNG)"
              file={rcDoc}
              onFileSelect={setRcDoc}
              uploadState={loading ? 'uploading' : rcDoc ? 'selected' : 'idle'}
            />

            <DocumentUploader
              label={t('Address Proof Document', 'ವಿಳಾಸ ಪುರಾವೆ')}
              description="Aadhaar, Voter ID, or Utility Bill (PDF, JPG, PNG)"
              file={addressDoc}
              onFileSelect={setAddressDoc}
              uploadState={loading ? 'uploading' : addressDoc ? 'selected' : 'idle'}
            />

            {/* Consent & Terms Checkboxes */}
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
                  'I consent to official verification of my Driving Licence & Vehicle RC for public passenger and goods transport.',
                  'ನನ್ನ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್ ಮತ್ತು ವಾಹನ ಆರ್‌ಸಿ ಪರಿಶೀಲನೆಗೆ ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.'
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
                {t('I accept NUK RentServe Driver Partner', 'ನಾನು ಒಪ್ಪುತ್ತೇನೆ')}{' '}
                <Text style={styles.termsLink} onPress={onReadTerms}>
                  {t('Terms & Conditions', 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು')}
                </Text>
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Submit Driver Application', 'ಚಾಲಕರ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ')}
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
  scroll: { padding: 16, paddingBottom: 36 },
  header: { alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.ink, marginTop: 8 },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.brand,
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: 0.2,
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
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  vehiclePillActive: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brandTint,
  },
  vehiclePillText: {
    fontSize: 12,
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
    width: 22,
    height: 22,
    borderRadius: 6,
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
    fontSize: 12,
    color: COLORS.ink,
    flex: 1,
    lineHeight: 17,
  },
  termsLink: {
    color: COLORS.brand,
    fontWeight: '800',
    textDecorationLine: 'underline',
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
    fontWeight: '700',
    color: COLORS.brand,
  },
  successScroll: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
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
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  successBtn: {
    marginTop: 8,
  },
});
