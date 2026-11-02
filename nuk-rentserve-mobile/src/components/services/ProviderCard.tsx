// Service Provider Card Component

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Badge } from '../common/Badge';
import { useLocalization } from '../../context/LocalizationContext';

export interface ProviderCardItem {
  id: string;
  name: string;
  trade: string;
  rating: number;
  reviews?: number;
  ratingCount?: number;
  area: string;
  price?: string;
  rate?: string;
  rateUnit?: string;
  km?: number;
  jobs?: number;
  photo?: string;
  phone?: string;
  isAvailable?: boolean;
}

interface ProviderCardProps {
  item: ProviderCardItem;
  onPress: () => void;
  onBook?: () => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  item,
  onPress,
  onBook,
}) => {
  const { t } = useLocalization();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, SHADOWS.card]}
    >
      <View style={styles.topRow}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            <Badge tone="ok" label="✓ Verified" />
          </View>
          <Text style={styles.trade}>{item.trade}</Text>
          <Text style={styles.area}>
            📍 {item.area}{item.km ? ` · ${item.km} km` : ''}
          </Text>
        </View>
      </View>

      {/* Ratings & Completed Jobs */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.ratingText}>★ {item.rating.toFixed(1)}</Text>
          <Text style={styles.statSub}>({item.reviews} {t('reviews', 'ವಿಮರ್ಶೆಗಳು')})</Text>
        </View>
        {item.jobs && (
          <View style={styles.statItem}>
            <Text style={styles.jobsText}>{item.jobs}+</Text>
            <Text style={styles.statSub}>{t('jobs completed', 'ಕೆಲಸಗಳು')}</Text>
          </View>
        )}
      </View>

      {/* Price & Book Row */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.priceLabel}>{t('servicePrice', 'ಅಂದಾಜು ಶುಲ್ಕ')}</Text>
          <Text style={styles.priceValue}>{item.price}</Text>
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={onBook || onPress}
        >
          <Text style={styles.bookBtnText}>
            {t('bookService', 'ಬುಕ್ ಮಾಡಿ')} →
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    flex: 1,
    marginRight: 6,
  },
  trade: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.brand,
    marginTop: 1,
  },
  area: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    padding: 8,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  jobsText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  statSub: {
    fontSize: 11,
    color: COLORS.mute,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 10,
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.mute,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  bookBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});
