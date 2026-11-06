// Service Provider Card Component

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Star, MapPin, ArrowRight, ShieldCheck } from 'lucide-react-native';
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
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            <Badge tone="ok" label="Verified" />
          </View>
          <Text style={styles.trade}>{item.trade}</Text>
          <View style={styles.areaRow}>
            <MapPin size={11} color={COLORS.mute} />
            <Text style={styles.area}>
              {item.area}{item.km ? ` · ${item.km} km` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Ratings & Completed Jobs */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Star size={13} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.statSub}>({item.reviews || 1} {t('reviews', 'ವಿಮರ್ಶೆಗಳು')})</Text>
        </View>
        {item.jobs ? (
          <View style={styles.statItem}>
            <Text style={styles.jobsText}>{item.jobs}+</Text>
            <Text style={styles.statSub}>{t('jobs completed', 'ಕೆಲಸಗಳು')}</Text>
          </View>
        ) : null}
      </View>

      {/* Price & Book Row */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.priceLabel}>{t('servicePrice', 'ಅಂದಾಜು ಶುಲ್ಕ')}</Text>
          <Text style={styles.priceValue}>{item.rate || item.price || '₹350'}</Text>
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={onBook || onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.bookBtnText}>
            {t('bookService', 'ಬುಕ್ ಮಾಡಿ')}
          </Text>
          <ArrowRight size={13} color={COLORS.white} />
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
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.brand,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  trade: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.brand,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  area: {
    fontSize: 11,
    color: COLORS.mute,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    marginVertical: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink,
  },
  jobsText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
  },
  statSub: {
    fontSize: 11,
    color: COLORS.mute,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink,
    marginTop: 1,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
});
