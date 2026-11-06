// Student Partner Registration Screen (/register/student) with Real Document Uploads & Lucide Icons

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
  GraduationCap,
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

interface StudentRegisterScreenProps {
  onLogin: () => void;
  onReadTerms: () => void;
  onSuccess: () => void;
  onBack?: () => void;
}

export const StudentRegisterScreen: React.FC<StudentRegisterScreenProps> = ({
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
  const [collegeName, setCollegeName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bagalkot');

  // Real Upload Files
  const [idCardDoc, setIdCardDoc] = useState<UploadFile | null>(null);
  const [aadhaarDoc, setAadhaarDoc] = useState<UploadFile | null>(null);

  const [terms, setTerms] = useState(false);
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError(t('Please enter your full student name', 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!isValidPhone(phone)) {
      setError(t('Enter a valid 10-digit mobile number', 'ಮಾನ್ಯ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('Enter a valid student/personal email address', 'ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!password || password.length < 8) {
      setError(t('Password must be at least 8 characters', 'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು'));
      return;
    }
    if (!collegeName.trim() || collegeName.trim().length < 3) {
      setError(t('Please enter your College or University name', 'ನಿಮ್ಮ ಕಾಲೇಜು ಅಥವಾ ವಿಶ್ವವಿದ್ಯಾಲಯದ ಹೆಸರು ನಮೂದಿಸಿ'));
      return;
    }
    if (!studentIdNumber.trim() || studentIdNumber.trim().length < 3) {
      setError(t('Please enter your Student USN or Registration Number', 'ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ (USN) ನಮೂದಿಸಿ'));
      return;
    }

    if (!idCardDoc) {
      setError(t('Please attach your College Student ID card', 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಕಾಲೇಜು ಐಡಿ ಕಾರ್ಡ್ ಲಗತ್ತಿಸಿ'));
      return;
    }

    if (!consent) {
      setError(t('Consent is required to verify student identity records', 'ವಿದ್ಯಾರ್ಥಿ ಐಡಿ ಪರಿಶೀಲನೆಗೆ ನಿಮ್ಮ ಒಪ್ಪಿಗೆ ಅಗತ್ಯವಿದೆ'));
      return;
    }
    if (!terms) {
      setError(t('Please accept Student Partner Terms & Conditions', 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ'));
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
      formData.append('collegeName', collegeName.trim());
      formData.append('studentIdNumber', studentIdNumber.trim());
      formData.append('address', address.trim() || 'Bagalkot');
      formData.append('city', city.trim());
      formData.append('terms', 'true');
      formData.append('consent', 'true');

      if (idCardDoc) {
        formData.append('studentIdCard', {
          uri: idCardDoc.uri,
          name: idCardDoc.name,
          type: idCardDoc.type,
        } as any);
      }

      if (aadhaarDoc) {
        formData.append('aadhaarDocument', {
          uri: aadhaarDoc.uri,
          name: aadhaarDoc.name,
          type: aadhaarDoc.type,
        } as any);
      }

      await authApi.registerStudent(formData);
      await login(email.trim().toLowerCase(), password);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Student registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.root, { paddingBottom: insets.bottom }]}>
        <Header title={t('Application Submitted', 'ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ')} />
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={[styles.successBox, SHADOWS.card]}>
            <View style={styles.clockCircle}>
              <Clock size={40} color={COLORS.ok} />
            </View>
            <Badge tone="ok" label={t('Pending Verification', 'ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ')} />
            <Text style={styles.successTitle}>
              {t('Student Partner Application Submitted!', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!')}
            </Text>
            <Text style={styles.successSub}>
              {t(
                'Our administration team in Bagalkot will verify your College ID card within 24 hours. Once verified, you can refer rental listings with 0% platform brokerage commission.',
                'ನಮ್ಮ ತಂಡವು 24 ಗಂಟೆಗಳಲ್ಲಿ ನಿಮ್ಮ ಕಾಲೇಜು ಐಡಿಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ. ಅನುಮೋದನೆಯ ನಂತರ ನೀವು 0% ಕಮಿಷನ್‌ನೊಂದಿಗೆ ಬಾಡಿಗೆ ಪಟ್ಟಿಗಳನ್ನು ನಿರ್ವಹಿಸಬಹುದು.'
              )}
            </Text>
            <Button
              title={t('Go to Student Hub', 'ವಿದ್ಯಾರ್ಥಿ ಹಬ್‌ಗೆ ಹೋಗಿ')}
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
        title={t('Student Partner Registration', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ನೋಂದಣಿ')}
        subtitle={t('Zero brokerage PG & room referral program', 'ಶೂನ್ಯ ಬ್ರೋಕರೇಜ್ ಬಾಡಿಗೆ ಕಾರ್ಯಕ್ರಮ')}
        onBack={onBack || onLogin}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size={46} />
            <Text style={styles.title}>{t('Student Rental Partner Program', 'ವಿದ್ಯಾರ್ಥಿ ಬಾಡಿಗೆ ಪಾಲುದಾರಿಕೆ')}</Text>
          </View>

          {/* Program Highlights Banner */}
          <View style={styles.programBanner}>
            <GraduationCap size={20} color={COLORS.ok} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.programText}>
              {t(
                'Student Partner Perk: List owner rooms & PGs with owner permission. 100% of agreed commissions are paid directly to you. NUK RentServe collects 0%.',
                'ವಿದ್ಯಾರ್ಥಿ ಸವಲತ್ತು: ಮಾಲೀಕರ ಒಪ್ಪಿಗೆಯೊಂದಿಗೆ ಕೊಠಡಿಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ. ಒಪ್ಪಂದದ ಪೂರ್ಣ ಕಮಿಷನ್ ನಿಮಗೆ ನೇರವಾಗಿ ದೊರೆಯುತ್ತದೆ.'
              )}
            </Text>
          </View>

          {error ? <ErrorBanner message={error} onRetry={handleRegister} /> : null}

          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.sectionHeader}>{t('1. Student Information', '೧. ವಿದ್ಯಾರ್ಥಿ ಮಾಹಿತಿ')}</Text>

            <Input
              label={t('Full Student Name (as on College ID)', 'ಪೂರ್ಣ ಹೆಸರು')}
              placeholder="e.g. Ananya Patil"
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
              label={t('Student / Personal Email', 'ಇಮೇಲ್ ವಿಳಾಸ')}
              placeholder="student@example.com"
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

            <Text style={styles.sectionHeader}>{t('2. College & Campus Details', '೨. ಕಾಲೇಜು ಮಾಹಿತಿ')}</Text>

            <Input
              label={t('College / Institution Name', 'ಕಾಲೇಜಿನ ಹೆಸರು')}
              placeholder="e.g. BVVS Basaveshwar Engineering College"
              value={collegeName}
              onChangeText={setCollegeName}
            />

            <Input
              label={t('Student ID / USN Number', 'ನೋಂದಣಿ ಸಂಖ್ಯೆ (USN)')}
              placeholder="e.g. 2BV22CS042"
              value={studentIdNumber}
              onChangeText={setStudentIdNumber}
              autoCapitalize="characters"
            />

            <Input
              label={t('Campus Locality / Address', 'ಕ್ಯಾಂಪಸ್ ವಿಳಾಸ')}
              placeholder="Vidyagiri, Bagalkot"
              value={address}
              onChangeText={setAddress}
            />

            <Input
              label={t('City / Town', 'ನಗರ')}
              placeholder="Bagalkot"
              value={city}
              onChangeText={setCity}
            />

            <Text style={styles.sectionHeader}>{t('3. Student Verification Document', '೩. ಕಾಲೇಜು ಐಡಿ ಪರಿಶೀಲನೆ')}</Text>

            <DocumentUploader
              label={t('College Student ID Card', 'ಕಾಲೇಜು ವಿದ್ಯಾರ್ಥಿ ಗುರುತಿನ ಚೀಟಿ')}
              description="Clear photo of Student ID Card showing USN and validity (JPG, PNG, PDF)"
              file={idCardDoc}
              onFileSelect={setIdCardDoc}
              required
              uploadState={loading ? 'uploading' : idCardDoc ? 'selected' : 'idle'}
            />

            <DocumentUploader
              label={t('Aadhaar / Government ID (Optional)', 'ಆಧಾರ್ ಅಥವಾ ಸರ್ಕಾರಿ ಗುರುತಿನ ಚೀಟಿ')}
              description="Government identity document copy (JPG, PNG, PDF)"
              file={aadhaarDoc}
              onFileSelect={setAadhaarDoc}
              uploadState={loading ? 'uploading' : aadhaarDoc ? 'selected' : 'idle'}
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
                  'I consent to administrator verification of my College ID for participation in the student rental partner program.',
                  'ನನ್ನ ಕಾಲೇಜು ಐಡಿ ಪರಿಶೀಲನೆಗೆ ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.'
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
                {t('I agree to the Student Partner Terms: I will only list properties with explicit property-owner permission.', 'ಮಾಲೀಕರ ಒಪ್ಪಿಗೆಯೊಂದಿಗೆ ಮಾತ್ರ ಕೊಠಡಿಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡುತ್ತೇನೆ ಎಂದು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತೇನೆ.')}{' '}
                <Text style={styles.termsLink} onPress={onReadTerms}>
                  {t('Read Partner Terms', 'ನಿಯಮಗಳು')}
                </Text>
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Submit Student Partner Application', 'ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ ಸಲ್ಲಿಸಿ')}
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
  programBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E5F4EC',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  programText: {
    fontSize: 12,
    color: '#065F46',
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
    backgroundColor: '#E5F4EC',
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
