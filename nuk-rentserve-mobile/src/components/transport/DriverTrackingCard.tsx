// Live Driver Status & Tracking Card

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Badge } from '../common/Badge';
import { useLocalization } from '../../context/LocalizationContext';

interface DriverTrackingCardProps {
  driverName: string;
  driverPhone?: string;
  vehicleModel: string;
  vehicleReg: string;
  rating?: number;
  statusText: string;
  onChat?: () => void;
  onCancel?: () => void;
}

export const DriverTrackingCard: React.FC<DriverTrackingCardProps> = ({
  driverName,
  driverPhone,
  vehicleModel,
  vehicleReg,
  rating = 4.8,
  statusText,
  onChat,
  onCancel,
}) => {
  const { t } = useLocalization();

  const handleCall = () => {
    if (driverPhone) {
      Linking.openURL(`tel:${driverPhone}`);
    }
  };

  return (
    <View style={[styles.card, SHADOWS.pop]}>
      {/* Status Pill */}
      <View style={styles.statusRow}>
        <Badge tone="ok" dot>
          {statusText}
        </Badge>
        <Text style={styles.etaText}>📍 Live GPS Active</Text>
      </View>

      {/* Driver Info Row */}
      <View style={styles.driverRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{driverName.charAt(0)}</Text>
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.name}>{driverName}</Text>
          <Text style={styles.vehicle}>
            {vehicleModel} · <Text style={styles.reg}>{vehicleReg}</Text>
          </Text>
          <Text style={styles.rating}>★ {rating.toFixed(1)} rating</Text>
        </View>

        {/* Call Driver Button */}
        {driverPhone && (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCall}
            accessibilityLabel={`Call ${driverName}`}
          >
            <Text style={styles.callIcon}>📞</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {onChat && (
          <TouchableOpacity style={styles.actionBtn} onPress={onChat}>
            <Text style={styles.actionBtnText}>💬 {t('chat', 'ಚಾಟ್')}</Text>
          </TouchableOpacity>
        )}
        {onCancel && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={onCancel}
          >
            <Text style={styles.cancelBtnText}>✕ {t('cancel', 'ರದ್ದು')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ok,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.brand,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  vehicle: {
    fontSize: 13,
    color: COLORS.mute,
    marginTop: 2,
  },
  reg: {
    fontWeight: '700',
    color: COLORS.ink,
  },
  rating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 2,
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.ok,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: {
    fontSize: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  cancelBtn: {
    backgroundColor: COLORS.badTint,
    borderColor: '#FCA5A5',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.bad,
  },
});
