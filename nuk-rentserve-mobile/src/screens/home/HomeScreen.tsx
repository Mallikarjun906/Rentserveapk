// Main Home Screen with Balanced Services, Rentals & Transport Hub, Real MongoDB Data & Lucide Icons

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Navigation,
  Search,
  X,
  Car,
  Home as HomeIcon,
  Wrench,
  Truck,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react-native';
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
  const insets = useSafeAreaInsets();
  const {
    cityName,
    setCityName,
    isDefaultFallback,
    detectCurrentLocation,
    isLoadingLocation,
    detectedAddress,
  } = useLocationContext();
  const { phase, activeBooking } = useActiveRide();

  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [liveProperties, setLiveProperties] = useState<PropertyCardItem[]>([]);
  const [liveProviders, setLiveProviders] = useState<ProviderCardItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      setLoadingData(true);
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
      } finally {
        setLoadingData(false);
      }
    }
    loadHomeData();
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'kn' : 'en');
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with Safe-Area Clearance */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.topBarLeft}>
          <Logo size={36} />
          <TouchableOpacity
            style={styles.citySelector}
            onPress={() => setCityPickerOpen(!cityPickerOpen)}
            activeOpacity={0.7}
          >
            <View style={styles.cityLabelRow}>
              <MapPin size={11} color={COLORS.mute} strokeWidth={2.2} />
              <Text style={styles.cityLabel}>
                {isDefaultFallback ? `${t('defaultArea', 'ಮೂಲ ಪ್ರದೇಶ')}` : 'GPS'}
              </Text>
            </View>
            <Text style={styles.cityName} numberOfLines={1}>
              {cityName} ▼
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            onPress={() => detectCurrentLocation(true)}
            style={styles.gpsDetectBtn}
            disabled={isLoadingLocation}
            activeOpacity={0.8}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={COLORS.brand} />
            ) : (
              <>
                <Navigation size={13} color={COLORS.brand} strokeWidth={2.4} />
                <Text style={styles.gpsDetectText}>GPS</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleLanguage} style={styles.langToggle} activeOpacity={0.8}>
            <Text style={styles.langToggleText}>
              {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* City Dropdown Selector */}
      {cityPickerOpen && (
        <View style={[styles.cityDropdown, SHADOWS.pop]}>
          <View style={styles.cityDropdownHeader}>
            <Text style={styles.cityDropTitle}>
              {t('Select Service Area', 'ಸೇವಾ ಪ್ರದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ')}
            </Text>
            <TouchableOpacity onPress={() => setCityPickerOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={COLORS.mute} />
            </TouchableOpacity>
          </View>

          {/* Quick GPS Location Detection Button */}
          <TouchableOpacity
            style={styles.useGpsTile}
            onPress={async () => {
              await detectCurrentLocation(false);
              setCityPickerOpen(false);
            }}
          >
            <View style={styles.gpsIconCircle}>
              <Navigation size={16} color={COLORS.brand} />
            </View>
            <View style={styles.useGpsInfo}>
              <Text style={styles.useGpsTitle}>
                {t('Detect My Current GPS Location', 'ನನ್ನ ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ಪತ್ತೆಮಾಡಿ')}
              </Text>
              <Text style={styles.useGpsSub} numberOfLines={1}>
                {detectedAddress || 'Automatic Android GPS detection'}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.manualAreaLabel}>
            {t('Or Select Karnataka District / Town:', 'ಅಥವಾ ಜಿಲ್ಲೆ ಆಯ್ಕೆಮಾಡಿ:')}
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
              <Text style={styles.trackBtnText}>{t('track', 'ಟ್ರ್ಯಾಕ್')}</Text>
              <ArrowRight size={14} color={COLORS.brand} />
            </View>
          </TouchableOpacity>
        )}

        {/* Search Bar Redirecting to Explore */}
        <TouchableOpacity
          style={[styles.searchBar, SHADOWS.card]}
          onPress={onNavigateRentals}
          activeOpacity={0.85}
        >
          <Search size={18} color={COLORS.mute} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>
            {language === 'kn' ? 'ಮನೆ, ಪಿಜಿ, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಅಥವಾ ಆಟೋ ಹುಡುಕಿ...' : 'Search rentals, local services or rides...'}
          </Text>
        </TouchableOpacity>

        {/* Brand Banner with Karnataka Heritage Palette */}
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

        {/* 4 Main Service Cards */}
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
            <View style={[styles.cardIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Car size={24} color={COLORS.brand} strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>{t('bookAuto', 'ಆಟೋ ಬುಕಿಂಗ್')}</Text>
            <Text style={styles.actionSub}>₹30 {t('base fare', 'ಮೂಲ ದರ')}</Text>
          </TouchableOpacity>

          {/* Rental Properties Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateRentals}
            style={[styles.actionCard, SHADOWS.card]}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
              <HomeIcon size={24} color="#D97706" strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>{t('rentals', 'ಬಾಡಿಗೆ ಮನೆ/ಪಿಜಿ')}</Text>
            <Text style={styles.actionSub}>House, Room, PG</Text>
          </TouchableOpacity>

          {/* Local Services Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateServices}
            style={[styles.actionCard, SHADOWS.card]}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#E0E7FF' }]}>
              <Wrench size={24} color="#4F46E5" strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>{t('localServices', 'ದೈನಂದಿನ ಸೇವೆ')}</Text>
            <Text style={styles.actionSub}>Electrician, Plumber</Text>
          </TouchableOpacity>

          {/* Car & Goods Van Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateCarTrips}
            style={[styles.actionCard, SHADOWS.card]}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#D1FAE5' }]}>
              <Truck size={24} color="#059669" strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>{t('carTrips', 'ಕಾರು & ವ್ಯಾನ್')}</Text>
            <Text style={styles.actionSub}>Outstation / Shifting</Text>
          </TouchableOpacity>
        </View>

        {/* Transport Hub Showcase */}
        <View style={styles.transportSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {language === 'kn' ? 'ಸಾರಿಗೆ ಮತ್ತು ಸರಕು ವಾಹನಗಳು' : 'Transport & Freight Hub'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {language === 'kn' ? 'ಸ್ಥಳೀಯ ಆಟೋ, ದೂರದ ಪ್ರಯಾಣದ ಕಾರು & ಶಿಫ್ಟಿಂಗ್ ವ್ಯಾನ್' : 'Local autos, outstation cars & shifting goods vans'}
              </Text>
            </View>
          </View>

          <View style={styles.transportGrid}>
            <TouchableOpacity
              style={[styles.transportPillCard, SHADOWS.card]}
              onPress={onNavigateAuto}
              activeOpacity={0.85}
            >
              <Car size={20} color={COLORS.brand} />
              <View style={styles.transportPillText}>
                <Text style={styles.pillTitle}>Auto Instant</Text>
                <Text style={styles.pillSub}>Direct GPS ride</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.transportPillCard, SHADOWS.card]}
              onPress={onNavigateCarTrips}
              activeOpacity={0.85}
            >
              <Car size={20} color="#059669" />
              <View style={styles.transportPillText}>
                <Text style={styles.pillTitle}>Car Outstation</Text>
                <Text style={styles.pillSub}>Sedan / SUV trips</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.transportPillCard, SHADOWS.card]}
              onPress={onNavigateGoodsVan}
              activeOpacity={0.85}
            >
              <Truck size={20} color="#D97706" />
              <View style={styles.transportPillText}>
                <Text style={styles.pillTitle}>Goods Van</Text>
                <Text style={styles.pillSub}>Household shifting</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Rentals Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {t('featuredRentals', 'ಪ್ರಮುಖ ಬಾಡಿಗೆ ಆಸ್ತಿಗಳು')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {language === 'kn' ? 'ಪರಿಶೀಲಿಸಿದ ಮನೆಗಳು ಮತ್ತು ಪಿಜಿಗಳು' : 'Verified houses, student rooms & shops'}
            </Text>
          </View>
          <TouchableOpacity onPress={onNavigateRentals} style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>{t('viewAll', 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ')}</Text>
            <ArrowRight size={13} color={COLORS.brand} />
          </TouchableOpacity>
        </View>

        {loadingData ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading listings...</Text>
          </View>
        ) : liveProperties.length > 0 ? (
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
          <View style={styles.emptyCard}>
            <HomeIcon size={28} color={COLORS.muteLight} />
            <Text style={styles.emptyTitle}>No rental listings available</Text>
            <Text style={styles.emptySub}>New properties from Bagalkot and Hubballi are added daily.</Text>
          </View>
        )}

        {/* Top Verified Service Providers */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {t('topProviders', 'ಪರಿಶೀಲಿತ ಸೇವಾ ಒದಗಿಸುವವರು')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {language === 'kn' ? 'ವಿಶ್ವಾಸಾರ್ಹ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಮತ್ತು ಪ್ಲಂಬರ್' : 'Electricians, plumbers and home technicians'}
            </Text>
          </View>
          <TouchableOpacity onPress={onNavigateServices} style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>{t('viewAll', 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ')}</Text>
            <ArrowRight size={13} color={COLORS.brand} />
          </TouchableOpacity>
        </View>

        {loadingData ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={COLORS.brand} />
            <Text style={styles.loadingText}>Loading providers...</Text>
          </View>
        ) : liveProviders.length > 0 ? (
          liveProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              item={provider}
              onPress={() => onSelectProvider(provider.id)}
              onBook={() => onSelectProvider(provider.id)}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Wrench size={28} color={COLORS.muteLight} />
            <Text style={styles.emptyTitle}>No service providers available</Text>
            <Text style={styles.emptySub}>Local verified technicians will be listed shortly.</Text>
          </View>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  citySelector: {
    marginLeft: 10,
  },
  cityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandTint,
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  gpsDetectText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
  },
  langToggle: {
    backgroundColor: COLORS.muteLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  cityDropdown: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    zIndex: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cityDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cityDropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  useGpsTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandTint,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  gpsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  useGpsInfo: {
    flex: 1,
  },
  useGpsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand,
  },
  useGpsSub: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },
  manualAreaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
    marginBottom: 8,
  },
  cityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityItem: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cityItemActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
  },
  cityItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  cityItemTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  scroll: {
    padding: 16,
  },
  activeRideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 14,
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
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  activeRideSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 1,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: COLORS.mute,
    fontWeight: '500',
    flex: 1,
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
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 10,
    lineHeight: 25,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.sun,
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  autoCard: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFFBFB',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink,
    textAlign: 'center',
  },
  actionSub: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.mute,
    marginTop: 2,
    textAlign: 'center',
  },
  transportSection: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.xl,
    padding: 14,
    marginBottom: 18,
  },
  transportGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  transportPillCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  transportPillText: {
    flex: 1,
  },
  pillTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink,
  },
  pillSub: {
    fontSize: 9,
    color: COLORS.mute,
  },
  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.mute,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    padding: 24,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 4,
    textAlign: 'center',
  },
});
