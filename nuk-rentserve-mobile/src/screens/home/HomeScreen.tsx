// Main Home Screen with Quick Actions, Location Bar, Banner & Highlights

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Logo } from '../../components/common/Logo';
import { Badge } from '../../components/common/Badge';
import { PropertyCard, PropertyCardItem } from '../../components/rentals/PropertyCard';
import { ProviderCard, ProviderCardItem } from '../../components/services/ProviderCard';
import { rentalApi } from '../../api/rentalApi';
import { serviceApi } from '../../api/serviceApi';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { useActiveRide } from '../../context/ActiveRideContext';
import { CONFIG } from '../../constants/config';

interface HomeScreenProps {
  onNavigateAuto: () => void;
  onNavigateCarTrips: () => void;
  onNavigateGoodsVan: () => void;
  onNavigateRentals: () => void;
  onNavigateServices: () => void;
  onSelectProperty: (id: string) => void;
  onSelectProvider: (id: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateAuto,
  onNavigateCarTrips,
  onNavigateGoodsVan,
  onNavigateRentals,
  onNavigateServices,
  onSelectProperty,
  onSelectProvider,
}) => {
  const { language, setLanguage, t } = useLocalization();
  const { user, isSaved, toggleSaved } = useAuth();
  const { cityName, setCityName } = useLocationContext();
  const { phase, activeBooking } = useActiveRide();

  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [liveProperties, setLiveProperties] = useState<PropertyCardItem[]>([]);
  const [liveProviders, setLiveProviders] = useState<ProviderCardItem[]>([]);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [propsRes, provsRes] = await Promise.allSettled([
          rentalApi.getProperties({ limit: 4 }),
          serviceApi.getServices(),
        ]);
        if (propsRes.status === 'fulfilled' && Array.isArray(propsRes.value)) {
          setLiveProperties(
            propsRes.value.slice(0, 3).map((p: any) => ({
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
          setLiveProviders(
            provsRes.value.slice(0, 3).map((s: any) => ({
              id: s._id || s.id,
              name: s.providerId?.name || s.title || 'Professional',
              trade: s.categoryId?.name || s.category || 'General Service',
              area: s.location || 'Bagalkot',
              rating: 5.0,
              ratingCount: 1,
              rate: s.priceRange?.min ? `₹${s.priceRange.min}` : '₹350',
              rateUnit: s.payUnit ? `/${s.payUnit}` : '/visit',
              photo: s.images?.[0]?.url || s.providerId?.profileImage?.url,
              phone: s.providerId?.phone,
              isAvailable: s.availability !== false,
            }))
          );
        }
      } catch (e) {
        // Handled silently
      }
    }
    loadHomeData();
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'kn' : 'en');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Top Bar: City Selector & Language Toggle */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Logo size={36} />
          <TouchableOpacity
            style={styles.citySelector}
            onPress={() => setCityPickerOpen(!cityPickerOpen)}
          >
            <Text style={styles.cityLabel}>{t('location', 'ನಗರ')}</Text>
            <Text style={styles.cityName}>📍 {cityName} ▼</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={toggleLanguage} style={styles.langToggle}>
          <Text style={styles.langToggleText}>
            {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* City Dropdown Selector */}
      {cityPickerOpen && (
        <View style={[styles.cityDropdown, SHADOWS.pop]}>
          <Text style={styles.cityDropTitle}>
            {t('Select City', 'ನಗರವನ್ನು ಆಯ್ಕೆಮಾಡಿ')}
          </Text>
          <View style={styles.cityList}>
            {CONFIG.SUPPORTED_CITIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.cityItem, cityName === c && styles.cityItemActive]}
                onPress={() => {
                  setCityName(c);
                  setCityPickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.cityItemText,
                    cityName === c && styles.cityItemTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Ride Banner (If in progress) */}
        {phase !== 'idle' && (
          <TouchableOpacity
            style={[styles.activeRideBanner, SHADOWS.card]}
            onPress={onNavigateAuto}
            activeOpacity={0.9}
          >
            <View style={styles.activeRideLeft}>
              <View style={styles.livePulse} />
              <View>
                <Text style={styles.activeRideTitle}>
                  {phase === 'searching'
                    ? t('findingDriver', 'ಆಟೋ ಚಾಲಕರನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...')
                    : t('Active Auto Trip', 'ಸಕ್ರಿಯ ಆಟೋ ಪ್ರಯಾಣ')}
                </Text>
                <Text style={styles.activeRideSub}>
                  {activeBooking?.destination || 'Destination'}
                </Text>
              </View>
            </View>
            <View style={styles.trackBtn}>
              <Text style={styles.trackBtnText}>{t('track', 'ಟ್ರ್ಯಾಕ್')} →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Karnataka Regional Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Badge tone="sun" label="ಕರ್ನಾಟಕ · KARNATAKA" />
            <Text style={styles.heroTitle}>
              {language === 'kn'
                ? 'ಬಾಡಿಗೆ, ಸೇವೆ ಮತ್ತು ಆಟೋ ಒಂದೇ ಕಡೆ'
                : 'Rentals, Local Services & Fast Auto Rides'}
            </Text>
            <Text style={styles.heroSub}>
              {language === 'kn'
                ? 'ನೇರ ನಗದು ಪಾವತಿ · 0% ಮಧ್ಯವರ್ತಿ ಕಮಿಷನ್'
                : 'Direct cash settlement · No hidden platform fee'}
            </Text>
          </View>
        </View>

        {/* Quick Actions (4 Hub Cards) */}
        <Text style={styles.sectionTitle}>
          {t('quickServices', 'ತ್ವರಿತ ಸೇವೆಗಳು')}
        </Text>
        <View style={styles.actionGrid}>
          {/* Auto Booking Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateAuto}
            style={[styles.actionCard, styles.autoCard, SHADOWS.card]}
          >
            <Text style={styles.actionEmoji}>🛺</Text>
            <Text style={styles.actionTitle}>{t('bookAuto', 'ಆಟೋ ಬುಕಿಂಗ್')}</Text>
            <Text style={styles.actionSub}>₹30 {t('base fare', 'ಮೂಲ ದರ')}</Text>
          </TouchableOpacity>

          {/* Rental Properties Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateRentals}
            style={[styles.actionCard, SHADOWS.card]}
          >
            <Text style={styles.actionEmoji}>🏡</Text>
            <Text style={styles.actionTitle}>{t('rentals', 'ಬಾಡಿಗೆ ಮನೆ/ಪಿಜಿ')}</Text>
            <Text style={styles.actionSub}>House, Room, PG</Text>
          </TouchableOpacity>

          {/* Local Services Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateServices}
            style={[styles.actionCard, SHADOWS.card]}
          >
            <Text style={styles.actionEmoji}>🔧</Text>
            <Text style={styles.actionTitle}>{t('localServices', 'ದೈನಂದಿನ ಸೇವೆ')}</Text>
            <Text style={styles.actionSub}>Electrician, Plumber</Text>
          </TouchableOpacity>

          {/* Car & Goods Van Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateCarTrips}
            style={[styles.actionCard, SHADOWS.card]}
          >
            <Text style={styles.actionEmoji}>🚐</Text>
            <Text style={styles.actionTitle}>{t('carTrips', 'ಕಾರು & ವ್ಯಾನ್')}</Text>
            <Text style={styles.actionSub}>Outstation / Shifting</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Rentals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t('featuredRentals', 'ಪ್ರಮುಖ ಬಾಡಿಗೆ ಆಸ್ತಿಗಳು')}
          </Text>
          <TouchableOpacity onPress={onNavigateRentals}>
            <Text style={styles.viewAllText}>{t('viewAll', 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ')} →</Text>
          </TouchableOpacity>
        </View>

        {liveProperties.length > 0 ? (
          liveProperties.map((property) => (
            <PropertyCard
              key={property.id}
              item={property}
              onPress={() => onSelectProperty(property.id || '')}
              isSaved={isSaved(property.id || '')}
              onToggleSaved={() => toggleSaved(property.id || '')}
            />
          ))
        ) : (
          <Text style={{ color: COLORS.inkMuted, marginHorizontal: 16, marginVertical: 8 }}>
            No rental listings available right now.
          </Text>
        )}

        {/* Top Verified Service Providers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t('topProviders', 'ಪರಿಶೀಲಿತ ಸೇವಾ ಒದಗಿಸುವವರು')}
          </Text>
          <TouchableOpacity onPress={onNavigateServices}>
            <Text style={styles.viewAllText}>{t('viewAll', 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ')} →</Text>
          </TouchableOpacity>
        </View>

        {liveProviders.length > 0 ? (
          liveProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              item={provider}
              onPress={() => onSelectProvider(provider.id)}
              onBook={() => onSelectProvider(provider.id)}
            />
          ))
        ) : (
          <Text style={{ color: COLORS.inkMuted, marginHorizontal: 16, marginVertical: 8 }}>
            No verified providers available right now.
          </Text>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  citySelector: {
    marginLeft: 12,
  },
  cityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
  },
  cityName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  langToggle: {
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
  },
  cityDropdown: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cityDropTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 10,
  },
  cityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityItem: {
    backgroundColor: COLORS.paper,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cityItemActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  cityItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  cityItemTextActive: {
    color: COLORS.white,
  },
  scroll: {
    padding: 16,
  },
  activeRideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.brand,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
  },
  activeRideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
    marginRight: 10,
  },
  activeRideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  activeRideSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 1,
  },
  trackBtn: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  heroBanner: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 20,
  },
  heroLeft: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 8,
    lineHeight: 26,
  },
  heroSub: {
    fontSize: 12,
    color: COLORS.sun,
    fontWeight: '600',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.brand,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  autoCard: {
    backgroundColor: COLORS.sunTint,
    borderColor: COLORS.sun,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  actionSub: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
    fontWeight: '600',
  },
});
