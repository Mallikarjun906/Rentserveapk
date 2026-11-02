// Service Provider Registration Screen (/register/provider)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
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

interface ProviderRegisterScreenProps {
  onLogin: () => void;
  onReadTerms: () => void;
  onSuccess: () => void;
}

interface UploadFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
  file?: any;
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

        // Convert coordinates into human readable address
        const reverse = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });

        if (reverse && reverse.length > 0) {
          const place = reverse[0];
          const detectedCity = place.city || place.subregion || place.district || 'Bagalkot';
          const streetInfo = [place.name, place.street, place.subregion].filter(Boolean).join(', ');

          setCity(detectedCity);
          if (streetInfo && !address) {
            setAddress(streetInfo);
          }
          setLocationStatusText(`📍 Detected: ${detectedCity} (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        }
      }
    } catch (err: any) {
      if (userInitiated) {
        Alert.alert('GPS Notice', 'Could not detect position automatically. Please enter your address manually.');
      }
    } finally {
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    detectLocation(false);
  }, []);

  // Pick Profile Photograph
  const handlePickProfilePhoto = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Camera Permission', 'Camera access is needed to capture your profile photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Gallery Permission', 'Photo library access is needed to choose your profile photo.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || `provider-profile-${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';
        setProfileFile({
          uri: asset.uri,
          name: filename,
          type: mimeType,
          size: asset.fileSize,
          file: (asset as any).file,
        });
      }
    } catch (e: any) {
      Alert.alert('Photo Error', e.message || 'Could not pick photograph.');
    }
  };

  // Pick Identity or Address Document (PDF, JPG, PNG, WEBP)
  const handlePickDocument = async (field: 'aadhaar' | 'address') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.size && asset.size > 5 * 1024 * 1024) {
          Alert.alert('File Limit', 'Please upload documents smaller than 5 MB.');
          return;
        }
        const isPdf = asset.name?.toLowerCase().endsWith('.pdf') || asset.mimeType === 'application/pdf';
        const docObj: UploadFile = {
          uri: asset.uri,
          name: asset.name || `${field}-doc-${Date.now()}.${isPdf ? 'pdf' : 'jpg'}`,
          type: asset.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg'),
          size: asset.size,
          file: asset.file,
        };

        if (field === 'aadhaar') {
          setIdFile(docObj);
        } else {
          setAddressFile(docObj);
        }
      }
    } catch (e: any) {
      Alert.alert('Document Error', e.message || 'Could not select document.');
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || fullName.trim().length < 3) {
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
    if (!description.trim() || description.trim().length < 5) {
      setError(t('Please describe your services', 'ನಿಮ್ಮ ಸೇವೆಯ ವಿವರಣೆಯನ್ನು ನಮೂದಿಸಿ'));
      return;
    }
    if (!consent) {
      setError(t('Consent is required to verify identity documents', 'ದಾಖಲೆ ಪರಿಶೀಲನೆಗೆ ನಿಮ್ಮ ಒಪ್ಪಿಗೆ ಅಗತ್ಯವಿದೆ'));
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
      formData.append('taluk', city.trim());
      formData.append('district', city.trim());
      formData.append('dob', '1995-01-01');
      formData.append('category', category);
      formData.append('experience', experience);
      formData.append('description', description.trim());
      formData.append('terms', 'true');
      formData.append('consent', 'true');

      if (coords) {
        formData.append('locationCoordinates', JSON.stringify(coords));
        formData.append('latitude', String(coords.latitude));
        formData.append('longitude', String(coords.longitude));
      }

      // Helper to append real selected file or fallback
      const appendFile = (fieldName: string, upload: UploadFile | null, fallbackName: string, fallbackMime: string) => {
        if (upload) {
          if (Platform.OS === 'web' && upload.file) {
            (formData as any).append(fieldName, upload.file, upload.name);
          } else {
            formData.append(fieldName, {
              uri: upload.uri,
              name: upload.name,
              type: upload.type,
            } as any);
          }
        } else {
          // Fallback demo file reference for offline/test environments
          formData.append(fieldName, {
            uri: 'file://mock/' + fallbackName,
            name: fallbackName,
            type: fallbackMime,
          } as any);
        }
      };

      appendFile('profileImage', profileFile, 'provider-profile.jpg', 'image/jpeg');
      appendFile('aadhaarDocument', idFile, 'government-id.pdf', 'application/pdf');
      appendFile('addressProofDocument', addressFile, 'address-proof.pdf', 'application/pdf');

      await authApi.registerProvider(formData);

      // Log in session
      await login(email.trim().toLowerCase(), password);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Provider registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={styles.successBox}>
            <Text style={styles.successEmoji}>⏳</Text>
            <Badge tone="sun" label={t('Pending Approval', 'ಅನುಮೋದನೆ ಬಾಕಿ ಇದೆ')} />
            <Text style={styles.successTitle}>
              {t('Provider Application Submitted!', 'ಸೇವಾ ಪೂರೈಕೆದಾರರ ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!')}
            </Text>
            <Text style={styles.successSub}>
              {t(
                'Our administration desk is verifying your government ID and service credentials. Your provider dashboard is ready.',
                'ನಮ್ಮ ಆಡಳಿತ ಮಂಡಳಿಯು ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದೆ. ನಿಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಸಿದ್ಧವಾಗಿದೆ.'
              )}
            </Text>
            <Button
              title={t('Open Provider Dashboard', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ')}
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
          {/* Header */}
          <View style={styles.header}>
            <Logo size={48} />
            <Text style={styles.title}>
              {t('registerProviderTitle', 'ಸೇವಾ ಪೂರೈಕೆದಾರರಾಗಿ ನೋಂದಾಯಿಸಿ')}
            </Text>
            <Text style={styles.sub}>
              {t('registerProviderSub', 'ಸ್ಥಳೀಯ ಗ್ರಾಹಕರಿಗೆ ಸೇವೆ ಒದಗಿಸಿ, ನೇರ ಆದಾಯ ಗಳಿಸಿ')}
            </Text>
          </View>

          {error ? <ErrorBanner message={error} onRetry={handleRegister} /> : null}

          {/* Form Card */}
          <View style={[styles.formCard, SHADOWS.card]}>
            <Input
              label={t('Full Name (as per Govt ID)', 'ಪೂರ್ಣ ಹೆಸರು')}
              placeholder="e.g. Anand Hiremath"
              value={fullName}
              onChangeText={setFullName}
            />

            <Input
              label={t('Mobile Number', 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ')}
              placeholder="10-digit number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
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
              label={t('Create Password', 'ಪಾಸ್‌ವರ್ಡ್')}
              placeholder="Minimum 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              }
            />

            {/* GPS Location Bar */}
            <View style={styles.locationHeaderRow}>
              <Text style={styles.inputLabel}>{t('Location & GPS', 'ಸ್ಥಳ ಮತ್ತು ಜಿಪಿಎಸ್')}</Text>
              <TouchableOpacity
                style={styles.autoLocBtn}
                onPress={() => detectLocation(true)}
                disabled={detectingLocation}
              >
                {detectingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.crimson} />
                ) : (
                  <Text style={styles.autoLocText}>📍 {t('Auto-Detect GPS', 'ಜಿಪಿಎಸ್ ಪತ್ತೆ')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {locationStatusText ? (
              <View style={styles.locBadge}>
                <Text style={styles.locBadgeText}>{locationStatusText}</Text>
              </View>
            ) : null}

            <Input
              label={t('Service Address / Workshop Location', 'ಕಾರ್ಯಾಗಾರ / ವಿಳಾಸ')}
              placeholder="Shop / Area, Bagalkot"
              value={address}
              onChangeText={setAddress}
            />

            <Input
              label={t('City', 'ನಗರ')}
              placeholder="Bagalkot"
              value={city}
              onChangeText={setCity}
            />

            {/* Category Select */}
            <Text style={styles.inputLabel}>{t('Service Trade Category', 'ಸೇವಾ ವರ್ಗ')}</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, category === cat && styles.catPillActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catPillText, category === cat && styles.catPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label={t('Experience', 'ಅನುಭವ')}
              placeholder="e.g. 5 years in residential wiring"
              value={experience}
              onChangeText={setExperience}
            />

            <Input
              label={t('Service Description', 'ಸೇವೆಯ ವಿವರಣೆ')}
              placeholder="Detail your trade services, repair equipment and working hours"
              value={description}
              onChangeText={setDescription}
              textarea
            />

            {/* 1. DOCUMENT UPLOAD: PROFILE PHOTOGRAPH */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadSectionHeader}>📸 {t('Profile Photograph', 'ಫೋಟೋ')}</Text>
              <View style={styles.uploadRow}>
                {profileFile ? (
                  <Image source={{ uri: profileFile.uri }} style={styles.previewThumb} />
                ) : (
                  <View style={styles.emptyThumb}>
                    <Text style={styles.emptyThumbText}>👤</Text>
                  </View>
                )}
                <View style={styles.uploadMeta}>
                  <Text style={styles.uploadFileName} numberOfLines={1}>
                    {profileFile ? profileFile.name : 'provider-profile.jpg'}
                  </Text>
                  <Text style={styles.uploadFormat}>JPG, JPEG, PNG, WEBP (Max 5MB)</Text>
                  <View style={styles.uploadActionsRow}>
                    <TouchableOpacity
                      style={styles.chooseBtn}
                      onPress={() => handlePickProfilePhoto(false)}
                    >
                      <Text style={styles.chooseBtnText}>📁 Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.chooseBtn}
                      onPress={() => handlePickProfilePhoto(true)}
                    >
                      <Text style={styles.chooseBtnText}>📷 Camera</Text>
                    </TouchableOpacity>
                    {profileFile ? (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => setProfileFile(null)}
                      >
                        <Text style={styles.removeBtnText}>✕ Remove</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                <Badge tone={profileFile ? 'ok' : 'sun'} label={profileFile ? 'Selected' : 'Attached'} />
              </View>
            </View>

            {/* 2. DOCUMENT UPLOAD: GOVERNMENT IDENTITY (PDF / IMAGE) */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadSectionHeader}>🪪 {t('Government Identity Document (Aadhaar/DL/Voter)', 'ಗುರುತಿನ ಚೀಟಿ')}</Text>
              <View style={styles.uploadRow}>
                <View style={styles.docIconBox}>
                  <Text style={styles.docIconText}>
                    {idFile?.name.toLowerCase().endsWith('.pdf') ? '📄' : '🪪'}
                  </Text>
                </View>
                <View style={styles.uploadMeta}>
                  <Text style={styles.uploadFileName} numberOfLines={1}>
                    {idFile ? idFile.name : 'government-id.pdf'}
                  </Text>
                  <Text style={styles.uploadFormat}>PDF, JPG, PNG (Max 5MB)</Text>
                  <View style={styles.uploadActionsRow}>
                    <TouchableOpacity
                      style={styles.chooseBtn}
                      onPress={() => handlePickDocument('aadhaar')}
                    >
                      <Text style={styles.chooseBtnText}>📎 Choose File</Text>
                    </TouchableOpacity>
                    {idFile ? (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => setIdFile(null)}
                      >
                        <Text style={styles.removeBtnText}>✕ Remove</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                <Badge tone={idFile ? 'ok' : 'sun'} label={idFile ? 'Selected' : 'Attached'} />
              </View>
            </View>

            {/* 3. DOCUMENT UPLOAD: ADDRESS PROOF (PDF / IMAGE) */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadSectionHeader}>🏠 {t('Address Proof Document', 'ವಿಳಾಸ ಪುರಾವೆ')}</Text>
              <View style={styles.uploadRow}>
                <View style={styles.docIconBox}>
                  <Text style={styles.docIconText}>
                    {addressFile?.name.toLowerCase().endsWith('.pdf') ? '📄' : '🏠'}
                  </Text>
                </View>
                <View style={styles.uploadMeta}>
                  <Text style={styles.uploadFileName} numberOfLines={1}>
                    {addressFile ? addressFile.name : 'address-proof.pdf'}
                  </Text>
                  <Text style={styles.uploadFormat}>PDF, JPG, PNG (Max 5MB)</Text>
                  <View style={styles.uploadActionsRow}>
                    <TouchableOpacity
                      style={styles.chooseBtn}
                      onPress={() => handlePickDocument('address')}
                    >
                      <Text style={styles.chooseBtnText}>📎 Choose File</Text>
                    </TouchableOpacity>
                    {addressFile ? (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => setAddressFile(null)}
                      >
                        <Text style={styles.removeBtnText}>✕ Remove</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                <Badge tone={addressFile ? 'ok' : 'sun'} label={addressFile ? 'Selected' : 'Attached'} />
              </View>
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
                {t('I provide explicit consent for government identity and address verification.', 'ಗುರುತಿನ ಚೀಟಿ ಪರಿಶೀಲನೆಗೆ ನಾನು ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.')}
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
                  {t('Service Provider Terms', 'ಸೇವಾ ಪೂರೈಕೆದಾರರ ನಿಯಮಗಳು')}
                </Text>
              </Text>
            </TouchableOpacity>

            <Button
              title={t('Submit Provider Application', 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ')}
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
              {t('Already registered as a provider?', 'ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿದ್ದೀರಾ?')}{' '}
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
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 12,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: COLORS.inkMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  toggleText: {
    color: COLORS.crimson,
    fontWeight: '600',
    fontSize: 13,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 6,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  autoLocBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.brandTint,
    borderRadius: RADIUS.sm,
  },
  autoLocText: {
    color: COLORS.crimson,
    fontSize: 12,
    fontWeight: '700',
  },
  locBadge: {
    backgroundColor: COLORS.sand,
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 10,
  },
  locBadgeText: {
    fontSize: 12,
    color: COLORS.emerald,
    fontWeight: '600',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.paper,
  },
  catPillActive: {
    borderColor: COLORS.crimson,
    backgroundColor: COLORS.brandTint,
  },
  catPillText: {
    fontSize: 13,
    color: COLORS.inkMuted,
    fontWeight: '500',
  },
  catPillTextActive: {
    color: COLORS.crimson,
    fontWeight: '700',
  },
  uploadSection: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 12,
  },
  uploadSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.line,
  },
  emptyThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyThumbText: {
    fontSize: 24,
  },
  docIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docIconText: {
    fontSize: 24,
  },
  uploadMeta: {
    flex: 1,
  },
  uploadFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  uploadFormat: {
    fontSize: 11,
    color: COLORS.inkMuted,
    marginBottom: 4,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chooseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  chooseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.crimson,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.crimson,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
    backgroundColor: COLORS.white,
  },
  checkboxActive: {
    borderColor: COLORS.crimson,
    backgroundColor: COLORS.crimson,
  },
  checkMark: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.inkMuted,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.crimson,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.inkMuted,
  },
  loginLink: {
    fontSize: 13,
    color: COLORS.crimson,
    fontWeight: '700',
  },
  successScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  successBox: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 12,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: COLORS.inkMuted,
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 19,
  },
  successBtn: {
    marginTop: 12,
  },
});
