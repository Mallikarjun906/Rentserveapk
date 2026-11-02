// Driver Workspace & Live Dispatch Radar Dashboard

import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatINR } from '../../utils/formatters';
import { useLocalization } from '../../context/LocalizationContext';
import { transportApi } from '../../api/transportApi';
import { authApi } from '../../api/authApi';
import { DocumentViewerModal, DocumentItem } from '../../components/common/DocumentViewerModal';
import { CONFIG } from '../../constants/config';

interface DriverRequestItem {
  id: string;
  from: string;
  to: string;
  km: string;
  fare: number;
  isBargained: boolean;
  eta: string;
}

interface DriverDashboardScreenProps {
  onBack: () => void;
  onNavigateOnboarding: () => void;
}

export const DriverDashboardScreen: React.FC<DriverDashboardScreenProps> = ({
  onBack,
  onNavigateOnboarding,
}) => {
  const { t } = useLocalization();

  const [isOnline, setIsOnline] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<
    'Approved' | 'Pending verification' | 'Rejected'
  >('Approved');

  const [incomingRequests, setIncomingRequests] = useState<DriverRequestItem[]>([
    {
      id: 'req-1',
      from: 'Navanagar Main Road, Sector 10',
      to: 'Bagalkot Bus Stand',
      km: '4.2 km',
      fare: 95,
      isBargained: true,
      eta: '3 min away',
    },
    {
      id: 'req-2',
      from: 'Vidyagiri Near BVVS',
      to: 'District Hospital',
      km: '2.6 km',
      fare: 60,
      isBargained: false,
      eta: '5 min away',
    },
  ]);

  const [activeTrip, setActiveTrip] = useState<DriverRequestItem | null>(null);

  // In-Screen Document Previewer State
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [previewDocs, setPreviewDocs] = useState<DocumentItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  React.useEffect(() => {
    let active = true;

    // Load available backend ride requests & check verification status
    Promise.allSettled([
      transportApi.getAvailableRequests(),
      transportApi.getAssignedTrip(),
      authApi.getMe(),
    ]).then(([availRes, assignedRes, meRes]) => {
      if (!active) return;
      if (availRes.status === 'fulfilled' && Array.isArray(availRes.value) && availRes.value.length > 0) {
        setIncomingRequests(
          availRes.value.map((b: any, idx: number) => ({
            id: b._id || b.id || `req-${idx}`,
            from: b.pickup || 'Navanagar, Bagalkot',
            to: b.destination || 'District Hospital',
            km: '3.2 km',
            fare: b.fare || 60,
            isBargained: false,
            eta: '4 min away',
          }))
        );
      }
      if (assignedRes.status === 'fulfilled' && assignedRes.value) {
        const trip = assignedRes.value as any;
        setActiveTrip({
          id: trip._id || trip.id,
          from: trip.pickup || 'Pickup',
          to: trip.destination || 'Destination',
          km: '4 km',
          fare: trip.fare || 90,
          isBargained: false,
          eta: 'On Trip',
        });
      }
      if (meRes.status === 'fulfilled' && meRes.value) {
        const u = meRes.value;
        if (u.approvalStatus === 'approved') setApprovalStatus('Approved');
        else if (u.approvalStatus === 'rejected') setApprovalStatus('Rejected');
        else setApprovalStatus('Pending verification');
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const openDriverDocument = (docType: string, title: string, isPdf: boolean = false) => {
    const list: DocumentItem[] = [
      {
        id: `driver-${docType}`,
        docType,
        title,
        url: `${CONFIG.API_BASE_URL}/documents/mine/${docType}`,
        isPdf,
        format: isPdf ? 'pdf' : 'jpg',
      },
    ];
    setPreviewDocs(list);
    setPreviewIndex(0);
    setDocViewerOpen(true);
  };

  const handleAccept = (req: DriverRequestItem) => {
    setIncomingRequests((prev) => prev.filter((x) => x.id !== req.id));
    setActiveTrip(req);
  };

  const handleReject = (reqId: string) => {
    setIncomingRequests((prev) => prev.filter((x) => x.id !== reqId));
  };

  const handleFinishTrip = () => {
    setActiveTrip(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title={t('driverDashboard', 'ಚಾಲಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')}
        subtitle="KA 29 B 4821 · Bajaj RE Auto"
        onBack={onBack}
        rightAction={
          <View style={styles.onlineToggleRow}>
            <Text
              style={[
                styles.onlineLabel,
                isOnline ? styles.textOk : styles.textMute,
              ]}
            >
              {isOnline ? t('goOnline', 'ಆನ್‌ಲೈನ್') : t('goOffline', 'ಆಫ್‌ಲೈನ್')}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: '#D1D5DB', true: COLORS.okTint }}
              thumbColor={isOnline ? COLORS.ok : '#9CA3AF'}
            />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Verification Alert Banner */}
        {approvalStatus === 'Approved' ? (
          <View style={[styles.alertBanner, styles.alertApproved]}>
            <Text style={styles.alertEmoji}>✓</Text>
            <Text style={styles.alertText}>
              All documents approved. Live 5 km GPS dispatch active.
            </Text>
          </View>
        ) : (
          <View style={[styles.alertBanner, styles.alertPending]}>
            <Text style={styles.alertEmoji}>⏳</Text>
            <Text style={styles.alertText}>
              Verification in progress. Tap to review documents.
            </Text>
            <TouchableOpacity onPress={onNavigateOnboarding}>
              <Text style={styles.alertLink}>Review →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Daily Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, SHADOWS.card]}>
            <Text style={styles.statLabel}>{t('todayEarnings', 'ಇಂದಿನ ಗಳಿಕೆ')}</Text>
            <Text style={styles.statNumber}>₹742</Text>
            <Text style={styles.statNote}>Direct cash collected</Text>
          </View>
          <View style={[styles.statCard, SHADOWS.card]}>
            <Text style={styles.statLabel}>{t('todayRides', 'ಇಂದಿನ ಸವಾರಿ')}</Text>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statNote}>92% Acceptance rate</Text>
          </View>
        </View>

        {/* Driver Verification Documents Card */}
        <View style={[styles.docSectionCard, SHADOWS.card]}>
          <Text style={styles.docSectionHeading}>
            🪪 {t('Driver Documents & Credentials', 'ಚಾಲಕರ ಪರವಾನಗಿ ಮತ್ತು ದಾಖಲೆಗಳು')}
          </Text>
          <Text style={styles.docSectionSub}>
            Private authenticated documents verified by NUK desk. Tap to view inside screen:
          </Text>

          <View style={styles.docGrid}>
            <TouchableOpacity
              style={[styles.docCard, styles.docCardPdf]}
              onPress={() =>
                openDriverDocument(
                  'drivingLicenceDocument',
                  'Driving Licence (DL) - Verified Multi-Page PDF',
                  true
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.docCardIcon}>📄</Text>
              <View style={styles.docCardInfo}>
                <Text style={styles.docCardTitle}>Driving Licence (DL)</Text>
                <Text style={styles.docCardSub}>Multi-page commercial licence PDF</Text>
              </View>
              <Text style={styles.docPreviewPill}>👁️ Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.docCard}
              onPress={() =>
                openDriverDocument(
                  'vehicleRcDocument',
                  'Vehicle Registration Certificate (RC)',
                  false
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.docCardIcon}>🖼️</Text>
              <View style={styles.docCardInfo}>
                <Text style={styles.docCardTitle}>Vehicle RC Document</Text>
                <Text style={styles.docCardSub}>KA 29 B 4821 registration paper</Text>
              </View>
              <Text style={styles.docPreviewPill}>👁️ Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Trip Banner if in progress */}
        {activeTrip ? (
          <View style={[styles.activeTripCard, SHADOWS.pop]}>
            <View style={styles.activeTop}>
              <Badge tone="ok" dot label="Live Navigation Active" />
              <Text style={styles.fareHighlight}>{formatINR(activeTrip.fare)}</Text>
            </View>

            <Text style={styles.tripRoute}>
              {activeTrip.from} → <Text style={styles.bold}>{activeTrip.to}</Text>
            </Text>
            <Text style={styles.cashNotice}>
              💵 Collect {formatINR(activeTrip.fare)} directly from customer
            </Text>

            <Button
              title="✓ Complete Ride & Collect Cash"
              onPress={handleFinishTrip}
              variant="yellow"
              size="lg"
              fullWidth
              style={styles.completeBtn}
            />
          </View>
        ) : null}

        {/* Incoming Dispatch Queue */}
        <Text style={styles.queueHeader}>
          {t('Incoming Ride Requests', 'ಹೊಸ ಸವಾರಿ ವಿನಂತಿಗಳು')} (
          {incomingRequests.length})
        </Text>

        {!isOnline ? (
          <View style={[styles.card, styles.centerCard]}>
            <Text style={styles.offlineIcon}>💤</Text>
            <Text style={styles.offlineTitle}>You are currently offline</Text>
            <Text style={styles.offlineSub}>
              Toggle to Online to receive nearby passenger requests in Bagalkot.
            </Text>
          </View>
        ) : incomingRequests.length === 0 ? (
          <View style={[styles.card, styles.centerCard]}>
            <Text style={styles.offlineIcon}>📡</Text>
            <Text style={styles.offlineTitle}>No ride requests right now</Text>
            <Text style={styles.offlineSub}>
              Stay online. Incoming rides within 5 km will show here automatically.
            </Text>
          </View>
        ) : (
          incomingRequests.map((req) => (
            <View key={req.id} style={[styles.requestCard, SHADOWS.card]}>
              <View style={styles.reqTop}>
                <Badge
                  tone={req.isBargained ? 'sun' : 'info'}
                  label={req.isBargained ? 'Customer Offered Fare' : 'Standard Fare'}
                />
                <Text style={styles.etaText}>{req.eta}</Text>
              </View>

              <Text style={styles.fromText}>🔵 {req.from}</Text>
              <Text style={styles.toText}>📍 {req.to}</Text>

              <View style={styles.reqFooter}>
                <View>
                  <Text style={styles.fareLabel}>{req.km} · Cash/UPI</Text>
                  <Text style={styles.fareText}>{formatINR(req.fare)}</Text>
                </View>

                <View style={styles.actionButtons}>
                  <Button
                    title="Reject"
                    onPress={() => handleReject(req.id)}
                    variant="outline"
                    size="sm"
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Accept"
                    onPress={() => handleAccept(req)}
                    variant="primary"
                    size="sm"
                    style={styles.actionBtn}
                  />
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Driver In-Screen Document Viewer Modal */}
      <DocumentViewerModal
        visible={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        documents={previewDocs}
        currentIndex={previewIndex}
        onSelectIndex={setPreviewIndex}
        canReview={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  docSectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 16,
  },
  docSectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  docSectionSub: {
    fontSize: 12,
    color: COLORS.mute,
    lineHeight: 16,
    marginBottom: 12,
  },
  docGrid: {
    gap: 8,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  docCardPdf: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  docCardIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  docCardInfo: {
    flex: 1,
  },
  docCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  docCardSub: {
    fontSize: 11,
    color: COLORS.mute,
    marginTop: 2,
  },
  docPreviewPill: {
    backgroundColor: COLORS.brand,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  onlineToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6,
  },
  textOk: {
    color: COLORS.ok,
  },
  textMute: {
    color: COLORS.mute,
  },
  scroll: {
    padding: 16,
    paddingBottom: 60,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 16,
  },
  alertApproved: {
    backgroundColor: COLORS.okTint,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  alertPending: {
    backgroundColor: COLORS.warnTint,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
    flex: 1,
  },
  alertLink: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brand,
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mute,
    textTransform: 'uppercase',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.ink,
    marginVertical: 4,
  },
  statNote: {
    fontSize: 11,
    color: COLORS.ok,
    fontWeight: '600',
  },
  activeTripCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.ok,
    marginBottom: 20,
  },
  activeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fareHighlight: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.brand,
  },
  tripRoute: {
    fontSize: 14,
    color: COLORS.ink,
    marginBottom: 6,
  },
  bold: {
    fontWeight: '800',
  },
  cashNotice: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ok,
    marginBottom: 12,
  },
  completeBtn: {
    marginTop: 4,
  },
  queueHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  offlineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  offlineSub: {
    fontSize: 13,
    color: COLORS.mute,
    textAlign: 'center',
    lineHeight: 18,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    marginBottom: 12,
  },
  reqTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.brand,
  },
  fromText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: 6,
  },
  toText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 12,
  },
  reqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 10,
  },
  fareLabel: {
    fontSize: 11,
    color: COLORS.mute,
  },
  fareText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.brand,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    minWidth: 80,
  },
});
