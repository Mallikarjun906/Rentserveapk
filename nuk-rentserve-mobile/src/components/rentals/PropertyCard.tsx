// Rental Property Listing Card Component

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Heart, MapPin, ArrowRight } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { formatINR } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { useLocalization } from '../../context/LocalizationContext';

export interface PropertyCardItem {
  _id?: string;
  id?: string;
  title: string;
  type: string;
  rent: number;
  deposit?: number;
  location: string;
  address?: string;
  facilities?: string[];
  images?: Array<{ url: string }>;
  isStudentPartner?: boolean;
  listerName?: string;
}

interface PropertyCardProps {
  item: PropertyCardItem;
  onPress: () => void;
  isSaved?: boolean;
  onToggleSaved?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  item,
  onPress,
  isSaved = false,
  onToggleSaved,
}) => {
  const { t } = useLocalization();

  const imageUrl =
    item.images && item.images.length > 0 && item.images[0].url
      ? item.images[0].url
      : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, SHADOWS.card]}
    >
      {/* Property Thumbnail */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Top Badges */}
        <View style={styles.imageOverlayTop}>
          <Badge tone="sun" label={item.type.toUpperCase()} />
          {onToggleSaved && (
            <TouchableOpacity
              onPress={onToggleSaved}
              style={styles.heartBtn}
              accessibilityLabel="Save property"
              activeOpacity={0.8}
            >
              <Heart
                size={18}
                color={isSaved ? COLORS.brand : COLORS.white}
                fill={isSaved ? COLORS.brand : 'rgba(0,0,0,0.3)'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Source Badge (Owner vs Student Partner) */}
        <View style={styles.imageOverlayBottom}>
          <Badge
            tone={item.isStudentPartner ? 'info' : 'ok'}
            label={
              item.isStudentPartner
                ? t('studentPartner', 'ವಿದ್ಯಾರ್ಥಿ ಪಾಲುದಾರರು')
                : t('verifiedOwner', 'ಆಸ್ತಿ ಮಾಲೀಕರು')
            }
          />
        </View>
      </View>

      {/* Property Details */}
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.locRow}>
          <MapPin size={12} color={COLORS.mute} />
          <Text style={styles.location} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        {/* Facilities Chips */}
        {item.facilities && item.facilities.length > 0 && (
          <View style={styles.facilitiesRow}>
            {item.facilities.slice(0, 3).map((f, i) => (
              <View key={i} style={styles.facilityChip}>
                <Text style={styles.facilityText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Price & Deposit Row */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.rent}>
              {formatINR(item.rent)}{' '}
              <Text style={styles.rentPeriod}>
                {t('rentPerMonth', '/ ತಿಂಗಳು')}
              </Text>
            </Text>
            {item.deposit !== undefined && item.deposit > 0 && (
              <Text style={styles.deposit}>
                {t('deposit', 'ಠೇವಣಿ')}: {formatINR(item.deposit)}
              </Text>
            )}
          </View>

          <View style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>{t('viewAll', 'ವಿವರಗಳು')}</Text>
            <ArrowRight size={13} color={COLORS.brand} />
          </View>
        </View>
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
    overflow: 'hidden',
    marginBottom: 14,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.paper,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageOverlayBottom: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    color: COLORS.mute,
    flex: 1,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  facilityChip: {
    backgroundColor: COLORS.paper,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  facilityText: {
    fontSize: 11,
    color: COLORS.ink,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  rent: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  rentPeriod: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mute,
  },
  deposit: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
  },
});
