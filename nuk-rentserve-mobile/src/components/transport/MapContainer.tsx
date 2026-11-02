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
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Coordinates, LiveLocation } from '../../api/transportApi';

interface MapContainerProps {
  userLocation: Coordinates;
  destinationLocation?: Coordinates;
  driverLocation?: LiveLocation | null;
  phase: string;
  onRecenter?: () => void;
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MapContainer: React.FC<MapContainerProps> = ({
  userLocation,
  destinationLocation,
  driverLocation,
  phase,
  onRecenter,
  height = 280,
}) => {
  const isTracking = ['accepted', 'arriving', 'riding'].includes(phase);

  // Normalizing relative screen coordinates for map display
  const userX = SCREEN_WIDTH * 0.42;
  const userY = height * 0.65;
  const destX = SCREEN_WIDTH * 0.72;
  const destY = height * 0.28;

  // Driver positions
  const drvX =
    phase === 'riding'
      ? (userX + destX) / 2
      : SCREEN_WIDTH * 0.25;
  const drvY =
    phase === 'riding'
      ? (userY + destY) / 2
      : height * 0.45;

  return (
    <View style={[styles.mapCanvas, { height }]}>
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
        <View style={[styles.destMarker, { left: destX - 16, top: destY - 32 }]}>
          <Text style={styles.destIcon}>📍</Text>
        </View>
      )}

      {/* Customer User Location (Blue Pulse Dot) */}
      <View style={[styles.userMarker, { left: userX - 12, top: userY - 12 }]}>
        <View style={styles.pulseRing} />
        <View style={styles.userDot} />
      </View>

      {/* Live Driver Auto Icon */}
      {isTracking && (
        <View style={[styles.driverMarker, { left: drvX - 20, top: drvY - 20 }, SHADOWS.pop]}>
          <Text style={styles.driverEmoji}>🛺</Text>
        </View>
      )}

      {/* Live GPS Coordinates Info Badge */}
      <View style={styles.coordsOverlay}>
        <View style={styles.livePulse} />
        <Text style={styles.coordsText}>
          {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
        </Text>
      </View>

      {/* Recenter Crosshair Button */}
      {onRecenter && (
        <TouchableOpacity
          style={[styles.recenterBtn, SHADOWS.card]}
          onPress={onRecenter}
          accessibilityLabel="Recenter map"
        >
          <Text style={styles.recenterIcon}>⌖</Text>
        </TouchableOpacity>
      )}
    </View>
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
  destIcon: {
    fontSize: 32,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.gpsBlue,
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  driverMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.sun,
    borderWidth: 2,
    borderColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverEmoji: {
    fontSize: 20,
  },
  coordsOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ok,
    marginRight: 6,
  },
  coordsText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mute,
  },
  recenterBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenterIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink,
  },
});
