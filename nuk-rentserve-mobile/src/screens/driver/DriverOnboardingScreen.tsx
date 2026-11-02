// Driver Document Verification & Onboarding 5-Step Stepper

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useLocalization } from '../../context/LocalizationContext';

interface DriverOnboardingScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const DriverOnboardingScreen: React.FC<DriverOnboardingScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { t } = useLocalization();

  const [step, setStep] = useState(0);

  // Form State
  const [fullName, setFullName] = useState('Manjunath Kamble');
  const [phone, setPhone] = useState('9845012345');
  const [city, setCity] = useState('Bagalkot');

  const [licenceNumber, setLicenceNumber] = useState('KA29 20240012345');
  const [licenceCategory, setLicenceCategory] = useState('Auto rickshaw (3W)');
  const [licenceValidUntil, setLicenceValidUntil] = useState('2030-05-14');

  const [vehicleModel, setVehicleModel] = useState('Bajaj RE Compact (CNG)');
  const [regNumber, setRegNumber] = useState('KA 29 AB 4821');

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({
    'Driving licence': true,
    'Registration Certificate (RC)': true,
    'Insurance Policy': true,
  });

  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const stepsList = ['Personal', 'Licence', 'Vehicle', 'Documents', 'Consent'];

  const handleNext = () => {
    if (step < stepsList.length - 1) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
      }, 1200);
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>⏳</Text>
          </View>
          <Badge tone="warn" label="Pending Verification" />
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSub}>
            Our verification desk in Bagalkot will verify your Driving Licence and RC within 24 hours. You can start receiving rides once approved.
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
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
              value={licenceCategory}
              onChangeText={setLicenceCategory}
            />
            <Input
              label="Valid Until Date"
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
              placeholder="Bajaj RE Compact"
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
            <Input
              label="Registration Plate Number"
              placeholder="KA 29 AB 1234"
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
              🔒 Documents are reviewed by NUK verification staff only and never shown to customers.
            </Text>

            {[
              'Driving licence',
              'Registration Certificate (RC)',
              'Insurance Policy',
              'Fitness & Pollution (PUC)',
            ].map((docName) => {
              const isDone = uploadedDocs[docName];
              return (
                <View key={docName} style={styles.docRow}>
                  <View style={styles.docLeft}>
                    <Text style={styles.docIcon}>📄</Text>
                    <Text style={styles.docName}>{docName}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.uploadBtn, isDone && styles.uploadedBtn]}
                    onPress={() =>
                      setUploadedDocs((prev) => ({
                        ...prev,
                        [docName]: !prev[docName],
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.uploadBtnText,
                        isDone && styles.uploadedBtnText,
                      ]}
                    >
                      {isDone ? '✓ Uploaded' : 'Upload +'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
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
                {consent && <Text style={styles.checkMark}>✓</Text>}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
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
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paper,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 10,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  uploadBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  uploadedBtn: {
    backgroundColor: COLORS.okTint,
    borderColor: COLORS.ok,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
  uploadedBtnText: {
    color: COLORS.ok,
  },
  consentBody: {
    fontSize: 13,
    color: COLORS.ink,
    lineHeight: 18,
    marginBottom: 14,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.paper,
    padding: 12,
    borderRadius: RADIUS.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.muteLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  checkMark: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 14,
  },
  checkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
    lineHeight: 16,
  },
  nextBtn: {
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.warnTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 12,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: COLORS.mute,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  doneBtn: {
    marginTop: 10,
  },
});
