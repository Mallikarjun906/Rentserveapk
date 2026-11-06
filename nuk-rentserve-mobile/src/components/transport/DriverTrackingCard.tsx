// Live Driver Status & Tracking Card

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { MapPin, Star, Phone, MessageSquare, X } from 'lucide-react-native';
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
        <Badge tone="ok" dot label={statusText} />
        <View style={styles.etaRow}>
          <MapPin size={11} color={COLORS.ok} />
          <Text style={styles.etaText}>Live GPS Active</Text>
        </View>
      </View>

      {/* Driver Info Row */}
      <View style={styles.driverRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{driverName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.name}>{driverName}</Text>
          <Text style={styles.vehicle}>
            {vehicleModel} · <Text style={styles.reg}>{vehicleReg}</Text>
          </Text>
          <View style={styles.ratingRow}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.rating}>{rating.toFixed(1)} rating</Text>
          </View>
        </View>

        {/* Call Driver Button */}
        {driverPhone && (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCall}
            accessibilityLabel={`Call ${driverName}`}
            activeOpacity={0.8}
          >
            <Phone size={18} color={COLORS.brand} />
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {onChat && (
          <TouchableOpacity style={styles.actionBtn} onPress={onChat} activeOpacity={0.8}>
            <MessageSquare size={14} color={COLORS.ink} />
            <Text style={styles.actionBtnText}>{t('chat', 'ಚಾಟ್')}</Text>
          </TouchableOpacity>
        )}
        {onCancel && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <X size={14} color={COLORS.crimson} />
            <Text style={styles.cancelBtnText}>{t('cancel', 'ರದ್ದು')}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etaText: {
    fontSize: 11,
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
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.brand,
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  vehicle: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 2,
  },
  reg: {
    fontWeight: '700',
    color: COLORS.ink,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  rating: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.crimson,
  },
});
