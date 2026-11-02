// Full Screen Live Driver GPS Tracking with SOS and Direct Actions

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { MapContainer } from '../../components/transport/MapContainer';
import { DriverTrackingCard } from '../../components/transport/DriverTrackingCard';
import { useActiveRide } from '../../context/ActiveRideContext';
import { useLocationContext } from '../../context/LocationContext';
import { useLocalization } from '../../context/LocalizationContext';
import { MOCK_DEFAULT_DRIVER } from '../../constants/mockData';

interface LiveTrackingScreenProps {
  onBack: () => void;
  onOpenChat: () => void;
  onFinishRide: () => void;
}

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({
  onBack,
  onOpenChat,
  onFinishRide,
}) => {
  const { t } = useLocalization();
  const { coords } = useLocationContext();
  const {
    phase,
    destName,
    destCoords,
    driverTracking,
    activeBooking,
    cancelRide,
  } = useActiveRide();

  const handleSos = () => {
    Alert.alert(
      'Emergency SOS · 112',
      'Do you want to dial Karnataka State Emergency 112 now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 112 Now', style: 'destructive', onPress: () => Linking.openURL('tel:112') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={t('Live Ride Tracking', 'ಲೈವ್ ಸವಾರಿ ಟ್ರ್ಯಾಕಿಂಗ್')}
        subtitle={`${activeBooking?.pickup || 'Pickup'} → ${destName || 'Destination'}`}
        onBack={onBack}
        rightAction={
          <TouchableOpacity onPress={handleSos} style={styles.sosBtn}>
            <Text style={styles.sosText}>🚨 SOS</Text>
          </TouchableOpacity>
        }
      />

      {/* Full-view Map Canvas */}
      <View style={styles.mapWrapper}>
        <MapContainer
          userLocation={coords}
          destinationLocation={destCoords}
          driverLocation={driverTracking}
          phase={phase}
          height={380}
        />
      </View>

      {/* Floating Driver Status Card */}
      <View style={styles.bottomCardContainer}>
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
          onChat={onOpenChat}
          onCancel={async () => {
            await cancelRide();
            onBack();
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  mapWrapper: {
    flex: 1,
  },
  sosBtn: {
    backgroundColor: COLORS.bad,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  sosText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.white,
  },
  bottomCardContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
});
