// NUK RentServe - Customer Homepage Redesign (Premium White Glassmorphic Luxe Theme)
// Bilingual English & Kannada, Direct Auto Booking, Three Pillars Hub, Real MongoDB Data

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Platform,
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
  Bell,
  User,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  Banknote,
  Flame,
  Zap,
  PhoneCall,
  RotateCw,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Logo } from '../../components/common/Logo';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { PropertyCard, PropertyCardItem } from '../../components/rentals/PropertyCard';
import { ProviderCard, ProviderCardItem } from '../../components/services/ProviderCard';
import { rentalApi } from '../../api/rentalApi';
import { serviceApi } from '../../api/serviceApi';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { useActiveRide } from '../../context/ActiveRideContext';
import { CONFIG } from '../../constants/config';
import { calculateAutoFare } from '../../utils/fareCalculator';

interface HomeScreenProps {
  onNavigateAuto: () => void;
  onNavigateCarTrips: () => void;
  onNavigateGoodsVan: () => void;
  onNavigateRentals: () => void;
  onNavigateServices: () => void;
  onSelectProperty: (id: string) => void;
  onSelectProvider: (id: string) => void;
  onNavigateProfile?: () => void;
  onNavigateBookings?: () => void;
  onNavigateMessages?: () => void;
}

// Regional destination hubs for quick 1-tap auto ride estimation
const QUICK_DESTINATIONS = [
  { name: 'Bus Stand', kn: 'ಬಸ್ ನಿಲ್ದಾಣ', km: 2.2 },
  { name: 'Railway Station', kn: 'ರೈಲ್ವೆ ನಿಲ್ದಾಣ', km: 4.5 },
  { name: 'Market Road', kn: 'ಮಾರ್ಕೆಟ್ ರಸ್ತೆ', km: 1.8 },
  { name: 'Navanagar Sector 10', kn: 'ನವನಗರ ಸೆಕ್ಟರ್ 10', km: 3.6 },
  { name: 'District Hospital', kn: 'ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆ', km: 3.0 },
  { name: 'College Campus', kn: 'ಕಾಲೇಜು ಕ್ಯಾಂಪಸ್', km: 2.8 },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateAuto,
  onNavigateCarTrips,
  onNavigateGoodsVan,
  onNavigateRentals,
  onNavigateServices,
  onSelectProperty,
  onSelectProvider,
  onNavigateProfile,
  onNavigateBookings,
  onNavigateMessages,
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

  const {
    phase,
    activeBooking,
    pickupName,
    setPickupName,
    destName,
    setDestName,
    setEstimatedKm,
    suggestedFare,
    offeredFare,
    adjustOffer,
    startSearch,
  } = useActiveRide();

  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [liveProperties, setLiveProperties] = useState<PropertyCardItem[]>([]);
  const [liveProviders, setLiveProviders] = useState<ProviderCardItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Direct Auto Booking Local States
  const [autoRideType, setAutoRideType] = useState<'standard' | 'shared' | 'goods'>('standard');
  const [localPickup, setLocalPickup] = useState('');
  const [localDestination, setLocalDestination] = useState('');
  const [selectedKm, setSelectedKm] = useState(2.5);
  const [showBargainRow, setShowBargainRow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync initial pickup address from GPS location context
  useEffect(() => {
    const bestPickup = detectedAddress || `${cityName}, Karnataka`;
    if (!pickupName || pickupName === '') {
      setPickupName(bestPickup);
      setLocalPickup(bestPickup);
    } else {
      setLocalPickup(pickupName);
    }
  }, [detectedAddress, cityName, pickupName]);

  // Load MongoDB real properties and service providers
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
              location: p.location || p.address || cityName,
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
              area: s.location || cityName,
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
  }, [cityName]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'kn' : 'en');
  };

  // Direct Auto destination selection handler
  const handleSelectDestination = (dest: { name: string; kn: string; km: number }) => {
    const name = language === 'kn' ? dest.kn : dest.name;
    setLocalDestination(name);
    setDestName(name);
    setSelectedKm(dest.km);
    setEstimatedKm(dest.km);
  };

  // Direct Auto start booking flow
  const handleDirectAutoBook = async () => {
    const finalPickup = localPickup.trim() || detectedAddress || `${cityName}, Karnataka`;
    const finalDest = localDestination.trim() || 'Bagalkot Bus Stand';
    setPickupName(finalPickup);
    setDestName(finalDest);
    setEstimatedKm(selectedKm);
    try {
      await startSearch();
      onNavigateAuto();
    } catch {
      onNavigateAuto();
    }
  };

  // Calculated display fare based on km and ride type
  const baseCalculatedFare = calculateAutoFare(selectedKm);
  const typeMultiplier = autoRideType === 'shared' ? 0.65 : autoRideType === 'goods' ? 1.3 : 1.0;
  const currentEstFare = Math.round(Math.max(CONFIG.AUTO_FARE.baseFare, baseCalculatedFare * typeMultiplier));
  const finalDisplayFare = offeredFare > 0 ? offeredFare : currentEstFare;

  return (
    <View style={styles.container}>
      {/* Top Glass Bar with Safe-Area Clearance */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.topBarLeft}>
          <Logo size={36} />
          {/* Dual-Segment GPS Quick-Pill */}
          <TouchableOpacity
            style={styles.gpsPill}
            onPress={() => setCityPickerOpen(!cityPickerOpen)}
            activeOpacity={0.8}
            accessibilityLabel="Select service city"
          >
            <View style={styles.gpsPulseDot} />
            <Text style={styles.gpsPillText} numberOfLines={1}>
              {cityName}
            </Text>
            <ChevronRight size={13} color={COLORS.mute} style={{ transform: [{ rotate: '90deg' }] }} />
          </TouchableOpacity>
        </View>

        <View style={styles.topBarRight}>
          {/* Refresh GPS Button */}
          <TouchableOpacity
            onPress={() => detectCurrentLocation(true)}
            style={styles.gpsRefreshBtn}
            disabled={isLoadingLocation}
            activeOpacity={0.8}
            accessibilityLabel="Detect GPS Location"
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={COLORS.brand} />
            ) : (
              <Navigation size={13} color={COLORS.brand} strokeWidth={2.4} />
            )}
            <Text style={styles.gpsRefreshText}>GPS</Text>
          </TouchableOpacity>

          {/* Bilingual Language Switch Pill */}
          <TouchableOpacity
            onPress={toggleLanguage}
            style={styles.langPill}
            activeOpacity={0.8}
            accessibilityLabel="Switch language"
          >
            <Text style={styles.langPillText}>
              {language === 'en' ? 'ಕನ್ನಡ' : 'ENG'}
            </Text>
          </TouchableOpacity>

          {/* Profile / Notification Action */}
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={onNavigateProfile || onNavigateBookings}
            activeOpacity={0.8}
            accessibilityLabel="Profile"
          >
            {user?.name ? (
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            ) : (
              <User size={16} color={COLORS.ink} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* City Dropdown Selector Overlay */}
      {cityPickerOpen && (
        <View style={[styles.cityDropdown, SHADOWS.luxe]}>
          <View style={styles.cityDropdownHeader}>
            <View>
              <Text style={styles.cityDropTitle}>
                {language === 'kn' ? 'ಸೇವಾ ಪ್ರದೇಶ ಆಯ್ಕೆಮಾಡಿ' : 'Select Service Area'}
              </Text>
              <Text style={styles.cityDropSub}>
                {language === 'kn' ? 'ಕರ್ನಾಟಕದ ಪ್ರಮುಖ ನಗರಗಳು' : 'Karnataka Regional Hubs'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCityPickerOpen(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
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
            activeOpacity={0.85}
          >
            <View style={styles.gpsIconCircle}>
              <Navigation size={16} color={COLORS.brand} strokeWidth={2.4} />
            </View>
            <View style={styles.useGpsInfo}>
              <Text style={styles.useGpsTitle}>
                {language === 'kn' ? 'ನನ್ನ ಪ್ರಸ್ತುತ ಜಿಪಿಎಸ್ ಸ್ಥಳ ಪತ್ತೆಮಾಡಿ' : 'Detect My Exact GPS Location'}
              </Text>
              <Text style={styles.useGpsSub} numberOfLines={1}>
                {detectedAddress || 'Automatic Android GPS detection'}
              </Text>
            </View>
            <ChevronRight size={16} color={COLORS.brand} />
          </TouchableOpacity>

          <Text style={styles.manualAreaLabel}>
            {language === 'kn' ? 'ಅಥವಾ ಜಿಲ್ಲೆ / ನಗರವನ್ನು ಆಯ್ಕೆಮಾಡಿ:' : 'Or Select Karnataka District / Town:'}
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
        {/* Active Ride Banner (When Ride In Progress) */}
        {phase !== 'idle' && (
          <TouchableOpacity
            style={[styles.activeRideBanner, SHADOWS.card]}
            onPress={onNavigateAuto}
            activeOpacity={0.9}
          >
            <View style={styles.activeRideLeft}>
              <View style={styles.livePulseAnimation} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.activeRideTitle}>
                    {phase === 'searching'
                      ? language === 'kn' ? 'ಆಟೋ ಚಾಲಕರನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...' : 'Finding Nearby Auto Drivers...'
                      : language === 'kn' ? 'ಸಕ್ರಿಯ ಆಟೋ ಪ್ರಯಾಣ' : 'Active Auto Ride'}
                  </Text>
                  <Badge tone="brand" label="LIVE" />
                </View>
                <Text style={styles.activeRideSub} numberOfLines={1}>
                  {activeBooking?.destination || destName || 'Destination'} · ₹{activeBooking?.fare || finalDisplayFare}
                </Text>
              </View>
            </View>
            <View style={styles.trackBtn}>
              <Text style={styles.trackBtnText}>{language === 'kn' ? 'ಟ್ರ್ಯಾಕ್' : 'Track'}</Text>
              <ArrowRight size={13} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        )}

        {/* Welcome & Personalized Greeting Header */}
        <View style={styles.greetingSection}>
          <View>
            <Text style={styles.greetingTitle}>
              {language === 'kn' ? 'ನಮಸ್ಕಾರ' : 'Namaste'}, {user?.name ? user.name.split(' ')[0] : 'Member'}
            </Text>
            <Text style={styles.greetingSub}>
              {language === 'kn'
                ? `${cityName} ನಲ್ಲಿ ಬಾಡಿಗೆ, ಸೇವೆ & ಆಟೋ · 0% ಕಮಿಷನ್`
                : `Karnataka's 0% Commission Platform · ${cityName}`}
            </Text>
          </View>
          <View style={styles.karnatakaTag}>
            <Text style={styles.karnatakaTagText}>KARNATAKA</Text>
          </View>
        </View>

        {/* Global Search Glass Bar */}
        <TouchableOpacity
          style={[styles.searchPill, SHADOWS.soft]}
          onPress={onNavigateRentals}
          activeOpacity={0.9}
        >
          <Search size={18} color={COLORS.brand} strokeWidth={2.2} />
          <Text style={styles.searchPlaceholder}>
            {language === 'kn'
              ? 'ಮನೆ, ಪಿಜಿ, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಅಥವಾ ಆಟೋ ಹುಡುಕಿ...'
              : 'Search rentals, plumbers, electricians, autos...'}
          </Text>
          <View style={styles.searchFilterBtn}>
            <SlidersHorizontal size={14} color={COLORS.mute} />
          </View>
        </TouchableOpacity>

        {/* Inset Trending Quick-Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingScroll}
        >
          <TouchableOpacity
            style={styles.trendChip}
            onPress={onNavigateServices}
            activeOpacity={0.8}
          >
            <Zap size={12} color="#D97706" />
            <Text style={styles.trendChipText}>{language === 'kn' ? 'ಎಸಿ ರಿಪೇರಿ' : 'AC Repair'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.trendChip}
            onPress={onNavigateRentals}
            activeOpacity={0.8}
          >
            <HomeIcon size={12} color={COLORS.brand} />
            <Text style={styles.trendChipText}>{language === 'kn' ? '2 BHK ಮನೆ' : '2 BHK House'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.trendChip}
            onPress={onNavigateAuto}
            activeOpacity={0.8}
          >
            <Car size={12} color={COLORS.ok} />
            <Text style={styles.trendChipText}>{language === 'kn' ? 'ಆಟೋ ಬುಕಿಂಗ್' : 'Auto Stand'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.trendChip}
            onPress={onNavigateServices}
            activeOpacity={0.8}
          >
            <Wrench size={12} color="#4F46E5" />
            <Text style={styles.trendChipText}>{language === 'kn' ? 'ಪ್ಲಂಬರ್' : 'Plumber'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.trendChip}
            onPress={onNavigateGoodsVan}
            activeOpacity={0.8}
          >
            <Truck size={12} color="#059669" />
            <Text style={styles.trendChipText}>{language === 'kn' ? 'ಶಿಫ್ಟಿಂಗ್ ವ್ಯಾನ್' : 'Van Shifting'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DIRECT AUTO BOOKING SECTION (HIGH PRIORITY NEAR TOP)                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={[styles.directAutoCard, SHADOWS.card]}>
          {/* Card Header with Karnataka Fare Pill */}
          <View style={styles.directAutoHeader}>
            <View style={styles.directAutoTitleRow}>
              <View style={styles.autoIconCircle}>
                <Car size={18} color={COLORS.white} strokeWidth={2.4} />
              </View>
              <View>
                <Text style={styles.directAutoTitle}>
                  {language === 'kn' ? 'ತ್ವರಿತ ಆಟೋ ಬುಕಿಂಗ್' : 'Book an Auto Directly'}
                </Text>
                <Text style={styles.directAutoSub}>
                  {language === 'kn' ? 'ನೇರ ನಗದು ಪಾವತಿ · ಚಾಲಕರಿಗೆ 0% ಕಮಿಷನ್' : 'Direct Cash Pay · Zero Middleman Fee'}
                </Text>
              </View>
            </View>

            <Badge tone="sun" label="₹30 BASE" />
          </View>

          {/* Location Inputs Substrate */}
          <View style={styles.locationInputGroup}>
            {/* Pickup Row */}
            <View style={styles.locRow}>
              <View style={styles.greenDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locFieldLabel}>
                  {language === 'kn' ? 'ಪ್ರಸ್ತುತ ಪಿಕಪ್ ಸ್ಥಳ (GPS)' : 'Pickup Location (GPS Auto-detected)'}
                </Text>
                <TextInput
                  style={styles.locTextInput}
                  value={localPickup}
                  onChangeText={(val) => {
                    setLocalPickup(val);
                    setPickupName(val);
                  }}
                  placeholder={language === 'kn' ? 'ಪಿಕಪ್ ಸ್ಥಳ ನಮೂದಿಸಿ' : 'Current pickup point'}
                  placeholderTextColor={COLORS.muteLight}
                />
              </View>
              <TouchableOpacity
                onPress={() => detectCurrentLocation(true)}
                style={styles.detectBtnMini}
                activeOpacity={0.7}
              >
                <RotateCw size={13} color={COLORS.brand} />
              </TouchableOpacity>
            </View>

            <View style={styles.locDivider} />

            {/* Destination Row */}
            <View style={styles.locRow}>
              <View style={styles.redDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locFieldLabel}>
                  {language === 'kn' ? 'ತಲುಪಬೇಕಾದ ಸ್ಥಳ' : 'Where are you going?'}
                </Text>
                <TextInput
                  style={styles.locTextInput}
                  value={localDestination}
                  onChangeText={(val) => {
                    setLocalDestination(val);
                    setDestName(val);
                  }}
                  placeholder={
                    language === 'kn'
                      ? 'ಉದಾ: ಬಸ್ ನಿಲ್ದಾಣ, ಕಾಲೇಜು...'
                      : 'e.g. Bus Stand, Station, Market...'
                  }
                  placeholderTextColor={COLORS.muteLight}
                />
              </View>
              {localDestination !== '' && (
                <TouchableOpacity
                  onPress={() => {
                    setLocalDestination('');
                    setDestName('');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={COLORS.mute} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Quick Destination Suggestion Chips */}
          <View style={styles.quickDestContainer}>
            <Text style={styles.quickDestLabel}>
              {language === 'kn' ? 'ಜನಪ್ರಿಯ ತಾಣಗಳು:' : 'Quick Karnataka Destinations:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickDestScroll}>
              {QUICK_DESTINATIONS.map((d, idx) => {
                const label = language === 'kn' ? d.kn : d.name;
                const isSelected = localDestination === label;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.destChip, isSelected && styles.destChipActive]}
                    onPress={() => handleSelectDestination(d)}
                    activeOpacity={0.8}
                  >
                    <MapPin size={11} color={isSelected ? COLORS.brand : COLORS.mute} />
                    <Text style={[styles.destChipText, isSelected && styles.destChipTextActive]}>
                      {label} ({d.km} km)
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Ride Type Selector */}
          <View style={styles.rideTypeRow}>
            <TouchableOpacity
              style={[styles.rideTypeOption, autoRideType === 'standard' && styles.rideTypeActive]}
              onPress={() => setAutoRideType('standard')}
              activeOpacity={0.8}
            >
              <Car size={16} color={autoRideType === 'standard' ? COLORS.brand : COLORS.mute} />
              <Text style={[styles.rideTypeTitle, autoRideType === 'standard' && styles.rideTypeTextActive]}>
                {language === 'kn' ? 'ಸ್ಟ್ಯಾಂಡರ್ಡ್' : 'Standard'}
              </Text>
              <Text style={styles.rideTypeSub}>1-3 Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rideTypeOption, autoRideType === 'shared' && styles.rideTypeActive]}
              onPress={() => setAutoRideType('shared')}
              activeOpacity={0.8}
            >
              <User size={16} color={autoRideType === 'shared' ? COLORS.brand : COLORS.mute} />
              <Text style={[styles.rideTypeTitle, autoRideType === 'shared' && styles.rideTypeTextActive]}>
                {language === 'kn' ? 'ಶೇರ್ಡ್' : 'Shared'}
              </Text>
              <Text style={styles.rideTypeSub}>-35% Fare</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rideTypeOption, autoRideType === 'goods' && styles.rideTypeActive]}
              onPress={() => setAutoRideType('goods')}
              activeOpacity={0.8}
            >
              <Truck size={16} color={autoRideType === 'goods' ? COLORS.brand : COLORS.mute} />
              <Text style={[styles.rideTypeTitle, autoRideType === 'goods' && styles.rideTypeTextActive]}>
                {language === 'kn' ? 'ಲಗೇಜ್' : 'Cargo'}
              </Text>
              <Text style={styles.rideTypeSub}>Small Load</Text>
            </TouchableOpacity>
          </View>

          {/* Fare Summary & Bargain Row */}
          <View style={styles.fareSummaryRow}>
            <View>
              <Text style={styles.fareEstLabel}>
                {language === 'kn' ? 'ಅಂದಾಜು ಕರ್ನಾಟಕ ಸರ್ಕಾರಿ ದರ' : 'Karnataka Meter Fare'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={styles.fareEstAmount}>₹{finalDisplayFare}</Text>
                <Text style={styles.fareEstKm}>({selectedKm} km · Direct Cash)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bargainToggleBtn}
              onPress={() => setShowBargainRow(!showBargainRow)}
              activeOpacity={0.7}
            >
              <Banknote size={14} color={COLORS.brand} />
              <Text style={styles.bargainToggleText}>
                {showBargainRow ? 'Hide Bargain' : language === 'kn' ? 'ದರ ಹೊಂದಿಸಿ' : 'Bargain (±₹5)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inline Bargain Fare Controls */}
          {showBargainRow && (
            <View style={styles.inlineBargainControls}>
              <Text style={styles.bargainRuleText}>
                {language === 'kn' ? 'ಚಾಲಕರೊಂದಿಗೆ ನ್ಯಾಯಯುತ ದರ ಹೊಂದಿಸಿ:' : 'Fair driver fare offer adjustments:'}
              </Text>
              <View style={styles.bargainBtnRow}>
                <TouchableOpacity
                  style={styles.bargainAdjustBtn}
                  onPress={() => adjustOffer(-10)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bargainAdjustText}>- ₹10</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bargainAdjustBtn}
                  onPress={() => adjustOffer(-5)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bargainAdjustText}>- ₹5</Text>
                </TouchableOpacity>
                <View style={styles.offeredFareBadge}>
                  <Text style={styles.offeredFareText}>₹{offeredFare}</Text>
                </View>
                <TouchableOpacity
                  style={styles.bargainAdjustBtn}
                  onPress={() => adjustOffer(5)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bargainAdjustText}>+ ₹5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bargainAdjustBtn}
                  onPress={() => adjustOffer(10)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bargainAdjustText}>+ ₹10</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Book Now Action Button */}
          <TouchableOpacity
            style={styles.directAutoActionBtn}
            onPress={handleDirectAutoBook}
            activeOpacity={0.88}
          >
            <View style={styles.directAutoBtnContent}>
              <Car size={18} color={COLORS.white} strokeWidth={2.4} />
              <Text style={styles.directAutoBtnText}>
                {language === 'kn'
                  ? `ಆಟೋ ಬುಕ್ ಮಾಡಿ · ₹${finalDisplayFare}`
                  : `Book Auto Now · ₹${finalDisplayFare}`}
              </Text>
            </View>
            <ArrowRight size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LIVE COMMUTE RADAR TICKER                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={[styles.radarTicker, SHADOWS.soft]}>
          <View style={styles.radarLeft}>
            <View style={styles.mintDotPulse} />
            <Text style={styles.radarText}>
              {language === 'kn'
                ? `3 ಆಟೋಗಳು ${cityName} ನಲ್ಲಿ ಸಕ್ರಿಯವಾಗಿವೆ · ಸರಾಸರಿ ಆಗಮನ 3 ನಿಮಿಷ`
                : `3 Autos live in ${cityName} · Avg arrival 3 mins`}
            </Text>
          </View>
          <Badge tone="liveMint" label="RADAR ON" />
        </View>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* THREE PILLARS SHOWCASE (SERVICES, RENTALS, TRANSPORT)                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {language === 'kn' ? 'ಮೂರು ಮುಖ್ಯ ವಿಭಾಗಗಳು' : 'The Three NUK Pillars'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {language === 'kn'
                ? 'ಸೇವೆಗಳು, ಬಾಡಿಗೆಗಳು ಮತ್ತು ಸಾರಿಗೆ — ಒಂದೇ ಸೂರಿನಡಿ'
                : 'Services, Rentals & Transport — Karnataka Unified'}
            </Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          {/* Pillar 1: Rentals */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onNavigateRentals}
            style={[styles.actionCard, SHADOWS.card]}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
              <HomeIcon size={24} color="#D97706" strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>
              {language === 'kn' ? 'ಬಾಡಿಗೆ ಮನೆ/ಪಿಜಿ' : 'Rentals & PGs'}
            </Text>
            <Text style={styles.actionSub}>0% Brokerage</Text>
          </TouchableOpacity>

          {/* Pillar 2: Local Services */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onNavigateServices}
            style={[styles.actionCard, SHADOWS.card]}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#E0E7FF' }]}>
              <Wrench size={24} color="#4F46E5" strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>
              {language === 'kn' ? 'ದೈನಂದಿನ ಸೇವೆ' : 'Home Services'}
            </Text>
            <Text style={styles.actionSub}>Electrician/Plumber</Text>
          </TouchableOpacity>

          {/* Pillar 3: Freight & Cabs */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onNavigateCarTrips}
            style={[styles.actionCard, SHADOWS.card]}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#D1FAE5' }]}>
              <Truck size={24} color="#059669" strokeWidth={2.2} />
            </View>
            <Text style={styles.actionTitle}>
              {language === 'kn' ? 'ಕಾರು & ವ್ಯಾನ್' : 'Outstation & Van'}
            </Text>
            <Text style={styles.actionSub}>Trips & Shifting</Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TRANSPORT FREIGHT HUB SHORTCUTS                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.transportSection}>
          <View style={styles.sectionHeaderInner}>
            <View>
              <Text style={styles.innerSectionTitle}>
                {language === 'kn' ? 'ಸಾರಿಗೆ ಮತ್ತು ಸರಕು ವಾಹನಗಳು' : 'Karnataka Transport Fleet'}
              </Text>
              <Text style={styles.innerSectionSub}>
                {language === 'kn' ? 'ಆಟೋ, ಕಾರುಗಳು ಮತ್ತು ಸರಕು ಸಾಗಣೆ ವಾಹನಗಳು' : 'Direct driver settlement with zero platform commissions'}
              </Text>
            </View>
          </View>

          <View style={styles.transportGrid}>
            <TouchableOpacity
              style={[styles.transportPillCard, SHADOWS.soft]}
              onPress={onNavigateAuto}
              activeOpacity={0.85}
            >
              <View style={[styles.fleetIconBadge, { backgroundColor: '#FEE2E2' }]}>
                <Car size={18} color={COLORS.brand} />
              </View>
              <View style={styles.transportPillText}>
                <Text style={styles.pillTitle}>Auto Instant</Text>
                <Text style={styles.pillSub}>Live Meter GPS</Text>
              </View>
              <ArrowRight size={13} color={COLORS.brand} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.transportPillCard, SHADOWS.soft]}
              onPress={onNavigateCarTrips}
              activeOpacity={0.85}
            >
              <View style={[styles.fleetIconBadge, { backgroundColor: '#D1FAE5' }]}>
                <Car size={18} color="#059669" />
              </View>
              <View style={styles.transportPillText}>
                <Text style={styles.pillTitle}>Car Outstation</Text>
                <Text style={styles.pillSub}>Sedan / SUV</Text>
              </View>
              <ArrowRight size={13} color="#059669" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.transportPillCard, SHADOWS.soft]}
              onPress={onNavigateGoodsVan}
              activeOpacity={0.85}
            >
              <View style={[styles.fleetIconBadge, { backgroundColor: '#FEF3C7' }]}>
                <Truck size={18} color="#D97706" />
              </View>
              <View style={styles.transportPillText}>
                <Text style={styles.pillTitle}>Goods Van</Text>
                <Text style={styles.pillSub}>Tata Ace / Bolero</Text>
              </View>
              <ArrowRight size={13} color="#D97706" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FEATURED & RECENT RENTAL LISTINGS (REAL MONGODB DATA)                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {language === 'kn' ? 'ಪ್ರಮುಖ ಬಾಡಿಗೆ ಆಸ್ತಿಗಳು' : 'Curated Rental Properties'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {language === 'kn' ? 'ಪರಿಶೀಲಿಸಿದ ಮನೆಗಳು, ರೂಮ್‌ಗಳು ಮತ್ತು ಪಿಜಿಗಳು' : 'Verified houses, student rooms & commercial spaces'}
            </Text>
          </View>
          <TouchableOpacity onPress={onNavigateRentals} style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>{language === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ' : 'View All'}</Text>
            <ArrowRight size={13} color={COLORS.brand} />
          </TouchableOpacity>
        </View>

        {loadingData ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={COLORS.brand} />
            <Text style={styles.loadingText}>
              {language === 'kn' ? 'ಆಸ್ತಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading verified properties...'}
            </Text>
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
            <Text style={styles.emptyTitle}>
              {language === 'kn' ? 'ಯಾವುದೇ ಬಾಡಿಗೆ ಆಸ್ತಿಗಳು ಲಭ್ಯವಿಲ್ಲ' : 'No Rental Listings in this City'}
            </Text>
            <Text style={styles.emptySub}>
              {language === 'kn'
                ? 'ಹೊಸ ಮನೆಗಳು ಮತ್ತು ಪಿಜಿಗಳು ಶೀಘ್ರದಲ್ಲೇ ಸೇರ್ಪಡೆಯಾಗಲಿವೆ.'
                : 'New verified rental properties are listed daily.'}
            </Text>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TOP VERIFIED LOCAL SERVICE PROVIDERS (REAL MONGODB DATA)           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {language === 'kn' ? 'ಪರಿಶೀಲಿತ ಸೇವಾ ತಜ್ಞರು' : 'Verified Local Technicians'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {language === 'kn'
                ? 'ವಿಶ್ವಾಸಾರ್ಹ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಪ್ಲಂಬರ್ ಮತ್ತು ಮೆಕ್ಯಾನಿಕ್‌ಗಳು'
                : 'Electricians, plumbers, mechanics & home technicians'}
            </Text>
          </View>
          <TouchableOpacity onPress={onNavigateServices} style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>{language === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ' : 'View All'}</Text>
            <ArrowRight size={13} color={COLORS.brand} />
          </TouchableOpacity>
        </View>

        {loadingData ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={COLORS.brand} />
            <Text style={styles.loadingText}>
              {language === 'kn' ? 'ತಜ್ಞರನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading service providers...'}
            </Text>
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
            <Text style={styles.emptyTitle}>
              {language === 'kn' ? 'ಯಾವುದೇ ಸೇವಾ ಒದಗಿಸುವವರು ಲಭ್ಯವಿಲ್ಲ' : 'No Service Providers Available'}
            </Text>
            <Text style={styles.emptySub}>
              {language === 'kn'
                ? 'ಸ್ಥಳೀಯ ತಂತ್ರಜ್ಞರು ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯವಾಗಲಿದ್ದಾರೆ.'
                : 'Local verified technicians will appear shortly.'}
            </Text>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* NUK TRUST & SAFETY GUARANTEE BANNER                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <View style={[styles.trustBanner, SHADOWS.card]}>
          <View style={styles.trustHeader}>
            <ShieldCheck size={20} color={COLORS.brand} strokeWidth={2.4} />
            <Text style={styles.trustTitle}>
              {language === 'kn' ? 'ಎನ್‌ಯುಕೇ ನಂಬಿಕೆಯ ಭರವಸೆ' : 'The NUK Trust & Safety Promise'}
            </Text>
          </View>

          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <CheckCircle2 size={15} color={COLORS.ok} />
              <Text style={styles.trustItemText}>
                {language === 'kn' ? 'ಆಧಾರ್ & ಕೆವೈಸಿ ಪರಿಶೀಲನೆ' : 'Aadhaar KYC Verified Partners'}
              </Text>
            </View>

            <View style={styles.trustItem}>
              <CheckCircle2 size={15} color={COLORS.ok} />
              <Text style={styles.trustItemText}>
                {language === 'kn' ? 'ಚಾಲಕರಿಗೆ ನೇರ ನಗದು (0% ಕಮಿಷನ್)' : '100% Direct Driver & Tech Pay'}
              </Text>
            </View>

            <View style={styles.trustItem}>
              <CheckCircle2 size={15} color={COLORS.ok} />
              <Text style={styles.trustItemText}>
                {language === 'kn' ? 'ಕರ್ನಾಟಕ 24/7 ಸಹಾಯವಾಣಿ' : '24/7 SOS Safety & Karnataka Support'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 36 }} />
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  gpsPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.liveMint,
  },
  gpsPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
    maxWidth: 95,
  },
  chevronIcon: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: -2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  gpsRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandTint,
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  gpsRefreshText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand,
  },
  langPill: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.paper,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.brand,
  },
  cityDropdown: {
    position: 'absolute',
    top: 96,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cityDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cityDropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  cityDropSub: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
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
    gap: 10,
  },
  livePulseAnimation: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.brand,
  },
  activeRideTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  activeRideSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 2,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontSize: 12,
    color: COLORS.mute,
    marginTop: 2,
    fontWeight: '500',
  },
  karnatakaTag: {
    backgroundColor: COLORS.sunTint,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  karnatakaTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: COLORS.mute,
    fontWeight: '500',
  },
  searchFilterBtn: {
    padding: 2,
  },
  trendingScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  trendChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },

  // Direct Auto Booking Styles
  directAutoCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
    marginBottom: 16,
  },
  directAutoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  directAutoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directAutoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  directAutoSub: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 1,
  },
  locationInputGroup: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.ok,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  locDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 4,
    marginLeft: 20,
  },
  locFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
  },
  locTextInput: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    paddingVertical: 2,
  },
  detectBtnMini: {
    padding: 6,
    backgroundColor: COLORS.brandTint,
    borderRadius: RADIUS.full,
  },
  quickDestContainer: {
    marginBottom: 12,
  },
  quickDestLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mute,
    marginBottom: 6,
  },
  quickDestScroll: {
    gap: 6,
  },
  destChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  destChipActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
  },
  destChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  destChipTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  rideTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  rideTypeOption: {
    flex: 1,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  rideTypeActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
  },
  rideTypeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink,
  },
  rideTypeTextActive: {
    color: COLORS.brand,
  },
  rideTypeSub: {
    fontSize: 9,
    color: COLORS.mute,
  },
  fareSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    marginBottom: 12,
  },
  fareEstLabel: {
    fontSize: 11,
    color: COLORS.mute,
    fontWeight: '600',
  },
  fareEstAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
  },
  fareEstKm: {
    fontSize: 12,
    color: COLORS.mute,
    fontWeight: '500',
  },
  bargainToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  bargainToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.brand,
  },
  inlineBargainControls: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  bargainRuleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mute,
    marginBottom: 8,
  },
  bargainBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  bargainAdjustBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  bargainAdjustText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink,
  },
  offeredFareBadge: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  offeredFareText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
  directAutoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.brand,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
  },
  directAutoBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  directAutoBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.2,
  },

  // Live Radar Ticker
  radarTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  radarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  mintDotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.liveMint,
  },
  radarText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    flex: 1,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    marginTop: 4,
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

  // Three Pillars Grid
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
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
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink,
    textAlign: 'center',
  },
  actionSub: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.mute,
    marginTop: 2,
    textAlign: 'center',
  },

  // Fleet Hub Sub-section
  transportSection: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.xl,
    padding: 14,
    marginBottom: 16,
  },
  sectionHeaderInner: {
    marginBottom: 10,
  },
  innerSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  innerSectionSub: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 1,
  },
  transportGrid: {
    gap: 8,
  },
  transportPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.lg,
    padding: 10,
  },
  fleetIconBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportPillText: {
    flex: 1,
  },
  pillTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink,
  },
  pillSub: {
    fontSize: 10,
    color: COLORS.mute,
  },

  // Loaders & Empty States
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

  // Trust Banner
  trustBanner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
    marginTop: 8,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  trustGrid: {
    gap: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
});
