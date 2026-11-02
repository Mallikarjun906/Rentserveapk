// Instant Auto Booking Screen with Fare Bargaining, Driver Dispatch & Live Tracking

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { MapContainer } from '../../components/transport/MapContainer';
import { FareBargainSheet } from '../../components/transport/FareBargainSheet';
import { DriverTrackingCard } from '../../components/transport/DriverTrackingCard';
import { RideOtpReceipt } from '../../components/transport/RideOtpReceipt';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { MOCK_DESTINATIONS, MOCK_DEFAULT_DRIVER } from '../../constants/mockData';
import { useLocalization } from '../../context/LocalizationContext';
import { useActiveRide } from '../../context/ActiveRideContext';
import { useLocationContext } from '../../context/LocationContext';

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
    // Simulate realistic driver acceptance for prototype / offline responsiveness
    setTimeout(() => {
      setPhase('accepted');
    }, 3000);
  };

  const handleRideCompletion = (data: { paidInCash: boolean; rating: number; comment: string }) => {
    resetRide();
    onBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
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
                <Text style={styles.pinIcon}>📍</Text>
                <TextInput
                  style={styles.textInput}
                  value={pickupName}
                  onChangeText={setPickupName}
                  placeholder="Enter pickup point"
                />
              </View>
            </View>

            {/* Destination Field */}
            <View style={styles.inputCard}>
              <Text style={styles.fieldLabel}>
                {t('destination', 'ತಲುಪಬೇಕಾದ ಸ್ಥಳ')}
              </Text>
              <View style={styles.inputRow}>
                <Text style={styles.flagIcon}>🏁</Text>
                <TextInput
                  style={styles.textInput}
                  value={searchQuery || destName}
                  onChangeText={setSearchQuery}
                  placeholder={t('whereTo', 'ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?')}
                />
              </View>
            </View>

            {/* Popular Local Hubs in Bagalkot */}
            <Text style={styles.subHeading}>
              {t('Popular Destinations in Bagalkot', 'ಬಾಗಲಕೋಟೆಯ ಪ್ರಮುಖ ಸ್ಥಳಗಳು')}
            </Text>
            <View style={styles.destList}>
              {MOCK_DESTINATIONS.map((d) => (
                <TouchableOpacity
                  key={d.name}
                  style={[styles.destItem, SHADOWS.card]}
                  onPress={() => handleSelectDestination(d)}
                >
                  <View style={styles.destLeft}>
                    <Text style={styles.destEmoji}>🚏</Text>
                    <View>
                      <Text style={styles.destName}>{d.name}</Text>
                      <Text style={styles.destKm}>{d.km} km away</Text>
                    </View>
                  </View>
                  <Text style={styles.selectArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Phase 2: Fare Bargaining Counter */}
        {phase === 'options' && (
          <View style={[styles.card, SHADOWS.card]}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeText}>
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
              <Text style={styles.radarEmoji}>🛺</Text>
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
              driverName={MOCK_DEFAULT_DRIVER.name}
              driverPhone={MOCK_DEFAULT_DRIVER.phone}
              vehicleModel={MOCK_DEFAULT_DRIVER.vehicleModel}
              vehicleReg={MOCK_DEFAULT_DRIVER.vehicleReg}
              rating={MOCK_DEFAULT_DRIVER.rating}
              statusText={
                phase === 'riding'
                  ? t('rideInProgress', 'ಪ್ರಯಾಣ ಪ್ರಗತಿಯಲ್ಲಿದೆ')
                  : t('driverArriving', 'ಚಾಲಕರು ಬರುತ್ತಿದ್ದಾರೆ')
              }
              onChat={() => onOpenChat(MOCK_DEFAULT_DRIVER)}
              onCancel={() => setCancelModalOpen(true)}
            />

            {/* Quick Trip Simulator Controls for Testing */}
            <View style={styles.simControls}>
              <Text style={styles.simLabel}>Demo Simulation Switcher:</Text>
              <View style={styles.simRow}>
                <TouchableOpacity
                  style={styles.simBtn}
                  onPress={() => setPhase('riding')}
                >
                  <Text style={styles.simBtnText}>Start Ride</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.simBtn, styles.simBtnFinish]}
                  onPress={() => setPhase('completed')}
                >
                  <Text style={styles.simBtnText}>Complete Ride</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Phase 5: Ride Completed Receipt & Cash Acknowledgment */}
        {phase === 'completed' && (
          <View style={[styles.card, SHADOWS.pop]}>
            <RideOtpReceipt
              fare={offeredFare}
              driverName={MOCK_DEFAULT_DRIVER.name}
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
        footer={
          <>
            <Button
              title={t('No, Keep Ride', 'ಇಲ್ಲ')}
              onPress={() => setCancelModalOpen(false)}
              variant="outline"
              size="sm"
            />
            <Button
              title={t('Yes, Cancel', 'ಹೌದು, ರದ್ದು')}
              onPress={async () => {
                setCancelModalOpen(false);
                await cancelRide();
              }}
              variant="danger"
              size="sm"
            />
          </>
        }
      >
        <Text style={styles.cancelModalText}>
          {t(
            'Frequent cancellations after driver acceptance may lower your rating.',
            'ಚಾಲಕರು ಒಪ್ಪಿಕೊಂಡ ನಂತರ ರದ್ದುಮಾಡುವುದರಿಂದ ರೇಟಿಂಗ್ ಕಡಿಮೆಯಾಗಬಹುದು.'
          )}
        </Text>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scroll: {
    padding: 16,
  },
  panel: {
    gap: 12,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  flagIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    paddingVertical: 0,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.mute,
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  destList: {
    gap: 8,
  },
  destItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  destLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  destName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  destKm: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 1,
  },
  selectArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.brand,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginBottom: 12,
  },
  routeText: {
    fontSize: 14,
    color: COLORS.ink,
    flex: 1,
    marginRight: 8,
  },
  bold: {
    fontWeight: '800',
    color: COLORS.brand,
  },
  changeRouteText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
  centerCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  radarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.sunTint,
    borderWidth: 3,
    borderColor: COLORS.sun,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  radarEmoji: {
    fontSize: 36,
  },
  searchingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  searchingSub: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelBtn: {
    minWidth: 140,
  },
  simControls: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginTop: 14,
  },
  simLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mute,
    marginBottom: 8,
  },
  simRow: {
    flexDirection: 'row',
    gap: 10,
  },
  simBtn: {
    flex: 1,
    backgroundColor: COLORS.ink,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  simBtnFinish: {
    backgroundColor: COLORS.ok,
  },
  simBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  cancelModalText: {
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 20,
  },
});
