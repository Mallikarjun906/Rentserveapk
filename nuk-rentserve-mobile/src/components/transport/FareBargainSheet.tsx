// Auto Fare Bargaining and Counter-Offer Sheet

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { formatINR } from '../../utils/formatters';
import { Button } from '../common/Button';
import { useLocalization } from '../../context/LocalizationContext';

interface FareBargainSheetProps {
  suggestedFare: number;
  offeredFare: number;
  onAdjust: (delta: number) => void;
  onRequest: () => void;
  loading?: boolean;
}

export const FareBargainSheet: React.FC<FareBargainSheetProps> = ({
  suggestedFare,
  offeredFare,
  onAdjust,
  onRequest,
  loading = false,
}) => {
  const { t } = useLocalization();

  return (
    <View style={styles.container}>
      {/* Suggested Fare Label */}
      <View style={styles.suggestedRow}>
        <Text style={styles.label}>
          {t('suggestedFare', 'ಸೂಚಿಸಿದ ದರ')}:
        </Text>
        <Text style={styles.suggestedValue}>
          {formatINR(suggestedFare)}
        </Text>
      </View>

      {/* Interactive Bargain Counter */}
      <View style={styles.counterRow}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onAdjust(-5)}
          disabled={offeredFare <= 30}
          accessibilityLabel="Decrease fare offer by 5 rupees"
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>

        <View style={styles.offerBox}>
          <Text style={styles.offerLabel}>
            {t('yourOffer', 'ನಿಮ್ಮ ದರದ ಪ್ರಸ್ತಾಪ')}
          </Text>
          <Text style={styles.offerValue}>
            {formatINR(offeredFare)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onAdjust(5)}
          accessibilityLabel="Increase fare offer by 5 rupees"
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {t(
          'bargainHint',
          'ಚಾಲಕರು ಬೇಗ ಒಪ್ಪಿಕೊಳ್ಳಲು ₹5 ಹಂತಗಳಲ್ಲಿ ದರ ಹೊಂದಿಸಿ'
        )}
      </Text>

      {/* CTA Button */}
      <Button
        title={t('requestAuto', 'ಈಗಲೇ ಆಟೋ ಬುಕ್ ಮಾಡಿ')}
        onPress={onRequest}
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  suggestedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 14,
    color: COLORS.mute,
    fontWeight: '600',
  },
  suggestedValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paper,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 12,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 28,
  },
  offerBox: {
    alignItems: 'center',
  },
  offerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mute,
    marginBottom: 2,
  },
  offerValue: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.brand,
  },
  hint: {
    fontSize: 12,
    color: COLORS.mute,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 16,
  },
});
