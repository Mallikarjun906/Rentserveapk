// Explore Screen (Connected to real MongoDB backend APIs for Rentals and Services)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { PropertyCard, PropertyCardItem } from '../../components/rentals/PropertyCard';
import { ProviderCard, ProviderCardItem } from '../../components/services/ProviderCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { rentalApi } from '../../api/rentalApi';
import { serviceApi } from '../../api/serviceApi';

interface ExploreScreenProps {
  initialSegment?: 'rentals' | 'services';
  onSelectProperty: (id: string) => void;
  onSelectProvider: (id: string) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  initialSegment = 'rentals',
  onSelectProperty,
  onSelectProvider,
}) => {
  const { t } = useLocalization();
  const { isSaved, toggleSaved } = useAuth();

  const [segment, setSegment] = useState<'rentals' | 'services'>(initialSegment);
  const [query, setQuery] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('All');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('All');

  const [properties, setProperties] = useState<PropertyCardItem[]>([]);
  const [providers, setProviders] = useState<ProviderCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExploreData() {
      setLoading(true);
      try {
        const [propsRes, provsRes] = await Promise.allSettled([
          rentalApi.getProperties(),
          serviceApi.getServices(),
        ]);

        if (propsRes.status === 'fulfilled' && Array.isArray(propsRes.value)) {
          setProperties(
            propsRes.value.map((p: any) => ({
              id: p._id || p.id,
              _id: p._id || p.id,
              title: p.title,
              type: p.type || 'House',
              rent: p.rent,
              deposit: p.deposit || 0,
              location: p.location || p.address || 'Bagalkot',
              address: p.address || '',
              facilities: p.facilities || [],
              isStudentPartner: p.type === 'PG' || p.type === 'Room',
              listerName: p.ownerId?.name || 'Owner',
              images: p.images || [],
            }))
          );
        }

        if (provsRes.status === 'fulfilled' && Array.isArray(provsRes.value)) {
          setProviders(
            provsRes.value.map((s: any) => ({
              id: s._id || s.id,
              name: s.providerId?.name || s.title || 'Professional',
              trade: s.categoryId?.name || s.category || 'General Service',
              area: s.location || 'Bagalkot',
              rating: 5.0,
              ratingCount: 1,
              reviews: 1,
              price: s.priceRange?.min ? `₹${s.priceRange.min}` : '₹350',
              rate: s.priceRange?.min ? `₹${s.priceRange.min}` : '₹350',
              rateUnit: s.payUnit ? `/${s.payUnit}` : '/visit',
              photo: s.images?.[0]?.url || s.providerId?.profileImage?.url,
              phone: s.providerId?.phone,
              isAvailable: s.availability !== false,
            }))
          );
        }
      } catch (err) {
        // Handled gracefully
      } finally {
        setLoading(false);
      }
    }

    loadExploreData();
  }, []);

  // Filtered properties
  const filteredProperties = properties.filter((p) => {
    const matchesQuery =
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.location.toLowerCase().includes(query.toLowerCase());
    const matchesType =
      propertyTypeFilter === 'All' ||
      p.type.toLowerCase() === propertyTypeFilter.toLowerCase();
    return matchesQuery && matchesType;
  });

  // Filtered services
  const filteredProviders = providers.filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.trade.toLowerCase().includes(query.toLowerCase()) ||
      s.area.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      serviceCategoryFilter === 'All' ||
      s.trade.toLowerCase() === serviceCategoryFilter.toLowerCase();
    return matchesQuery && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Segmented Switcher */}
      <View style={styles.topSegmentContainer}>
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, segment === 'rentals' && styles.segmentBtnActive]}
            onPress={() => setSegment('rentals')}
          >
            <Text
              style={[
                styles.segmentText,
                segment === 'rentals' && styles.segmentTextActive,
              ]}
            >
              🏡 {t('rentals', 'ಬಾಡಿಗೆ ಮನೆಗಳು')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, segment === 'services' && styles.segmentBtnActive]}
            onPress={() => setSegment('services')}
          >
            <Text
              style={[
                styles.segmentText,
                segment === 'services' && styles.segmentTextActive,
              ]}
            >
              🔧 {t('localServices', 'ಸ್ಥಳೀಯ ಸೇವೆಗಳು')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBoxWrapper}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={
              segment === 'rentals'
                ? t('searchRentals', 'ಹುಡುಕಿ: 2 BHK, PG, ವಿದ್ಯಾಗಿರಿ...')
                : t('searchServices', 'ಹುಡುಕಿ: ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಪ್ಲಂಬರ್...')
            }
            placeholderTextColor={COLORS.inkMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {segment === 'rentals' ? (
            ['All', 'House', 'Room', 'PG', 'Commercial'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  propertyTypeFilter === type && styles.filterChipActive,
                ]}
                onPress={() => setPropertyTypeFilter(type)}
              >
                <Text
                  style={[
                    styles.chipText,
                    propertyTypeFilter === type && styles.chipTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            ['All', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Cleaning'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  serviceCategoryFilter === cat && styles.filterChipActive,
                ]}
                onPress={() => setServiceCategoryFilter(cat)}
              >
                <Text
                  style={[
                    styles.chipText,
                    serviceCategoryFilter === cat && styles.chipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Content Stream */}
      <ScrollView contentContainerStyle={styles.scrollList}>
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.crimson} />
            <Text style={{ marginTop: 12, color: COLORS.inkMuted }}>
              Loading verified listings from database…
            </Text>
          </View>
        ) : segment === 'rentals' ? (
          filteredProperties.length > 0 ? (
            filteredProperties.map((p) => {
              const pid = p.id || p._id || '';
              return (
                <PropertyCard
                  key={pid}
                  item={p}
                  onPress={() => onSelectProperty(pid)}
                  isSaved={isSaved(pid)}
                  onToggleSaved={() => toggleSaved(pid)}
                />
              );
            })
          ) : (
            <EmptyState
              icon={<Text style={{ fontSize: 32 }}>🏡</Text>}
              title="No rental listings available"
              description="New rental properties and PGs will appear here as owners publish them."
              actionLabel="Reset Search"
              onAction={() => {
                setQuery('');
                setPropertyTypeFilter('All');
              }}
            />
          )
        ) : filteredProviders.length > 0 ? (
          filteredProviders.map((s) => {
            const sid = s.id || (s as any)._id || '';
            return (
              <ProviderCard
                key={sid}
                item={s}
                onPress={() => onSelectProvider(sid)}
                onBook={() => onSelectProvider(sid)}
              />
            );
          })
        ) : (
          <EmptyState
            icon={<Text style={{ fontSize: 32 }}>🔧</Text>}
            title="No providers available"
            description="Verified local trade specialists will appear here after approval."
            actionLabel="Reset Filter"
            onAction={() => {
              setQuery('');
              setServiceCategoryFilter('All');
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  topSegmentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: COLORS.white,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.full,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.crimson,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.inkMuted,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  searchBoxWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink,
  },
  clearBtn: {
    fontSize: 14,
    color: COLORS.inkMuted,
    padding: 4,
  },
  chipsRow: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.crimsonTint,
    borderColor: COLORS.crimson,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkMuted,
  },
  chipTextActive: {
    color: COLORS.crimson,
  },
  scrollList: {
    padding: 16,
    paddingBottom: 40,
  },
});
