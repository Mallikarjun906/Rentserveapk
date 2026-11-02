// Service Provider Profile & Real Booking Enquiry Screen

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Linking,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { useLocalization } from '../../context/LocalizationContext';
import { serviceApi, ServiceListing } from '../../api/serviceApi';
import { rentalApi } from '../../api/rentalApi';
import { chatApi } from '../../api/chatApi';
import { DocumentViewerModal, DocumentItem } from '../../components/common/DocumentViewerModal';
import { CONFIG } from '../../constants/config';

interface ProviderProfileScreenProps {
  providerId: string;
  onBack: () => void;
  onOpenChat: (params: { bookingId: string; name: string; role: string; phone?: string }) => void;
}

export const ProviderProfileScreen: React.FC<ProviderProfileScreenProps> = ({
  providerId,
  onBack,
  onOpenChat,
}) => {
  const { t } = useLocalization();
  const [service, setService] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatStarting, setChatStarting] = useState(false);

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [scheduledWhen, setScheduledWhen] = useState('Tomorrow, 10:00 AM');
  const [jobDescription, setJobDescription] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // In-Screen Document Previewer State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const openProviderDoc = (docType: string, title: string, isPdf: boolean = false) => {
    const list: DocumentItem[] = [
      {
        id: `provider-${docType}`,
        docType,
        title,
        url: `${CONFIG.API_BASE_URL}/documents/mine/${docType}`,
        isPdf,
        format: isPdf ? 'pdf' : 'jpg',
      },
    ];
    setPreviewDocs(list);
    setPreviewIndex(0);
    setDocModalOpen(true);
  };

  useEffect(() => {
    async function loadService() {
      setLoading(true);
      try {
        const data = await serviceApi.getService(providerId);
        setService(data);
      } catch (e) {
        // Handled silently
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [providerId]);

  const handleBook = async () => {
    setSubmitting(true);
    try {
      await rentalApi.createBooking({
        serviceId: providerId,
        bookingType: 'service',
        category: categoryName,
        details: `${jobDescription} (Scheduled for: ${scheduledWhen})`,
        message: `${jobDescription} (Scheduled for: ${scheduledWhen})`,
        location: service?.location || 'Bagalkot',
      });
      try {
        await serviceApi.createEnquiry({
          listingId: providerId,
          listingType: 'service',
          message: `${jobDescription} (Scheduled for: ${scheduledWhen})`,
        });
      } catch {}
      setRequestSent(true);
      setTimeout(() => {
        setBookModalOpen(false);
        setRequestSent(false);
      }, 1500);
    } catch (e: any) {
      Alert.alert('Booking Request', 'Could not submit booking: ' + (e?.message || 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDirectChat = async () => {
    if (!service) return;
    const targetUserId = typeof service.providerId === 'object' && service.providerId ? (service.providerId as any)._id : String(service.providerId || '');
    if (!targetUserId) {
      Alert.alert('Notice', 'Provider contact information is currently unavailable.');
      return;
    }
    setChatStarting(true);
    try {
      const conv = await chatApi.getOrCreateConversation({
        recipientId: targetUserId,
        serviceId: service._id || providerId,
        title: name,
      });
      onOpenChat({
        bookingId: conv.conversationId || conv.id || conv.bookingId,
        name,
        role: categoryName,
        phone,
      });
    } catch (err: any) {
      Alert.alert('Chat Notice', err.message || 'Could not open conversation. Please try again.');
    } finally {
      setChatStarting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.crimson} />
        <Text style={{ marginTop: 12, color: COLORS.inkMuted }}>Loading provider profile…</Text>
      </SafeAreaView>
    );
  }

  const name = service?.providerId?.name || service?.title || 'Professional Service';
  const categoryName = typeof service?.categoryId === 'object' ? service.categoryId.name : 'General Service';
  const phone = service?.providerId?.phone || '9876543210';
  const priceDisplay = service?.priceRange?.min ? `₹${service.priceRange.min}` : '₹350';

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={name}
        subtitle={`${categoryName} · ${service?.location || 'Bagalkot'}`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Header Card */}
        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.topRow}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 28 }}>🔧</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.trade}>{categoryName}</Text>
              <Text style={styles.area}>📍 {service?.location || 'Bagalkot, Karnataka'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rateRow}>
            <View>
              <Text style={styles.rateLabel}>Visiting Rate / Starting Price</Text>
              <Text style={styles.rateText}>{priceDisplay} {service?.payUnit ? `/${service.payUnit}` : '/visit'}</Text>
            </View>
            <Badge tone="emerald" label="VERIFIED TRADE" />
          </View>
        </View>

        {/* Scope of Work */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          <Text style={styles.bodyText}>
            {service?.description || 'Complete repair, installation and maintenance services with standard warranty.'}
          </Text>
        </View>

        {/* Verified Provider Credentials (In-Screen Document Preview) */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Verified Credentials & Documents</Text>
          <Text style={[styles.bodyText, { fontSize: 13, color: COLORS.inkMuted, marginBottom: 12 }]}>
            Identity and trade verification documents are validated by NUK desk:
          </Text>

          <View style={{ gap: 8 }}>
            <TouchableOpacity
              style={styles.docRowItem}
              onPress={() => openProviderDoc('aadhaarDocument', `${name} - Identity Document (Masked)`, false)}
              activeOpacity={0.7}
            >
              <View style={styles.docRowLeft}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>🖼️</Text>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.ink }}>
                    Government ID / Aadhaar
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.inkMuted, marginTop: 1 }}>
                    Masked verified identity copy
                  </Text>
                </View>
              </View>
              <Text style={styles.previewActionPill}>👁️ Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Connect & Book Service</Text>
          <Text style={styles.bodyText}>Direct contact with 0% platform fee. Settle charges directly in cash.</Text>
          <View style={styles.btnRow}>
            <Button
              title="📞 Call"
              variant="outline"
              size="sm"
              onPress={() => Linking.openURL(`tel:${phone}`)}
              style={{ flex: 1 }}
            />
            <Button
              title={chatStarting ? 'Connecting…' : '💬 Message'}
              variant="outline"
              size="sm"
              disabled={chatStarting}
              onPress={handleOpenDirectChat}
              style={{ flex: 1 }}
            />
            <Button
              title="🗓 Book"
              size="sm"
              onPress={() => setBookModalOpen(true)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Booking Modal */}
      <Modal visible={bookModalOpen} onClose={() => setBookModalOpen(false)} title="Book Service Visit">
        {requestSent ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 36 }}>✅</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', marginTop: 10 }}>Service Request Sent!</Text>
            <Text style={{ color: COLORS.inkMuted, textAlign: 'center', marginTop: 6 }}>
              The service provider will call your registered number to confirm appointment.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Input
              label="When do you need the service?"
              value={scheduledWhen}
              onChangeText={setScheduledWhen}
              placeholder="e.g. Tomorrow, 10:00 AM"
            />
            <Input
              label="Describe the repair / requirement"
              value={jobDescription}
              onChangeText={setJobDescription}
              placeholder="e.g. Main switchboard tripping / water leakage in bathroom"
              multiline
              numberOfLines={3}
            />
            <Button
              title={submitting ? 'Submitting…' : 'Send Service Request'}
              onPress={handleBook}
              disabled={submitting}
            />
          </View>
        )}
      </Modal>

      {/* In-Screen Document Viewer Modal */}
      <DocumentViewerModal
        visible={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        documents={previewDocs}
        currentIndex={previewIndex}
        onSelectIndex={setPreviewIndex}
        canReview={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.paper },
  docRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.paper,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  docRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  previewActionPill: {
    backgroundColor: COLORS.brand,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  scroll: { padding: 16, paddingBottom: 90 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 16 },
  topRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.crimsonTint, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: COLORS.ink },
  trade: { fontSize: 14, color: COLORS.crimson, fontWeight: '700', marginTop: 2 },
  area: { fontSize: 12, color: COLORS.inkMuted, marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 14 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateLabel: { fontSize: 11, color: COLORS.inkMuted, textTransform: 'uppercase', fontWeight: '700' },
  rateText: { fontSize: 20, fontWeight: '800', color: COLORS.crimson, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink, marginBottom: 8 },
  bodyText: { fontSize: 14, color: COLORS.ink, lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
