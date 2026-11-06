// Ride Completion, Cash Receipt Acknowledgment & Rating Modal

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { CheckCircle2, Check, Star } from 'lucide-react-native';
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
        <CheckCircle2 size={36} color={COLORS.ok} />
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
          {paidCash && <Check size={14} color={COLORS.white} strokeWidth={3} />}
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
            accessibilityLabel={`Rate ${star} stars`}
            activeOpacity={0.8}
          >
            <Star
              size={24}
              color={star <= rating ? '#F59E0B' : COLORS.muteLight}
              fill={star <= rating ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Optional Feedback Input */}
      <TextInput
        style={styles.commentInput}
        placeholder={t(
          'Feedback for driver (optional)',
          'ಚಾಲಕರ ಬಗ್ಗೆ ಅಭಿಪ್ರಾಯ (ಐಚ್ಛಿಕ)'
        )}
        placeholderTextColor={COLORS.mute}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={2}
      />

      <Button
        title={t('Done & Close', 'ಪೂರ್ಣಗೊಳಿಸಿ')}
        onPress={handleSubmit}
        variant="primary"
        size="lg"
        fullWidth
        style={styles.doneBtn}
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
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },
  sub: {
    fontSize: 13,
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
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
  },
  fareLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
  },
  fareValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.brand,
    marginVertical: 4,
  },
  fareNotice: {
    fontSize: 11,
    color: COLORS.mute,
    textAlign: 'center',
  },
  checkRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 10,
  },
  checkRowActive: {
    borderColor: COLORS.ok,
    backgroundColor: COLORS.okTint,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
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
  checkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  error: {
    fontSize: 11,
    color: COLORS.crimson,
    fontWeight: '600',
    marginBottom: 8,
  },
  rateTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 8,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  starBtn: {
    padding: 4,
  },
  commentInput: {
    width: '100%',
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 13,
    color: COLORS.ink,
    marginBottom: 16,
  },
  doneBtn: {
    marginTop: 4,
  },
});
