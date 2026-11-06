// Service Provider Workspace Dashboard (/provider/dashboard)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import {
  MapPin,
  ShieldCheck,
  FileText,
  Eye,
  User,
  Calendar,
  Phone,
  Wrench,
  MessageSquare,
  Navigation,
  RotateCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
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
  onBack?: () => void;
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

      if (profRes.status === 'fulfilled') setProfile(profRes.value);
      if (reqRes.status === 'fulfilled') setRequests(reqRes.value);
      if (accRes.status === 'fulfilled') setAcceptedBookings(accRes.value);
      if (servRes.status === 'fulfilled') setServices(servRes.value);
    } catch (e: any) {
      if (!silent) Alert.alert('Network Sync Error', 'Could not sync provider profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRefreshLocation = async () => {
    setLocUpdating(true);
    setLocNotice('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Enable GPS location so customers nearby can find your services.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await providerApi.updateLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocNotice(`GPS location updated (${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)})`);
      setTimeout(() => setLocNotice(''), 4000);
    } catch (e: any) {
      Alert.alert('GPS Error', e.message || 'Could not fetch current device position.');
    } finally {
      setLocUpdating(false);
    }
  };

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
        id: `provider-${docType}`,
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
    <View style={styles.container}>
      <Header
        title={t('providerDashboard', 'ಸೇವಾ ಪೂರೈಕೆದಾರರ ಕಾರ್ಯಕ್ಷೇತ್ರ')}
        subtitle={profile?.displayName || user?.name || 'Professional Service'}
        onBack={onBack}
        rightAction={
          <TouchableOpacity onPress={handleRefreshLocation} style={styles.locIconBtn} disabled={locUpdating} activeOpacity={0.8}>
            {locUpdating ? (
              <ActivityIndicator size="small" color={COLORS.brand} />
            ) : (
              <MapPin size={18} color={COLORS.brand} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
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
          {locNotice ? (
            <View style={styles.locNoticeRow}>
              <CheckCircle2 size={13} color={COLORS.ok} />
              <Text style={styles.locNoticeText}>{locNotice}</Text>
            </View>
          ) : null}
        </View>

        {/* Verification Documents Row */}
        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.docHeaderRow}>
            <ShieldCheck size={18} color={COLORS.brand} />
            <Text style={styles.cardSectionTitle}>Registered Identity & Credentials</Text>
          </View>
          <View style={styles.docRowList}>
            <TouchableOpacity
              style={styles.docChip}
              onPress={() => openDocumentPreview('aadhaarDocument', 'Identity Proof (Govt ID)', false)}
              activeOpacity={0.7}
            >
              <FileText size={16} color={COLORS.brand} />
              <Text style={styles.docChipText}>Govt ID / Aadhaar</Text>
              <Eye size={14} color={COLORS.mute} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.docChip}
              onPress={() => openDocumentPreview('addressProofDocument', 'Address Proof Document', false)}
              activeOpacity={0.7}
            >
              <FileText size={16} color="#2563EB" />
              <Text style={styles.docChipText}>Address Proof</Text>
              <Eye size={14} color={COLORS.mute} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selection */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'incoming' && styles.tabBtnActive]}
            onPress={() => setActiveTab('incoming')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'incoming' && styles.tabTextActive]}>
              Incoming ({requests.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'accepted' && styles.tabBtnActive]}
            onPress={() => setActiveTab('accepted')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'accepted' && styles.tabTextActive]}>
              Active Jobs ({acceptedBookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]}
            onPress={() => setActiveTab('services')}
            activeOpacity={0.8}
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
              <TouchableOpacity onPress={() => loadData(true)} style={styles.refreshRow}>
                <RotateCw size={12} color={COLORS.brand} />
                <Text style={styles.refreshText}>Refresh</Text>
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

                  <View style={styles.infoLine}>
                    <User size={14} color={COLORS.ink} />
                    <Text style={styles.reqCustomerName}>{req.customerId?.name || 'Customer'}</Text>
                  </View>
                  <View style={styles.infoLine}>
                    <MapPin size={14} color={COLORS.brand} />
                    <Text style={styles.reqLocation}>{req.location || 'Bagalkot, Karnataka'}</Text>
                  </View>

                  {req.details || req.message ? (
                    <View style={styles.reqMsgBox}>
                      <Text style={styles.reqMsgText}>"{req.details || req.message}"</Text>
                    </View>
                  ) : null}

                  {req.scheduledDate ? (
                    <View style={styles.infoLine}>
                      <Calendar size={13} color={COLORS.mute} />
                      <Text style={styles.reqDate}>
                        Scheduled: {new Date(req.scheduledDate).toLocaleDateString()}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.reqActionRow}>
                    <Button
                      title={actionId === req._id ? 'Accepting…' : 'Accept Request'}
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

                  <View style={styles.infoLine}>
                    <User size={14} color={COLORS.ink} />
                    <Text style={styles.reqCustomerName}>{b.customerId?.name || 'Customer'}</Text>
                  </View>

                  {b.customerId?.phone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${b.customerId?.phone}`)}
                      style={styles.phoneLink}
                    >
                      <Phone size={13} color={COLORS.brand} />
                      <Text style={styles.phoneLinkText}>{b.customerId?.phone}</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.infoLine}>
                    <MapPin size={14} color={COLORS.mute} />
                    <Text style={styles.reqLocation}>{b.location || 'Bagalkot'}</Text>
                  </View>
                  <View style={styles.infoLine}>
                    <Wrench size={14} color={COLORS.mute} />
                    <Text style={styles.acceptedCategory}>{b.category || 'Service'}</Text>
                  </View>

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
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={16} color={COLORS.white} />
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
            <View style={styles.docHeaderRow}>
              <Wrench size={18} color={COLORS.brand} />
              <Text style={styles.cardSectionTitle}>Trade & Business Details</Text>
            </View>
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

            <TouchableOpacity style={styles.locationRefreshBtn} onPress={handleRefreshLocation} activeOpacity={0.8}>
              <Navigation size={14} color={COLORS.white} />
              <Text style={styles.locationRefreshText}>Refresh My GPS Location for Dispatch</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scroll: {
    padding: 16,
    paddingBottom: 60,
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
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 14,
  },
  statusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    marginTop: 2,
  },
  statusSub: {
    fontSize: 12,
    color: COLORS.mute,
    lineHeight: 18,
  },
  locNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  locNoticeText: {
    fontSize: 11,
    color: COLORS.ok,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  docRowList: {
    flexDirection: 'row',
    gap: 8,
  },
  docChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 8,
  },
  docChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.full,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  tabBtnActive: {
    backgroundColor: COLORS.brand,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.mute,
  },
  tabTextActive: {
    color: COLORS.white,
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
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 12,
  },
  reqTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reqTime: {
    fontSize: 11,
    color: COLORS.mute,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reqCustomerName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  reqLocation: {
    fontSize: 12,
    color: COLORS.mute,
  },
  reqMsgBox: {
    backgroundColor: COLORS.paper,
    borderRadius: RADIUS.md,
    padding: 10,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.brand,
  },
  reqMsgText: {
    fontSize: 12,
    color: COLORS.ink,
    fontStyle: 'italic',
  },
  reqDate: {
    fontSize: 11,
    color: COLORS.mute,
  },
  reqActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtnAccept: {
    flex: 1,
  },
  actionBtnDecline: {
    flex: 1,
  },
  acceptedCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 12,
  },
  phoneLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  phoneLinkText: {
    fontSize: 12,
    color: COLORS.brand,
    fontWeight: '700',
  },
  acceptedCategory: {
    fontSize: 12,
    color: COLORS.mute,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    marginTop: 12,
  },
  chatActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  infoKey: {
    fontSize: 12,
    color: COLORS.mute,
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
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bioText: {
    fontSize: 12,
    color: COLORS.ink,
    lineHeight: 18,
  },
  locationRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginTop: 16,
  },
  locationRefreshText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
});
