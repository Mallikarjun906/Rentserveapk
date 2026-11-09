// Service Provider Registration Screen (/register/provider) with Real Document Uploads & Lucide Icons

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
} from 'react-native';
import * as Location from 'expo-location';
import {
  Wrench,
  MapPin,
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
import { appendFileToFormData, validateImage } from '../../utils/fileUpload';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { isValidEmail, isValidPhone } from '../../utils/validators';

interface ProviderRegisterScreenProps {
  onLogin: () => void;
  onReadTerms: () => void;
  onSuccess: () => void;
  onBack?: () => void;
}

const CATEGORIES = [
  'Plumber',
  'Electrician',
  'Carpenter',
  'Painter',
  'Cleaning',
  'Appliance Repair',
  'Other Services',
];

export const ProviderRegisterScreen: React.FC<ProviderRegisterScreenProps> = ({
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
  const [dob, setDob] = useState('1995-01-01');
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bagalkot');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [experience, setExperience] = useState('3 years');
  const [description, setDescription] = useState('');

  // GPS Coordinates & Location Detection State
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationStatusText, setLocationStatusText] = useState('');

  // Real Upload Files
  const [profileFile, setProfileFile] = useState<UploadFile | null>(null);
  const [idFile, setIdFile] = useState<UploadFile | null>(null);
  const [addressFile, setAddressFile] = useState<UploadFile | null>(null);

  const [consent, setConsent] = useState(false);
  const [terms, setTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Automatic GPS Location Detection
  const detectLocation = async (userInitiated = false) => {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (userInitiated) {
          Alert.alert(
            'Location Permission Required',
            'Please enable GPS location permission to automatically detect your workshop or service area.'
          );
        }
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (pos?.coords) {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });

        const reverse = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (reverse && reverse[0]) {
          const loc = reverse[0];
          const detectedCity = loc.city || loc.subregion || loc.district || 'Bagalkot';
          setCity(detectedCity);
          const detectedAddr = [loc.name, loc.street, loc.subregion].filter(Boolean).join(', ');
          if (detectedAddr) setAddress(detectedAddr);
          setLocationStatusText(`Location set: ${detectedCity} (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
        }
      }
    } catch {
      if (userInitiated) {
        Alert.alert('Location Detection', 'Could not fetch current GPS location. Please enter manually.');
      }
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || fullName.trim().length < 3) {
      setError(t('Please enter your full business / personal name', 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ'));
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
    if (!idFile) {
      setError(t('Please attach your Government Identity / Aadhaar document', 'ಸರ್ಕಾರಿ ಐಡಿ ಅಥವಾ ಆಧಾರ್ ದಾಖಲೆಯನ್ನು ಲಗತ್ತಿಸಿ'));
      return;
    }
    if (!consent) {
      setError(t('Consent is required for document verification', 'ದಾಖಲೆ ಪರಿಶೀಲನೆಗೆ ನಿಮ್ಮ ಒಪ್ಪಿಗೆ ಅಗತ್ಯವಿದೆ'));
      return;
    }
    if (!terms) {
      setError(t('Please accept Terms & Conditions', 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ'));
      return;
    }

    if (profileFile) {
      const imgVal = validateImage(profileFile);
      if (!imgVal.valid) {
        setError(imgVal.error || 'Invalid profile photo.');
        return;
      }
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('phone', phone.trim());
      formData.append('password', password);
      formData.append('dob', dob || '1995-01-01');
      formData.append('address', address.trim() || 'Bagalkot');
      formData.append('city', city.trim());
      formData.append('category', category);
      formData.append('experience', experience);
      formData.append('description', description.trim() || `${category} services in ${city}`);
      formData.append('terms', 'true');
      formData.append('consent', 'true');

      if (coords) {
        formData.append('latitude', String(coords.latitude));
        formData.append('longitude', String(coords.longitude));
      }

      if (profileFile) {
        await appendFileToFormData(formData, 'profileImage', profileFile);
      }

      if (idFile) {
        await appendFileToFormData(formData, 'aadhaarDocument', idFile);
      }

      if (addressFile) {
        await appendFileToFormData(formData, 'addressProofDocument', addressFile);
      }

      await authApi.registerProvider(formData);
      await login(email.trim().toLowerCase(), password);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Provider registration failed. Please check details.');
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
              <Clock size={40} color={COLORS.warn} />
            </View>
            <Badge tone="warn" label={t('Pending Verification', 'ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ')} />
            <Text style={styles.successTitle}>
              {t('Provider Application Submitted!', 'ಸೇವಾ ಪೂರೈಕೆದಾರರ ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!')}
            </Text>
            <Text style={styles.successSub}>
              {t(
                'Our administration team in Bagalkot will review your documents within 24 hours. Once approved, you can publish service listings and receive customer enquiries.',
                'ನಮ್ಮ ಆಡಳಿತ ತಂಡವು 24 ಗಂಟೆಗಳ ಒಳಗೆ ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ. ಅನುಮೋದನೆಯ ನಂತರ ಸೇವೆಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಬಹುದು.'
              )}
            </Text>
            <Button
              title={t('Go to Provider Dashboard', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ')}
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
        title={t('Provider Registration', 'ಸೇವಾ ಪೂರೈಕೆದಾರರ ನೋಂದಣಿ')}
        subtitle={t('Plumber, Electrician, Carpenter & Technicians', 'ಟೆಕ್ನಿಷಿಯನ್ ಮತ್ತು ಸೇವಾ ನೋಂದಣಿ')}
        onBack={onBack || onLogin}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Logo size={46} />
            <Text style={styles.title}>{t('Register as a Service Provider', 'ಸೇವಾ ಪಾಲುದಾರರಾಗಿ ನೋಂದಾಯಿಸಿ')}</Text>
          </View>

          {/* Notice Banner */}
          <View style={styles.noticeBanner}>
            <ShieldCheck size={18} color={COLORS.brand} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.noticeText}>
              {t(
                'Notice: All service professionals must be verified by administrators before publishing services.',
                'ಗಮನಿಸಿ: ಸೇವೆಗಳನ್ನು ಪ್ರಕಟಿಸುವ ಮೊದಲು ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.'
              )}
            </Text>
          </View>

          {error ? <ErrorBanner message={error} onRetry={handleRegister} /> : null}

          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.sectionHeader}>{t('1. Personal & Business Details', '೧. ವೈಯಕ್ತಿಕ ವಿವರಗಳು')}</Text>

            <Input
              label={t('Full Name / Agency Name', 'ಪೂರ್ಣ ಹೆಸರು')}
              placeholder="e.g. Ramesh Badiger"
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
              placeholder="provider@example.com"
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

            <Text style={styles.sectionHeader}>{t('2. Service Expertise', '೨. ಸೇವಾ ಪರಿಣತಿ')}</Text>

            {/* Category selection */}
            <Text style={styles.fieldLabel}>{t('Primary Service Category', 'ಮುಖ್ಯ ಸೇವಾ ವರ್ಗ')}</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label={t('Experience', 'ಅನುಭವ')}
              placeholder="e.g. 5 years"
              value={experience}
              onChangeText={setExperience}
            />

            <Input
              label={t('Service Description', 'ಸೇವಾ ವಿವರಣೆ')}
              placeholder="Brief description of your work, tools and warranty"
              value={description}
              onChangeText={setDescription}
              textarea
            />

            <Text style={styles.sectionHeader}>{t('3. Workshop / Location', '೩. ಕಾರ್ಯಾಗಾರ / ಸ್ಥಳ')}</Text>

            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={() => detectLocation(true)}
              disabled={detectingLocation}
              activeOpacity={0.8}
            >
              <MapPin size={16} color={COLORS.brand} style={{ marginRight: 8 }} />
              <Text style={styles.gpsBtnText}>
                {detectingLocation ? 'Detecting GPS…' : 'Detect GPS Location'}
              </Text>
            </TouchableOpacity>

            {locationStatusText ? (
              <Text style={styles.locationStatus}>{locationStatusText}</Text>
            ) : null}

            <Input
              label={t('Address / Workshop', 'ವಿಳಾಸ')}
              placeholder="Shop No, Locality, Bagalkot"
              value={address}
              onChangeText={setAddress}
            />

            <Input
              label={t('City / Town', 'ನಗರ')}
              placeholder="Bagalkot"
              value={city}
              onChangeText={setCity}
            />

            <Text style={styles.sectionHeader}>{t('4. Document Verification', '೪. ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆ')}</Text>

            <DocumentUploader
              label={t('Profile / Workshop Photograph', 'ಫೋಟೋ')}
              description="Front facing photo (JPG, PNG)"
              acceptTypes="image"
              file={profileFile}
              onFileSelect={setProfileFile}
              uploadState={loading ? 'uploading' : profileFile ? 'selected' : 'idle'}
            />

            <DocumentUploader
              label={t('Government ID / Aadhaar Document', 'ಸರ್ಕಾರಿ ಗುರುತಿನ ಚೀಟಿ / ಆಧಾರ್')}
              description="Front & back or clear copy (PDF, JPG, PNG)"
              file={idFile}
              onFileSelect={setIdFile}
              required
              uploadState={loading ? 'uploading' : idFile ? 'selected' : 'idle'}
            />

            <DocumentUploader
              label={t('Address Proof / Utility Bill / Trade Licence', 'ವಿಳಾಸ ಪುರಾವೆ')}
              description="Electricity bill or Trade Licence (PDF, JPG, PNG)"
              file={addressFile}
              onFileSelect={setAddressFile}
              uploadState={loading ? 'uploading' : addressFile ? 'selected' : 'idle'}
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
                  'I consent to identity verification by NUK RentServe for customer safety and platform trust.',
                  'ಗ್ರಾಹಕರ ಸುರಕ್ಷತೆಗಾಗಿ ನನ್ನ ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆಗೆ ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.'
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
                {t('I accept NUK RentServe Service Provider', 'ನಾನು ಒಪ್ಪುತ್ತೇನೆ')}{' '}
                <Text style={styles.termsLink} onPress={onReadTerms}>
                  {t('Terms & Conditions', 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು')}
                </Text>
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Submit Provider Registration', 'ನೋಂದಣಿ ಸಲ್ಲಿಸಿ')}
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  catChipActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
  },
  catTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.paper,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    marginBottom: 8,
  },
  gpsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
  },
  locationStatus: {
    fontSize: 11,
    color: COLORS.ok,
    fontWeight: '700',
    marginBottom: 10,
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
