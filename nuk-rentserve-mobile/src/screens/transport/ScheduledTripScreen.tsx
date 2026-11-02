// Scheduled Transport Booking Screen (Passenger Car Trips & Goods Van Freight)

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { formatINR } from '../../utils/formatters';
import { calculateCarTripFare, calculateGoodsVanFare } from '../../utils/fareCalculator';
import { useLocalization } from '../../context/LocalizationContext';

interface ScheduledTripScreenProps {
  initialKind?: 'car' | 'van';
  onBack: () => void;
  onSuccess: (bookingRef: string) => void;
}

export const ScheduledTripScreen: React.FC<ScheduledTripScreenProps> = ({
  initialKind = 'car',
  onBack,
  onSuccess,
}) => {
  const { t } = useLocalization();

  const [kind, setKind] = useState<'car' | 'van'>(initialKind);
  const isCar = kind === 'car';

  // Form State
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('Tomorrow');
  const [travelTime, setTravelTime] = useState('08:00 AM');

  // Car specific
  const [carTripType, setCarTripType] = useState<
    'One-day trip' | 'Outstation one-way' | 'Round trip' | 'Airport / station drop'
  >('One-day trip');
  const [passengers, setPassengers] = useState(2);

  // Goods van specific
  const [vanSize, setVanSize] = useState<'Mini van' | 'Pickup truck' | 'Large truck'>('Mini van');
  const [goodsType, setGoodsType] = useState('Household furniture');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fare calculation
  const fare = isCar
    ? calculateCarTripFare(carTripType, passengers)
    : calculateGoodsVanFare(vanSize);

  const handleSubmit = async () => {
    if (!pickup.trim()) {
      setError(t('Enter pickup location', 'ಪಿಕಪ್ ಸ್ಥಳ ನಮೂದಿಸಿ'));
      return;
    }
    if (!destination.trim()) {
      setError(t('Enter destination location', 'ತಲುಪಬೇಕಾದ ಸ್ಥಳ ನಮೂದಿಸಿ'));
      return;
    }

    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const ref = (isCar ? 'CT-' : 'GV-') + Math.floor(1000 + Math.random() * 9000);
      onSuccess(ref);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={isCar ? t('carTripTitle', 'ಕಾರು ಪ್ರಯಾಣ ಬುಕಿಂಗ್') : t('goodsVanTitle', 'ಗೂಡ್ಸ್ ವ್ಯಾನ್ ಬುಕಿಂಗ್')}
        subtitle="Schedule ahead with confirmed package fare"
        onBack={onBack}
      />

      {/* Kind Toggle (Car vs Goods Van) */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, isCar && styles.toggleBtnActive]}
          onPress={() => setKind('car')}
        >
          <Text style={[styles.toggleText, isCar && styles.toggleTextActive]}>
            🚗 {t('Passenger Car', 'ಕಾರು ಪ್ರಯಾಣ')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, !isCar && styles.toggleBtnActive]}
          onPress={() => setKind('van')}
        >
          <Text style={[styles.toggleText, !isCar && styles.toggleTextActive]}>
            🚚 {t('Goods Van', 'ಗೂಡ್ಸ್ ವ್ಯಾನ್')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Route Inputs Card */}
        <View style={[styles.card, SHADOWS.card]}>
          <Input
            label={t('pickupLocation', 'ಪಿಕಪ್ ಸ್ಥಳ')}
            placeholder="e.g. Navanagar Sector 10, Bagalkot"
            value={pickup}
            onChangeText={setPickup}
          />

          <Input
            label={t('destination', 'ತಲುಪಬೇಕಾದ ಸ್ಥಳ')}
            placeholder="e.g. Badami Cave Temples or Hubballi"
            value={destination}
            onChangeText={setDestination}
          />

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Input
                label={t('travelDate', 'ದಿನಾಂಕ')}
                placeholder="DD/MM/YYYY"
                value={travelDate}
                onChangeText={setTravelDate}
              />
            </View>
            <View style={styles.col}>
              <Input
                label={t('travelTime', 'ಸಮಯ')}
                placeholder="08:00 AM"
                value={travelTime}
                onChangeText={setTravelTime}
              />
            </View>
          </View>
        </View>

        {/* Options for Passenger Car */}
        {isCar ? (
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.cardSectionTitle}>
              {t('Trip Type', 'ಪ್ರಯಾಣದ ವಿಧ')}
            </Text>
            <View style={styles.chipsRow}>
              {(
                [
                  'One-day trip',
                  'Outstation one-way',
                  'Round trip',
                  'Airport / station drop',
                ] as const
              ).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    carTripType === type && styles.typeChipActive,
                  ]}
                  onPress={() => setCarTripType(type)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      carTripType === type && styles.typeChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Passenger Counter */}
            <Text style={styles.cardSectionTitle}>
              {t('passengers', 'ಪ್ರಯಾಣಿಕರ ಸಂಖ್ಯೆ')}
            </Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setPassengers(Math.max(1, passengers - 1))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{passengers} Passengers</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setPassengers(Math.min(7, passengers + 1))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            {passengers > 4 && (
              <Text style={styles.suvNotice}>
                ℹ️ 5+ passengers automatically assigned an Innova / 7-seater SUV.
              </Text>
            )}
          </View>
        ) : (
          /* Options for Goods Van */
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.cardSectionTitle}>
              {t('Vehicle Capacity', 'ವಾಹನದ ಸಾಮರ್ಥ್ಯ')}
            </Text>
            <View style={styles.chipsRow}>
              {(['Mini van', 'Pickup truck', 'Large truck'] as const).map(
                (size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.typeChip,
                      vanSize === size && styles.typeChipActive,
                    ]}
                    onPress={() => setVanSize(size)}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        vanSize === size && styles.typeChipTextActive,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <Input
              label={t('goodsType', 'ಸರಕಿನ ವಿವರ')}
              placeholder="e.g. Household furniture, 1 BHK shifting"
              value={goodsType}
              onChangeText={setGoodsType}
            />

            <Input
              label={t('Special Instructions', 'ವಿಶೇಷ ಸೂಚನೆಗಳು')}
              placeholder="Fragile items, stairs, loading help needed..."
              textarea
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        )}

        {/* Fare Summary Card */}
        <View style={[styles.card, styles.fareCard, SHADOWS.pop]}>
          <Text style={styles.fareHeaderTitle}>
            {t('Estimated Total Fare', 'ಅಂದಾಜು ಒಟ್ಟು ದರ')}
          </Text>
          <Text style={styles.fareAmount}>{formatINR(fare)}</Text>
          <Text style={styles.fareNotice}>
            {t(
              'Final fare confirmed upon driver assignment. Paid directly in cash/UPI.',
              'ಚಾಲಕರು ಒಪ್ಪಿದ ನಂತರ ದರ ಅಂತಿಮ. ನೇರವಾಗಿ ನಗದು ಮೂಲಕ ಪಾವತಿಸಿ.'
            )}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title={t('Request Booking Now', 'ಈಗಲೇ ಬುಕಿಂಗ್ ವಿನಂತಿಸಿ')}
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          />
        </View>

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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 10,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    backgroundColor: COLORS.paper,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  typeChipActive: {
    backgroundColor: COLORS.sun,
    borderColor: COLORS.sunDeep,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  typeChipTextActive: {
    color: COLORS.ink,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paper,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  suvNotice: {
    fontSize: 12,
    color: COLORS.info,
    fontWeight: '600',
    marginTop: 8,
  },
  fareCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.sun,
    alignItems: 'center',
  },
  fareHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.mute,
  },
  fareAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.brand,
    marginVertical: 6,
  },
  fareNotice: {
    fontSize: 12,
    color: COLORS.mute,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bad,
    marginBottom: 10,
  },
});
