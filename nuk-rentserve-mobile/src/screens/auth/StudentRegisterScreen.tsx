// Student Registration Screen (/register/student)

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
import { Logo } from '../../components/common/Logo';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { isValidEmail, isValidPhone } from '../../utils/validators';

interface StudentRegisterScreenProps {
  onLogin: () => void;
  onReadTerms: () => void;
  onSuccess: () => void;
}

export const StudentRegisterScreen: React.FC<StudentRegisterScreenProps> = ({
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
  const [collegeName, setCollegeName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bagalkot');

  const [idCardDocName, setIdCardDocName] = useState('student-college-id.png');
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
      formData.append('studentIdCardDocument', {
        uri: 'file://mock/student-id.png',
        name: idCardDocName,
        type: 'image/png',
      } as any);

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
              title={t('Open Student Dashboard', 'ವಿದ್ಯಾರ್ಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ')}
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
            <Text style={styles.title}>{t('Student Partner Registration', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ನೋಂದಣಿ')}</Text>
            <Text style={styles.sub}>
              {t('Student Rental Concierge & Commission Hub', 'ವಿದ್ಯಾರ್ಥಿ ಬಾಡಿಗೆ ಮತ್ತು ಕಮಿಷನ್ ಹಬ್')}
            </Text>
          </View>

          {error ? <ErrorBanner message={error} onRetry={handleRegister} /> : null}

          <View style={styles.card}>
            <Input
              label={t('Full Student Name', 'ವಿದ್ಯಾರ್ಥಿಯ ಪೂರ್ಣ ಹೆಸರು')}
              placeholder="e.g. Sneha Kulkarni"
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
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              }
            />

            <Input
              label={t('College / Institute Name', 'ಕಾಲೇಜು / ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಯ ಹೆಸರು')}
              placeholder="e.g. Basaveshwar Engineering College (BEC), Bagalkot"
              value={collegeName}
              onChangeText={setCollegeName}
            />

            <Input
              label={t('Student USN / Roll Number', 'ವಿದ್ಯಾರ್ಥಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ (USN)')}
              placeholder="e.g. 2BA23CS045"
              value={studentIdNumber}
              onChangeText={setStudentIdNumber}
              autoCapitalize="characters"
            />

            <Input
              label={t('Local Address in Town', 'ಸ್ಥಳೀಯ ವಿಳಾಸ')}
              placeholder="Hostel / Room / Locality"
              value={address}
              onChangeText={setAddress}
            />

            <Input
              label={t('City', 'ನಗರ')}
              placeholder="Bagalkot"
              value={city}
              onChangeText={setCity}
            />

            {/* Document Row: Student ID Card */}
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>🎓 {t('Student College ID Card', 'ಕಾಲೇಜು ಗುರುತಿನ ಚೀಟಿ')}</Text>
                <Text style={styles.docSub}>{idCardDocName}</Text>
              </View>
              <Badge tone="ok" label="Attached" />
            </View>

            {/* Consent checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setConsent(!consent)}
            >
              <View style={[styles.checkbox, consent && styles.checkboxActive]}>
                {consent && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                {t(
                  'I confirm I am an active student and consent to student verification.',
                  'ನಾನು ಪ್ರಸ್ತುತ ವಿದ್ಯಾರ್ಥಿ ಎಂಬುದನ್ನು ದೃಢೀಕರಿಸುತ್ತೇನೆ.'
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
                  {t('Student Partner Terms', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರ ನಿಯಮಗಳು')}
                </Text>
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Register as Student', 'ವಿದ್ಯಾರ್ಥಿಯಾಗಿ ನೋಂದಾಯಿಸಿ')}
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
              {t('Already registered as a student?', 'ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ?')}{' '}
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  toggleText: { fontSize: 13, fontWeight: '700', color: COLORS.brand },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paper,
    padding: 12,
    borderRadius: RADIUS.md,
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  docInfo: { flex: 1, marginRight: 8 },
  docTitle: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  docSub: { fontSize: 11, color: COLORS.mute, marginTop: 2 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
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
  submitBtn: { marginTop: 6 },
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
