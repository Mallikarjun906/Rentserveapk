// Driver Document Verification & Onboarding 5-Step Stepper

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Clock,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Check,
  Car,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DocumentUploader } from '../../components/common/DocumentUploader';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';

interface DriverOnboardingScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const DriverOnboardingScreen: React.FC<DriverOnboardingScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { t } = useLocalization();
  const { user } = useAuth();

  const [step, setStep] = useState(0);

  // Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.location || 'Bagalkot');

  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceCategory, setLicenceCategory] = useState('Auto rickshaw (3W)');
  const [licenceValidUntil, setLicenceValidUntil] = useState('');

  const [vehicleModel, setVehicleModel] = useState('');
  const [regNumber, setRegNumber] = useState('');

  const [dlFile, setDlFile] = useState<any>(null);
  const [rcFile, setRcFile] = useState<any>(null);

  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const stepsList = ['Personal', 'Licence', 'Vehicle', 'Documents', 'Consent'];

  const handleNext = async () => {
    if (step < stepsList.length - 1) {
      if (step === 0 && !fullName.trim()) {
        Alert.alert('Required', 'Please enter your full name as on your driving licence.');
        return;
      }
      if (step === 1 && !licenceNumber.trim()) {
        Alert.alert('Required', 'Please enter your commercial driving licence number.');
        return;
      }
      if (step === 2 && !regNumber.trim()) {
        Alert.alert('Required', 'Please enter your vehicle registration plate number.');
        return;
      }
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('name', fullName.trim());
        formData.append('drivingLicenceNumber', licenceNumber.trim().toUpperCase());
        formData.append('vehicleRegistrationNumber', regNumber.trim().toUpperCase());
        formData.append('vehicleModel', vehicleModel.trim());
        if (dlFile) {
          formData.append('drivingLicenceDocument', {
            uri: dlFile.uri,
            name: dlFile.name || 'driving_licence.jpg',
            type: dlFile.mimeType || 'image/jpeg',
          } as any);
        }
        if (rcFile) {
          formData.append('vehicleRcDocument', {
            uri: rcFile.uri,
            name: rcFile.name || 'vehicle_rc.jpg',
            type: rcFile.mimeType || 'image/jpeg',
          } as any);
        }
        await authApi.updateMe(formData);
        setIsSubmitted(true);
      } catch (err: any) {
        Alert.alert('Submission Error', err.message || 'Could not submit driver application.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Clock size={40} color={COLORS.brand} />
          </View>
          <Badge tone="sun" label="Pending Verification" />
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSub}>
            Our verification desk in Bagalkot will verify your Driving Licence and RC. You will be able to receive rides once approved.
          </Text>
          <Button
            title="Open Driver Workspace"
            onPress={onSuccess}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.doneBtn}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={t('Driver Registration', 'ಚಾಲಕರ ನೋಂದಣಿ')}
        subtitle={`Step ${step + 1} of 5: ${stepsList[step]}`}
        onBack={step > 0 ? () => setStep(step - 1) : onBack}
      />

      {/* Stepper Progress Bar */}
      <View style={styles.stepperBar}>
        {stepsList.map((s, idx) => (
          <View
            key={s}
            style={[
              styles.stepIndicator,
              idx <= step && styles.stepIndicatorActive,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.sectionTitle}>1. Personal Information</Text>
            <Input
              label="Full Name (as on licence)"
              placeholder="e.g. Basavaraj Patil"
              value={fullName}
              onChangeText={setFullName}
            />
            <Input
              label="Mobile Number"
              prefix="+91"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input
              label="Operating City"
              placeholder="e.g. Bagalkot"
              value={city}
              onChangeText={setCity}
            />
          </View>
        )}

        {/* Step 1: Driving Licence */}
        {step === 1 && (
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.sectionTitle}>2. Driving Licence Details</Text>
            <Input
              label="Licence Number"
              placeholder="e.g. KA29 20240012345"
              value={licenceNumber}
              onChangeText={setLicenceNumber}
              autoCapitalize="characters"
            />
            <Input
              label="Licence Category"
              placeholder="e.g. Auto rickshaw (3W) or LMV"
              value={licenceCategory}
              onChangeText={setLicenceCategory}
            />
            <Input
              label="Valid Until Date"
              placeholder="YYYY-MM-DD"
              value={licenceValidUntil}
              onChangeText={setLicenceValidUntil}
            />
          </View>
        )}

        {/* Step 2: Vehicle Information */}
        {step === 2 && (
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.sectionTitle}>3. Vehicle Information</Text>
            <Input
              label="Vehicle Model"
              placeholder="e.g. Bajaj RE Compact 4S"
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
            <Input
              label="Registration Plate Number"
              placeholder="e.g. KA 29 AB 1234"
              value={regNumber}
              onChangeText={setRegNumber}
              autoCapitalize="characters"
            />
          </View>
        )}

        {/* Step 3: Document Uploads */}
        {step === 3 && (
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.sectionTitle}>4. Verification Documents</Text>
            <Text style={styles.docHint}>
              Documents are reviewed by NUK verification staff only and never shown to customers.
            </Text>

            <DocumentUploader
              label="Commercial Driving Licence (DL)"
              hint="Clear photo or PDF copy showing name and validity"
              file={dlFile}
              onFileChange={setDlFile}
              required
            />

            <View style={{ height: 14 }} />

            <DocumentUploader
              label="Vehicle Registration Certificate (RC)"
              hint="Document showing vehicle owner and registration number"
              file={rcFile}
              onFileChange={setRcFile}
              required
            />
          </View>
        )}

        {/* Step 4: Consent & Terms */}
        {step === 4 && (
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.sectionTitle}>5. Driver Agreement & Consent</Text>
            <Text style={styles.consentBody}>
              I declare that I hold a valid commercial driving licence, and my vehicle has valid RC, insurance, and fitness papers. I agree to share my live GPS location while on an active booking and collect fares directly in cash/UPI without demanding extra charges.
            </Text>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setConsent(!consent)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, consent && styles.checkboxActive]}>
                {consent && <Check size={14} color={COLORS.white} strokeWidth={3} />}
              </View>
              <Text style={styles.checkText}>
                I accept the Driver Agreement (Kannada & English) and consent to identity verification.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Next / Submit Button */}
        <Button
          title={step === 4 ? 'Submit Application' : 'Save & Continue →'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
          disabled={step === 4 && !consent}
          loading={isSubmitting}
          style={styles.nextBtn}
        />

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  stepperBar: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: COLORS.line,
  },
  stepIndicator: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  stepIndicatorActive: {
    backgroundColor: COLORS.brand,
  },
  scroll: {
    padding: 16,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 14,
  },
  docHint: {
    fontSize: 12,
    color: COLORS.mute,
    lineHeight: 16,
    marginBottom: 14,
  },
  consentBody: {
    fontSize: 13,
    color: COLORS.ink,
    lineHeight: 20,
    marginBottom: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.muteLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  checkText: {
    fontSize: 12,
    color: COLORS.ink,
    lineHeight: 18,
    flex: 1,
  },
  nextBtn: {
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 14,
  },
  successSub: {
    fontSize: 14,
    color: COLORS.mute,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  doneBtn: {
    marginTop: 10,
  },
});
