// Bookings & Trip History Screen (Connected to real backend APIs)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Calendar, ClipboardList, Car, Home as HomeIcon, MapPin } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { formatINR } from '../../utils/formatters';
import { useLocalization } from '../../context/LocalizationContext';
import { useActiveRide } from '../../context/ActiveRideContext';
import { transportApi, TransportBooking } from '../../api/transportApi';
import { rentalApi, RentalBooking } from '../../api/rentalApi';

interface BookingsScreenProps {
  onTrackRide: () => void;
  onExplore: () => void;
}

export const BookingsScreen: React.FC<BookingsScreenProps> = ({
  onTrackRide,
  onExplore,
}) => {
  const { t } = useLocalization();
  const { phase, activeBooking } = useActiveRide();
  const [tab, setTab] = useState<'All' | 'Auto' | 'Car & Van' | 'Rentals'>('All');
  const [transportBookings, setTransportBookings] = useState<TransportBooking[]>([]);
  const [rentalBookings, setRentalBookings] = useState<RentalBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      try {
        const [tRes, rRes] = await Promise.allSettled([
          transportApi.getMyBookings(),
          rentalApi.getMyRentalBookings(),
        ]);
        if (tRes.status === 'fulfilled' && Array.isArray(tRes.value)) {
          setTransportBookings(tRes.value);
        }
        if (rRes.status === 'fulfilled' && Array.isArray(rRes.value)) {
          setRentalBookings(rRes.value);
        }
      } catch (e) {
        // Handled silently
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const filteredTransport = transportBookings.filter((b) => {
    if (tab === 'All') return true;
    if (tab === 'Auto') return b.vehicleType === 'auto';
    if (tab === 'Car & Van') return b.vehicleType === 'car' || b.vehicleType === 'goods-van';
    return false;
  });

  const showRentals = tab === 'All' || tab === 'Rentals';
  const hasItems = filteredTransport.length > 0 || (showRentals && rentalBookings.length > 0);

  return (
    <View style={styles.container}>
      <Header title={t('tabBookings', 'ಬುಕಿಂಗ್ ಇತಿಹಾಸ')} subtitle="All your rides, rentals & services" />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['All', 'Auto', 'Car & Van', 'Rentals'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.tabBtn, tab === item && styles.tabBtnActive]}
            onPress={() => setTab(item)}
          >
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Active Ride Banner */}
        {phase !== 'idle' && (
          <View style={[styles.activeCard, SHADOWS.card]}>
            <View style={styles.activeHeader}>
              <Badge tone="crimson" label="● LIVE ONGOING" />
              <Text style={styles.activeFare}>
                {activeBooking?.fare ? formatINR(activeBooking.fare) : '₹30'}
              </Text>
            </View>
            <Text style={styles.activeRoute}>
              {activeBooking?.pickup || 'Pickup'} → {activeBooking?.destination || 'Destination'}
            </Text>
            <Text style={styles.activeSub}>
              {phase === 'searching'
                ? t('findingDriver', 'ಆಟೋ ಚಾಲಕರನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...')
                : t('Driver on the way', 'ಚಾಲಕರು ಬರುತ್ತಿದ್ದಾರೆ')}
            </Text>
            <Button
              title={t('trackRide', 'ಲೈವ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ')}
              onPress={onTrackRide}
              variant="outline"
              size="sm"
              style={{ marginTop: 10 }}
            />
          </View>
        )}

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={{ marginTop: 12, color: COLORS.mute }}>Loading your booking history…</Text>
          </View>
        ) : !hasItems ? (
          <EmptyState
            title="No bookings yet"
            description="Your auto rides, vehicle trips, and property visits will appear here."
            actionLabel="Explore Services & Rides"
            onAction={onExplore}
          />
        ) : (
          <>
            {filteredTransport.map((item) => (
              <View key={item._id || item.id} style={[styles.itemCard, SHADOWS.card]}>
                <View style={styles.itemHeader}>
                  <View style={styles.kindRow}>
                    <Text style={styles.itemKind}>{item.vehicleType?.toUpperCase()}</Text>
                    <Badge
                      tone={
                        item.status === 'completed'
                          ? 'emerald'
                          : item.status === 'cancelled'
                          ? 'crimson'
                          : 'sun'
                      }
                      label={item.status.toUpperCase()}
                    />
                  </View>
                  <Text style={styles.itemPrice}>{item.fare ? formatINR(item.fare) : '₹30'}</Text>
                </View>

                <Text style={styles.itemTitle}>{item.pickup} → {item.destination}</Text>
                <Text style={styles.itemSub}>{new Date(item.scheduledAt || item.createdAt).toLocaleString()}</Text>

                <View style={styles.itemFooter}>
                  <Text style={styles.itemMeta}>0% platform fee · Direct cash settlement</Text>
                </View>
              </View>
            ))}

            {showRentals &&
              rentalBookings.map((r) => (
                <View key={r._id || r.id} style={[styles.itemCard, SHADOWS.card]}>
                  <View style={styles.itemHeader}>
                    <View style={styles.kindRow}>
                      <Text style={styles.itemKind}>RENTAL PROPERTY</Text>
                      <Badge
                        tone={r.status === 'accepted' ? 'emerald' : 'sun'}
                        label={r.status.toUpperCase()}
                      />
                    </View>
                  </View>
                  <Text style={styles.itemTitle}>Move-in request: {r.requestedMoveInDate}</Text>
                  <Text style={styles.itemSub}>{r.message || 'Direct enquiry'}</Text>
                </View>
              ))}
          </>
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: 8,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  tabBtnActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brand,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
  },
  tabTextActive: {
    color: COLORS.brand,
    fontWeight: '800',
  },
  scroll: {
    padding: 16,
    paddingBottom: 60,
  },
  activeCard: {
    backgroundColor: COLORS.brandTint,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    marginBottom: 16,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeFare: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.brand,
  },
  activeRoute: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  activeSub: {
    fontSize: 12,
    color: COLORS.mute,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemKind: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.mute,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
  },
  itemSub: {
    fontSize: 11,
    color: COLORS.mute,
  },
  itemFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  itemMeta: {
    fontSize: 11,
    color: COLORS.ok,
    fontWeight: '600',
  },
});
