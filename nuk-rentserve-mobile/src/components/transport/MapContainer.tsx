// Interactive Cross-Platform Map Component for Live Ride Tracking

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { MapPin, Car, Navigation } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Coordinates, LiveLocation } from '../../api/transportApi';

interface MapContainerProps {
  userLocation: Coordinates;
  destinationLocation?: Coordinates;
  driverLocation?: LiveLocation | null;
  phase: string;
  onRecenter?: () => void;
  height?: number;
  interactive?: boolean;
  selectedLocation?: Coordinates | null;
  onSelectLocation?: (coords: Coordinates) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MapContainer: React.FC<MapContainerProps> = ({
  userLocation,
  destinationLocation,
  driverLocation,
  phase,
  onRecenter,
  height = 280,
  interactive = false,
  selectedLocation,
  onSelectLocation,
}) => {
  const isTracking = ['accepted', 'arriving', 'riding'].includes(phase);

  // Normalizing relative screen coordinates for map display
  const userX = SCREEN_WIDTH * 0.42;
  const userY = height * 0.65;
  const destX = SCREEN_WIDTH * 0.72;
  const destY = height * 0.28;

  // Selected Pin position relative to user location
  const selX = selectedLocation
    ? Math.max(20, Math.min(SCREEN_WIDTH - 20, userX + (selectedLocation.longitude - userLocation.longitude) / 0.00015))
    : null;
  const selY = selectedLocation
    ? Math.max(20, Math.min(height - 30, userY - (selectedLocation.latitude - userLocation.latitude) / 0.00015))
    : null;

  // Driver positions
  const drvX =
    phase === 'riding'
      ? (userX + destX) / 2
      : SCREEN_WIDTH * 0.25;
  const drvY =
    phase === 'riding'
      ? (userY + destY) / 2
      : height * 0.45;

  const handlePress = (e: any) => {
    if (!onSelectLocation) return;
    const { locationX, locationY } = e.nativeEvent;
    const dLon = (locationX - userX) * 0.00015;
    const dLat = (userY - locationY) * 0.00015;
    const newLat = parseFloat((userLocation.latitude + dLat).toFixed(6));
    const newLon = parseFloat((userLocation.longitude + dLon).toFixed(6));
    onSelectLocation({ latitude: newLat, longitude: newLon });
  };

  return (
    <TouchableOpacity
      activeOpacity={onSelectLocation ? 0.95 : 1}
      onPress={onSelectLocation ? handlePress : undefined}
      style={[styles.mapCanvas, { height }]}
    >
      {/* City Road Network & Vector Grid Background */}
      <Svg width="100%" height={height} style={StyleSheet.absoluteFill}>
        {/* Soft Green Parks */}
        <Rect x="15" y="25" width="80" height="60" rx="8" fill="#D9E8D0" />
        <Rect x={SCREEN_WIDTH - 110} y={height - 90} width="95" height="70" rx="8" fill="#CFE3F2" />

        {/* Road Polylines */}
        <Path
          d={`M -20 ${userY} L ${SCREEN_WIDTH + 20} ${userY}`}
          stroke="#FFFFFF"
          strokeWidth="14"
        />
        <Path
          d={`M -20 ${userY} L ${SCREEN_WIDTH + 20} ${userY}`}
          stroke="#D1D5DB"
          strokeWidth="10"
        />

        <Path
          d={`M ${userX} -20 L ${userX} ${height + 20}`}
          stroke="#FFFFFF"
          strokeWidth="14"
        />
        <Path
          d={`M ${userX} -20 L ${userX} ${height + 20}`}
          stroke="#D1D5DB"
          strokeWidth="10"
        />

        {/* Curved Trip Route between Pickup and Destination */}
        {destinationLocation && (
          <Path
            d={`M ${userX} ${userY} Q ${userX + 40} ${destY + 40} ${destX} ${destY}`}
            stroke={COLORS.brand}
            strokeWidth="4"
            strokeDasharray="6, 6"
            fill="none"
          />
        )}
      </Svg>

      {/* Destination Flag Pin */}
      {destinationLocation && (
        <View style={[styles.destMarker, { left: destX - 14, top: destY - 28 }]}>
          <MapPin size={28} color="#059669" fill="#059669" />
        </View>
      )}

      {/* Selected Drag/Tap Pin */}
      {selX !== null && selY !== null && (
        <View style={[styles.destMarker, { left: selX - 14, top: selY - 28 }]}>
          <MapPin size={28} color={COLORS.brand} fill={COLORS.brand} />
        </View>
      )}

      {/* Customer User Location (Blue Pulse Dot) */}
      <View style={[styles.userMarker, { left: userX - 12, top: userY - 12 }]}>
        <View style={styles.pulseRing} />
        <View style={styles.userDot} />
      </View>

      {/* Live Driver Auto Icon */}
      {isTracking && (
        <View style={[styles.driverMarker, { left: drvX - 18, top: drvY - 18 }, SHADOWS.pop]}>
          <Car size={20} color={COLORS.brand} />
        </View>
      )}

      {/* Interactive Guidance or Live GPS Coordinates Info Badge */}
      <View style={styles.coordsOverlay}>
        <View style={styles.livePulse} />
        <Text style={styles.coordsText}>
          {selectedLocation
            ? `Pin: ${selectedLocation.latitude.toFixed(4)}° N, ${selectedLocation.longitude.toFixed(4)}° E`
            : `${userLocation.latitude.toFixed(4)}° N, ${userLocation.longitude.toFixed(4)}° E`}
        </Text>
      </View>

      {onSelectLocation && !selectedLocation && (
        <View style={styles.tapHintOverlay}>
          <Text style={styles.tapHintText}>Tap map to set pin</Text>
        </View>
      )}

      {/* Recenter Crosshair Button */}
      {onRecenter && (
        <TouchableOpacity
          style={[styles.recenterBtn, SHADOWS.card]}
          onPress={onRecenter}
          accessibilityLabel="Recenter map"
          activeOpacity={0.8}
        >
          <Navigation size={16} color={COLORS.brand} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mapCanvas: {
    width: '100%',
    backgroundColor: COLORS.mapBg,
    position: 'relative',
    overflow: 'hidden',
  },
  destMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(215, 25, 32, 0.25)',
  },
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.brand,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  driverMarker: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordsOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ok,
  },
  coordsText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.ink,
  },
  recenterBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  tapHintOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tapHintText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
});
