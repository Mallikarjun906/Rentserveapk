// Student Partner Registration Screen (/register/student) with Real Document Uploads & Back Navigation

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

  // Real Upload Files (start strictly as null)
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
      formData.append('address', address.trim() || 'Vidyagiri, Bagalkot');
      formData.append('city', city.trim());
      formData.append('terms', 'true');
      formData.append('consent', 'true');

      // Attach student ID card
      if (idCardDoc) {
        formData.append('studentIdCardDocument', {
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

      // Log in
      await login(email.trim().toLowerCase(), password);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Student registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={styles.successBox}>
            <Text style={styles.successEmoji}>🎓</Text>
            <Badge tone="sun" label={t('Under Review', 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ')} />
            <Text style={styles.successTitle}>
              {t('Student Registration Submitted!', 'ವಿದ್ಯಾರ್ಥಿ ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!')}
            </Text>
            <Text style={styles.successSub}>
              {t(
                'Our college coordinator desk will review your College ID card. You have access to your Student Dashboard to explore student rentals and earn 0% platform fee partner perks.',
                'ನಮ್ಮ ಕಾಲೇಜು ಸಂಯೋಜಕರ ತಂಡವು ನಿಮ್ಮ ವಿದ್ಯಾರ್ಥಿ ಗುರುತಿನ ಚೀಟಿಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ. ನೀವು ವಿದ್ಯಾರ್ಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಪ್ರವೇಶಿಸಬಹುದು.'
              )}
            </Text>
            <Button
              title={t('Go to Student Hub', 'ವಿದ್ಯಾರ್ಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ')}
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
      {/* Visible In-App Back Navigation */}
      <Header
        title={t('Student Partner Registration', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ನೋಂದಣಿ')}
        subtitle="Earn 100% direct commission with 0% platform fee"
        onBack={onBack || onLogin}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size={42} />
            <Text style={styles.title}>{t('Student Partner Program', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ಕಾರ್ಯಕ್ರಮ')}</Text>
          </View>

          {/* Transparent Commission Banner */}
          <View style={styles.policyBanner}>
            <Text style={styles.policyIcon}>🎓</Text>
            <View style={styles.policyInfo}>
              <Text style={styles.policyTitle}>
                {t('100% Student Commission Transparency', '೧೦೦% ನೇರ ವಿದ್ಯಾರ್ಥಿ ಕಮಿಷನ್')}
              </Text>
              <Text style={styles.policyText}>
                {t(
                  'Students obtain owner permission to list rooms. Owner & renter pay commission directly to the student upon agreement. NUK RentServe retains ₹0 commission.',
                  'ವಿದ್ಯಾರ್ಥಿಗಳು ಮಾಲೀಕರ ಅನುಮತಿ ಪಡೆದು ಕೊಠಡಿಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡುತ್ತಾರೆ. ಒಪ್ಪಂದದ ನಂತರ ಕಮಿಷನ್ ಹಣ ನೇರವಾಗಿ ವಿದ್ಯಾರ್ಥಿಗೆ ಸಂದಾಯವಾಗುತ್ತದೆ. NUK ₹0 ಕಮಿಷನ್ ಪಡೆಯುತ್ತದೆ.'
                )}
              </Text>
            </View>
          </View>

          {error ? <ErrorBanner message={error} onRetry={handleRegister} /> : null}

          <View style={styles.card}>
            <Text style={styles.sectionHeader}>{t('1. Student Details', '೧. ವಿದ್ಯಾರ್ಥಿ ವಿವರಗಳು')}</Text>

            <Input
              label={t('Full Name (as on College ID)', 'ಪೂರ್ಣ ಹೆಸರು')}
              placeholder="e.g. Ramesh Kumar"
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
              placeholder="student@college.edu or gmail"
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

            <Text style={styles.sectionHeader}>{t('2. College Credentials', '೨. ಕಾಲೇಜು ಮಾಹಿತಿ')}</Text>

            <Input
              label={t('College / Institution Name', 'ಕಾಲೇಜು ಹೆಸರು')}
              placeholder="e.g. Basaveshwar Engineering College (BEC)"
              value={collegeName}
              onChangeText={setCollegeName}
            />

            <Input
              label={t('Student USN / Roll Number', 'ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ (USN)')}
              placeholder="e.g. 2BA21CS045"
              value={studentIdNumber}
              onChangeText={setStudentIdNumber}
              autoCapitalize="characters"
            />

            <Input
              label={t('Campus / Hostel Locality', 'ಸ್ಥಳ / ವಿಳಾಸ')}
              placeholder="Vidyagiri, Bagalkot"
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.sectionHeader}>{t('3. Verification Documents', '೩. ಪರಿಶೀಲನಾ ದಾಖಲೆಗಳು')}</Text>

            {/* Document Uploaders */}
            <DocumentUploader
              label={t('College Student ID Card', 'ಕಾಲೇಜು ಐಡಿ ಕಾರ್ಡ್')}
              description="Front side with photo & USN (PDF, JPG, PNG)"
              file={idCardDoc}
              onFileSelect={setIdCardDoc}
              required
              uploadState={loading ? 'uploading' : idCardDoc ? 'selected' : 'idle'}
            />

            <DocumentUploader
              label={t('Govt ID Proof (Optional)', 'ಗುರುತಿನ ಚೀಟಿ (ಐಚ್ಛಿಕ)')}
              description="Aadhaar or Voter ID (PDF, JPG, PNG)"
              file={aadhaarDoc}
              onFileSelect={setAadhaarDoc}
              uploadState={loading ? 'uploading' : aadhaarDoc ? 'selected' : 'idle'}
            />

            {/* Consent & Terms */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setConsent(!consent)}
            >
              <View style={[styles.checkbox, consent && styles.checkboxActive]}>
                {consent && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                {t(
                  'I consent to verification of my college enrollment credentials by NUK RentServe desk.',
                  'ನನ್ನ ಕಾಲೇಜು ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.'
                )}
              </Text>
            </TouchableOpacity>

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
                  {t('Student Partner Terms & Commission Guidelines', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ನಿಯಮಗಳು')}
                </Text>
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Submit Student Application', 'ವಿದ್ಯಾರ್ಥಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ')}
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
              {t('Already registered?', 'ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ?')}{' '}
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
  scroll: { padding: 16, flexGrow: 1, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.ink, marginTop: 8, textAlign: 'center' },
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sunTint,
    borderWidth: 1.5,
    borderColor: COLORS.sun,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 14,
  },
  policyIcon: { fontSize: 24, marginRight: 10 },
  policyInfo: { flex: 1 },
  policyTitle: { fontSize: 13, fontWeight: '800', color: COLORS.ink, marginBottom: 2 },
  policyText: { fontSize: 11, color: COLORS.ink, lineHeight: 16, fontWeight: '500' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand,
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
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
