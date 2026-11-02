// Service Provider Workspace Dashboard (/provider/dashboard)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { providerApi, ProviderServiceRequest } from '../../api/providerApi';
import { DocumentViewerModal, DocumentItem } from '../../components/common/DocumentViewerModal';
import { CONFIG } from '../../constants/config';

interface ProviderDashboardScreenProps {
  onBack: () => void;
  onOpenChat: (params: { bookingId: string; name: string; role: string; phone?: string }) => void;
}

export const ProviderDashboardScreen: React.FC<ProviderDashboardScreenProps> = ({
  onBack,
  onOpenChat,
}) => {
  const { t } = useLocalization();
  const { user, token } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<ProviderServiceRequest[]>([]);
  const [acceptedBookings, setAcceptedBookings] = useState<ProviderServiceRequest[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'incoming' | 'accepted' | 'services'>('incoming');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState('');
  const [locUpdating, setLocUpdating] = useState(false);
  const [locNotice, setLocNotice] = useState('');

  // In-Screen Document Previewer
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [profRes, reqRes, accRes, servRes] = await Promise.allSettled([
        providerApi.getMyProfile(),
        providerApi.getReceivedRequests(),
        providerApi.getMyAcceptedBookings(),
        providerApi.getMyServices(),
      ]);

      if (profRes.status === 'fulfilled') {
        setProfile(profRes.value);
      }
      if (reqRes.status === 'fulfilled') {
        setRequests(reqRes.value.filter((r) => r.status === 'pending'));
      }
      if (accRes.status === 'fulfilled') {
        setAcceptedBookings(accRes.value.filter((b) => b.status === 'accepted' || b.status === 'completed'));
      }
      if (servRes.status === 'fulfilled') {
        setServices(servRes.value);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // 5-second polling for incoming customer requests
    const timer = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Automatic Location Detection & Refresh
  const handleRefreshLocation = async () => {
    setLocUpdating(true);
    setLocNotice('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocNotice('GPS permission denied. Using registered location.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (position?.coords) {
        await providerApi.updateLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocNotice(`Location updated: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        setTimeout(() => setLocNotice(''), 4000);
      }
    } catch (e: any) {
      setLocNotice(e.message || 'Location update failed.');
    } finally {
      setLocUpdating(false);
    }
  };

  // Accept or Reject Request
  const handleRespond = async (bookingId: string, decision: 'accepted' | 'rejected') => {
    setActionId(bookingId);
    try {
      await providerApi.respondToRequest(bookingId, decision);
      Alert.alert(
        decision === 'accepted' ? 'Request Accepted' : 'Request Declined',
        decision === 'accepted'
          ? 'You have accepted the customer request. You can now chat directly with the customer.'
          : 'Request declined.'
      );
      loadData(true);
    } catch (e: any) {
      Alert.alert('Action Failed', e.message || 'Could not update request.');
    } finally {
      setActionId('');
    }
  };

  const openDocumentPreview = (docType: string, title: string, isPdf = false) => {
    const list: DocumentItem[] = [
      {
        docType,
        title,
        url: `${CONFIG.API_BASE_URL}/documents/mine/${docType}?token=${token}`,
        isPdf,
        format: isPdf ? 'pdf' : 'jpg',
      },
    ];
    setPreviewDocs(list);
    setPreviewIndex(0);
    setDocModalOpen(true);
  };

  const appStatus = profile?.verificationStatus || profile?.status || user?.approvalStatus || 'pending';
  const statusTone = appStatus === 'approved' || appStatus === 'verified' ? 'ok' : appStatus === 'rejected' ? 'bad' : 'sun';

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={t('providerDashboard', 'ಸೇವಾ ಪೂರೈಕೆದಾರರ ಕಾರ್ಯಕ್ಷೇತ್ರ')}
        subtitle={profile?.displayName || user?.name || 'Professional Service'}
        onBack={onBack}
        rightAction={
          <TouchableOpacity onPress={handleRefreshLocation} style={styles.locIconBtn} disabled={locUpdating}>
            {locUpdating ? (
              <ActivityIndicator size="small" color={COLORS.crimson} />
            ) : (
              <Text style={styles.locIconText}>📍</Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.crimson} />}
      >
        {/* Verification Status Banner */}
        <View style={[styles.statusCard, SHADOWS.card]}>
          <View style={styles.statusTop}>
            <View>
              <Text style={styles.statusLabel}>Verification Status</Text>
              <Text style={styles.statusTitle}>
                {appStatus === 'approved' || appStatus === 'verified'
                  ? 'Verified Service Partner'
                  : appStatus === 'rejected'
                  ? 'Verification Declined'
                  : 'Pending Admin Review'}
              </Text>
            </View>
            <Badge tone={statusTone} label={String(appStatus).toUpperCase()} />
          </View>
          <Text style={styles.statusSub}>
            {profile?.reviewNote ||
              (appStatus === 'approved' || appStatus === 'verified'
                ? 'Your trade credentials have been verified. You can receive requests and manage bookings.'
                : appStatus === 'rejected'
                ? 'Your registration was rejected. Please contact administrator support.'
                : 'Your identity and credentials are being reviewed by administrators. Incoming requests will refresh automatically.')}
          </Text>

          {/* Quick Location Notice */}
          {locNotice ? <Text style={styles.locNoticeText}>✓ {locNotice}</Text> : null}
        </View>

        {/* Verification Documents Row */}
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.cardSectionTitle}>📑 Registered Identity & Credentials</Text>
          <View style={styles.docRowList}>
            <TouchableOpacity
              style={styles.docChip}
              onPress={() => openDocumentPreview('aadhaarDocument', 'Identity Proof (Govt ID)', false)}
            >
              <Text style={styles.docChipIcon}>🪪</Text>
              <Text style={styles.docChipText}>Govt ID / Aadhaar</Text>
              <Text style={styles.docChipEye}>👁️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.docChip}
              onPress={() => openDocumentPreview('addressProofDocument', 'Address Proof Document', false)}
            >
              <Text style={styles.docChipIcon}>🏠</Text>
              <Text style={styles.docChipText}>Address Proof</Text>
              <Text style={styles.docChipEye}>👁️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selection */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'incoming' && styles.tabBtnActive]}
            onPress={() => setActiveTab('incoming')}
          >
            <Text style={[styles.tabText, activeTab === 'incoming' && styles.tabTextActive]}>
              Incoming ({requests.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'accepted' && styles.tabBtnActive]}
            onPress={() => setActiveTab('accepted')}
          >
            <Text style={[styles.tabText, activeTab === 'accepted' && styles.tabTextActive]}>
              Active Jobs ({acceptedBookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
              Trade Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: INCOMING REQUESTS */}
        {activeTab === 'incoming' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Customer Service Requests</Text>
              <TouchableOpacity onPress={() => loadData(true)}>
                <Text style={styles.refreshText}>⟳ Refresh</Text>
              </TouchableOpacity>
            </View>

            {requests.length === 0 ? (
              <EmptyState
                title="No Pending Customer Requests"
                description="When customers in your service area submit a request for your category, it will appear here in real time."
                actionLabel="Refresh Radar"
                onAction={() => loadData()}
              />
            ) : (
              requests.map((req) => (
                <View key={req._id || req.id} style={[styles.requestCard, SHADOWS.card]}>
                  <View style={styles.reqTopRow}>
                    <Badge tone="crimson" label={req.category || 'Service Request'} />
                    <Text style={styles.reqTime}>
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  <Text style={styles.reqCustomerName}>
                    👤 {req.customerId?.name || 'Customer'}
                  </Text>
                  <Text style={styles.reqLocation}>
                    📍 {req.location || 'Bagalkot, Karnataka'}
                  </Text>

                  {req.details || req.message ? (
                    <View style={styles.reqMsgBox}>
                      <Text style={styles.reqMsgText}>"{req.details || req.message}"</Text>
                    </View>
                  ) : null}

                  {req.scheduledDate ? (
                    <Text style={styles.reqDate}>
                      🗓️ Scheduled: {new Date(req.scheduledDate).toLocaleDateString()}
                    </Text>
                  ) : null}

                  <View style={styles.reqActionRow}>
                    <Button
                      title={actionId === req._id ? 'Accepting…' : '✓ Accept Request'}
                      onPress={() => handleRespond(req._id, 'accepted')}
                      variant="primary"
                      size="sm"
                      disabled={Boolean(actionId)}
                      style={styles.actionBtnAccept}
                    />
                    <Button
                      title="Decline"
                      onPress={() => handleRespond(req._id, 'rejected')}
                      variant="outline"
                      size="sm"
                      disabled={Boolean(actionId)}
                      style={styles.actionBtnDecline}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: ACTIVE / ACCEPTED JOBS */}
        {activeTab === 'accepted' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Accepted Bookings & Chat</Text>
            </View>

            {acceptedBookings.length === 0 ? (
              <EmptyState
                title="No Active Bookings"
                description="Requests you accept will be listed here. You can chat directly with your customers to coordinate visits."
              />
            ) : (
              acceptedBookings.map((b) => (
                <View key={b._id || b.id} style={[styles.acceptedCard, SHADOWS.card]}>
                  <View style={styles.reqTopRow}>
                    <Badge tone="ok" label={b.status.toUpperCase()} />
                    <Text style={styles.reqTime}>
                      {new Date(b.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <Text style={styles.reqCustomerName}>
                    👤 {b.customerId?.name || 'Customer'}
                  </Text>
                  {b.customerId?.phone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${b.customerId?.phone}`)}
                      style={styles.phoneLink}
                    >
                      <Text style={styles.phoneLinkText}>📞 {b.customerId?.phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <Text style={styles.reqLocation}>📍 {b.location || 'Bagalkot'}</Text>
                  <Text style={styles.acceptedCategory}>🛠️ {b.category || 'Service'}</Text>

                  {/* Direct In-App Chat Action */}
                  <TouchableOpacity
                    style={styles.chatActionBtn}
                    onPress={() =>
                      onOpenChat({
                        bookingId: b._id,
                        name: b.customerId?.name || 'Customer',
                        role: b.category || 'Service Customer',
                        phone: b.customerId?.phone,
                      })
                    }
                  >
                    <Text style={styles.chatActionIcon}>💬</Text>
                    <Text style={styles.chatActionText}>Open Direct Chat</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: TRADE & PROFILE INFO */}
        {activeTab === 'services' && (
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.cardSectionTitle}>🛠️ Trade & Business Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Trade Category:</Text>
              <Text style={styles.infoVal}>{profile?.category || 'General Service'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Experience:</Text>
              <Text style={styles.infoVal}>{profile?.experienceYears || 3} years</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Service Area:</Text>
              <Text style={styles.infoVal}>{profile?.serviceArea || profile?.address || 'Bagalkot District'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Mobile:</Text>
              <Text style={styles.infoVal}>{user?.phone || 'Not specified'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Email:</Text>
              <Text style={styles.infoVal}>{user?.email}</Text>
            </View>

            {profile?.bio ? (
              <View style={styles.bioBox}>
                <Text style={styles.bioLabel}>Service Description:</Text>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.locationRefreshBtn} onPress={handleRefreshLocation}>
              <Text style={styles.locationRefreshText}>⌖ Refresh My GPS Location for Dispatch</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* In-Screen Document Preview Modal */}
      <DocumentViewerModal
        visible={docModalOpen}
        documents={previewDocs}
        currentIndex={previewIndex}
        onClose={() => setDocModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  locIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  locIconText: {
    fontSize: 18,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  statusSub: {
    fontSize: 13,
    color: COLORS.inkMuted,
    lineHeight: 18,
  },
  locNoticeText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.emerald,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 12,
  },
  docRowList: {
    flexDirection: 'row',
    gap: 10,
  },
  docChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  docChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  docChipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  docChipEye: {
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.crimson,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  refreshText: {
    fontSize: 13,
    color: COLORS.crimson,
    fontWeight: '700',
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  reqTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reqTime: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  reqCustomerName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  reqLocation: {
    fontSize: 13,
    color: COLORS.inkMuted,
    marginBottom: 6,
  },
  reqMsgBox: {
    backgroundColor: COLORS.sand,
    padding: 10,
    borderRadius: RADIUS.md,
    marginVertical: 6,
  },
  reqMsgText: {
    fontSize: 13,
    color: COLORS.ink,
    fontStyle: 'italic',
  },
  reqDate: {
    fontSize: 12,
    color: COLORS.crimson,
    fontWeight: '600',
    marginBottom: 10,
  },
  reqActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionBtnAccept: {
    flex: 2,
  },
  actionBtnDecline: {
    flex: 1,
  },
  acceptedCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  phoneLink: {
    marginVertical: 4,
  },
  phoneLinkText: {
    fontSize: 14,
    color: COLORS.crimson,
    fontWeight: '700',
  },
  acceptedCategory: {
    fontSize: 13,
    color: COLORS.ink,
    fontWeight: '600',
    marginBottom: 12,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandTint,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.crimson,
    gap: 8,
  },
  chatActionIcon: {
    fontSize: 16,
  },
  chatActionText: {
    color: COLORS.crimson,
    fontSize: 14,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  infoKey: {
    fontSize: 13,
    color: COLORS.inkMuted,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  bioBox: {
    marginTop: 12,
    backgroundColor: COLORS.paper,
    padding: 10,
    borderRadius: RADIUS.md,
  },
  bioLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
  },
  bioText: {
    fontSize: 13,
    color: COLORS.inkMuted,
    lineHeight: 18,
  },
  locationRefreshBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.crimson,
    borderRadius: RADIUS.md,
  },
  locationRefreshText: {
    color: COLORS.crimson,
    fontWeight: '700',
    fontSize: 13,
  },
});
