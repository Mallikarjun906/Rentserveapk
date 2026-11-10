// Explore Screen (Connected to real MongoDB backend APIs for Rentals and Services)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Wrench,
  Search,
  X,
  Filter,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { PropertyCard, PropertyCardItem } from '../../components/rentals/PropertyCard';
import { ProviderCard, ProviderCardItem } from '../../components/services/ProviderCard';
import { EmptyState } from '../../components/common/EmptyState';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { rentalApi } from '../../api/rentalApi';
import { serviceApi } from '../../api/serviceApi';
import { providerApi } from '../../api/providerApi';

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
  const insets = useSafeAreaInsets();

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
        const [propsRes, provsRes, publicProvidersRes] = await Promise.allSettled([
          rentalApi.getProperties(),
          serviceApi.getServices(),
          providerApi.getPublicProviders(),
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

        const gatheredProviders: ProviderCardItem[] = [];
        const seenIds = new Set<string>();

        // 1. From service listings
        if (provsRes.status === 'fulfilled' && Array.isArray(provsRes.value)) {
          provsRes.value.forEach((s: any) => {
            const pid = s._id || s.id;
            if (pid && !seenIds.has(pid)) {
              seenIds.add(pid);
              gatheredProviders.push({
                id: pid,
                name: s.providerId?.name || s.title || 'Professional Provider',
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
              });
            }
          });
        }

        // 2. From approved public providers
        if (publicProvidersRes.status === 'fulfilled' && Array.isArray(publicProvidersRes.value)) {
          publicProvidersRes.value.forEach((p: any) => {
            const pid = p.id || p._id;
            if (pid && !seenIds.has(pid)) {
              seenIds.add(pid);
              gatheredProviders.push({
                id: pid,
                name: p.name || 'Professional Provider',
                trade: p.trade || p.category || 'Service',
                area: p.area || 'Bagalkot',
                rating: p.rating || 4.8,
                ratingCount: p.reviews || 1,
                reviews: p.reviews || 1,
                price: p.price || '₹350',
                rate: p.rate || '₹350',
                rateUnit: p.rateUnit || '/visit',
                photo: p.photo,
                phone: p.phone,
                isAvailable: p.isAvailable !== false,
              });
            }
          });
        }

        setProviders(gatheredProviders);
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
    <View style={styles.container}>
      {/* Top Segmented Switcher with Inset Clearance */}
      <View style={[styles.topSegmentContainer, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, segment === 'rentals' && styles.segmentBtnActive]}
            onPress={() => setSegment('rentals')}
            activeOpacity={0.8}
          >
            <Home
              size={16}
              color={segment === 'rentals' ? COLORS.white : COLORS.mute}
            />
            <Text
              style={[
                styles.segmentText,
                segment === 'rentals' && styles.segmentTextActive,
              ]}
            >
              {t('rentals', 'ಬಾಡಿಗೆ ಮನೆಗಳು')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, segment === 'services' && styles.segmentBtnActive]}
            onPress={() => setSegment('services')}
            activeOpacity={0.8}
          >
            <Wrench
              size={16}
              color={segment === 'services' ? COLORS.white : COLORS.mute}
            />
            <Text
              style={[
                styles.segmentText,
                segment === 'services' && styles.segmentTextActive,
              ]}
            >
              {t('localServices', 'ಸ್ಥಳೀಯ ಸೇವೆಗಳು')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBoxWrapper}>
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.mute} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              segment === 'rentals'
                ? t('searchRentals', 'ಹುಡುಕಿ: 2 BHK, PG, ವಿದ್ಯಾಗಿರಿ...')
                : t('searchServices', 'ಹುಡುಕಿ: ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಪ್ಲಂಬರ್...')
            }
            placeholderTextColor={COLORS.mute}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={COLORS.mute} />
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
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={{ marginTop: 12, color: COLORS.mute }}>
              Loading verified listings from database…
            </Text>
          </View>
        ) : segment === 'rentals' ? (
          filteredProperties.length === 0 ? (
            <EmptyState
              title="No rental listings found"
              description={
                query
                  ? `No properties matching "${query}". Try another search term.`
                  : 'No verified rental properties available in this category yet.'
              }
              actionLabel="Clear Filter"
              onAction={() => {
                setQuery('');
                setPropertyTypeFilter('All');
              }}
            />
          ) : (
            filteredProperties.map((prop) => {
              const pId = prop.id || (prop as any)._id || '';
              return (
                <PropertyCard
                  key={pId}
                  item={prop}
                  onPress={() => onSelectProperty(pId)}
                  isSaved={isSaved(pId)}
                  onToggleSaved={() => toggleSaved(pId)}
                />
              );
            })
          )
        ) : filteredProviders.length === 0 ? (
          <EmptyState
            title="No service providers found"
            description={
              query
                ? `No service providers matching "${query}". Try searching for Electrician, Plumber, etc.`
                : 'No verified service providers available in this category yet.'
            }
            actionLabel="Clear Filter"
            onAction={() => {
              setQuery('');
              setServiceCategoryFilter('All');
            }}
          />
        ) : (
          filteredProviders.map((prov) => {
            const pvId = prov.id || (prov as any)._id || '';
            return (
              <ProviderCard
                key={pvId}
                item={prov}
                onPress={() => onSelectProvider(pvId)}
                onBook={() => onSelectProvider(pvId)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  topSegmentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.full,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.brand,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.mute,
  },
  segmentTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  searchBoxWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 46,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink,
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
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
  },
  chipTextActive: {
    color: COLORS.brand,
  },
  scrollList: {
    padding: 16,
    paddingBottom: 60,
  },
});
