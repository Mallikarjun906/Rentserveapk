// Property Detail Screen with Real Visit Request & Lister Card

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { formatINR } from '../../utils/formatters';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { rentalApi, Property } from '../../api/rentalApi';

interface PropertyDetailScreenProps {
  propertyId: string;
  onBack: () => void;
  onOpenChat: () => void;
}

export const PropertyDetailScreen: React.FC<PropertyDetailScreenProps> = ({
  propertyId,
  onBack,
  onOpenChat,
}) => {
  const { t } = useLocalization();
  const { isSaved, toggleSaved } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [preferredDate, setPreferredDate] = useState('This Saturday, 4:00 PM');
  const [visitMessage, setVisitMessage] = useState('');
  const [visitSent, setVisitSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProp() {
      setLoading(true);
      try {
        const data = await rentalApi.getProperty(propertyId);
        setProperty(data);
      } catch (e) {
        // Handled silently
      } finally {
        setLoading(false);
      }
    }
    loadProp();
  }, [propertyId]);

  const saved = isSaved(propertyId || '');

  const handleRequestVisit = async () => {
    setSubmitting(true);
    try {
      await rentalApi.createBooking({
        propertyId: propertyId,
        requestedMoveInDate: preferredDate,
        message: visitMessage,
      });
      setVisitSent(true);
      setTimeout(() => {
        setVisitModalOpen(false);
        setVisitSent(false);
      }, 1500);
    } catch (e: any) {
      Alert.alert('Visit Request', 'Could not submit visit request: ' + (e?.message || 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.crimson} />
        <Text style={{ marginTop: 12, color: COLORS.inkMuted }}>Loading property details…</Text>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Property Not Found" onBack={onBack} />
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: COLORS.inkMuted }}>This rental listing is no longer available.</Text>
          <Button title="Back to Rentals" onPress={onBack} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  const lister = typeof property.ownerId === 'object' ? property.ownerId : null;
  const listerName = lister?.name || 'Property Owner';
  const listerPhone = lister?.phone || '9876543210';

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={property.title}
        subtitle={`${property.type} · ${property.location}`}
        onBack={onBack}
        rightAction={
          <TouchableOpacity onPress={() => toggleSaved(propertyId)}>
            <Text style={{ fontSize: 22 }}>{saved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Photos Carousel */}
        {property.images && property.images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {property.images.map((img, idx) => (
              <Image key={idx} source={{ uri: img.url }} style={styles.heroImg} />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.heroImg, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 36 }}>🏡</Text>
          </View>
        )}

        {/* Pricing & Key Details */}
        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.rentText}>{formatINR(property.rent)}</Text>
              <Text style={styles.rentPeriodText}>per {property.rentPeriod || 'month'} · Direct owner rent</Text>
            </View>
            <Badge tone="emerald" label={property.availability ? 'AVAILABLE' : 'RENTED'} />
          </View>

          <View style={styles.divider} />

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Deposit</Text>
              <Text style={styles.metaValue}>{formatINR(property.deposit || 0)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Property Type</Text>
              <Text style={styles.metaValue}>{property.type}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.metaValue}>{property.location}</Text>
            </View>
          </View>
        </View>

        {/* Description & Address */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>About this property</Text>
          <Text style={styles.bodyText}>{property.description || 'Verified rental in Karnataka.'}</Text>
          <Text style={styles.addressText}>📍 {property.address || property.location}</Text>

          {property.facilities && property.facilities.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.subHead}>Facilities Included</Text>
              <View style={styles.facilitiesRow}>
                {property.facilities.map((f, i) => (
                  <View key={i} style={styles.facilityPill}>
                    <Text style={styles.facilityText}>✓ {f}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Owner Card & Contact Buttons */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Lister / Owner</Text>
          <View style={styles.listerRow}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
            <View>
              <Text style={styles.listerName}>{listerName}</Text>
              <Text style={styles.listerSub}>Direct Owner · 0% Platform Brokerage</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <Button
              title="📞 Call Owner"
              variant="outline"
              size="sm"
              onPress={() => Linking.openURL(`tel:${listerPhone}`)}
              style={{ flex: 1 }}
            />
            <Button
              title="🗓 Request Visit"
              size="sm"
              onPress={() => setVisitModalOpen(true)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Modal: Request a Visit */}
      <Modal visible={visitModalOpen} onClose={() => setVisitModalOpen(false)} title="Schedule Property Visit">
        {visitSent ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 36 }}>✅</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', marginTop: 10 }}>Visit Request Sent!</Text>
            <Text style={{ color: COLORS.inkMuted, textAlign: 'center', marginTop: 6 }}>
              The property owner has received your request and will contact you directly.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Input
              label="Preferred Day & Time"
              value={preferredDate}
              onChangeText={setPreferredDate}
              placeholder="e.g. This Saturday, 4:00 PM"
            />
            <Input
              label="Note for Owner (Optional)"
              value={visitMessage}
              onChangeText={setVisitMessage}
              placeholder="e.g. Family of 3 looking to move next month"
              multiline
              numberOfLines={3}
            />
            <Button
              title={submitting ? 'Sending Request…' : 'Send Visit Request'}
              onPress={handleRequestVisit}
              disabled={submitting}
            />
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  scroll: { padding: 16, paddingBottom: 40 },
  photoScroll: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 16 },
  heroImg: { width: 340, height: 220, borderRadius: RADIUS.lg, marginRight: 8, resizeMode: 'cover' },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rentText: { fontSize: 22, fontWeight: '800', color: COLORS.crimson },
  rentPeriodText: { fontSize: 13, color: COLORS.inkMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 14 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 11, color: COLORS.inkMuted, fontWeight: '700', textTransform: 'uppercase' },
  metaValue: { fontSize: 14, fontWeight: '700', color: COLORS.ink, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink, marginBottom: 8 },
  bodyText: { fontSize: 14, color: COLORS.ink, lineHeight: 20 },
  addressText: { fontSize: 13, color: COLORS.inkMuted, marginTop: 8 },
  subHead: { fontSize: 13, fontWeight: '700', color: COLORS.ink, marginBottom: 6 },
  facilitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  facilityPill: { backgroundColor: COLORS.crimsonTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  facilityText: { fontSize: 12, color: COLORS.crimson, fontWeight: '600' },
  listerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.paper, justifyContent: 'center', alignItems: 'center' },
  listerName: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  listerSub: { fontSize: 12, color: COLORS.inkMuted },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
