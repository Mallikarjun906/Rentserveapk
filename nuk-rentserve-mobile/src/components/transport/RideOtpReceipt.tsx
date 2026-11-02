// Ride Completion, Cash Receipt Acknowledgment & Rating Modal

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { formatINR } from '../../utils/formatters';
import { Button } from '../common/Button';
import { useLocalization } from '../../context/LocalizationContext';

interface RideOtpReceiptProps {
  fare: number;
  driverName: string;
  onComplete: (data: { paidInCash: boolean; rating: number; comment: string }) => void;
}

export const RideOtpReceipt: React.FC<RideOtpReceiptProps> = ({
  fare,
  driverName,
  onComplete,
}) => {
  const { t } = useLocalization();
  const [paidCash, setPaidCash] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!paidCash) {
      setError(
        t(
          'Please confirm cash payment',
          'ದಯವಿಟ್ಟು ಚಾಲಕರಿಗೆ ನಗದು ಪಾವತಿಸಿರುವುದನ್ನು ದೃಢೀಕರಿಸಿ'
        )
      );
      return;
    }
    setError('');
    onComplete({ paidInCash: paidCash, rating, comment });
  };

  return (
    <View style={styles.container}>
      {/* Checkmark Header */}
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>✓</Text>
      </View>
      <Text style={styles.title}>
        {t('rideCompleted', 'ಪ್ರಯಾಣ ಪೂರ್ಣಗೊಂಡಿದೆ')}
      </Text>
      <Text style={styles.sub}>
        {t('Driver', 'ಚಾಲಕರು')}: {driverName}
      </Text>

      {/* Fare Banner */}
      <View style={styles.fareBox}>
        <Text style={styles.fareLabel}>
          {t('Total Fare', 'ಒಟ್ಟು ದರ')}
        </Text>
        <Text style={styles.fareValue}>{formatINR(fare)}</Text>
        <Text style={styles.fareNotice}>
          {t(
            'cashPaymentNotice',
            'ದರವನ್ನು ಚಾಲಕರಿಗೆ ನೇರವಾಗಿ ನಗದು ಅಥವಾ UPI ಮೂಲಕ ಪಾವತಿಸಿ'
          )}
        </Text>
      </View>

      {/* Cash Paid Confirmation Checkbox */}
      <TouchableOpacity
        style={[styles.checkRow, paidCash && styles.checkRowActive]}
        onPress={() => setPaidCash(!paidCash)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, paidCash && styles.checkboxActive]}>
          {paidCash && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={styles.checkText}>
          {t(
            `I paid ${formatINR(fare)} directly to ${driverName}`,
            `ನಾನು ${formatINR(fare)} ಹಣವನ್ನು ಚಾಲಕರಿಗೆ ನೇರವಾಗಿ ಪಾವತಿಸಿದ್ದೇನೆ`
          )}
        </Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* 5-Star Rating Selector */}
      <Text style={styles.rateTitle}>
        {t('rateRide', 'ನಿಮ್ಮ ಅನುಭವಕ್ಕೆ ರೇಟಿಂಗ್ ನೀಡಿ')}
      </Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starBtn}
          >
            <Text style={[styles.starIcon, rating >= star && styles.starActive]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback Comment Input */}
      <TextInput
        style={styles.commentInput}
        placeholder={t(
          'Leave a polite review (optional)...',
          'ಅಭಿಪ್ರಾಯ ಬರೆಯಿರಿ (ಐಚ್ಛಿಕ)...'
        )}
        placeholderTextColor={COLORS.muteLight}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={2}
      />

      {/* Submit Button */}
      <Button
        title={t('done', 'ಮುಗಿಯಿತು')}
        onPress={handleSubmit}
        variant="primary"
        size="lg"
        fullWidth
        style={styles.submitBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.okTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.ok,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: COLORS.mute,
    marginTop: 2,
    marginBottom: 16,
  },
  fareBox: {
    width: '100%',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  fareLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mute,
  },
  fareValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.ink,
    marginVertical: 4,
  },
  fareNotice: {
    fontSize: 12,
    color: COLORS.mute,
    textAlign: 'center',
    lineHeight: 16,
  },
  checkRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    marginBottom: 12,
  },
  checkRowActive: {
    borderColor: COLORS.ok,
    backgroundColor: COLORS.okTint,
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
  },
  checkboxActive: {
    backgroundColor: COLORS.ok,
    borderColor: COLORS.ok,
  },
  checkMark: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 14,
  },
  checkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 18,
  },
  error: {
    fontSize: 12,
    color: COLORS.bad,
    fontWeight: '600',
    marginBottom: 10,
  },
  rateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 4,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starBtn: {
    padding: 4,
  },
  starIcon: {
    fontSize: 32,
    color: '#D6D6D6',
  },
  starActive: {
    color: '#F59E0B',
  },
  commentInput: {
    width: '100%',
    minHeight: 56,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 13,
    color: COLORS.ink,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    marginTop: 4,
  },
});
