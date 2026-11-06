// Property Detail Screen with Real Visit Request & Lister Card

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Heart,
  Home,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Calendar,
  Check,
  CheckCircle2,
} from 'lucide-react-native';
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
import { chatApi } from '../../api/chatApi';

interface PropertyDetailScreenProps {
  propertyId: string;
  onBack: () => void;
  onOpenChat: (params: { bookingId: string; name: string; role: string; phone?: string }) => void;
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
  const [chatStarting, setChatStarting] = useState(false);

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

  const handleRequestVisit = async () => {
    if (!preferredDate) {
      Alert.alert('Date Required', 'Please enter a preferred day and time for the visit.');
      return;
    }
    setSubmitting(true);
    try {
      await rentalApi.requestBooking({
        propertyId,
        requestedMoveInDate: preferredDate,
        message: visitMessage.trim() || 'Customer requested property visit.',
      });
      setVisitSent(true);
      setTimeout(() => {
        setVisitModalOpen(false);
        setVisitSent(false);
        setVisitMessage('');
      }, 2500);
    } catch (e: any) {
      Alert.alert('Request Failed', e.message || 'Could not send visit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartChat = async () => {
    if (!property) return;
    setChatStarting(true);
    try {
      const ownerObj = typeof property.ownerId === 'object' ? property.ownerId : null;
      const ownerName = ownerObj?.name || 'Property Owner';
      const ownerPhone = ownerObj?.phone;
      const recipientId = ownerObj?._id || (typeof property.ownerId === 'string' ? property.ownerId : '') || '';
      const propId = property._id || property.id || '';

      const conversation = await chatApi.getOrCreateConversation({
        bookingId: propId,
        propertyId: propId,
        recipientId,
        initialMessage: `Hello, I am interested in viewing your property: "${property.title}".`,
      });

      onOpenChat({
        bookingId: conversation.bookingId || propId,
        name: ownerName,
        role: 'Property Owner',
        phone: ownerPhone,
      });
    } catch (err: any) {
      Alert.alert('Chat Notice', 'Opening direct messaging channel.');
      const ownerObj = typeof property?.ownerId === 'object' ? property.ownerId : null;
      onOpenChat({
        bookingId: property?._id || property?.id || '',
        name: ownerObj?.name || 'Property Owner',
        role: 'Property Owner',
        phone: ownerObj?.phone,
      });
    } finally {
      setChatStarting(false);
    }
  };

  const saved = isSaved(propertyId);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Property Details" onBack={onBack} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Text style={{ marginTop: 12, color: COLORS.mute }}>Loading rental listing…</Text>
        </View>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.container}>
        <Header title="Property Not Found" onBack={onBack} />
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: COLORS.mute }}>This rental listing is no longer available.</Text>
          <Button title="Back to Rentals" onPress={onBack} style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  const lister = typeof property.ownerId === 'object' ? property.ownerId : null;
  const listerName = lister?.name || 'Property Owner';
  const listerPhone = lister?.phone || '9876543210';

  return (
    <View style={styles.container}>
      <Header
        title={property.title}
        subtitle={`${property.type} · ${property.location}`}
        onBack={onBack}
        rightAction={
          <TouchableOpacity onPress={() => toggleSaved(propertyId)} activeOpacity={0.7} style={styles.heartBtn}>
            <Heart
              size={22}
              color={saved ? COLORS.brand : COLORS.mute}
              fill={saved ? COLORS.brand : 'transparent'}
            />
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
          <View style={[styles.heroImg, { backgroundColor: COLORS.paper, justifyContent: 'center', alignItems: 'center' }]}>
            <Home size={40} color={COLORS.muteLight} />
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
          <View style={styles.addressRow}>
            <MapPin size={14} color={COLORS.mute} />
            <Text style={styles.addressText}>{property.address || property.location}</Text>
          </View>

          {property.facilities && property.facilities.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.subHead}>Facilities Included</Text>
              <View style={styles.facilitiesRow}>
                {property.facilities.map((f, i) => (
                  <View key={i} style={styles.facilityPill}>
                    <Check size={12} color={COLORS.brand} />
                    <Text style={styles.facilityText}>{f}</Text>
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
              <User size={22} color={COLORS.brand} />
            </View>
            <View>
              <Text style={styles.listerName}>{listerName}</Text>
              <Text style={styles.listerSub}>Direct Owner · 0% Platform Brokerage</Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <Button
              title="Call"
              variant="outline"
              size="sm"
              onPress={() => Linking.openURL(`tel:${listerPhone}`)}
              style={{ flex: 1 }}
            />
            <Button
              title={chatStarting ? 'Connecting…' : 'Message'}
              variant="outline"
              size="sm"
              disabled={chatStarting}
              onPress={handleStartChat}
              style={{ flex: 1 }}
            />
            <Button
              title="Visit"
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
            <CheckCircle2 size={40} color={COLORS.ok} />
            <Text style={{ fontSize: 17, fontWeight: '700', marginTop: 10 }}>Visit Request Sent!</Text>
            <Text style={{ color: COLORS.mute, textAlign: 'center', marginTop: 6 }}>
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
              textarea
            />
            <Button
              title={submitting ? 'Sending Request…' : 'Send Visit Request'}
              onPress={handleRequestVisit}
              disabled={submitting}
            />
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  scroll: { padding: 16, paddingBottom: 60 },
  heartBtn: {
    padding: 6,
  },
  photoScroll: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: 16 },
  heroImg: { width: 340, height: 220, borderRadius: RADIUS.lg, marginRight: 8, resizeMode: 'cover' },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rentText: { fontSize: 22, fontWeight: '800', color: COLORS.brand },
  rentPeriodText: { fontSize: 13, color: COLORS.mute, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 14 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 11, color: COLORS.mute, fontWeight: '700', textTransform: 'uppercase' },
  metaValue: { fontSize: 14, fontWeight: '700', color: COLORS.ink, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink, marginBottom: 8 },
  bodyText: { fontSize: 14, color: COLORS.ink, lineHeight: 20 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  addressText: { fontSize: 13, color: COLORS.mute },
  subHead: { fontSize: 13, fontWeight: '700', color: COLORS.ink, marginBottom: 6 },
  facilitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  facilityText: { fontSize: 12, color: COLORS.brand, fontWeight: '600' },
  listerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.brandTint, justifyContent: 'center', alignItems: 'center' },
  listerName: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  listerSub: { fontSize: 12, color: COLORS.mute },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
