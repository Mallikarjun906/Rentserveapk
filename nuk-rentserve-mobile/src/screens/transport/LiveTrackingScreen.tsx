// Full Screen Live Driver GPS Tracking with SOS and Direct Actions

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { AlertTriangle, PhoneCall } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { MapContainer } from '../../components/transport/MapContainer';
import { DriverTrackingCard } from '../../components/transport/DriverTrackingCard';
import { useActiveRide } from '../../context/ActiveRideContext';
import { useLocationContext } from '../../context/LocationContext';
import { useLocalization } from '../../context/LocalizationContext';

interface LiveTrackingScreenProps {
  onBack: () => void;
  onOpenChat: (params?: any) => void;
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

  const assignedDriver = {
    name:
      (typeof activeBooking?.providerId === 'object' && activeBooking.providerId?.name) ||
      'Basavaraj (Assigned Driver)',
    phone:
      (typeof activeBooking?.providerId === 'object' && activeBooking.providerId?.phone) ||
      '+91 98450 12345',
    vehicleModel: 'Bajaj RE Auto Rickshaw',
    vehicleReg: 'KA 29 B 4821',
    rating: 4.9,
    bookingId: activeBooking?._id || activeBooking?.id,
  };

  return (
    <View style={styles.container}>
      <Header
        title={t('Live Ride Tracking', 'ಲೈವ್ ಸವಾರಿ ಟ್ರ್ಯಾಕಿಂಗ್')}
        subtitle={`${activeBooking?.pickup || 'Pickup'} → ${destName || 'Destination'}`}
        onBack={onBack}
        rightAction={
          <TouchableOpacity onPress={handleSos} style={styles.sosBtn} activeOpacity={0.8}>
            <AlertTriangle size={14} color={COLORS.white} />
            <Text style={styles.sosText}>SOS</Text>
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
          onCancel={async () => {
            await cancelRide();
            onBack();
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  mapWrapper: {
    flex: 1,
  },
  bottomCardContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.crimson,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  sosText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
});
