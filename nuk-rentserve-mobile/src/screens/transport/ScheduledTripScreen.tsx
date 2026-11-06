// Scheduled Transport Booking Screen (Passenger Car Trips & Goods Van Freight)

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
  Car,
  Truck,
  Calendar,
  Clock,
  Users,
  Info,
  MapPin,
  CheckCircle2,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { formatINR } from '../../utils/formatters';
import { calculateCarTripFare, calculateGoodsVanFare } from '../../utils/fareCalculator';
import { useLocalization } from '../../context/LocalizationContext';
import { transportApi } from '../../api/transportApi';

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

    try {
      const details = isCar
        ? `Car Trip (${carTripType}) for ${passengers} passengers. Date: ${travelDate} ${travelTime}`
        : `Goods Van (${vanSize}) - Cargo: ${goodsType}. Notes: ${notes}. Date: ${travelDate} ${travelTime}`;

      const booking = await transportApi.createBooking({
        vehicleType: isCar ? 'car' : 'goods-van',
        pickup: pickup.trim(),
        destination: destination.trim(),
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        details,
      });

      const ref = booking._id || booking.id || (isCar ? 'CT-' : 'GV-') + Math.floor(1000 + Math.random() * 9000);
      Alert.alert(
        t('Booking Requested', 'ಬುಕಿಂಗ್ ವಿನಂತಿ ಸಲ್ಲಿಸಲಾಗಿದೆ'),
        t('Your trip has been registered. Available drivers will review and accept.', 'ನಿಮ್ಮ ಬುಕಿಂಗ್ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ಲಭ್ಯವಿರುವ ಚಾಲಕರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ.'),
        [{ text: 'OK', onPress: () => onSuccess(ref) }]
      );
    } catch (err: any) {
      setError(err.message || 'Could not create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
          activeOpacity={0.8}
        >
          <Car size={18} color={isCar ? COLORS.white : COLORS.ink} />
          <Text style={[styles.toggleText, isCar && styles.toggleTextActive]}>
            {t('Passenger Car', 'ಕಾರು ಪ್ರಯಾಣ')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, !isCar && styles.toggleBtnActive]}
          onPress={() => setKind('van')}
          activeOpacity={0.8}
        >
          <Truck size={18} color={!isCar ? COLORS.white : COLORS.ink} />
          <Text style={[styles.toggleText, !isCar && styles.toggleTextActive]}>
            {t('Goods Van', 'ಗೂಡ್ಸ್ ವ್ಯಾನ್')}
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
              <View style={styles.stepperValueContainer}>
                <Users size={16} color={COLORS.brand} />
                <Text style={styles.stepperValue}>{passengers} Passengers</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setPassengers(Math.min(7, passengers + 1))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            {passengers > 4 && (
              <View style={styles.infoBanner}>
                <Info size={14} color="#1D4ED8" />
                <Text style={styles.suvNotice}>
                  5+ passengers will automatically be assigned an Innova / 7-seater SUV.
                </Text>
              </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    paddingBottom: 40,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  typeChipActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  typeChipTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paper,
    padding: 8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink,
  },
  stepperValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 10,
  },
  suvNotice: {
    fontSize: 11,
    color: '#1D4ED8',
    flex: 1,
  },
  fareCard: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
    borderWidth: 1.5,
  },
  fareHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
    textTransform: 'uppercase',
  },
  fareAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.ink,
    marginVertical: 4,
  },
  fareNotice: {
    fontSize: 11,
    color: COLORS.mute,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.crimson,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
});
