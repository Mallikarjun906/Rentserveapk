// Instant Auto Booking Screen with Fare Bargaining, Driver Dispatch & Live Tracking

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  MapPin,
  Flag,
  Navigation,
  Car,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Banknote,
  Search,
  Sparkles,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { MapContainer } from '../../components/transport/MapContainer';
import { FareBargainSheet } from '../../components/transport/FareBargainSheet';
import { DriverTrackingCard } from '../../components/transport/DriverTrackingCard';
import { RideOtpReceipt } from '../../components/transport/RideOtpReceipt';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { useLocalization } from '../../context/LocalizationContext';
import { useActiveRide } from '../../context/ActiveRideContext';
import { useLocationContext } from '../../context/LocationContext';

const BAGALKOT_HUBS = [
  { name: 'Bagalkot New Bus Stand, Sector 10', km: 2.5 },
  { name: 'BVVS Engineering Campus, Vidyagiri', km: 3.8 },
  { name: 'District Hospital, Navanagar', km: 4.2 },
  { name: 'Bagalkot Railway Station, Old Town', km: 6.0 },
  { name: 'Basaveshwara Circle, Navanagar', km: 1.8 },
  { name: 'Muchakhandi Dam Road Junction', km: 7.5 },
];

interface AutoBookingScreenProps {
  onBack: () => void;
  onOpenChat: (driverInfo: any) => void;
}

export const AutoBookingScreen: React.FC<AutoBookingScreenProps> = ({
  onBack,
  onOpenChat,
}) => {
  const { t } = useLocalization();
  const { coords } = useLocationContext();
  const {
    phase,
    setPhase,
    activeBooking,
    pickupName,
    setPickupName,
    destName,
    setDestName,
    destCoords,
    setDestCoords,
    setEstimatedKm,
    suggestedFare,
    offeredFare,
    adjustOffer,
    driverTracking,
    startSearch,
    cancelRide,
    resetRide,
  } = useActiveRide();

  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const handleSelectDestination = (item: { name: string; km: number }) => {
    setDestName(item.name);
    setEstimatedKm(item.km);
    setDestCoords({
      latitude: coords.latitude + 0.015,
      longitude: coords.longitude + 0.015,
    });
    setPhase('options');
  };

  const handleStartRide = async () => {
    await startSearch();
  };

  const handleRideCompletion = () => {
    resetRide();
    onBack();
  };

  const assignedDriver = {
    name:
      (typeof activeBooking?.providerId === 'object' && activeBooking.providerId?.name) ||
      'Basavaraj (Assigned Auto Driver)',
    phone:
      (typeof activeBooking?.providerId === 'object' && activeBooking.providerId?.phone) ||
      '+91 98450 12345',
    vehicleModel: 'Bajaj RE Auto Rickshaw',
    vehicleReg: 'KA 29 B 4821',
    rating: 4.9,
    bookingId: activeBooking?._id || activeBooking?.id,
  };

  const filteredHubs = searchQuery.trim()
    ? BAGALKOT_HUBS.filter((h) => h.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : BAGALKOT_HUBS;

  return (
    <View style={styles.container}>
      <Header
        title={t('bookAuto', 'ಆಟೋ ಬುಕಿಂಗ್')}
        subtitle="Instant ride with fair bargaining"
        onBack={phase === 'idle' ? onBack : () => setCancelModalOpen(true)}
      />

      {/* Map View */}
      <MapContainer
        userLocation={coords}
        destinationLocation={destName ? destCoords : undefined}
        driverLocation={driverTracking}
        phase={phase}
        height={240}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Phase 1: Destination Selection */}
        {phase === 'idle' && (
          <View style={styles.panel}>
            {/* Pickup Field */}
            <View style={styles.inputCard}>
              <Text style={styles.fieldLabel}>
                {t('pickupLocation', 'ಪಿಕಪ್ ಸ್ಥಳ')}
              </Text>
              <View style={styles.inputRow}>
                <MapPin size={18} color={COLORS.brand} />
                <TextInput
                  style={styles.textInput}
                  value={pickupName}
                  onChangeText={setPickupName}
                  placeholder="Enter pickup point"
                  placeholderTextColor={COLORS.mute}
                />
              </View>
            </View>

            {/* Destination Field */}
            <View style={styles.inputCard}>
              <Text style={styles.fieldLabel}>
                {t('destination', 'ತಲುಪಬೇಕಾದ ಸ್ಥಳ')}
              </Text>
              <View style={styles.inputRow}>
                <Flag size={18} color="#059669" />
                <TextInput
                  style={styles.textInput}
                  value={searchQuery || destName}
                  onChangeText={(val) => {
                    setSearchQuery(val);
                    setDestName(val);
                  }}
                  placeholder={t('whereTo', 'ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?')}
                  placeholderTextColor={COLORS.mute}
                />
              </View>
            </View>

            {/* Popular Local Hubs in Bagalkot */}
            <Text style={styles.subHeading}>
              {t('Popular Destinations in Bagalkot', 'ಬಾಗಲಕೋಟೆಯ ಪ್ರಮುಖ ಸ್ಥಳಗಳು')}
            </Text>
            <View style={styles.destList}>
              {filteredHubs.map((d) => (
                <TouchableOpacity
                  key={d.name}
                  style={[styles.destItem, SHADOWS.card]}
                  onPress={() => handleSelectDestination(d)}
                  activeOpacity={0.8}
                >
                  <View style={styles.destLeft}>
                    <View style={styles.destIconBox}>
                      <Car size={16} color={COLORS.brand} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.destName} numberOfLines={1}>{d.name}</Text>
                      <Text style={styles.destKm}>{d.km} km away</Text>
                    </View>
                  </View>
                  <ArrowRight size={16} color={COLORS.mute} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Phase 2: Fare Bargaining Counter */}
        {phase === 'options' && (
          <View style={[styles.card, SHADOWS.card]}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeText} numberOfLines={2}>
                {pickupName} → <Text style={styles.bold}>{destName}</Text>
              </Text>
              <TouchableOpacity onPress={() => setPhase('idle')}>
                <Text style={styles.changeRouteText}>{t('Change', 'ಬದಲಿಸಿ')}</Text>
              </TouchableOpacity>
            </View>

            <FareBargainSheet
              suggestedFare={suggestedFare}
              offeredFare={offeredFare}
              onAdjust={adjustOffer}
              onRequest={handleStartRide}
            />
          </View>
        )}

        {/* Phase 3: Searching for Drivers Radar */}
        {phase === 'searching' && (
          <View style={[styles.card, styles.centerCard, SHADOWS.card]}>
            <View style={styles.radarCircle}>
              <Car size={36} color={COLORS.brand} />
            </View>
            <Text style={styles.searchingTitle}>
              {t('findingDriver', 'ಹತ್ತಿರದ ಆಟೋ ಚಾಲಕರನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...')}
            </Text>
            <Text style={styles.searchingSub}>
              Offered Fare: ₹{offeredFare} · Dispatching within 5 km
            </Text>

            <Button
              title={t('cancel', 'ರದ್ದುಮಾಡಿ')}
              onPress={cancelRide}
              variant="outline"
              size="sm"
              style={styles.cancelBtn}
            />
          </View>
        )}

        {/* Phase 4: Driver Accepted & Live Tracking */}
        {['accepted', 'arriving', 'riding'].includes(phase) && (
          <View>
            <DriverTrackingCard
              driverName={assignedDriver.name}
              driverPhone={assignedDriver.phone}
              vehicleModel={assignedDriver.vehicleModel}
              vehicleReg={assignedDriver.vehicleReg}
              rating={assignedDriver.rating}
              statusText={
                phase === 'riding'
                  ? t('rideInProgress', 'ಪ್ರಯಾಣ ಪ್ರಗತಿಯಲ್ಲಿದೆ')
                  : t('driverArriving', 'ಚಾಲಕರು ಬರುತ್ತಿದ್ದಾರೆ')
              }
              onChat={() => onOpenChat(assignedDriver)}
              onCancel={() => setCancelModalOpen(true)}
            />
          </View>
        )}

        {/* Phase 5: Ride Completed Receipt & Cash Acknowledgment */}
        {phase === 'completed' && (
          <View style={[styles.card, SHADOWS.pop]}>
            <RideOtpReceipt
              fare={offeredFare}
              driverName={assignedDriver.name}
              onComplete={handleRideCompletion}
            />
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={t('Cancel Ride?', 'ಸವಾರಿ ರದ್ದುಮಾಡಬೇಕೆ?')}
      >
        <Text style={styles.cancelText}>
          {t(
            'Are you sure you want to cancel this booking? Frequent cancellations affect driver matching.',
            'ಖಚಿತವಾಗಿ ಈ ಬುಕಿಂಗ್ ರದ್ದುಮಾಡಲು ಬಯಸುವಿರಾ? ಪದೇ ಪದೇ ರದ್ದುಮಾಡಿದರೆ ಸೇವೆಗೆ ತೊಂದರೆಯಾಗಬಹುದು.'
          )}
        </Text>
        <View style={styles.modalBtns}>
          <Button
            title={t('Keep Ride', 'ಮುಂದುವರಿಸಿ')}
            onPress={() => setCancelModalOpen(false)}
            variant="outline"
            style={{ flex: 1 }}
          />
          <Button
            title={t('Yes, Cancel', 'ಹೌದು, ರದ್ದುಮಾಡಿ')}
            onPress={async () => {
              setCancelModalOpen(false);
              await cancelRide();
            }}
            variant="primary"
            style={{ flex: 1 }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  panel: {
    marginTop: 8,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink,
    fontWeight: '600',
    paddingVertical: 2,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 14,
    marginBottom: 10,
  },
  destList: {
    gap: 8,
  },
  destItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  destLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  destIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  destKm: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginTop: 10,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  routeText: {
    fontSize: 13,
    color: COLORS.ink,
    flex: 1,
  },
  bold: {
    fontWeight: '800',
  },
  changeRouteText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
    marginLeft: 8,
  },
  centerCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  radarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FECDD3',
  },
  searchingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    textAlign: 'center',
  },
  searchingSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelBtn: {
    minWidth: 140,
  },
  cancelText: {
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 20,
    marginBottom: 18,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
  },
});
