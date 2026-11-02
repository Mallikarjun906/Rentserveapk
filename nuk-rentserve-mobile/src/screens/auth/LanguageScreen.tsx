// Language Selection Screen (English vs ಕನ್ನಡ)

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { useLocalization } from '../../context/LocalizationContext';

interface LanguageScreenProps {
  onContinue: () => void;
}

export const LanguageScreen: React.FC<LanguageScreenProps> = ({ onContinue }) => {
  const { language, setLanguage, t } = useLocalization();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Brand Header */}
        <View style={styles.header}>
          <Logo size={56} />
          <Text style={styles.title}>
            {language === 'kn' ? 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Choose Your Language'}
          </Text>
          <Text style={styles.sub}>
            {language === 'kn'
              ? 'ಆ್ಯಪ್ ಬಳಸಲು ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆರಿಸಿ'
              : 'Select your preferred language to continue'}
          </Text>
        </View>

        {/* Language Options */}
        <View style={styles.optionsCol}>
          {/* Kannada Option */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setLanguage('kn')}
            style={[
              styles.optionCard,
              SHADOWS.card,
              language === 'kn' && styles.optionCardSelected,
            ]}
          >
            <View style={styles.cardLeft}>
              <View
                style={[
                  styles.radio,
                  language === 'kn' && styles.radioSelected,
                ]}
              >
                {language === 'kn' && <View style={styles.radioDot} />}
              </View>
              <View>
                <Text style={styles.langName}>ಕನ್ನಡ</Text>
                <Text style={styles.langSub}>Kannada (ಕರ್ನಾಟಕ)</Text>
              </View>
            </View>
            <Text style={styles.previewTag}>ನಮಸ್ಕಾರ</Text>
          </TouchableOpacity>

          {/* English Option */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setLanguage('en')}
            style={[
              styles.optionCard,
              SHADOWS.card,
              language === 'en' && styles.optionCardSelected,
            ]}
          >
            <View style={styles.cardLeft}>
              <View
                style={[
                  styles.radio,
                  language === 'en' && styles.radioSelected,
                ]}
              >
                {language === 'en' && <View style={styles.radioDot} />}
              </View>
              <View>
                <Text style={styles.langName}>English</Text>
                <Text style={styles.langSub}>English (India)</Text>
              </View>
            </View>
            <Text style={styles.previewTag}>Hello</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <View style={styles.bottomBar}>
          <Button
            title={t('continue', 'ಮುಂದುವರಿಯಿರಿ')}
            onPress={onContinue}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 18,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: COLORS.mute,
    marginTop: 6,
    textAlign: 'center',
  },
  optionsCol: {
    gap: 16,
    marginVertical: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    padding: 18,
  },
  optionCardSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brandTint,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.muteLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioSelected: {
    borderColor: COLORS.brand,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.brand,
  },
  langName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
  },
  langSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 2,
  },
  previewTag: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brand,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  bottomBar: {
    marginBottom: 10,
  },
});
