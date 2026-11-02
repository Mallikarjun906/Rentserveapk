// Bookings & Trip History Screen (Connected to real backend APIs)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
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
    <SafeAreaView style={styles.safe}>
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
            <ActivityIndicator size="large" color={COLORS.crimson} />
            <Text style={{ marginTop: 12, color: COLORS.inkMuted }}>Loading your booking history…</Text>
          </View>
        ) : !hasItems ? (
          <EmptyState
            icon={<Text style={{ fontSize: 32 }}>📋</Text>}
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
                  <Text style={styles.itemMeta}>0% platform fee · Direct cash</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
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
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: 8,
    backgroundColor: COLORS.paper,
  },
  tabBtnActive: {
    backgroundColor: COLORS.crimson,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.inkMuted,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  activeCard: {
    backgroundColor: COLORS.crimsonTint,
    borderWidth: 1.5,
    borderColor: COLORS.crimson,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeFare: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.crimson,
  },
  activeRoute: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 8,
  },
  activeSub: {
    fontSize: 13,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
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
    color: COLORS.crimson,
    letterSpacing: 0.5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  itemSub: {
    fontSize: 13,
    color: COLORS.inkMuted,
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
});
